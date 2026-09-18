import { describe, expect, it } from "vitest";
import {
  calibrateStats,
  projectFromRaw,
  quintileOf,
  simBaseline,
  type SimCountyInputs,
} from "../lib/v2-simulator";

const inputs: SimCountyInputs = {
  countyid: 39149,
  spend_ppupil_2022: 18577.724609375,
  incwage_2022: 29572.08020140555,
  nationalwage_2022: 37707.25,
  d_m_usdev82011_2022: 1.1374124288559,
  d_x_uswld_2011_2022: -0.643848419189453,
  d_m_dw_usdev82011_2022: 0.160330727696419,
  p90_spend: 9.91370296478271,
  p90_dw: 1.1659939289093,
  p90_x: 0.249509319663048,
  z_d_m_up_usdev82011_2022: 4.4716458,
  potential: 0.357301761892519,
  qpotential: 5,
};

describe("V2 ADAPT simulator", () => {
  it("uses the selected county's raw values as the reset baseline", () => {
    expect(simBaseline(inputs)).toEqual({
      spend: inputs.spend_ppupil_2022,
      dw: inputs.d_m_dw_usdev82011_2022,
      x: inputs.d_x_uswld_2011_2022,
      m: inputs.d_m_usdev82011_2022,
    });
  });

  it("recovers a known linear standardization", () => {
    const mean = 10;
    const sd = 2;
    const points = Array.from({ length: 100 }, (_, index) => {
      const x = index / 2;
      return { x, y: (x - mean) / sd };
    });
    expect(calibrateStats(points).mean).toBeCloseTo(mean, 8);
    expect(calibrateStats(points).sd).toBeCloseTo(sd, 8);
  });

  it("applies the published four-lever formula deterministically", () => {
    const result = projectFromRaw(inputs, simBaseline(inputs), {
      m: { mean: 0.7147997449456628, sd: 0.642921108415594 },
      x: { mean: 0.06140629904982471, sd: 2.303958458794475 },
      dw: { mean: 0.08214884844752836, sd: 0.022565671929368078 },
    }, null);
    expect(result.projected).toBeCloseTo(0.018459517, 8);
    expect(result.flagged).toBe(false);
    expect(result.zDmd).toBeCloseTo(2.56448895, 7);
  });

  it("assigns projected scores to cohort quintiles", () => {
    expect(quintileOf(1, [0, 1, 2, 3, 4])).toBe(1);
    expect(quintileOf(4, [0, 1, 2, 3, 4])).toBe(4);
  });
});
