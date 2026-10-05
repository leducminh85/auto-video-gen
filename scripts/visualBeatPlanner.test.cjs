const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLocalBeatPlan, extractDomainAnchor, planVisualBeatsWithAI, generateSemanticSvgForBeat } = require('./visualBeatPlanner.cjs');
const { repeatedSubject } = require('./visualDirection.cjs');

test('generic video title does not replace the script domain in later scenes', () => {
  const domain = extractDomainAnchor('Kịch bản video', '', 'Running a dental clinic. The demand is stable.');
  const plan = createLocalBeatPlan({ beatText: 'The demand is stable.', sceneText: 'The demand is stable.', overallTopic: domain.topic });
  assert.match(plan.imageGenerationPrompt, /dental/);
  assert.doesNotMatch(plan.imageGenerationPrompt, /Kịch bản video/);
});

test('successive ideas use distinct actions and shots while preserving style', () => {
  const texts = [
    'If we talk about running a dental clinic,',
    'Dental care is needed throughout their lives.',
    'The demand is quite stable.',
    'People need regular checkups.',
    'A clinic provides checkups and cleaning.',
    'Fillings, tooth extraction, orthodontic treatment and cosmetic dentistry.',
    'The business does not depend on only one source of income.',
    'Another advantage is customer loyalty.',
    'Patients trust the dentist and come back.',
    'They bring family members or recommend the clinic to friends.',
  ];
  const history = [];
  for (const beatText of texts) {
    const plan = createLocalBeatPlan({ beatText, overallTopic: 'dental clinic business', recentPlans: history });
    assert.notEqual(plan.shotType, history.at(-1)?.shotType);
    assert.equal(repeatedSubject(plan, history), false);
    assert.match(plan.imageGenerationPrompt, /ONLY ONE subtle amber orange/);
    assert.ok(plan.imageGenerationPrompt.includes(beatText));
    assert.equal(plan.keyText, '');
    history.push(plan);
  }
  assert.ok(history[5].what_to_show.includes(texts[5]));
  assert.ok(history[6].what_to_show.includes(texts[6]));
  assert.ok(history[9].what_to_show.includes(texts[9]));
  assert.ok(new Set(history.map(p => p.shotType)).size >= 4);
});

test('Vietnamese narration and unfamiliar topics retain source meaning', () => {
  const plan = createLocalBeatPlan({ beatText: 'Doanh thu tăng 20%.', overallTopic: 'coffee shop business' });
  assert.equal(plan.keyText, '20%');
  assert.ok(plan.imageGenerationPrompt.includes('Doanh thu tăng 20%.'));
  assert.doesNotMatch(plan.imageGenerationPrompt, /dental/);
  const unknown = createLocalBeatPlan({ beatText: 'A satellite measures rainfall.', overallTopic: 'satellite observations' });
  assert.ok(unknown.imageGenerationPrompt.includes('A satellite measures rainfall.'));
  assert.doesNotMatch(unknown.imageGenerationPrompt, /dental|trophy|lightbulb/);
});

test('AI planning receives cross-scene history and rebuilds prompts with a shared style', async () => {
  const originalFetch = global.fetch;
  let request;
  global.fetch = async (_url, options) => {
    request = JSON.parse(options.body);
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify([
      { meaning: 'AI summary', what_to_show: 'A patient hands an appointment card to a receptionist.', how_to_show: 'Focus on the handoff.', objects: ['appointment card'], shotType: 'medium', visualMethod: 'character_action', imageGenerationPrompt: 'A photorealistic purple clinic' },
    ]) }] } }] }) };
  };
  try {
    const result = await planVisualBeatsWithAI({ scene: { title: 'Loyalty', text: 'Patients return.' }, beats: [{ text: 'Patients return.', duration_in_seconds: 5 }], geminiApiKey: 'test', overallTopic: 'dental clinic', fullScriptContext: 'x'.repeat(500) + 'late context', recentPlans: [{ what_to_show: 'A calendar of recurring visits.', shotType: 'wide' }] });
    const sent = request.contents[0].parts[0].text;
    assert.match(sent, /calendar of recurring visits/);
    assert.match(sent, /late context/);
    assert.equal(result[0].planningSource, 'ai');
    assert.match(result[0].imageGenerationPrompt, /Focus on the handoff/);
    assert.match(result[0].imageGenerationPrompt, /amber orange/);
    assert.doesNotMatch(result[0].imageGenerationPrompt, /photorealistic purple/);
    assert.equal(result[0].meaning, 'Patients return.');
  } finally { global.fetch = originalFetch; }
});

test('changing only method or color does not conceal repeated visual content', () => {
  const previous = { what_to_show: 'A dentist stands beside a treatment chair and points at a tooth model.', visualMethod: 'character_action' };
  assert.equal(repeatedSubject({ ...previous, visualMethod: 'process' }, [previous]), true);
});

test('SVG fallback preserves and escapes narration without fabricated goals or figures', () => {
  const svg = generateSemanticSvgForBeat({ beat: { text: 'Patients <return> & refer friends.', plan: { visualMethod: 'object_metaphor' } } });
  assert.match(svg, /Patients &lt;return&gt; &amp; refer friends\./);
  assert.doesNotMatch(svg, /MỤC TIÊU|100%|BẮT ĐẦU/);
});

 test('all subjects use source context without domain prop libraries', () => {
  for (const text of [
    'Volcanic pressure forces magma to the surface.',
    'A satellite measures rainfall above the ocean.',
    'A teacher compares two methods of solving an equation.',
    'The baker folds butter into the dough.',
    'Một con chim mang cành cây về tổ.',
    'Bệnh nhân quay lại phòng khám nha khoa.',
  ]) {
    const domain = extractDomainAnchor('Kịch bản video', '', text);
    assert.equal(domain.topic, text);
    assert.equal(domain.props, '');
    const plan = createLocalBeatPlan({ beatText: text, overallTopic: domain.topic });
    assert.ok(plan.imageGenerationPrompt.includes(text));
    assert.deepEqual(plan.objects, []);
    assert.doesNotMatch(plan.imageGenerationPrompt, /clinic doorway|tooth model|appointment card|espresso machine/);
    const svg = generateSemanticSvgForBeat({ beat: { text, plan } });
    assert.ok(svg.includes(text));
  }
});
