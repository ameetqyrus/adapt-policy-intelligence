export type Metric = { value: number | null; rank?: number; total?: number };
export type County = {
  countyid: number;
  name: string;
  state: string;
  populationGroup: string;
  workers: number | null;
  metrics: Record<string, Metric>;
  peer: {
    countyid: number;
    name: string;
    state: string;
    economicType: string;
    rucc: number | null;
    similarWorkforce: boolean;
  } | null;
};
export type Industry = {
  name: string;
  workers: number;
  noncollege: number;
  commonIndustries?: string;
};
export type CountyDetail = {
  history: {
    year: number;
    wage: number | null;
    employment: number | null;
    collegeWage: number | null;
    collegeEmployment: number | null;
    manufacturingShare: number | null;
    workers: number | null;
  }[];
  industries: Industry[];
  occupations: Industry[];
};
export type Evidence = {
  id: string;
  title: string;
  url: string | null;
  kind: string;
  status: string;
  scope: string;
  description: string;
  createdAt: string;
  chunks?: number;
};
export type Citation = {
  id: string;
  title: string;
  url: string | null;
  excerpt: string;
};
export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  createdAt: string;
  context?: { surface: string; counties: number[]; metric?: string; panel?: string; scenario?: { assumptions: string; output: string } } | null;
};
export type Investigation = {
  id: string;
  title: string;
  counties: number[];
  updatedAt: string;
  messages?: Message[];
};
export const labels: Record<string, string> = {
  potential: "American Dream potential",
  star_median2022: "Non-college median wage",
  star_emp_rate_2022: "Non-college employment",
  educ_pct_total_stloc2022: "Education share of spending",
  ppupil_deflate_2022: "Per-pupil education spending",
  pct_pred_emp_loss: "Manufacturing trade-shock exposure",
  pct_pred_emp_gain: "Tradable-services opportunity",
};
export const metrics = Object.keys(labels);
export function format(key: string, value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "No data";
  if (key.includes("median") || key.includes("ppupil") || key === "wage")
    return "$" + Math.round(value).toLocaleString("en-US");
  if (key === "potential") return value.toFixed(3);
  if (key === "educ_pct_total_stloc2022") return (value * 100).toFixed(1) + "%";
  return value.toFixed(1) + "%";
}
export const shortName = (name: string) =>
  name.replace(/ County, [A-Z]{2}$/, "");
