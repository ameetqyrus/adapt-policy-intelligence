# ADAPT Observatory evaluation results

Run date: September 16, 2026

## Executive result

All 19 deterministic automated tests passed. The live OpenRouter catalog returned 443 text models, 375 of which advertised tool support, and the searchable picker was verified in the browser with provider families, versioned models, `latest` aliases and visible disabled entries for models that cannot run county/evidence tools.

The live response-quality run is intentionally recorded as **not run**: there was no OpenRouter key in the current application session or environment. The tests therefore establish routing, retrieval, persistence, security and evidence behavior with controlled provider responses; they do not claim that a particular live model produced a good policy answer.

## Policymaker prompt results

| Investigation | Automated result | Live model result | What was verified |
| --- | --- | --- | --- |
| Observed county baseline | PASS | Not run — key absent | Prompt reaches the selected counties with dated ADAPT context and the evidence/causality instructions. |
| Policy transferability | PASS | Not run — key absent | Prompt explicitly requires facts, hypotheses, missing implementation evidence and an evaluation design. |
| Global manufacturing shock | PASS | Not run — key absent | Conditional 2027 shock, multiple scenarios and leading indicators are part of the test contract. |
| AI task exposure | PASS | Not run — key absent | Test requires tasks-versus-jobs, exposure-versus-displacement and national-versus-local distinctions. |
| Humanoid robot scenario | PASS | Not run — key absent | Test requires conditional assumptions, no invented adoption rate and observable validation signals. |
| 2030 workforce outlook | PASS | Not run — key absent | Test rejects a single-point forecast and requires baseline, upside and downside scenarios. |
| Constrained policy portfolio | PASS | Not run — key absent | Test requires sequencing, delivery owners, leading/outcome measures and stop-or-scale rules. |
| Forecast calibration challenge | PASS | Not run — key absent | Test explicitly challenges the model to refuse a fabricated exact jobs-loss number and employer list. |

“PASS” in this table means the scenario is present, structurally valid, routed through the same investigation path and covered by the automated contract. It is not a substitute for reading a live model answer.

## Evidence and source results

| Test | Result | Before | After |
| --- | --- | --- | --- |
| Document upload and extraction | PASS | No Riverstone marker or figures were present in retrieval. | The uploaded Markdown was indexed as one passage, inspectable in the browser, and then removed. |
| Answer context before/after upload | PASS (controlled provider) | The provider payload excluded `RIVERSTONE-27`; the answer stated that the evaluation was unavailable. | The payload contained the indexed excerpt; the saved answer reported 137, 72%, and 18 percentage points, retained the non-randomized caveat, and saved the exact source citation. |
| Website indexing and retrieval | PASS (controlled Firecrawl response) | The unique QCEW marker was absent. | The page content was indexed, retrieved into the next investigation, cited by exact passage ID, and treated as observed data rather than a forecast. |
| Website indexing upstream failure | PASS | Missing key returns a useful configuration error. | Authentication/rate failures do not claim that a source was indexed. |
| Disposable test-data cleanup | PASS | No synthetic evaluation source existed before the test. | The test upload and R2 object were removed from future retrieval after inspection. |

## Remaining live checks

Once an OpenRouter key is saved in **AI connection**, run the eight prompts from **Investigations → Policymaker evaluation prompts** and record the complete answers using the six-part rubric in `POLICY-EVAL-PLAN.md`. A Firecrawl key is separately required for a live website-indexing comparison. Neither credential should be committed or copied into the report.
