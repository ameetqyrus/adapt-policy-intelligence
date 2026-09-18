import { describe, expect, it } from "vitest";
import {
  bandForPercentile,
  formatDollars,
  formatPercentagePoints,
  formatV2MapValue,
  outcomePercentile,
  ordinal,
  perPupilDollars,
  populationGroupLabel,
  v2Level,
  v2MapRankValue,
  v2MapValue,
  zScoreLevel,
  type V2CountyContent,
} from "../lib/v2-content";

const county: V2CountyContent = {
  countyid: 39149,
  name: "Shelby County",
  state: "OH",
  region: "Midwest",
  populationGroup: "Small",
  potential: 0.2489,
  qpotential: 2,
  perPupilLog: Math.log(12_345),
  employmentRateChange: 0.0321,
  servicesZ: 0.72,
  manufacturingZ: -0.41,
  rawImportCompetition: 0.015,
  rawExportExposure: 0.023,
  rawDownstreamExposure: -0.006,
  czone: 10400,
  largestPlace: "Sidney",
  exportEmployerShare: 28.5,
  importEmployerShare: 17.4,
  downstreamEmployerShare: 12.1,
  peerId: 39011,
};

describe("V2 ADAPT content semantics", () => {
  it("maps all three original map layers without changing their units", () => {
    expect(v2MapValue("potential", county)).toBe(0.2489);
    expect(v2MapValue("pct_pred_emp_gain", county)).toBe(0.72);
    expect(v2MapValue("pct_pred_emp_loss", county)).toBe(-0.41);
    expect(v2MapRankValue("potential", county)).toBe(4);
    expect(formatV2MapValue("potential", county.potential)).toBe("0.249");
    expect(formatV2MapValue("pct_pred_emp_gain", county.servicesZ)).toBe("0.72σ");
  });

  it("renders original peer measures using their published units", () => {
    expect(Math.round(perPupilDollars(county.perPupilLog)!)).toBe(12_345);
    expect(formatDollars(perPupilDollars(county.perPupilLog))).toBe("$12,345");
    expect(formatPercentagePoints(county.employmentRateChange)).toBe("+3.21 pp");
    expect(formatPercentagePoints(county.rawDownstreamExposure, 1)).toBe("−0.6 pp");
    expect(v2Level(county.qpotential)).toBe("High");
    expect(populationGroupLabel("4th most populated quartile (by people)")).toBe("4th most populated group");
    expect(zScoreLevel(-0.41)).toBe("Low");
  });

  it("reverses lower-is-better percentiles and assigns the original five bands", () => {
    expect(outcomePercentile(4, [1, 2, 3, 4, 5], true)).toBe(60);
    expect(outcomePercentile(4, [1, 2, 3, 4, 5], false)).toBe(40);
    expect(bandForPercentile(19)).toBe(0);
    expect(bandForPercentile(20)).toBe(1);
    expect(bandForPercentile(80)).toBe(4);
    expect(ordinal(1)).toBe("1st");
    expect(ordinal(92)).toBe("92nd");
    expect(ordinal(113)).toBe("113th");
  });
});
