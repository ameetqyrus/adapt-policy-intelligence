# ADAPT Observatory

This isolated version combines native ADAPT county exploration with free-form, saved investigations and an administrator-managed evidence library. The previous Policy Intelligence and Ohio deployments are unchanged.

## AI connection

Open **AI connection** in the sidebar. Choose **OpenAI** or **OpenRouter**. Each has separate key and model fields; switching providers preserves both configurations. OpenRouter requires a full model identifier (for example `openai/gpt-4.1-mini`) and a model/provider supporting tool calling. OpenRouter keys are sent only to OpenRouter. There is no automatic fallback to OpenAI. The selected provider receives recent conversation history and retrieved evidence. OpenRouter also routes that data to the underlying model provider.

User-entered keys are tab-session preferences, not saved database records. They are forwarded through the server to the selected provider and are excluded from saved messages. Closing a tab normally clears its session storage; browser session restoration may retain it. Use **Clear keys** to remove all local credentials explicitly.

An optional built-in OpenAI testing connection uses the server-only `OPENAI_API_KEY`, restricted by `TESTER_EMAILS`. It uses `gpt-4.1-mini`, allows 20 attempts per tester per UTC day, and never applies to OpenRouter. API credits and provider quotas are required independently of ChatGPT subscriptions. Local development reads the confirmed, ignored `.env.local`; production must configure its own secret and tester allowlist in Sites. Secrets are not bundled into production assets.

## How an answer is produced

1. The server verifies the signed-in user owns the investigation and validates county IDs against the bundled catalog.
2. It loads the selected counties’ actual ADAPT metrics, historical observations, and leading industries/occupations. It retrieves candidate evidence passages and up to 20 recent conversation turns.
3. The selected model interprets the free-form question. It can call `find_counties`, `get_county_profile`, and `search_evidence` to investigate further. These are actual server-side retrieval tools, not fixed question categories. Tool execution is bounded to four model rounds.
4. The response distinguishes observations, interpretation, scenarios, and uncertainty. Instructions prohibit unsupported causal claims and treating AI exposure as measured job losses. These are safeguards, not guarantees: review the evidence.
5. Successful question/answer pairs and source excerpts are saved atomically in D1. Failed requests preserve the draft and do not create an invented answer. Conversations can be resumed and exported as Markdown.

OpenAI uses the Responses API; OpenRouter uses Chat Completions with normalized tool calls. Tool reasoning metadata is preserved during an OpenRouter tool cycle but is not displayed as an answer.

OpenRouter model choices are loaded from the live text-model catalog. The picker shows the full catalog and identifies which entries support the county and evidence tools required by an investigation; incompatible entries remain visible but cannot be selected. See [the policy evaluation plan](POLICY-EVAL-PLAN.md) for the policymaker prompts, scoring dimensions and before/after evidence experiment, and [the latest results](EVAL-RESULTS.md) for the verified scope and outstanding live checks.

## County data

The bundled county catalog comes from `cgsp-georgetown/adapt-viz`. `scripts/import-adapt.mjs PATH_TO_UPSTREAM_DATA` generates county geometry, historical observations, and industry/occupation detail files from its CSV/GeoJSON data. County IDs are numeric FIPS; the UI formats leading zeroes when needed. Source values retain their original units. ADAPT data through 2022 are historical/modelled estimates, not current economic conditions or causal policy evaluations.

Explore includes a county map, up to four searchable counties, original metrics, historical charts, industry and occupation tables, and comparison CSV downloads. **Original dashboard** also provides the original hosted interface, with an external link if embedding is blocked.

## Adding and removing evidence

Administrators listed in `ADMIN_EMAILS` can add sources. All authorized site visitors can read the shared library; each user’s conversations remain private.

- Files: PDF (text-based), DOCX, XLSX, CSV, TXT and Markdown; 8 MB per file, 300,000 extracted characters. Scanned PDFs require OCR before upload. Office documents undergo a compressed-size check before extraction.
- Websites: a single public HTTPS URL, indexed through Firecrawl using the administrator’s optional Firecrawl key. This does not crawl an entire website. Retrieved content may be cached for up to one day.
- Add a useful title, geography/topic scope, and coverage notes. Inspect the extracted passages after indexing. Uploads live in R2; source metadata and overlapping 1,600-character passages live in D1.
- Search is a bounded lexical passage search, not an embedding/vector index. Models can issue further searches during a conversation. Scope is supplied as evidence metadata, not an exclusion filter.
- Removing a source deletes its searchable passages and original upload. Historical answers retain their original citations for auditability, but new searches cannot retrieve the removed source.
- The **Reference shelf** is a catalog of links, explicitly not read/indexed evidence. Index a link or upload its content before relying on it in answers.

## Development and verification

`npm install`, then `npm run dev -- --host 127.0.0.1 --port 3100`. Apply local D1 migrations with Wrangler using `.openai/local-wrangler.json` and `.wrangler/state`. Generated Drizzle migrations live in `drizzle/`; add new migrations instead of changing applied ones.

Run `npx vitest run`, `npx tsc --noEmit`, and `npm run build`. Tests use an in-memory SQLite D1 stand-in and mocked provider responses: they validate routing, tool round trips, ownership, extraction, deletion, persistence, quota guards, and error handling, not live model quality. `scripts/smoke-ai.mjs` is a local-only live OpenAI test and incurs usage on the testing account.

Live OpenAI verification on September 15, 2026 reached the API but returned `credit_balance_exhausted`. OpenRouter live inference requires the user’s OpenRouter key; no live success is claimed by the mocked tests.

## Limitations

This is an evidence-assisted research workspace, not a causal inference engine or a county forecast. Imported snapshots do not auto-refresh. Retrieval is bounded and may miss relevant passages. Arbitrary Word `.doc` and Excel `.xls` legacy formats are not supported. Source deletion cannot retroactively remove information already present in historical conversation text. Provider retention and data-use settings apply to material sent for analysis.
