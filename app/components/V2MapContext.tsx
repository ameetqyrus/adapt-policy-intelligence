"use client";

import {
  formatDollars,
  formatPercentagePoints,
  formatV2MapValue,
  perPupilDollars,
  populationGroupLabel,
  type V2CountyContent,
  v2Level,
  v2MapValue,
  zScoreLevel,
} from "@/lib/v2-content";

const descriptions: Record<string, { heading: string; body: string }> = {
  potential: {
    heading: "How ADAPT is calculated",
    body: "Using three decades of trade, spending, and employment data, we have calculated a set of factors which have a positive impact on employment outcomes of workers without bachelor's degrees. These factors are: export exposure, imported intermediate goods, per pupil K-12 education spending, and a combination of imported goods from low-wage countries and per pupil spending. Comparing counties with others of similar populations, we have determined which counties have succeeded in each of these categories. For less successful counties, we determine how far away from their potential they are using the peer counties. Counties who have reached their potential get a high ADAPT score, showing they have already achieved the best outcomes for their workers without bachelor's degrees. Counties with low ADAPT scores are far from their potential, and should put policies in place to reach the level of their successful peers.",
  },
  pct_pred_emp_gain: {
    heading: "What are tradable services?",
    body: "People tend to think of trade as being manufactured goods, but services can be tradable too. When a service is exchanged across borders through technology or travel, it is being traded. Examples include management consulting, legal services, tourism, and communication related services.",
  },
  pct_pred_emp_loss: {
    heading: "What is manufacturing trade exposure?",
    body: "This measure shows how exposed a county's manufacturing sector is to import competition from developing countries. Higher values mean deeper exposure to imported-goods competition, which tends to reduce local employment and wages.",
  },
};

export function V2CountyProfile({ row, metric }: { row?: V2CountyContent; metric: string }) {
  if (!row) return null;
  return <div className="v2-county-profile">
    <p className="eyebrow">ADAPT COUNTY PROFILE</p>
    <div className="v2-profile-grid">
      <div><small>ADAPT level</small><strong>{v2Level(row.qpotential)}</strong></div>
      <div><small>Population group</small><strong>{populationGroupLabel(row.populationGroup)}</strong></div>
      <div><small>K-12 spending per pupil</small><strong>{formatDollars(perPupilDollars(row.perPupilLog))}</strong></div>
      <div><small>Employment-rate change</small><strong>{formatPercentagePoints(row.employmentRateChange)}</strong></div>
      <div><small>Manufacturing exposure</small><strong>{zScoreLevel(row.manufacturingZ)} · {formatV2MapValue("pct_pred_emp_loss", row.manufacturingZ)}</strong></div>
      <div><small>Tradable services gains</small><strong>{zScoreLevel(row.servicesZ)} · {formatV2MapValue("pct_pred_emp_gain", row.servicesZ)}</strong></div>
    </div>
    {metric !== "potential" && <p className="v2-profile-current">Current map measure: <b>{formatV2MapValue(metric, v2MapValue(metric, row))}</b></p>}
  </div>;
}

export default function V2MapContext({ metric, counties }: { metric: string; counties: V2CountyContent[] }) {
  const description = descriptions[metric];
  if (!description) return null;
  const groups = [...new Set(counties.map((row) => row.populationGroup).filter(Boolean))] as string[];
  const leaders = groups.map((group) => {
    const rows = counties.filter((row) => row.populationGroup === group && v2MapValue(metric, row) != null);
    rows.sort((a, b) => {
      const av = v2MapValue(metric, a) ?? 0;
      const bv = v2MapValue(metric, b) ?? 0;
      return metric === "potential" || metric === "pct_pred_emp_loss" ? av - bv : bv - av;
    });
    return rows[0];
  }).filter((row): row is V2CountyContent => Boolean(row));
  const displayValue = (row: V2CountyContent) => metric === "potential"
    ? `${v2Level(row.qpotential)} · score ${formatV2MapValue(metric, v2MapValue(metric, row))}`
    : `${zScoreLevel(v2MapValue(metric, row))} · ${formatV2MapValue(metric, v2MapValue(metric, row))}`;
  return <section className="v2-map-context">
    <article className="panel v2-map-explainer"><p className="eyebrow">LEARN MORE</p><h2>{description.heading}</h2><p>{description.body}</p></article>
    <article className="panel v2-map-rankings"><p className="eyebrow">EXPLORE THE RANKINGS</p><h2>Leaders by population group</h2><p>The leading county in each population group for this measure.</p><div>{leaders.map((row) => <span key={row.countyid}><small>{populationGroupLabel(row.populationGroup)}</small><b>{row.name}, {row.state}</b><em>{displayValue(row)}</em></span>)}</div></article>
    {metric === "potential" && <p className="v2-coming-soon">Find out where local social investment is increasing <b>Coming soon</b></p>}
  </section>;
}
