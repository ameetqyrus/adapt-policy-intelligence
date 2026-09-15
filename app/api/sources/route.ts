import {
  identity,
  writable,
  db,
  body,
  json,
  fail,
  HttpError,
  bindings,
} from "@/lib/server";
import { extract, publicUrl, saveEvidence, scrape } from "@/lib/evidence";
export async function GET(request: Request) {
  try {
    identity(request);
    const id = new URL(request.url).searchParams.get("id");
    if (id) {
      const source = await db()
        .prepare("SELECT * FROM sources WHERE id=? AND status='indexed'")
        .bind(id)
        .first();
      if (!source) throw new HttpError(404, "Source not found.");
      const snippets = await db()
        .prepare(
          "SELECT body FROM chunks WHERE source_id=? ORDER BY position LIMIT 5",
        )
        .bind(id)
        .all();
      return json({ source, snippets: snippets.results });
    }
    const rows = await db()
      .prepare(
        "SELECT s.id,s.title,s.url,s.kind,s.scope,s.description,s.status,s.created_at AS createdAt,(SELECT COUNT(*) FROM chunks WHERE source_id=s.id) AS chunks FROM sources s WHERE status='indexed' ORDER BY created_at DESC",
      )
      .all();
    return json(rows.results);
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    const user = writable(request, true);
    if (Number(request.headers.get("content-length")) > 8100000)
      throw new HttpError(413, "Upload limit is 8 MB.");
    const count = await db()
      .prepare("SELECT COUNT(*) AS n FROM sources WHERE status='indexed'")
      .first<{ n: number }>();
    if ((count?.n || 0) >= 100)
      throw new HttpError(
        409,
        "This library supports 100 sources. Remove unused sources before adding more.",
      );
    let title = "",
      url: string | null = null,
      kind = "website",
      scope = "General",
      description = "",
      text = "",
      file: File | undefined;
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      const entry = form.get("file");
      if (!entry || typeof entry === "string")
        throw new HttpError(400, "Choose a file.");
      file = entry as File;
      text = await extract(file);
      title = String(form.get("title") || file.name);
      kind = file.name.split(".").pop()?.toLowerCase() || "document";
      scope = String(form.get("scope") || "General");
      description = String(form.get("description") || "");
    } else {
      const data = await body(request);
      url = publicUrl(String(data.url || ""));
      const result = await scrape(
        url,
        request.headers.get("x-firecrawl-key") || "",
      );
      text = result.text;
      title = String(data.title || result.title);
      scope = String(data.scope || "General");
      description = String(data.description || "");
    }
    return json(
      await saveEvidence({
        id: crypto.randomUUID(),
        title,
        url,
        kind,
        scope,
        description,
        text,
        user: user.id,
        file,
      }),
      201,
    );
  } catch (e) {
    return fail(e);
  }
}
export async function DELETE(request: Request) {
  try {
    writable(request, true);
    const { id } = await body(request);
    const s = await db()
      .prepare("SELECT file_key FROM sources WHERE id=?")
      .bind(String(id))
      .first<{ file_key: string | null }>();
    if (!s) throw new HttpError(404, "Source not found.");
    await db().batch([
      db().prepare("DELETE FROM chunks WHERE source_id=?").bind(String(id)),
      db()
        .prepare("UPDATE sources SET status='removed' WHERE id=?")
        .bind(String(id)),
    ]);
    if (s.file_key) await bindings.BUCKET.delete(s.file_key);
    return json({ removed: true });
  } catch (e) {
    return fail(e);
  }
}
