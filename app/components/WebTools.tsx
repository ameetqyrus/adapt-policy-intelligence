"use client";
import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { County } from "@/lib/types";
type Context = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
export default function WebTools({
  counties,
  onSelect,
}: {
  counties: County[];
  onSelect: (ids: number[]) => void;
}) {
  const latest = useRef({ counties, onSelect });
  latest.current = { counties, onSelect };
  useEffect(() => {
    const context = (document as unknown as { modelContext?: Context })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Parameters<Context["registerTool"]>[0]) => {
      try {
        Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    };
    register({
      name: "find_adapt_counties",
      description:
        "Read ADAPT county names, FIPS and research metrics matching a county name or FIPS. Returns at most 20 results; no network or saved data changes.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: (input) => {
        const q = (input as { query?: unknown })?.query;
        if (typeof q !== "string" || q.length > 100)
          throw new Error("Provide a query under 100 characters.");
        return latest.current.counties
          .filter((c) =>
            (c.name + " " + c.countyid).toLowerCase().includes(q.toLowerCase()),
          )
          .slice(0, 20);
      },
    });
    register({
      name: "select_adapt_counties",
      description:
        "Set the visible county comparison to one to four FIPS IDs, reference county first. Does not send a chat or save an investigation.",
      inputSchema: {
        type: "object",
        properties: {
          fips: {
            type: "array",
            items: { type: "integer" },
            minItems: 1,
            maxItems: 4,
          },
        },
        required: ["fips"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        const ids = (input as { fips?: unknown })?.fips;
        if (
          !Array.isArray(ids) ||
          ids.length < 1 ||
          ids.length > 4 ||
          ids.some(
            (id) => !latest.current.counties.some((c) => c.countyid === id),
          ) ||
          new Set(ids).size !== ids.length
        )
          throw new Error(
            "Provide one to four distinct known county FIPS IDs.",
          );
        flushSync(() => latest.current.onSelect(ids));
        return { selected: ids };
      },
    });
    return () => lifecycle.abort();
  }, []);
  return null;
}
