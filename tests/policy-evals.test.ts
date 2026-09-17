import { afterEach, describe, expect, it, vi } from "vitest";
import cases from "../evals/policy-maker-cases.json";
import { GET as modelsRoute } from "../app/api/openrouter/models/route";
import { normalizeOpenRouterModels } from "../lib/openrouter-models";
import { POST as createThread, DELETE as deleteThread } from "../app/api/investigations/route";
import { POST as sendMessage } from "../app/api/investigations/[id]/messages/route";
import { POST as addSource, DELETE as deleteSource } from "../app/api/sources/route";
import { retrieve } from "../lib/evidence";
import { profile } from "../lib/analyst";

const base = "https://adapt.test";
const headers = {
  "oai-authenticated-user-id": "eval-owner",
  "oai-authenticated-user-email": "admin@example.com",
};
function jsonRequest(path: string, data: unknown, extra: Record<string, string> = {}, method = "POST") {
  return new Request(base + path, {
    method,
    headers: { ...headers, "Content-Type": "application/json", ...extra },
    body: JSON.stringify(data),
  });
}
async function thread(title: string) {
  const response = await createThread(jsonRequest("/api/investigations", { title, counties: [39149, 39011] }));
  return (await response.json()) as { id: string };
}
afterEach(() => vi.unstubAllGlobals());

describe("OpenRouter model discovery", () => {
  it("normalizes the complete text catalog and keeps unsupported models visible", () => {
    const models = normalizeOpenRouterModels({
      data: [
        { id: "~vendor/new-alias", name: "New alias", supported_parameters: ["tools"], architecture: { output_modalities: ["text"] } },
        { id: "vendor/text-only", name: "Text only", supported_parameters: [], architecture: { output_modalities: ["text"] } },
        { id: "vendor/image", name: "Image", supported_parameters: ["tools"], architecture: { output_modalities: ["image"] } },
      ],
    });
    expect(models.map((model) => model.id)).toEqual(["~vendor/new-alias", "vendor/text-only"]);
    expect(models.map((model) => model.toolCapable)).toEqual([true, false]);
  });

  it("loads the catalog through the signed-in server route and forwards only the OpenRouter credential", async () => {
    const upstream = vi.fn(async (_url: string, options: RequestInit) => {
      expect((options.headers as Record<string, string>).Authorization).toBe("Bearer sk-or-eval-fixture");
      return Response.json({ data: [
        { id: "openai/gpt-example", name: "Example", supported_parameters: ["tools"], architecture: { output_modalities: ["text"] } },
        { id: "vendor/basic", name: "Basic", supported_parameters: [], architecture: { output_modalities: ["text"] } },
      ] });
    });
    vi.stubGlobal("fetch", upstream);
    const response = await modelsRoute(new Request(base + "/api/openrouter/models", { headers: { ...headers, "x-openrouter-key": "sk-or-eval-fixture", "x-openai-key": "sk-must-not-leak" } }));
    expect(response.status).toBe(200);
    const data = await response.json() as { total: number; toolCapable: number };
    expect(data).toMatchObject({ total: 2, toolCapable: 1 });
    expect(JSON.stringify(upstream.mock.calls)).not.toContain("sk-must-not-leak");
  });
});

describe("policymaker investigation evaluation", () => {
  it("keeps dashboard headline metrics distinct from the historical source series", async () => {
    const shelby = await profile(39149, base);
    const auglaize = await profile(39011, base);
    if ("error" in shelby || "error" in auglaize)
      throw new Error("Expected both evaluation counties to be available");
    expect(shelby.headline2022.star_median2022.value).toBeCloseTo(49704.2212);
    expect(auglaize.headline2022.star_median2022.value).toBeCloseTo(50967.7255);
    expect(shelby.history.at(-1)?.wage).toBeCloseTo(25103.142);
    expect(shelby.measurementRules.history).toContain("must not be substituted");
  });

  it("covers the required decision and future-scenario prompt families", () => {
    expect(cases).toHaveLength(8);
    expect(new Set(cases.map((item) => item.id)).size).toBe(8);
    expect(cases.every((item) => item.prompt.length > 80 && item.checks.length >= 4)).toBe(true);
    expect(cases.filter((item) => /2027|2029|2030|future|scenario/i.test(item.prompt)).length).toBeGreaterThanOrEqual(4);
    expect(cases.some((item) => /exact number/i.test(item.prompt))).toBe(true);
  });

  it("changes the answer context only after an uploaded source is indexed and preserves provenance", async () => {
    const question = "According to indexed Riverstone evidence, what were retention and childcare attendance results, and how strong is the causal claim?";
    let sourceId = "";
    let stage: "before" | "after" = "before";
    const calls: Record<string, unknown>[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, options: RequestInit) => {
      const payload = JSON.parse(String(options.body));
      calls.push(payload);
      if (stage === "before") {
        expect(JSON.stringify(payload)).not.toContain("RIVERSTONE-27");
        return Response.json({ choices: [{ message: { role: "assistant", content: "No Riverstone evaluation is indexed, so I cannot report its figures. The available ADAPT comparison does not establish causality. [ADAPT]" } }] });
      }
      expect(JSON.stringify(payload)).toContain("RIVERSTONE-27");
      return Response.json({ choices: [{ message: { role: "assistant", content: `The synthetic fixture reports 137 participants, 72% retention and an 18-percentage-point attendance difference. It is non-randomized and does not establish causality. [${sourceId}-0]` } }] });
    }));

    const beforeThread = await thread("Evidence eval before");
    const before = await sendMessage(jsonRequest("/message", { provider: "openrouter", model: "openai/gpt-example", message: question, counties: [39149, 39011] }, { "x-openrouter-key": "sk-or-eval-fixture" }), { params: Promise.resolve({ id: beforeThread.id }) });
    expect(before.status).toBe(200);
    expect(await before.text()).not.toContain("RIVERSTONE-27");

    const form = new FormData();
    form.set("file", new File(["Synthetic evaluation fixture. The fictional Riverstone pilot enrolled 137 participants. Fictional six-month retention was 72 percent. Evening childcare participants attended 18 percentage points more sessions. This was not randomized and cannot establish causality. Marker RIVERSTONE-27."], "riverstone.md"));
    form.set("title", "Synthetic Riverstone evaluation fixture");
    form.set("scope", "Shelby County, OH · evaluation test");
    const added = await addSource(new Request(base + "/api/sources", { method: "POST", headers, body: form }));
    expect(added.status).toBe(201);
    sourceId = ((await added.json()) as { id: string }).id;
    stage = "after";

    const afterThread = await thread("Evidence eval after");
    const after = await sendMessage(jsonRequest("/message", { provider: "openrouter", model: "openai/gpt-example", message: question, counties: [39149, 39011] }, { "x-openrouter-key": "sk-or-eval-fixture" }), { params: Promise.resolve({ id: afterThread.id }) });
    expect(after.status).toBe(200);
    const result = await after.json() as { assistant: { content: string; citations: { id: string; title: string }[] } };
    expect(result.assistant.content).toContain("137");
    expect(result.assistant.content).toContain("does not establish causality");
    expect(result.assistant.citations.some((citation) => citation.id === sourceId + "-0" && citation.title.includes("Riverstone"))).toBe(true);
    expect(calls).toHaveLength(2);

    await deleteSource(jsonRequest("/api/sources", { id: sourceId }, {}, "DELETE"));
    expect((await retrieve('RIVERSTONE-27 retention childcare')).some(item=>item.sourceId===sourceId)).toBe(false);
    stage = 'before';
    const removedThread = await thread('Evidence eval after removal');
    const removed = await sendMessage(jsonRequest('/message', { provider:'openrouter', model:'openai/gpt-example', message:question, counties:[39149,39011] }, {'x-openrouter-key':'sk-or-eval-fixture'}), {params:Promise.resolve({id:removedThread.id})});
    expect(removed.status).toBe(200);
    const removedAnswer=await removed.json() as {assistant:{content:string;citations:{id:string}[]}};
    expect(removedAnswer.assistant.content).not.toContain('137');
    expect(removedAnswer.assistant.citations.some(c=>c.id.startsWith(sourceId))).toBe(false);
    await deleteThread(jsonRequest('/api/investigations',{id:removedThread.id},{},'DELETE'));
    await deleteThread(jsonRequest("/api/investigations", { id: beforeThread.id }, {}, "DELETE"));
    await deleteThread(jsonRequest("/api/investigations", { id: afterThread.id }, {}, "DELETE"));
  });

  it("makes newly indexed website content available to the next investigation", async () => {
    const marker = "CEW-EVAL-2026-MARKER";
    expect((await retrieve(marker)).length).toBe(0);
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ success: true, data: { markdown: `Official-site evaluation fixture ${marker}. Quarterly employment and wage records should be treated as observed administrative data, not a 2030 forecast.`, metadata: { title: "QCEW evaluation page", statusCode: 200 } } })));
    const added = await addSource(jsonRequest("/api/sources", { url: "https://www.bls.gov/cew/data-overview.htm", title: "QCEW evaluation page", scope: "County employment and wages · evaluation test" }, { "x-firecrawl-key": "fc-eval-fixture" }));
    expect(added.status).toBe(201);
    const source = await added.json() as { id: string };
    expect((await retrieve(marker)).some((item) => item.sourceId === source.id)).toBe(true);

    vi.stubGlobal("fetch", vi.fn(async (_url: string, options: RequestInit) => {
      expect(String(options.body)).toContain(marker);
      return Response.json({ choices: [{ message: { role: "assistant", content: `The indexed QCEW page adds observed employment and wage context but is not a forecast. [${source.id}-0]` } }] });
    }));
    const investigation = await thread("Website evidence eval");
    const response = await sendMessage(jsonRequest("/message", { provider: "openrouter", model: "openai/gpt-example", message: `What does ${marker} add to a 2030 workforce scenario?`, counties: [39149, 39011] }, { "x-openrouter-key": "sk-or-eval-fixture" }), { params: Promise.resolve({ id: investigation.id }) });
    expect(response.status).toBe(200);
    expect((await response.text())).toContain(source.id + "-0");
    await deleteSource(jsonRequest("/api/sources", { id: source.id }, {}, "DELETE"));
    expect((await retrieve(marker)).some(item=>item.sourceId===source.id)).toBe(false);
    await deleteThread(jsonRequest("/api/investigations", { id: investigation.id }, {}, "DELETE"));
  });
});
