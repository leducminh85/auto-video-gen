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
  await planStory('one two three', 'test', 'balanced', async prompt => { check(prompt,2000); return { scenes:[{startWord:0,endWord:3}] }; });
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
test('45 second audio limits story to eight continuous scenes even with dense images', async () => {
  const text = Array.from({length:90},(_,i)=>`word${i}`).join(' ');
  await assert.rejects(planStory(text,'test','dense',async prompt => {
    assert.match(prompt,/at most 8 scenes/);
    assert.doesNotMatch(prompt,/pacing:dense/);
    return {scenes:Array.from({length:9},(_,i)=>({startWord:i*10,endWord:(i+1)*10}))};
  },{seconds:45.33}), /Too many scenes/);
});
