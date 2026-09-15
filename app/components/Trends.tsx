"use client";
import { useState } from "react";
import { County, CountyDetail, shortName } from "@/lib/types";
const colors = ["#245979", "#c58a30", "#459b87", "#95658e"];
export default function Trends({
  counties,
  details,
}: {
  counties: County[];
  details: Record<string, CountyDetail>;
}) {
  const [measure, setMeasure] = useState<"wage" | "employment">("employment");
  const series = counties.map((c) => ({
    county: c,
    values: (details[c.countyid]?.history || []).filter(
      (h) => h[measure] !== null,
    ),
  }));
  const vals = series.flatMap((s) => s.values.map((v) => v[measure]!)),
    years = [
      ...new Set(series.flatMap((s) => s.values.map((v) => v.year))),
    ].sort((a, b) => a - b);
  const min =
      measure === "employment" ? Math.floor(Math.min(80, ...vals) / 5) * 5 : 0,
    max =
      measure === "employment"
        ? 100
        : Math.ceil(Math.max(1, ...vals) / 10000) * 10000;
  const x = (year: number) =>
      60 +
      ((year - (years[0] || 1990)) /
        Math.max(1, (years.at(-1) || 2022) - (years[0] || 1990))) *
        810,
    y = (value: number) => 260 - ((value - min) / Math.max(1, max - min)) * 220;
  const fmt = (v: number) =>
    measure === "wage"
      ? "$" + Math.round(v).toLocaleString()
      : v.toFixed(1) + "%";
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>How the picture has changed</h2>
          <p className="muted">
            Non-college workers · original ADAPT observations, not forecasts.
          </p>
        </div>
        <select
          aria-label="Trend measure"
          value={measure}
          onChange={(e) => setMeasure(e.target.value as "wage" | "employment")}
        >
          <option value="employment">Employment rate</option>
          <option value="wage">Median wage</option>
        </select>
      </div>
      {!vals.length ? (
        <p>Historical observations are unavailable for this selection.</p>
      ) : (
        <>
          <div className="trend-chart">
            <svg
              viewBox="0 0 920 300"
              role="img"
              aria-label={"Historical " + measure + " for selected counties"}
            >
              {[0, 1, 2, 3, 4].map((i) => {
                const v = min + ((max - min) * i) / 4;
                return (
                  <g key={i}>
                    <line
                      x1="60"
                      x2="875"
                      y1={y(v)}
                      y2={y(v)}
                      stroke="var(--line)"
                      strokeDasharray="4 4"
                    />
                    <text
                      x="50"
                      y={y(v) + 4}
                      textAnchor="end"
                      fill="var(--muted)"
                      fontSize="12"
                    >
                      {measure === "wage"
                        ? "$" + (v / 1000).toFixed(0) + "k"
                        : v.toFixed(0) + "%"}
                    </text>
                  </g>
                );
              })}
              {years
                .filter(
                  (yr, i) => i === 0 || i === years.length - 1 || yr % 5 === 0,
                )
                .map((yr) => (
                  <text
                    key={yr}
                    x={x(yr)}
                    y="290"
                    textAnchor="middle"
                    fill="var(--muted)"
                    fontSize="12"
                  >
                    {yr}
                  </text>
                ))}
              {series.map((s, i) => (
                <g key={s.county.countyid}>
                  <polyline
                    points={s.values
                      .map((v) => x(v.year) + "," + y(v[measure]!))
                      .join(" ")}
                    fill="none"
                    stroke={colors[i]}
                    strokeWidth="3"
                  />
                  {s.values.map((v) => (
                    <circle
                      key={v.year}
                      cx={x(v.year)}
                      cy={y(v[measure]!)}
                      r="3"
                      fill={colors[i]}
                    >
                      <title>
                        {s.county.name} · {v.year}: {fmt(v[measure]!)}
                      </title>
                    </circle>
                  ))}
                </g>
              ))}
            </svg>
          </div>
          <div className="trend-legend">
            {series.map((s, i) => (
              <span key={s.county.countyid}>
                <i style={{ background: colors[i] }} />
                {s.county.name}
              </span>
            ))}
          </div>
          <p className="muted">
            Lines connect available observations; gaps are not annual estimates.
            Wage values retain the source dataset’s units and price basis—do not
            interpret nominal differences as changes in purchasing power.
          </p>
          <details>
            <summary>View all observations</summary>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Year</th>
                    {counties.map((c) => (
                      <th key={c.countyid}>{shortName(c.name)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {years.map((year) => (
                    <tr key={year}>
                      <td>{year}</td>
                      {series.map((s) => {
                        const v = s.values.find((h) => h.year === year)?.[
                          measure
                        ];
                        return (
                          <td key={s.county.countyid}>
                            {v == null ? "No data" : fmt(v)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </>
  );
}
