const {sceneList}=require('./fixtures/sceneList.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { shotPrompt, planStory } = require('./remotionPlanner.cjs');
const { directScene } = require('./remotionDirection.cjs');
const { compactContext } = require('./remotionPrompts.cjs');
const shot = { startWord:0, role:'context', framing:'wide', focalSubject:'Leo', visualMeaning:'arrival', action:'walk', incomingState:'outside', outgoingState:'inside', events:[{word:0,action:'walk'}] };
function check(prompt, max) {
  assert.ok(prompt.length < max, `Prompt length ${prompt.length} exceeds ${max}`);
  assert.doesNotMatch(prompt, /\/Users\/|D:\/Tool|\.md\b|\]\([^)]*\)|attached style guide/i);
  assert.match(prompt, /JSON/);
}
test('story and shot prompts are self-contained and short', async () => {
  await planStory('one two three', 'test', 'balanced', async prompt => { if(prompt.startsWith('REVIEW VISUAL STORY'))return {passed:true,issues:[]};check(prompt,4500); assert.match(prompt,/2D Animation Director/); return sceneList(); });
  const prompt = shotPrompt({text:'one two three',seconds:3});
  check(prompt,4000);
  for (const required of ['STICKMAN_500IQ_V1','1920x1080','key','attachment','focusX','NARRATION']) assert.ok(prompt.includes(required));
});
test('repair prompts exclude review histories and do not accumulate earlier reviews', async () => {
  let designs = 0;
  await directScene({text:'one two three', previous:JSON.stringify({ state:'inside', shot:{direction:'arrive', layers:[],review_history:['HISTORY_SENTINEL']} })}, async prompt => {
    check(prompt,5000);
    assert.doesNotMatch(prompt,/HISTORY_SENTINEL/);
    if (prompt.startsWith('Review this')) return designs < 3 ? {passed:false,issues:['Keep face visible'],shotIssues:[{shotIndex:0,issue:'Keep face visible'}]} : {passed:true,issues:[]};
    designs++;
    return {shots:[shot],review_history:['HISTORY_SENTINEL']};
  });
  assert.equal(designs,3);
});
test('continuity sends final poses instead of complete keyframe trajectories', () => {
  const context = compactContext({previous:JSON.stringify({state:'holding phone',shot:{layers:[{id:'leo',type:'character',x:{keys:[{at:0,value:100},{at:1,value:500}]}}]}})});
  assert.equal(context.previous.layers[0].x,500);
  assert.equal(context.previous.state,'holding phone');
});
test('45 second audio lets the director choose scene count by story turns', async () => {
  const parts=Array.from({length:8},(_,i)=>`word${i} next`);
  const scenes=await planStory(parts.join(' '),'test','dense',async prompt=>{
    if(prompt.startsWith('REVIEW VISUAL STORY'))return {passed:true,issues:[]};
    assert.match(prompt,/Choose 8–22 scenes by story turns/);assert.doesNotMatch(prompt,/5–9 seconds|pacing:dense/);
    return sceneList(parts,45.33/8);
  },{seconds:45.33});
  assert.equal(scenes.length,8);assert.equal(scenes.sceneList.metadata.fps,30);
});
