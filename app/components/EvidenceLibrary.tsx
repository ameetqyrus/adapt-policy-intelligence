"use client";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  FileText,
  Globe,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Evidence } from "@/lib/types";
import { referenceSources } from "@/lib/catalog";
import { Connection } from "./Connection";
import { api } from "./Investigations";
export default function EvidenceLibrary({
  connection,
  onConnect,
}: {
  connection: Connection;
  onConnect: () => void;
}) {
  const [sources, setSources] = useState<Evidence[]>([]),
    [admin, setAdmin] = useState(false),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [adding, setAdding] = useState(false),
    [kind, setKind] = useState("file"),
    [title, setTitle] = useState(""),
    [url, setUrl] = useState(""),
    [scope, setScope] = useState("General"),
    [description, setDescription] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [preview, setPreview] = useState<{ id: string; text: string } | null>(null),
    [notice, setNotice] = useState("");
  async function refresh() {
    setLoading(true);
    try {
      const [session, list] = await Promise.all([
        api<{admin:boolean}>("/api/session"),
        api<Evidence[]>("/api/sources"),
      ]);
      setAdmin(session.admin);
      setSources(list);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (kind === "url" && !connection.firecrawl) {
      onConnect();
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      let options: RequestInit;
      if (kind === "file") {
        if (!file) throw new Error("Choose a file to upload.");
        const data = new FormData();
        data.set("file", file);
        data.set("title", title);
        data.set("scope", scope);
        data.set("description", description);
        options = { method: "POST", body: data };
      } else
        options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-firecrawl-key": connection.firecrawl,
          },
          body: JSON.stringify({ url, title, scope, description }),
        };
      const result = await api("/api/sources", options);
      setNotice(
        "Source indexed into " +
          result.chunks +
          " searchable passages. It is now available to new questions.",
      );
      setAdding(false);
      setTitle("");
      setUrl("");
      setFile(null);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(source: Evidence) {
    if (
      !confirm(
        "Remove “" +
          source.title +
          "” from the library? Its indexed passages and uploaded file will be deleted. Saved answers will retain their historical citations.",
      )
    )
      return;
    setBusy(true);
    try {
      await api("/api/sources", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: source.id }),
      });
      setNotice(
        "Source removed from future retrieval. Historical answers are unchanged.",
      );
      if (preview?.id === source.id) setPreview(null);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function inspect(source: Evidence) {
    if (preview?.id === source.id) {
      setPreview(null);
      return;
    }
    try {
      const data = await api<{snippets:{body:string}[]}>("/api/sources?id=" + source.id);
      setPreview({
        id: source.id,
        text: data.snippets
          .map((s: { body: string }) => s.body)
          .join("\n\n—\n\n"),
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const filtered = sources.filter((s) =>
    (s.title + " " + s.scope + " " + s.description)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="library-intro">
        <div className="library-stat">
          <BookOpen size={22} />
          <div>
            <strong>{sources.length}</strong>
            <span>indexed sources</span>
          </div>
        </div>
        <div className="library-stat">
          <FileText size={22} />
          <div>
            <strong>{sources.reduce((n, s) => n + (s.chunks || 0), 0)}</strong>
            <span>searchable passages</span>
          </div>
        </div>
        <p>
          Source content is indexed for retrieval, not used to train a model.
          Removing a source excludes it from future retrieval.
        </p>
        {admin && (
          <button className="primary" onClick={() => setAdding(!adding)}>
            <Plus size={18} />
            Add evidence
          </button>
        )}
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error} <button onClick={refresh}>Retry</button>
          {error.includes("Sign in") && (
            <a target="_top" href="/signin-with-chatgpt?return_to=/">
              Sign in →
            </a>
          )}
        </div>
      )}
      {notice && (
        <p className="success-banner" role="status">
          {notice}
        </p>
      )}
      {adding && (
        <section className="panel evidence-form">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">GROW THE LIBRARY</p>
              <h2>Add a source</h2>
            </div>
            <button
              className="icon-btn"
              aria-label="Close add source"
              onClick={() => setAdding(false)}
              disabled={busy}
            >
              <X />
            </button>
          </div>
          <div className="section-tabs">
            <button
              className={kind === "file" ? "active" : ""}
              onClick={() => setKind("file")}
              disabled={busy}
            >
              <Upload size={16} />
              Upload a document
            </button>
            <button
              className={kind === "url" ? "active" : ""}
              onClick={() => setKind("url")}
              disabled={busy}
            >
              <Globe size={16} />
              Index a website
            </button>
          </div>
          <form onSubmit={add}>
            {kind === "file" ? (
              <label className="file-drop">
                <Upload size={26} />
                <strong>{file?.name || "Choose a document"}</strong>
                <span>PDF, DOCX, XLSX, CSV, TXT or Markdown · up to 8 MB</span>
                <input
                  required
                  aria-label="Choose evidence file"
                  type="file"
                  accept=".pdf,.docx,.xlsx,.csv,.txt,.md"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            ) : (
              <label>
                Website URL
                <input
                  type="url"
                  required
                  placeholder="https://…"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <small>
                  Reads this page only, not an entire website. Uses your
                  Firecrawl account.
                </small>
              </label>
            )}
            <div className="form-grid">
              <label>
                Title <small>(optional)</small>
                <input
                  placeholder="Use the page title or filename"
                  maxLength={180}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label>
                Geographic / topic scope
                <input
                  placeholder="e.g. Shelby County, OH · workforce"
                  maxLength={160}
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                />
              </label>
            </div>
            <label>
              Context <small>(optional)</small>
              <input
                placeholder="Period covered, publishing organization, or limitations"
                value={description}
                maxLength={500}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <div className="form-actions">
              <small>
                Only add material you have permission to use. Indexed content is
                shared with authorized site visitors.
              </small>
              <button className="primary" disabled={busy}>
                {busy ? "Extracting & indexing…" : "Add and index"}
              </button>
            </div>
          </form>
        </section>
      )}
      <section className="panel library-panel">
        <div className="panel-heading">
          <div>
            <h2>Indexed evidence</h2>
            <p className="muted">
              Readable source content available to the analyst.
            </p>
          </div>
          <label className="library-search">
            <Search size={17} />
            <input
              aria-label="Search evidence"
              placeholder="Find a source…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        {loading ? (
          <p role="status">Loading evidence…</p>
        ) : !filtered.length ? (
          <div className="library-empty">
            <BookOpen size={30} />
            <h3>
              {sources.length
                ? "No matching sources"
                : "Make the conversation better informed."}
            </h3>
            <p>
              {sources.length
                ? "Try a different search."
                : "ADAPT county data is already available. Add reports, local evaluations, or datasets to investigate the questions it raises."}
            </p>
            {!admin && (
              <small>Library administrators can add and remove evidence.</small>
            )}
          </div>
        ) : (
          filtered.map((s) => (
            <div className="source-row" key={s.id}>
              <div className="source-icon">
                {s.kind === "website" ? (
                  <Globe size={21} />
                ) : (
                  <FileText size={21} />
                )}
              </div>
              <div className="source-content">
                <h3>{s.title}</h3>
                <p>
                  {s.scope}
                  {s.description ? " · " + s.description : ""}
                </p>
                <div className="source-meta">
                  <span className="indexed-badge">Indexed</span>
                  <span>
                    {s.kind.toUpperCase()} · {s.chunks} passages
                  </span>
                  <span>
                    Added {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {preview?.id === s.id && (
                  <pre className="source-preview">{preview.text}</pre>
                )}
              </div>
              <div className="source-actions">
                <button className="secondary" onClick={() => inspect(s)}>
                  {preview?.id === s.id ? "Hide" : "Inspect"}
                </button>
                {s.url && (
                  <a
                    className="icon-btn"
                    aria-label={"Open " + s.title}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ArrowUpRight size={17} />
                  </a>
                )}
                {admin && (
                  <button
                    className="icon-btn"
                    disabled={busy}
                    aria-label={"Remove " + s.title}
                    onClick={() => remove(s)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>
      <section className="reference-section">
        <div className="section-title">
          <p className="eyebrow">A STARTING POINT FOR RESEARCH</p>
          <h2>Reference shelf</h2>
          <p className="muted">
            Useful original sources. These links are not indexed or read by the
            analyst until you add their content to the library.
          </p>
        </div>
        <div className="reference-grid">
          {referenceSources
            .filter((s) =>
              (s.title + " " + s.scope)
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map((s) => (
              <article className="panel reference-card" key={s.url}>
                <Globe size={18} />
                <small>{s.scope}</small>
                <h3>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.title}
                    <ArrowUpRight size={14} />
                  </a>
                </h3>
                <footer>
                  <span>Reference link</span>
                  {admin && (/\.xlsx(?:\?|$)/i.test(s.url) ? <a href={s.url} target="_blank" rel="noreferrer">Download, then upload ↗</a> : (
                    <button
                      onClick={() => {
                        setAdding(true);
                        setKind("url");
                        setUrl(s.url);
                        setTitle(s.title);
                        setScope(s.scope);
                        window.scrollTo({ top: 200, behavior: "smooth" });
                      }}
                    >
                      Index source <Plus size={13} />
                    </button>
                  ))}
                </footer>
              </article>
            ))}
        </div>
      </section>
    </>
  );
}
