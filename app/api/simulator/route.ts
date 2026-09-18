import { NextResponse } from "next/server";
import contextData from "@/public/data/county-context.json";
import {
  calibrateStats,
  type FormulaParams,
  type SimCountyInputs,
  type SimStats,
} from "@/lib/v2-simulator";

// These are the V2 dashboard's public browser credentials (the same values
// already shipped to adaptdashboard.com). Environment variables can rotate
// them without a code change; the fallbacks keep a new Sites deployment usable.
const sourceUrl = process.env.ADAPT_SUPABASE_URL || "https://qgkveezqqgdbbiqbfjtl.supabase.co";
const sourceKey = process.env.ADAPT_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFna3ZlZXpxcWdkYmJpcWJmanRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTY2MDAsImV4cCI6MjEwNTA3MjYwMH0.Hqe-scIYwTFMHYW4s1FeKz2DZ3uSnqOFklJAS_iw2Ds";
const validIds = new Set((contextData as { counties: Array<{ countyid: number }> }).counties.map((county) => county.countyid));

type RawRow = {
  countyid: number;
  spend_ppupil_2022: number | null;
  incwage_2022: number | null;
  nationalwage_2022: number | null;
  d_m_usdev82011_2022: number | null;
  d_x_uswld_2011_2022: number | null;
  d_m_dw_usdev82011_2022: number | null;
};

type ShockRow = {
  countyid: number;
  z_d_m_usdev82011_2022: number | null;
  z_d_x_uswld2011_2022: number | null;
  z_d_m_dw_usdev82011_2022: number | null;
  z_d_m_up_usdev82011_2022: number | null;
};

async function rest<T>(path: string): Promise<T> {
  const response = await fetch(`${sourceUrl}/rest/v1/${path}`, {
    headers: { apikey: sourceKey, Authorization: `Bearer ${sourceKey}` },
  });
  if (!response.ok) throw new Error(`V2 ADAPT data request failed (${response.status}).`);
  return response.json() as Promise<T>;
}

async function allPages<T>(table: string, select: string): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const page = await rest<T[]>(`${table}?select=${encodeURIComponent(select)}&limit=${pageSize}&offset=${offset}`);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

let statsPromise: Promise<SimStats> | null = null;
function simulatorStats() {
  statsPromise ??= Promise.all([
    allPages<RawRow>("county_raw_inputs", "countyid,d_m_usdev82011_2022,d_x_uswld_2011_2022,d_m_dw_usdev82011_2022"),
    allPages<ShockRow>("trade_shock_metrics", "countyid,z_d_m_usdev82011_2022,z_d_x_uswld2011_2022,z_d_m_dw_usdev82011_2022"),
  ]).then(([raw, shock]) => {
    const byId = new Map(shock.map((row) => [row.countyid, row]));
    const m: Array<{ x: number; y: number }> = [];
    const x: Array<{ x: number; y: number }> = [];
    const dw: Array<{ x: number; y: number }> = [];
    for (const row of raw) {
      const z = byId.get(row.countyid);
      if (!z) continue;
      if (row.d_m_usdev82011_2022 != null && z.z_d_m_usdev82011_2022 != null) m.push({ x: row.d_m_usdev82011_2022, y: z.z_d_m_usdev82011_2022 });
      if (row.d_x_uswld_2011_2022 != null && z.z_d_x_uswld2011_2022 != null) x.push({ x: row.d_x_uswld_2011_2022, y: z.z_d_x_uswld2011_2022 });
      if (row.d_m_dw_usdev82011_2022 != null && z.z_d_m_dw_usdev82011_2022 != null) dw.push({ x: row.d_m_dw_usdev82011_2022, y: z.z_d_m_dw_usdev82011_2022 });
    }
    return { m: calibrateStats(m), x: calibrateStats(x), dw: calibrateStats(dw) };
  }).catch((error) => {
    statsPromise = null;
    throw error;
  });
  return statsPromise;
}

export async function GET(request: Request) {
  try {
    const countyid = Number(new URL(request.url).searchParams.get("countyid"));
    if (!Number.isInteger(countyid) || !validIds.has(countyid)) {
      return NextResponse.json({ error: "Choose a valid county." }, { status: 400 });
    }
    const [raw, pct, shock, index, countyRows, formulaRows, stats] = await Promise.all([
      rest<RawRow[]>(`county_raw_inputs?select=countyid,spend_ppupil_2022,incwage_2022,nationalwage_2022,d_m_usdev82011_2022,d_x_uswld_2011_2022,d_m_dw_usdev82011_2022&countyid=eq.${countyid}&limit=1`),
      rest<Array<{ p90_spend: number | null; p90_dw: number | null; p90_x: number | null }>>(`percentile_metrics?select=p90_spend,p90_dw,p90_x&countyid=eq.${countyid}&limit=1`),
      rest<ShockRow[]>(`trade_shock_metrics?select=countyid,z_d_m_up_usdev82011_2022&countyid=eq.${countyid}&limit=1`),
      rest<Array<{ potential: number | null; qpotential: number | null }>>(`index_scores?select=potential,qpotential&countyid=eq.${countyid}&limit=1`),
      rest<Array<{ qpop: string | null }>>(`counties?select=qpop&countyid=eq.${countyid}&limit=1`),
      rest<Array<{ param_name: string; value: number }>>("whatif_formula_params?select=param_name,value"),
      simulatorStats(),
    ]);
    if (!raw[0]) return NextResponse.json({ error: "Simulator inputs are not available for this county." }, { status: 404 });
    const inputs: SimCountyInputs = {
      ...raw[0],
      p90_spend: pct[0]?.p90_spend ?? null,
      p90_dw: pct[0]?.p90_dw ?? null,
      p90_x: pct[0]?.p90_x ?? null,
      z_d_m_up_usdev82011_2022: shock[0]?.z_d_m_up_usdev82011_2022 ?? null,
      potential: index[0]?.potential ?? null,
      qpotential: index[0]?.qpotential ?? null,
    };
    const params: FormulaParams = Object.fromEntries(formulaRows.map((row) => [row.param_name, Number(row.value)]));
    const qpop = countyRows[0]?.qpop;
    const cohortRows = qpop
      ? await rest<Array<{ index_scores: Array<{ potential: number | null }> }>>(`counties?select=index_scores(potential)&qpop=eq.${encodeURIComponent(qpop)}&limit=5000`)
      : [];
    const cohort = cohortRows.flatMap((row) => row.index_scores.map((score) => score.potential)).filter((value): value is number => value != null && Number.isFinite(value));
    return NextResponse.json({ inputs, stats, params, cohort });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load simulator data." }, { status: 502 });
  }
}
