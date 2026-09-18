"use client";

import type { County } from "@/lib/types";
import {
  bandForPercentile,
  formatDollars,
  formatPercentagePoints,
  outcomePercentile,
  ordinal,
  perPupilDollars,
  type V2CountyContent,
  v2Level,
} from "@/lib/v2-content";

const BAND_LABELS = ["Very Low", "Low", "Medium", "High", "Very High"];

type Measure = {
  label: string;
  note: string;
  higherIsBetter: boolean;
  value: (row: V2CountyContent) => number | null;
  format: (value: number | null) => string;
};

const measures: Measure[] = [
  {
    label: "ADAPT index score",
    note: "Distance from the county's potential, so a lower score is the better outcome.",
    higherIsBetter: false,
    value: (row) => row.potential,
    format: (value) => value == null ? "No data" : value.toFixed(3),
  },
  {
    label: "Employment-rate change, 2011–2022",
    note: "Change in the employment rate of workers without a bachelor's degree, in percentage points.",
    higherIsBetter: true,
    value: (row) => row.employmentRateChange,
    format: (value) => formatPercentagePoints(value),
  },
  {
    label: "K-12 spending per pupil (2022 $)",
    note: "Per-pupil K-12 current spending, deflated to 2022 dollars.",
    higherIsBetter: true,
    value: (row) => perPupilDollars(row.perPupilLog),
    format: formatDollars,
  },
  {
    label: "Tradable services job gains",
    note: "Standard deviations of estimated job growth from exports of tradable services.",
    higherIsBetter: true,
    value: (row) => row.servicesZ,
    format: (value) => value == null ? "No data" : `${value.toFixed(2)}σ`,
  },
  {
    label: "Manufacturing trade exposure (direct import competition)",
    note: "Direct import competition from developing countries in manufactured goods, not downstream exposure.",
    higherIsBetter: false,
    value: (row) => row.manufacturingZ,
    format: (value) => value == null ? "No data" : `${value.toFixed(2)}σ`,
  },
  {
    label: "Import competition (manufacturing), 2011–2022",
    note: "Change in exposure to import competition from developing-country manufacturers. A bigger increase tends to mean more pressure on local manufacturing jobs.",
    higherIsBetter: false,
    value: (row) => row.rawImportCompetition,
    format: (value) => formatPercentagePoints(value, 1),
  },
  {
    label: "Export exposure, 2011–2022",
    note: "Change in exposure to export demand. A bigger increase tends to mean more local jobs supported by selling to the rest of the world.",
    higherIsBetter: true,
    value: (row) => row.rawExportExposure,
    format: (value) => formatPercentagePoints(value, 1),
  },
  {
    label: "Downstream input exposure, 2011–2022",
    note: "Change in exposure to cheaper imported inputs used by local industries. A bigger increase tends to mean local businesses benefiting from cheaper supplies.",
    higherIsBetter: true,
    value: (row) => row.rawDownstreamExposure,
    format: (value) => formatPercentagePoints(value, 1),
  },
];

export default function V2PeerComparison({
  selected,
  v2Counties,
}: {
  selected: County[];
  v2Counties: V2CountyContent[];
}) {
  const home = v2Counties.find((row) => row.countyid === selected[0]?.countyid);
  const peer = v2Counties.find((row) => row.countyid === selected[1]?.countyid);
  if (!home || !peer) {
    return <section className="v2-peer-original panel"><p>Loading the original ADAPT peer measures…</p></section>;
  }
  const cohort = v2Counties.filter((row) => row.populationGroup === home.populationGroup);
  return <section className="v2-peer-original panel">
    <div className="v2-peer-heading">
      <div>
        <p className="eyebrow">ORIGINAL ADAPT PEER COMPARISON</p>
        <h2>How {home.name} compares</h2>
        <p>Each bar ranks the county against {cohort.length.toLocaleString()} counties with a similar population size, from 0 (weakest) to 100 (strongest) on that measure.</p>
      </div>
      <div className="v2-level-pair">
        <article><small>{home.name}</small><strong>{v2Level(home.qpotential)}</strong></article>
        <article><small>{peer.name}</small><strong>{v2Level(peer.qpotential)}</strong></article>
      </div>
    </div>
    <div className="v2-measure-list">
      {measures.map((measure) => {
        const homeRaw = measure.value(home);
        const peerRaw = measure.value(peer);
        const values = cohort.map(measure.value).filter((value): value is number => value != null);
        const percentile = outcomePercentile(homeRaw, values, measure.higherIsBetter);
        const peerPercentile = outcomePercentile(peerRaw, values, measure.higherIsBetter);
        const band = bandForPercentile(percentile);
        return <article className="v2-measure" key={measure.label}>
          <header><strong>{measure.label}</strong><span>{percentile == null ? "—" : `${ordinal(percentile)} percentile`}</span></header>
          <div className="v2-percentile-track">
            <span className={`v2-percentile-fill band-${Math.max(0, band)}`} style={{width:`${percentile ?? 0}%`}} />
            {peerPercentile != null && <i style={{left:`calc(${peerPercentile}% - 2px)`}} title={`${peer.name}: ${peerPercentile}th percentile`} />}
          </div>
          <div className="v2-band-labels">{BAND_LABELS.map((label) => <small key={label}>{label}</small>)}</div>
          <p><b>{home.name}:</b> {measure.format(homeRaw)}{percentile == null ? "" : ` (${ordinal(percentile)})`} · <b>{peer.name}:</b> {measure.format(peerRaw)}{peerPercentile == null ? "" : ` (${ordinal(peerPercentile)})`}</p>
          <small>{measure.note}</small>
        </article>;
      })}
    </div>
    <aside className="tradable-note"><strong>What are tradable services?</strong><p>Most people think of trade as physical goods crossing a border, but many services can be traded too. When a service is bought or sold across borders—through technology, phone, or travel—it counts as a tradable service. Examples include management consulting, legal services, tourism, and call-center or communications work.</p></aside>
  </section>;
}
