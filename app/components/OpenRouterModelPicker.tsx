"use client";
import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import type { OpenRouterModel } from "@/lib/openrouter-models";

export default function OpenRouterModelPicker({
  apiKey,
  value,
  onChange,
}: {
  apiKey: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("Loading OpenRouter catalog…");

  useEffect(() => {
    const controller = new AbortController();
    setStatus("Loading OpenRouter catalog…");
    const catalogKey = apiKey.startsWith("sk-or-") && apiKey.length > 12 ? apiKey : "";
    const timer = window.setTimeout(() => fetch("/api/openrouter/models", {
      headers: catalogKey ? { "x-openrouter-key": catalogKey } : {},
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as {
          error?: string;
          models?: OpenRouterModel[];
          total?: number;
          toolCapable?: number;
        };
        if (!response.ok) throw new Error(data.error || "Could not load models.");
        setModels(data.models || []);
        setStatus(
          `${data.total || 0} models loaded · ${data.toolCapable || 0} support the tools this app uses`,
        );
      })
      .catch((error) => {
        if (error.name !== "AbortError") setStatus(error.message);
      }), 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [apiKey]);

  const matches = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return models
      .filter((model) => {
        const haystack = `${model.name} ${model.id} ${model.description}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .slice(0, 80);
  }, [models, query]);
  const selected = models.find((model) => model.id === value);

  return (
    <div className="model-picker">
      <label>
        Model ID
        <div className="model-search">
          <Search size={16} />
          <input
            required
            value={open ? query : value}
            placeholder="Search every OpenRouter model…"
            aria-label="OpenRouter model"
            aria-expanded={open}
            aria-controls="openrouter-model-results"
            onFocus={() => {
              setQuery("");
              setOpen(true);
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
              if (event.key === "Enter" && /^[~\w.:-]+\/[\w.:/-]+$/.test(query.trim())) {
                event.preventDefault();
                onChange(query.trim());
                setOpen(false);
              }
            }}
          />
        </div>
      </label>
      {open && (
        <div className="model-results" id="openrouter-model-results" role="listbox">
          {matches.map((model) => (
            <button
              type="button"
              role="option"
              aria-selected={model.id === value}
              key={model.id}
              disabled={!model.toolCapable}
              onClick={() => {
                onChange(model.id);
                setQuery("");
                setOpen(false);
              }}
            >
              <span>
                <strong>{model.name}</strong>
                <small>{model.id}</small>
              </span>
              {model.id === value ? (
                <Check size={16} />
              ) : (
                <em>{model.toolCapable ? "Tools" : "No tools"}</em>
              )}
            </button>
          ))}
          {!matches.length && <p>No models match that search.</p>}
        </div>
      )}
      <small className="model-status">
        {selected && !selected.toolCapable
          ? "This model is in the catalog but cannot run county and evidence tools. Choose a tool-capable model."
          : status}
      </small>
      <small>
        Paste a full provider/model ID and press Enter for a new alias. Catalog
        entries without tool support are shown but disabled.
      </small>
    </div>
  );
}
