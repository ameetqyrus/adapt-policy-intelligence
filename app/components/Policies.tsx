"use client";
import { useEffect, useState } from 'react';
import { County, Evidence } from '@/lib/types';
import type { PolicyRecord } from '@/lib/policies';
import { api, download } from './Investigations';

export default function Policies({ counties }: { counties: County[] }) {
  const [records, setRecords] = useState<PolicyRecord[]>([]), [sources, setSources] = useState<Evidence[]>([]);
  const [admin, setAdmin] = useState(false), [error, setError] = useState(''), [busy,setBusy] = useState(false), [revision,setRevision] = useState(0);
  const [loadedKey,setLoadedKey] = useState(''), [adding,setAdding] = useState(false), [passages,setPassages] = useState('');
  const ids = counties.map(c => c.countyid).join(',');
  const requestKey = ids + ':' + revision;
  const loading = loadedKey !== requestKey;
  useEffect(() => {
    let current = true;
    Promise.all([api<PolicyRecord[]>('/api/policies?counties=' + ids),api<Evidence[]>('/api/sources'),api<{admin:boolean}>('/api/session')]).then(([rows,library,session]) => {if(current){setRecords(rows);setSources(library);setAdmin(session.admin);setError('');}}).catch(e => {if(current)setError(e.message);}).finally(() => {if(current)setLoadedKey(requestKey);});
    return () => {current=false;};
  }, [ids,requestKey]);
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError('');
    const form = e.currentTarget, data = new FormData(form);
    try {
      await api('/api/policies',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...Object.fromEntries(data),countyId:Number(data.get('countyId'))})});
      setAdding(false);setPassages('');setRevision(n=>n+1);
    } catch(e) {setError((e as Error).message);} finally {setBusy(false);}
  }
  return <section className="panel policy-register">
    <div className="panel-heading"><div><p className="eyebrow">DOCUMENTED EXAMPLES · NOT PRESCRIPTIONS</p><h2>Peer policy register & timeline</h2></div>{admin && <button className="secondary" disabled={busy} onClick={()=>setAdding(!adding)}>{adding?'Close form':'Add documented policy'}</button>}</div>
    <p className="muted">Dated policies alongside county trends provide context, not causal proof. Records are administrator-curated, supported by an indexed passage, and excluded when their source is removed.</p>
    {error && <p className="error-banner" role="alert">{error}<button onClick={()=>setRevision(n=>n+1)}>Retry</button></p>}
    {adding && <form className="policy-form" onSubmit={add}>
      <label>County<select name="countyId" required>{counties.map(c=><option key={c.countyid} value={c.countyid}>{c.name}</option>)}</select></label>
      <label>Policy or program title<input name="title" required minLength={3} maxLength={180}/></label>
      <label>Adoption date · leave blank if unknown<input name="adoptedDate" type="date" /></label>
      <label>Status<select name="status">{['Unknown','Proposed','Adopted','Active','Ended'].map(s=><option key={s}>{s}</option>)}</select></label>
      <label>Indexed supporting source<select name="sourceId" required defaultValue="" onChange={async e=>{setPassages('');try {const result=await api<{snippets:{body:string}[]}>('/api/sources?id='+encodeURIComponent(e.target.value));setPassages(result.snippets.map(s=>s.body).join('\n\n—\n\n'));}catch(err){setError((err as Error).message);}}}><option value="" disabled>Choose an indexed source</option>{sources.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
      {passages && <pre className="source-preview">{passages}</pre>}
      <label>Exact supporting passage<textarea name="excerpt" required minLength={40} maxLength={1600} placeholder="Copy the supporting text from one indexed passage above." /></label>
      <label>Reported outcomes / limitations · curator notes<textarea name="outcome" maxLength={1500} placeholder="State what the source reports; leave blank if no outcome evidence is available." /></label>
      <button className="primary" disabled={busy||!sources.length}>{busy?'Saving…':'Save policy record'}</button>
      {!sources.length && <p>Index a supporting source in Evidence library first.</p>}
    </form>}
    {loading ? <p role="status">Loading policy evidence…</p> : !error && !records.length ? <div className="library-empty"><h3>No documented policies indexed for this selection yet.</h3><p>This does not mean these counties have no policies. Add county plans, program evaluations or official legislation to the evidence library, then register supported examples.</p></div> : !loading && !error && <>
      <ol className="policy-timeline">{records.map(p=><li key={p.id}><div className="timeline-date">{p.adoptedDate || 'Date not documented'}<small>{p.status}</small></div><div><h3>{p.title}</h3><p>{counties.find(c=>c.countyid===p.countyId)?.name}</p><p>{p.outcome || 'No outcome evidence recorded.'}</p><details><summary>Audit supporting evidence</summary><p>Curated record; date, status and outcome notes require verification against the passage.</p><blockquote>{p.excerpt}</blockquote>{p.url?<a href={p.url} target="_blank" rel="noreferrer">{p.sourceTitle} ↗</a>:<strong>{p.sourceTitle}</strong>}</details>{admin&&<button className="text-action" disabled={busy} onClick={async()=>{if(!confirm('Delete this policy record? The supporting source will remain.'))return;setBusy(true);try{await api('/api/policies',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id})});setRevision(n=>n+1);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>Remove record</button>}</div></li>)}</ol>
      <button className="secondary" onClick={()=>download('adapt-peer-policies.md','# Documented peer policies\n\nThese records are not causal evaluations.\n\n'+records.map(p=>`## ${p.title}\nCounty: ${p.countyId}\nDate: ${p.adoptedDate||'Unknown'} · ${p.status}\n\n${p.outcome||'Outcome evidence not recorded.'}\n\n> ${p.excerpt}\n\nSource: ${p.sourceTitle} ${p.url||''}`).join('\n\n'))}>Download policy register</button>
    </>}
  </section>;
}
