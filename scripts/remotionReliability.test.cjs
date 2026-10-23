const test = require('node:test');
const assert = require('node:assert/strict');
const { retryPart, spreadTiming, publicGenerationError } = require('./remotionReliability.cjs');
const { directScene } = require('./remotionDirection.cjs');
test('retries only the failed operation and stops at its retry budget', async () => {
  let calls = 0;
  assert.equal(await retryPart(async () => { if (++calls < 3) throw new Error('bad JSON'); return 'ok'; }), 'ok');
  assert.equal(calls, 3);
  calls = 0;
  await assert.rejects(retryPart(async () => { calls++; throw new Error('failed'); }, { attempts: 2 }), /failed/);
  assert.equal(calls, 2);
});
test('missing and overlapping speech boundaries spread across the full audio without flashes', () => {
  for (const candidates of [[], [0,0,0], [0,500,-10], [0,NaN,undefined]]) {
    const starts = spreadTiming([3,3,3], 180, candidates, 30);
    const ends = [...starts.slice(1),180];
    assert.equal(starts[0], 0);
    assert.equal(ends.reduce((n,end,i)=>n+end-starts[i],0),180);
    ends.forEach((end,i)=>assert.ok(end-starts[i]>=30));
  }
});
test('technical details and long review lists never appear in public errors', () => {
  for (const message of ['["Hook is weak", "secret/path details"]', 'Traceback /private/path token=abc', 'Storyboard failed validation']) {
    const result = publicGenerationError(new Error(message));
    assert.ok(result.length < 180);
    assert.doesNotMatch(result, /secret|private|token|Traceback|Hook/);
  }
});
test('approved shot stays unchanged when AI returns unrelated edits during repair', async () => {
  const shot = { startWord:0, endWord:3, role:'context', framing:'wide', focalSubject:'Leo', visualMeaning:'arrival', action:'walk and stop', incomingState:'outside', outgoingState:'inside', events:[{word:0,action:'walk'}] };
  const second = {...shot,startWord:3,endWord:6,events:[{word:3,action:'stop'}]};
  let designs = 0;
  const result = await directScene({text:'one two three four five six'}, async prompt => {
    if (prompt.startsWith('Review this')) return designs === 1 ? {passed:false,issues:['Fix second shot'],shotIssues:[{shotIndex:1,issue:'Fix second shot'}]} : {passed:true,issues:[]};
    designs++;
    return {shots:[designs===1 ? shot : {...shot,focalSubject:'unwanted replacement'},second]};
  });
  assert.equal(result.shots[0].focalSubject,'Leo');
});
