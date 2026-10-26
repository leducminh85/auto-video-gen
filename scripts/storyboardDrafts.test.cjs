const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const drafts=require('./storyboardDrafts.cjs');
test('approval requires saved revision and preserves audio while applying scene edits',()=>{
 const before=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'storyboard-test-'));process.chdir(temp);
 try{
 const plan={run:'test-storyboard-123',title:'Test',storyboard:[{title:'A',text:'Original narration',direction:'Reach and touch',actions:['Reach','Touch'],layout:{setting:'Room',subject:'Leo',prop:'Phone'}}],lengths30:[180],options:{speed:1},source:'/audio.wav'};
 const d=drafts.createDraft(plan);assert.equal(d.scenes[0].duration,6);assert.equal(d.status,'draft');
 const changed={...d,scenes:[{...d.scenes[0],text:'Injected narration',direction:'Raise the phone',actions:['Look','Pick up']}]};
 const saved=drafts.saveDraft(d.id,changed);assert.equal(saved.scenes[0].text,'Original narration');assert.equal(saved.scenes[0].direction,'Raise the phone');assert.equal(saved.revision,2);
 assert.throws(()=>drafts.begin(d.id,1),/bản sửa/);
 const approved=drafts.begin(d.id,2);assert.equal(approved.storyboard[0].direction,'Raise the phone');assert.equal(approved.status,'building');
 assert.throws(()=>drafts.begin(d.id,2));assert.throws(()=>drafts.saveDraft(d.id,saved));
 drafts.progress(d.id,{message:'Đang chờ kết quả',percent:22});assert.equal(drafts.publicDraft(drafts.read(d.id)).progress.percent,22);drafts.requestStop(d.id);assert.throws(()=>drafts.assertRunning(d.id),e=>e.retryExhausted===true);
 drafts.finish(d.id,'failed');assert.equal(drafts.publicDraft(drafts.read(d.id)).approvedRevision,2);assert.equal(drafts.begin(d.id,2).status,'building');assert.doesNotThrow(()=>drafts.assertRunning(d.id));drafts.finish(d.id,'complete');assert.throws(()=>drafts.begin(d.id,2));
 assert.throws(()=>drafts.read('../escape'));
 }finally{process.chdir(before);fs.rmSync(temp,{recursive:true,force:true});}
});
test('generation stops at persisted storyboard before any animation or render request',async()=>{
 const {generateVideo}=require('./remotionGenerator.cjs');
 const {ChatGPTBrowser}=require('./chatgptBrowser.cjs');
 const open=ChatGPTBrowser.prototype.open,request=ChatGPTBrowser.prototype.request;
 let calls=0;const before=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'storyboard-gate-'));process.chdir(temp);
 ChatGPTBrowser.prototype.open=async()=>({connected:true});
 ChatGPTBrowser.prototype.request=async prompt=>{if(prompt.startsWith('REVIEW VISUAL STORY'))return JSON.stringify({passed:true,issues:[]});calls++;if(calls>1)throw new Error('Animation must wait for approval');return JSON.stringify(require('./fixtures/sceneList.cjs').sceneList());};
 try{const result=await generateVideo({content:'one two three',title:'Test'});assert.equal(result.approvalRequired,true);assert.equal(result.draft.status,'draft');assert.equal(calls,1);assert.equal(result.finalVideoPath,undefined);assert.ok(fs.existsSync(path.join(temp,'data/storyboard-drafts',result.draft.id+'.json')));}
 finally{process.chdir(before);ChatGPTBrowser.prototype.open=open;ChatGPTBrowser.prototype.request=request;fs.rmSync(temp,{recursive:true,force:true});}
});
