import { body, db, fail, HttpError, identity, json, writable } from '@/lib/server';
import { validCounties } from '@/lib/analyst';
import { policiesFor } from '@/lib/policies';

export async function GET(request: Request) {
  try {
    identity(request);
    const ids = validCounties((new URL(request.url).searchParams.get('counties') || '').split(',').map(Number));
    return json(await policiesFor(ids));
  } catch (e) { return fail(e); }
}
export async function POST(request: Request) {
  try {
    const user = writable(request, true);
    const data = await body(request);
    const countyId = validCounties([data.countyId])[0];
    const title = String(data.title || '').trim();
    const excerpt = String(data.excerpt || '').trim();
    const sourceId = String(data.sourceId || '');
    const adoptedDate = String(data.adoptedDate || '');
    const status = String(data.status || '');
    const outcome = String(data.outcome || '').trim();
    if (!countyId || title.length < 3 || title.length > 180 || excerpt.length < 40 || excerpt.length > 1600 || outcome.length > 1500)
      throw new HttpError(400, 'Choose a county and supply a title (3–180 characters), supporting passage (40–1,600 characters), and outcome notes under 1,500 characters.');
    if (!['Proposed', 'Adopted', 'Active', 'Ended', 'Unknown'].includes(status)) throw new HttpError(400, 'Choose a policy status.');
    if (adoptedDate && (!/^\d{4}-\d{2}-\d{2}$/.test(adoptedDate) || !Number.isFinite(Date.parse(adoptedDate)) || new Date(adoptedDate).toISOString().slice(0, 10) !== adoptedDate)) throw new HttpError(400, 'Use a valid adoption date or leave it unknown.');
    const source = await db().prepare("SELECT id FROM sources WHERE id=? AND status='indexed'").bind(sourceId).first();
    if (!source) throw new HttpError(400, 'Choose a currently indexed source.');
    // Require a verbatim supporting passage, not an invented quotation.
    const passages = await db().prepare('SELECT body FROM chunks WHERE source_id=?').bind(sourceId).all<{body: string}>();
    if (!passages.results.some(p => p.body.includes(excerpt))) throw new HttpError(400, 'Copy an exact supporting passage from Inspect source. The passage must appear in an indexed chunk.');
    const id = crypto.randomUUID();
    await db().prepare('INSERT INTO policy_records (id,county_id,title,adopted_date,status,outcome,source_id,excerpt,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,countyId,title,adoptedDate || null,status,outcome,sourceId,excerpt,user.id,new Date().toISOString()).run();
    return json({id}, 201);
  } catch (e) { return fail(e); }
}
export async function DELETE(request: Request) {
  try {
    writable(request, true);
    const data = await body(request);
    await db().prepare('DELETE FROM policy_records WHERE id=?').bind(String(data.id)).run();
    return json({removed:true});
  } catch (e) { return fail(e); }
}
