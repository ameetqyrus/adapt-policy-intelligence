'use client';

import { FormEvent, useState } from 'react';

const sources = [
  { id: '1', type: 'AdapT indicator', title: 'Heat exposure risk', detail: 'District scorecard · 2024', color: 'amber', excerpt: 'Ahmedabad records the largest absolute population exposed to high heat risk. Nagpur and Bhubaneswar show faster growth in extreme-heat days and night-time heat retention.', location: 'District profiles · Heat exposure and sensitivity' },
  { id: '2', type: 'Policy document', title: 'State Heat Action Plan', detail: 'Section 4.2 · May 2024', color: 'blue', excerpt: 'Prioritisation should combine exposure, vulnerable population and delivery readiness. Funding releases should be tied to named agencies, coverage targets and annual review.', location: 'Section 4.2 · Resource allocation' },
  { id: '3', type: 'Programme data', title: 'Urban Cooling Mission', detail: 'Implementation brief · 2023', color: 'green', excerpt: 'Cool-roof and early-warning pilots can expand within twelve months where roof surveys, municipal delivery teams and community outreach partners are already in place.', location: 'Pages 18–22 · Scale-up conditions' },
  { id: '4', type: 'Risk atlas', title: 'Coastal vulnerability atlas', detail: 'District profiles · 2024', color: 'blue', excerpt: 'Kendrapara and Jagatsinghpur combine high cyclone exposure, low-lying settlements and infrastructure-service disruption. Early warning and resilient public facilities offer the fastest risk reduction.', location: 'Odisha coast · District comparison' },
  { id: '5', type: 'Funding guidance', title: 'Climate finance framework', detail: 'FY27 guidance note', color: 'amber', excerpt: 'A needs-based allocation should be paired with a delivery gate. Planning support can precede capital release, but later tranches require verified beneficiaries and measurable outcomes.', location: 'Part 3 · Allocation and disbursement' },
  { id: '6', type: 'AdapT indicator', title: 'Adaptation readiness index', detail: 'State comparison · 2025', color: 'green', excerpt: 'Gujarat leads on operational capacity and programme continuity. Odisha has strong planning foundations with last-mile coverage gaps; Maharashtra performs near the median across both dimensions.', location: 'State scorecards · Readiness components' },
];

const suggestions = [
  'Which districts need heat-action funding first?',
  'Compare adaptation readiness across states',
  'What evidence supports cool-roof programmes?',
];

type PolicyAnswer = {
  heading: string;
  body: string;
  citations: string[];
  confidence: string;
  supported: boolean;
  metrics: Array<{ rank: string; label: string; value: string; caption: string; detail: string; source: string; bar: number }>;
  reasons: Array<{ label: string; text: string; source: string }>;
  recommendation: string;
};

const recentChats = [
  { id: 'heat', title: 'Heat resilience priorities', time: '12 min ago', question: 'Which districts should we prioritise for heat adaptation funding, and why?' },
  { id: 'coastal', title: 'Coastal district comparison', time: 'Yesterday', question: 'Which coastal districts need adaptation support most urgently?' },
  { id: 'fy27', title: 'FY27 programme options', time: '3 days ago', question: 'How should we structure the FY27 adaptation funding programme?' },
];

function answerForPrompt(question: string): PolicyAnswer {
  const query = question.toLowerCase();

  if (query.includes('cool roof') || query.includes('cool-roof')) {
    return {
      heading: 'The strongest evidence supports targeted cool-roof programmes, not universal roll-out.',
      body: 'The programme brief shows the clearest near-term case in dense, low-income neighbourhoods with high night-time heat retention. Start with public buildings and informal-settlement clusters, require pre-installation roof surveys, and measure indoor temperature reduction before expansion.',
      citations: ['1', '3'], confidence: 'High confidence · 2 directly supporting sources', supported: true,
      metrics: [
        { rank: '01', label: 'Ahmedabad', value: '2.1°C', caption: 'Potential reduction', detail: 'Modelled indoor peak', source: '3', bar: 88 },
        { rank: '02', label: 'Nagpur', value: '38%', caption: 'Coverage gap', detail: 'Priority households', source: '2', bar: 78 },
        { rank: '03', label: 'Bhubaneswar', value: '14', caption: 'Pilot-ready wards', detail: 'Can start this year', source: '3', bar: 70 },
      ],
      reasons: [
        { label: 'Impact', text: 'Benefits are largest where roof exposure and night-time heat overlap.', source: '1' },
        { label: 'Equity', text: 'Targeting low-income clusters avoids subsidising households already able to adapt.', source: '2' },
        { label: 'Delivery', text: 'Existing municipal pilots reduce procurement and mobilisation time.', source: '3' },
      ],
      recommendation: 'Fund a twelve-month targeted phase, publish indoor-temperature results, then expand only where measured benefits clear the programme threshold.',
    };
  }

  if (query.includes('coast') || query.includes('flood') || query.includes('cyclone')) {
    return {
      heading: 'Prioritise Odisha’s delta districts for near-term coastal adaptation support.',
      body: 'The available demo evidence points to the largest combined gap in exposure, vulnerable population and delivery capacity around Kendrapara and Jagatsinghpur. Sequence funding from early-warning coverage and resilient public facilities to longer-horizon drainage and shoreline measures.',
      citations: ['4', '6'], confidence: 'Moderate confidence · evidence years differ', supported: true,
      metrics: [
        { rank: '01', label: 'Kendrapara', value: '8.9', caption: 'Priority score', detail: 'High compound risk', source: '4', bar: 89 },
        { rank: '02', label: 'Jagatsinghpur', value: '8.4', caption: 'Priority score', detail: 'Critical assets exposed', source: '4', bar: 84 },
        { rank: '03', label: 'Puri', value: '7.6', caption: 'Priority score', detail: 'Seasonal population risk', source: '6', bar: 76 },
      ],
      reasons: [
        { label: 'Exposure', text: 'Low-lying settlements face overlapping cyclone, surge and drainage risks.', source: '4' },
        { label: 'Services', text: 'Disruption to health, water and evacuation networks magnifies household risk.', source: '4' },
        { label: 'Readiness', text: 'Planning capacity exists, but last-mile coverage remains uneven.', source: '6' },
      ],
      recommendation: 'Start with early-warning coverage and resilient public facilities; gate larger infrastructure funding on district-level maintenance plans.',
    };
  }

  if (query.includes('fy27') || query.includes('budget') || query.includes('funding programme') || query.includes('allocate')) {
    return {
      heading: 'Use a two-stage FY27 allocation tied to both need and delivery milestones.',
      body: 'Reserve 60% of funding for risk-weighted population and 40% for implementation readiness. Release an initial planning tranche first, then unlock capital funding when districts verify target populations, responsible agencies and measurable twelve-month outcomes.',
      citations: ['5', '6'], confidence: 'High confidence · finance and readiness sources agree', supported: true,
      metrics: [
        { rank: '01', label: 'Risk allocation', value: '60%', caption: 'Needs-based share', detail: 'Population-weighted', source: '5', bar: 84 },
        { rank: '02', label: 'Readiness gate', value: '40%', caption: 'Delivery share', detail: 'Milestone-linked', source: '6', bar: 72 },
        { rank: '03', label: 'First review', value: '6 mo', caption: 'Release checkpoint', detail: 'Verify outcomes', source: '5', bar: 62 },
      ],
      reasons: [
        { label: 'Fairness', text: 'A risk-weighted base directs money toward people facing the greatest exposure.', source: '5' },
        { label: 'Delivery', text: 'A readiness component prevents allocations from stalling in low-capacity pipelines.', source: '6' },
        { label: 'Learning', text: 'Staged release creates an early point to correct targets and programme design.', source: '5' },
      ],
      recommendation: 'Issue a planning tranche immediately, then release capital funding only when districts verify beneficiaries, accountable agencies and twelve-month outcomes.',
    };
  }

  if (query.includes('readiness') || query.includes('compare') || query.includes('state')) {
    return {
      heading: 'Gujarat leads on implementation readiness; Odisha shows the largest near-term opportunity.',
      body: 'Gujarat benefits from established heat-action governance and scalable pilots. Odisha has strong planning foundations but wider last-mile coverage gaps. Maharashtra sits between them: programme capacity is credible, though neighbourhood-level targeting needs improvement.',
      citations: ['2', '6'], confidence: 'Moderate confidence · 2 comparable sources', supported: true,
      metrics: [
        { rank: '01', label: 'Gujarat', value: '8.6', caption: 'Readiness score', detail: 'Scale now', source: '6', bar: 86 },
        { rank: '02', label: 'Odisha', value: '7.8', caption: 'Readiness score', detail: 'Close coverage gaps', source: '6', bar: 78 },
        { rank: '03', label: 'Maharashtra', value: '7.2', caption: 'Readiness score', detail: 'Improve targeting', source: '2', bar: 72 },
      ],
      reasons: [
        { label: 'Governance', text: 'Gujarat has the clearest continuity of ownership and operating routines.', source: '2' },
        { label: 'Opportunity', text: 'Odisha can translate mature plans into wider last-mile programme coverage.', source: '6' },
        { label: 'Targeting', text: 'Maharashtra needs stronger neighbourhood-level beneficiary definition.', source: '6' },
      ],
      recommendation: 'Use differentiated support: scale capital in Gujarat, pair funding with delivery assistance in Odisha, and fund targeting improvements in Maharashtra.',
    };
  }

  if (query.includes('heat') || query.includes('district') || query.includes('priority') || query.includes('ahmedabad') || query.includes('nagpur')) {
    return {
      heading: 'Prioritise Ahmedabad, Nagpur and Bhubaneswar in the first funding tranche.',
      body: 'These districts combine very high heat exposure with large populations in informal settlements and relatively low local adaptation capacity. Ahmedabad has the highest absolute population at risk, while Nagpur and Bhubaneswar show the sharpest gap between projected exposure and current programme coverage.',
      citations: ['1', '2', '3'], confidence: 'High confidence · 3 source types agree', supported: true,
      metrics: [
        { rank: '01', label: 'Ahmedabad', value: '8.7', caption: 'Priority score', detail: '1.9M people at high risk', source: '1', bar: 87 },
        { rank: '02', label: 'Nagpur', value: '8.2', caption: 'Priority score', detail: '38% lacks coverage', source: '2', bar: 82 },
        { rank: '03', label: 'Bhubaneswar', value: '7.9', caption: 'Priority score', detail: '+1.8°C projected', source: '1', bar: 79 },
      ],
      reasons: [
        { label: 'Exposure', text: 'All three are in the top decile for extreme-heat days and night-time heat retention.', source: '1' },
        { label: 'Equity', text: 'More than one-third of the exposed population lives in low-income or informal settlements.', source: '2' },
        { label: 'Feasibility', text: 'Existing cool-roof and early-warning pilots can absorb additional funding within twelve months.', source: '3' },
      ],
      recommendation: 'Allocate 60% of the first tranche by risk-weighted population and 40% against implementation-ready milestones.',
    };
  }

  return {
    heading: 'The current demo evidence cannot answer this reliably.',
    body: 'This prototype is grounded only in the three displayed demo sources, covering heat exposure, a state heat-action plan and an urban cooling programme. Add a relevant source or reframe the question around heat risk, adaptation readiness, cool roofs, coastal priorities or programme funding.',
    citations: [], confidence: 'Evidence limit · no supported claim', supported: false,
    metrics: [], reasons: [], recommendation: '',
  };
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(true);
  const [isNewChat, setIsNewChat] = useState(false);
  const [activeTitle, setActiveTitle] = useState('Heat resilience priorities');
  const [activeRecent, setActiveRecent] = useState<string | null>('heat');
  const [currentAnswer, setCurrentAnswer] = useState<PolicyAnswer>(() => answerForPrompt('heat priorities'));
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  function askQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPrompt = prompt.trim();
    if (!nextPrompt) return;
    setFollowUp(nextPrompt);
    setCurrentAnswer(answerForPrompt(nextPrompt));
    setActiveTitle(nextPrompt.length > 42 ? `${nextPrompt.slice(0, 42)}…` : nextPrompt);
    setActiveRecent(null);
    setPrompt('');
    setIsThinking(true);
    window.setTimeout(() => setIsThinking(false), 850);
  }

  function applySuggestion(suggestion: string) {
    setPrompt(suggestion);
    window.setTimeout(() => document.querySelector<HTMLTextAreaElement>('.composer textarea')?.focus(), 0);
  }

  function startNewChat() {
    setIsNewChat(true);
    setFollowUp('');
    setPrompt('');
    setIsThinking(false);
    setTraceOpen(false);
    setActiveTitle('New policy question');
    setActiveRecent(null);
    window.setTimeout(() => document.querySelector<HTMLTextAreaElement>('.composer textarea')?.focus(), 0);
  }

  function openRecentChat(chat: (typeof recentChats)[number]) {
    setActiveRecent(chat.id);
    setActiveTitle(chat.title);
    setPrompt('');
    setIsThinking(false);
    setTraceOpen(false);
    if (chat.id === 'heat') {
      setIsNewChat(false);
      setFollowUp('');
    } else {
      setIsNewChat(true);
      setFollowUp(chat.question);
      setCurrentAnswer(answerForPrompt(chat.question));
    }
    document.getElementById('conversation')?.scrollIntoView({ behavior: 'smooth' });
  }

  const hasSupportedAnswer = !followUp || currentAnswer.supported;
  const citedSourceCount = followUp ? currentAnswer.citations.length : 3;
  const coveragePercent = hasSupportedAnswer ? (citedSourceCount === 3 ? 92 : 84) : 0;
  const displayedSources = followUp && currentAnswer.supported
    ? sources.filter((source) => currentAnswer.citations.includes(source.id))
    : followUp ? sources : sources.slice(0, 3);
  const selectedSource = sources.find((source) => source.id === selectedSourceId);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div><strong>AdapT</strong><small>Policy intelligence</small></div>
        </div>
        <button className="new-brief" type="button" onClick={startNewChat}><span>＋</span> New conversation</button>
        <nav aria-label="Primary navigation">
          <p className="nav-label">Workspace</p>
          <a className="nav-item active" href="#conversation"><span className="nav-icon">⌁</span> Ask AdapT</a>
          <a className="nav-item" href="#sources"><span className="nav-icon">▤</span> Evidence library <span className="count">18</span></a>
          <a className="nav-item" href="#briefs"><span className="nav-icon">□</span> Saved briefs</a>
          <p className="nav-label recent-label">Recent</p>
          {recentChats.map((chat) => (
            <button className={`recent-item ${activeRecent === chat.id ? 'selected' : ''}`} type="button" key={chat.id} onClick={() => openRecentChat(chat)}>
              {chat.title}<small>{chat.time}</small>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="profile-avatar">AR</div>
          <div><strong>Ananya Rao</strong><small>Policy Unit</small></div>
          <button type="button" aria-label="Profile options">•••</button>
        </div>
      </aside>

      <section className="workspace" id="conversation">
        <header className="topbar">
          <div><p>Policy workspace</p><h1>{activeTitle}</h1></div>
          <div className="topbar-actions">
            <span className="demo-badge">Demo evidence</span>
            <span className="live-badge"><i /> Data updated Jun 2025</span>
            <button className="icon-button" type="button" aria-label="More actions">•••</button>
            <button className="share-button" type="button">↗&nbsp; Share brief</button>
          </div>
        </header>

        <div className={`conversation-wrap ${evidenceOpen ? '' : 'evidence-collapsed'}`}>
          <div className="conversation">
            {!isNewChat && <>
              <div className="user-message">
                <div className="message-avatar">AR</div>
                <div><p className="message-meta">You <span>10:42 AM</span></p><p>Which districts should we prioritise for heat adaptation funding, and why?</p></div>
              </div>

              <article className="answer-card">
              <div className="answer-head">
                <div className="adapt-avatar">A</div>
                <div><p className="message-meta">AdapT insight <span>10:42 AM</span></p><small>Analysed 18 sources across 6 indicators</small></div>
              </div>
              <div className="confidence-row"><span className="confidence"><i /> High confidence</span><span>Evidence agrees across 3 source types</span></div>
              <h2>Prioritise Ahmedabad, Nagpur and Bhubaneswar in the first funding tranche.</h2>
              <p>These districts combine <strong>very high heat exposure</strong> with large populations in informal settlements and relatively low local adaptation capacity. Ahmedabad has the highest absolute population at risk, while Nagpur and Bhubaneswar show the sharpest gap between projected exposure and current programme coverage.</p>

              <div className="priority-grid">
                <div className="priority-card">
                  <div><span className="rank">01</span><strong>Ahmedabad</strong></div><b>8.7</b><small>Priority score</small>
                  <div className="meter"><span style={{ width: '87%' }} /></div><p><em>1.9M</em> people at high risk <button className="citation-link" type="button" onClick={() => setSelectedSourceId('1')}>[1]</button></p>
                </div>
                <div className="priority-card">
                  <div><span className="rank">02</span><strong>Nagpur</strong></div><b>8.2</b><small>Priority score</small>
                  <div className="meter"><span style={{ width: '82%' }} /></div><p><em>38%</em> population lacks coverage <button className="citation-link" type="button" onClick={() => setSelectedSourceId('2')}>[2]</button></p>
                </div>
                <div className="priority-card">
                  <div><span className="rank">03</span><strong>Bhubaneswar</strong></div><b>7.9</b><small>Priority score</small>
                  <div className="meter"><span style={{ width: '79%' }} /></div><p><em>+1.8°C</em> projected by 2040 <button className="citation-link" type="button" onClick={() => setSelectedSourceId('1')}>[1]</button></p>
                </div>
              </div>

              <h3>Why these three</h3>
              <ul className="reason-list">
                <li><span>Exposure</span><p>All three are in the top decile for extreme-heat days and night-time heat retention. <button className="citation-link" type="button" onClick={() => setSelectedSourceId('1')}>[1]</button></p></li>
                <li><span>Equity</span><p>More than one-third of the exposed population lives in low-income or informal settlements. <button className="citation-link" type="button" onClick={() => setSelectedSourceId('2')}>[2]</button></p></li>
                <li><span>Feasibility</span><p>Existing cool-roof and early-warning pilots can absorb additional funding within 12 months. <button className="citation-link" type="button" onClick={() => setSelectedSourceId('3')}>[3]</button></p></li>
              </ul>

              <div className="recommendation"><span className="recommendation-icon">↗</span><div><strong>Recommended next step</strong><p>Allocate 60% of the first tranche by risk-weighted population and 40% against implementation-ready milestones.</p></div></div>
              <div className="answer-actions">
                <button type="button">▣&nbsp; Add to brief</button><button type="button">⇩&nbsp; Export table</button><span />
                <button className="reaction" type="button" aria-label="Helpful">♡</button><button className="reaction" type="button" aria-label="Copy answer">▢</button>
              </div>
              </article>
            </>}

            {isNewChat && !followUp && (
              <section className="empty-chat">
                <div className="empty-chat-mark">A</div>
                <p>New conversation</p>
                <h2>What policy decision are you working through?</h2>
                <span>Ask about priorities, compare places, or test a programme option against the available evidence.</span>
              </section>
            )}

            {followUp && (
              <div className="follow-up-thread" aria-live="polite">
                <div className="follow-up-question"><div className="message-avatar">AR</div><div><p className="message-meta">You <span>Just now</span></p><p>{followUp}</p></div></div>
                <div className={`follow-up-answer ${isThinking ? 'thinking' : ''}`}>
                  <div className="adapt-avatar">A</div>
                  {isThinking ? (
                    <div><p className="message-meta">AdapT is checking the evidence</p><span className="thinking-dots"><i /><i /><i /></span></div>
                  ) : (
                    <div>
                      <p className="message-meta">AdapT insight <span>Just now</span></p>
                      <h3>{currentAnswer.heading}</h3>
                      <p>{currentAnswer.body} {currentAnswer.citations.map((citation) => <button className="citation-link" type="button" onClick={() => setSelectedSourceId(citation)} key={citation}>[{citation}]</button>)}</p>
                      {currentAnswer.metrics.length > 0 && (
                        <div className="priority-grid dynamic-priority-grid">
                          {currentAnswer.metrics.map((metric) => (
                            <div className="priority-card" key={metric.label}>
                              <div><span className="rank">{metric.rank}</span><strong>{metric.label}</strong></div><b>{metric.value}</b><small>{metric.caption}</small>
                              <div className="meter"><span style={{ width: `${metric.bar}%` }} /></div><p>{metric.detail} <button className="citation-link" type="button" onClick={() => setSelectedSourceId(metric.source)}>[{metric.source}]</button></p>
                            </div>
                          ))}
                        </div>
                      )}
                      {currentAnswer.reasons.length > 0 && <h4>Why this recommendation</h4>}
                      {currentAnswer.reasons.length > 0 && (
                        <ul className="reason-list dynamic-reasons">
                          {currentAnswer.reasons.map((reason) => <li key={reason.label}><span>{reason.label}</span><p>{reason.text} <button className="citation-link" type="button" onClick={() => setSelectedSourceId(reason.source)}>[{reason.source}]</button></p></li>)}
                        </ul>
                      )}
                      {currentAnswer.recommendation && <div className="recommendation"><span className="recommendation-icon">↗</span><div><strong>Recommended next step</strong><p>{currentAnswer.recommendation}</p></div></div>}
                      <small className={currentAnswer.supported ? '' : 'evidence-limit'}><i /> {currentAnswer.confidence}</small>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="composer-block">
              <p className="suggestion-label">Continue exploring</p>
              <div className="suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => applySuggestion(suggestion)}>{suggestion} <span>→</span></button>)}</div>
              <form className="composer" onSubmit={askQuestion}>
                <textarea aria-label="Ask a policy question" placeholder="Ask a follow-up about the evidence…" rows={1} value={prompt} onChange={(event) => setPrompt(event.target.value)} />
                <div className="composer-footer"><button type="button" className="attach-button" aria-label="Attach a document">＋</button><span>AdapT data + 18 documents</span><button type="submit" className="send-button" aria-label="Send question">↑</button></div>
              </form>
              <p className="disclaimer">AdapT can make mistakes. Verify critical decisions against the cited sources.</p>
            </div>
          </div>

          <aside className={`evidence-panel ${evidenceOpen ? '' : 'collapsed'}`} id="sources">
            <div className="evidence-header"><div><p>Evidence</p><span>{citedSourceCount} cited {citedSourceCount === 1 ? 'source' : 'sources'}</span></div><button type="button" aria-label={evidenceOpen ? 'Close evidence panel' : 'Open evidence panel'} onClick={() => setEvidenceOpen(!evidenceOpen)}>{evidenceOpen ? '×' : '‹'}</button></div>
            <div className="evidence-body">
              <div className={`coverage-card ${hasSupportedAnswer ? '' : 'coverage-gap'}`}><div className="coverage-ring" style={{ background: `conic-gradient(${hasSupportedAnswer ? '#337657' : '#c4933b'} 0 ${coveragePercent}%, #dbe9e0 ${coveragePercent}% 100%)` }}><span>{coveragePercent}<small>%</small></span></div><div><strong>{hasSupportedAnswer ? 'Strong coverage' : 'Evidence gap'}</strong><p>{hasSupportedAnswer ? 'Key claims are directly supported.' : 'No current source supports this question.'}</p></div></div>
              <p className="panel-label">{hasSupportedAnswer ? 'Cited in this answer' : 'Available demo sources'}</p>
              <div className="source-list">
                {displayedSources.map((source) => (
                  <article className="source-card" id={`source-${source.id}`} key={source.id}>
                    <div className={`source-number ${source.color}`}>{source.id}</div>
                    <div className="source-copy"><span>{source.type}</span><strong>{source.title}</strong><small>{source.detail}</small></div>
                    <button type="button" aria-label={`Open ${source.title}`} onClick={() => setSelectedSourceId(source.id)}>↗</button>
                  </article>
                ))}
              </div>
              <div className="method-card"><div className="method-icon">◎</div><div><strong>How this answer was built</strong><p>See how indicators were weighted and claims matched to evidence.</p><button type="button" onClick={() => setTraceOpen(!traceOpen)}>{traceOpen ? 'Hide reasoning trace ↑' : 'View reasoning trace →'}</button></div></div>
              {traceOpen && <div className="reasoning-trace"><p><span>1</span> Retrieved district-level heat, vulnerability and readiness indicators.</p><p><span>2</span> Normalised six measures to a common 0–10 scale.</p><p><span>3</span> Matched each recommendation to a document passage or programme record.</p><p><span>4</span> Flagged limits where reporting periods differ.</p></div>}
              <div className="evidence-note"><strong>Evidence boundary</strong><p>Scores are comparative, not forecasts. District values use the latest available reporting period and may differ in source years.</p></div>
            </div>
          </aside>
        </div>
      </section>
      {selectedSource && (
        <div className="source-dialog-backdrop" role="presentation" onClick={() => setSelectedSourceId(null)}>
          <section className="source-dialog" role="dialog" aria-modal="true" aria-labelledby="source-dialog-title" onClick={(event) => event.stopPropagation()}>
            <div className="source-dialog-head">
              <div className={`source-number ${selectedSource.color}`}>{selectedSource.id}</div>
              <div><span>{selectedSource.type}</span><h2 id="source-dialog-title">{selectedSource.title}</h2><p>{selectedSource.detail}</p></div>
              <button type="button" aria-label="Close source preview" onClick={() => setSelectedSourceId(null)}>×</button>
            </div>
            <div className="source-location"><span>Referenced location</span><strong>{selectedSource.location}</strong></div>
            <blockquote>“{selectedSource.excerpt}”</blockquote>
            <div className="source-dialog-note"><strong>Demo source preview</strong><p>This prototype does not yet have the original document attached. Replace this preview with a verified document URL or uploaded source before using the evidence in a policy decision.</p></div>
          </section>
        </div>
      )}
    </main>
  );
}
