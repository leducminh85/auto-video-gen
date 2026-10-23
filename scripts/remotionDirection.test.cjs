const test = require('node:test');
const assert = require('node:assert/strict');
const { directScene, validateBoard, normalizeBoard, timedBoard } = require('./remotionDirection.cjs');
const shot = { startWord: 0, endWord: 3, role: 'mechanism', framing: 'close', focalSubject: 'phone', visualMeaning: 'contact activates signal', action: 'reach, touch, signal, hold', incomingState: 'signal off', outgoingState: 'signal on', events: [{ word: 1, action: 'touch' }] };
test('server derives contiguous ranges despite missing or incorrect AI end indices', () => {
  const board = { shots: [{ ...shot, endWord: 1 }, { ...shot, startWord: 3, endWord: 99, events: [{ word: 4, action: 'react' }] }] };
  const result = validateBoard(normalizeBoard(board, 6), 6);
  assert.deepEqual(result.shots.map(s => [s.startWord,s.endWord]), [[0,3],[3,6]]);
  assert.equal(board.shots[0].endWord, 1);
  const missing = { shots: [{ ...shot, endWord: undefined }] };
  assert.equal(validateBoard(normalizeBoard(missing, 3), 3).shots[0].endWord, 3);
  for (const starts of [[1],[0,0],[0,4,3],[0,6]]) { const fixed = normalizeBoard({shots:starts.map(startWord=>({...shot,startWord}))}, 6); assert.equal(fixed.shots[0].startWord, 0); assert.equal(fixed.shots.at(-1).endWord, 6); }
});
test('rejects missing coverage, decorative roles and events outside narration', () => {
  for (const change of [{ startWord: 1 }, { endWord: 2 }, { role: 'decoration' }, { focalSubject: '' }, { events: [{ word: 3, action: 'touch' }] }]) {
    assert.throws(() => validateBoard({ shots: [{ ...shot, ...change }] }, 3));
  }
});
test('requires explicit editorial approval and repairs the rejected storyboard', async () => {
  let calls = 0;
  const result = await directScene({ text: 'one two three' }, async () => {
    calls++;
    if (calls % 2) return { shots: [shot] };
    return calls === 2 ? { passed: false, issues: ['contact is hidden'] } : { passed: true, issues: [] };
  });
  assert.equal(calls, 4);
  assert.equal(result.review.passed, true);
});
test('audio boundaries determine exact shot durations and reject overlaps', () => {
  const board = { shots: [shot, { ...shot, startWord: 3, endWord: 6 }] };
  const timed = timedBoard(board, [{ start: .2 }, { start: 1.75 }], 240);
  assert.deepEqual(timed.map(s => s.duration_in_frames), [105, 135]);
  assert.equal(timed.reduce((n,s)=>n+s.duration_in_frames, 0), 240);
  assert.equal(timedBoard(board, [{ start: 0 }, { start: 0 }], 240).reduce((n,s)=>n+s.duration_in_frames,0), 240);
  assert.equal(timedBoard(board, [{ start: 0 }], 240).reduce((n,s)=>n+s.duration_in_frames,0), 240);
});
test('editorial findings drive repeated repairs and a rebuild instead of escaping as raw errors', async () => {
  let designs = 0;
  const saved = [];
  const result = await directScene({ text: 'one two three', firstScene: false }, async prompt => {
    if (prompt.startsWith('Review this')) {
      assert.match(prompt, /NOT the opening scene/);
      return designs < 5 ? { passed: false, issues: ['Replace decorative reaction with causal result'] } : { passed: true, issues: [] };
    }
    designs++;
    if (designs > 1) assert.match(prompt, /Replace decorative reaction/);
    if (designs === 5) assert.match(prompt, /Keep acceptable shots/);
    return { shots: [shot] };
  }, { onAttempt: entry => saved.push(entry) });
  assert.equal(designs, 5);
  assert.equal(saved.length, 5);
  assert.equal(result.revision_count, 4);
});
test('exhausted repairs preserve all findings and never approve a rejected board', async () => {
  const saved = [];
  await assert.rejects(directScene({ text: 'one two three' }, async prompt => prompt.startsWith('Review this') ? { passed: false, issues: ['Contact is hidden'] } : { shots: [shot] }, { maxAttempts: 2, onAttempt: entry => saved.push(entry) }), error => {
    assert.equal(error.code, 'STORYBOARD_REPAIR_EXHAUSTED');
    assert.equal(error.reviewHistory.length, 2);
    assert.doesNotMatch(error.message, /^\[/);
    return true;
  });
  assert.equal(saved.length, 2);
});
test('provider failures are not misreported as editorial defects', async () => {
  let calls = 0;
  await assert.rejects(directScene({ text: 'one two three' }, async () => { calls++; throw new Error('login expired'); }), /login expired/);
  assert.equal(calls, 4);
});
