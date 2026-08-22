'use client';

import { FormEvent, useState } from 'react';

const sources = [
  { id: '1', type: 'AdapT indicator', title: 'Heat exposure risk', detail: 'District scorecard · 2024', color: 'amber' },
  { id: '2', type: 'Policy document', title: 'State Heat Action Plan', detail: 'Section 4.2 · May 2024', color: 'blue' },
  { id: '3', type: 'Programme data', title: 'Urban Cooling Mission', detail: 'Implementation brief · 2023', color: 'green' },
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
    };
  }

  if (query.includes('coast') || query.includes('flood') || query.includes('cyclone')) {
    return {
      heading: 'Prioritise Odisha’s delta districts for near-term coastal adaptation support.',
      body: 'The available demo evidence points to the largest combined gap in exposure, vulnerable population and delivery capacity around Kendrapara and Jagatsinghpur. Sequence funding from early-warning coverage and resilient public facilities to longer-horizon drainage and shoreline measures.',
      citations: ['1', '2'], confidence: 'Moderate confidence · evidence years differ', supported: true,
    };
  }

  if (query.includes('fy27') || query.includes('budget') || query.includes('funding programme') || query.includes('allocate')) {
    return {
      heading: 'Use a two-stage FY27 allocation tied to both need and delivery milestones.',
      body: 'Reserve 60% of funding for risk-weighted population and 40% for implementation readiness. Release an initial planning tranche first, then unlock capital funding when districts verify target populations, responsible agencies and measurable twelve-month outcomes.',
      citations: ['2', '3'], confidence: 'High confidence · policy and programme sources agree', supported: true,
    };
  }

  if (query.includes('readiness') || query.includes('compare') || query.includes('state')) {
    return {
      heading: 'Gujarat leads on implementation readiness; Odisha shows the largest near-term opportunity.',
      body: 'Gujarat benefits from established heat-action governance and scalable pilots. Odisha has strong planning foundations but wider last-mile coverage gaps. Maharashtra sits between them: programme capacity is credible, though neighbourhood-level targeting needs improvement.',
      citations: ['2', '3'], confidence: 'Moderate confidence · 2 comparable sources', supported: true,
    };
  }

  if (query.includes('heat') || query.includes('district') || query.includes('priority') || query.includes('ahmedabad') || query.includes('nagpur')) {
    return {
      heading: 'Ahmedabad has the strongest immediate case, followed by Nagpur and Bhubaneswar.',
      body: 'Ahmedabad combines the largest exposed population with an implementation platform that can scale now. Nagpur has the widest programme-coverage gap, while Bhubaneswar faces the sharpest projected warming signal. Apply equity safeguards before final allocations.',
      citations: ['1', '2', '3'], confidence: 'High confidence · 3 source types agree', supported: true,
    };
  }

  return {
    heading: 'The current demo evidence cannot answer this reliably.',
    body: 'This prototype is grounded only in the three displayed demo sources, covering heat exposure, a state heat-action plan and an urban cooling programme. Add a relevant source or reframe the question around heat risk, adaptation readiness, cool roofs, coastal priorities or programme funding.',
    citations: [], confidence: 'Evidence limit · no supported claim', supported: false,
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

  function useSuggestion(suggestion: string) {
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
                  <div className="meter"><span style={{ width: '87%' }} /></div><p><em>1.9M</em> people at high risk <a href="#source-1">[1]</a></p>
                </div>
                <div className="priority-card">
                  <div><span className="rank">02</span><strong>Nagpur</strong></div><b>8.2</b><small>Priority score</small>
                  <div className="meter"><span style={{ width: '82%' }} /></div><p><em>38%</em> population lacks coverage <a href="#source-2">[2]</a></p>
                </div>
                <div className="priority-card">
                  <div><span className="rank">03</span><strong>Bhubaneswar</strong></div><b>7.9</b><small>Priority score</small>
                  <div className="meter"><span style={{ width: '79%' }} /></div><p><em>+1.8°C</em> projected by 2040 <a href="#source-1">[1]</a></p>
                </div>
              </div>

              <h3>Why these three</h3>
              <ul className="reason-list">
                <li><span>Exposure</span><p>All three are in the top decile for extreme-heat days and night-time heat retention. <a href="#source-1">[1]</a></p></li>
                <li><span>Equity</span><p>More than one-third of the exposed population lives in low-income or informal settlements. <a href="#source-2">[2]</a></p></li>
                <li><span>Feasibility</span><p>Existing cool-roof and early-warning pilots can absorb additional funding within 12 months. <a href="#source-3">[3]</a></p></li>
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
                      <p>{currentAnswer.body} {currentAnswer.citations.map((citation) => <a href={`#source-${citation}`} key={citation}>[{citation}] </a>)}</p>
                      <small className={currentAnswer.supported ? '' : 'evidence-limit'}><i /> {currentAnswer.confidence}</small>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="composer-block">
              <p className="suggestion-label">Continue exploring</p>
              <div className="suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => useSuggestion(suggestion)}>{suggestion} <span>→</span></button>)}</div>
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
                {sources.map((source) => (
                  <article className="source-card" id={`source-${source.id}`} key={source.id}>
                    <div className={`source-number ${source.color}`}>{source.id}</div>
                    <div className="source-copy"><span>{source.type}</span><strong>{source.title}</strong><small>{source.detail}</small></div>
                    <button type="button" aria-label={`Open ${source.title}`}>↗</button>
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
    </main>
  );
}
