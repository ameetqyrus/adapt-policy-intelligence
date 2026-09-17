"use client";
import { useState } from 'react';
import { helpSections } from '@/lib/help';
import { download } from './Investigations';

export default function Help({ onConnect }: { onConnect: () => void }) {
  const [query, setQuery] = useState('');
  const sections = helpSections.filter(s => `${s.title} ${s.text} ${s.prompt || ''}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="help-section">
    <div className="panel help-intro"><p className="eyebrow">A PRACTICAL GUIDE</p><h2>Explore. Ask. Check the evidence.</h2><p>Start with a place, follow a question, and decide what the evidence supports. ADAPT is a research companion—not a policy prescription or a forecast.</p><div className="help-actions"><button className="primary" onClick={onConnect}>Set up AI connection</button><button className="secondary" onClick={() => download('adapt-user-guide.md', '# Using ADAPT Observatory\n\n' + helpSections.map(s => `## ${s.title}\n\n${s.text}${s.prompt ? '\n\nExample: ' + s.prompt : ''}`).join('\n\n'))}>Download user guide</button></div></div>
    <label className="help-search">Search help<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Try sources, key, county or scenarios" /></label>
    <div className="help-grid">{sections.map(s => <article className="panel help-card" key={s.id}><h2>{s.title}</h2><p>{s.text}</p>{s.prompt && <blockquote>{s.prompt}</blockquote>}</article>)}</div>
    {!sections.length && <p role="status">No matching help topics. Try another word.</p>}
  </section>;
}
