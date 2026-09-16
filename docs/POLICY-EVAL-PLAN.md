# Policy investigation evaluation plan

## Purpose

This evaluation tests whether ADAPT Observatory behaves like a careful county policy research partner. It does not reward fluency alone. A strong answer must ground itself in the selected counties, distinguish evidence from inference, treat forecasts as conditional scenarios, retrieve indexed evidence when relevant, and leave a policymaker with observable next steps.

## Test design

The primary counties are Shelby County, Ohio (39149) and Auglaize County, Ohio (39011). Eight investigation prompts cover the most important decision patterns: observed comparison, policy transferability, a global manufacturing shock, generative-AI task exposure, humanoid robots, a 2030 workforce outlook, a constrained policy portfolio, and a deliberately unreasonable demand for a precise jobs-loss forecast. The exact prompts and per-case checks live in `evals/policy-maker-cases.json`.

Each answer is reviewed on six dimensions:

1. **County grounding** — uses the selected county metrics, industries or occupations and does not silently substitute national conditions.
2. **Evidence discipline** — dates ADAPT data through 2022, cites indexed evidence by exact source ID, and says when evidence is absent.
3. **Causal discipline** — does not infer that a policy caused an outcome from a county comparison.
4. **Forecast calibration** — future claims are scenarios with assumptions, ranges or conditions; no invented point forecast, employer action or adoption rate.
5. **Decision usefulness** — gives prioritized actions, owners, indicators, evaluation measures, and stop-or-scale rules where the question calls for them.
6. **Conversation continuity** — follows the selected counties and recent turns without treating earlier assistant text as evidence.

## Evidence-change experiment

The same Riverstone question is asked before and after uploading a clearly labelled synthetic fixture. Before upload, an acceptable answer must say the study is not available and must not invent its marker or numbers. After upload, an acceptable answer must retrieve and cite the fixture, report 137 participants, a fictional 72 percent six-month retention rate and an 18-percentage-point attendance difference, and preserve the non-randomized causal caveat. The fixture is removed after a live run so it cannot pollute the shared library.

Website indexing is tested separately because it depends on a Firecrawl account. The automated integration test verifies successful page extraction, indexing, retrieval in a subsequent investigation, citation provenance, and upstream failure handling. A live website-quality run should use an official public page, record the Firecrawl retrieval date, ask the same question before and after indexing, and remove the test source afterward.

## Execution

- `npx vitest run` executes deterministic route, security, provider, upload, website-indexing and before/after retrieval checks.
- `OPENROUTER_API_KEY=… npm run eval:policy` runs the eight real investigations plus the evidence-change experiment against the local authenticated preview. It saves full answers and citations to `docs/LIVE-EVAL-REPORT.md`.
- Set `OPENROUTER_MODEL`, `ADAPT_EVAL_BASE_URL`, `ADAPT_EVAL_COOKIE`, or `ADAPT_EVAL_REPORT` to change the model, target, signed-in session or report path without putting credentials in source control.

Heuristic live signals are a first pass, not an authoritative judge. The final review should read every answer using the six dimensions above and record material unsupported claims verbatim.
