export type V2CountyContent = {
  countyid: number;
  name: string;
  state: string | null;
  region: string | null;
  populationGroup: string | null;
  potential: number | null;
  qpotential: number | null;
  perPupilLog: number | null;
  employmentRateChange: number | null;
  servicesZ: number | null;
  manufacturingZ: number | null;
  rawImportCompetition: number | null;
  rawExportExposure: number | null;
  rawDownstreamExposure: number | null;
  czone: number | null;
  largestPlace: string | null;
  exportEmployerShare: number | null;
  importEmployerShare: number | null;
  downstreamEmployerShare: number | null;
  peerId: number | null;
};

export type V2Occupation = {
  rank: number;
  name: string;
  workers: number | null;
};

export function v2MapValue(metric: string, row?: V2CountyContent) {
  if (!row) return null;
  if (metric === "potential") return row.potential;
  if (metric === "pct_pred_emp_gain") return row.servicesZ;
  if (metric === "pct_pred_emp_loss") return row.manufacturingZ;
  return null;
}

export function v2MapRankValue(metric: string, row?: V2CountyContent) {
  if (!row) return null;
  if (metric === "potential") {
    return row.qpotential == null ? null : 6 - row.qpotential;
  }
  return v2MapValue(metric, row);
}

export function formatV2MapValue(metric: string, value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "No data";
  if (metric === "potential") return value.toFixed(3);
  return `${value.toFixed(2)}σ`;
}

export function perPupilDollars(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? null : Math.exp(value);
}

export function formatDollars(value: number | null | undefined) {
  return value == null || !Number.isFinite(value)
    ? "No data"
    : `$${Math.round(value).toLocaleString("en-US")}`;
}

export function formatPercentagePoints(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value)) return "No data";
  const points = value * 100;
  return `${points >= 0 ? "+" : "−"}${Math.abs(points).toFixed(digits)} pp`;
}

export function v2Level(quintile: number | null | undefined) {
  return quintile === 1
    ? "Very High"
    : quintile === 2
      ? "High"
      : quintile === 3
        ? "Medium"
        : quintile === 4
          ? "Low"
          : quintile === 5
            ? "Very Low"
            : "Not reported";
}

export function populationGroupLabel(group: string | null | undefined) {
  if (!group) return "Not reported";
  return group
    .replace("quartile", "group")
    .replace("quintile", "group")
    .replace(/\s*\((by people|by counties)\)/i, "")
    .trim();
}

export function zScoreLevel(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "No data";
  if (value <= -1) return "Very Low";
  if (value <= -0.33) return "Low";
  if (value <= 0.33) return "Medium";
  if (value <= 1) return "High";
  return "Very High";
}

export function percentileOf(value: number | null, cohort: number[]) {
  if (value == null || !cohort.length) return null;
  const below = cohort.filter((candidate) => candidate < value).length;
  return Math.round((below / cohort.length) * 100);
}

export function outcomePercentile(
  value: number | null,
  cohort: number[],
  higherIsBetter: boolean,
) {
  const percentile = percentileOf(value, cohort);
  return percentile == null ? null : higherIsBetter ? percentile : 100 - percentile;
}

export function bandForPercentile(percentile: number | null) {
  if (percentile == null) return -1;
  if (percentile < 20) return 0;
  if (percentile < 40) return 1;
  if (percentile < 60) return 2;
  if (percentile < 80) return 3;
  return 4;
}

export function ordinal(value: number) {
  const rounded = Math.abs(Math.round(value));
  const mod100 = rounded % 100;
  const suffix = mod100 >= 11 && mod100 <= 13
    ? "th"
    : rounded % 10 === 1
      ? "st"
      : rounded % 10 === 2
        ? "nd"
        : rounded % 10 === 3
          ? "rd"
          : "th";
  return `${Math.round(value)}${suffix}`;
}
