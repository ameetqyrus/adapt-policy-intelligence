# ADAPT Policy Intelligence

ADAPT Policy Intelligence is a county-comparison interface built on data from the [American Dream Achievability Progress Tracker (ADAPT)](https://www.adaptdashboard.com/maps/adapt). It lets a user select a home county, use ADAPT's computed peer or choose a manual comparison, inspect key indicators, ask a policy-oriented question, review linked evidence, and download an HTML briefing.

Live site: [adapt-policy-intelligence.amitonquest.chatgpt.site](https://adapt-policy-intelligence.amitonquest.chatgpt.site/)

## Two answer layers

The application deliberately separates an auditable baseline from optional AI-assisted conversation.

The **baseline answer** is produced by deterministic application logic in [`app/page.tsx`](app/page.tsx):

1. The app loads the selected county and comparison county.
2. It lowercases the submitted question.
3. Ordered keyword rules classify the question into a supported intent.
4. A fixed response template for that intent is filled with the counties' current metrics.
5. Static, curated source links and evidence-boundary language are displayed alongside the answer.

This layer remains predictable and auditable. It does not use an LLM, embeddings, semantic search, or live document retrieval.

The **AI follow-up** uses the OpenAI Responses API through [`app/api/chat/route.ts`](app/api/chat/route.ts). A user supplies their own OpenAI API key for the current browser tab. Follow-up messages receive:

- the selected home and peer counties;
- the current metrics and ranks;
- whether the peer was computed or manually selected;
- the submitted question and deterministic baseline answer;
- the curated source registry visible for the pair; and
- up to 12 previous user/assistant turns.

The AI is instructed to separate observed metrics, official-source claims, inference, and recommendations; avoid causal claims; and never invent programmes, statistics, sources, or quotations. Optional research mode gives a compatible model access to OpenAI web search and asks it to prioritize official sources.

## How baseline questions are interpreted

Question interpretation happens in the `buildAnswer(home, peer, prompt)` function. The rules are evaluated in this order:

| Priority | Intent | Example trigger words |
| --- | --- | --- |
| 1 | Avoid/caution | `avoid`, `mistake`, `shouldn't`, `should not` |
| 2 | Employment | `employment`, `job`, `hiring`, `retention`, `labor` |
| 3 | Wages | `wage`, `pay`, `income`, `earning`, `salary` |
| 4 | Investment | `education`, `workforce`, `spend`, `investment`, `budget` |
| 5 | Practices | `practice`, `policy`, `programme`, `program`, `investigate`, `copy`, `learn` |
| 6 | General fallback | Any question that does not match the rules above |

Order matters. For example, a question containing both “avoid” and “investment” is treated as an avoid/caution question. Each category controls the answer title, explanatory emphasis, and recommended next step. The factual findings are populated from the selected counties' wage, employment, education-spending, and related ADAPT values.

Current limitations:

- Synonyms not included in the rules may be missed.
- The app cannot understand context, ambiguity, or follow-up questions.
- Two differently worded questions can produce the same answer category.
- Linked evidence is not searched, summarized, or checked at question time.
- The answer does not establish causation; it presents comparison signals and research directions.

These limitations apply to the deterministic baseline. The AI follow-up understands natural language and conversational context, but it can still make mistakes and must be checked against primary sources.

## How an answer is produced

```text
County selection
      │
      ├── Home county from county-context.json
      └── ADAPT peer from the county record, or a manual peer
      │
      ▼
Question submitted
      │
      ▼
Ordered keyword classification in buildAnswer()
      │
      ▼
Deterministic title + summary + findings + recommendation
      │
      ├── Values formatted from the two county metric records
      ├── Curated evidence links filtered by county FIPS
      └── Explicit causal/transferability warning
      │
      ▼
On-screen baseline answer
      │
      ├── Optional AI follow-up receives the full comparison context
      └── Optional downloadable HTML briefing
```

The main runtime flow is:

- [`public/data/county-context.json`](public/data/county-context.json) contains 3,145 county records, metrics, ranks, and each county's computed peer.
- [`app/page.tsx`](app/page.tsx) loads that file in the browser, manages county/question state, interprets the question, and renders the comparison.
- [`app/api/chat/route.ts`](app/api/chat/route.ts) validates AI requests, applies evidence rules, calls the OpenAI Responses API, and returns answer text and web citations.
- The `sources` array in [`app/page.tsx`](app/page.tsx) is the current curated evidence registry.
- [`app/briefing/route.ts`](app/briefing/route.ts) turns the current answer, metrics, and visible sources into a downloadable HTML briefing.
- County, manual peer, and submitted question are written to the URL so a comparison can be shared.

## County data format

The county bundle has top-level provenance metadata and a `counties` array:

```json
{
  "dataThrough": "2022",
  "generatedFrom": "source description",
  "methodology": "method description",
  "counties": [
    {
      "countyid": 42003,
      "name": "Allegheny County, PA",
      "state": "PA",
      "populationGroup": "2nd most populated quartile (by people)",
      "workers": 620629,
      "metrics": {
        "potential": { "value": 0.13, "rank": 19, "total": 107 },
        "star_median2022": { "value": 48014.2912, "rank": 64, "total": 110 }
      },
      "peer": {
        "countyid": 49035,
        "name": "Salt Lake County",
        "state": "UT",
        "matchTier": "rucc_econtype_lowed",
        "rucc": 1,
        "economicType": "Nonspecialized",
        "similarWorkforce": true
      }
    }
  ]
}
```

`countyid` is the numeric five-digit county FIPS code; leading zeroes are added for display and URLs. A peer's `countyid` must point to another record in the bundle. Metric values may be `null` when unavailable.

## Adding or updating county data

1. Update [`public/data/county-context.json`](public/data/county-context.json).
2. Preserve the existing record shape and use unique county FIPS identifiers.
3. Confirm every computed peer points to a county that exists in the same file.
4. Update `dataThrough`, `generatedFrom`, and `methodology` so the provenance remains clear.
5. If adding a metric that should appear in the interface, also update:
   - `Metric`/`County` typing if its structure differs;
   - `metricOrder` to control display order;
   - `metricLabels` for its user-facing name;
   - `formatMetric()` for currency, percentage, or decimal formatting;
   - `buildAnswer()` if the metric should affect the narrative;
   - the briefing payload if it should appear in downloads.
6. Run the validation commands below and test the changed counties in the browser.

The two records in `initialCounties` are only a resilient first-render fallback. The complete catalog comes from `county-context.json` and replaces them after loading.

## Adding a new evidence source

Evidence sources currently live in the `sources` array near the top of [`app/page.tsx`](app/page.tsx). Add a unique record such as:

```ts
{
  id: 7,
  jurisdiction: 'Example County',
  title: 'Example County Workforce Plan',
  detail: 'Workforce priorities, delivery partners and outcome measures',
  kind: 'Official plan',
  url: 'https://example.gov/workforce-plan',
  countyids: [12345]
}
```

Field behavior:

- `id` must be unique and is used by numbered citations.
- `jurisdiction`, `title`, `detail`, and `kind` control the evidence-panel display.
- `url` should point to the original authoritative source, preferably an official government page, plan, budget, law, or evaluation.
- `countyids` scopes the source to one or more county FIPS codes. If omitted, the source appears for every comparison.

Adding a source automatically makes it eligible for the evidence panel and downloadable briefing when one of its county IDs is selected. It does **not** automatically create a policy claim or add an inline citation to the generated narrative.

To cite the source in an answer:

1. Add `<SourceLink id={7} />` beside a claim supported by that source.
2. Ensure the claim accurately reflects the linked document.
3. Extend the curated policy section for the relevant county or pair.
4. Keep model-derived facts separate from document-derived policy claims.
5. Preserve the causal and transferability warnings unless stronger evidence justifies a change.

At present, the detailed policy narrative is deliberately enabled only for the Allegheny–Salt Lake pair. Other combinations show an evidence-gap message even if general county metrics are available. A scalable next step would be to move sources and vetted claims into separate structured JSON files keyed by county FIPS instead of adding more pair-specific JSX.

## AI follow-up configuration and security

The AI panel supports these model IDs:

- `gpt-5.6-luna` — default, cost-sensitive option;
- `gpt-5.6-terra` — balanced option;
- `gpt-5.6-sol` — strongest option; and
- `gpt-5.4-mini` — compatibility option.

The user enters a project-scoped OpenAI API key in the AI panel. The key:

- is kept in `sessionStorage`, so it is scoped to the current browser tab/session;
- is never committed to source control or written to the Site's database;
- is sent over HTTPS to this Site's `/api/chat` route for each request;
- is forwarded to `https://api.openai.com/v1/responses`; and
- is removed from the browser session when the user selects **Disconnect key**.

The Responses API request uses `store: false`. The application does not log the key or return upstream error bodies to the browser. Users should still create a restricted OpenAI project key, set project spending limits, disconnect it on shared devices, and rotate it if they believe it was exposed.

Conversation history is held in React state and resent with each turn; OpenAI `previous_response_id` storage is not used. Changing the county pair or baseline question starts a new follow-up conversation.

Research mode is off by default because OpenAI web-search tool calls can add cost. When enabled, returned URL citations are displayed beneath the AI response. The curated source metadata is always available to the model, but without research mode the prompt explicitly forbids implying that linked documents were read.

The next evidence-quality improvement should be first-party document ingestion and retrieval. That would let the model cite approved passages from county plans and evaluations instead of relying on web research.

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by the development server.

Before committing:

```bash
npm run lint
npm run build
```

Recommended manual checks:

- Search both county fields by county name and five-digit FIPS.
- Change the home county and confirm its ADAPT-computed peer is restored.
- Select a manual peer and confirm it is labelled as a manual comparison.
- Submit every preset question and at least one custom question.
- Connect a restricted test key and run a multi-turn AI follow-up.
- Confirm a bad key returns a useful authentication error without exposing upstream details.
- Enable research mode and verify returned citations point to authoritative sources.
- Confirm the URL updates with county, peer, and question state.
- Download and open the briefing.
- Check light mode, dark mode, and a mobile-width viewport.
- Confirm source links resolve to the intended authoritative documents.

## Deployment note

The GitHub repository and the hosted OpenAI Site are separate remotes. Pushing to GitHub does not automatically publish the live Site. A Sites build/version/deployment is required after application changes. README-only changes do not affect the running application.

## Data and evidence principles

- Preserve provenance for every quantitative dataset.
- Prefer first-party public-sector sources for policy claims.
- Treat peer comparison as a way to focus investigation, not establish causation.
- Do not assume a programme transfers across legal, fiscal, demographic, or delivery contexts.
- Make missing evidence visible instead of filling gaps with unsupported prose.
