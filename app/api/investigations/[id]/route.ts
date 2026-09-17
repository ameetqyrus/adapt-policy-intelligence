import { identity, db, json, fail, owned } from "@/lib/server";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const u = identity(request);
    const { id } = await context.params;
    const r = await owned(id, u.id);
    const rows = await db()
      .prepare(
        "SELECT id,role,content,citations,context,created_at AS createdAt FROM messages WHERE investigation_id=? ORDER BY created_at",
      )
      .bind(id)
      .all<{
        id: string;
        role: string;
        content: string;
        citations: string;
        createdAt: string;
        context: string | null;
      }>();
    return json({
      ...r,
      counties: JSON.parse(r.counties),
      messages: rows.results.map((m) => ({
        ...m,
        citations: JSON.parse(m.citations),
        context: m.context ? JSON.parse(m.context) : null,
      })),
    });
  } catch (e) {
    return fail(e);
  }
}
