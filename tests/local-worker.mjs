// Integration check against an isolated, empty local starter identity.
// Never run against a hosted URL. It tests recovery without calling OpenAI.
import {request} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const ctx=await request.newContext({baseURL:'http://localhost:5173'});
await ctx.get('/signin-with-chatgpt?return_to=/');
const status=await (await ctx.get('/api/ambi/status')).json();
assert.equal(status.signedIn,true);
if(status.configured)throw new Error('This failure-path check requires an unconfigured local API key.');
const before=await (await ctx.get('/api/ambi/state')).json();
if(before.messages.length||before.tasks.length||before.busy)throw new Error('Local workspace is not empty. Preserve it; do not run this fixture.');
const state={messages:[{id:'integration-proposal',role:'assistant',text:'Fixture proposal',proposal:{title:'Fixture draft',brief:'Draft a fictional request'}}],decisions:[],tasks:[],busy:null};
const sql=`UPDATE ambi_workspaces SET state='${JSON.stringify(state).replaceAll("'","''")}',version=version+1 WHERE owner='local_seedy';`;
writeFileSync('outputs/worker-fixture.sql',sql);
execFileSync('node',['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--file','outputs/worker-fixture.sql'],{stdio:'ignore'});
try{
 const denied=await ctx.post('/api/ambi/confirm',{headers:{Origin:'https://untrusted.invalid'},data:{brief:'draft'}});assert.equal(denied.status(),403);
 const response=await ctx.post('/api/ambi/confirm',{data:{brief:'Draft a fictional request; do not send.'}});assert.equal(response.status(),202);
 const confirmed=await response.json();assert.equal(confirmed.decisions.length,1);assert.equal(confirmed.tasks[0].status,'working');
 let result;
 for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,250));result=await (await ctx.get('/api/ambi/state')).json();if(!result.busy)break;}
 assert.equal(result.tasks[0].status,'failed');assert.equal(result.busy,null);assert.equal(result.decisions[0].text,'Draft a fictional request; do not send.');
 const duplicate=await ctx.post('/api/ambi/confirm',{data:{brief:'draft again'}});assert.equal(duplicate.status(),400);
 const foreignReview=await ctx.post('/api/ambi/review',{data:{id:'other-users-task'}});assert.equal(foreignReview.status(),400);
 console.log('PASS: signed-in durable decision, 202 background response, missing-key recovery, duplicate rejection, invalid task rejection, CSRF rejection.');
}finally{await ctx.post('/api/ambi/reset',{data:{}});await ctx.dispose();}
