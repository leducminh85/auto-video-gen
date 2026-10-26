const test=require('node:test'),assert=require('node:assert/strict');
const {inspectSceneList,fitSceneFrames,toStoryboard,skill}=require('./remotionSceneList.cjs');
const {planStory}=require('./remotionPlanner.cjs');const {sceneList}=require('./fixtures/sceneList.cjs');
test('collects all semantic errors and normalizes harmless frame/id mistakes',()=>{
 const raw=sceneList();raw.scenes[0].duration_frames=999;raw.scenes[0].scene_id=7;
 const good=inspectSceneList(raw);assert.deepEqual(good.issues,[]);assert.equal(good.data.scenes[0].duration_frames,90);assert.equal(good.data.scenes[0].scene_id,1);
 raw.scenes[0].location='unknown';raw.scenes[0].character_states.other={pose:'walk'};raw.scenes[0].duration_seconds=9;raw.scenes[0].remotion_component_suggestion='<script>alert(1)</script>';
 const paths=inspectSceneList(raw).issues.map(i=>i.path);for(const name of ['location','character_states/other','duration_seconds','remotion_component_suggestion'])assert.ok(paths.includes('/scenes/0/'+name));
 assert.match(skill(),/Show, don't tell/);
});
test('timing fills complete audio with bounded scenes despite unusable alignments',()=>{
 for(const candidates of [[],[0,0,2000,-10],[0,12,90,500]]){
 const frames=fitSceneFrames([120,120,120,120],480,candidates);assert.equal(frames.reduce((a,b)=>a+b,0),480);frames.forEach(f=>assert.ok(f>=60&&f<=180));
 }
 assert.throws(()=>fitSceneFrames([120],200));
 const scenes=toStoryboard(sceneList(['one two','three four'],4),'one two three four',8);
 assert.equal(scenes.sceneList.scenes[0].duration_frames,120);
 assert.equal(scenes.sceneList.scenes[0].duration_seconds*60,240);
});
test('repairs all rejected fields together without regenerating accepted scene content',async()=>{
 let calls=0;const raw=sceneList();raw.scenes[0].location='elsewhere';raw.scenes[0].character_states.protagonist.expression='';
 const result=await planStory('one two three','Test','dense',async prompt=>{
  if(prompt.startsWith('REVIEW VISUAL STORY'))return {passed:true,issues:[]};
  calls++;if(calls===1)return raw;
  assert.ok(prompt.startsWith('FIX THESE ITEMS FIRST:'));assert.match(prompt,/\/scenes\/0\/location/);assert.match(prompt,/\/scenes\/0\/character_states\/protagonist/);
  return {repairs:[{path:'/scenes/0/location',value:'stage'},{path:'/scenes/0/character_states/protagonist',value:{pose:'stepping_forward',expression:'resolved'}}]};
 },{seconds:3});
 assert.equal(calls,2);assert.equal(result[0].direction,raw.scenes[0].visual_action);
});
test('15-scene request keeps declared cast and 30fps JSON through adapter',async()=>{
 const parts=Array.from({length:15},(_,i)=>`sentence ${i}`);
 const result=await planStory(parts.join(' '),'Speaking in public','balanced',async prompt=>prompt.startsWith('REVIEW VISUAL STORY')?{passed:true,issues:[]}:sceneList(parts,4),{seconds:60,sceneCount:15});
 assert.equal(result.length,15);assert.deepEqual(inspectSceneList(result.sceneList).issues,[]);
 assert.equal(result.sceneList.scenes.reduce((n,s)=>n+s.duration_frames,0),1800);
});
test('editing a skill draft round-trips camera, pose and VFX into strict JSON',()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');const before=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'director-draft-'));process.chdir(temp);
 try{
  const drafts=require('./storyboardDrafts.cjs'),{exportDraft}=require('./remotionSceneList.cjs');
  const storyboard=toStoryboard(sceneList(),'one two three',3);
  const d=drafts.createDraft({run:'director-draft-test',title:'Test',storyboard,sceneList:storyboard.sceneList,lengths30:[90],options:{speed:1}});
  const edited=structuredClone(d);edited.scenes[0].scene_spec.camera_movement='pan_right';edited.scenes[0].scene_spec.vfx=['chalk_line'];edited.scenes[0].direction='The figure crosses the chalk line and lifts its head.';
  const saved=drafts.saveDraft(d.id,edited);const exported=exportDraft(drafts.read(d.id));
  assert.equal(saved.revision,2);assert.equal(exported.scenes[0].camera_movement,'pan_right');assert.deepEqual(exported.scenes[0].vfx,['chalk_line']);assert.equal(exported.scenes[0].visual_action,edited.scenes[0].direction);assert.deepEqual(inspectSceneList(exported).issues,[]);
  edited.revision=2;edited.scenes[0].layout.setting='undeclared';assert.throws(()=>drafts.saveDraft(d.id,edited),/declared/);assert.equal(drafts.read(d.id).revision,2);
 }finally{process.chdir(before);fs.rmSync(temp,{recursive:true,force:true});}
});
test('idea mode expands narration while script mode preserves the given words',async()=>{
 const parts=['He approaches the microphone.','His hands shake, but he starts speaking.'];
 const result=await planStory('A person overcomes public speaking anxiety','Test','balanced',async prompt=>{if(prompt.startsWith('REVIEW VISUAL STORY'))return {passed:true,issues:[]};assert.match(prompt,/Develop the raw idea/);return sceneList(parts,4.5);},{inputKind:'idea',sceneCount:2});
 assert.equal(result.map(s=>s.text).join(' '),parts.join(' '));
});
