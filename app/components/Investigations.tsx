"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Download,
  MessageSquare,
  Plus,
  Trash2,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import Markdown from "react-markdown";
import { County, Investigation, Message } from "@/lib/types";
import { Connection } from "./Connection";
import policyEvalCases from "@/evals/policy-maker-cases.json";
export async function api<T=Record<string,unknown>>(url: string, options?: RequestInit):Promise<T> {
  const r = await fetch(url, options);
  const data = await r.json() as {error?:string};
  if (!r.ok)
    throw new Error(data.error || "Something went wrong. Please retry.");
  return data as T;
}
const request = (data: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
export function download(name: string, text: string, type = "text/markdown") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function Investigations({
  counties,
  connection,
  onConnect,
  onCounties,
}: {
  counties: County[];
  connection: Connection;
  onConnect: () => void;
  onCounties: (ids: number[]) => void;
}) {
  const [threads, setThreads] = useState<Investigation[]>([]),
    [active, setActive] = useState<string | null>(null),
    [messages, setMessages] = useState<Message[]>([]),
    [draft, setDraft] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [auth, setAuth] = useState(false);
  const bottom = useRef<HTMLDivElement>(null),
    sequence = useRef(0);
  const refresh = () =>
    api<Investigation[]>("/api/investigations")
      .then(setThreads)
      .catch((e) => {
        setError(e.message);
        setAuth(e.message.includes("Sign in"));
      });
  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    if (messages.length || busy)
      bottom.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, busy]);
  async function open(t: Investigation) {
    if (busy) return;
    const seq = ++sequence.current;
    setLoading(true);
    setError("");
    try {
      const data = await api<{messages:Message[];counties:number[]}>("/api/investigations/" + t.id);
      if (seq !== sequence.current) return;
      setActive(t.id);
      setMessages(data.messages);
      setDraft("");
      onCounties(data.counties);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (seq === sequence.current) setLoading(false);
    }
  }
  function start() {
    sequence.current++;
    setActive(null);
    setMessages([]);
    setDraft("");
    setError("");
    setLoading(false);
  }
  async function send() {
    if (busy || loading || !draft.trim()) return;
    if (connection.provider==='openrouter'?!connection.routerKey:!connection.key && !connection.testingAvailable) {
      onConnect();
      return;
    }
    setBusy(true);
    setError("");
    const question = draft.trim();
    try {
      let id = active;
      if (!id) {
        const t = await api<Investigation>(
          "/api/investigations",
          request({
            title: question,
            counties: counties.map((c) => c.countyid),
          }),
        );
        id = t.id;
        setActive(id);
        await refresh();
      }
      const result = await api<{user:Message;assistant:Message}>("/api/investigations/" + id + "/messages", {
        ...request({
          message: question,
          provider:connection.provider,
          model: connection.provider==='openrouter'?connection.routerModel:connection.model,
          counties: counties.map((c) => c.countyid),
        }),
        headers: {
          "Content-Type": "application/json",
          [connection.provider==='openrouter'?'x-openrouter-key':"x-openai-key"]: connection.provider==='openrouter'?connection.routerKey:connection.key,
        },
      });
      setMessages((old) => [...old, result.user, result.assistant]);
      setDraft("");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(t: Investigation) {
    if (
      !confirm(
        "Delete this investigation and its saved messages? This cannot be undone.",
      )
    )
      return;
    try {
      await api("/api/investigations", {
        ...request({ id: t.id }),
        method: "DELETE",
      });
      if (active === t.id) start();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function exportBrief() {
    const title =
      threads.find((t) => t.id === active)?.title || "Investigation";
    download(
      "adapt-investigation.md",
      "# " +
        title +
        "\n\nExported " +
        new Date().toLocaleString() +
        "\n\nCurrent counties: " +
        counties.map((c) => c.name).join("; ") +
        "\n\n" +
        messages
          .map(
            (m) =>
              "## " +
              (m.role === "user" ? "Question" : "Analysis") +
              "\n\n" +
              m.content +
              "\n\n" +
              m.citations
                .map(
                  (c) => "- [" + c.title + "](" + c.url + ")\n  " + c.excerpt,
                )
                .join("\n"),
          )
          .join("\n\n---\n\n") +
        "\n\nADAPT comparisons are not causal estimates. AI-generated analysis requires verification. Removed sources may remain in historical answers.",
    );
  }
  const starters = [
    "Why might the same retraining policy produce different outcomes here?",
    "How could a global manufacturing shock affect these places?",
    "What could AI change about local work—and how should we prepare?",
  ];
  return (
    <section className="investigation-layout">
      <aside className="panel thread-panel">
        <button
          className="secondary new-thread"
          disabled={busy}
          onClick={start}
        >
          <Plus size={17} />
          New investigation
        </button>
        <p className="eyebrow">SAVED CONVERSATIONS</p>
        {threads.map((t) => (
          <div
            className={"thread-row " + (active === t.id ? "selected" : "")}
            key={t.id}
          >
            <button onClick={() => open(t)} disabled={busy || loading}>
              <MessageSquare size={15} />
              <span>
                {t.title}
                <small>{new Date(t.updatedAt).toLocaleDateString()}</small>
              </span>
            </button>
            <button
              title="Delete investigation"
              aria-label={"Delete " + t.title}
              disabled={busy}
              onClick={() => remove(t)}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {!threads.length && (
          <p className="muted">
            Your conversations will appear here. Return to a question whenever
            you need.
          </p>
        )}
        <div className="thread-foot">
          <BookOpen size={16} />
          Answers use ADAPT data and relevant indexed sources. They can follow
          your question to other counties.
        </div>
      </aside>
      <section className="panel conversation-panel">
        <header className="conversation-heading">
          <div>
            <strong>
              {active
                ? threads.find((t) => t.id === active)?.title || "Investigation"
                : "A question worth following"}
            </strong>
            <small>{counties.map((c) => c.name).join(" · ")}</small>
          </div>
          {messages.length > 0 && (
            <button
              className="icon-btn"
              title="Download investigation"
              aria-label="Download investigation"
              onClick={exportBrief}
            >
              <Download size={18} />
            </button>
          )}
        </header>
        <div className="conversation-body">
          {loading ? (
            <p role="status">Loading conversation…</p>
          ) : messages.length === 0 ? (
            <div className="chat-welcome">
              <div className="dialog-icon">
                <MessageSquare size={26} />
              </div>
              <h2>
                Start anywhere.
                <br />
                Keep asking.
              </h2>
              <p>
                Explore a difference you noticed, a policy decision, or an event
                that could reshape a community. The conversation follows your
                reasoning.
              </p>
              <div className="starters">
                {starters.map((q) => (
                  <button key={q} onClick={() => setDraft(q)} disabled={busy}>
                    {q}
                    <ArrowUpRight size={17} />
                  </button>
                ))}
              </div>
              <small>
                These are starting points, not the limits of what you can ask.
              </small>
              <details className="eval-starters">
                <summary>Policymaker evaluation prompts · {policyEvalCases.length}</summary>
                <p>
                  Run the same prompts across models to compare grounding,
                  uncertainty and decision usefulness.
                </p>
                <div>
                  {policyEvalCases.map((item) => (
                    <button key={item.id} onClick={() => setDraft(item.prompt)} disabled={busy}>
                      <span>{item.title}</span>
                      <small>{item.prompt}</small>
                    </button>
                  ))}
                </div>
              </details>
            </div>
          ) : (
            messages.map((m) => (
              <article key={m.id} className={"message " + m.role}>
                <p className="message-role">
                  {m.role === "user" ? "YOU" : "ADAPT · ANALYSIS"}
                </p>
                <Markdown
                  components={{
                    a: ({ children, href }) => (
                      <a href={href} target="_blank" rel="noreferrer">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {m.content}
                </Markdown>
                {m.citations.length > 0 && (
                  <details className="answer-evidence">
                    <summary>
                      <BookOpen size={14} /> Evidence & provenance ·{" "}
                      {m.citations.length}
                    </summary>
                    <p className="muted">
                      Evidence saved with this answer. A subsequently removed
                      source will not be retrieved for new questions.
                    </p>
                    {m.citations.map((c) => (
                      <div key={c.id}>
                        <strong>
                          {c.url ? (
                            <a href={c.url} target="_blank" rel="noreferrer">
                              {c.title}
                              <ArrowUpRight size={12} />
                            </a>
                          ) : (
                            c.title
                          )}
                        </strong>
                        <small>{c.id}</small>
                        <p>{c.excerpt}</p>
                      </div>
                    ))}
                  </details>
                )}
              </article>
            ))
          )}
          {busy && (
            <div className="thinking" role="status">
              <span />
              Reading county context, searching evidence, and developing an
              answer…
            </div>
          )}
          <div ref={bottom} />
        </div>
        <div className="composer-area">
          {error && (
            <div role="alert" className="error-banner">
              {error}
              {auth && (
                <a href="/signin-with-chatgpt?return_to=/" target="_top">
                  {" "}
                  Sign in →
                </a>
              )}
            </div>
          )}
          <div className="context-notice">
            Using the counties selected above. Change them at any time to take
            the conversation elsewhere.
          </div>
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <textarea
              aria-label="Ask ADAPT"
              placeholder="Ask a question or follow up on an answer…"
              maxLength={6000}
              value={draft}
              disabled={busy}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              aria-label="Send question"
              className="send-btn"
              disabled={busy || loading || !draft.trim() || !counties.length}
            >
              <ArrowUp size={21} />
            </button>
          </form>
          <div className="composer-foot">
            <button onClick={onConnect}>
              {connection.provider==='openrouter'?(connection.routerKey?'OpenRouter · '+connection.routerModel:'Connect your OpenRouter key'):connection.key
                ? connection.model + " · key saved"
                : connection.testingAvailable?"Built-in testing · GPT-4.1 mini":"Connect your OpenAI key"}
            </button>
            <span>Enter to send · Shift+Enter for a new line</span>
          </div>
          <small className="ai-caveat">
            AI can make mistakes. Check the evidence before making policy
            decisions.
          </small>
        </div>
      </section>
    </section>
  );
}
