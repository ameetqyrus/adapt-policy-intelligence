"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  Compass,
  Layers,
  MessageSquare,
  Moon,
  Search,
  Settings,
  Sun,
  X,
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
type View = "explore" | "investigate" | "sources" | "original";
const colors = ["#164d72", "#4a7799", "#83a5bd", "#bfd3df", "#e5edf1"];
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
  const [view, setView] = useState<View>("explore"),
    [counties, setCounties] = useState<County[]>([]),
    [selected, setSelected] = useState<number[]>([39149, 39011]),
    [metric, setMetric] = useState("potential");
  const [paths, setPaths] = useState<{ id: number; path: string }[]>([]),
    [details, setDetails] = useState<Record<string, CountyDetail>>({}),
    [error, setError] = useState(""),
    [dark, setDark] = useState(false),
    [settings, setSettings] = useState(false),
    [tab, setTab] = useState("overview"),
    [hover, setHover] = useState<number | null>(null);
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
    setSelected((old) =>
      old.includes(id)
        ? [id, ...old.filter((x) => x !== id)]
        : [id, ...old.slice(0, 3)],
    );
  }
  return (
    <main className="observatory">
      <aside className="obs-nav">
        <a className="obs-brand" href="/">
          <span className="brand-mark">
            A<span />
          </span>
          <div>
            ADAPT<small>OBSERVATORY</small>
          </div>
        </a>
        <div className="nav-caption">YOUR WORKSPACE</div>
        <nav>
          {(
            [
              ["explore", Compass, "Explore counties"],
              ["investigate", MessageSquare, "Investigations"],
              ["sources", BookOpen, "Evidence library"],
              ["original", Layers, "Original dashboard"],
            ] as const
          ).map(([id, Icon, title]) => (
            <button
              className={view === id ? "active" : ""}
              onClick={() => setView(id)}
              key={id}
            >
              <Icon size={19} />
              {title}
              {view === id && <span className="nav-line" />}
            </button>
          ))}
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
      </aside>
      <section className="obs-main">
        <header className="obs-top">
          <div className="breadcrumb">
            Workspace <span>/</span>{" "}
            {view === "explore"
              ? "Explore counties"
              : view === "sources"
                ? "Evidence library"
                : view === "original"
                  ? "Original dashboard"
                  : "Investigations"}
          </div>
          <button className="mobile-settings" onClick={() => setSettings(true)}>
            <Settings size={16} />
            AI connection
          </button>
          <span className="private-label">ADAPT · County intelligence</span>
          <button
            className="icon-btn mobile-theme"
            aria-label="Toggle appearance"
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>
        <div className="obs-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                AMERICAN DREAM ACHIEVABILITY PROGRESS TRACKER
              </p>
              <h1>
                {view === "explore"
                  ? "Opportunity has a geography."
                  : view === "sources"
                    ? "Build your evidence base."
                    : view === "original"
                      ? "The original ADAPT dashboard."
                      : "Follow the question."}
              </h1>
              <p>
                {view === "explore"
                  ? "Explore what is changing. Compare places. Ask what might explain the difference."
                  : view === "sources"
                    ? "Bring sources into the conversation and control what informs your answers."
                    : view === "original"
                      ? "The original research interface, alongside your investigation workspace."
                      : "An open conversation about policies, global change and local outcomes."}
              </p>
            </div>
            {view === "explore" && (
              <button
                className="primary"
                onClick={() => setView("investigate")}
              >
                <MessageSquare size={17} />
                Start an investigation
                <ArrowUpRight size={16} />
              </button>
            )}
          </div>
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          <div className="county-toolbar">
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
                        setSelected(selected.filter((id) => id !== c.countyid))
                      }
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <span className="toolbar-hint">Up to 4 counties</span>
          </div>
          {view === "explore" && (
            <>
              <div className="explore-layout">
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
                    <svg
                      viewBox="0 0 1000 620"
                      role="img"
                      aria-label="Interactive United States county map"
                    >
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
                          setSelected([home.countyid, home.peer!.countyid])
                        }
                      >
                        Compare this pair <ArrowUpRight size={15} />
                      </button>
                    </div>
                  )}
                  <button
                    className="text-action"
                    onClick={() => setView("investigate")}
                  >
                    Ask about this county <ArrowUpRight size={16} />
                  </button>
                </aside>
              </div>
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
            </>
          )}
          {view === "original" && (
            <div className="panel original-panel">
              <div className="panel-heading">
                <p>
                  ADAPT’s original maps, methodology and county-pair research.
                </p>
                <a
                  className="secondary"
                  href="https://www.adaptdashboard.com/maps/adapt"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open full dashboard <ArrowUpRight size={15} />
                </a>
              </div>
              <iframe
                title="Original ADAPT dashboard"
                src="https://www.adaptdashboard.com/maps/adapt"
                loading="lazy"
              />
              <p className="muted">
                If the dashboard does not allow embedding, use “Open full
                dashboard”. County exploration uses the same repository
                datasets.
              </p>
            </div>
          )}
          <div hidden={view !== "investigate"}>
            <Investigations
              counties={chosen}
              connection={connection}
              onConnect={() => setSettings(true)}
              onCounties={setSelected}
            />
          </div>
          <div hidden={view !== "sources"}>
            <EvidenceLibrary
              connection={connection}
              onConnect={() => setSettings(true)}
            />
          </div>
          <WebTools counties={counties} onSelect={setSelected} />
          <footer className="workspace-footer">
            <span>ADAPT Observatory</span>
            <a
              href="https://github.com/cgsp-georgetown/adapt-viz"
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
