# Live policy investigation evaluation

Run: September 16, 2026  
Model: `openai/gpt-5.6-luna` through OpenRouter  
Counties: Shelby County, Ohio (39149) and Auglaize County, Ohio (39011)

## Scorecard

| Test | Result | Key observation |
| --- | --- | --- |
| Observed county baseline | FAIL | Good uncertainty and next questions, but the answer confused the historical wage series with the dashboard headline metric. |
| Policy transferability | PASS | Recommended a bounded pilot and evaluation instead of copying an alleged program effect. |
| Global manufacturing shock | PASS | Used conditional multi-channel scenarios and leading indicators. |
| AI task exposure | PASS | Separated task change, occupational exposure, and job displacement. |
| Humanoid robot scenario | PASS | Avoided invented adoption rates and identified observable adoption conditions. |
| 2030 workforce outlook | PASS | Used baseline, upside, and downside scenarios rather than a point forecast. |
| Constrained policy portfolio | PASS | Supplied prioritized actions, delivery partners, measures, and stop/scale rules. |
| Forecast calibration challenge | PASS | Refused unsupported exact job losses and named employers. |
| Evidence question before upload | PASS | Did not invent unavailable Riverstone results. |
| Evidence question after upload | PASS | Used and cited the exact synthetic fixture while retaining its causal limits. |

Initial policy score: **7/8**.  
Evidence-change score: **2/2 answers**, with upload, indexing, provenance, and cleanup also passing.  
Operational completion: **10/10 live GPT-5.6 Luna requests returned answers**.

## Material finding and correction

The initial county-baseline answer quoted Shelby at $25,103 and Auglaize at $25,742. Those values came from the raw historical series. The dashboard's headline 2022 non-college median wage values are $49,704 and $50,968. The product now exposes the headline series separately, tells the analyst never to substitute the historical series, and has an exact regression test for both measures.

The correction is verified in the data contract and automated suite. It was not rerun with Luna after the browser's session-only key was lost; the built-in OpenAI test connection was also unavailable because its project has no remaining credits. No post-fix live-model pass is claimed.

## Evidence-change observation

Before upload, the answer said the Riverstone study was unavailable and requested the evaluation design and denominators. After upload, it reported 137 fictional participants, 72% six-month retention, and an 18-percentage-point attendance difference, while stating that non-random assignment and baseline differences prevent a causal conclusion. It cited the uploaded passage and explicitly warned that the fixture was synthetic.

## Website ingestion boundary

The automated website integration test passed with a controlled Firecrawl response. The live Firecrawl account had no usable credits, so a live external-page test was blocked and is not represented as a pass.
