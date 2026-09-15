import {
  identity,
  writable,
  db,
  body,
  json,
  fail,
  owned,
  HttpError,
} from "@/lib/server";
export async function GET(request: Request) {
  try {
    const u = identity(request);
    const rows = await db()
      .prepare(
        "SELECT id,title,counties,updated_at AS updatedAt FROM investigations WHERE owner_id=? ORDER BY updated_at DESC LIMIT 100",
      )
      .bind(u.id)
      .all<{
        id: string;
        title: string;
        counties: string;
        updatedAt: string;
      }>();
    return json(
      rows.results.map((r) => ({ ...r, counties: JSON.parse(r.counties) })),
    );
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    const u = writable(request);
    const data = await body(request);
    const id = crypto.randomUUID();
    const counties = Array.isArray(data.counties)
      ? data.counties.filter((c: unknown) => Number.isInteger(c)).slice(0, 4)
      : [];
    const title = String(data.title || "Untitled investigation")
      .trim()
      .slice(0, 100);
    await db()
      .prepare(
        "INSERT INTO investigations (id,owner_id,title,counties,updated_at) VALUES (?,?,?,?,?)",
      )
      .bind(id, u.id, title, JSON.stringify(counties), new Date().toISOString())
      .run();
    return json({ id, title, counties }, 201);
  } catch (e) {
    return fail(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const u = writable(request);
    const data = await body(request);
    const row = await owned(String(data.id), u.id);
    if (row.busy_until > Date.now())
      throw new HttpError(
        409,
        "Wait for the answer to finish before deleting.",
      );
    await db().batch([
      db()
        .prepare("DELETE FROM messages WHERE investigation_id=?")
        .bind(row.id),
      db()
        .prepare("DELETE FROM investigations WHERE id=? AND owner_id=?")
        .bind(row.id, u.id),
    ]);
    return json({ removed: true });
  } catch (e) {
    return fail(e);
  }
}
