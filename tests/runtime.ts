import { DatabaseSync } from "node:sqlite";
import { readFileSync,readdirSync } from "node:fs";
const sql = new DatabaseSync(":memory:");
for(const file of readdirSync(new URL('../drizzle',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
function prepare(query: string, params: unknown[] = []): any {
  return {
    bind: (...values: unknown[]) => prepare(query, values),
    first: async () => sql.prepare(query).get(...(params as never[])) || null,
    all: async () => ({
      results: sql.prepare(query).all(...(params as never[])),
    }),
    run: async () => {
      const r = sql.prepare(query).run(...(params as never[]));
      return { meta: { changes: Number(r.changes) } };
    },
  };
}
export const objects = new Map<string, unknown>();
export const env = {
  ADMIN_EMAILS: "admin@example.com",
  OPENAI_API_KEY:'',TESTER_EMAILS:'',
  DB: {
    prepare,
    batch: async (statements: any[]) => {
      sql.exec("BEGIN");
      try {
        const results = [];
        for (const s of statements) results.push(await s.run());
        sql.exec("COMMIT");
        return results;
      } catch (e) {
        sql.exec("ROLLBACK");
        throw e;
      }
    },
  },
  BUCKET: {
    put: async (k: string, v: unknown) => objects.set(k, v),
    delete: async (k: string) => objects.delete(k),
  },
  ASSETS: {
    fetch: async (request: Request) =>
      new Response(
        readFileSync(
          new URL("../public" + new URL(request.url).pathname, import.meta.url),
        ),
        { headers: { "Content-Type": "application/json" } },
      ),
  },
};
