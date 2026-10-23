const test = require('node:test');
const assert = require('node:assert/strict');
const {validateShot} = require('./remotionSchema.cjs');
const {shot} = require('./fixtures/remotionProject.cjs');
const {planSequence} = require('./remotionPlanner.cjs');
test('multi-step animation and attached props survive validation and reject unsafe attributes',()=>{
 const input={...shot,layers:[{id:'actor',type:'character',rightHandX:{keys:[{at:0,value:100},{at:.3,value:160},{at:.6,value:160,ease:'hold'},{at:1,value:100}]},speech:{keys:[{at:0,value:0,ease:'hold'},{at:.5,value:1}]},children:[{id:'cup',type:'mug',attachment:'rightHand'}]}]};
 const saved=validateShot(input); assert.equal(saved.layers[0].children[0].attachment,'rightHand');assert.equal(saved.layers[0].rightHandX.keys.length,4);
 assert.deepEqual(validateShot({...shot,camera:{focusX:726,focusY:700,scale:2.5}}).camera,{focusX:726,focusY:700,scale:2.5});
 for(const keys of [[{at:.5,value:0},{at:.2,value:1}],[{at:0,value:0,ease:'eval'},{at:1,value:1}]]) assert.throws(()=>validateShot({...shot,camera:{x:{keys}}}));
 assert.throws(()=>validateShot({...shot,layers:[{id:'bad',type:'rect',animate:{onLoad:1}}]}));
});
test('a sequence receives the entire story and returns one continuous animated shot',async()=>{
 const result=await planSequence({text:'repair',seconds:8,bible:{cast:[{id:'leo'}]},outline:[{title:'consequence'}]},async prompt=>{
 assert.match(prompt,/STORY BIBLE/);assert.match(prompt,/consequence/);assert.match(prompt,/keyframes/);
 return shot;
 });assert.equal(result.length,1);assert.equal(result[0].shot.direction,shot.direction);assert.equal(result[0].shot.layers.length,shot.layers.length);
});
