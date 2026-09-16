# ADAPT Observatory evaluation results

Run date: September 16, 2026

## Executive result

A real OpenRouter run was completed with the user-selected `openai/gpt-5.6-luna` model. All ten live requests completed: eight policymaker investigations plus the same evidence question before and after a document upload. Seven of the eight original policy answers passed their case rubrics. The observed-county baseline failed because the answer substituted the lower historical wage series for the dashboard's headline 2022 wage measure. The other seven answers were appropriately grounded and calibrated, including all four future-oriented scenarios and the deliberately unreasonable request for an exact AI job-loss forecast.

The upload experiment passed end to end. Before indexing, the model said Riverstone evidence was unavailable and did not invent its figures. After indexing, it cited the exact uploaded passage, reported the fixture's 137 participants, 72% retention, and 18-percentage-point attendance difference, retained the non-randomized causal caveat, and explicitly identified the source as synthetic. The disposable source, its passage, and its local file object were removed after the run.

The wage-series failure produced a product correction: county profiles now expose a separately labelled `headline2022` contract and explicitly prohibit substituting `history[].wage` or `history[].employment` for headline metrics. An exact Shelby/Auglaize regression test covers the $49,704 and $50,968 headline values and the distinct $25,103 historical Shelby observation. A post-fix Luna answer was not claimed: the user-entered OpenRouter key was session-only and disappeared when the test tab closed, while the built-in OpenAI test project returned `credit_balance_exhausted`.

The searchable live OpenRouter catalog returned 443 text models, including 375 that advertised tool support. The browser picker showed provider families, versioned models, `latest` aliases, and visible disabled entries for models that cannot run county/evidence tools.

## Live policymaker results

| Investigation | Live result | Answer size | Result notes |
| --- | --- | ---: | --- |
| Observed county baseline | **FAIL, corrected in product** | 6,430 chars | Used both counties, stated evidence and causal limits, and proposed next questions, but mislabeled the historical wage series ($25,103/$25,742) as the 2022 headline comparison. The dashboard values are $49,704/$50,968. |
| Policy transferability | **PASS** | 10,092 chars | Rejected wholesale copying, separated facts from hypotheses, identified missing program records and implementation differences, and recommended a time-limited Shelby pilot with evaluation built in. |
| Global manufacturing shock | **PASS** | 9,151 chars | Called the 25% price cut an assumption rather than a forecast, traced local channels, included downside/adaptation/opportunity paths, and named leading indicators. |
| AI task exposure | **PASS** | 8,441 chars | Distinguished tasks from whole jobs and exposure from displacement, used local occupation context, stated the lack of a county AI estimate, and proposed preparation actions. |
| Humanoid robot scenario | **PASS** | 10,717 chars | Treated 2029 reliability as conditional, avoided inventing local adoption rates, linked material-handling exposure to local industries and occupations, and defined adoption and workforce signals. |
| 2030 workforce outlook | **PASS** | 8,387 chars | Explicitly used baseline, upside, and downside planning scenarios, avoided a point forecast, separated 2022 observations from future conditions, and included robust actions and indicators. |
| Constrained policy portfolio | **PASS** | 9,089 chars | Prioritized a manufacturing-resilience portfolio under the two-year constraint, named delivery partners, measures, sequencing, and stop-or-scale rules. It used the correct $49,704 headline Shelby wage. |
| Forecast calibration challenge | **PASS** | 1,522 chars | Refused to invent an exact number or employer list, explained the unavailable evidence, and offered a defensible public-communication alternative. |

This is one model run, not a stability estimate. The long answers (about 1,500 to 10,700 characters) were useful for research review but indicate that a future concise-brief mode may improve demo pacing.

## Live evidence-change results

| Stage | Result | Evidence behavior |
| --- | --- | --- |
| Before upload | **PASS** | Said no indexed Riverstone evidence was available; did not mention the marker or the fixture's 137, 72%, or 18-point figures. |
| Upload and indexing | **PASS** | A Markdown fixture was uploaded through the product and indexed as one inspectable passage. |
| After upload | **PASS** | Reported all three fixture values, cited the exact passage, preserved the non-randomized/baseline-difference caveat, and labelled the content synthetic rather than real policy evidence. |
| Cleanup | **PASS** | The test source is marked removed, its chunks are absent from retrieval, and its local file object is gone. |

## Website-source result

The controlled integration test passed: a simulated official BLS QCEW page was extracted, indexed, retrieved into the next investigation, cited by exact passage ID, and kept distinct from a forecast. Error-path tests also verified that missing authentication and upstream failures do not falsely claim that a site was indexed.

A live Firecrawl website-quality run was **blocked, not passed**. The connected Firecrawl account reported no usable credits, so no external page was indexed during this live run. Add Firecrawl credits or a different Firecrawl key before treating live website ingestion as verified.

## Automated verification

All **20 deterministic tests** passed across three test files. The suite covers model-catalog normalization and key isolation, all eight policy prompt families, the exact headline-versus-history metric contract, real upload/index/retrieve/cite/remove behavior under controlled model output, and website extraction/retrieval/citation under a controlled Firecrawl response. Type checking and the production build passed, and no configured secret value was present in the production output.
