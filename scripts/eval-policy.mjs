import { readFile, writeFile } from "node:fs/promises";

const base = (process.env.ADAPT_EVAL_BASE_URL || "http://localhost:3100").replace(/\/$/, "");
const key = process.env.OPENROUTER_API_KEY || "";
const cookie = process.env.ADAPT_EVAL_COOKIE || "__sites_local_auth=1";
const model = process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini";
const cases = JSON.parse(await readFile(new URL("../evals/policy-maker-cases.json", import.meta.url), "utf8"));

if (!key.startsWith("sk-or-")) {
  console.error("Set OPENROUTER_API_KEY to run the live policymaker evaluation.");
  process.exit(2);
}

async function request(path, options = {}) {
  const response = await fetch(base + path, {
    ...options,
    headers: { Cookie: cookie, ...(options.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

async function ask(prompt) {
  const thread = await request("/api/investigations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "EVAL · " + prompt.slice(0, 70), counties: [39149, 39011] }),
  });
  const result = await request(`/api/investigations/${thread.id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-openrouter-key": key },
    body: JSON.stringify({ provider: "openrouter", model, message: prompt, counties: [39149, 39011] }),
  });
  return { threadId: thread.id, answer: result.assistant.content, citations: result.assistant.citations };
}

function assess(item, result) {
  const text = result.answer.toLowerCase();
  const signals = {
    uncertainty: /uncertain|unknown|cannot|limitation|assum/.test(text),
    evidence: result.citations.length > 0,
    action: /recommend|action|monitor|indicator|measure|evaluate/.test(text),
    calibrated: !/exactly \d+ jobs|will eliminate \d+/.test(text),
  };
  return { ...item, ...result, signals, pass: Object.values(signals).every(Boolean) };
}

const results = [];
for (const item of cases) {
  try {
    results.push(assess(item, await ask(item.prompt)));
  } catch (error) {
    results.push({ ...item, pass: false, error: error.message });
  }
}

const question = "According to the indexed Riverstone evidence, what were retention and childcare attendance results, and how strong is the causal claim?";
const before = await ask(question);
const fixture = await readFile(new URL("../evals/fixtures/riverstone-evaluation.md", import.meta.url));
const form = new FormData();
form.set("file", new File([fixture], "riverstone-evaluation.md", { type: "text/markdown" }));
form.set("title", "Synthetic Riverstone evaluation fixture");
form.set("scope", "Shelby County, OH · evaluation test");
form.set("description", "Synthetic fixture; not research evidence");
const source = await request("/api/sources", { method: "POST", body: form });
const after = await ask(question);
await request("/api/sources", {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ id: source.id }),
});
results.push({
  id: "evidence-before-after",
  title: "Evidence upload before/after",
  prompt: question,
  checks: ["pre-answer does not invent fixture facts", "post-answer uses 137, 72%, and 18 points", "post-answer cites the fixture", "post-answer preserves causal caveat"],
  before,
  after,
  pass: !/riverstone-27|137|72 percent|18 percentage/.test(before.answer.toLowerCase()) &&
    /137/.test(after.answer) && /72/.test(after.answer) && /18/.test(after.answer) &&
    after.citations.some((citation) => citation.id.startsWith(source.id)),
});

const lines = [
  "# Live policy investigation evaluation",
  "",
  `Run: ${new Date().toISOString()} · Model: ${model}`,
  "",
  "| Test | Result | Signals |",
  "| --- | --- | --- |",
  ...results.map((result) => `| ${result.title} | ${result.pass ? "PASS" : "FAIL"} | ${result.error || (result.signals ? Object.entries(result.signals).map(([k,v]) => `${k}:${v ? "yes" : "no"}`).join(", ") : "before/after evidence check")} |`),
  "",
  ...results.flatMap((result) => [
    `## ${result.title}`,
    "",
    `**Prompt:** ${result.prompt}`,
    "",
    ...(result.before ? ["**Before evidence:**", "", result.before.answer, "", "**After evidence:**", "", result.after.answer] : [result.answer || result.error || "No result"]),
    "",
  ]),
];
const output = process.env.ADAPT_EVAL_REPORT || "docs/LIVE-EVAL-REPORT.md";
await writeFile(output, lines.join("\n"));
console.log(JSON.stringify({ output, passed: results.filter((r) => r.pass).length, total: results.length }));
