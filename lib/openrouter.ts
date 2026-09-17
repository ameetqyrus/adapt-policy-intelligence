import {HttpError} from './server';
type Tool={name:string;description:string;parameters:object};
export async function routerResponse(args:{key:string;model:string;instructions:string;input:Record<string,unknown>[];tools:Tool[];allowTools:boolean}, compactRetry = false): Promise<{output: Record<string, unknown>[]}>{
 const messages:Record<string,unknown>[]=[{role:'system',content:args.instructions}];
 for(const item of args.input){
  if(item.type==='router_assistant'){messages.push(item.message as Record<string,unknown>);continue}
  if(item.type==='function_call')continue; // Already included in the original assistant message above.
  if(item.type==='function_call_output'){messages.push({role:'tool',tool_call_id:item.call_id,content:item.output});continue}
  if(item.role==='user'||item.role==='assistant')messages.push({role:item.role,content:typeof item.content==='string'?item.content:(Array.isArray(item.content)?item.content:[]).map(c=>c.text||'').join('\n')});
 }
 const r=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+args.key,'Content-Type':'application/json','X-OpenRouter-Title':'ADAPT Observatory'},body:JSON.stringify({model:args.model,messages,tools:args.tools.map(t=>({type:'function',function:{name:t.name,description:t.description,parameters:t.parameters}})),tool_choice:args.allowTools?'auto':'none',provider:{require_parameters:true},max_tokens:6000,stream:false}),signal:AbortSignal.timeout(45000)});
 const data=await r.json() as {error?:{code?:number};choices?:{finish_reason?:string;message?:{role:string;content?:string|null;tool_calls?:{id:string;type:string;function:{name:string;arguments:string}}[];reasoning_details?:unknown[]}}[]};
 if(!r.ok||data.error){const status=Number(data.error?.code)||r.status;throw new HttpError(status===401?401:status===402?402:status===429?429:502,status===401?'OpenRouter did not accept this key. Update it in AI connection.':status===402?'Your OpenRouter account needs credits for this request. Check its balance, then retry.':status===429?'OpenRouter reached a rate limit. Wait briefly, then retry.':status===400||status===404?'This OpenRouter model is unavailable or does not support the required tools. Choose a tool-capable model ID.':'OpenRouter could not complete the request. Please retry.');}
 const choice=data.choices?.[0];
 if(choice?.finish_reason==='length'){
  // Regenerate once from the original context, never persist a truncated answer or execute partial tool arguments.
  if(!compactRetry)return routerResponse({...args,allowTools:false,instructions:args.instructions+'\nYour previous generation exceeded its output limit. Produce a complete concise answer in at most 650 words covering EVERY requested section, including indicators and evidence gaps. Use only evidence already available; state any gaps. Do not repeat the previous answer.'},true);
  throw new HttpError(502,'The model could not complete its answer within the output limit. No incomplete answer was saved. Your question is preserved; please narrow it or choose another model.');
 }
 if(choice?.finish_reason==='content_filter'||choice?.finish_reason==='error')throw new HttpError(502,'The provider did not complete this response. No incomplete answer was saved. Please rephrase your question or choose another model.');
 const message=choice?.message;if(!message)throw new HttpError(502,'OpenRouter returned no readable response. Please retry.');
 if(message.tool_calls?.length){if(message.tool_calls.length>8)throw new HttpError(502,'The model requested too many tools at once. Try a more focused question.');return {output:[{type:'router_assistant',message},...message.tool_calls.map(c=>({type:'function_call',name:c.function.name,arguments:c.function.arguments,call_id:c.id}))]};}
 return {output:[{type:'message',role:'assistant',content:[{type:'output_text',text:message.content||''}]}]};
}
