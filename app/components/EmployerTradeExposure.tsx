"use client";

import { useEffect, useMemo, useState } from "react";
import { Factory } from "lucide-react";
import type { V2CountyContent, V2Occupation } from "@/lib/v2-content";

type Layer = "exportEmployerShare" | "importEmployerShare" | "downstreamEmployerShare";
const layers: Record<Layer, { label: string; heading: string; body: string }> = {
  exportEmployerShare: {
    label: "Export Exposure",
    heading: "What is Export Exposure?",
    body: "Export Exposure measures how much employment in each county is in industries that export goods to the world. This measure shows what percent of a local labor market is employed in industries that are highly engaged in exports of manufactured goods. Exporting expands employment and growth in local economies.",
  },
  importEmployerShare: {
    label: "Import Competition",
    heading: "What is Import Competition?",
    body: "Import Competition measures how much employment in each county faces exposure to import competition in manufactured goods from developing countries. Import competition reduces employment and wages in local economies.",
  },
  downstreamEmployerShare: {
    label: "Downstream Exposure",
    heading: "What is Downstream Exposure?",
    body: "Downstream Exposure measures how much employment in each county is in industries that are poised to benefit from imported intermediate goods from developing countries. Examples include imported steel in construction and personal protective equipment for hospitals. Greater downstream exposure boosts employment from greater access to cheaper inputs.",
  },
};
const ramp = ["#edf3f7", "#bfd3df", "#83a5bd", "#4a7799", "#164d72"];
const pct = (value: number | null | undefined) => value == null ? "No data" : `${value.toFixed(1)}%`;

export default function EmployerTradeExposure({
  counties,
  paths,
  selectedId,
  onSelect,
}: {
  counties: V2CountyContent[];
  paths: { id: number; path: string }[];
  selectedId?: number;
  onSelect: (id: number) => void;
}) {
  const [layer, setLayer] = useState<Layer>("exportEmployerShare");
  const [occupationResult, setOccupationResult] = useState<{ czone: number; rows: V2Occupation[] } | null>(null);
  const selected = counties.find((row) => row.countyid === selectedId);
  const rank = useMemo(() => {
    const rows = counties.filter((row) => row[layer] != null).sort((a, b) => (a[layer] ?? 0) - (b[layer] ?? 0));
    return new Map(rows.map((row, index) => [row.countyid, Math.min(4, Math.floor(index / Math.max(1, rows.length) * 5))]));
  }, [counties, layer]);
  useEffect(() => {
    if (!selected?.czone) return;
    const czone = selected.czone;
    let cancelled = false;
    fetch(`/api/v2-content?czone=${czone}`)
      .then((response) => response.ok ? response.json() : { occupations: [] })
      .then((data: { occupations?: V2Occupation[] }) => {
        if (!cancelled) setOccupationResult({ czone, rows: data.occupations || [] });
      })
      .catch(() => {
        if (!cancelled) setOccupationResult({ czone, rows: [] });
      });
    return () => { cancelled = true; };
  }, [selected?.czone]);
  const copy = layers[layer];
  const occupations = selected?.czone === occupationResult?.czone ? occupationResult.rows : [];
  return <div className="employer-page">
    <section className="panel employer-map-panel">
      <div className="panel-heading"><div><p className="eyebrow">TOOLS · EMPLOYER</p><h2>{copy.label}</h2><p>Employer trade exposure across U.S. commuting zones.</p></div><label className="metric-select"><select value={layer} onChange={(event) => setLayer(event.target.value as Layer)}>{Object.entries(layers).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label></div>
      <div className="employer-map-layout">
        <svg viewBox="0 0 1000 620" role="img" aria-label={`${copy.label} county map`}>
          {paths.map((path) => <path key={path.id} d={path.path} fill={path.id === selectedId ? "#d99b38" : rank.has(path.id) ? ramp[rank.get(path.id)!] : "#d7dcdf"} stroke="#fff" strokeWidth={path.id === selectedId ? 1.7 : .35} onClick={() => onSelect(path.id)}><title>{counties.find((row) => row.countyid === path.id)?.name}: {pct(counties.find((row) => row.countyid === path.id)?.[layer])}</title></path>)}
        </svg>
        <aside>
          <Factory size={24}/><p className="eyebrow">SELECTED COMMUNITY</p><h2>{selected ? `${selected.name}, ${selected.state}` : "Choose a county"}</h2>
          {selected && <><p>{selected.largestPlace || "Commuting zone"} · CZ {selected.czone ?? "—"}</p><dl><div><dt>Exports</dt><dd>{pct(selected.exportEmployerShare)}</dd></div><div><dt>Import competition</dt><dd>{pct(selected.importEmployerShare)}</dd></div><div><dt>Downstream</dt><dd>{pct(selected.downstreamEmployerShare)}</dd></div></dl></>}
        </aside>
      </div>
    </section>
    <section className="employer-detail-grid">
      <article className="panel"><p className="eyebrow">ABOUT THIS MEASURE</p><h2>{copy.heading}</h2><p>{copy.body}</p></article>
      <article className="panel"><p className="eyebrow">COMMON OCCUPATIONS IN THIS COMMUTING ZONE</p><h2>Workers without a bachelor&apos;s degree</h2>{occupations.length ? <ol>{occupations.slice(0,5).map((occupation) => <li key={occupation.rank}><span>{occupation.name}</span><b>{occupation.workers == null ? "—" : Math.round(occupation.workers).toLocaleString()}</b></li>)}</ol> : <p>Select a county with commuting-zone data to see its leading occupations.</p>}</article>
    </section>
  </div>;
}
