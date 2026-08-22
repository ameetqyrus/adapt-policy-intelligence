'use client';

import { FormEvent, useState } from 'react';

type Source = { id: string; type: string; title: string; detail: string; color: 'amber' | 'blue' | 'green'; url: string };

const sources: Source[] = [
  { id: '1', type: 'Budget analysis', title: 'NASBO Reports & Data', detail: 'State budgets, fiscal surveys and expenditure reports', color: 'green', url: 'https://www.nasbo.org/mainsite/reports-data' },
  { id: '2', type: 'Finance data', title: 'Urban Institute State & Local Finance Data', detail: 'Query tools built from Census government finance data', color: 'blue', url: 'https://datacatalog.urban.org/dataset/interactive-census-governments-state-local-finance-database' },
  { id: '3', type: 'Fiscal analysis', title: 'Pew Fiscal 50', detail: 'Indicators and analysis of state fiscal health', color: 'amber', url: 'https://www.pew.org/en/projects/archived-projects/states-fiscal-health' },
  { id: '4', type: 'Official government data', title: 'Census Government Finances', detail: 'Annual state and local revenue, expenditure and debt data', color: 'green', url: 'https://www.census.gov/programs-surveys/gov-finances.html' },
  { id: '5', type: 'Legislative tracker', title: 'NCSL Bill Tracking Databases', detail: 'Introduced and enacted legislation across policy topics', color: 'blue', url: 'https://www.ncsl.org/technology-and-communication/ncsl-50-state-searchable-bill-tracking-databases' },
  { id: '6', type: 'Policy summaries', title: 'Ballotpedia', detail: 'State policy, elections and ballot-measure summaries', color: 'amber', url: 'https://ballotpedia.org/' },
  { id: '7', type: 'Health policy data', title: 'KFF State Health Policy & Data', detail: 'State health indicators, research and policy tracking', color: 'green', url: 'https://www.kff.org/topic/state-health-policy-data/' },
  { id: '8', type: 'Education tracker', title: 'Education Commission of the States', detail: 'State education legislation organized by topic', color: 'blue', url: 'https://www.ecs.org/state-legislation-by-topic/' },
  { id: '9', type: 'Official legal text', title: 'California Legislative Information', detail: 'Example official state bill and statute portal', color: 'green', url: 'https://leginfo.legislature.ca.gov/' },
  { id: '10', type: 'Secondary legal lookup', title: 'Justia State Codes', detail: 'Free state-code discovery across jurisdictions', color: 'blue', url: 'https://law.justia.com/codes/' },
  { id: '11', type: 'Secondary legal lookup', title: 'FindLaw State Laws', detail: 'Aggregated state statutes and legal summaries', color: 'amber', url: 'https://codes.findlaw.com/' },
  { id: '12', type: 'Bill tracking', title: 'LegiScan', detail: 'Cross-state bill tracking and legislative data', color: 'blue', url: 'https://legiscan.com/' },
  { id: '13', type: 'Local ordinance library', title: 'Municode Library', detail: 'City and county codes; verify currency with the jurisdiction', color: 'green', url: 'https://library.municode.com/' },
  { id: '14', type: 'Local ordinance library', title: 'American Legal Code Library', detail: 'Municipal codes organized by state and jurisdiction', color: 'amber', url: 'https://codelibrary.amlegal.com/' },
  { id: '15', type: 'Official state budgets', title: 'NASBO Proposed & Enacted Budgets', detail: 'Links to each state’s current official budget materials', color: 'green', url: 'https://www.nasbo.org/mainsite/resources/proposed-enacted-budgets' },
];

const suggestions = ['How should I compare state fiscal capacity?', 'Where can I track Medicaid policy changes?', 'How do I verify a local ordinance?'];
const recentChats = [
  { id: 'fiscal', title: 'State fiscal capacity', time: '12 min ago', question: 'Which sources should we use to assess whether a state can afford a new policy?' },
  { id: 'health', title: 'Medicaid policy landscape', time: 'Yesterday', question: 'How should I research recent state Medicaid policy changes?' },
  { id: 'local', title: 'Local ordinance check', time: '3 days ago', question: 'How do I find and verify a city or county ordinance?' },
];

type PolicyAnswer = {
  heading: string; body: string; citations: string[]; status: string; supported: boolean;
  metrics: Array<{ rank: string; label: string; value: string; caption: string; detail: string; source: string; bar: number }>;
  reasons: Array<{ label: string; text: string; source: string }>;
  recommendation: string;
};

const metric = (rank: string, label: string, value: string, caption: string, detail: string, source: string, bar: number) => ({ rank, label, value, caption, detail, source, bar });
const reason = (label: string, text: string, source: string) => ({ label, text, source });

function answerForPrompt(question: string): PolicyAnswer {
  const query = question.toLowerCase();

  if (/budget|fiscal|afford|revenue|expenditure|finance/.test(query)) return {
    heading: 'Start with Census for the comparable baseline, then reconcile it to the current state budget.',
    body: 'Use Census government-finance data to compare revenue, expenditure and debt on a consistent basis. Add NASBO for current budget conditions, Urban Institute for easier historical queries, and Pew Fiscal 50 for fiscal-health context. The final funding judgment must be checked against the state budget office or comptroller documents for the relevant fiscal year.',
    citations: ['4', '1', '2', '3', '15'], status: 'Authoritative-first route · 5 source portals', supported: true,
    metrics: [metric('01', 'Comparable baseline', 'Census', 'Official finance data', 'Revenue, spending and debt', '4', 92), metric('02', 'Current cycle', 'NASBO', 'Budget context', 'Proposed and enacted state budgets', '1', 78), metric('03', 'Final verification', 'State', 'Official documents', 'Budget office or comptroller detail', '15', 66)],
    reasons: [reason('Comparability', 'Census supplies a standardized government-finance baseline across jurisdictions.', '4'), reason('Timeliness', 'NASBO adds current fiscal surveys and links to proposed or enacted budgets.', '1'), reason('Interpretation', 'Urban and Pew help analyze trends, but should be reconciled to official records.', '2')],
    recommendation: 'Specify the state, fiscal year, policy cost and funding mechanism. Then test recurring cost, one-time balances, revenue volatility and legal constraints against the official budget documents.',
  };

  if (/medicaid|health|insurance|hospital/.test(query)) return {
    heading: 'Use KFF for the policy and data baseline, then verify every legal change in the official state record.',
    body: 'KFF organizes state health indicators and policy research. NCSL and LegiScan can identify relevant bills and their reported status, while the state legislature website remains the controlling place to confirm bill text, amendments and enactment. Use state budget documents when the question includes appropriations or implementation cost.',
    citations: ['7', '5', '12', '9', '15'], status: 'Topic-specific route · official text required', supported: true,
    metrics: [metric('01', 'Policy baseline', 'KFF', 'Health data', 'State indicators and policy research', '7', 90), metric('02', 'Bill discovery', 'NCSL', 'Topic tracking', 'Introduced and enacted legislation', '5', 76), metric('03', 'Legal check', 'Official', 'State record', 'Bill text, history and enacted law', '9', 64)],
    reasons: [reason('Substance', 'KFF provides health-policy framing and state-level indicators.', '7'), reason('Coverage', 'NCSL and LegiScan help locate relevant legislation across states.', '5'), reason('Authority', 'The official legislature portal should resolve conflicts in text or status.', '9')],
    recommendation: 'Name the policy, states and date cutoff. Report proposal, enactment and implementation as separate statuses, with a direct official citation for each state-level conclusion.',
  };

  if (/education|school|teacher|student/.test(query)) return {
    heading: 'Lead with ECS for education-specific tracking and use the official legislature record for confirmation.',
    body: 'Education Commission of the States provides topic-based state legislation tracking. NCSL broadens the cross-policy scan, and LegiScan can help monitor bill movement. Treat all three as discovery and analysis layers; confirm current bill text, status and enacted statutes on each state’s official legislature website.',
    citations: ['8', '5', '12', '9'], status: 'Education route · official text required', supported: true,
    metrics: [metric('01', 'Topic scan', 'ECS', 'Education policy', 'State legislation organized by topic', '8', 91), metric('02', 'Cross-check', 'NCSL', '50-state context', 'Broader legislative databases', '5', 74), metric('03', 'Final authority', 'State', 'Official portal', 'Current text and legal status', '9', 62)],
    reasons: [reason('Relevance', 'ECS is the subject-matter tracker in this source set.', '8'), reason('Breadth', 'NCSL helps identify related activity beyond education-only categories.', '5'), reason('Verification', 'Official state records control for bill language and status.', '9')],
    recommendation: 'Define the education topic and legislative session before comparing states; capture bill number, last action date, status and the official bill URL.',
  };

  if (/ordinance|municipal|county|city code|local law/.test(query)) return {
    heading: 'Search Municode and American Legal, then confirm the result with the issuing jurisdiction.',
    body: 'Municode and American Legal organize many city and county codes and are strong discovery tools. Because publication dates and supplements vary, check the code’s currency statement and confirm the relevant section, amendment and effective date on the city or county’s official website. Do not treat an aggregator copy as conclusive when the jurisdiction publishes a newer record.',
    citations: ['13', '14'], status: 'Local-law route · jurisdiction verification required', supported: true,
    metrics: [metric('01', 'Primary search', 'Municode', 'Local code library', 'Browse by state and jurisdiction', '13', 88), metric('02', 'Second search', 'AmLegal', 'Local code library', 'Alternative municipal coverage', '14', 74), metric('03', 'Final authority', 'Local', 'Official record', 'Confirm amendments and effective date', '13', 60)],
    reasons: [reason('Discovery', 'Both libraries let you locate municipal codes by state and jurisdiction.', '13'), reason('Currency', 'The publication or supplement date determines how current the text may be.', '14'), reason('Authority', 'The issuing city or county should confirm the operative ordinance.', '13')],
    recommendation: 'Record the jurisdiction, code section, ordinance number, adoption date, effective date and source URL. If currency is unclear, contact the clerk or code publisher before relying on the text.',
  };

  if (/ballot|election|measure/.test(query)) return {
    heading: 'Use Ballotpedia for orientation, then verify the measure through the state election or legislative authority.',
    body: 'Ballotpedia is useful for summaries and cross-state discovery. NCSL can add topic-specific policy context. Final wording, qualification status, fiscal notes and results should come from the responsible state election office, legislature or other official record.',
    citations: ['6', '5'], status: 'Discovery route · official election record required', supported: true,
    metrics: [metric('01', 'Overview', 'Ballotpedia', 'Measure summaries', 'Cross-state discovery and context', '6', 86), metric('02', 'Policy context', 'NCSL', 'Topic research', 'Related state policy activity', '5', 70), metric('03', 'Final authority', 'State', 'Election record', 'Official text, status and results', '6', 58)],
    reasons: [reason('Orientation', 'Ballotpedia provides accessible summaries and cross-state navigation.', '6'), reason('Context', 'NCSL can connect a measure to wider state policy trends.', '5'), reason('Verification', 'Official state records should support the final wording and status.', '6')],
    recommendation: 'Use the official measure text and fiscal analysis for any decision memo, and note the retrieval date because qualification and litigation status can change.',
  };

  if (/law|statute|bill|legislation|policy/.test(query)) return {
    heading: 'Track broadly with NCSL and LegiScan, but cite the official legislature for every legal conclusion.',
    body: 'NCSL offers curated topic databases, while LegiScan supports cross-state bill discovery and monitoring. Justia and FindLaw are useful secondary code lookups. The official state legislature website should be used to confirm bill text, amendments, history and codified law before a result is reported as current.',
    citations: ['5', '12', '9', '10', '11'], status: 'Legislative route · official text required', supported: true,
    metrics: [metric('01', 'Topic tracking', 'NCSL', 'Curated databases', 'Policy-specific state legislation', '5', 90), metric('02', 'Monitoring', 'LegiScan', 'Cross-state bills', 'Search and status discovery', '12', 75), metric('03', 'Final authority', 'Official', 'State legislature', 'Text, history and codified law', '9', 63)],
    reasons: [reason('Coverage', 'NCSL and LegiScan reduce the chance of missing relevant bills across states.', '5'), reason('Lookup', 'Justia and FindLaw are convenient secondary indexes for state codes.', '10'), reason('Authority', 'Official legislature records control when sources disagree.', '9')],
    recommendation: 'Set the topic, states, sessions and cutoff date. For each result, preserve the official bill URL, last action, enacted chapter or code section, and retrieval date.',
  };

  return {
    heading: 'This question needs a jurisdiction, policy topic and date before a defensible answer can be produced.',
    body: 'The source library can route fiscal, legislative, health, education and local-law research, but it should not invent a substantive conclusion from an underspecified prompt. Add the state or locality, the decision being made, and the date or legislative session.',
    citations: ['5', '4'], status: 'Scope needed · no policy conclusion generated', supported: false, metrics: [],
    reasons: [reason('Jurisdiction', 'State and local policy sources differ by issuing authority.', '5'), reason('Time', 'Budgets, bill status and code supplements change over time.', '4'), reason('Decision', 'The evidence depends on whether the task is comparison, tracking or legal verification.', '5')],
    recommendation: 'Try: “Compare enacted paid-leave laws in California and New York as of August 2026,” or “Can Colorado fund a recurring $100 million programme in FY2027?”',
  };
}

function Citation({ id }: { id: string }) {
  const source = sources.find((item) => item.id === id);
  if (!source) return null;
  return <a className="citation-link" href={source.url} aria-label={`Open source ${id}: ${source.title}`}>[{id}]</a>;
}

function Answer({ answer, thinking }: { answer: PolicyAnswer; thinking: boolean }) {
  if (thinking) return <article className="answer-card thinking"><div className="answer-head"><div className="adapt-avatar">A</div><div><p className="message-meta">AdapT is routing the question</p><span className="thinking-dots"><i /><i /><i /></span></div></div></article>;
  return <article className="answer-card">
    <div className="answer-head"><div className="adapt-avatar">A</div><div><p className="message-meta">AdapT insight <span>Just now</span></p><small>Source routing with authoritative verification</small></div></div>
    <div className="confidence-row"><span className="confidence"><i /> {answer.supported ? 'Research route ready' : 'More scope needed'}</span><span>{answer.status}</span></div>
    <h2>{answer.heading}</h2><p>{answer.body} {answer.citations.map((id) => <Citation id={id} key={id} />)}</p>
    {answer.metrics.length > 0 && <div className="priority-grid">{answer.metrics.map((item) => <div className="priority-card" key={item.label}><div><span className="rank">{item.rank}</span><strong>{item.label}</strong></div><b>{item.value}</b><small>{item.caption}</small><div className="meter"><span style={{ width: `${item.bar}%` }} /></div><p>{item.detail} <Citation id={item.source} /></p></div>)}</div>}
    {answer.reasons.length > 0 && <h3>Why this source order</h3>}
    {answer.reasons.length > 0 && <ul className="reason-list">{answer.reasons.map((item) => <li key={item.label}><span>{item.label}</span><p>{item.text} <Citation id={item.source} /></p></li>)}</ul>}
    {answer.recommendation && <div className="recommendation"><span className="recommendation-icon">↗</span><div><strong>Recommended next step</strong><p>{answer.recommendation}</p></div></div>}
    <div className="answer-actions"><button type="button">▣&nbsp; Add to brief</button><button type="button">⇩&nbsp; Export source plan</button><span /><button className="reaction" type="button" aria-label="Helpful">♡</button><button className="reaction" type="button" aria-label="Copy answer">▢</button></div>
  </article>;
}

export default function Home() {
  const initial = recentChats[0];
  const [prompt, setPrompt] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(initial.question);
  const [currentAnswer, setCurrentAnswer] = useState<PolicyAnswer>(() => answerForPrompt(initial.question));
  const [isThinking, setIsThinking] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(true);
  const [isNewChat, setIsNewChat] = useState(false);
  const [activeTitle, setActiveTitle] = useState(initial.title);
  const [activeRecent, setActiveRecent] = useState<string | null>(initial.id);

  function askQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const question = prompt.trim(); if (!question) return;
    setCurrentQuestion(question); setCurrentAnswer(answerForPrompt(question)); setActiveTitle(question.length > 42 ? `${question.slice(0, 42)}…` : question); setActiveRecent(null); setIsNewChat(false); setPrompt(''); setIsThinking(true); window.setTimeout(() => setIsThinking(false), 650);
  }
  function startNewChat() {
    setIsNewChat(true); setCurrentQuestion(''); setPrompt(''); setIsThinking(false); setTraceOpen(false); setActiveTitle('New policy question'); setActiveRecent(null); window.setTimeout(() => document.querySelector<HTMLTextAreaElement>('.composer textarea')?.focus(), 0);
  }
  function openRecentChat(chat: (typeof recentChats)[number]) {
    setActiveRecent(chat.id); setActiveTitle(chat.title); setCurrentQuestion(chat.question); setCurrentAnswer(answerForPrompt(chat.question)); setPrompt(''); setIsThinking(false); setIsNewChat(false); setTraceOpen(false); document.getElementById('conversation')?.scrollIntoView({ behavior: 'smooth' });
  }
  const displayedSources = isNewChat ? sources : sources.filter((source) => currentAnswer.citations.includes(source.id));
  const sourceCount = displayedSources.length;

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark" aria-hidden="true"><span /><span /><span /></div><div><strong>AdapT</strong><small>Policy intelligence</small></div></div>
      <button className="new-brief" type="button" onClick={startNewChat}><span>＋</span> New conversation</button>
      <nav aria-label="Primary navigation"><p className="nav-label">Workspace</p><a className="nav-item active" href="#conversation"><span className="nav-icon">⌁</span> Ask AdapT</a><a className="nav-item" href="#sources"><span className="nav-icon">▤</span> Evidence library <span className="count">15</span></a><a className="nav-item" href="#briefs"><span className="nav-icon">□</span> Saved briefs</a><p className="nav-label recent-label">Recent</p>{recentChats.map((chat) => <button className={`recent-item ${activeRecent === chat.id ? 'selected' : ''}`} type="button" key={chat.id} onClick={() => openRecentChat(chat)}>{chat.title}<small>{chat.time}</small></button>)}</nav>
      <div className="sidebar-footer"><div className="profile-avatar">AR</div><div><strong>Alex Rivera</strong><small>Policy Unit</small></div><button type="button" aria-label="Profile options">•••</button></div>
    </aside>
    <section className="workspace" id="conversation">
      <header className="topbar"><div><p>U.S. state & local policy workspace</p><h1>{activeTitle}</h1></div><div className="topbar-actions"><span className="demo-badge">Verified source links</span><span className="live-badge"><i /> Catalog checked Aug 2026</span><button className="icon-button" type="button" aria-label="More actions">•••</button><button className="share-button" type="button">↗&nbsp; Share brief</button></div></header>
      <div className={`conversation-wrap ${evidenceOpen ? '' : 'evidence-collapsed'}`}>
        <div className="conversation">
          {!isNewChat && <><div className="user-message"><div className="message-avatar">AR</div><div><p className="message-meta">You <span>Just now</span></p><p>{currentQuestion}</p></div></div><Answer answer={currentAnswer} thinking={isThinking} /></>}
          {isNewChat && <section className="empty-chat"><div className="empty-chat-mark">A</div><p>New conversation</p><h2>What state or local policy decision are you working through?</h2><span>Include the jurisdiction, policy topic and date. AdapT will route the question to the appropriate fiscal, legislative, health, education or legal sources.</span></section>}
          <div className="composer-block"><p className="suggestion-label">Continue exploring</p><div className="suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => { setPrompt(suggestion); window.setTimeout(() => document.querySelector<HTMLTextAreaElement>('.composer textarea')?.focus(), 0); }}>{suggestion} <span>→</span></button>)}</div><form className="composer" onSubmit={askQuestion}><textarea aria-label="Ask a policy question" placeholder="Ask about a U.S. state or local policy…" rows={1} value={prompt} onChange={(event) => setPrompt(event.target.value)} /><div className="composer-footer"><button type="button" className="attach-button" aria-label="Attach a document">＋</button><span>15 linked source portals</span><button type="submit" className="send-button" aria-label="Send question">↑</button></div></form><p className="disclaimer">AdapT routes research; verify consequential fiscal and legal conclusions in the cited official record.</p></div>
        </div>
        <aside className={`evidence-panel ${evidenceOpen ? '' : 'collapsed'}`} id="sources">
          <div className="evidence-header"><div><p>Evidence</p><span>{isNewChat ? '15 available sources' : `${sourceCount} cited ${sourceCount === 1 ? 'source' : 'sources'}`}</span></div><button type="button" aria-label={evidenceOpen ? 'Close evidence panel' : 'Open evidence panel'} onClick={() => setEvidenceOpen(!evidenceOpen)}>{evidenceOpen ? '×' : '‹'}</button></div>
          <div className="evidence-body"><div className={`coverage-card ${currentAnswer.supported || isNewChat ? '' : 'coverage-gap'}`}><div className="coverage-ring" style={{ background: `conic-gradient(${currentAnswer.supported || isNewChat ? '#337657' : '#c4933b'} 0 100%, #dbe9e0 100% 100%)` }}><span>{sourceCount || 15}</span></div><div><strong>{isNewChat ? 'Source catalog ready' : currentAnswer.supported ? 'Direct source route' : 'Scope required'}</strong><p>{isNewChat ? 'Ask a question to select the right sources.' : currentAnswer.supported ? 'Every citation opens the original portal.' : 'No substantive conclusion was generated.'}</p></div></div><p className="panel-label">{isNewChat ? 'Available source portals' : 'Cited in this answer'}</p><div className="source-list">{displayedSources.map((source) => <article className="source-card" id={`source-${source.id}`} key={source.id}><div className={`source-number ${source.color}`}>{source.id}</div><div className="source-copy"><span>{source.type}</span><strong>{source.title}</strong><small>{source.detail}</small></div><a href={source.url} aria-label={`Open ${source.title}`}>↗</a></article>)}</div><div className="method-card"><div className="method-icon">◎</div><div><strong>How this answer was built</strong><p>See how the question was classified and routed to authoritative and secondary sources.</p><button type="button" onClick={() => setTraceOpen(!traceOpen)}>{traceOpen ? 'Hide source trace ↑' : 'View source trace →'}</button></div></div>{traceOpen && <div className="reasoning-trace"><p><span>1</span> Classified the question by jurisdiction, topic and decision type.</p><p><span>2</span> Selected primary government data or official legal text where available.</p><p><span>3</span> Added specialist trackers for comparison and discovery.</p><p><span>4</span> Required official state or local verification for final conclusions.</p></div>}<div className="evidence-note"><strong>Evidence boundary</strong><p>Trackers and legal aggregators are discovery aids. Use the responsible government agency, legislature, election office or jurisdiction for final fiscal and legal verification.</p></div></div>
        </aside>
      </div>
    </section>
  </main>;
}
