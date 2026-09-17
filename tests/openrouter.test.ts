import {describe,it,expect,vi,afterEach} from 'vitest';
import {POST as createThread,DELETE as removeThread} from '../app/api/investigations/route';
import {POST as send} from '../app/api/investigations/[id]/messages/route';
import {GET as getThread} from '../app/api/investigations/[id]/route';
import {env} from './runtime';
import {routerResponse} from '../lib/openrouter';
const headers={'Content-Type':'application/json','oai-authenticated-user-id':'router-tester','oai-authenticated-user-email':'admin@example.com'};
function req(data:unknown,extra:Record<string,string>={},method='POST'){return new Request('https://adapt.test/api/test',{method,headers:{...headers,...extra},...(method==='GET'?{}:{body:JSON.stringify(data)})})}
afterEach(()=>{vi.unstubAllGlobals();env.OPENAI_API_KEY='';env.TESTER_EMAILS=''});
describe('OpenRouter integration',()=>{
 it('regenerates a length-limited answer once and never returns the partial text',async()=>{
  const mock=vi.fn().mockResolvedValueOnce(Response.json({choices:[{finish_reason:'length',message:{role:'assistant',content:'An unfinished answer'}}]})).mockResolvedValueOnce(Response.json({choices:[{finish_reason:'stop',message:{role:'assistant',content:'Complete scenarios, indicators and evidence gaps. [ADAPT]'}}]}));
  vi.stubGlobal('fetch',mock);
  const result=await routerResponse({key:'sk-or-fixture',model:'openai/test',instructions:'Evidence only',input:[{role:'user',content:'Give three scenarios'}],tools:[],allowTools:true});
  expect(mock).toHaveBeenCalledTimes(2);
  expect(JSON.stringify(result)).not.toContain('unfinished');
  const retry=JSON.parse(mock.mock.calls[1][1].body);
  expect(retry.max_tokens).toBe(6000);
  expect(retry.tool_choice).toBe('none');
  expect(retry.messages[0].content).toContain('EVERY requested section');
 });
 it('fails safely after a second truncation without persisting a misleading completed turn',async()=>{
  const mock=vi.fn(async()=>Response.json({choices:[{finish_reason:'length',message:{role:'assistant',content:'Cut off'}}]}));vi.stubGlobal('fetch',mock);
  const t=await (await createThread(req({title:'Truncation guard',counties:[39149]}))).json() as {id:string};const context={params:Promise.resolve({id:t.id})};
  const response=await send(req({provider:'openrouter',model:'openai/test',message:'Scenarios',counties:[39149]},{'x-openrouter-key':'sk-or-fixture'}),context);
  expect(response.status).toBe(502);expect(await response.text()).toContain('No incomplete answer was saved');expect(mock).toHaveBeenCalledTimes(2);
  const saved=await (await getThread(req({}, {},'GET'),context)).json() as {messages:unknown[]};expect(saved.messages).toHaveLength(0);
  await removeThread(req({id:t.id},{},'DELETE'));
 });
 it('rejects filtered responses instead of treating them as a completed answer',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>Response.json({choices:[{finish_reason:'content_filter',message:{role:'assistant',content:'Partial'}}]})));
  await expect(routerResponse({key:'sk-or-fixture',model:'openai/test',instructions:'Evidence only',input:[],tools:[],allowTools:false})).rejects.toThrow('did not complete');
 });
 it('retains tool calls, reasoning metadata, saved follow-ups, and county context',async()=>{
  const t=await (await createThread(req({title:'Router test',counties:[39149,39011]}))).json() as {id:string};const context={params:Promise.resolve({id:t.id})};const calls:{url:string;payload:Record<string,unknown>;auth:string}[]=[];
  vi.stubGlobal('fetch',vi.fn(async(url:string,options:RequestInit)=>{calls.push({url,payload:JSON.parse(String(options.body)),auth:(options.headers as Record<string,string>).Authorization});return Response.json(calls.length===1?{choices:[{message:{role:'assistant',content:null,reasoning_details:[{type:'reasoning.encrypted',data:'opaque-fixture'}],tool_calls:[{id:'lookup',type:'function',function:{name:'get_county_profile',arguments:'{"fips":39011}'}},{id:'evidence',type:'function',function:{name:'search_evidence',arguments:'{"query":"retraining outcomes"}'}}]}}]}:{choices:[{message:{role:'assistant',content:'County comparisons do not establish causation. [ADAPT]'}}]})}));
  const response=await send(req({provider:'openrouter',model:'openai/gpt-4.1-mini',message:'Compare these places',counties:[39149,39011]},{'x-openrouter-key':'sk-or-fixture','x-openai-key':'sk-do-not-send'}),context);
  expect(response.status).toBe(200);expect(calls).toHaveLength(2);expect(calls.every(c=>c.url==='https://openrouter.ai/api/v1/chat/completions')).toBe(true);expect(calls.every(c=>c.auth==='Bearer sk-or-fixture')).toBe(true);expect(JSON.stringify(calls)).not.toContain('sk-do-not-send');const messages=calls[1].payload.messages as Record<string,unknown>[];expect(messages.filter(m=>m.role==='tool')).toHaveLength(2);expect(messages.find(m=>m.role==='assistant')?.reasoning_details).toEqual([{type:'reasoning.encrypted',data:'opaque-fixture'}]);expect(JSON.stringify(messages)).toContain('Auglaize');expect(calls[1].payload.tools).toBeDefined();
  const follow=await send(req({provider:'openrouter',model:'openai/gpt-4.1-mini',message:'And Allegheny?',counties:[42003]},{'x-openrouter-key':'sk-or-fixture'}),context);expect(follow.status).toBe(200);expect(JSON.stringify(calls.at(-1)?.payload.messages)).toContain('Compare these places');expect(JSON.stringify(calls.at(-1)?.payload.messages)).toContain('Allegheny');const saved=await (await getThread(req({}, {},'GET'),context)).json() as {messages:unknown[]};expect(saved.messages).toHaveLength(4);await removeThread(req({id:t.id},{},'DELETE'));
 });
 it('never falls back to the built-in OpenAI key when the OpenRouter key is missing',async()=>{env.OPENAI_API_KEY='sk-built-in-fixture';env.TESTER_EMAILS='admin@example.com';const mock=vi.fn();vi.stubGlobal('fetch',mock);const t=await (await createThread(req({title:'No fallback',counties:[39149]}))).json() as {id:string};const response=await send(req({provider:'openrouter',message:'Test',counties:[39149]}),{params:Promise.resolve({id:t.id})});expect(response.status).toBe(400);expect(await response.text()).toContain('OpenRouter');expect(mock).not.toHaveBeenCalled();await removeThread(req({id:t.id},{},'DELETE'))});
 it('reports provider credit errors and rejects arbitrary providers or model URLs',async()=>{const t=await (await createThread(req({title:'Errors',counties:[39149]}))).json() as {id:string};const context={params:Promise.resolve({id:t.id})};vi.stubGlobal('fetch',vi.fn(async()=>Response.json({error:{code:402}},{status:402})));const response=await send(req({provider:'openrouter',model:'openai/gpt-4.1-mini',message:'Test',counties:[39149]},{'x-openrouter-key':'sk-or-fixture'}),context);expect(response.status).toBe(402);expect(await response.text()).toContain('OpenRouter account needs credits');expect((await send(req({provider:'other',message:'Test',counties:[39149]}),context)).status).toBe(400);expect((await send(req({provider:'openrouter',model:'https://evil.test?x=1',message:'Test',counties:[39149]},{'x-openrouter-key':'sk-or-fixture'}),context)).status).toBe(400);await removeThread(req({id:t.id},{},'DELETE'))});
});
