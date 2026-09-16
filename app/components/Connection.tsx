"use client";
import { useEffect, useRef, useState } from "react";
import { KeyRound, X } from "lucide-react";
import OpenRouterModelPicker from "./OpenRouterModelPicker";
export type Connection = { key: string; model: string; firecrawl: string; testingAvailable?:boolean; provider:'openai'|'openrouter';routerKey:string;routerModel:string };
export const emptyConnection: Connection = {
  key: "",
  model: "gpt-4.1-mini",
  firecrawl: "",
  provider:'openai',routerKey:'',routerModel:'openai/gpt-4.1-mini',
};
export function useConnection() {
  const [connection, set] = useState<Connection>(emptyConnection);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("adapt-connection") || "null",
      );
      if (saved) set({ ...emptyConnection, key:saved.key||'',model:saved.model||emptyConnection.model,firecrawl:saved.firecrawl||'',provider:saved.provider==='openrouter'?'openrouter':'openai',routerKey:saved.routerKey||'',routerModel:saved.routerModel||emptyConnection.routerModel });
    } catch {}
    fetch('/api/session').then(r=>r.json()).then(data=>set(current=>({...current,testingAvailable:(data as {testingAvailable?:boolean}).testingAvailable===true}))).catch(()=>{});
  }, []);
  function save(next: Connection) {
    set(current=>({...next,testingAvailable:current.testingAvailable}));
    try {
      sessionStorage.setItem("adapt-connection", JSON.stringify({key:next.key,model:next.model,firecrawl:next.firecrawl,provider:next.provider,routerKey:next.routerKey,routerModel:next.routerModel}));
    } catch {}
  }
  return { connection, save };
}
export function ConnectionDialog({
  connection,
  onSave,
  onClose,
}: {
  connection: Connection;
  onSave: (c: Connection) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(connection);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog ref={dialog} className="connection-dialog" onCancel={onClose}>
      <button
        className="modal-close"
        aria-label="Close AI connection"
        onClick={onClose}
      >
        <X />
      </button>
      <div className="dialog-icon">
        <KeyRound size={24} />
      </div>
      <p className="eyebrow">YOUR CONNECTION</p>
      <h2>Bring your own intelligence.</h2>
      {connection.testingAvailable&&draft.provider==='openai'&&<div className="success-banner">Built-in AI testing is enabled for your account. Leave the key blank to use GPT-4.1 mini, up to 20 requests per day. A key entered below takes precedence.</div>}
      <p className="muted">
        Choose who powers the conversation. Exploring county data and uploading evidence do not need an AI key.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(draft);
          onClose();
        }}
      >
        <label>AI provider<select aria-label="AI provider" value={draft.provider} onChange={e=>setDraft({...draft,provider:e.target.value as Connection['provider']})}><option value="openai">OpenAI</option><option value="openrouter">OpenRouter</option></select></label>
        <label>
          {draft.provider==='openrouter'?'OpenRouter API key':'OpenAI API key'}
          <input
            autoFocus
            type="password"
            autoComplete="off"
            placeholder={draft.provider==='openrouter'?'sk-or-…':'sk-…'}
            value={draft.provider==='openrouter'?draft.routerKey:draft.key}
            onChange={(e) => setDraft({ ...draft, [draft.provider==='openrouter'?'routerKey':'key']: e.target.value.trim() })}
          />
        </label>
        {draft.provider==='openrouter'?<OpenRouterModelPicker apiKey={draft.routerKey} value={draft.routerModel} onChange={routerModel=>setDraft({...draft,routerModel})}/>:<label>
          Model ID
          <input required value={draft.model} list="model-choices" onChange={(e) => setDraft({ ...draft, model: e.target.value.trim() })}/>
        </label>}
        <datalist id="model-choices">
          <option value="gpt-4.1-mini" />
          <option value="gpt-4.1" />
        </datalist>
        <small>
          {draft.provider==='openrouter'?<>Use a full provider/model ID supporting tool calling. <a href="https://openrouter.ai/models?supported_parameters=tools" target="_blank" rel="noreferrer">Browse compatible models ↗</a></>:'Use a model available to your OpenAI project that supports Responses and function calling.'}
        </small>
        <details>
          <summary>Website indexing · optional</summary>
          <label>
            Firecrawl API key
            <input
              type="password"
              autoComplete="off"
              placeholder="fc-…"
              value={draft.firecrawl}
              onChange={(e) =>
                setDraft({ ...draft, firecrawl: e.target.value.trim() })
              }
            />
          </label>
          <small>
            Needed only when an administrator indexes a website. PDF, Word and
            spreadsheet uploads work without it.
          </small>
        </details>
        <div className="privacy-note">
          Keys you enter are kept only in this tab’s session storage. The built-in testing key stays on the server. Your keys are sent
          through this site’s server to the respective provider, never saved to
          the database. Questions, relevant county data and retrieved excerpts
          are sent to your selected provider (OpenRouter routes them to the chosen model provider); answers are saved in your private investigations. Switching providers also sends recent conversation history to the newly selected provider. Keys are never shared between providers.
          Provider usage charges apply.
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => {
              onSave(emptyConnection);
              onClose();
            }}
          >
            Clear keys
          </button>
          <button className="primary" type="submit">
            Save connection
          </button>
        </div>
      </form>
    </dialog>
  );
}
