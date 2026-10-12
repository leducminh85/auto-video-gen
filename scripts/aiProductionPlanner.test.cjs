const { test } = require('node:test');
const assert = require('node:assert/strict');
const { planStoryboard, planSceneImages, validateRanges, validateBeatPlan, validateReview, sourceWords, narrationSource } = require('./aiProductionPlanner.cjs');

const visual = (startWord, endWord, action = 'A bird carries a twig toward its nest.') => ({
  startWord, endWord, what_to_show: action, how_to_show: 'Close framing on the beak holding the twig.',
  subject: 'Small bird', action, environment: 'Tree branch', objects: ['twig'], shotType: 'close-up', visualMethod: 'character_action',
  keyText: '', continuity: 'Same brown bird and branch.', transitionIntent: 'Show the next narrated action.',
  mustNotInclude: ['invented quantities'], imagePrompt: `Watercolor. ${action} A broken twig tip is visible.`,
});
const review = (count, evidence = []) => ({ passed: true, issues: [], items: Array.from({ length: count }, (_, i) => ({ index: i + 1, faithful: true, coherent: true, distinct: true, drawable: true, evidence: evidence[i] || 'A bird flies.', reason: 'The bird action corresponds to the source narration.' })) });
const response = data => ({ data, provider: 'fixture', model: 'fixture-model' });

test('word ranges reject omissions, overlaps, reorderings, empty and non-integer boundaries', () => {
  for (const ranges of [[], [{ startWord: 1, endWord: 4 }], [{ startWord: 0, endWord: 3 }], [{ startWord: 0, endWord: 5 }], [{ startWord: 0, endWord: 2 }, { startWord: 1, endWord: 4 }], [{ startWord: 0, endWord: 2.5 }, { startWord: 2.5, endWord: 4 }]]) assert.throws(() => validateRanges(ranges, 4));
  validateRanges([{ startWord: 0, endWord: 2 }, { startWord: 2, endWord: 4 }], 4);
});

test('storyboard receives the complete long script and repairs invalid cuts without rewriting or dropping the ending', async () => {
  const content = 'Một con chim mang cành về tổ. '.repeat(600) + 'Kết thúc riêng biệt.';
  const count = sourceWords(content).words.length;
  let calls = 0;
  const result = await planStoryboard({ content, title: 'Birds', request: async ({ prompt, schema }) => {
    assert.ok(prompt.includes('Kết thúc riêng biệt.'));
    if (schema.properties.items) return response(review(2, ['Một con chim mang cành về tổ.', 'Một con chim mang cành về tổ.']));
    calls++;
    if (calls > 1) assert.match(prompt, /Phân đoạn/);
    return response({ continuity: 'One bird builds its nest.', scenes: [{ startWord: 0, title: 'Nest', intent: 'Bird carries branches' }, { startWord: calls === 1 ? count : 2800, title: 'End', intent: 'Bird settles into the nest' }] });
  } });
  assert.equal(result.quality.attempts, 2);
  assert.equal(result.scenes.map(s => s.text).join(' ').replace(/\s+/g, ' '), content.trim());
  assert.equal(result.quality.model, 'fixture-model');
});

test('manual scene constraints are retained, while unpinned scene count belongs to AI', async () => {
  const scenesInput = [{ text: 'A bird flies.' }, { text: 'It lands.' }];
  const request = async ({ schema }) => response(schema.properties.items ? review(1) : { continuity: 'Bird', scenes: [{ startWord: 0, endWord: 5, title: 'Bird', intent: 'Flight then landing' }] });
  assert.equal((await planStoryboard({ scenesInput, request })).scenes.length, 1);
  await assert.rejects(planStoryboard({ scenesInput, lockedScenes: true, request }), /mốc cảnh/);
});

test('AI chooses image boundaries and complete prompts with full context, style and prior images', async () => {
  const scene = { id: 2, title: 'Nest', text: 'A bird carries a twig. It builds a nest.' };
  const fullScript = 'Earlier context. '.repeat(1000) + scene.text + ' Later conclusion.';
  const prior = { what_to_show: 'A solitary egg rests inside a hollow trunk.' };
  const result = await planSceneImages({ scene, storyboard: { fullScript, scenes: [scene], continuity: 'Brown bird' }, durationInSeconds: 8, totalFrames: 240,
    imageDensity: 'balanced', imageStylePrompt: 'Watercolor', recentPlans: [prior], request: async ({ prompt, schema }) => {
      assert.ok(prompt.includes(fullScript)); assert.match(prompt, /Later conclusion/); assert.match(prompt, /hollow trunk/); assert.match(prompt, /Watercolor/);
      return response(schema.properties.items ? review(2, ['A bird carries a twig.', 'It builds a nest.']) : { beats: [visual(0, 5), visual(5, 9, 'The bird weaves twigs into a round nest.')] });
    } });
  assert.deepEqual(result.beats.map(b => b.text), ['A bird carries a twig.', 'It builds a nest.']);
  assert.equal(result.beats.reduce((n, b) => n + b.duration_in_frames, 0), 240);
  assert.ok(result.beats.every(b => b.plan.planningSource === 'ai'));
  assert.match(result.beats[0].plan.imageGenerationPrompt, /broken twig tip/);
  assert.ok(result.beats[0].plan.imageGenerationPrompt.startsWith('Watercolor'));
});

test('semantic rejection is returned to AI for repair and repeated failure stops generation', async () => {
  let requests = 0;
  await assert.rejects(planStoryboard({ content: 'A bird flies.', request: async ({ schema, prompt }) => {
    requests++;
    if (schema.properties.items) return response({ ...review(1), passed: false, issues: ['Invented outcome: the bird wins a trophy.'] });
    if (requests > 1) assert.match(prompt, /Invented outcome/);
    return response({ continuity: 'Bird', scenes: [{ startWord: 0, endWord: 3, title: 'Bird', intent: 'Wins a trophy' }] });
  } }), /chưa đạt sau 3 lần/);
  assert.equal(requests, 6);
});

test('incomplete or contradictory review cannot pass', () => {
  assert.throws(() => validateReview(review(1), 2));
  assert.throws(() => validateReview({ ...review(1), issues: ['bad'] }, 1));
  const data = review(2); data.items[1].index = 1;
  assert.throws(() => validateReview(data, 2));
  const rejected = review(1); rejected.items[0].faithful = false;
  assert.throws(() => validateReview(rejected, 1));
  assert.throws(() => validateReview(review(1), 1, ['The baker folds butter into dough.']), /bằng chứng/);
});

test('malformed Studio JSON receives repair feedback, but login failures stop immediately', async () => {
  let calls = 0;
  const result = await planStoryboard({ content: 'A bird flies.', request: async ({ schema, prompt }) => {
    calls++;
    if (calls === 1) throw Object.assign(new Error('JSON không đúng schema'), { code: 'AI_INVALID_RESPONSE' });
    if (schema.properties.items) return response(review(1));
    assert.match(prompt, /JSON không đúng schema/);
    return response({ continuity: 'Bird', scenes: [{ startWord: 0, title: 'Bird', intent: 'A bird flies.' }] });
  } });
  assert.equal(result.quality.attempts, 2);
  calls = 0;
  await assert.rejects(planStoryboard({ content: 'A bird flies.', request: async () => { calls++; throw new Error('Đăng nhập Google AI Studio'); } }), /Đăng nhập/);
  assert.equal(calls, 1);
});

test('structural quality rejects unsupported visuals but accepts flexible image durations', () => {
  const source = sourceWords('A bird carries a twig. It builds a nest.');
  assert.throws(() => validateBeatPlan({ beats: [visual(0, 5), visual(5, 9)] }, source, 8, []), /lặp/);
  assert.doesNotThrow(() => validateBeatPlan({ beats: [visual(0, 2), visual(2, 9, 'The bird builds a nest.')] }, source, 3, []));
  assert.doesNotThrow(() => validateBeatPlan({ beats: [visual(0, 9)] }, source, 20, []));
  assert.throws(() => validateBeatPlan({ beats: [{ ...visual(0, 9), imagePrompt: '' }] }, source, 5, []), /imagePrompt/);
  assert.throws(() => validateBeatPlan({ beats: [visual(0, 9, 'A floating lightbulb icon conveys insight.')] }, source, 5, []), /biểu tượng/);
  assert.throws(() => validateBeatPlan({ beats: [visual(0, 9, 'A player holds a small trophy cup aloft.')] }, source, 5, []), /cúp hoặc giải thưởng/);
  assert.throws(() => validateBeatPlan({ beats: [visual(0, 9, 'A stick figure with a cap waiting nearby.')] }, source, 5, []), /suy diễn/);
  assert.doesNotThrow(() => validateBeatPlan({ beats: [{ ...visual(0, 9), imagePrompt: 'A bird carries a twig. No trophy or prizes.' }] }, source, 5, []));
  assert.throws(() => validateBeatPlan({ beats: [visual(0, 9, 'A queue of customers waiting at the cafe.')] }, source, 5, []), /suy diễn/);
  assert.throws(() => validateBeatPlan({ beats: [visual(0, 9, 'A stacked bar chart of revenue.')] }, source, 5, []), /số liệu/);
  assert.throws(() => validateBeatPlan({ beats: [{ ...visual(0, 9), imagePrompt: 'A bar chart of revenue.' }] }, source, 5, []), /số liệu/);
  assert.doesNotThrow(() => validateBeatPlan({ beats: [visual(0, 9)] }, source, 8, [], 7));
  assert.throws(() => validateBeatPlan({ beats: [visual(0, 9)] }, source, 8, [], 7, [NaN]), /không hợp lệ/);
  const sentence = sourceWords('Một bộ PC gaming tốt có thể khá đắt, chưa kể màn hình.');
  assert.throws(() => validateBeatPlan({ beats: [visual(0, 8), visual(8, sentence.words.length, 'A separate action')] }, sentence, 8, []), /đứt cụm ý/);
});

test('JSON narration excludes metadata and preserves Vietnamese punctuation', () => {
  assert.equal(narrationSource(JSON.stringify({ scenes: [{ title: 'Do not speak', narration: 'Chim bay, rồi đậu.' }] })), 'Chim bay, rồi đậu.');
  assert.equal(sourceWords('Chim  bay,\nrồi đậu.').textFor(1, 4), 'bay,\nrồi đậu.');
});

test('a no-text style cannot be contradicted by an image label', async () => {
  const scene = { id: 1, title: 'Bird', text: 'A bird flies.' };
  await assert.rejects(planSceneImages({ scene, storyboard: { fullScript: scene.text, scenes: [scene], continuity: 'Bird' }, durationInSeconds: 4, totalFrames: 120, imageStylePrompt: 'No on-screen text.', request: async () => response({ beats: [{ ...visual(0, 3), keyText: 'BIRD' }] }) }), /keyText phải để trống/);
});


test('queue guard distinguishes exclusions from actual crowds in each visual field', () => {
  const source = sourceWords('A customer uses a computer.');
  for (const phrase of [
    'No visible queues.', 'Without any queues of people.', 'Avoid depicting a queue of customers.',
    'Do not show a line of people waiting.', 'No crowds or queues.', 'Queues are absent.',
    'Không có hàng người chờ.', 'A render queue is visible on the computer screen.',
    'No waiting lines or queues.', 'Without any waiting lines and queues.',
    'Avoid showing long waiting lines or queues.', 'No queues or lines of people waiting.',
  ]) {
    const beat = { ...visual(0, source.words.length), imagePrompt: `A customer uses a computer. ${phrase}` };
    assert.doesNotThrow(() => validateBeatPlan({ beats: [beat] }, source, 4, []), phrase);
  }
  for (const field of ['what_to_show', 'how_to_show', 'subject', 'action', 'environment', 'imagePrompt']) {
    for (const phrase of ['No text. A queue of customers waits outside.', 'No queues, but a line of customers is waiting.', 'Customers are queueing outside.', 'Hàng người chờ bên ngoài.', 'No waiting lines or queues. A queue of customers waits outside.', 'No waiting lines, but a queue of customers waits.', 'No waiting lines and a customer joins the queue.']) {
      const beat = { ...visual(0, source.words.length), [field]: phrase };
      assert.throws(() => validateBeatPlan({ beats: [beat] }, source, 4, []), new RegExp(`Ảnh 1.${field}`));
    }
  }
  const noQueue = sourceWords('There are no queues.');
  assert.throws(() => validateBeatPlan({ beats: [visual(0, noQueue.words.length, 'A queue of customers waits.')] }, noQueue, 4, []), /suy diễn/);
  const actualQueue = sourceWords('Customers are waiting in a queue.');
  assert.doesNotThrow(() => validateBeatPlan({ beats: [visual(0, actualQueue.words.length, 'Customers are waiting in a queue.')] }, actualQueue, 4, []));
});

test('AI repair receives the offending field and narration, and an exclusion can pass review', async () => {
  const scene = { id: 4, title: 'Computer', text: 'A customer uses a computer.' };
  let calls = 0;
  const result = await planSceneImages({ scene, storyboard: { fullScript: scene.text, scenes: [scene], continuity: 'Same computer' }, durationInSeconds: 4, totalFrames: 120, imageStylePrompt: 'Watercolor', request: async ({ prompt, schema }) => {
    if (schema.properties.items) return response(review(1, [scene.text]));
    calls++;
    if (calls > 1) { assert.match(prompt, /Ảnh 1.imagePrompt/); assert.match(prompt, /Lời thoại của ảnh/); }
    return response({ beats: [{ ...visual(0, 5, 'A customer uses a computer.'), imagePrompt: calls === 1 ? 'A queue of customers waits outside.' : 'A customer uses a computer. No visible queues.', mustNotInclude: ['queues of waiting customers'] }] });
  } });
  assert.equal(result.quality.attempts, 2);
  assert.equal(result.quality.passed, true);
});

test('reported scene 4 prompt with no waiting lines or queues reaches AI review without repair', async () => {
  const scene = { id: 4, title: 'Dùng chung máy tính', text: 'phục vụ rất nhiều khách hàng khác nhau trong cùng một ngày.' };
  const imagePrompt = 'A clean 2D explainer doodle illustration in a hand-drawn whiteboard-cartoon style, horizontal 16:9 composition. A side-by-side split visual showing the exact same cyber café workstation serving two different users on the same day: on the left, a stick figure in a simple collared shirt types attentively at the keyboard; on the right, another stick figure wearing headphones smiles while playing an active game at the identical desk and screen. Smooth black outlines, soft flat color palette, uncluttered composition, no waiting lines or queues, no text, letters, or numbers.';
  let plans = 0, reviews = 0;
  const result = await planSceneImages({ scene, storyboard: { fullScript: scene.text, scenes: [scene], continuity: 'Same workstation.' }, durationInSeconds: 4, totalFrames: 120, imageStylePrompt: 'Whiteboard cartoon, no text.', request: async ({ schema }) => {
    if (schema.properties.items) { reviews++; return response(review(1, [scene.text])); }
    plans++;
    return response({ beats: [{ ...visual(0, sourceWords(scene.text).words.length, 'The same workstation serves two different users at different times.'), imagePrompt }] });
  } });
  assert.equal(plans, 1);
  assert.equal(reviews, 1);
  assert.equal(result.beats[0].plan.imagePrompt, imagePrompt);
  assert.equal(result.quality.passed, true);
});

test('dense pacing uses measured audio rather than rejecting a 5.3 second word-count estimate', async () => {
  const text = 'A bird carries a twig toward home. It lands.';
  const scene = { id: 4, title: 'Bird', text };
  const result = await planSceneImages({ scene, storyboard: { fullScript: text, scenes: [scene] }, durationInSeconds: 6.8333333333, totalFrames: 205, imageDensity: 'dense', imageStylePrompt: 'Watercolor',
    wordTiming: [0, .1, .2, .3, .4, .5, .6, 4, 4.1],
    timeBeats: async () => [{ start_frame_offset: 0, duration_in_frames: 120, duration_in_seconds: 4 }, { start_frame_offset: 120, duration_in_frames: 85, duration_in_seconds: 85 / 30 }],
    request: async ({ schema, prompt }) => {
      assert.match(prompt, /suggestions, not acceptance limits/);
      assert.match(prompt, /speech_timestamps/);
      if (schema.properties.boundaries) return response({ boundaries: [{ startWord: 0, reason: 'Flight' }, { startWord: 7, reason: 'Landing' }] });
      return response(schema.properties.items ? review(2, ['A bird carries a twig toward home.', 'It lands.']) : { beats: [visual(0, 7), visual(7, 9, 'The bird lands on a branch.')] });
    },
  });
  assert.deepEqual(result.beats.map(b => b.duration_in_frames), [120, 85]);
});

test('long and short images do not trigger AI pacing repairs and still cover all audio', async () => {
  for (const frames of [[159, 81], [135, 143], [15, 225]]) {
    const scene = { id: 2, title: 'Bird', text: 'A bird flies. It lands.' };
    let boundaries = 0;
    const totalFrames = frames[0] + frames[1];
    const result = await planSceneImages({ scene, storyboard: { fullScript: scene.text, scenes: [scene] },
      durationInSeconds: totalFrames / 30, totalFrames, imageDensity: 'dense', imageStylePrompt: 'Watercolor',
      timeBeats: async () => frames.map((duration, i) => ({ start_frame_offset: i ? frames[0] : 0, duration_in_frames: duration, duration_in_seconds: duration / 30 })),
      request: async ({ schema, prompt }) => {
        if (schema.properties.boundaries) {
          boundaries++;
          return response({ boundaries: [0, 3].map(startWord => ({ startWord, reason: 'Next action' })) });
        }
        if (schema.properties.items) {
          assert.match(prompt, /Never reject an image because it is longer or shorter/);
          return response(review(2, ['A bird flies.', 'It lands.']));
        }
        return response({ beats: [visual(0, 3), visual(3, 5, 'The bird lands on a branch.')] });
      },
    });
    assert.equal(boundaries, 1);
    assert.deepEqual(result.beats.map(b => b.duration_in_frames), frames);
    assert.equal(result.beats.map(b => b.text).join(' '), scene.text);
    assert.equal(result.beats.reduce((sum, b) => sum + b.duration_in_frames, 0), totalFrames);
  }
});

test('image writing cannot change AI boundaries already verified against audio', async () => {
  const scene = { id: 1, title: 'Bird', text: 'A bird flies. It lands.' };
  let plans = 0, alignments = 0;
  const result = await planSceneImages({ scene, storyboard: { fullScript: scene.text, scenes: [scene] }, durationInSeconds: 6, totalFrames: 180, imageDensity: 'dense', imageStylePrompt: 'Watercolor',
    timeBeats: async () => {
      alignments++;
      return [0, 90].map(start => ({ start_frame_offset: start, duration_in_frames: 90, duration_in_seconds: 3 }));
    },
    request: async ({ schema, prompt }) => {
      if (schema.properties.boundaries) return response({ boundaries: [{ startWord: 0, reason: 'Flight' }, { startWord: 3, reason: 'Landing' }] });
      if (schema.properties.items) return response(review(2, ['A bird flies.', 'It lands.']));
      plans++;
      if (plans > 1) assert.match(prompt, /Giữ chính xác startWord/);
      return response({ beats: plans === 1 ? [visual(0, 5)] : [visual(0, 3), visual(3, 5, 'The bird lands on a branch.')] });
    },
  });
  assert.equal(alignments, 1);
  assert.equal(plans, 2);
  assert.deepEqual(result.beats.map(b => b.duration_in_frames), [90, 90]);
  assert.equal(result.quality.boundaries.model, 'fixture-model');
  let calls = 0;
  await assert.rejects(planSceneImages({ scene, storyboard: { fullScript: scene.text, scenes: [scene] }, durationInSeconds: 6, totalFrames: 180, imageStylePrompt: 'Watercolor', timeBeats: async () => [], request: async () => { calls++; throw new Error('Login required'); } }), /Login required/);
  assert.equal(calls, 1);
});
