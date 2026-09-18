import { NextResponse } from "next/server";
import type { V2CountyContent, V2Occupation } from "@/lib/v2-content";

const sourceUrl = process.env.ADAPT_SUPABASE_URL || "https://qgkveezqqgdbbiqbfjtl.supabase.co";
const sourceKey = process.env.ADAPT_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFna3ZlZXpxcWdkYmJpcWJmanRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTY2MDAsImV4cCI6MjEwNTA3MjYwMH0.Hqe-scIYwTFMHYW4s1FeKz2DZ3uSnqOFklJAS_iw2Ds";

async function rest<T>(path: string): Promise<T> {
  const response = await fetch(`${sourceUrl}/rest/v1/${path}`, {
    headers: { apikey: sourceKey, Authorization: `Bearer ${sourceKey}` },
  });
  if (!response.ok) throw new Error(`V2 ADAPT data request failed (${response.status}).`);
  return response.json() as Promise<T>;
}

async function allPages<T>(table: string, select: string): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await rest<T[]>(`${table}?select=${encodeURIComponent(select)}&limit=1000&offset=${offset}`);
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

type CountyRow = { countyid: number; county_name: string; state: string | null; region: string | null; qpop: string | null };
type IndexRow = { countyid: number; potential: number | null; qpotential: number | null; ppupil_deflate2022: number | null; d_star_emp_rate_2011_2022: number | null };
type ShockRow = { countyid: number; z_d_m_usdev82011_2022: number | null; z_d_x_uswld2011_2022: number | null };
type RawRow = { countyid: number; d_m_usdev82011_2022: number | null; d_x_uswld_2011_2022: number | null; d_m_dw_usdev82011_2022: number | null };
type ExposureRow = { fips: string; czone: number | null; largest_place: string | null; pct_high_exp: number | null; pct_high_dir: number | null; pct_high_dw: number | null };
type PeerRow = { countyid: number; peer_countyid: number | null; is_auto_suggested: boolean | null; rank: number | null };
type OverrideRow = { countyid: number; peer_countyid: number };
const retiredFipsAliases: Record<string, string> = {
  "46102": "46113",
  "12086": "12025",
};

export async function GET(request: Request) {
  try {
    const czone = Number(new URL(request.url).searchParams.get("czone"));
    if (Number.isInteger(czone) && czone > 0) {
      const rows = await rest<Array<{ rank: number; occ2010_str: string; employed_stars: number | null }>>(
        `czone_occupations?select=rank,occ2010_str,employed_stars&czone=eq.${czone}&order=rank.asc&limit=10`,
      );
      const occupations: V2Occupation[] = rows.map((row) => ({
        rank: row.rank,
        name: row.occ2010_str,
        workers: row.employed_stars,
      }));
      return NextResponse.json({ occupations }, { headers: { "Cache-Control": "public, s-maxage=86400" } });
    }

    const [counties, index, shocks, raw, exposure, peers, overrides] = await Promise.all([
      allPages<CountyRow>("counties", "countyid,county_name,state,region,qpop"),
      allPages<IndexRow>("index_scores", "countyid,potential,qpotential,ppupil_deflate2022,d_star_emp_rate_2011_2022"),
      allPages<ShockRow>("trade_shock_metrics", "countyid,z_d_m_usdev82011_2022,z_d_x_uswld2011_2022"),
      allPages<RawRow>("county_raw_inputs", "countyid,d_m_usdev82011_2022,d_x_uswld_2011_2022,d_m_dw_usdev82011_2022"),
      allPages<ExposureRow>("czone_exposure", "fips,czone,largest_place,pct_high_exp,pct_high_dir,pct_high_dw"),
      allPages<PeerRow>("peer_matches", "countyid,peer_countyid,is_auto_suggested,rank"),
      allPages<OverrideRow>("manual_peer_overrides", "countyid,peer_countyid"),
    ]);

    const indexById = new Map(index.map((row) => [row.countyid, row]));
    const shocksById = new Map(shocks.map((row) => [row.countyid, row]));
    const rawById = new Map(raw.map((row) => [row.countyid, row]));
    const exposureByFips = new Map(exposure.map((row) => [row.fips, row]));
    const overrideById = new Map(overrides.map((row) => [row.countyid, row.peer_countyid]));
    const peerById = new Map<number, number | null>();
    peers
      .slice()
      .sort((a, b) => Number(Boolean(b.is_auto_suggested)) - Number(Boolean(a.is_auto_suggested)) || (a.rank ?? 999) - (b.rank ?? 999))
      .forEach((row) => {
        if (!peerById.has(row.countyid)) peerById.set(row.countyid, row.peer_countyid);
      });

    const result: V2CountyContent[] = counties.map((county) => {
      const idx = indexById.get(county.countyid);
      const shock = shocksById.get(county.countyid);
      const inputs = rawById.get(county.countyid);
      const currentFips = String(county.countyid).padStart(5, "0");
      const exp = exposureByFips.get(currentFips) ?? exposureByFips.get(retiredFipsAliases[currentFips] || "");
      return {
        countyid: county.countyid,
        name: county.county_name,
        state: county.state,
        region: county.region,
        populationGroup: county.qpop,
        potential: idx?.potential ?? null,
        qpotential: idx?.qpotential ?? null,
        perPupilLog: idx?.ppupil_deflate2022 ?? null,
        employmentRateChange: idx?.d_star_emp_rate_2011_2022 ?? null,
        servicesZ: shock?.z_d_x_uswld2011_2022 ?? null,
        manufacturingZ: shock?.z_d_m_usdev82011_2022 ?? null,
        rawImportCompetition: inputs?.d_m_usdev82011_2022 ?? null,
        rawExportExposure: inputs?.d_x_uswld_2011_2022 ?? null,
        rawDownstreamExposure: inputs?.d_m_dw_usdev82011_2022 ?? null,
        czone: exp?.czone ?? null,
        largestPlace: exp?.largest_place ?? null,
        exportEmployerShare: exp?.pct_high_exp ?? null,
        importEmployerShare: exp?.pct_high_dir ?? null,
        downstreamEmployerShare: exp?.pct_high_dw ?? null,
        peerId: overrideById.get(county.countyid) ?? peerById.get(county.countyid) ?? null,
      };
    });

    return NextResponse.json(
      { counties: result, dataThrough: 2022, source: "V2 ADAPT dashboard" },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load V2 ADAPT content." },
      { status: 502 },
    );
  }
}
