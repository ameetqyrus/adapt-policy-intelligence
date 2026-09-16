import { env } from "cloudflare:workers";
type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  ASSETS?: Fetcher;
  ADMIN_EMAILS?: string;
  OPENAI_API_KEY?:string;
  TESTER_EMAILS?:string;
};
export const bindings = env as unknown as Bindings;
export function testingAvailable(user:{email:string}){return Boolean(bindings.OPENAI_API_KEY)&&(bindings.TESTER_EMAILS||'').toLowerCase().split(',').map(s=>s.trim()).filter(Boolean).includes(user.email.toLowerCase());}
export async function reserveTestingRequest(user:{id:string;email:string}){if(!testingAvailable(user))throw new HttpError(403,'Built-in AI testing is not enabled for this account. Enter your own key to continue.');const day=new Date().toISOString().slice(0,10);const row=await db().prepare('INSERT INTO testing_usage (id,used) VALUES (?,1) ON CONFLICT(id) DO UPDATE SET used=used+1 WHERE used<20 RETURNING used').bind(user.id+':'+day).first<{used:number}>();if(!row)throw new HttpError(429,'The built-in testing connection has reached its 20-request daily limit (UTC). Use your own key or return tomorrow.');return bindings.OPENAI_API_KEY!;}
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function identity(request: Request) {
  const id = request.headers.get("oai-authenticated-user-id"),
    email = request.headers.get("oai-authenticated-user-email") || "";
  if (!id)
    throw new HttpError(
      401,
      "Sign in with ChatGPT to save conversations or use the evidence library.",
    );
  const admin =
    (bindings.ADMIN_EMAILS || "")
      .toLowerCase()
      .split(",")
      .map((x) => x.trim())
      .includes(email.toLowerCase()) ||
    (process.env.NODE_ENV === "development" && id === "local_seedy");
  return { id, email, admin };
}
export function writable(request: Request, admin = false) {
  const u = identity(request);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new HttpError(403, "Cross-site changes are not allowed.");
  if (admin && !u.admin)
    throw new HttpError(
      403,
      "Only a library administrator can change sources.",
    );
  return u;
}
export const db = () => {
  if (!bindings.DB)
    throw new HttpError(
      503,
      "Storage is temporarily unavailable. Please retry.",
    );
  return bindings.DB;
};
export const json = (
  value: unknown,
  status = 200,
  headers: Record<string, string> = {},
) =>
  Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
export function fail(error: unknown) {
  if (error instanceof HttpError)
    return json({ error: error.message }, error.status);
  console.error(
    "Workspace operation failed",
    error instanceof Error ? error.name : "Unknown error",
  );
  return json(
    {
      error:
        "This operation could not be completed. Your input is preserved; please retry.",
    },
    503,
  );
}
export async function body(request: Request) {
  const s = await request.text();
  if (s.length > 16000) throw new HttpError(413, "Request is too large.");
  try {
    return JSON.parse(s);
  } catch {
    throw new HttpError(400, "Request could not be read.");
  }
}
export async function owned(id: string, user: string) {
  const row = await db()
    .prepare("SELECT * FROM investigations WHERE id=? AND owner_id=?")
    .bind(id, user)
    .first<{
      id: string;
      title: string;
      counties: string;
      busy_until: number;
    }>();
  if (!row) throw new HttpError(404, "Investigation not found.");
  return row;
}
