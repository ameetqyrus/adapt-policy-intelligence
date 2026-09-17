import { db } from './server';
export type PolicyRecord = {
  id: string; countyId: number; title: string; adoptedDate: string | null;
  status: string; outcome: string; sourceId: string; sourceTitle: string;
  url: string | null; excerpt: string;
};
export async function policiesFor(ids: number[]): Promise<PolicyRecord[]> {
  if (!ids.length) return [];
  const result = await db().prepare(`SELECT p.id,p.county_id AS countyId,p.title,p.adopted_date AS adoptedDate,p.status,p.outcome,p.source_id AS sourceId,p.excerpt,s.title AS sourceTitle,s.url FROM policy_records p JOIN sources s ON s.id=p.source_id WHERE s.status='indexed' AND p.county_id IN (${ids.map(() => '?').join(',')}) ORDER BY p.adopted_date IS NULL,p.adopted_date DESC,p.title LIMIT 100`).bind(...ids).all<PolicyRecord>();
  return result.results;
}
