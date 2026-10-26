const test=require('node:test'),assert=require('node:assert/strict');
const {sceneList}=require('./fixtures/sceneList.cjs');
const {planStory,planShot}=require('./remotionPlanner.cjs');
const {toStoryboard}=require('./remotionSceneList.cjs');
const {approvedBoard}=require('./remotionVisualStory.cjs');
const {sampleFrames,reviewIssues,inspectRendered}=require('./remotionVisualReview.cjs');
const {extractSet,applySet}=require('./remotionStageAssets.cjs');
const {shot}=require('./fixtures/remotionProject.cjs');
test('semantic repair changes only weak scenes and reviews only repaired indices',async()=>{
 const original=sceneList(['one two','three four'],4);let reviews=0,designs=0;
 const result=await planStory('one two three four','test','balanced',async prompt=>{
  if(prompt.startsWith('REVIEW VISUAL STORY')) {
   reviews++;if(reviews===1)return {passed:false,issues:[{scene:1,message:'Use a close view of the actual evidence.'}]};
   assert.match(prompt,/only scene indices 1;/);return {passed:true,issues:[]};
  }
  designs++;if(designs===1)return original;
  assert.match(prompt,/FIX THESE ITEMS FIRST/);
  return {repairs:[{path:'/scenes/1',value:{...original.scenes[1],story:{...original.scenes[1].story,framing:'close'}}}]};
 },{seconds:8});
 assert.equal(designs,2);assert.equal(reviews,2);assert.deepEqual(result[0].scene_spec.story,original.scenes[0].story);assert.equal(result[1].scene_spec.story.framing,'close');
});
test('approved plan compiles edited actions directly without a new director request',()=>{
 const scenes=toStoryboard(sceneList(),'one two three',3);scenes[0].actions=['Edited preparation','Edited result'];
 const board=approvedBoard(scenes[0]);assert.equal(board.source,'approved_visual_story');assert.deepEqual(board.shots[0].events.map(e=>e.action),scenes[0].actions);assert.equal(board.shots[0].events[1].at,.6);
});
test('existing set survives subsequent shot generation and moving props are not scenery',()=>{
 const set=extractSet({...shot,layers:[{id:'set',type:'g',children:[{id:'set-floor',type:'rect',attrs:{width:1920,height:40}}]}]});assert.ok(set);
 assert.equal(extractSet({...shot,layers:[{id:'set',type:'g',children:[{id:'actor',type:'character'}]}]}),null);
 assert.deepEqual(applySet(shot,set).layers[0],set.layer);
});
test('rendered defects are fixed together while accepted layers stay intact',async()=>{
 let asks=0,reviews=0,firstLayers;
 const result=await planShot({text:'test',seconds:3},async prompt=>{
  asks++;if(asks===1)return shot;
  assert.match(prompt,/FIX THESE ITEMS FIRST/);return {repairs:[{path:'/camera',value:{scale:1}}]};
 },{inspectRendered:async candidate=>{if(++reviews===1){firstLayers=structuredClone(candidate.layers);return [{path:'/camera',message:'Subject cropped accidentally'}];}return [];}});
 assert.equal(asks,2);assert.deepEqual(result.layers,firstLayers);assert.equal(reviews,2);
});
test('frame audit samples contacts and maps repairs to actual layer IDs',()=>{
 const frames=sampleFrames(240,[{at:.5}]);assert.ok(frames.includes(120));assert.equal(frames[0],0);assert.equal(frames.at(-1),239);
 const id=shot.layers[0].id;assert.deepEqual(reviewIssues({passed:false,issues:[{target:id,message:'Hand misses prop'},{target:id,message:'Prop clips face'}]},shot),[{path:'/layers/0',message:'Hand misses prop Prop clips face'}]);
 assert.throws(()=>reviewIssues({passed:false,issues:[{target:'invented',message:'Fix'}]},shot));
});
test('render review sends actual images and reuses an accepted audit',async()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');const root=fs.mkdtempSync(path.join(os.tmpdir(),'visual-audit-'));fs.mkdirSync(path.join(root,'visual-review'));let renders=0,requests=0;
 try {
 const args={shot,duration:240,story:sceneList().scenes[0].story,root,previewer:{render:async()=>{renders++;return {file:'/tmp/rendered-frame.png',frames:[0,239]};}},ask:async(prompt,options)=>{requests++;assert.deepEqual(options.images,['/tmp/rendered-frame.png']);assert.doesNotMatch(prompt,/\/tmp\//);return {passed:true,issues:[]};}};
 assert.deepEqual(await inspectRendered(args),[]);assert.deepEqual(await inspectRendered(args),[]);assert.equal(renders,1);assert.equal(requests,1);
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('long storyboard review uses bounded groups with neighbor context and collects every issue',async()=>{
 const {reviewVisualStory}=require('./remotionVisualStory.cjs');
 const list=sceneList(Array.from({length:20},(_,i)=>`Sentence ${i}`),4);let calls=0;
 const issues=await reviewVisualStory(list,async prompt=>{
  calls++;const indices=prompt.match(/only scene indices ([\d,]+);/)[1].split(',').map(Number);
  const context=JSON.parse(prompt.split('SCENES:')[1]);
  assert.ok(indices.length<=6);assert.ok(context.length<=8);
  for(const i of indices)assert.ok(context.some(s=>s.i===i));
  return {passed:false,issues:indices.map(scene=>({scene,message:'Show visible evidence'}))};
 });
 assert.equal(calls,4);assert.equal(issues.length,20);assert.equal(new Set(issues.map(i=>i.path)).size,20);
});
test('missing image attachments are transport errors, never layer repairs',()=>{
 assert.throws(()=>reviewIssues({passed:false,images_received:false,issues:[]},shot),/gửi lại ảnh/);
 assert.throws(()=>reviewIssues({passed:false,issues:[{target:shot.layers[0].id,message:'The rendered frame images at indices 0,4,51 are not supplied. Attach the actual rendered images.'}]},shot),/gửi lại ảnh/);
});
test('visual repair receives the rendered evidence rather than only written feedback',async()=>{
 let images=[],calls=0,reviews=0;
 await planShot({text:'Tap a button',seconds:3},async(prompt,options)=>{
  calls++;if(calls===1){assert.deepEqual(options.images,[]);return shot;}
  assert.deepEqual(options.images,['/tmp/contact-sheet.png']);return {repairs:[{path:'/camera/scale',value:1}]};
 },{getRepairImages:()=>images,inspectRendered:async()=>{images=['/tmp/contact-sheet.png'];return ++reviews===1?[{path:'/camera',message:'Frame the visible contact'}]:[];}});
 assert.equal(calls,2);
});
