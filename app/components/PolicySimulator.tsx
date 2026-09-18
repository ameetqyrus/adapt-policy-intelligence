"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { County } from "@/lib/types";
import {
  projectFromRaw,
  quintileLabel,
  quintileOf,
  quintileShort,
  simBaseline,
  type FormulaParams,
  type SimCountyInputs,
  type SimLevers,
  type SimStats,
} from "@/lib/v2-simulator";

type Payload = { inputs: SimCountyInputs; stats: SimStats; params: FormulaParams; cohort: number[] };
type RangeKey = "spend" | "x" | "dw" | "m";

const RAW_RANGES: Record<RangeKey, { min: number; max: number; step: number }> = {
  spend: { min: 5000, max: 30000, step: 250 },
  x: { min: -3, max: 3.5, step: 0.1 },
  dw: { min: 0.03, max: 0.18, step: 0.005 },
  m: { min: -0.5, max: 3, step: 0.05 },
};

function rangeFor(key: RangeKey, baseline: number) {
  const range = RAW_RANGES[key];
  return { ...range, min: Math.min(range.min, baseline), max: Math.max(range.max, baseline) };
}

function dollars(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function points(value: number) {
  return `${value < 0 ? "−" : ""}${Math.abs(value).toFixed(2)} pp`;
}

function Lever({
  label,
  value,
  baseline,
  range,
  format,
  help,
  onChange,
}: {
  label: string;
  value: number;
  baseline: number;
  range: { min: number; max: number; step: number };
  format: (value: number) => string;
  help: string;
  onChange: (value: number) => void;
}) {
  return <div className="sim-lever">
    <div className="sim-lever-heading"><label>{label}</label><strong>{format(value)}</strong></div>
    <input aria-label={label} type="range" min={range.min} max={range.max} step={range.step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    <p>{help} Baseline: {format(baseline)}.</p>
  </div>;
}

export default function PolicySimulator({ county }: { county: County | undefined }) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [levers, setLevers] = useState<SimLevers | null>(null);
  const [failure, setFailure] = useState<{ countyid: number; message: string } | null>(null);

  useEffect(() => {
    if (!county) return;
    const controller = new AbortController();
    fetch(`/api/simulator?countyid=${county.countyid}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json() as Payload & { error?: string };
        if (!response.ok) throw new Error(data.error || "Unable to load simulator data.");
        return data;
      })
      .then((data) => {
        setPayload(data);
        setLevers(simBaseline(data.inputs));
        setFailure(null);
      })
      .catch((reason) => {
        if (reason instanceof Error && reason.name !== "AbortError") setFailure({ countyid: county.countyid, message: reason.message });
      });
    return () => controller.abort();
  }, [county]);

  const baseline = payload ? simBaseline(payload.inputs) : null;
  const result = payload && levers ? projectFromRaw(payload.inputs, levers, payload.stats, payload.params) : null;
  const dirty = Boolean(baseline && levers && Object.keys(baseline).some((key) => baseline[key as RangeKey] !== levers[key as RangeKey]));
  const projectedQuintile = !dirty
    ? payload?.inputs.qpotential ?? null
    : result
      ? quintileOf(result.projected, payload?.cohort ?? [])
      : null;

  if (!county) return <section className="panel scenario-panel"><p>Select a county to use the simulator.</p></section>;
  const error = failure?.countyid === county.countyid ? failure.message : "";
  const loading = !error && payload?.inputs.countyid !== county.countyid;
  if (loading) return <section className="panel scenario-panel"><p className="eyebrow">ADAPT POLICY SIMULATOR</p><h2>Loading authoritative V2 inputs…</h2></section>;
  if (error) return <section className="panel scenario-panel"><p className="eyebrow">ADAPT POLICY SIMULATOR</p><h2>Simulator data is unavailable</h2><p className="alert">{error}</p><a className="secondary" href="https://adaptdashboard.com/tools/simulator" target="_blank" rel="noreferrer">Open the V2 simulator ↗</a></section>;
  if (!payload || !baseline || !levers || !result) return null;

  return <section className="panel scenario-panel native-simulator">
    <div className="sim-title-row">
      <div><p className="eyebrow">ADAPT POLICY SIMULATOR · V2 MODEL</p><h2>Move four levers. See how the ADAPT level responds.</h2><p>{county.name}. The formula and raw inputs come from the V2 ADAPT data source; this is a scenario, not a forecast.</p></div>
      <button className="secondary" disabled={!dirty} onClick={() => setLevers(baseline)}><RotateCcw size={15}/> Reset baseline</button>
    </div>
    <div className="simulator-grid">
      <div className="sim-levers">
        <Lever label="Export exposure" value={levers.x} baseline={baseline.x} range={rangeFor("x", baseline.x)} format={points} help="Export-driven demand for local employers." onChange={(x) => setLevers({ ...levers, x })}/>
        <Lever label="Per-pupil spending" value={levers.spend} baseline={baseline.spend} range={rangeFor("spend", baseline.spend)} format={dollars} help="K–12 spending per pupil in 2022 dollars." onChange={(spend) => setLevers({ ...levers, spend })}/>
        <Lever label="Downstream trade exposure" value={levers.dw} baseline={baseline.dw} range={rangeFor("dw", baseline.dw)} format={points} help="Exposure at downstream employers using imported inputs." onChange={(dw) => setLevers({ ...levers, dw })}/>
        <Lever label="Import competition" value={levers.m} baseline={baseline.m} range={rangeFor("m", baseline.m)} format={points} help="Exposure to import competition from low-income countries." onChange={(m) => setLevers({ ...levers, m })}/>
      </div>
      <div className="sim-results">
        <div className="sim-levels">
          <article><span>Current level</span><strong>{quintileShort(payload.inputs.qpotential)}</strong><small>{quintileLabel(payload.inputs.qpotential)}</small></article>
          <article><span>Projected level</span><strong>{quintileShort(projectedQuintile)}</strong><small>{quintileLabel(projectedQuintile)}</small></article>
        </div>
        <article className="sim-explainer">
          <p className="eyebrow">HOW THIS PROJECTION WORKS</p>
          {result.flagged ? <p>This county&apos;s import-competition exposure is below the threshold over which the V2 model treats additional spending as beneficial. Increase that lever to explore the interaction.{result.requiredRawM != null ? <> The threshold is reached near <b>{points(result.requiredRawM)}</b>.</> : null}</p> : <p>The ADAPT score measures how far a county sits from the potential set by successful peers. Export and downstream exposure raise modeled employment, while the modeled return to per-pupil spending varies with import competition.</p>}
          <small>Standardized import-competition exposure after this change: {result.zDmd.toFixed(3)}.</small>
        </article>
        <p className="sim-notice"><b>Interpretation guardrail.</b> A scenario response is not a causal estimate, budget forecast, or prediction. It shows how the published V2 formula responds when one or more inputs change.</p>
      </div>
    </div>
  </section>;
}
