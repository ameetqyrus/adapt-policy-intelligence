# Evaluation fixes and verification — 17 September 2026

## Changes

- OpenRouter output budget increased from 2,200 to 6,000 tokens. A `length` completion is regenerated once with a concise, all-sections instruction, without executing truncated tool arguments. A second incomplete completion fails explicitly and does not save a misleading partial answer. Filtered/error completions are also rejected.
- OpenAI responses receive the larger budget and explicitly reject incomplete/failed responses rather than storing them as completed answers.
- Evidence instructions now require every requested section, concise answers, correctly formatted tables, and library-scoped statements about missing evidence. Synthetic fixtures must be identified as synthetic.
- GFM table rendering added with a keyboard-focusable horizontal scroll container, preserving the existing theme.

## Verified

- **30 automated tests passed across five files.** Provider responses and website extraction in these tests are mocked. These results verify orchestration, not live model quality.
- Regression tests cover one bounded compact retry, failure after repeated truncation, no partial saved turns, provider isolation, semantic Markdown tables, and source addition/removal.
- Document before/after integration test verifies real parsing/indexing into the isolated test database, evidence in the provider request, cited source identifiers in the saved answer, and exclusion after removal. The model response itself is mocked.
- Website integration test verifies extracted passages entering retrieval and a subsequent answer request, with source exclusion after removal. Both the website extractor and model response are mocked.
- **Actual local HTTP upload test passed:** Markdown fixture uploaded through `/api/sources` (201), indexed into one passage, then read back with its synthetic label, RIVERSTONE-27 marker, 137 participants, 72% retention and 18-point attendance difference intact. No AI provider was called for this test.
- The newly created local test source was deleted (200), and absence from the source list verified. Only this disposable fixture was removed; its original file remains in `evals/fixtures/riverstone-evaluation.md` and can be uploaded again.
- TypeScript check and production build passed.

## Live AI verification boundaries

The previous live run remains documented in `LIVE-EVAL-2026-09-17.md`; its results are not relabelled as passes after these changes. A fresh Luna run is required to grade the changed prompt and output handling.

The end-to-end live model source experiment still needs browser file-upload permission. Website indexing also needs a configured funded Firecrawl key. These blocked checks are not equivalent to the mocked integration tests or the successful local HTTP upload test.

No API keys were added, exposed, or switched. No unrelated user evidence was removed.
