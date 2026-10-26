const test=require('node:test');
const assert=require('node:assert/strict');
const {inspectShot,applyRepairs}=require('./remotionInspection.cjs');
const {planShot}=require('./remotionPlanner.cjs');
const {retryPart}=require('./remotionReliability.cjs');
const good={version:1,styleId:'STICKMAN_500IQ_V1',background:'#ffffff',layers:[{id:'good',type:'rect',attrs:{width:100,height:100}},{id:'bad',type:'character',x:50}]};
test('collects all errors across metadata, camera, motion and nested layers in one pass',()=>{
  const data=structuredClone(good);
  data.background='not-a-color';data.camera={scale:'wrong'};
  data.layers[1].x={from:0,to:'wrong'};data.layers[1].emotion='invalid';
  const {issues}=inspectShot(data);
  for(const path of ['/background','/camera/scale','/layers/1/x','/layers/1/emotion']) assert.ok(issues.some(issue=>issue.path===path),path);
});
test('repairs all rejected fields together and preserves accepted layers',async()=>{
  let calls=0;
  const data=structuredClone(good);data.layers[1].x='wrong';data.layers[1].emotion='invalid';
  const result=await planShot({text:'test',seconds:3},async prompt=>{
    calls++;
    if(calls===1)return data;
    assert.ok(prompt.startsWith('FIX THESE ITEMS FIRST:'));
    assert.ok(prompt.indexOf('/layers/1/x')<prompt.indexOf('CONTRACT:'));
    assert.ok(prompt.indexOf('/layers/1/emotion')<prompt.indexOf('CONTRACT:'));
    return {repairs:[{path:'/layers/1/x',value:50},{path:'/layers/1/emotion',value:'calm'}]};
  });
  assert.equal(calls,2);assert.deepEqual(result.layers[0],good.layers[0]);
  assert.equal(result.layers[1].emotion,'calm');
});
test('refuses edits to accepted fields and prototype paths',()=>{
  assert.throws(()=>applyRepairs(good,[{path:'/layers/1/x'}],{repairs:[{path:'/layers/0/attrs/width',value:0}]}));
  assert.throws(()=>applyRepairs(good,[{path:'/__proto__/x'}],{repairs:[{path:'/__proto__/x',value:1}]}));
});
test('already valid shot needs no generation request',async()=>{
  let calls=0;
  await planShot({text:'test',seconds:3},async()=>{calls++;return good;},{initial:good});
  assert.equal(calls,0);
});
test('saved partial shot resumes with field repairs and preserves accepted geometry',async()=>{
  const draft=structuredClone(good);draft.layers[1].x='invalid';
  const saved=[];let calls=0;
  const result=await planShot({text:'test',seconds:3},async prompt=>{
    calls++;assert.ok(prompt.startsWith('FIX THESE ITEMS FIRST:'));
    return {repairs:[{path:'/layers/1/x',value:55}]};
  },{initial:draft,onDraft:value=>saved.push(structuredClone(value))});
  assert.equal(calls,1);assert.equal(saved.length,2);
  assert.deepEqual(result.layers[0],good.layers[0]);
});
test('outer stage retry does not regenerate a shot after its repair budget is exhausted',async()=>{
  let calls=0;
  await assert.rejects(retryPart(()=>planShot({text:'test',seconds:3},async()=>{calls++;return {};})),error=>error.retryExhausted===true);
  assert.equal(calls,6);
});

test('layer review accepts precise child repairs without touching accepted layers',()=>{
 const data={layers:[{id:'accepted',type:'rect',attrs:{width:20}},{id:'phone',type:'g',children:[{id:'label',type:'text',text:'Publish'}]}],camera:{scale:1}};
 const motion={keys:[{at:0,value:1},{at:.52,value:0}]};
 const patched=applyRepairs(data,[{path:'/layers/1'}],{repairs:[{path:'/layers/1/children/0/animate/opacity',value:motion}]});
 assert.deepEqual(patched.layers[1].children[0].animate.opacity,motion);
 assert.deepEqual(patched.layers[0],data.layers[0]);assert.deepEqual(patched.camera,data.camera);
 assert.equal(data.layers[1].children[0].animate,undefined);
 for(const path of ['/layers/10/x','/layers/0/attrs/width','/layers/1/__proto__/polluted','/layers/1/children/0/constructor/prototype/polluted'])assert.throws(()=>applyRepairs(data,[{path:'/layers/1'}],{repairs:[{path,value:1}]}));
});


test('invalid repair paths recover through a complete validated scene',async()=>{
 const broken=structuredClone(good);broken.layers[1].x='invalid';
 let calls=0;
 const result=await planShot({text:'test',seconds:3},async prompt=>{
  calls++;
  if(calls<=2)return {repairs:[{path:'/layers/0/attrs/width',value:1}]};
  assert.match(prompt,/Rebuild this scene from the approved contract/);
  return good;
 },{initial:broken});
 assert.equal(calls,3);assert.deepEqual(result.layers[0],good.layers[0]);
});

test('full regeneration still rejects unsafe data and has a bounded request budget',async()=>{
 let calls=0;
 await assert.rejects(planShot({text:'test',seconds:3},async()=>{
  calls++;return {...good,layers:[{id:'bad',type:'image',attrs:{href:'https://example.org'}}]};
 }),e=>e.retryExhausted===true);
 assert.equal(calls,6);
});

test('a requested stop is not converted into another generation attempt',async()=>{
 let stopped=false,calls=0;
 await assert.rejects(planShot({text:'test',seconds:3},async()=>{
  calls++;stopped=true;return good;
 },{assertRunning:()=>{if(stopped)throw Object.assign(new Error('Đã dừng'),{retryExhausted:true});}}),/Đã dừng/);
 assert.equal(calls,1);
});

test('array removals preserve original repair indices and serialize without holes',()=>{
 const data={layers:[{id:'a'},{id:'b'},{id:'c'},{id:'d'}]};
 const result=applyRepairs(data,[{path:'/layers'}],{repairs:[{path:'/layers/0',remove:true},{path:'/layers/2',remove:true},{path:'/layers/3/id',value:'kept'}]});
 assert.deepEqual(JSON.parse(JSON.stringify(result)),{layers:[{id:'b'},{id:'kept'}]});
 assert.equal(data.layers.length,4);
});

test('cached deleted layers recover but invalid geometry is still rejected',()=>{
 const {restoreShot}=require('./remotionCache.cjs');
 const data=structuredClone(good);data.layers.push({id:'group',type:'g',children:[null,{id:'child',type:'rect',attrs:{width:10,height:10}},null]});
 const result=restoreShot(data);
 assert.equal(result.layers[2].children.length,1);
 assert.equal(data.layers[2].children.length,3);
 assert.throws(()=>restoreShot({...good,layers:[{id:'bad',type:'image'}]}));
});
