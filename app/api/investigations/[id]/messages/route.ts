import { writable, db, body, json, fail, owned, HttpError,testingAvailable,reserveTestingRequest } from "@/lib/server";
import { answer, validCounties } from "@/lib/analyst";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let locked: string | null = null;
  try {
    const u = writable(request);
    const { id } = await context.params;
    const row = await owned(id, u.id);
    const data = await body(request);
    const provider=data.provider||'openai';
    if(provider!=='openai'&&provider!=='openrouter')throw new HttpError(400,'Choose OpenAI or OpenRouter.');
    let key = request.headers.get(provider==='openrouter'?'x-openrouter-key':"x-openai-key")?.trim() || "";
    const builtIn=provider==='openai'&&!key;
    if(provider==='openrouter'&&(!key.startsWith('sk-or-')||key.length>512))throw new HttpError(400,'Add your OpenRouter API key in AI connection.');
    if ((!key && !testingAvailable(u)) || (key && !key.startsWith("sk-")) || key.length > 512)
      throw new HttpError(400, "Add your OpenAI API key in AI connection.");
    const message = String(data.message || "").trim(),
      model = builtIn?'gpt-4.1-mini':String(data.model || (provider==='openrouter'?'openai/gpt-4.1-mini':"gpt-4.1-mini"));
    if (!message || message.length > 6000)
      throw new HttpError(400, "Enter a question up to 6,000 characters.");
    if (!(provider==='openrouter'?/^[a-zA-Z0-9._:-]+\/[a-zA-Z0-9._:/-]+$/:/^[a-zA-Z0-9._:-]+$/).test(model)||model.length>150)
      throw new HttpError(400, "Enter a valid model ID for the selected provider.");
    const ids = validCounties(data.counties);
    if (!ids.length) throw new HttpError(400, "Select at least one county.");
    const lock = await db()
      .prepare(
        "UPDATE investigations SET busy_until=? WHERE id=? AND owner_id=? AND busy_until<?",
      )
      .bind(Date.now() + 240000, id, u.id, Date.now())
      .run();
    if (!lock.meta.changes)
      throw new HttpError(
        409,
        "An answer is already running in this investigation. Please wait.",
      );
    locked = id;
    if(builtIn)key=await reserveTestingRequest(u);
    const history = await db()
      .prepare(
        "SELECT role,content FROM messages WHERE investigation_id=? ORDER BY created_at DESC LIMIT 20",
      )
      .bind(id)
      .all<{ role: string; content: string }>();
    const result = await answer({
      provider,
      key,
      model,
      message,
      history: history.results.reverse(),
      ids,
      origin: request.url,
    });
    const time = new Date().toISOString();
    const userId = crypto.randomUUID(),
      assistantId = crypto.randomUUID();
    await db().batch([
      db()
        .prepare(
          "INSERT INTO messages (id,investigation_id,role,content,citations,created_at) VALUES (?,?,'user',?,'[]',?)",
        )
        .bind(userId, id, message, time),
      db()
        .prepare(
          "INSERT INTO messages (id,investigation_id,role,content,citations,created_at) VALUES (?,?,'assistant',?,?,?)",
        )
        .bind(
          assistantId,
          id,
          result.content,
          JSON.stringify(result.citations),
          new Date(Date.now() + 1).toISOString(),
        ),
      db()
        .prepare(
          "UPDATE investigations SET title=?,counties=?,updated_at=?,busy_until=0 WHERE id=? AND owner_id=?",
        )
        .bind(
          history.results.length ? row.title : message.slice(0, 90),
          JSON.stringify(ids),
          time,
          id,
          u.id,
        ),
    ]);
    locked = null;
    return json({
      user: {
        id: userId,
        role: "user",
        content: message,
        citations: [],
        createdAt: time,
      },
      assistant: {
        id: assistantId,
        role: "assistant",
        ...result,
        createdAt: time,
      },
    });
  } catch (e) {
    return fail(e);
  } finally {
    if (locked)
      await db()
        .prepare("UPDATE investigations SET busy_until=0 WHERE id=?")
        .bind(locked)
        .run()
        .catch(() => {});
  }
}
