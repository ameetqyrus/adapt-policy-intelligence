import { HttpError } from "./server";

export type OpenRouterModel = {
  id: string;
  name: string;
  description: string;
  contextLength: number | null;
  toolCapable: boolean;
  promptPrice: string | null;
  completionPrice: string | null;
};

type CatalogModel = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  context_length?: unknown;
  supported_parameters?: unknown;
  pricing?: { prompt?: unknown; completion?: unknown };
  architecture?: { output_modalities?: unknown };
};

export function normalizeOpenRouterModels(data: unknown): OpenRouterModel[] {
  const rows =
    data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)
      ? ((data as { data: CatalogModel[] }).data)
      : [];
  return rows
    .filter((row) => {
      const outputs = row.architecture?.output_modalities;
      return (
        typeof row.id === "string" &&
        row.id.includes("/") &&
        (!Array.isArray(outputs) || outputs.includes("text"))
      );
    })
    .map((row) => ({
      id: String(row.id),
      name: typeof row.name === "string" ? row.name : String(row.id),
      description:
        typeof row.description === "string" ? row.description.slice(0, 500) : "",
      contextLength:
        typeof row.context_length === "number" ? row.context_length : null,
      toolCapable:
        Array.isArray(row.supported_parameters) &&
        row.supported_parameters.includes("tools"),
      promptPrice:
        typeof row.pricing?.prompt === "string" ? row.pricing.prompt : null,
      completionPrice:
        typeof row.pricing?.completion === "string"
          ? row.pricing.completion
          : null,
    }))
    .sort((a, b) => {
      if (a.toolCapable !== b.toolCapable) return a.toolCapable ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export async function loadOpenRouterModels(key = "") {
  let response: Response;
  try {
    response = await fetch(
      "https://openrouter.ai/api/v1/models?output_modalities=text",
      {
        headers: key ? { Authorization: "Bearer " + key } : {},
        signal: AbortSignal.timeout(20000),
      },
    );
  } catch {
    throw new HttpError(504, "OpenRouter's model catalog did not respond. Retry shortly.");
  }
  if (!response.ok)
    throw new HttpError(
      response.status === 401 ? 401 : 502,
      response.status === 401
        ? "OpenRouter did not accept this key. Update it in AI connection."
        : "OpenRouter's model catalog is temporarily unavailable.",
    );
  const models = normalizeOpenRouterModels(await response.json());
  if (!models.length)
    throw new HttpError(502, "OpenRouter returned an empty model catalog. Retry shortly.");
  return models;
}
