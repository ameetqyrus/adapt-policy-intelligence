import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeContext, evidencePrinciples } from '../lib/workspace-context';
import { helpSections } from '../lib/help';
import { referenceSources } from '../lib/catalog';
import { GET as getPolicies, POST as addPolicy } from '../app/api/policies/route';
import { POST as addSource, DELETE as removeSource } from '../app/api/sources/route';
import { POST as createThread } from '../app/api/investigations/route';
import { POST as sendMessage } from '../app/api/investigations/[id]/messages/route';
import { GET as getThread } from '../app/api/investigations/[id]/route';
import { policiesFor } from '../lib/policies';
import { answer } from '../lib/analyst';
const root='https://adapt.test';
const admin={'oai-authenticated-user-id':'companion-admin','oai-authenticated-user-email':'admin@example.com'};
function request(path:string,data:unknown,headers:Record<string,string>=admin,method='POST') { return new Request(root+path,{method,headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(data)}); }
afterEach(()=>vi.unstubAllGlobals());
describe('evidence-first context contract',()=>{
  it('normalizes tool context and bounds untrusted scenario text',()=>{
    expect(normalizeContext({surface:'not-valid',metric:'secret',scenario:{output:'discard'}})).toEqual({surface:'investigation'});
    const normalized=normalizeContext({surface:'simulator',metric:'potential',scenario:{assumptions:'a'.repeat(5000),output:'user copied result'}});
    expect(normalized.scenario?.assumptions).toHaveLength(3000);
    expect(normalized.scenario?.output).toBe('user copied result');
    expect(normalizeContext(null)).toEqual({surface:'investigation'});
  });
  it('prescribes evidence not local policies and rejects unsupported simulator claims',()=>{
    expect(evidencePrinciples).toContain('Do not add unsolicited policy recommendations');
    expect(evidencePrinciples).toContain('never verified simulator output');
    expect(evidencePrinciples).toContain('not necessarily a causal evaluation');
  });
  it('provides help for every major workflow and accurately labels source limitations',()=>{
    expect(helpSections.map(s=>s.id)).toEqual(expect.arrayContaining(['start','compare','chat','connect','sources','audit','policy','future','save','trouble']));
    expect(helpSections.find(s=>s.id==='future')?.text).toContain('does not recreate');
    expect(helpSections.find(s=>s.id==='audit')?.text).toContain('not indexed evidence');
    expect(new Set(referenceSources.map(s=>s.url)).size).toBe(referenceSources.length);
    expect(referenceSources.some(s=>s.title.includes('Workforce Almanac'))).toBe(true);
  });
  it('sends current surface and preserves per-answer county context through switch and return',async()=>{
    const created=await createThread(request('/api/investigations',{title:'Context regression',counties:[39149,39011]}));
    const {id}=await created.json() as {id:string};
    const turns=[{counties:[39149,39011],context:{surface:'comparison',metric:'star_median2022'}},{counties:[42003],context:{surface:'map',metric:'potential'}},{counties:[39149,39011],context:{surface:'simulator',scenario:{assumptions:'Conditional 2030 adoption',output:''}}}];
    for(const turn of turns){
      vi.stubGlobal('fetch',vi.fn(async(_url:string,opts:RequestInit)=>{
        const payload=JSON.parse(String(opts.body));
        const contextMessage = payload.messages.find((m:{content?:string})=>m.content?.startsWith('Current workspace context'));
        expect(contextMessage.content).toContain('"surface":"'+turn.context.surface+'"');
        expect(JSON.stringify(payload)).toContain('EVIDENCE-FIRST RESPONSE CONTRACT');
        return Response.json({choices:[{message:{role:'assistant',content:'No causal effect can be established from this comparison. [ADAPT]'}}]});
      }));
      const response=await sendMessage(request('/message',{...turn,provider:'openrouter',model:'openai/test',message:'What does the evidence support?'},{...admin,'x-openrouter-key':'sk-or-test-fixture'}),{params:Promise.resolve({id})});
      expect(response.status).toBe(200);
      const data=await response.json() as {assistant:{context:{surface:string;counties:number[]}}};
      expect(data.assistant.context.counties).toEqual(turn.counties);
      expect(data.assistant.context.surface).toBe(turn.context.surface);
    }
    const restored=await getThread(new Request(root+'/api/investigations/'+id,{headers:admin}),{params:Promise.resolve({id})});
    const saved=await restored.json() as {messages:{context:{surface:string}}[]};
    expect(saved.messages.filter((_,i)=>i%2===1).map(m=>m.context.surface)).toEqual(['comparison','map','simulator']);
  });
});
describe('source-backed policy register',()=>{
  it('requires authentication and administrator authority',async()=>{
    expect((await getPolicies(new Request(root+'/api/policies?counties=39149'))).status).toBe(401);
    expect((await addPolicy(request('/api/policies',{}, {'oai-authenticated-user-id':'reader'}))).status).toBe(403);
  });
  it('requires an exact indexed passage, validates dates and excludes removed sources',async()=>{
    const excerpt='Synthetic QA source only: fictional Example County adopted a fictional apprenticeship pilot on 2024-06-01. No outcomes have been evaluated.';
    const form=new FormData();form.set('file',new File([excerpt],'synthetic-policy.txt'));form.set('title','Synthetic policy test');
    const response=await addSource(new Request(root+'/api/sources',{method:'POST',headers:admin,body:form}));
    expect(response.status).toBe(201);
    const {id:sourceId}=await response.json() as {id:string};
    const record={countyId:39149,title:'Synthetic example only',adoptedDate:'2024-06-01',status:'Adopted',sourceId,excerpt,outcome:'Not evaluated'};
    expect((await addPolicy(request('/api/policies',{...record,excerpt:'A made up quotation that is not found in any of the uploaded indexed source passages.'}))).status).toBe(400);
    expect((await addPolicy(request('/api/policies',{...record,adoptedDate:'2024-02-30'}))).status).toBe(400);
    expect((await addPolicy(request('/api/policies',record))).status).toBe(201);
    expect((await policiesFor([39149])).some(p=>p.sourceId===sourceId)).toBe(true);
    expect((await policiesFor([39011])).some(p=>p.sourceId===sourceId)).toBe(false);
    let round=0;
    vi.stubGlobal('fetch',vi.fn(async(_url:string,opts:RequestInit)=>{
      const payload=JSON.parse(String(opts.body));
      if(round++===0) return Response.json({choices:[{message:{role:'assistant',content:null,tool_calls:[{id:'policy-call',type:'function',function:{name:'get_documented_policies',arguments:JSON.stringify({fips:39149})}}]}}]});
      const toolMessage=payload.messages.find((m:{role:string})=>m.role==='tool');
      const rows=JSON.parse(toolMessage.content);
      expect(rows[0].excerpt).toBe(excerpt);
      expect(rows[0].caveat).toContain('not causation');
      return Response.json({choices:[{message:{role:'assistant',content:'This is a fictional QA fixture, not real county evidence. ['+rows[0].citationId+']'}}]});
    }));
    const reply=await answer({provider:'openrouter',key:'sk-or-fixture',model:'openai/test',message:'List documented policies',history:[],ids:[39149],origin:root});
    expect(round).toBe(2);
    expect(reply.citations).toHaveLength(1);
    expect(reply.citations[0].title).toBe('Synthetic policy test');
    expect(reply.citations[0].id).toMatch(/^policy-/);
    expect((await removeSource(request('/api/sources',{id:sourceId},admin,'DELETE'))).status).toBe(200);
    expect((await policiesFor([39149])).some(p=>p.sourceId===sourceId)).toBe(false);
  });
});
