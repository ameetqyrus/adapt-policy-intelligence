'use client';

import { FormEvent, KeyboardEvent, MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import './interaction-fixes.css';

type Metric = { value: number | null; rank?: number; total?: number };
type Peer = { countyid: number; name: string; state: string; matchTier: string; rucc: number | null; economicType: string; similarWorkforce: boolean };
type County = { countyid: number; name: string; state: string; populationGroup: string; workers: number | null; metrics: Record<string, Metric>; peer: Peer | null };
type Source = { id: number; jurisdiction: string; title: string; detail: string; url: string; kind: string; countyids?: number[] };
type Theme = 'light' | 'dark';
type ChatMessage = { role: 'user' | 'assistant'; content: string; citations?: Array<{ title: string; url: string }> };
type CountyProfile = { population: number; populationChange: number; broadband: number; bachelors: number; laborForce: number; commute: number; householdIncome: number; poverty: number; establishments: number; employment: number; sourceId: number };

const DEFAULT_COUNTY = 39149;
const initialCounties: County[] = [
  { countyid: 39149, name: 'Shelby County, OH', state: 'OH', populationGroup: '4th most populated quartile (by people)', workers: 22792, metrics: { potential: { value: .0149, rank: 2454, total: 2666 }, star_median2022: { value: 49704.2212, rank: 428, total: 2671 }, star_emp_rate_2022: { value: 97.9734, rank: 144, total: 2671 }, educ_pct_total_stloc2022: { value: .4628, rank: 1547, total: 2670 }, ppupil_deflate_2022: { value: 18577.7246 }, pct_pred_emp_gain: { value: .1767 }, pct_pred_emp_loss: { value: 3.5875 } }, peer: { countyid: 39011, name: 'Auglaize County', state: 'OH', matchTier: 'rucc_econtype_lowed', rucc: 4, economicType: 'Manufacturing', similarWorkforce: true } },
  { countyid: 39011, name: 'Auglaize County, OH', state: 'OH', populationGroup: '4th most populated quartile (by people)', workers: 22571, metrics: { potential: { value: .0374 }, star_median2022: { value: 50967.7255 }, star_emp_rate_2022: { value: 97.54 }, educ_pct_total_stloc2022: { value: .3983 }, ppupil_deflate_2022: { value: 20923.8379 }, pct_pred_emp_gain: { value: -1.3758 }, pct_pred_emp_loss: { value: 3.306 } }, peer: { countyid: 39149, name: 'Shelby County', state: 'OH', matchTier: 'rucc_econtype_lowed', rucc: 4, economicType: 'Manufacturing', similarWorkforce: true } },
];

const sources: Source[] = [
  { id: 1, jurisdiction: 'ADAPT', title: 'ADAPT county model', detail: 'County metrics, population-group rankings and peer matching · data through 2022', kind: 'Model evidence', url: 'https://github.com/cgsp-georgetown/adapt-viz' },
  { id: 2, jurisdiction: 'Shelby County', title: 'U.S. Census QuickFacts', detail: 'Population, income, education, broadband, business and workforce indicators', kind: 'Official statistics', url: 'https://www.census.gov/quickfacts/fact/table/shelbycountyohio/PST045225', countyids: [39149] },
  { id: 3, jurisdiction: 'Auglaize County', title: 'U.S. Census QuickFacts', detail: 'Population, income, education, broadband, business and workforce indicators', kind: 'Official statistics', url: 'https://www.census.gov/quickfacts/fact/table/auglaizecountyohio/PST045225', countyids: [39011] },
  { id: 4, jurisdiction: 'Ohio', title: 'OhioLMI County Economic Profiles', detail: 'County industry, employment, unemployment and wage context', kind: 'State labor data', url: 'https://ohiolmi.com/Home/Dashboards/CountyEconomicProfiles', countyids: [39149, 39011] },
  { id: 5, jurisdiction: 'United States', title: 'BEA GDP by County', detail: 'Official county GDP and industry contribution data', kind: 'Official statistics', url: 'https://www.bea.gov/data/gdp/gdp-county', countyids: [39149, 39011] },
  { id: 6, jurisdiction: 'United States', title: 'BLS Quarterly Census of Employment and Wages', detail: 'Establishment, employment and wage data by county and industry', kind: 'Official statistics', url: 'https://www.bls.gov/cew/data.htm', countyids: [39149, 39011] },
  { id: 7, jurisdiction: 'Global', title: 'Future of Jobs Report 2025', detail: 'Employer scenarios for job creation, displacement and skills through 2030', kind: 'Scenario evidence', url: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/2-jobs-outlook/', countyids: [39149, 39011] },
  { id: 8, jurisdiction: 'Global', title: 'Generative AI and Jobs: 2025 Update', detail: 'Task-level exposure gradients and the distinction between transformation and redundancy', kind: 'Research evidence', url: 'https://www.ilo.org/publications/generative-ai-and-jobs-2025-update', countyids: [39149, 39011] },
  { id: 9, jurisdiction: 'United States', title: 'Generative AI and the future of work in America', detail: 'Occupation transitions, workforce mobility and adoption scenarios', kind: 'Research evidence', url: 'https://www.mckinsey.com/mgi/our-research/generative-ai-and-the-future-of-work-in-america', countyids: [39149, 39011] },
  { id: 10, jurisdiction: 'Global', title: 'Gen-AI: Artificial Intelligence and the Future of Work', detail: 'Exposure, complementarity, inequality and adaptation uncertainty', kind: 'Research evidence', url: 'https://www.elibrary.imf.org/view/journals/006/2024/001/article-A001-en.xml', countyids: [39149, 39011] },
  { id: 11, jurisdiction: 'United States', title: 'How will AI affect the US labor market?', detail: 'National task-automation estimates and transition scenarios', kind: 'Research evidence', url: 'https://www.goldmansachs.com/insights/articles/how-will-ai-affect-the-us-labor-market', countyids: [39149, 39011] },
  { id: 12, jurisdiction: 'Global', title: 'OECD Employment Outlook 2026', detail: 'Place-sensitive responses to technology and labor-market shocks', kind: 'Policy evidence', url: 'https://www.oecd.org/en/publications/oecd-employment-outlook-2026_7e710f54-en.html', countyids: [39149, 39011] },
  { id: 13, jurisdiction: 'Global', title: 'The Impact of Robots on Employment and Jobs', detail: 'Research overview on industrial robotics and employment', kind: 'Research evidence', url: 'https://ifr.org/papers/the-impact-of-robots-on-employment-and-jobs', countyids: [39149, 39011] },
  { id: 14, jurisdiction: 'Global', title: 'Anthropic Economic Index', detail: 'Survey evidence on worker experience and expectations as aggregate data lag adoption', kind: 'Emerging evidence', url: 'https://www.anthropic.com/research/economic-index-survey-announcement', countyids: [39149, 39011] },
  { id: 15, jurisdiction: 'Allegheny County', title: 'All In Allegheny Action Plan', detail: 'Education, workforce, youth and equitable economic-development priorities', kind: 'Official plan', url: 'https://www.alleghenycounty.us/Government/County-Executive/All-In-Allegheny-Action-Plan', countyids: [42003] },
  { id: 16, jurisdiction: 'Allegheny County', title: 'Allegheny Forward', detail: 'Countywide comprehensive planning for investment, infrastructure and growth', kind: 'Official plan', url: 'https://www.alleghenycounty.us/Projects-and-Initiatives/Economic-Development/Comprehensive-Plan', countyids: [42003] },
  { id: 17, jurisdiction: 'Salt Lake County', title: 'Regional Economic Development', detail: 'Business development, workforce development and entrepreneurship', kind: 'Official programme', url: 'https://www.saltlakecounty.gov/regional-development/', countyids: [49035] },
  { id: 18, jurisdiction: 'Salt Lake County', title: 'WISE workforce programme', detail: 'Workforce training and wraparound support for lower-income residents', kind: 'Official performance report', url: 'https://www.saltlakecounty.gov/globalassets/1-site-files/arpa/recovery-plan/2025--slco-arpa-slfrf-recovery-plan-performance-report-final.pdf', countyids: [49035] },
  { id: 19, jurisdiction: 'Salt Lake County', title: 'A New Perspective for Prosperity', detail: 'Peer benchmarking and target-industry research for long-term prosperity', kind: 'Official research', url: 'https://www.saltlakecounty.gov/regional-development/economic-development/research/', countyids: [49035] },
];

const questions = ['Why is this peer performing differently?', 'Compare education and workforce investment', 'What practices should this county investigate?', 'What should we avoid copying?', 'Economic prosperity', 'Employment and workforce', 'Population and talent attraction', 'What could AI automate in this county?', 'What is the potential impact of AI and humanoid robots?', 'What could the workforce look like in 2030?'];
const countyProfiles: Record<number, CountyProfile> = {
  39149: { population: 48065, populationChange: -.4, broadband: 92.5, bachelors: 21.4, laborForce: 65.5, commute: 19.0, householdIncome: 73978, poverty: 8.9, establishments: 989, employment: 24487, sourceId: 2 },
  39011: { population: 45909, populationChange: -1.1, broadband: 87.8, bachelors: 21.6, laborForce: 66.3, commute: 18.8, householdIncome: 78660, poverty: 7.0, establishments: 992, employment: 23217, sourceId: 3 },
};
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
  const isAi = /automation|automate|artificial intelligence|\bai\b|robot|humanoid|2030|future of work/.test(lower);
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
  if (isAi) return {
    title: `The local AI impact is uncertain; ${compactName(home.name)} should prepare for task transformation and worker transitions.`,
    summary: `${compactName(home.name)} and ${compactName(peer.name)} are similar-workforce manufacturing counties. Public research can identify plausible exposure pathways, but it cannot yet produce a defensible county job-loss forecast.`,
    findings: [
      'Routine documentation, scheduling, inventory support and some quality-control tasks are practical candidates for investigation—not claims that whole occupations will disappear.',
      'ILO task-level evidence indicates transformation is generally more likely than wholesale redundancy, while exposure and the capacity to adapt differ across workers and places.',
      'Global 2030 scenarios show simultaneous job creation and displacement. Those figures are directional context, not a forecast for either Ohio county.',
    ],
    recommendation: `Build a local occupation-and-task inventory using OhioLMI and BLS QCEW, validate it with employers and educators, then track adoption, training, placement and retention quarterly.`,
  };
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

function AiImpactSection({ home, peer }: { home: County; peer: County }) {
  return <section className="ai-impact" id="ai-impact">
    <header className="ai-impact-head"><div><small>AI IMPACT SCENARIO LENS</small><h2>AI, automation & humanoid robots</h2><p>How to prepare when county-specific adoption and impact data do not yet exist.</p></div><span>Not a county forecast</span></header>
    <div className="ai-impact-grid">
      <article><span>01</span><small>TASKS TO INVESTIGATE</small><h3>Start with work, not job titles</h3><ul><li>Routine documentation and reporting</li><li>Scheduling, inventory and maintenance support</li><li>Visual inspection and quality control</li><li>Material handling, picking and packing</li></ul></article>
      <article><span>02</span><small>WHAT MAY CHANGE BY 2030</small><h3>Transformation and displacement can coexist</h3><p>ILO evidence points more often to transformed work than whole-job redundancy. WEF scenarios show both growing and declining roles, especially across technology and clerical work. <SourceLink id={8} /> <SourceLink id={7} /></p></article>
      <article><span>03</span><small>HOW TO PREPARE</small><h3>Turn uncertainty into a local learning system</h3><ul><li>Map occupations to tasks with OhioLMI and QCEW <SourceLink id={4} /> <SourceLink id={6} /></li><li>Interview employers about actual adoption</li><li>Offer short-cycle, employer-validated training</li><li>Monitor transitions, placement and retention</li></ul></article>
    </div>
    <div className="known-unknown"><div><small>WHAT WE KNOW</small><strong>A comparable manufacturing pair</strong><p>{compactName(home.name)} and {compactName(peer.name)} are mutual ADAPT peers with similar workforce sizes. Census indicators provide a starting view of skills, participation and digital access. <SourceLink id={1} /> <SourceLink id={2} /> <SourceLink id={3} /></p></div><div><small>WHAT WE DO NOT KNOW</small><strong>The timing and net local effect</strong><p>Firm adoption, task exposure, investment timing and worker transitions are not measured county forecasts. IMF, OECD and Anthropic all reinforce the need to monitor adaptation rather than overstate certainty. <SourceLink id={10} /> <SourceLink id={12} /> <SourceLink id={14} /></p></div></div>
    <footer><strong>Planning implication</strong><p>We cannot promise whether AI will create or remove more local jobs. We can identify exposed tasks, build transition capacity and update the strategy as evidence arrives.</p></footer>
  </section>;
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
      .then((response) => response.ok ? response.json() as Promise<{counties:County[]}> : Promise.reject(new Error('County context unavailable')))
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
  const peer = (peerOverride ? countyById.get(peerOverride) : computedPeer) ?? countyById.get(39011)!;
  const answer = useMemo(() => asked ? buildAnswer(home, peer, asked) : null, [home, peer, asked]);
  const pairIsShelbyAuglaize = new Set([home.countyid, peer.countyid]).size === 2
    && [39149, 39011].every((countyid) => countyid === home.countyid || countyid === peer.countyid);
  const pairIsLegacyDemo = new Set([home.countyid, peer.countyid]).size === 2
    && [42003, 49035].every((countyid) => countyid === home.countyid || countyid === peer.countyid);
  const pairHasCuratedEvidence = pairIsShelbyAuglaize || pairIsLegacyDemo;
  const answerIsAi = Boolean(asked && /automation|automate|artificial intelligence|\bai\b|robot|humanoid|2030|future of work/i.test(asked));
  const homeProfile = countyProfiles[home.countyid];
  const peerProfile = countyProfiles[peer.countyid];
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
      <nav><p>Workspace</p><a className="active" href="#comparison">⌁ County comparison</a><a href="#ai-impact">◇ AI impact</a><a href="#evidence">▤ Evidence <span>{displayedSources.length}</span></a><a href="#method">◎ Method</a></nav>
      <div className="sidebar-note"><strong>ADAPT-CONNECTED</strong><p>Quantitative context comes from the county model. Policy and scenario claims stay linked to their original source.</p></div>
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
          {homeProfile && peerProfile && <section className="demo-profile"><header><div><small>EXPANDED COUNTY PROFILE</small><h2>Six lenses for the county conversation</h2></div><span>Census QuickFacts · mixed reference periods</span></header><div className="profile-grid">
            <article><small>ECONOMIC PROSPERITY</small><strong>${homeProfile.householdIncome.toLocaleString()} <i>vs ${peerProfile.householdIncome.toLocaleString()}</i></strong><p>Median household income; poverty {homeProfile.poverty}% vs {peerProfile.poverty}%. <SourceLink id={homeProfile.sourceId} /> <SourceLink id={peerProfile.sourceId} /></p></article>
            <article><small>EMPLOYMENT & WORKFORCE</small><strong>{homeProfile.laborForce}% <i>vs {peerProfile.laborForce}%</i></strong><p>Civilian labor-force participation; employer employment {homeProfile.employment.toLocaleString()} vs {peerProfile.employment.toLocaleString()}. <SourceLink id={homeProfile.sourceId} /> <SourceLink id={peerProfile.sourceId} /></p></article>
            <article><small>EDUCATION & HUMAN CAPITAL</small><strong>{homeProfile.bachelors}% <i>vs {peerProfile.bachelors}%</i></strong><p>Bachelor’s degree or higher; ADAPT education-spending context appears above. <SourceLink id={1} /> <SourceLink id={homeProfile.sourceId} /> <SourceLink id={peerProfile.sourceId} /></p></article>
            <article><small>POPULATION & TALENT</small><strong>{homeProfile.population.toLocaleString()} <i>vs {peerProfile.population.toLocaleString()}</i></strong><p>2025 population estimates; change since 2020 base {homeProfile.populationChange}% vs {peerProfile.populationChange}%. <SourceLink id={homeProfile.sourceId} /> <SourceLink id={peerProfile.sourceId} /></p></article>
            <article><small>BUSINESS BASE</small><strong>{homeProfile.establishments.toLocaleString()} <i>vs {peerProfile.establishments.toLocaleString()}</i></strong><p>Employer establishments. Use OhioLMI, BEA and QCEW to investigate industry mix. <SourceLink id={4} /> <SourceLink id={5} /> <SourceLink id={6} /></p></article>
            <article><small>INFRASTRUCTURE & QUALITY OF LIFE</small><strong>{homeProfile.broadband}% <i>vs {peerProfile.broadband}%</i></strong><p>Broadband subscriptions; mean commute {homeProfile.commute} vs {peerProfile.commute} minutes. <SourceLink id={homeProfile.sourceId} /> <SourceLink id={peerProfile.sourceId} /></p></article>
          </div></section>}
          {asked ? <><div className="question"><span>AD</span><div><small>YOUR QUESTION</small><p>{asked}</p></div></div>
          <article className="answer-card" aria-live="polite" ref={answerRef} tabIndex={-1} key={`${home.countyid}-${peer.countyid}-${asked}-${responseVersion}`}>
            <div className="answer-head"><span>A</span><div><small>ADAPT-GROUNDED ANALYSIS</small><p>Model facts + official county evidence</p></div></div>
            <div className="answer-context">Updated for {compactName(home.name)} ↔ {compactName(peer.name)}</div>
            <div className="confidence">Evidence boundary active · comparison, not causal attribution</div>
            <h2>{answer!.title}</h2><p>{answer!.summary} <SourceLink id={1} /> {answerIsAi && <><SourceLink id={8} /> <SourceLink id={10} /></>}</p>
            <h3>What the comparison shows</h3><ul>{answer!.findings.map((finding, index) => <li key={finding}>{finding} {answerIsAi ? <SourceLink id={[6, 8, 7][index]} /> : <SourceLink id={1} />}</li>)}</ul>
            {pairIsShelbyAuglaize ? <div className="policy-grid"><div><small>SHELBY COUNTY</small><strong>Manufacturing county context</strong><p>ADAPT identifies a similar workforce and manufacturing economic structure. Census measures add population, skills, participation and business-base signals. <SourceLink id={1} /> <SourceLink id={2} /></p></div><div><small>AUGLAIZE COUNTY</small><strong>Mutual computed peer</strong><p>Auglaize independently selects Shelby as its ADAPT peer. OhioLMI, BEA and QCEW provide the next layer for industry and occupation investigation. <SourceLink id={1} /> <SourceLink id={3} /> <SourceLink id={4} /></p></div></div> : pairIsLegacyDemo ? <div className="policy-grid"><div><small>ALLEGHENY</small><strong>Current direction</strong><p>All In Allegheny connects education, youth investment, workforce development and equitable growth. <SourceLink id={15} /> The county is also developing a comprehensive investment framework. <SourceLink id={16} /></p></div><div><small>SALT LAKE</small><strong>Practices to investigate</strong><p>Salt Lake County combines regional economic-development research with workforce programmes that track training completion, hiring and retention. <SourceLink id={17} /> <SourceLink id={18} /> <SourceLink id={19} /></p></div></div> : <div className="policy-grid evidence-gap"><div><small>{compactName(home.name).toUpperCase()}</small><strong>Official evidence needed</strong><p>The ADAPT comparison is available, but an approved county source catalog has not yet been connected for this jurisdiction.</p></div><div><small>{compactName(peer.name).toUpperCase()}</small><strong>No policy claim generated</strong><p>Add official plans, budgets, programme evaluations and legislation before drawing a substantive conclusion.</p></div></div>}
            <div className="recommendation"><strong>Recommended next step</strong><p>{answer!.recommendation}</p></div>
          </article>{pairIsShelbyAuglaize && <AiImpactSection home={home} peer={peer} />}{aiContext && <AiChat key={`${home.countyid}-${peer.countyid}-${asked}`} context={aiContext} />}</> : <div className="empty-answer" aria-live="polite"><strong>Start a new county question</strong><p>Choose a prompt below or write your own. Press Enter to submit; Shift + Enter adds a new line.</p></div>}
          <div className="suggestions">{questions.map((question) => <button className={selectedPreset === question ? 'selected' : ''} type="button" aria-pressed={selectedPreset === question} key={question} onClick={() => choosePreset(question)}>{question} →</button>)}</div>
          {selectedPreset && <p className="preset-hint" role="status">Preset selected — press Send to update the analysis.</p>}
          <form className="composer" onSubmit={ask}><textarea ref={composerRef} aria-label="Ask a county policy question" rows={2} value={prompt} onKeyDown={handleComposerKeyDown} onChange={(event) => { setPrompt(event.target.value); setSelectedPreset(null); }} placeholder={`Ask about ${compactName(home.name)} and ${compactName(peer.name)}…`} /><button type="submit" aria-label="Send question" disabled={!prompt.trim()}>↑</button></form>
        </section>

        <aside className="evidence-panel" id="evidence"><div className="evidence-heading"><div><small>EVIDENCE</small><h2>{displayedSources.length} connected sources</h2></div><span>Verified links</span></div><div className="source-list">{displayedSources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.id}><span>{source.id}</span><div><small>{source.jurisdiction} · {source.kind}</small><strong>{source.title}</strong><p>{source.detail}</p></div><b>↗</b></a>)}</div><div className="method-card" id="method"><strong>How this answer is built</strong><ol><li>Load the selected ADAPT county and peer.</li><li>Separate model facts from policy evidence.</li><li>Route to official county sources.</li><li>Flag causal and transferability limits.</li></ol></div></aside>
      </div>
    </section>
  </main>;
}
