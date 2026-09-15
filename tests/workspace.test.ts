import { describe, it, expect, vi, afterEach } from "vitest";
import {
  POST as addSource,
  GET as listSources,
  DELETE as removeSource,
} from "../app/api/sources/route";
import {
  POST as createThread,
  DELETE as removeThread,
} from "../app/api/investigations/route";
import { GET as readThread } from "../app/api/investigations/[id]/route";
import { POST as sendMessage } from "../app/api/investigations/[id]/messages/route";
import { chunkText, publicUrl, retrieve, extract } from "../lib/evidence";
import { objects,env } from "./runtime";
import {reserveTestingRequest,testingAvailable} from '../lib/server';
const base = "https://adapt.test";
const headers = {
  "oai-authenticated-user-id": "owner",
  "oai-authenticated-user-email": "admin@example.com",
};
function request(
  path: string,
  data?: unknown,
  extra: Record<string, string> = {},
  method = "POST",
) {
  return new Request(base + path, {
    method,
    headers: { ...headers, "Content-Type": "application/json", ...extra },
    ...(method === "GET" ? {} : { body: JSON.stringify(data || {}) }),
  });
}
afterEach(() => {vi.unstubAllGlobals();env.OPENAI_API_KEY='';env.TESTER_EMAILS='';});
describe('built-in testing connection',()=>{
 it('exposes access only to allowed testers and enforces the daily budget atomically',async()=>{env.OPENAI_API_KEY='sk-fixture-not-a-real-key';env.TESTER_EMAILS='admin@example.com';expect(testingAvailable({email:'viewer@example.com'})).toBe(false);expect(testingAvailable({email:'admin@example.com'})).toBe(true);const tester={id:'budget-test',email:'admin@example.com'};const results=await Promise.allSettled(Array.from({length:23},()=>reserveTestingRequest(tester)));expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(20);expect(results.filter(r=>r.status==='rejected')).toHaveLength(3);});
 it('uses a server-side key and the fixed testing model without returning the secret',async()=>{env.OPENAI_API_KEY='sk-fixture-not-a-real-key';env.TESTER_EMAILS='admin@example.com';const requests:Record<string,unknown>[]=[];vi.stubGlobal('fetch',vi.fn(async(_url:string,options:RequestInit)=>{requests.push(JSON.parse(String(options.body)));return Response.json({output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'Historical data cannot establish causation. [ADAPT]'}]}]})}) as typeof fetch);const created=await createThread(request('/api/investigations',{title:'Built-in test',counties:[39149]}));const thread=await created.json() as {id:string};const result=await sendMessage(request('/messages',{message:'What is the evidence?',counties:[39149],model:'expensive-custom-model'}),{params:Promise.resolve({id:thread.id})});expect(result.status).toBe(200);expect(requests[0].model).toBe('gpt-4.1-mini');expect(await result.text()).not.toContain('sk-fixture');await removeThread(request('/api/investigations',{id:thread.id},{},'DELETE'));});
});
describe("workspace security and persistence", () => {
  it("requires identity and rejects cross-origin writes", async () => {
    expect((await listSources(new Request(base + "/api/sources"))).status).toBe(
      401,
    );
    expect(
      (
        await createThread(
          request("/api/investigations", {}, { origin: "https://evil.test" }),
        )
      ).status,
    ).toBe(403);
  });
  it("rejects non-admin source changes", async () => {
    expect(
      (
        await addSource(
          request(
            "/api/sources",
            { url: "https://example.com" },
            { "oai-authenticated-user-email": "viewer@example.com" },
          ),
        )
      ).status,
    ).toBe(403);
  });
  it("uploads, indexes, retrieves, inspects and removes actual text", async () => {
    const form = new FormData();
    form.set(
      "file",
      new File(
        [
          "Shelby workforce retraining evaluation: 120 participants enrolled. This is a synthetic test fixture, not research evidence.",
        ],
        "test.txt",
      ),
    );
    form.set("scope", "Shelby County, OH");
    const r = await addSource(
      new Request(base + "/api/sources", {
        method: "POST",
        headers,
        body: form,
      }),
    );
    expect(r.status).toBe(201);
    const s = (await r.json()) as { id: string; chunks: number };
    expect(s.chunks).toBe(1);
    expect(objects.has("sources/" + s.id)).toBe(true);
    expect(
      (await retrieve("Shelby retraining")).some((c) => c.sourceId === s.id),
    ).toBe(true);
    const preview = await listSources(
      request("/api/sources?id=" + s.id, undefined, {}, "GET"),
    );
    expect(preview.status).toBe(200);
    expect(
      (await removeSource(request("/api/sources", { id: s.id }, {}, "DELETE")))
        .status,
    ).toBe(200);
    expect(objects.has("sources/" + s.id)).toBe(false);
    expect(
      (await retrieve("Shelby retraining")).some((c) => c.sourceId === s.id),
    ).toBe(false);
  });
  it("isolates saved investigations between users and handles missing keys", async () => {
    const response = await createThread(
      request("/api/investigations", {
        title: "Test",
        counties: [39149, 39011],
      }),
    );
    const thread = (await response.json()) as { id: string };
    const context = { params: Promise.resolve({ id: thread.id }) };
    expect(
      (
        await readThread(
          request(
            "/api/investigations/" + thread.id,
            undefined,
            { "oai-authenticated-user-id": "other" },
            "GET",
          ),
          context,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await sendMessage(
          request("/messages", {
            message: "What about jobs?",
            counties: [39149],
          }),
          context,
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await removeThread(
          request("/api/investigations", { id: thread.id }, {}, "DELETE"),
        )
      ).status,
    ).toBe(200);
  });
  it("completes a tool-driven answer, persists turns, follows changed counties and reports provider failure", async () => {
    const created = await createThread(
      request("/api/investigations", {
        title: "Analysis",
        counties: [39149, 39011],
      }),
    );
    const thread = (await created.json()) as { id: string };
    const context = { params: Promise.resolve({ id: thread.id }) };
    const calls: Record<string, unknown>[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, options: RequestInit) => {
        const payload = JSON.parse(String(options.body));
        calls.push(payload);
        if (calls.length === 1)
          return Response.json({
            output: [
              {
                type: "function_call",
                name: "get_county_profile",
                arguments: '{"fips":39011}',
                call_id: "test-profile",
                id: "call-1",
              },
            ],
          });
        return Response.json({
          output: [
            {
              type: "message",
              role: "assistant",
              content: [
                {
                  type: "output_text",
                  text: "The historical ADAPT figures differ. That does not establish a policy effect. [ADAPT]",
                },
              ],
            },
          ],
        });
      }) as typeof fetch,
    );
    const result = await sendMessage(
      request(
        "/messages",
        {
          message: "Why did retraining differ?",
          counties: [39149, 39011],
          model: "gpt-4.1-mini",
        },
        { "x-openai-key": "sk-test-fixture" },
      ),
      context,
    );
    expect(result.status).toBe(200);
    expect(calls.length).toBe(2);
    expect(JSON.stringify(calls[1].input)).toContain("function_call_output");
    let saved = (await (
      await readThread(request("/read", undefined, {}, "GET"), context)
    ).json()) as { messages: unknown[]; counties: number[] };
    expect(saved.messages).toHaveLength(2);
    const follow = await sendMessage(
      request(
        "/messages",
        {
          message: "And what about Pittsburgh?",
          counties: [42003],
          model: "gpt-4.1-mini",
        },
        { "x-openai-key": "sk-test-fixture" },
      ),
      context,
    );
    expect(follow.status).toBe(200);
    expect(JSON.stringify(calls.at(-1)?.input)).toContain(
      "Why did retraining differ?",
    );
    expect(String(calls.at(-1)?.instructions)).toContain("Allegheny");
    saved = (await (
      await readThread(request("/read", undefined, {}, "GET"), context)
    ).json()) as typeof saved;
    expect(saved.counties).toEqual([42003]);
    expect(saved.messages).toHaveLength(4);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "rejected" }, { status: 401 })),
    );
    expect(
      (
        await sendMessage(
          request(
            "/messages",
            { message: "Retry test", counties: [39149] },
            { "x-openai-key": "sk-test-fixture" },
          ),
          context,
        )
      ).status,
    ).toBe(401);
    saved = (await (
      await readThread(request("/read", undefined, {}, "GET"), context)
    ).json()) as typeof saved;
    expect(saved.messages).toHaveLength(4);
    expect(
      (
        await removeThread(
          request("/api/investigations", { id: thread.id }, {}, "DELETE"),
        )
      ).status,
    ).toBe(200);
  });
});
describe("evidence parsing and validation", () => {
  it("rejects private URLs and empty/oversize text", () => {
    for (const url of [
      "http://example.com",
      "https://localhost",
      "https://127.0.0.1",
      "https://user:pass@example.com",
      "https://example.com:8080",
      "https://foo.internal",
      "https://[::1]",
    ])
      expect(() => publicUrl(url)).toThrow();
    expect(publicUrl("https://www.bls.gov/cew/data.htm#test")).toBe(
      "https://www.bls.gov/cew/data.htm",
    );
    expect(() => chunkText("")).toThrow();
    expect(() => chunkText("a".repeat(300001))).toThrow();
  });
  it("reports missing website indexing key without claiming indexing succeeded", async () => {
    const r = await addSource(
      request("/api/sources", { url: "https://www.bls.gov/cew/data.htm" }),
    );
    expect(r.status).toBe(400);
  });
  it("extracts real XLSX and rejects unsupported files", async () => {
    const { default: ExcelJS } = await import("exceljs");
    const book = new ExcelJS.Workbook();
    book.addWorksheet("Workforce").addRows([
      ["County", "Participants"],
      ["Shelby", 120],
    ]);
    const buffer = await book.xlsx.writeBuffer();
    const content = await extract(
      new File([buffer as ArrayBuffer], "workforce.xlsx"),
    );
    expect(content).toContain("Shelby");
    expect(content).toContain("120");
    await expect(
      extract(new File(["unsupported data"], "binary.exe")),
    ).rejects.toThrow();
  });
  it("indexes a successful website response and handles upstream failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          success: true,
          data: {
            markdown:
              "Synthetic website evidence about workforce retraining. This content exists only for the test.",
            metadata: { title: "Test evidence", statusCode: 200 },
          },
        }),
      ),
    );
    const r = await addSource(
      request(
        "/api/sources",
        { url: "https://example.com" },
        { "x-firecrawl-key": "fc-test-fixture" },
      ),
    );
    expect(r.status).toBe(201);
    const s = (await r.json()) as { id: string };
    await removeSource(request("/api/sources", { id: s.id }, {}, "DELETE"));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 429 })),
    );
    expect(
      (
        await addSource(
          request(
            "/api/sources",
            { url: "https://example.com" },
            { "x-firecrawl-key": "fc-test-fixture" },
          ),
        )
      ).status,
    ).toBe(502);
  });
});
