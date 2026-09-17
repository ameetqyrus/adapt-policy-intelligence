# Evidence companion update — 17 September 2026

## Scope and requirements

Based on Ravi's 17 September call, the 16 September ADAPT Assets email and attachment, and earlier county/source requests. This is a local update to ADAPT Observatory, not a deployment to the older Policy Intelligence/Ohio sites.

The direction is an evidence companion: describe county outcomes, show documented peer policies, preserve evidence provenance, and leave policy choices to the user. Suggested prompts, comparison and evidence auditing remain. AI instructions no longer default to prescribing actions or spending portfolios.

## Implemented

- Policy intelligence (local county map) and explicit Peer comparison navigation, with the conversational assistant below both. A single conversation component retains conversation state across views.
- Current surface, measure, selected panel and counties are sent with each question. The server validates context and county IDs; saved messages record context for later audit and downloads. Historical context is distinguished from the current selection.
- Scenario workspace for user-provided assumptions/copied results. It explicitly does not claim to implement the original simulator. Notes clear on all county-selection paths.
- Administrator-curated policy register and dated timeline, scoped to selected counties. Creation requires an exact passage from an indexed source. Dates, statuses and outcome notes remain curator claims requiring verification; an exact quotation alone cannot validate them.
- `get_documented_policies` model tool with source citations. Removed sources exclude their policy records from subsequent retrieval without modifying old answers.
- Expanded reference shelf with Ravi's requested policy, workforce, housing, education and institutional sources. Reference links are explicitly not indexed evidence. XLSX entries direct users to download then upload, rather than pretend a web scrape reads a workbook.
- Searchable **Help & how to use**, ten workflow/troubleshooting topics, example questions, AI setup entry point, downloadable Markdown guide, and direct `?view=help` navigation.
- Evidence-first eval prompts; no automatic reward for policy prescriptions. Citation display now includes ADAPT only when the answer actually cites `[ADAPT]`.
- Original source values/scoring are unchanged. The comparison clearly discloses the 2022 baseline and absence of a 2023–2024 education-spending import.

## Verification

Automated tests use controlled provider responses and an isolated in-memory database. They are NOT live model-quality evaluations.

| Check | Result |
|---|---|
| TypeScript check | Passed |
| Production build | Passed |
| Automated suite | 26 tests passed, including 20 existing tests |
| Current tool context and county switch/return persisted per answer | Passed, mocked provider |
| Context validation and bounded scenario text | Passed |
| Policy register authentication/admin restriction | Passed |
| Exact indexed passage requirement; impossible date rejection | Passed |
| Policy excluded after its source is removed | Passed |
| Policy tool round trip and exact citation; no unrelated ADAPT citation | Passed, mocked provider |
| Existing upload before/after and website ingestion contracts | Passed with controlled provider/website responses |
| Help navigation and OCR keyword search | Passed in local browser |
| Download user guide | Clicked in browser; downloaded Markdown file inspected |
| Peer-comparison preset populates composer and enables Send | Passed in local browser; no live AI request sent |
| Shelby/Auglaize → Allegheny → Shelby/Auglaize | Passed in local browser |
| Scenario notes clear on county change | Passed in local browser |
| Help dark-mode appearance and desktop layout | Visually checked |
| Full repository lint | Not clean; existing hook, accessibility and test typing findings remain |

## Remaining dependencies — not represented as complete

1. **Original Policy Simulator integration:** both local `adapt-viz` checkouts and the public repository contain the Streamlit county map/pair application, not the current site's simulator. The hosted site redirects to a password screen. The local Observatory was restarted on port 3100; that does not supply the missing original simulator. Need the appropriate source/API and supported state contract before automatically synchronizing original simulator inputs/results. No guessed calculations were introduced.
2. **Fresh education data:** 2023–2024 data must be obtained, checked for geographic definitions, fiscal periods, units and comparability, then imported separately or through the lab-approved model refresh. No unverified replacements were made.
3. **Actual new source ingestion:** the expanded shelf is a source catalog, not a populated corpus. Firecrawl CLI reported exhausted credits. Website ingestion needs a funded configured account, or authorized source documents can be uploaded. No policy examples were fabricated to populate the empty register.
4. **Live model evaluation:** revised cases are ready, but this update did not run new paid OpenRouter/OpenAI evaluations. Historical September 16 results are historical, not validation of this version.
5. **Publication:** this report records the initial local handoff. A subsequent user request authorizes publishing this version to the existing Observatory site with its audience unchanged. Deployment success is verified separately through Sites. A GitHub push is not part of that deployment.

## Database and rollout

`drizzle/0002_neat_kulan_gath.sql` creates `policy_records` and adds nullable `messages.context`, with a matching schema snapshot/journal entry. It was applied to the existing local `.wrangler/state` database. Existing source/message rows are preserved. Apply this migration once to the target database before deploying the new code; use the migration journal to avoid reapplying the `ALTER TABLE` statement.

Local preview: `http://localhost:3100/?counties=39149%2C39011`.

Help: `http://localhost:3100/?view=help`.
