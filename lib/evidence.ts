import { bindings, db, HttpError } from "./server";
export function chunkText(text: string) {
  const clean = text.replace(/\u0000/g, "").trim();
  if (clean.length < 40)
    throw new HttpError(
      422,
      "Not enough readable text to index. Scanned PDFs need OCR before uploading.",
    );
  if (clean.length > 300000)
    throw new HttpError(
      413,
      "Extracted text exceeds 300,000 characters. Upload a smaller document.",
    );
  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += 1400)
    chunks.push(clean.slice(i, i + 1600));
  return chunks;
}
export function publicUrl(value: string) {
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    throw new HttpError(400, "Enter a complete HTTPS URL.");
  }
  const h = u.hostname.toLowerCase();
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    u.port ||
    !h.includes(".") ||
    !/[a-z]$/i.test(h) ||
    h.includes(":") ||
    /\.(local|internal|localhost|test|invalid|arpa)$/.test(h) ||
    /^(localhost|127\.|0\.|10\.|169\.254\.|192\.168\.)/.test(h)
  )
    throw new HttpError(
      400,
      "Use a public HTTPS website, without credentials or a custom port.",
    );
  u.hash = "";
  return u.href;
}
export async function scrape(url: string, key: string) {
  if (!key || key.length > 256)
    throw new HttpError(
      400,
      "Add a Firecrawl key in AI connection to index a website. File uploads do not need this key.",
    );
  const r = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: publicUrl(url),
      formats: ["markdown"],
      onlyMainContent: true,
      maxAge: 86400000,
      timeout: 30000,
    }),
    signal: AbortSignal.timeout(40000),
  });
  if (!r.ok)
    throw new HttpError(
      r.status === 401 ? 401 : 502,
      "Website indexing failed. Check the Firecrawl key, credit balance, and URL, then retry.",
    );
  const data = (await r.json()) as {
    success: boolean;
    data?: {
      markdown?: string;
      metadata?: { title?: string; statusCode?: number };
    };
  };
  if (
    !data.success ||
    !data.data?.markdown ||
    Number(data.data.metadata?.statusCode) >= 400
  )
    throw new HttpError(
      422,
      "The website did not return readable content. Try a document upload.",
    );
  return {
    text: data.data.markdown,
    title: data.data.metadata?.title || new URL(url).hostname,
  };
}
export async function retrieve(query: string) {
  const terms = [...new Set(query.toLowerCase().match(/[a-z0-9]{3,}/g) || [])]
    .filter(
      (x) =>
        ![
          "the",
          "and",
          "what",
          "how",
          "this",
          "that",
          "with",
          "from",
          "county",
          "about",
          "does",
          "could",
          "would",
          "have",
          "their",
        ].includes(x),
    )
    .slice(0, 12);
  if (!terms.length) return [];
  const rows = await db()
    .prepare(
      "SELECT c.id,c.body,s.title,s.url,s.id AS sourceId,s.scope FROM chunks c JOIN sources s ON s.id=c.source_id WHERE s.status='indexed' AND (" +
        terms.map(() => "lower(c.body) LIKE ?").join(" OR ") +
        ") LIMIT 200",
    )
    .bind(...terms.map((t) => "%" + t + "%"))
    .all<{
      id: string;
      body: string;
      title: string;
      url: string | null;
      sourceId: string;
      scope: string;
    }>();
  return rows.results
    .map((r) => ({
      ...r,
      score: terms.reduce(
        (n, t) => n + (r.body.toLowerCase().includes(t) ? 1 : 0),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      excerpt: r.body,
      scope: r.scope,
      sourceId: r.sourceId,
    }));
}
// Check ZIP central-directory sizes before DOCX/XLSX parsers allocate memory.
function checkZip(bytes: Uint8Array) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let entries = 0,
    total = 0;
  for (let i = 0; i + 46 < bytes.length; i++) {
    if (v.getUint32(i, true) === 0x02014b50) {
      entries++;
      total += v.getUint32(i + 24, true);
      if (entries > 2000 || total > 25000000)
        throw new HttpError(413, "The uncompressed document is too large.");
      i +=
        45 +
        v.getUint16(i + 28, true) +
        v.getUint16(i + 30, true) +
        v.getUint16(i + 32, true);
    }
  }
  if (!entries)
    throw new HttpError(422, "This is not a readable Office document.");
}
export async function extract(file: File) {
  if (file.size > 8000000 || !file.size)
    throw new HttpError(413, "Upload a non-empty file under 8 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (["txt", "md", "csv"].includes(ext || ""))
    return new TextDecoder().decode(bytes);
  if (ext === "pdf") {
    const { extractText } = await import("unpdf");
    const result = await extractText(bytes, { mergePages: true });
    return result.text;
  }
  if (ext === "docx") {
    checkZip(bytes);
    const mammoth = await import("mammoth");
    return (await mammoth.extractRawText({ buffer: Buffer.from(bytes) })).value;
  }
  if (ext === "xlsx") {
    checkZip(bytes);
    const { default: ExcelJS } = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(bytes) as never);
    const parts: string[] = [];
    let chars = 0;
    workbook.eachSheet((sheet) => {
      parts.push("Sheet: " + sheet.name);
      sheet.eachRow((row) => {
        const line = (row.values as unknown[])
          .slice(1)
          .map((v) =>
            typeof v === "object" ? JSON.stringify(v) : String(v ?? ""),
          )
          .join(" | ");
        chars += line.length;
        if (chars > 300000)
          throw new HttpError(
            413,
            "Spreadsheet text exceeds the indexing limit.",
          );
        parts.push(line);
      });
    });
    return parts.join("\n");
  }
  throw new HttpError(
    415,
    "Supported files: PDF, DOCX, XLSX, CSV, TXT and Markdown.",
  );
}
export async function saveEvidence(input: {
  id: string;
  title: string;
  url: string | null;
  kind: string;
  scope: string;
  description: string;
  text: string;
  user: string;
  file?: File;
}) {
  const parts = chunkText(input.text);
  const now = new Date().toISOString();
  const key = input.file ? "sources/" + input.id : null;
  if (key && input.file)
    await bindings.BUCKET.put(key, await input.file.arrayBuffer(), {
      httpMetadata: { contentType: "application/octet-stream" },
    });
  try {
    await db().batch([
      db()
        .prepare(
          "INSERT INTO sources (id,title,url,kind,scope,description,status,file_key,created_by,created_at) VALUES (?,?,?,?,?,?,'indexed',?,?,?)",
        )
        .bind(
          input.id,
          input.title.slice(0, 180),
          input.url,
          input.kind,
          input.scope.slice(0, 160),
          input.description.slice(0, 500),
          key,
          input.user,
          now,
        ),
      ...parts.map((t, i) =>
        db()
          .prepare(
            "INSERT INTO chunks (id,source_id,body,position) VALUES (?,?,?,?)",
          )
          .bind(input.id + "-" + i, input.id, t, i),
      ),
    ]);
  } catch (e) {
    if (key) await bindings.BUCKET.delete(key);
    throw e;
  }
  return { id: input.id, chunks: parts.length };
}
