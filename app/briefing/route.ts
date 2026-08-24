type BriefingPayload = {
  home: { countyid: number; name: string };
  peer: { countyid: number; name: string; mode: string };
  question: string;
  answer: { title: string; summary: string; findings: string[]; recommendation: string };
  metrics: Array<{ label: string; home: string; peer: string }>;
  sources: Array<{ title: string; jurisdiction: string; kind: string; url: string }>;
};

function safe(value: unknown) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
}

function compactName(name: string) {
  return name.replace(/ County, [A-Z]{2}$/, '');
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get('payload');
  if (!raw || raw.length > 24000) return new Response('Briefing data is missing or too large.', { status: 400 });

  let payload: BriefingPayload;
  try {
    payload = JSON.parse(raw) as BriefingPayload;
  } catch {
    return new Response('Briefing data could not be read.', { status: 400 });
  }

  if (!payload.home?.name || !payload.peer?.name || !Array.isArray(payload.metrics) || !Array.isArray(payload.sources)) {
    return new Response('Briefing data is incomplete.', { status: 400 });
  }

  const metricRows = payload.metrics.map((metric) => `<tr><th>${safe(metric.label)}</th><td>${safe(metric.home)}</td><td>${safe(metric.peer)}</td></tr>`).join('');
  const findings = (payload.answer?.findings || []).map((finding) => `<li>${safe(finding)}</li>`).join('');
  const sources = payload.sources.map((source) => `<li><strong>${safe(source.title)}</strong><br><span>${safe(source.jurisdiction)} · ${safe(source.kind)}</span><br><a href="${safe(source.url)}">${safe(source.url)}</a></li>`).join('');
  const generated = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date());
  const homeShort = compactName(payload.home.name);
  const peerShort = compactName(payload.peer.name);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AdapT briefing · ${safe(homeShort)} and ${safe(peerShort)}</title><style>body{margin:0;background:#edf2ee;color:#18352a;font-family:Arial,sans-serif}main{max-width:920px;margin:auto;padding:48px 24px 70px}.hero{padding:34px;border-radius:22px;background:#173f31;color:white}.eyebrow{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#a9c3b8}.hero h1{margin:12px 0 8px;font:700 38px Georgia,serif}.hero p{max-width:700px;color:#d7e5de;line-height:1.6}.pair{display:flex;gap:12px;margin:22px 0}.county{flex:1;padding:18px;border-radius:14px;background:white;box-shadow:0 8px 30px #173f3114}.county small,.section-label{color:#587567;font-size:10px;font-weight:bold;letter-spacing:.1em;text-transform:uppercase}.county strong{display:block;margin-top:7px;font:700 22px Georgia,serif}section{margin-top:18px;padding:26px;border-radius:16px;background:white}h2{margin:0 0 12px;font:700 25px Georgia,serif}p,li{line-height:1.65;color:#53645b}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{padding:12px;border-bottom:1px solid #e1e8e3;text-align:right}th{text-align:left}thead th{background:#edf5f0;color:#1f6a4d}a{color:#1f6a4d;word-break:break-all}.warning{padding:16px;border-radius:10px;background:#f5efdc;color:#70561d}.sources li{margin-bottom:12px}@media(max-width:640px){.pair{display:block}.county{margin-bottom:10px}.hero h1{font-size:30px}}@media print{body{background:white}main{padding:0}.hero,section,.county{box-shadow:none;break-inside:avoid}}</style></head><body><main><div class="hero"><div class="eyebrow">AdapT · County policy intelligence</div><h1>${safe(homeShort)} × ${safe(peerShort)}</h1><p>${safe(payload.question)}</p><div class="eyebrow">Generated ${safe(generated)} · ADAPT data through 2022</div></div><div class="pair"><div class="county"><small>Home county</small><strong>${safe(payload.home.name)}</strong></div><div class="county"><small>${safe(payload.peer.mode)}</small><strong>${safe(payload.peer.name)}</strong></div></div><section><div class="section-label">Executive readout</div><h2>${safe(payload.answer?.title)}</h2><p>${safe(payload.answer?.summary)}</p><ul>${findings}</ul><div class="warning"><strong>Evidence boundary:</strong> Comparison does not establish causal attribution.</div></section><section><div class="section-label">Indicator scorecard</div><h2>County comparison</h2><table><thead><tr><th>Indicator</th><th>${safe(homeShort)}</th><th>${safe(peerShort)}</th></tr></thead><tbody>${metricRows}</tbody></table></section><section><div class="section-label">Action</div><h2>Recommended next step</h2><p>${safe(payload.answer?.recommendation)}</p></section><section class="sources"><div class="section-label">Evidence register</div><h2>${payload.sources.length} connected sources</h2><ol>${sources}</ol></section></main></body></html>`;
  const filename = `adapt-briefing-${String(payload.home.countyid).padStart(5, '0')}-${String(payload.peer.countyid).padStart(5, '0')}.html`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' } });
}
