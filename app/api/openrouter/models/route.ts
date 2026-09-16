import { fail, identity, json } from "@/lib/server";
import { loadOpenRouterModels } from "@/lib/openrouter-models";

export async function GET(request: Request) {
  try {
    identity(request);
    const key = request.headers.get("x-openrouter-key")?.trim() || "";
    if ((key && !key.startsWith("sk-or-")) || key.length > 512)
      return json({ error: "Enter a valid OpenRouter key." }, 400);
    const models = await loadOpenRouterModels(key);
    return json(
      {
        models,
        total: models.length,
        toolCapable: models.filter((model) => model.toolCapable).length,
      },
      200,
      { "Cache-Control": key ? "private, max-age=300" : "public, max-age=900" },
    );
  } catch (error) {
    return fail(error);
  }
}
