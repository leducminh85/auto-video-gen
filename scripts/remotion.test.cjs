const test = require('node:test');
const assert = require('node:assert/strict');
const { validateShot } = require('./remotionSchema.cjs');
const { planStory, planShot } = require('./remotionPlanner.cjs');
const { normalizeProject } = require('./projectEditor.cjs');
const { fixture, shot } = require('./fixtures/remotionProject.cjs');

test('rejects executable attributes, external references and malformed motion', () => {
  assert.equal(validateShot(shot).layers.length, shot.layers.length);
  for (const attrs of [{ onLoad: 'alert(1)' }, { href: 'https://example.org' }, { fill: 'url(https://example.org)' }]) {
    assert.throws(() => validateShot({ ...shot, layers: [{ id: 'bad', type: 'rect', attrs }] }));
  }
  assert.throws(() => validateShot({ ...shot, layers: [{ id: 'bad', type: 'image' }] }));
  assert.throws(() => validateShot({ ...shot, camera: { scale: { from: 1, to: 2, start: .5, end: .5 } } }));
  assert.throws(() => validateShot({ ...shot, layers: [shot.layers[0], shot.layers[0]] }));
});
test('storyboard preserves source narration despite small AI omissions', async () => {
  const {sceneList}=require('./fixtures/sceneList.cjs');
  const scenes=await planStory('Một hai ba bốn','Test','balanced',async prompt=>prompt.startsWith('REVIEW VISUAL STORY')?{passed:true,issues:[]}:sceneList(['Một hai','bốn'],6),{seconds:12,sceneCount:2});
  assert.equal(scenes.map(s=>s.text).join(' '),'Một hai ba bốn');
  assert.equal(scenes.sceneList.scenes.map(s=>s.audio.narration_subtitle).join(' '),'Một hai ba bốn');
});
test('repairs invalid ChatGPT output once and keeps a validated scene', async () => {
  let attempts = 0;
  const result = await planShot({ text: 'test', seconds: 2 }, async prompt => { attempts++; if (attempts === 1) return {}; assert.match(prompt, /FIX THESE ITEMS FIRST/); return shot; });
  assert.equal(attempts, 2); assert.equal(result.styleId, 'STICKMAN_500IQ_V1');
});
test('project edits preserve animation and enforce the source style frame rate', () => {
  const project = fixture();
  const result = normalizeProject(project);
  assert.deepEqual(result.scenes[0].beats[0].remotion, validateShot(shot));
  project.metadata.fps = 30;
  assert.throws(() => normalizeProject(project), /60 fps/);
});
