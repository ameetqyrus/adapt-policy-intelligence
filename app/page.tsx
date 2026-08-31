'use client';

import { FormEvent, KeyboardEvent, MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import './interaction-fixes.css';

type Metric = { value: number | null; rank?: number; total?: number };
type Peer = { countyid: number; name: string; state: string; matchTier: string; rucc: number | null; economicType: string; similarWorkforce: boolean };
type County = { countyid: number; name: string; state: string; populationGroup: string; workers: number | null; metrics: Record<string, Metric>; peer: Peer | null };
type Source = { id: number; jurisdiction: string; title: string; detail: string; url: string; kind: string; countyids?: number[] };
type Theme = 'light' | 'dark';
type ChatMessage = { role: 'user' | 'assistant'; content: string; citations?: Array<{ title: string; url: string }> };

const DEFAULT_COUNTY = 42003;
const initialCounties: County[] = [
  { countyid: 42003, name: 'Allegheny County, PA', state: 'PA', populationGroup: '2nd most populated quartile (by people)', workers: 620629, metrics: { potential: { value: .13, rank: 19, total: 107 }, star_median2022: { value: 48014.2912, rank: 64, total: 110 }, star_emp_rate_2022: { value: 94.0055, rank: 77, total: 110 }, educ_pct_total_stloc2022: { value: .4396, rank: 62, total: 107 }, ppupil_deflate_2022: { value: 27771.2598, rank: 10, total: 110 }, pct_pred_emp_gain: { value: .2825, rank: 88, total: 107 }, pct_pred_emp_loss: { value: 2.9602, rank: 47, total: 106 } }, peer: { countyid: 49035, name: 'Salt Lake County', state: 'UT', matchTier: 'rucc_econtype_lowed', rucc: 1, economicType: 'Nonspecialized', similarWorkforce: true } },
  { countyid: 49035, name: 'Salt Lake County, UT', state: 'UT', populationGroup: '2nd most populated quartile (by people)', workers: 622248, metrics: { potential: { value: .0677, rank: 74, total: 107 }, star_median2022: { value: 50189.7944, rank: 54, total: 110 }, star_emp_rate_2022: { value: 96.9298, rank: 3, total: 110 }, educ_pct_total_stloc2022: { value: .3108, rank: 96, total: 107 }, ppupil_deflate_2022: { value: 13082.624, rank: 104, total: 110 }, pct_pred_emp_gain: { value: .5565, rank: 27, total: 107 }, pct_pred_emp_loss: { value: 4.4303, rank: 84, total: 106 } }, peer: { countyid: 42003, name: 'Allegheny County', state: 'PA', matchTier: 'rucc_econtype_lowed', rucc: 1, economicType: 'Nonspecialized', similarWorkforce: true } },
];

const sources: Source[] = [
  { id: 1, jurisdiction: 'ADAPT', title: 'ADAPT county model', detail: 'County metrics, population-group rankings and peer matching · data through 2022', kind: 'Model evidence', url: 'https://github.com/cgsp-georgetown/adapt-viz' },
  { id: 2, jurisdiction: 'Allegheny County', title: 'All In Allegheny Action Plan', detail: 'Education, workforce, youth and equitable economic-development priorities', kind: 'Official plan', url: 'https://www.alleghenycounty.us/Government/County-Executive/All-In-Allegheny-Action-Plan', countyids: [42003] },
  { id: 3, jurisdiction: 'Allegheny County', title: 'Allegheny Forward', detail: 'Countywide comprehensive planning for investment, infrastructure and growth', kind: 'Official plan', url: 'https://www.alleghenycounty.us/Projects-and-Initiatives/Economic-Development/Comprehensive-Plan', countyids: [42003] },
  { id: 4, jurisdiction: 'Salt Lake County', title: 'Regional Economic Development', detail: 'Business development, workforce development and entrepreneurship', kind: 'Official programme', url: 'https://www.saltlakecounty.gov/regional-development/', countyids: [49035] },
  { id: 5, jurisdiction: 'Salt Lake County', title: 'WISE workforce programme', detail: 'Workforce training and wraparound support for lower-income residents', kind: 'Official performance report', url: 'https://www.saltlakecounty.gov/globalassets/1-site-files/arpa/recovery-plan/2025--slco-arpa-slfrf-recovery-plan-performance-report-final.pdf', countyids: [49035] },
  { id: 6, jurisdiction: 'Salt Lake County', title: 'A New Perspective for Prosperity', detail: 'Peer benchmarking and target-industry research for long-term prosperity', kind: 'Official research', url: 'https://www.saltlakecounty.gov/regional-development/economic-development/research/', countyids: [49035] },
];

const questions = ['Why is this peer performing differently?', 'Compare education and workforce investment', 'What practices should this county investigate?', 'What should we avoid copying?'];
const metricOrder = ['potential', 'star_median2022', 'star_emp_rate_2022', 'educ_pct_total_stloc2022', 'ppupil_deflate_2022'];
const metricLabels: Record<string, string> = {
  potential: 'American Dream potential',
  star_median2022: 'Non-college median wage',
  star_emp_rate_2022: 'Non-college employment rate',
  educ_pct_total_stloc2022: 'Education share of local spending',
  ppupil_deflate_2022: 'Per-pupil K-12 spending',
};

function formatMetric(key: string, value: number | null) {
  if (value === null) return 'Not available';
  if (key === 'star_median2022' || key === 'ppupil_deflate_2022') return `$${Math.round(value).toLocaleString()}`;
  if (key === 'star_emp_rate_2022' || key === 'educ_pct_total_stloc2022') return `${key === 'educ_pct_total_stloc2022' ? (value * 100).toFixed(1) : value.toFixed(1)}%`;
  return value.toFixed(3);
}

function compactName(name: string) { return name.replace(/ County, [A-Z]{2}$/, ''); }

function metricWidth(value: number | null, comparison: number | null) {
  if (value === null) return 0;
  const maximum = Math.max(Math.abs(value), Math.abs(comparison ?? 0), 0.0001);
  return Math.max(6, Math.round((Math.abs(value) / maximum) * 100));
}

function SourceLink({ id }: { id: number }) {
  const source = sources.find((item) => item.id === id);
  if (!source) return null;
  return <a className="citation" href={source.url} target="_blank" rel="noreferrer" aria-label={`Open source ${id}: ${source.title}`}>[{id}]</a>;
}

function CountyPicker({ id, label, counties, value, onChange }: { id: string; label: string; counties: County[]; value: number; onChange: (countyid: number) => void }) {
  const selected = counties.find((county) => county.countyid === value);
  const [query, setQuery] = useState(selected?.name ?? '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return counties.slice(0, 18);
    return counties.filter((county) => {
      const fips = String(county.countyid).padStart(5, '0');
      return county.name.toLowerCase().includes(needle) || county.state.toLowerCase().includes(needle) || fips.includes(needle);
    }).slice(0, 18);
  }, [counties, query]);

  function choose(county: County) {
    setQuery(county.name);
    setOpen(false);
    onChange(county.countyid);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, Math.max(matches.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter' && open && matches[activeIndex]) {
      event.preventDefault();
      choose(matches[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setQuery(selected?.name ?? '');
    }
  }

  const listId = `${id}-results`;
  return <div className="picker-field">
    <label htmlFor={id}>{label}</label>
    <div className="county-search-wrap">
      <span className="county-search-icon" aria-hidden="true">⌕</span>
      <input
        id={id}
        className="county-search-input"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && matches[activeIndex] ? `${id}-option-${matches[activeIndex].countyid}` : undefined}
        autoComplete="off"
        value={query}
        onFocus={(event) => { event.currentTarget.select(); setActiveIndex(0); setOpen(true); }}
        onBlur={() => window.setTimeout(() => { setOpen(false); setQuery(selected?.name ?? ''); }, 120)}
        onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder="Search county, state, or FIPS"
      />
      {open && <div className="county-results" id={listId} role="listbox">
        {matches.length ? matches.map((county, index) => <button
          id={`${id}-option-${county.countyid}`}
          className={`county-option${index === activeIndex ? ' active' : ''}${county.countyid === value ? ' selected' : ''}`}
          type="button"
          role="option"
          aria-selected={county.countyid === value}
          key={county.countyid}
          onMouseEnter={() => setActiveIndex(index)}
          onMouseDown={(event) => { event.preventDefault(); choose(county); }}
        ><span>{county.name}</span><small>FIPS {String(county.countyid).padStart(5, '0')}</small></button>) : <p className="county-empty">No matching county. Try a county name, state code, or FIPS.</p>}
      </div>}
    </div>
  </div>;
}

function buildAnswer(home: County, peer: County, prompt: string) {
  const lower = prompt.toLowerCase();
  const homeWage = home.metrics.star_median2022?.value;
  const peerWage = peer.metrics.star_median2022?.value;
  const homeEmployment = home.metrics.star_emp_rate_2022?.value;
  const peerEmployment = peer.metrics.star_emp_rate_2022?.value;
  const peerAhead = (peerWage ?? 0) > (homeWage ?? 0) || (peerEmployment ?? 0) > (homeEmployment ?? 0);
  const isAvoid = /avoid|mistake|shouldn't|should not/.test(lower);
  const isInvestment = /education|workforce|spend|investment|budget/.test(lower);
  const isEmployment = /employment|employ|job|jobs|hiring|retention|labor|labour/.test(lower);
  const isWage = /wage|pay|income|earning|salary/.test(lower);
  const isPractice = /practice|policy|programme|program|investigate|copy|learn/.test(lower);
  const employmentGap = (peerEmployment ?? 0) - (homeEmployment ?? 0);
  const wageGap = (peerWage ?? 0) - (homeWage ?? 0);
  const emphasis = isAvoid
    ? 'Treat programmes as candidates for investigation, not recipes. Different state powers, tax structures and delivery partners can make a policy non-transferable.'
    : isEmployment
      ? `The ${Math.abs(employmentGap).toFixed(1)} percentage-point employment difference is a signal to investigate participant pathways, employer demand and retention—not evidence of one proven cause.`
    : isWage
      ? `The ${formatMetric('star_median2022', Math.abs(wageGap))} wage difference helps focus the inquiry on occupation mix, industry demand and job quality, while ADAPT alone cannot identify the cause.`
    : isInvestment
      ? 'The data show spending and outcome differences, while the official plans show how each county is organizing workforce delivery. That is a useful research lead, but it is not proof that one programme caused the outcome gap.'
      : 'The comparison points to a focused policy investigation: workforce pathways, target-industry strategy and implementation capacity—not a generic search across every county policy.';
  const title = isAvoid
    ? `Do not copy ${compactName(peer.name)} wholesale; test whether its delivery model transfers.`
    : isEmployment
      ? `${compactName(peer.name)}’s employment rate is ${employmentGap >= 0 ? 'higher' : 'lower'} by ${Math.abs(employmentGap).toFixed(1)} percentage points.`
    : isWage
      ? `${compactName(peer.name)}’s non-college median wage is ${wageGap >= 0 ? 'higher' : 'lower'} by ${formatMetric('star_median2022', Math.abs(wageGap))}.`
    : isInvestment
      ? 'Education spending differs sharply, but spending alone does not explain the workforce outcome gap.'
      : isPractice
        ? `Three parts of ${compactName(peer.name)}’s approach merit a closer implementation review.`
        : peerAhead
          ? `${compactName(peer.name)} has stronger current wage or employment outcomes, but the explanation is not a single spending number.`
          : 'The peer comparison is mixed; neither county is uniformly stronger across ADAPT’s indicators.';
  const recommendation = isAvoid
    ? `Screen every candidate practice for legal authority, target population, delivery capacity and cost before considering it for ${compactName(home.name)}.`
    : isEmployment
      ? 'Compare sector-level hiring demand, programme completion, placement within 90 days and 12-month retention before attributing the employment difference to policy.'
    : isWage
      ? 'Compare occupation mix, wage floors, target industries and advancement outcomes for workers without four-year degrees.'
    : isInvestment
      ? 'Compare where education and workforce dollars go—not only the totals—and connect each programme to completion, placement and retention measures.'
      : `Compare programme eligibility, delivery partners, cost per participant and measured employment retention before recommending transfer to ${compactName(home.name)}.`;
  return {
    title,
    summary: `${compactName(home.name)} and ${compactName(peer.name)} are paired by ADAPT because they have similar starting conditions. ${emphasis}`,
    findings: [
      `${compactName(home.name)}: non-college median wage ${formatMetric('star_median2022', homeWage)} and employment rate ${formatMetric('star_emp_rate_2022', homeEmployment)}.`,
      `${compactName(peer.name)}: non-college median wage ${formatMetric('star_median2022', peerWage)} and employment rate ${formatMetric('star_emp_rate_2022', peerEmployment)}.`,
      'The counties devote different shares and amounts to education, but ADAPT does not establish a causal relationship between spending and later outcomes.',
    ],
    recommendation,
  };
}

function AiChat({ context }: { context: Record<string, unknown> }) {
  const [apiKey, setApiKey] = useState('');
  const [keyDraft, setKeyDraft] = useState('');
  const [model, setModel] = useState('gpt-5.6-luna');
  const [research, setResearch] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedKey = window.sessionStorage.getItem('adapt-openai-key') ?? '';
    const storedModel = window.sessionStorage.getItem('adapt-openai-model') ?? 'gpt-5.6-luna';
    // Browser-tab configuration is restored only after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApiKey(storedKey);
    setKeyDraft(storedKey);
    setModel(storedModel);
  }, []);

  function connectKey(event: FormEvent) {
    event.preventDefault();
    const clean = keyDraft.trim();
    if (!clean.startsWith('sk-')) { setError('Enter an OpenAI API key beginning with sk-.'); return; }
    window.sessionStorage.setItem('adapt-openai-key', clean);
    window.sessionStorage.setItem('adapt-openai-model', model);
    setApiKey(clean);
    setError('');
  }

  function disconnectKey() {
    window.sessionStorage.removeItem('adapt-openai-key');
    setApiKey('');
    setKeyDraft('');
    setMessages([]);
    setError('');
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const clean = message.trim();
    if (!clean || loading || !apiKey) return;
    const prior = messages.map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: 'user', content: clean }]);
    setMessage('');
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-openai-key': apiKey },
        body: JSON.stringify({ model, research, message: clean, history: prior, context }),
      });
      const result = await response.json() as { text?: string; citations?: Array<{ title: string; url: string }>; error?: string };
      if (!response.ok || !result.text) throw new Error(result.error || 'OpenAI could not answer this question.');
      setMessages((current) => [...current, { role: 'assistant', content: result.text!, citations: result.citations }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'OpenAI could not answer this question.');
    } finally {
      setLoading(false);
    }
  }

  return <section className="ai-chat" aria-label="AI follow-up conversation">
    <header className="ai-chat-head"><div><small>OPENAI-POWERED FOLLOW-UP</small><h2>Chat about this answer</h2><p>The AI receives this county pair, its metrics, the baseline answer, and prior turns.</p></div><span className={apiKey ? 'connected' : ''}>{apiKey ? '● Connected for this tab' : 'Key required'}</span></header>
    {!apiKey ? <form className="ai-key-form" onSubmit={connectKey}>
      <div><label htmlFor="openai-key">OpenAI API key</label><input id="openai-key" type="password" autoComplete="off" value={keyDraft} onChange={(event) => setKeyDraft(event.target.value)} placeholder="sk-…" /></div>
      <div><label htmlFor="openai-model">Model</label><select id="openai-model" value={model} onChange={(event) => setModel(event.target.value)}><option value="gpt-5.6-luna">GPT-5.6 Luna · lowest cost</option><option value="gpt-5.6-terra">GPT-5.6 Terra · balanced</option><option value="gpt-5.6-sol">GPT-5.6 Sol · strongest</option><option value="gpt-5.4-mini">GPT-5.4 Mini · compatibility</option></select></div>
      <button type="submit">Connect key</button>
      <p>Your key stays in this browser tab’s session storage and is sent only to this site’s server and OpenAI for each chat request. Use a restricted project key. <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">Manage keys ↗</a></p>
      {error && <div className="ai-error" role="alert">{error}</div>}
    </form> : <>
      <div className="ai-controls"><label><input type="checkbox" checked={research} onChange={(event) => setResearch(event.target.checked)} /> Allow official-web research <span>May add tool usage cost</span></label><div><strong>{model}</strong><button type="button" onClick={disconnectKey}>Disconnect key</button></div></div>
      {!messages.length && <div className="ai-starters"><button type="button" onClick={() => setMessage('Explain the strongest evidence behind this answer and the biggest uncertainty.')}>Evidence and uncertainty</button><button type="button" onClick={() => setMessage('What should a county official investigate next before acting on this comparison?')}>Next investigation</button><button type="button" onClick={() => setMessage('Challenge the baseline answer. What alternative explanations fit these metrics?')}>Challenge the answer</button></div>}
      <div className="ai-messages" aria-live="polite">{messages.map((item, index) => <div className={`ai-message ${item.role}`} key={`${item.role}-${index}`}><small>{item.role === 'user' ? 'YOU' : 'AI POLICY ANALYST'}</small><p>{item.content}</p>{item.citations && item.citations.length > 0 && <div className="ai-citations">{item.citations.map((citation) => <a href={citation.url} target="_blank" rel="noreferrer" key={citation.url}>{citation.title} ↗</a>)}</div>}</div>)}{loading && <div className="ai-message assistant thinking"><small>AI POLICY ANALYST</small><p>Reviewing the comparison and evidence…</p></div>}</div>
      {error && <div className="ai-error" role="alert">{error}</div>}
      <form className="ai-composer" onSubmit={sendMessage}><textarea aria-label="Ask an AI follow-up" rows={2} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask a follow-up about this answer…" /><button type="submit" disabled={!message.trim() || loading}>{loading ? '…' : 'Ask AI'}</button></form>
      <p className="ai-disclaimer">AI can make mistakes. Verify policy claims in the linked primary sources; county comparisons do not establish causation.</p>
    </>}
  </section>;
}

export default function Home() {
  const [counties, setCounties] = useState<County[]>(initialCounties);
  const [homeId, setHomeId] = useState(DEFAULT_COUNTY);
  const [peerOverride, setPeerOverride] = useState<number | null>(null);
  const [prompt, setPrompt] = useState(questions[0]);
  const [asked, setAsked] = useState<string | null>(questions[0]);
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [theme, setTheme] = useState<Theme>('light');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [responseVersion, setResponseVersion] = useState(0);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLElement>(null);
  const countyById = useMemo(() => new Map(counties.map((county) => [county.countyid, county])), [counties]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('adapt-theme');
    const preferredTheme: Theme = storedTheme === 'dark' || storedTheme === 'light'
      ? storedTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    // Theme preference is browser-only state and is synchronized after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(preferredTheme);
    document.documentElement.dataset.theme = preferredTheme;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('adapt-theme', theme);
  }, [theme]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedQuestion = params.get('question');
    if (requestedQuestion) {
      // URL state is browser-only and is synchronized after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrompt(requestedQuestion);
      setAsked(requestedQuestion);
    }
    fetch('/data/county-context.json')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('County context unavailable')))
      .then((bundle: { counties: County[] }) => {
        const loaded = new Map(bundle.counties.map((county) => [county.countyid, county]));
        setCounties(bundle.counties);
        const requestedCounty = Number(params.get('county'));
        const requestedPeer = Number(params.get('peer'));
        if (loaded.has(requestedCounty)) setHomeId(requestedCounty);
        if (loaded.has(requestedPeer)) setPeerOverride(requestedPeer);
        setCatalogStatus('ready');
      })
      .catch(() => setCatalogStatus('error'));
  }, []);

  const home = countyById.get(homeId) ?? countyById.get(DEFAULT_COUNTY)!;
  const computedPeer = home.peer ? countyById.get(home.peer.countyid) : undefined;
  const peer = (peerOverride ? countyById.get(peerOverride) : computedPeer) ?? countyById.get(49035)!;
  const answer = useMemo(() => asked ? buildAnswer(home, peer, asked) : null, [home, peer, asked]);
  const pairHasCuratedEvidence = new Set([home.countyid, peer.countyid]).size === 2
    && [42003, 49035].every((countyid) => countyid === home.countyid || countyid === peer.countyid);
  const displayedSources = sources.filter((source) => !source.countyids || source.countyids.some((countyid) => countyid === home.countyid || countyid === peer.countyid));
  const aiContext = answer ? {
    home: { countyid: home.countyid, name: home.name, populationGroup: home.populationGroup, workers: home.workers },
    peer: { countyid: peer.countyid, name: peer.name, selection: peerOverride ? 'manual comparison' : 'ADAPT computed peer', match: home.peer },
    submittedQuestion: asked,
    baselineAnswer: answer,
    metrics: metricOrder.map((key) => ({ key, label: metricLabels[key], home: home.metrics[key] ?? null, peer: peer.metrics[key] ?? null })),
    curatedSources: displayedSources.map(({ id, jurisdiction, title, detail, kind, url }) => ({ id, jurisdiction, title, detail, kind, url })),
    evidenceBoundary: pairHasCuratedEvidence ? 'Curated narrative is available for this pair.' : 'No approved county-specific policy narrative is connected for this pair.',
  } : null;
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('county', String(home.countyid).padStart(5, '0'));
    if (peerOverride) params.set('peer', String(peer.countyid).padStart(5, '0'));
    if (asked) params.set('question', asked);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
  }, [home.countyid, peer.countyid, peerOverride, asked]);

  function submitQuestion(nextPrompt = prompt) {
    const clean = nextPrompt.trim();
    if (!clean) return;
    setPrompt(clean);
    setAsked(clean);
    setSelectedPreset(null);
    setResponseVersion((current) => current + 1);
    window.setTimeout(() => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  }
  function choosePreset(question: string) {
    setPrompt(question);
    setSelectedPreset(question);
    window.setTimeout(() => composerRef.current?.focus(), 0);
  }
  function ask(event: FormEvent) { event.preventDefault(); submitQuestion(); }
  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitQuestion();
    }
  }
  function startNewQuestion() {
    setPrompt('');
    setAsked(null);
    setSelectedPreset(null);
    window.setTimeout(() => composerRef.current?.focus(), 0);
  }

  function prepareBriefing(event: ReactMouseEvent<HTMLAnchorElement>) {
    const reportQuestion = asked || prompt.trim() || questions[0];
    const reportAnswer = buildAnswer(home, peer, reportQuestion);
    const payload = {
      home: { countyid: home.countyid, name: home.name },
      peer: { countyid: peer.countyid, name: peer.name, mode: peerOverride ? 'Manual comparison' : 'ADAPT computed peer' },
      question: reportQuestion,
      answer: reportAnswer,
      metrics: metricOrder.map((key) => ({ label: metricLabels[key], home: formatMetric(key, home.metrics[key]?.value ?? null), peer: formatMetric(key, peer.metrics[key]?.value ?? null) })),
      sources: displayedSources.map(({ title, jurisdiction, kind, url }) => ({ title, jurisdiction, kind, url })),
    };
    event.currentTarget.href = `/briefing?payload=${encodeURIComponent(JSON.stringify(payload))}`;
  }

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span>A</span><div><strong>AdapT</strong><small>County intelligence</small></div></div>
      <button className="new-question" type="button" onClick={startNewQuestion}>＋ New question</button>
      <nav><p>Workspace</p><a className="active" href="#comparison">⌁ County comparison</a><a href="#evidence">▤ Evidence <span>{displayedSources.length}</span></a><a href="#method">◎ Method</a></nav>
      <div className="sidebar-note"><strong>ADAPT-connected</strong><p>Quantitative context comes from the county model. Policy claims stay linked to their original source.</p></div>
    </aside>

    <section className="workspace" id="comparison">
      <header className="topbar"><div><small>AMERICAN DREAM ACHIEVABILITY PROGRESS TRACKER</small><h1>Peer-county policy intelligence</h1></div><div className="top-actions"><span className={`verified ${catalogStatus}`}>● {catalogStatus === 'ready' ? `${counties.length.toLocaleString()} counties loaded` : catalogStatus === 'error' ? 'County catalog unavailable' : 'Loading county catalog…'}</span><button className="theme-toggle" type="button" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} aria-pressed={theme === 'dark'} onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}>{theme === 'light' ? '◐ Dark' : '☀ Light'}</button><a className="download-briefing" href="data:text/plain,Preparing%20briefing" download={`adapt-briefing-${String(home.countyid).padStart(5, '0')}-${String(peer.countyid).padStart(5, '0')}.html`} onClick={prepareBriefing}>↓ Download briefing</a></div></header>
      <div className="content-grid">
        <section className="conversation">
          <div className="context-card">
            <div className="context-title"><div><small>HOME COUNTY</small><h2>{home.name}</h2></div><CountyPicker key={`home-${homeId}`} id="home-county" label="Change county" counties={counties} value={homeId} onChange={(countyid) => { setHomeId(countyid); setPeerOverride(null); }} /></div>
            <div className="peer-line"><span>↔</span><div><small>{peerOverride ? 'MANUAL COMPARISON' : 'ADAPT COMPUTED PEER'}</small><strong>{peer.name}</strong><p>{home.peer?.economicType || 'Comparable economic structure'} · RUCC {home.peer?.rucc ?? 'n/a'} · similar workforce size</p>{peerOverride && <button className="restore-peer" type="button" onClick={() => setPeerOverride(null)}>Use ADAPT computed peer</button>}</div><CountyPicker key={`peer-${peer.countyid}`} id="peer-county" label="Compare" counties={counties} value={peer.countyid} onChange={setPeerOverride} /></div>
            <p className="method-note">Peers are matched on rural–urban classification, economic type, education classification and closest 2022 workforce size. Manual comparisons are clearly labelled.</p>
          </div>

          <div className="metric-grid">{metricOrder.map((key) => {
            const homeValue = home.metrics[key]?.value ?? null;
            const peerValue = peer.metrics[key]?.value ?? null;
            return <div className="metric-card" key={key}><small>{metricLabels[key]}</small><div className="metric-number"><strong>{formatMetric(key, homeValue)}</strong><span>vs {formatMetric(key, peerValue)}</span></div><div className="micro-chart" aria-label={`${metricLabels[key]} comparison`}><div><i style={{ width: `${metricWidth(homeValue, peerValue)}%` }} /><em>{compactName(home.name)}</em></div><div><i style={{ width: `${metricWidth(peerValue, homeValue)}%` }} /><em>{compactName(peer.name)}</em></div></div><p>{home.metrics[key]?.rank ? `Rank ${home.metrics[key].rank}/${home.metrics[key].total} in population group` : 'Comparable county measure'}</p></div>;
          })}</div>
          {asked ? <><div className="question"><span>AD</span><div><small>YOUR QUESTION</small><p>{asked}</p></div></div>
          <article className="answer-card" aria-live="polite" ref={answerRef} tabIndex={-1} key={`${home.countyid}-${peer.countyid}-${asked}-${responseVersion}`}>
            <div className="answer-head"><span>A</span><div><small>ADAPT-GROUNDED ANALYSIS</small><p>Model facts + official county evidence</p></div></div>
            <div className="answer-context">Updated for {compactName(home.name)} ↔ {compactName(peer.name)}</div>
            <div className="confidence">Evidence boundary active · comparison, not causal attribution</div>
            <h2>{answer!.title}</h2><p>{answer!.summary} <SourceLink id={1} /></p>
            <h3>What the comparison shows</h3><ul>{answer!.findings.map((finding) => <li key={finding}>{finding} <SourceLink id={1} /></li>)}</ul>
            {pairHasCuratedEvidence ? <div className="policy-grid"><div><small>ALLEGHENY</small><strong>Current direction</strong><p>All In Allegheny connects education, youth investment, workforce development and equitable growth. <SourceLink id={2} /> The county is also developing a comprehensive investment framework. <SourceLink id={3} /></p></div><div><small>SALT LAKE</small><strong>Practices to investigate</strong><p>Salt Lake County combines regional economic-development research with workforce programmes that track training completion, hiring and retention. <SourceLink id={4} /> <SourceLink id={5} /> <SourceLink id={6} /></p></div></div> : <div className="policy-grid evidence-gap"><div><small>{compactName(home.name).toUpperCase()}</small><strong>Official evidence needed</strong><p>The ADAPT comparison is available, but an approved county source catalog has not yet been connected for this jurisdiction.</p></div><div><small>{compactName(peer.name).toUpperCase()}</small><strong>No policy claim generated</strong><p>Add official plans, budgets, programme evaluations and legislation before drawing a substantive conclusion.</p></div></div>}
            <div className="recommendation"><strong>Recommended next step</strong><p>{answer!.recommendation}</p></div>
          </article>{aiContext && <AiChat key={`${home.countyid}-${peer.countyid}-${asked}`} context={aiContext} />}</> : <div className="empty-answer" aria-live="polite"><strong>Start a new county question</strong><p>Choose a prompt below or write your own. Press Enter to submit; Shift + Enter adds a new line.</p></div>}
          <div className="suggestions">{questions.map((question) => <button className={selectedPreset === question ? 'selected' : ''} type="button" aria-pressed={selectedPreset === question} key={question} onClick={() => choosePreset(question)}>{question} →</button>)}</div>
          {selectedPreset && <p className="preset-hint" role="status">Preset selected — press Send to update the analysis.</p>}
          <form className="composer" onSubmit={ask}><textarea ref={composerRef} aria-label="Ask a county policy question" rows={2} value={prompt} onKeyDown={handleComposerKeyDown} onChange={(event) => { setPrompt(event.target.value); setSelectedPreset(null); }} placeholder={`Ask about ${compactName(home.name)} and ${compactName(peer.name)}…`} /><button type="submit" aria-label="Send question" disabled={!prompt.trim()}>↑</button></form>
        </section>

        <aside className="evidence-panel" id="evidence"><div className="evidence-heading"><div><small>EVIDENCE</small><h2>{displayedSources.length} connected sources</h2></div><span>Verified links</span></div><div className="source-list">{displayedSources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.id}><span>{source.id}</span><div><small>{source.jurisdiction} · {source.kind}</small><strong>{source.title}</strong><p>{source.detail}</p></div><b>↗</b></a>)}</div><div className="method-card" id="method"><strong>How this answer is built</strong><ol><li>Load the selected ADAPT county and peer.</li><li>Separate model facts from policy evidence.</li><li>Route to official county sources.</li><li>Flag causal and transferability limits.</li></ol></div></aside>
      </div>
    </section>
  </main>;
}
