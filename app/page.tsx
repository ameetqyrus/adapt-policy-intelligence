"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  Compass,
  Handshake,
  Map as MapIcon,
  MessageSquare,
  Moon,
  Home as HomeIcon,
  RotateCcw,
  Search,
  Settings,
  Sun,
  X,
  HelpCircle,
  SlidersHorizontal,
  Telescope,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  County,
  CountyDetail,
  format,
  labels,
  metrics,
  shortName,
} from "@/lib/types";
import Investigations, { download } from "./components/Investigations";
import EvidenceLibrary from "./components/EvidenceLibrary";
import Trends from "./components/Trends";
import WebTools from "./components/WebTools";
import { ConnectionDialog, useConnection } from "./components/Connection";
import Help from './components/Help';
import Policies from './components/Policies';
import PolicySimulator from './components/PolicySimulator';
import type { WorkspaceContext } from '@/lib/workspace-context';
type View = "home" | "explore" | "compare" | "simulator" | "investigate" | "sources" | "story" | "research" | "support" | "help";
const colors = ["#164d72", "#4a7799", "#83a5bd", "#bfd3df", "#e5edf1"];

function AdaptHome({
  onExplore,
  onCompare,
  onInvestigate,
}: {
  onExplore: () => void;
  onCompare: () => void;
  onInvestigate: () => void;
}) {
  const features = [
    {
      number: "01",
      title: "Where workers are adapting",
      body: "See manufacturing trade loss and tradable-services job gains for every county on one national view.",
      action: "Explore the ADAPT map",
      onClick: onExplore,
    },
    {
      number: "02",
      title: "Peer county comparison",
      body: "Compare counties with similar starting conditions, then investigate why their outcomes may have diverged.",
      action: "Compare counties",
      onClick: onCompare,
    },
    {
      number: "03",
      title: "Evidence-led investigation",
      body: "Ask open questions about policy, trade and technological change, grounded in ADAPT data and sources you control.",
      action: "Start an investigation",
      onClick: onInvestigate,
    },
  ];
  return (
    <div className="adapt-home">
      <section className="adapt-hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="adapt-hero-copy">
          <p className="eyebrow">GEORGETOWN UNIVERSITY · LAB FOR GLOBALIZATION AND SHARED PROSPERITY</p>
          <h1>Find where workers <span>ADAPT</span></h1>
          <p className="adapt-acronym"><b>A</b>merican <b>D</b>ream <b>A</b>chievability <b>P</b>rogress <b>T</b>racker</p>
          <p className="adapt-hero-lede">County-level evidence for understanding how trade, policy and global change shape economic opportunity for workers without a four-year degree.</p>
          <div className="hero-actions">
            <button className="gold-action" onClick={onExplore}>Explore ADAPT <ArrowUpRight size={17} /></button>
            <button className="hero-secondary" onClick={onInvestigate}>Open Observatory</button>
          </div>
        </div>
      </section>
      <dl className="adapt-stats">
        <div><dt>3,145</dt><dd>counties tracked</dd></div>
        <div><dt>3 decades</dt><dd>of economic data</dd></div>
        <div><dt>Every 3 years</dt><dd>index refresh</dd></div>
      </dl>
      <section className="adapt-purpose">
        <p className="eyebrow">WHAT ADAPT DOES</p>
        <div className="purpose-grid">
          <h2>Turn a national story into local questions that can be investigated.</h2>
          <ol>
            <li><span>1</span>Identifies where workers are adapting</li>
            <li><span>2</span>Shows why some communities succeed while comparable places fall behind</li>
            <li><span>3</span>Connects outcomes to practical policy evidence without claiming causation</li>
          </ol>
        </div>
      </section>
      <section className="adapt-features">
        {features.map((feature) => (
          <button key={feature.number} onClick={feature.onClick}>
            <span>{feature.number}</span>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
            <strong>{feature.action} <ArrowUpRight size={15} /></strong>
          </button>
        ))}
      </section>
      <figure className="adapt-quote">
        <blockquote>“ADAPT reveals the places where you don&apos;t have to have a college education to succeed, that&apos;s engaged with the world, and that is not beaten down by globalization.”</blockquote>
        <figcaption>Eric Garcetti, Mayor of Los Angeles (2013–2022)</figcaption>
      </figure>
    </div>
  );
}

function StoryPage() {
  const blocks = [
    ["Mission", "We advance research on how open markets can enhance upward mobility for all workers, especially those without a college degree, to guide public policy toward a more inclusive future."],
    ["Motivation", "For decades, workers without college degrees disproportionately bore the costs of economic disruption while the benefits went elsewhere. The Lab exists to uncover how disruption can be harnessed to generate shared prosperity."],
    ["Goals", "Our findings aim to foster dialogue on policy reform and empower individuals and communities with information about the evolving economy."],
  ];
  return <div className="public-page">
    <header><p className="eyebrow">OUR STORY</p><h1>A lab dedicated to including workers in economic progress</h1></header>
    <div className="story-grid">{blocks.map(([title, body]) => <section className="panel" key={title}><p className="eyebrow">{title}</p><p>{body}</p></section>)}</div>
    <section className="panel story-wide"><p className="eyebrow">WHERE ADAPT FITS</p><h2>Measurement that helps communities ask better questions</h2><p>The Lab&apos;s first major initiative created the American Dream Achievability Progress Tracker, which compares how cities and counties leverage globalization to improve the lives of workers without a four-year degree. ADAPT captures how local fiscal policy, especially investments in K-12 and vocational education, relates to upward mobility in the wake of trade shocks.</p><p>Observatory extends that work into an evidence workspace: compare peers, examine sources, test alternative explanations and preserve the uncertainty around causal claims.</p></section>
  </div>;
}

function ResearchPage() {
  const outputs = [
    ["America Is Fighting the Wrong Trade War", "https://www.foreignaffairs.com/united-states/america-fighting-wrong-trade-war"],
    ["Is trade really toxic? How imports support American jobs", "https://www.hinrichfoundation.com/research/wp/economic-development/how-imports-support-american-jobs"],
    ["Evolving Trade Dynamics: Global Imports and Their Role in Supporting US Jobs", "https://foreignpress.org/educational-programs-learning-takeaways/evolving-trade-dynamics-global-imports-and-their-role-in-supporting-us-jobs-jensen-rudra-bonifai-georgetown-university-hinrich-foundation/"],
  ];
  return <div className="public-page"><header><p className="eyebrow">OUR RESEARCH</p><h1>Research outputs</h1><p>The Lab produces original research analyzing globalization and its impacts from different perspectives.</p></header><div className="research-grid">{outputs.map(([title, url]) => <a className="panel" href={url} key={url} target="_blank" rel="noreferrer"><BookOpen size={22}/><h2>{title}</h2><span>Read research <ArrowUpRight size={14}/></span></a>)}</div></div>;
}

function SupportPage() {
  return <div className="public-page"><header><p className="eyebrow">PARTNER WITH US</p><h1>The answer to economic disruption is not retreat; it is evidence.</h1><p>We are seeking partners who share that conviction: funders, institutions and practitioners willing to back rigorous, county-level measurement of who the economy is actually working for.</p></header><div className="story-grid"><section className="panel story-wide"><h2>Why partner with the Lab</h2><p>Support funds the data infrastructure behind ADAPT: index refreshes across 3,145 counties, peer matching, investigation tooling and the case studies that turn measurement into usable local policy guidance.</p></section><aside className="panel"><p className="eyebrow">CONTACT</p><p>Lab for Globalization and Shared Prosperity<br/>Georgetown University<br/>37th and O Streets NW<br/>Washington, DC 20057</p></aside></div></div>;
}
function CountySearch({
  counties,
  onSelect,
}: {
  counties: County[];
  onSelect: (id: number) => void;
}) {
  const [query, setQuery] = useState(""),
    [open, setOpen] = useState(false);
  const matches = useMemo(
    () =>
      counties
        .filter((c) =>
          (c.name + " " + c.countyid)
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .slice(0, 15),
    [query, counties],
  );
  const select = (id: number) => {
    onSelect(id);
    setOpen(false);
    setQuery("");
  };
  return (
    <div className="county-find">
      <Search size={17} />
      <input
        aria-label="Search counties"
        placeholder="Search any county or FIPS…"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Enter" && matches[0]) select(matches[0].countyid);
        }}
      />
      {open && (
        <>
          <button
            className="dismiss-search"
            aria-label="Close county search"
            onClick={() => setOpen(false)}
          />
          <div className="search-results">
            {matches.map((c) => (
              <button key={c.countyid} onClick={() => select(c.countyid)}>
                <span>{c.name}</span>
                <small>{String(c.countyid).padStart(5, "0")}</small>
              </button>
            ))}
            {!matches.length && <p>No matching counties.</p>}
          </div>
        </>
      )}
    </div>
  );
}
export default function Observatory() {
  const { connection, save } = useConnection();
  const [view, setView] = useState<View>("home"),
    [counties, setCounties] = useState<County[]>([]),
    [selected, setSelected] = useState<number[]>([39149, 39011]),
    [metric, setMetric] = useState("potential");
  const [scenario, setScenario] = useState({ assumptions: '', output: '' });
  const [paths, setPaths] = useState<{ id: number; path: string }[]>([]),
    [details, setDetails] = useState<Record<string, CountyDetail>>({}),
    [error, setError] = useState(""),
    [dark, setDark] = useState(false),
    [settings, setSettings] = useState(false),
    [tab, setTab] = useState("overview"),
    [hover, setHover] = useState<number | null>(null),
    [mapZoom, setMapZoom] = useState(1);
  const byId = useMemo(
    () => new Map(counties.map((c) => [c.countyid, c])),
    [counties],
  );
  const chosen = selected
      .map((id) => byId.get(id))
      .filter((c): c is County => Boolean(c)),
    home = chosen[0];
  useEffect(() => {
    Promise.all([
      fetch("/data/county-context.json").then(
        (r) => r.json() as Promise<{ counties: County[] }>,
      ),
      fetch("/data/map-paths.json").then(
        (r) => r.json() as Promise<{ id: number; path: string }[]>,
      ),
    ])
      .then(([data, map]) => {
        const initialView = new URL(location.href).searchParams.get('view');
        if (initialView && ['home','explore','compare','simulator','investigate','sources','story','research','support','help'].includes(initialView)) setView(initialView as View);
        setCounties(data.counties);
        setPaths(map);
        const ids = (
          new URL(location.href).searchParams.get("counties") || "39149,39011"
        )
          .split(",")
          .map(Number)
          .filter((id) => data.counties.some((c: County) => c.countyid === id));
        if (ids.length) setSelected([...new Set<number>(ids)].slice(0, 4));
      })
      .catch(() =>
        setError("County data could not load. Reload to try again."),
      );
    setDark(localStorage.getItem("adapt-observatory-theme") === "dark");
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("adapt-observatory-theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    if (!counties.length) return;
    const url = new URL(location.href);
    url.searchParams.set("counties", selected.join(","));
    history.replaceState(null, "", url);
    selected.forEach((id) => {
      fetch("/data/details/" + id + ".json")
        .then((r) =>
          r.ok
            ? (r.json() as Promise<CountyDetail>)
            : { history: [], industries: [], occupations: [] },
        )
        .then((d) => setDetails((old) => ({ ...old, [id]: d })))
        .catch(() => {});
    });
  }, [selected, counties.length]);
  const ranked = useMemo(
    () =>
      counties
        .filter((c) => c.metrics[metric]?.value != null)
        .sort(
          (a, b) =>
            (b.metrics[metric].value ?? 0) - (a.metrics[metric].value ?? 0),
        ),
    [counties, metric],
  );
  const ranks = useMemo(
    () =>
      new Map(
        ranked.map((c, i) => [
          c.countyid,
          Math.min(4, Math.floor((i / ranked.length) * 5)),
        ]),
      ),
    [ranked],
  );
  function choose(id: number) {
    if (!byId.has(id)) return;
    setScenario({assumptions:'',output:''});
    setSelected((old) =>
      old.includes(id)
        ? [id, ...old.filter((x) => x !== id)]
        : [id, ...old.slice(0, 3)],
    );
  }
  function navigate(next: View) {
    setView(next);
    const url = new URL(location.href); url.searchParams.set('view',next); history.replaceState(null,'',url);
    window.scrollTo({top:0,behavior:'instant'});
  }
  function navigateMap(nextMetric: string) {
    setMetric(nextMetric);
    setMapZoom(1);
    navigate('explore');
  }
  function changeCounties(ids: number[]) { setSelected(ids); setScenario({assumptions:'',output:''}); }
  const workspaceContext: WorkspaceContext = {
    surface: view === 'explore' ? 'map' : view === 'compare' ? 'comparison' : view === 'simulator' ? 'simulator' : 'investigation',
    metric, panel: tab, ...(view === 'simulator' ? {scenario} : {}),
  };
  const askHere = () => document.getElementById('evidence-companion')?.scrollIntoView({behavior:'smooth',block:'start'});
  return (
    <main className={view === 'home' ? 'observatory home-mode' : 'observatory'}>
      {view !== 'home' && <aside className="obs-nav">
        <button className="obs-brand" onClick={() => navigate('home')}>
          <span className="brand-mark">
            A<span />
          </span>
          <div>
            ADAPT<small>AMERICAN DREAM TRACKER</small>
          </div>
        </button>
        <nav aria-label="Main navigation">
          <div className="nav-caption">DASHBOARD</div>
          <button className={view === 'home' ? 'active' : ''} onClick={() => navigate('home')}><HomeIcon size={18}/>Home{view === 'home' && <span className="nav-line"/>}</button>
          <div className="nav-caption nav-section">MAPS</div>
          <button className={view === 'explore' && metric === 'potential' ? 'active' : ''} onClick={() => navigateMap('potential')}><MapIcon size={18}/>ADAPT Index{view === 'explore' && metric === 'potential' && <span className="nav-line"/>}</button>
          <button className={view === 'explore' && metric === 'pct_pred_emp_gain' ? 'active' : ''} onClick={() => navigateMap('pct_pred_emp_gain')}><ChartNoAxesCombined size={18}/>Services job gains{view === 'explore' && metric === 'pct_pred_emp_gain' && <span className="nav-line"/>}</button>
          <button className={view === 'explore' && metric === 'pct_pred_emp_loss' ? 'active' : ''} onClick={() => navigateMap('pct_pred_emp_loss')}><Building2 size={18}/>Manufacturing trade{view === 'explore' && metric === 'pct_pred_emp_loss' && <span className="nav-line"/>}</button>
          <div className="nav-caption nav-section">TOOLS</div>
          <button className={view === 'compare' ? 'active' : ''} onClick={() => navigate('compare')}><Users size={18}/>Peer comparison{view === 'compare' && <span className="nav-line"/>}</button>
          <button className={view === 'simulator' ? 'active' : ''} onClick={() => navigate('simulator')}><SlidersHorizontal size={18}/>Policy simulator{view === 'simulator' && <span className="nav-line"/>}</button>
          <div className="nav-caption nav-section">OBSERVATORY</div>
          <button className={view === 'investigate' ? 'active observatory-link' : 'observatory-link'} onClick={() => navigate('investigate')}><Telescope size={18}/>Investigations{view === 'investigate' && <span className="nav-line"/>}</button>
          <button className={view === 'sources' ? 'active' : ''} onClick={() => navigate('sources')}><BookOpen size={18}/>Evidence library{view === 'sources' && <span className="nav-line"/>}</button>
          <div className="nav-caption nav-section">ABOUT</div>
          <button className={view === 'story' ? 'active' : ''} onClick={() => navigate('story')}><Compass size={18}/>Our story{view === 'story' && <span className="nav-line"/>}</button>
          <button className={view === 'research' ? 'active' : ''} onClick={() => navigate('research')}><BookOpen size={18}/>Our research{view === 'research' && <span className="nav-line"/>}</button>
          <button className={view === 'support' ? 'active' : ''} onClick={() => navigate('support')}><Handshake size={18}/>Partner with us{view === 'support' && <span className="nav-line"/>}</button>
          <button className={view === 'help' ? 'active' : ''} onClick={() => navigate('help')}><HelpCircle size={18}/>Help{view === 'help' && <span className="nav-line"/>}</button>
        </nav>
        <div className="nav-bottom">
          <div className="nav-note">
            <span className="gold-rule" />
            <strong>
              Local outcomes.
              <br />A wider perspective.
            </strong>
            <p>
              Follow the connections between places, policies and opportunity.
            </p>
          </div>
          <button className="settings-link" onClick={() => setSettings(true)}>
            <Settings size={18} />
            AI connection
          </button>
          <button className="settings-link" onClick={() => setDark(!dark)}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}{" "}
            {dark ? "Light appearance" : "Dark appearance"}
          </button>
        </div>
      </aside>}
      <section className={view === 'home' ? 'obs-main home-main' : 'obs-main'}>
        {view === 'home' ? <header className="home-topbar">
          <button className="home-brand" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
            <span className="brand-mark">A<span /></span>
            <span><b>ADAPT</b><small>AMERICAN DREAM TRACKER</small></span>
          </button>
          <nav aria-label="Homepage navigation">
            <button onClick={() => navigateMap('potential')}>Explore map</button>
            <button onClick={() => navigate('compare')}>Compare</button>
            <button onClick={() => navigate('research')}>Research</button>
            <button className="home-observatory" onClick={() => navigate('investigate')}>Open Observatory</button>
            <button className="icon-btn" aria-label={dark ? 'Use light appearance' : 'Use dark appearance'} onClick={() => setDark(!dark)}>{dark ? <Sun size={16}/> : <Moon size={16}/>}</button>
          </nav>
        </header> : <header className="obs-top">
          <div className="breadcrumb">
            ADAPT <span>/</span>{" "}
            {view === "home"
              ? "Home"
              : view === "explore"
              ? "Policy intelligence"
              : view === 'compare' ? 'Peer comparison'
              : view === 'simulator' ? 'Policy simulator'
              : view === 'help' ? 'Help & how to use'
              : view === 'story' ? 'Our story'
              : view === 'research' ? 'Our research'
              : view === 'support' ? 'Partner with us'
              : view === "sources"
                ? "Evidence library"
                : "Observatory · Investigations"}
          </div>
          <button className="mobile-settings" onClick={() => setSettings(true)}>
            <Settings size={16} />
            AI connection
          </button>
          <span className="private-label">American Dream Achievability Progress Tracker</span>
          <button
            className="icon-btn mobile-theme"
            aria-label="Toggle appearance"
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>}
        <div className="obs-content">
          {view === 'home' && <AdaptHome onExplore={() => navigateMap('potential')} onCompare={() => navigate('compare')} onInvestigate={() => navigate('investigate')} />}
          {view === 'story' && <StoryPage />}
          {view === 'research' && <ResearchPage />}
          {view === 'support' && <SupportPage />}
          {!['home','story','research','support'].includes(view) && <div className="page-heading">
            <div>
              <p className="eyebrow">
                AMERICAN DREAM ACHIEVABILITY PROGRESS TRACKER
              </p>
              <h1>
                {view === "explore"
                  ? "Opportunity has a geography."
                  : view === 'compare' ? 'Learn from the evidence.'
                  : view === 'simulator' ? 'Explore what could change.'
                  : view === 'help' ? 'Make the most of ADAPT.'
                  : view === "sources"
                    ? "Build your evidence base."
                    : "Follow the question."}
              </h1>
              <p>
                {view === "explore"
                  ? "Explore where workers thrive. Compare places and examine the evidence behind local outcomes."
                  : view === 'compare' ? 'Compare descriptive outcomes and documented peer policies. Draw your own conclusions.'
                  : view === 'simulator' ? 'Discuss explicit assumptions and results without confusing scenarios with predictions.'
                  : view === 'help' ? 'A step-by-step guide to counties, conversations, sources and uncertainty.'
                  : view === "sources"
                    ? "Bring sources into the conversation and control what informs your answers."
                    : "An open conversation about policies, global change and local outcomes."}
              </p>
            </div>
            {view === "explore" && (
              <button
                className="primary"
                onClick={askHere}
              >
                <MessageSquare size={17} />
                Ask about this view
                <ArrowUpRight size={16} />
              </button>
            )}
          </div>}
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          {['explore','compare','simulator','investigate','sources'].includes(view) && <div className="county-toolbar">
            <CountySearch counties={counties} onSelect={choose} />
            <div className="county-chips">
              {chosen.map((c, i) => (
                <div className={"county-chip c" + i} key={c.countyid}>
                  <button
                    onClick={() => choose(c.countyid)}
                    title="Make reference county"
                  >
                    <span />
                    {shortName(c.name)}
                    <small>{c.state}</small>
                  </button>
                  {i > 0 && (
                    <button
                      aria-label={"Remove " + c.name}
                      onClick={() =>
                        changeCounties(selected.filter((id) => id !== c.countyid))
                      }
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <span className="toolbar-hint">Up to 4 counties</span>
          </div>}
          {(view === "explore" || view === 'compare') && (
            <>
              {view === 'compare' && <p className="baseline-note">ADAPT baseline · through 2022. Newer source documents supplement these measures; they do not replace or recalculate the model. Education spending for 2023–2024 has not yet been imported.</p>}
              {view === 'explore' && <div className="explore-layout">
                <section className="panel map-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">THE NATIONAL PICTURE</p>
                      <h2>{labels[metric]}</h2>
                    </div>
                    <label className="metric-select">
                      <select
                        aria-label="Map measure"
                        value={metric}
                        onChange={(e) => setMetric(e.target.value)}
                      >
                        {metrics.map((m) => (
                          <option value={m} key={m}>
                            {labels[m]}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={15} />
                    </label>
                  </div>
                  <div className="map-wrap">
                    <div className="map-controls" aria-label="Map zoom controls">
                      <button aria-label="Zoom in" onClick={() => setMapZoom((value) => Math.min(2.6, value + .3))}><ZoomIn size={17}/></button>
                      <button aria-label="Zoom out" onClick={() => setMapZoom((value) => Math.max(1, value - .3))}><ZoomOut size={17}/></button>
                      <button aria-label="Reset zoom" onClick={() => setMapZoom(1)}><RotateCcw size={16}/></button>
                    </div>
                    <svg
                      viewBox="0 0 1000 620"
                      role="img"
                      aria-label="Interactive United States county map"
                    >
                      <g style={{transform: `scale(${mapZoom})`, transformOrigin: '500px 310px', transition: 'transform .25s ease'}}>
                      {paths.map((p) => (
                        <path
                          key={p.id}
                          d={p.path}
                          fill={
                            selected.includes(p.id)
                              ? "#d99b38"
                              : ranks.has(p.id)
                                ? colors[ranks.get(p.id)!]
                                : "#d7dcdf"
                          }
                          stroke={selected.includes(p.id) ? "#7a470c" : "#fff"}
                          strokeWidth={selected.includes(p.id) ? 1.8 : 0.35}
                          onClick={() => choose(p.id)}
                          onMouseEnter={() => setHover(p.id)}
                          onMouseLeave={() => setHover(null)}
                        >
                          <title>
                            {byId.get(p.id)?.name}:{" "}
                            {format(
                              metric,
                              byId.get(p.id)?.metrics[metric]?.value,
                            )}
                          </title>
                        </path>
                      ))}
                      </g>
                    </svg>
                    {hover && byId.has(hover) && (
                      <div className="map-readout">
                        <strong>{byId.get(hover)!.name}</strong>
                        <span>
                          {format(
                            metric,
                            byId.get(hover)!.metrics[metric]?.value,
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  <footer className="map-footer">
                    <span>ADAPT model · data through 2022</span>
                    <div>
                      Lower{" "}
                      <span className="legend">
                        {colors
                          .slice()
                          .reverse()
                          .map((c) => (
                            <i key={c} style={{ background: c }} />
                          ))}
                      </span>{" "}
                      Higher
                    </div>
                  </footer>
                </section>
                <aside className="panel county-focus">
                  <p className="eyebrow">REFERENCE COUNTY</p>
                  <h2>{home?.name || "Loading counties…"}</h2>
                  <div className="focus-meta">
                    {home?.peer?.economicType?.replace(
                      "Maufacturing",
                      "Manufacturing",
                    )}
                    <span>FIPS {home?.countyid}</span>
                  </div>
                  <div className="focus-score">
                    <span>
                      {format("potential", home?.metrics.potential?.value)}
                    </span>
                    <small>American Dream potential</small>
                  </div>
                  <div className="focus-stat">
                    <span>Workforce</span>
                    <strong>{home?.workers?.toLocaleString("en-US")}</strong>
                  </div>
                  <div className="focus-stat">
                    <span>Population group</span>
                    <strong>{home?.populationGroup?.split(" ")[0]}</strong>
                  </div>
                  {home?.peer && (
                    <div className="peer-recommend">
                      <small>ADAPT MATCHED PEER</small>
                      <strong>
                        {home.peer.name}, {home.peer.state}
                      </strong>
                      <p>Similar starting conditions and workforce size.</p>
                      <button
                        onClick={() =>
                          {changeCounties([home.countyid, home.peer!.countyid]); navigate('compare');}
                        }
                      >
                        Compare this pair <ArrowUpRight size={15} />
                      </button>
                    </div>
                  )}
                  <button
                    className="text-action"
                    onClick={askHere}
                  >
                    Ask about this county <ArrowUpRight size={16} />
                  </button>
                </aside>
              </div>}
              <div className="metric-strip">
                {metrics.slice(1, 5).map((m) => (
                  <div key={m}>
                    <small>{labels[m]}</small>
                    <strong>{format(m, home?.metrics[m]?.value)}</strong>
                    <span>
                      {chosen[1]
                        ? shortName(chosen[1].name) +
                          ": " +
                          format(m, chosen[1].metrics[m]?.value)
                        : "Add a county to compare"}
                    </span>
                  </div>
                ))}
              </div>
              <button
                className="secondary export-data"
                onClick={() => {
                  const quote = (v: unknown) =>
                    '"' + String(v).replaceAll('"', '""') + '"';
                  download(
                    "adapt-county-comparison.csv",
                    [
                      ["Measure", ...chosen.map((c) => c.name)],
                      ...metrics.map((m) => [
                        labels[m],
                        ...chosen.map((c) => format(m, c.metrics[m]?.value)),
                      ]),
                    ]
                      .map((row) => row.map(quote).join(","))
                      .join("\r\n"),
                    "text/csv",
                  );
                }}
              >
                Download comparison CSV ↗
              </button>
              <div className="section-tabs">
                {["overview", "trends", "industries", "occupations"].map(
                  (t) => (
                    <button
                      className={tab === t ? "active" : ""}
                      onClick={() => setTab(t)}
                      key={t}
                    >
                      {t === "overview"
                        ? "Compare outcomes"
                        : t === "trends"
                          ? "Change over time"
                          : t === "industries"
                            ? "Industry base"
                            : "Work & occupations"}
                    </button>
                  ),
                )}
              </div>
              <section className="panel data-panel">
                {tab === "overview" ? (
                  <>
                    <h2>A shared view of different outcomes</h2>
                    <p className="muted">
                      All ADAPT measures use their original units. A difference
                      suggests a question; its cause needs investigation.
                    </p>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Measure</th>
                            {chosen.map((c) => (
                              <th key={c.countyid}>
                                {shortName(c.name)}
                                <small>{c.state}</small>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.map((m) => (
                            <tr key={m}>
                              <td>{labels[m]}</td>
                              {chosen.map((c) => (
                                <td key={c.countyid}>
                                  {format(m, c.metrics[m]?.value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : tab === "trends" ? (
                  <Trends counties={chosen} details={details} />
                ) : (
                  <>
                    <h2>
                      {tab === "industries"
                        ? "Industries by employment"
                        : "Leading occupations for non-college workers"}
                    </h2>
                    <p className="muted">
                      {home?.name} · 2022 survey-weighted estimates
                    </p>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>
                              {tab === "industries" ? "Industry" : "Occupation"}
                            </th>
                            <th>Employment</th>
                            <th>Non-college workers</th>
                            <th>Share</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(
                            details[selected[0]]?.[
                              tab === "industries"
                                ? "industries"
                                : "occupations"
                            ] || []
                          ).map((row) => (
                            <tr key={row.name}>
                              <td>{row.name}</td>
                              <td>
                                {Math.round(row.workers).toLocaleString()}
                              </td>
                              <td>
                                {Math.round(row.noncollege).toLocaleString()}
                              </td>
                              <td>
                                {((row.noncollege / row.workers) * 100).toFixed(
                                  1,
                                )}
                                %
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>
              {view === 'compare' && <Policies counties={chosen} />}
            </>
          )}
          {view === 'help' && <Help onConnect={() => setSettings(true)} />}
          {view === 'simulator' && <>
            <PolicySimulator county={home} />
            <section className="panel scenario-panel scenario-notes">
            <p className="eyebrow">INVESTIGATE THE SCENARIO</p><h2>Bring assumptions into the evidence conversation</h2>
            <label>Assumptions / policy levers<textarea maxLength={3000} value={scenario.assumptions} onChange={e=>setScenario({...scenario,assumptions:e.target.value})} placeholder="Describe the scenario, year, county and assumptions." /></label>
            <label>Observations / notes · optional<textarea maxLength={3000} value={scenario.output} onChange={e=>setScenario({...scenario,output:e.target.value})} placeholder="Record what changed, with units and the model/version." /></label>
            <p className="muted">Notes are user-provided and sent with your next question. The assistant must distinguish them from the V2 model and must not manufacture results.</p>
          </section></>}
          <div id="evidence-companion" hidden={!['explore','compare','simulator','investigate'].includes(view)}>
            <Investigations
              counties={chosen}
              connection={connection}
              onConnect={() => setSettings(true)}
              onCounties={changeCounties}
              context={workspaceContext}
              compact={view !== 'investigate'}
            />
          </div>
          <div hidden={view !== "sources"}>
            <EvidenceLibrary
              connection={connection}
              onConnect={() => setSettings(true)}
            />
          </div>
          <WebTools counties={counties} onSelect={changeCounties} />
          <footer className="workspace-footer">
            <span>ADAPT · Georgetown University Lab for Globalization and Shared Prosperity</span>
            <a
              href="https://github.com/cgsp-georgetown/V2_ADAPT_Dashboard"
              target="_blank"
              rel="noreferrer"
            >
              Research data & methodology <ArrowUpRight size={13} />
            </a>
          </footer>
        </div>
      </section>
      {settings && (
        <ConnectionDialog
          connection={connection}
          onSave={save}
          onClose={() => setSettings(false)}
        />
      )}
    </main>
  );
}
