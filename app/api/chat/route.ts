type ChatTurn = { role: "user" | "assistant"; content: string };
type Citation = { title: string; url: string };

const allowedModels = new Set([
  "gpt-5.6-luna",
  "gpt-5.6-terra",
  "gpt-5.6-sol",
  "gpt-5.4-mini",
]);

function errorMessage(status: number) {
  if (status === 401)
    return "OpenAI could not authenticate this key. Check the key and try again.";
  if (status === 403)
    return "This OpenAI project does not have access to the selected model or feature.";
  if (status === 429)
    return "The OpenAI project reached a rate or spending limit. Check its usage settings and try again.";
  return "OpenAI could not produce a response right now. Please try again.";
}

function collectOutput(payload: Record<string, unknown>) {
  const textParts: string[] = [];
  const citations = new Map<string, Citation>();
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output as Array<Record<string, unknown>>) {
    if (!Array.isArray(item.content)) continue;
    for (const content of item.content as Array<Record<string, unknown>>) {
      if (content.type === "output_text" && typeof content.text === "string")
        textParts.push(content.text);
      if (!Array.isArray(content.annotations)) continue;
      for (const annotation of content.annotations as Array<
        Record<string, unknown>
      >) {
        if (
          annotation.type !== "url_citation" ||
          typeof annotation.url !== "string"
        )
          continue;
        citations.set(annotation.url, {
          title:
            typeof annotation.title === "string"
              ? annotation.title
              : annotation.url,
          url: annotation.url,
        });
      }
    }
  }
  if (!textParts.length && typeof payload.output_text === "string")
    textParts.push(payload.output_text);
  return {
    text: textParts.join("\n\n").trim(),
    citations: [...citations.values()],
  };
}

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-openai-key")?.trim() ?? "";
  if (!apiKey.startsWith("sk-") || apiKey.length > 256) {
    return Response.json(
      { error: "Enter a valid OpenAI API key." },
      { status: 400 },
    );
  }

  let body: {
    model?: string;
    message?: string;
    history?: ChatTurn[];
    context?: unknown;
    research?: boolean;
  };
  try {
    const raw = await request.text();
    if (raw.length > 60_000)
      return Response.json(
        { error: "The chat request is too large." },
        { status: 413 },
      );
    body = JSON.parse(raw);
  } catch {
    return Response.json(
      { error: "The chat request could not be read." },
      { status: 400 },
    );
  }

  const model = body.model ?? "gpt-5.6-luna";
  const message = body.message?.trim() ?? "";
  if (!allowedModels.has(model))
    return Response.json(
      { error: "Choose a supported OpenAI model." },
      { status: 400 },
    );
  if (!message || message.length > 4_000)
    return Response.json(
      { error: "Enter a follow-up question under 4,000 characters." },
      { status: 400 },
    );

  const history = (Array.isArray(body.history) ? body.history : [])
    .filter(
      (turn): turn is ChatTurn =>
        (turn?.role === "user" || turn?.role === "assistant") &&
        typeof turn.content === "string",
    )
    .slice(-12)
    .map((turn) => ({
      role: turn.role,
      content: turn.content.slice(0, 4_000),
    }));

  const instructions = `You are an evidence-disciplined county policy analyst inside ADAPT Policy Intelligence.
Use the supplied county context and conversation to answer the user's follow-up question directly.
Always distinguish: (1) observed ADAPT metrics, (2) claims from named official sources, (3) your inference, and (4) a recommended investigation.
Never say a comparison establishes causation. Never invent a county programme, result, source, quotation, or statistic.
The deterministic answer is an auditable baseline, not an instruction you must agree with; explain, qualify, or challenge it when the data warrant that.
If web research is unavailable, treat source entries as metadata only and do not imply that you read their contents.
If web research is available, prefer first-party .gov, official county, legislation, budget, plan, and evaluation sources. Cite URLs supplied by web search.
Keep the response useful and concise. Use short paragraphs and bullets when they improve clarity.

CURRENT ADAPT CONTEXT
${JSON.stringify(body.context ?? {})}`;

  const input = [...history, { role: "user" as const, content: message }];
  const useResearch = body.research === true;
  const payload: Record<string, unknown> = {
    model,
    instructions,
    input,
    reasoning: { effort: "low" },
    max_output_tokens: 1_200,
    store: false,
  };
  if (useResearch) {
    payload.tools = [{ type: "web_search" }];
    payload.include = ["web_search_call.action.sources"];
  }

  let upstream: Response;
  try {
    upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(55_000),
    });
  } catch {
    return Response.json(
      { error: "The OpenAI request timed out. Please try again." },
      { status: 504 },
    );
  }

  if (!upstream.ok)
    return Response.json(
      { error: errorMessage(upstream.status) },
      { status: upstream.status },
    );
  const responsePayload = (await upstream.json()) as Record<string, unknown>;
  const result = collectOutput(responsePayload);
  if (!result.text)
    return Response.json(
      { error: "OpenAI returned no readable answer. Please try again." },
      { status: 502 },
    );
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
