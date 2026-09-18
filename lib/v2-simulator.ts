export type RawStats = { mean: number; sd: number };
export type SimStats = { m: RawStats; x: RawStats; dw: RawStats };

export type SimCountyInputs = {
  countyid: number;
  spend_ppupil_2022: number | null;
  incwage_2022: number | null;
  nationalwage_2022: number | null;
  d_m_usdev82011_2022: number | null;
  d_x_uswld_2011_2022: number | null;
  d_m_dw_usdev82011_2022: number | null;
  p90_spend: number | null;
  p90_dw: number | null;
  p90_x: number | null;
  z_d_m_up_usdev82011_2022: number | null;
  potential: number | null;
  qpotential: number | null;
};

export type SimLevers = { spend: number; dw: number; x: number; m: number };
export type FormulaParams = Record<string, number>;
export type SimResult = {
  projected: number;
  flagged: boolean;
  zDmd: number;
  threshold: number;
  requiredRawM: number | null;
};

export const FORMULA_DEFAULTS: FormulaParams = {
  beta_spend: 0.06508330658340589,
  beta_dmd: 0.2092671314318379,
  beta_x: 0.03322357711942192,
  beta_dw_post: 0.1479792856183049,
  flag_threshold: -0.3110058714815647,
};

export function simBaseline(inputs: SimCountyInputs): SimLevers {
  return {
    spend: inputs.spend_ppupil_2022 ?? 0,
    dw: inputs.d_m_dw_usdev82011_2022 ?? 0,
    x: inputs.d_x_uswld_2011_2022 ?? 0,
    m: inputs.d_m_usdev82011_2022 ?? 0,
  };
}

export function projectFromRaw(
  inputs: SimCountyInputs,
  levers: SimLevers,
  stats: SimStats,
  params: FormulaParams | null,
): SimResult {
  const p = { ...FORMULA_DEFAULTS, ...(params ?? {}) };
  const betaSpend = p.beta_spend ?? FORMULA_DEFAULTS.beta_spend;
  const betaDmd = p.beta_dmd ?? FORMULA_DEFAULTS.beta_dmd;
  const betaDw = p.beta_dw_post ?? FORMULA_DEFAULTS.beta_dw_post;
  const betaX = p.beta_x ?? FORMULA_DEFAULTS.beta_x;

  const incwage = inputs.incwage_2022 ?? 0;
  const nationalwage = inputs.nationalwage_2022 ?? 1;
  const p90Spend = inputs.p90_spend ?? 0;
  const p90Dw = inputs.p90_dw ?? 0;
  const p90X = inputs.p90_x ?? 0;
  const zUp = inputs.z_d_m_up_usdev82011_2022 ?? 0;

  const newPpupilDeflate = Math.log(levers.spend / (incwage / nationalwage));
  const newD90Spend = Math.max(0, p90Spend - newPpupilDeflate);
  const newZDw = (levers.dw - stats.dw.mean) / stats.dw.sd;
  const newD90Dw = Math.max(0, p90Dw - newZDw);
  const newZX = (levers.x - stats.x.mean) / stats.x.sd;
  const newD90X = Math.max(0, p90X - newZX);
  const newZM = (levers.m - stats.m.mean) / stats.m.sd;
  const newZDmd = 0.5 * newZM + 0.5 * zUp;
  const threshold = -betaSpend / betaDmd;
  const flagged = newZDmd < threshold;
  const projected = flagged
    ? betaDw * newD90Dw + betaX * newD90X
    : betaSpend * newD90Spend +
      betaDmd * newZDmd * newD90Spend +
      betaDw * newD90Dw +
      betaX * newD90X;

  let requiredRawM: number | null = null;
  if (flagged) {
    const requiredZM = 2 * threshold - zUp;
    requiredRawM = requiredZM * stats.m.sd + stats.m.mean;
  }
  return { projected, flagged, zDmd: newZDmd, threshold, requiredRawM };
}

export function quintileOf(score: number, cohort: number[]): number {
  if (cohort.length === 0) return 0;
  const below = cohort.filter((value) => value < score).length;
  return Math.min(5, Math.max(1, Math.ceil(((below / cohort.length) * 100 || 1) / 20)));
}

export function quintileShort(q: number | null | undefined): string {
  if (!q || q < 1 || q > 5) return "No data";
  return ["Very High", "High", "Medium", "Low", "Very Low"][q - 1] ?? "No data";
}

export function quintileLabel(q: number | null | undefined): string {
  return [
    "No level data",
    "Strongest ADAPT standing",
    "Above average",
    "About average",
    "Below average",
    "Weakest ADAPT standing",
  ][q ?? 0] ?? "No level data";
}

export function calibrateStats(pairs: Array<{ x: number; y: number }>): RawStats {
  const sorted = [...pairs].sort((a, b) => a.x - b.x);
  const decile = Math.max(1, Math.floor(sorted.length * 0.1));
  const lo = sorted.slice(0, decile);
  const hi = sorted.slice(sorted.length - decile);
  const slopes: number[] = [];
  for (let i = 0; i < Math.min(lo.length, hi.length); i += 1) {
    const a = lo[i];
    const b = hi[hi.length - 1 - i];
    if (a && b && b.x !== a.x) slopes.push((b.y - a.y) / (b.x - a.x));
  }
  slopes.sort((a, b) => a - b);
  const slope = slopes[Math.floor(slopes.length / 2)];
  if (!Number.isFinite(slope) || slope === 0) throw new Error("Unable to calibrate simulator statistics.");
  const intercepts = pairs.map((pair) => pair.y - slope * pair.x).sort((a, b) => a - b);
  const intercept = intercepts[Math.floor(intercepts.length / 2)];
  if (!Number.isFinite(intercept)) throw new Error("Unable to calibrate simulator statistics.");
  return { mean: -intercept / slope, sd: 1 / slope };
}
