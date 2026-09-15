// Run only against the local development server. Uses the server-side testing key.
const base='http://localhost:3100';
const headers={'Content-Type':'application/json',Cookie:'__sites_local_auth=1'};
async function call(path,data){const r=await fetch(base+path,{method:data?'POST':'GET',headers,body:data?JSON.stringify(data):undefined});const result=await r.json();if(!r.ok)throw new Error('HTTP '+r.status+': '+result.error);return result}
const thread=await call('/api/investigations',{title:'AI verification',counties:[39149,39011]});
console.log('Investigation:',thread.id);
const questions=[{message:'Compare Shelby County, Ohio and Auglaize County, Ohio on non-college wages and employment. Use the actual ADAPT numbers and distinguish what the comparison can and cannot tell us.',counties:[39149,39011]},{message:'Based on your answer, what would you investigate before recommending the same retraining program in both counties?',counties:[39149,39011]},{message:'Now focus on Allegheny County, Pennsylvania. What could AI change about local work, and what remains uncertain? Use its occupational data, not the Ohio counties.',counties:[42003]}];
for(const q of questions){const result=await call('/api/investigations/'+thread.id+'/messages',{...q,model:'gpt-4.1-mini'});console.log('\nQUESTION:',q.message,'\nANSWER:',result.assistant.content,'\nCITATIONS:',result.assistant.citations.map(c=>c.title));}
const saved=await call('/api/investigations/'+thread.id);console.log('Saved messages:',saved.messages.length,'Current counties:',saved.counties);
