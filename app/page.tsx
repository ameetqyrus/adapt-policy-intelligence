"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  Compass,
  Handshake,
  Home as HomeIcon,
  Map as MapIcon,
  Menu,
  MessageSquare,
  Moon,
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
type View = "home" | "maps" | "explore" | "tools" | "compare" | "simulator" | "investigate" | "observatory" | "sources" | "insights" | "story" | "faculty" | "team" | "research" | "support" | "contact" | "help";
const colors = ["#164d72", "#4a7799", "#83a5bd", "#bfd3df", "#e5edf1"];

const viewLabels: Record<View, string> = {
  home: "Home",
  maps: "All maps",
  explore: "Maps",
  tools: "All tools",
  compare: "Peer Comparison",
  simulator: "Policy Simulator",
  investigate: "ADAPT Policy Intelligence",
  observatory: "Observatory",
  sources: "Evidence Library",
  insights: "Insights",
  story: "Our Story",
  faculty: "Faculty leadership",
  team: "ADAPT core team",
  research: "Research Outputs",
  support: "Partner with us",
  contact: "Contact",
  help: "Help",
};

export function SiteHeader({
  view,
  dark,
  navigate,
  navigateMap,
  onTheme,
  onConnect,
}: {
  view: View;
  dark: boolean;
  navigate: (view: View) => void;
  navigateMap: (metric: string) => void;
  onTheme: () => void;
  onConnect: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const go = (next: View) => {
    setMenuOpen(false);
    navigate(next);
  };
  const goMap = (next: string) => {
    setMenuOpen(false);
    navigateMap(next);
  };
  return <>
    <header className="v2-site-header">
      <button className="v2-logo" onClick={() => go('home')} aria-label="ADAPT home">
        <span className="brand-mark">A<span /></span>
        <span><b>ADAPT</b><small>AMERICAN DREAM ACHIEVABILITY PROGRESS TRACKER</small></span>
      </button>
      <nav className="v2-desktop-nav" aria-label="Primary navigation">
        <button className={view === 'home' ? 'current' : ''} onClick={() => go('home')}>Home</button>
        <details><summary>Maps <ChevronDown size={14}/></summary><div className="v2-dropdown">
          <button onClick={() => go('maps')}>All maps</button>
          <button onClick={() => goMap('potential')}>ADAPT Index map</button>
          <button onClick={() => goMap('pct_pred_emp_gain')}>Services job gains map</button>
          <button onClick={() => goMap('pct_pred_emp_loss')}>Manufacturing trade map</button>
        </div></details>
        <details><summary>Tools <ChevronDown size={14}/></summary><div className="v2-dropdown">
          <button onClick={() => go('tools')}>All tools</button>
          <button onClick={() => go('investigate')}>Policy Intelligence</button>
          <button onClick={() => go('compare')}>Peer Comparison</button>
          <button onClick={() => go('simulator')}>Policy Simulator</button>
        </div></details>
        <button className={view === 'insights' ? 'current' : ''} onClick={() => go('insights')}>Insights</button>
        <button className={view === 'story' ? 'current' : ''} onClick={() => go('story')}>Our Story</button>
        <details><summary>Our Team <ChevronDown size={14}/></summary><div className="v2-dropdown">
          <button onClick={() => go('faculty')}>Faculty leadership</button>
          <button onClick={() => go('team')}>ADAPT core team</button>
        </div></details>
        <button className={view === 'research' ? 'current' : ''} onClick={() => go('research')}>Our Research</button>
        <button className={view === 'support' ? 'current' : ''} onClick={() => go('support')}>Partner with us</button>
      </nav>
      <div className="v2-header-actions">
        <button className="observatory-button" onClick={() => go('observatory')}>Observatory</button>
        <button className="icon-btn" aria-label="AI connection" onClick={onConnect}><Settings size={17}/></button>
        <button className="icon-btn" aria-label={dark ? 'Use light appearance' : 'Use dark appearance'} onClick={onTheme}>{dark ? <Sun size={17}/> : <Moon size={17}/>}</button>
        <button className="v2-menu-button" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={21}/></button>
      </div>
    </header>
    {menuOpen && <div className="v2-menu-backdrop" role="presentation" onMouseDown={() => setMenuOpen(false)}>
      <aside className="v2-menu" role="dialog" aria-modal="true" aria-label="Menu" onMouseDown={(event) => event.stopPropagation()}>
        <header><h2>Menu</h2><button aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={22}/></button></header>
        <nav>
          <button onClick={() => go('home')}>Home</button>
          <button onClick={() => go('insights')}>Insights</button>
          <button onClick={() => go('story')}>Our Story</button>
          <p>MAPS</p>
          <button onClick={() => go('maps')}>All maps</button>
          <button onClick={() => goMap('potential')}>ADAPT Index map</button>
          <button onClick={() => goMap('pct_pred_emp_gain')}>Services job gains map</button>
          <button onClick={() => goMap('pct_pred_emp_loss')}>Manufacturing trade map</button>
          <p>TOOLS</p>
          <button onClick={() => go('tools')}>All tools</button>
          <button onClick={() => go('investigate')}>Policy Intelligence</button>
          <button onClick={() => go('compare')}>Peer Comparison</button>
          <button onClick={() => go('simulator')}>Policy Simulator</button>
          <p>OUR TEAM</p>
          <button onClick={() => go('faculty')}>Faculty leadership</button>
          <button onClick={() => go('team')}>ADAPT core team</button>
          <p>OUR RESEARCH</p>
          <button onClick={() => go('research')}>Research Outputs</button>
          <button onClick={() => go('support')}>Partner with us</button>
          <p>OBSERVATORY</p>
          <button onClick={() => go('observatory')}>Observatory overview</button>
          <button onClick={() => go('investigate')}>Investigations</button>
          <button onClick={() => go('sources')}>Evidence Library</button>
          <button onClick={() => go('help')}>Help & how to use</button>
        </nav>
      </aside>
    </div>}
  </>;
}

function SiteSidebar({
  view,
  metric,
  dark,
  navigate,
  navigateMap,
  onTheme,
  onConnect,
}: {
  view: View;
  metric: string;
  dark: boolean;
  navigate: (view: View) => void;
  navigateMap: (metric: string) => void;
  onTheme: () => void;
  onConnect: () => void;
}) {
  const item = (target: View, label: string, icon: React.ReactNode, extra = "") => (
    <button className={`${view === target ? "active" : ""} ${extra}`.trim()} onClick={() => navigate(target)}>
      {icon}{label}{view === target && <span className="nav-line" />}
    </button>
  );
  const mapItem = (targetMetric: string, label: string, icon: React.ReactNode) => {
    const active = view === "explore" && metric === targetMetric;
    return <button className={active ? "active" : ""} onClick={() => navigateMap(targetMetric)}>
      {icon}{label}{active && <span className="nav-line" />}
    </button>;
  };
  return <aside className="obs-nav v2-left-nav">
    <button className="obs-brand" onClick={() => navigate("home")} aria-label="ADAPT home">
      <span className="brand-mark">A<span /></span>
      <span><b>ADAPT</b><small>AMERICAN DREAM ACHIEVABILITY PROGRESS TRACKER</small></span>
    </button>
    <nav aria-label="Primary navigation">
      <p className="nav-caption">DASHBOARD</p>
      {item("home", "Home", <HomeIcon size={18} />)}
      {item("insights", "Insights", <MessageSquare size={18} />)}
      <p className="nav-caption nav-section">MAPS</p>
      {mapItem("potential", "ADAPT Index", <MapIcon size={18} />)}
      {mapItem("pct_pred_emp_gain", "Services job gains", <ChartNoAxesCombined size={18} />)}
      {mapItem("pct_pred_emp_loss", "Manufacturing trade", <Building2 size={18} />)}
      <p className="nav-caption nav-section">TOOLS</p>
      {item("investigate", "Policy Intelligence", <MessageSquare size={18} />)}
      {item("compare", "Peer comparison", <Users size={18} />)}
      {item("simulator", "Policy simulator", <SlidersHorizontal size={18} />)}
      <p className="nav-caption nav-section">OBSERVATORY</p>
      {item("observatory", "Overview", <Telescope size={18} />, "observatory-link")}
      {item("sources", "Evidence library", <BookOpen size={18} />)}
      <p className="nav-caption nav-section">ABOUT</p>
      {item("story", "Our story", <Compass size={18} />)}
      {item("team", "Our team", <Users size={18} />)}
      {item("research", "Our research", <BookOpen size={18} />)}
      {item("support", "Partner with us", <Handshake size={18} />)}
      {item("help", "Help", <HelpCircle size={18} />)}
    </nav>
    <div className="nav-bottom">
      <button className="settings-link" onClick={onConnect}><Settings size={18} />AI connection</button>
      <button className="settings-link" onClick={onTheme}>{dark ? <Sun size={18} /> : <Moon size={18} />} {dark ? "Light appearance" : "Dark appearance"}</button>
    </div>
  </aside>;
}

function AdaptHome({
  onExplore,
  onCompare,
  onSimulate,
}: {
  onExplore: () => void;
  onCompare: () => void;
  onSimulate: () => void;
}) {
  const features = [
    {
      number: "01",
      title: "Where Workers Are Adapting",
      body: "See manufacturing trade loss and tradable services job gains for every county, shaded on a single national view.",
      action: "Explore the ADAPT map",
      onClick: onExplore,
    },
    {
      number: "02",
      title: "Peer County Comparison",
      body: "See how well your county is adapting compared to peer counties with a similar economic and demographic profile (or choose your own comparison).",
      action: "Compare counties",
      onClick: onCompare,
    },
    {
      number: "03",
      title: "Policy What-If Simulator",
      body: "Move one lever, such as K-12 education spending, and watch a county's projected index and ranking respond.",
      action: "Run a scenario",
      onClick: onSimulate,
    },
  ];
  return (
    <div className="adapt-home">
      <section className="adapt-hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="adapt-hero-copy">
          <h1>Find where workers <span>ADAPT</span> to economic change</h1>
          <p className="adapt-acronym"><b>A</b>merican <b>D</b>ream <b>A</b>chievability <b>P</b>rogress <b>T</b>racker</p>
          <div className="hero-actions">
            <button className="gold-action" onClick={onExplore}>Explore ADAPT <ArrowUpRight size={17} /></button>
          </div>
        </div>
      </section>
      <dl className="adapt-stats">
        <div><dt>3</dt><dd>decades of data</dd></div>
        <div><dt>every 3 years</dt><dd>index refresh</dd></div>
      </dl>
      <section className="adapt-purpose">
        <p className="eyebrow">WHAT ADAPT DOES</p>
        <div className="purpose-grid v2-purpose-grid">
          <span className="gold-rule-wide" aria-hidden="true" />
          <ol>
            <li><span>1</span>Identifies where workers are adapting</li>
            <li><span>2</span>Identifies why some workers and communities are succeeding while peer communities fall behind</li>
            <li><span>3</span>Identifies what practical actions actually generate upward mobility</li>
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
    <section className="panel story-wide"><p className="eyebrow">WHERE ADAPT FITS</p><h2>Measurement that helps communities ask better questions</h2><p>The Lab&apos;s first major initiative created the American Dream Achievability Progress Tracker (ADAPT), which ranks cities and counties based on their ability to leverage globalization to improve the lives of the median voter. ADAPT captures how local fiscal policies, particularly investments in K-12 and vocational education, have supported local economies and promoted upward mobility (or not) for non-college educated workers, specifically in the wake of trade shocks. Ultimately, the Lab hopes to expand ADAPT into a Global Index for Shared Prosperity.</p><p>In tandem with ADAPT, the Lab also produces focused research on the relationship between globalization and labor, social investment, gender, race, and climate.</p></section>
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
  const supporters = ["Georgetown University", "Institute for Humane Studies at George Mason University", "Bipartisan Policy Center", "Hinrich Foundation", "American Political Science Association"];
  return <div className="public-page"><header><p className="eyebrow">PARTNER WITH US</p><h1>The answer to economic disruption is not retreat; it is evidence.</h1><p>We are seeking partners who share that conviction: funders, institutions and practitioners willing to back rigorous, county-level measurement of who the economy is actually working for.</p></header><div className="story-grid"><section className="panel story-wide"><h2>Why partner with the Lab</h2><p>Support funds the data infrastructure behind ADAPT: annual index refreshes across all 3,145 counties, peer-matching and simulation tooling, and the case studies that turn measurement into usable local policy guidance. It also funds the graduate researchers who do the work.</p><p>Partnerships range from underwriting a research cycle to sponsoring a regional deep dive. We are glad to scope something specific with you.</p></section><aside className="panel"><p className="eyebrow">CONTACT</p><p>Lab for Globalization and Shared Prosperity<br/>Georgetown University<br/>37th and O Streets NW<br/>Washington, DC 20057</p></aside></div><section className="partner-section"><h2>Our donors and partners</h2><span className="gold-rule-wide"/><p>The Lab&apos;s work would not be possible without the support of our donors and partners, who span the governmental, business, and philanthropic spaces.</p><ul>{supporters.map((supporter) => <li key={supporter}>{supporter}</li>)}</ul></section></div>;
}

function MapsPage({ onMap }: { onMap: (metric: string) => void }) {
  const cards = [
    ["ADAPT", "ADAPT Index Map", "ADAPT scores how well counties equip their workers to adapt to trade.", "potential"],
    ["Services", "Tradable Services Job Gains", "Estimated job growth from exports of tradable services, 2017–2022.", "pct_pred_emp_gain"],
    ["Trade", "Manufacturing Trade Exposure", "Change in exposure to manufacturing import competition from low-income countries, 2011–2022.", "pct_pred_emp_loss"],
  ];
  return <div className="public-page v2-index-page"><header><p className="eyebrow">MAPS</p><h1>Three views of how counties are adapting</h1><p>Start with the ADAPT Index, then look underneath it at the forces that move it: services export growth and manufacturing import competition.</p></header><section><h2>County maps</h2><span className="gold-rule-wide"/><p className="muted">County-level ADAPT measures, built from the 2022 vintage of the index.</p><div className="v2-card-grid">{cards.map(([name, title, body, metric]) => <button className="v2-route-card" onClick={() => onMap(metric)} key={metric}><span className="route-preview"><span className="mini-map" aria-hidden="true"/></span><small>{title}</small><h3>{name}</h3><p>{body}</p><strong>Open map <ChevronRight size={16}/></strong></button>)}</div></section></div>;
}

function ToolsPage({ navigate }: { navigate: (view: View) => void }) {
  const tools: Array<[string,string,string,View,React.ReactNode]> = [
    ["Policy Intelligence", "Ask grounded questions about a county pair", "Compare a county with its ADAPT-computed peer, then ask a question. Model facts, policy context and every cited source are kept separate.", "investigate", <MessageSquare key="policy" size={23}/>],
    ["Peer Comparison", "Compare a county with its peers", "See how well a county is adapting next to an auto-suggested peer, or choose your own comparison, with the evidence visible beside the answer.", "compare", <Users key="peer" size={23}/>],
    ["Policy Simulator", "Test a county policy scenario", "Move the four published V2 levers and discuss what changed, what the model assumes and what the result cannot establish.", "simulator", <SlidersHorizontal key="simulator" size={23}/>],
  ];
  return <div className="public-page v2-index-page"><header><p className="eyebrow">TOOLS</p><h1>Put the ADAPT data to work</h1><p>Interactive tools built on the ADAPT dataset: policy intelligence, peer county comparison, and a policy simulator for scenario testing. Each tool includes a grounded conversation at the bottom.</p></header><div className="v2-card-grid">{tools.map(([name, title, body, target, icon]) => <button className="v2-route-card tool-card" onClick={() => navigate(target)} key={name}><span className="tool-icon">{icon}</span><h3>{name}</h3><small>{title}</small><p>{body}</p><strong>Open tool <ChevronRight size={16}/></strong></button>)}</div></div>;
}

function InsightsPage() {
  return <div className="public-page"><header><p className="eyebrow">INSIGHTS</p><h1>Case studies from successful counties.</h1><p>Short, sourced write-ups tied to individual counties: what changed, what the local policy lever was, and what the ADAPT numbers did afterwards.</p></header><section className="panel empty-v2"><BookOpen size={26}/><h2>No case studies published yet</h2><p>Published county case studies will appear here. Institutional papers and press live separately under Our Research.</p></section></div>;
}

function TeamPage({ faculty = false }: { faculty?: boolean }) {
  const names = faculty
    ? ["Niccolò Bonifai", "Rodney D. Ludema", "J. Bradford Jensen", "Nita Rudra"]
    : ["Amelia Tarno", "Joshua Anumolu", "Daisy O'Brien", "Niccolò Bonifai", "Nita Rudra"];
  return <div className="public-page"><header><p className="eyebrow">OUR TEAM</p><h1>{faculty ? "Faculty leadership" : "ADAPT core team"}</h1><p>{faculty ? "The Lab is composed of scholars who span economics, government, mathematics, foreign service, history, and public policy." : "The Lab engages Georgetown undergraduate and graduate students to contribute to our research and work closely with affiliate faculty."}</p></header><div className="team-grid">{names.map((name) => <article className="panel team-card" key={name}><span aria-hidden="true">{name.split(/\s+/).map((part) => part[0]).join('').slice(0,2)}</span><h2>{name}</h2><p>{faculty ? "Faculty leadership" : "ADAPT core team"}</p></article>)}</div></div>;
}

function ContactPage() {
  return <div className="public-page"><header><p className="eyebrow">CONTACT</p><h1>Get in touch with the Lab.</h1><p>Questions about the ADAPT index, requests for data, or interest in partnering on research.</p></header><div className="contact-grid"><section className="panel"><p className="eyebrow">MAILING ADDRESS</p><p>Lab for Globalization and Shared Prosperity<br/>Georgetown University<br/>37th and O Streets NW<br/>Washington, DC 20057</p></section><section><h2>Partnership and press</h2><span className="gold-rule-wide"/><p>For partnership enquiries, see Partner with us.</p><p className="muted">A direct contact email and enquiry form will be added once confirmed by the Lab.</p></section></div></div>;
}

function ObservatoryPage({ navigate }: { navigate: (view: View) => void }) {
  return <div className="public-page observatory-landing"><header><p className="eyebrow">OBSERVATORY</p><h1>Investigate the question behind the number.</h1><p>Continue from an ADAPT map, comparison or scenario into a sourced conversation. Add evidence, test alternative explanations and keep uncertainty visible.</p></header><div className="v2-card-grid"><button className="v2-route-card tool-card" onClick={() => navigate('investigate')}><span className="tool-icon"><Telescope size={23}/></span><h3>Investigations</h3><p>Ask follow-up questions across counties, policies, global shocks and future scenarios.</p><strong>Open investigations <ChevronRight size={16}/></strong></button><button className="v2-route-card tool-card" onClick={() => navigate('sources')}><span className="tool-icon"><BookOpen size={23}/></span><h3>Evidence Library</h3><p>Upload documents and add websites so new evidence can change the next answer.</p><strong>Manage evidence <ChevronRight size={16}/></strong></button><button className="v2-route-card tool-card" onClick={() => navigate('help')}><span className="tool-icon"><HelpCircle size={23}/></span><h3>Help & method</h3><p>Understand how questions, county data, added sources and model responses fit together.</p><strong>Read the guide <ChevronRight size={16}/></strong></button></div></div>;
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
        if (initialView && Object.hasOwn(viewLabels, initialView)) setView(initialView as View);
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
    const savedDarkMode = localStorage.getItem("adapt-observatory-theme") === "dark";
    if (savedDarkMode) queueMicrotask(() => setDark(true));
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
  return (
    <main className={view === 'home' ? 'observatory home-mode' : 'observatory'}>
      {view !== "home" && <SiteSidebar view={view} metric={metric} dark={dark} navigate={navigate} navigateMap={navigateMap} onTheme={() => setDark(!dark)} onConnect={() => setSettings(true)} />}
      <section className={view === 'home' ? 'obs-main home-main' : 'obs-main'}>
        <div className="obs-content">
          {view === 'home' && <AdaptHome onExplore={() => navigateMap('potential')} onCompare={() => navigate('compare')} onSimulate={() => navigate('simulator')} />}
          {view === 'maps' && <MapsPage onMap={navigateMap} />}
          {view === 'tools' && <ToolsPage navigate={navigate} />}
          {view === 'insights' && <InsightsPage />}
          {view === 'story' && <StoryPage />}
          {view === 'faculty' && <TeamPage faculty />}
          {view === 'team' && <TeamPage />}
          {view === 'research' && <ResearchPage />}
          {view === 'support' && <SupportPage />}
          {view === 'contact' && <ContactPage />}
          {view === 'observatory' && <ObservatoryPage navigate={navigate} />}
          {!['home','maps','tools','insights','story','faculty','team','research','support','contact','observatory'].includes(view) && <div className="page-heading">
            <div>
              <p className="eyebrow">
                AMERICAN DREAM ACHIEVABILITY PROGRESS TRACKER
              </p>
              <h1>
                {view === "explore"
                  ? metric === 'potential' ? 'ADAPT Index Map' : metric === 'pct_pred_emp_gain' ? 'Tradable Services Job Gains' : 'Manufacturing Trade Exposure'
                  : view === 'compare' ? 'Peer Comparison'
                  : view === 'simulator' ? 'Policy Simulator'
                  : view === 'help' ? 'Make the most of ADAPT.'
                  : view === "sources"
                    ? "Build your evidence base."
                    : "ADAPT Policy Intelligence"}
              </h1>
              <p>
                {view === "explore"
                  ? metric === 'potential' ? 'ADAPT scores how well counties equip their workers to adapt to trade.' : metric === 'pct_pred_emp_gain' ? 'Estimated job growth from exports of tradable services, 2017–2022.' : 'Change in exposure to manufacturing import competition from low-income countries, 2011–2022.'
                  : view === 'compare' ? 'See how well a county is adapting compared with a peer county that shares a similar economic and demographic profile, or choose your own comparison.'
                  : view === 'simulator' ? 'Choose a county, then move four levers—export exposure, K-12 spending per pupil, downstream trade exposure, and import competition—to see how the ADAPT score and level respond.'
                  : view === 'help' ? 'A step-by-step guide to counties, conversations, sources and uncertainty.'
                  : view === "sources"
                    ? "Bring sources into the conversation and control what informs your answers."
                    : "County comparisons grounded in ADAPT data and the public or uploaded sources you choose."}
              </p>
            </div>
          </div>}
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          {['explore','compare','simulator','investigate'].includes(view) && <div className="county-toolbar">
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
                    onClick={() => navigate('investigate')}
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
          <div id="evidence-companion" hidden={!['compare','simulator','investigate'].includes(view)}>
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
        </div>
        <footer className="v2-site-footer">
          <div><section><h2>American Dream Achievability Progress Tracker</h2><p>A research project of the Georgetown University Lab for Globalization and Shared Prosperity, tracking county-level economic opportunity for workers without a four-year degree.</p></section><address><strong>Lab for Globalization and Shared Prosperity</strong><br/>Georgetown University<br/>37th and O Streets NW<br/>Washington, DC 20057</address></div>
          <p>© {new Date().getFullYear()} Georgetown University Lab for Globalization and Shared Prosperity.</p>
        </footer>
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
