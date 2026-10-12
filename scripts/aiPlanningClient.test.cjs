const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createPlanningClient, parseResponse, runInStudio } = require('./aiPlanningClient.cjs');
const schema = { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'], additionalProperties: false };

test('accepts fenced JSON and rejects missing fields, wrong types and incomplete output', () => {
  assert.deepEqual(parseResponse('```json\n{"ok":true}\n```', schema), { ok: true });
  for (const raw of ['{}', '{"ok":"true"}', '{"ok":true, "extra":1}', '[]', '{"ok":']) {
    assert.throws(() => parseResponse(raw, schema), error => error.code === 'AI_INVALID_RESPONSE');
  }
});

test('uses browser without credentials, forwards full context and releases shared tab on success or failure', async () => {
  const events = [];
  const tab = { page: { url: () => 'https://aistudio.google.com/prompts/new_chat', goto: async url => events.push(url), waitForTimeout: async () => {} }, isInitialized: true, modelId: 'image-model' };
  const worker = { acquireTab: async () => tab, releaseTab: value => { assert.equal(value, tab); events.push('released'); } };
  const prompt = 'Full narration '.repeat(2000);
  const client = createPlanningClient({ env: {}, browserWorker: worker, run: async args => {
    assert.equal(args.model, 'gemini-3.8-flash'); assert.equal(args.prompt, prompt); assert.deepEqual(args.schema, schema);
    return { ok: true };
  } });
  assert.equal((await client({ prompt, schema })).provider, 'google_ai_studio');
  assert.equal(tab.isInitialized, false); assert.equal(tab.modelId, null);
  assert.deepEqual(events, ['about:blank', 'released']);
  let calls = 0;
  const failure = createPlanningClient({ env: {}, browserWorker: worker, run: async () => { calls++; throw new Error('quota'); } });
  await assert.rejects(failure({ prompt, schema }), /quota/);
  assert.equal(calls, 1); assert.equal(events.at(-1), 'released');
  const retry = createPlanningClient({ env: {}, browserWorker: worker, run: async () => {
    if (++calls === 2) throw Object.assign(new Error('internal error'), { code: 'STUDIO_TRANSIENT' });
    return { ok: true };
  } });
  assert.equal((await retry({ prompt, schema })).failures.length, 1);
});

test('Playwright reads only completed model output, rejects UI errors and verifies model before submission', async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let mode = 'success', submitted = 0;
  await page.exposeFunction('submitted', () => submitted++);
  await page.route('https://aistudio.google.com/**', route => route.fulfill({ contentType: 'text/html', body: `
    <button class="model-selector-card">Gemini 3.8 Flash<br>${mode === 'wrong-model' ? 'gemini-other' : 'gemini-3.8-flash'}</button>
    <button role="switch" aria-label="Grounding with Google Search" aria-checked="true" onclick="setTimeout(()=>this.setAttribute('aria-checked','false'),100)">Search</button>
    <textarea aria-label="Enter a prompt"></textarea><button id="run">Run</button><div id="output"></div>
    <script>document.querySelector('#run').onclick = () => {
      window.submitted(); const run=document.querySelector('#run');run.disabled=true;
      document.querySelector('#output').innerHTML='<ms-chat-turn><div class="user"><ms-text-chunk>{"ok":false}</ms-text-chunk></div></ms-chat-turn><ms-chat-turn><div class="model"></div></ms-chat-turn>';
      const model=document.querySelector('.model');
      if (${JSON.stringify(mode)} === 'error') {model.innerHTML='<span>An internal error has occurred.</span>';run.disabled=false;return;}
      if (${JSON.stringify(mode)} === 'quota') {model.innerHTML='<ms-callout>Quota exceeded</ms-callout>';run.disabled=false;return;}
      model.innerHTML='<ms-text-chunk>{"ok":false}</ms-text-chunk><button id="stop">Stop</button>';
      setTimeout(()=>{model.innerHTML='<ms-text-chunk><pre><code>{"ok":true}</code></pre></ms-text-chunk><button aria-label="Good response">thumb_up</button>';}, 2500);
    };</script>` }));
  const args = { page, model: 'gemini-3.8-flash', prompt: 'Test full context', schema, timeoutMs: 10000, onStatus: () => {} };
  try {
    assert.deepEqual(await runInStudio(args), { ok: true });
    assert.equal(await page.getByRole('switch').getAttribute('aria-checked'), 'false');
    assert.match(await page.locator('textarea').inputValue(), /Test full context/);
    mode = 'error'; await assert.rejects(runInStudio(args), error => error.code === 'STUDIO_TRANSIENT');
    mode = 'quota'; await assert.rejects(runInStudio(args), /hết hạn mức/);
    const before = submitted;
    mode = 'wrong-model'; await assert.rejects(runInStudio(args), /chưa chọn đúng model/);
    assert.equal(submitted, before);
    mode = 'success'; await assert.rejects(runInStudio({ ...args, timeoutMs: 1000 }), /chưa hoàn tất/);
  } finally { await browser.close(); }
});

test('Studio service fallback is bounded, visible and reused; invalid plans and login errors never switch models', async () => {
  const calls = [], messages = [];
  let releases = 0;
  const tab = { page: { url: () => 'about:blank', goto: async () => {}, waitForTimeout: async () => {} } };
  const browserWorker = { acquireTab: async () => tab, releaseTab: () => releases++ };
  const client = createPlanningClient({ env: {}, browserWorker, onStatus: message => messages.push(message), run: async ({ model }) => {
    calls.push(model);
    if (model === 'gemini-3.8-flash') throw Object.assign(new Error('internal error'), { code: 'STUDIO_TRANSIENT' });
    return { ok: true };
  } });
  const first = await client({ prompt: 'Full source', schema });
  assert.equal(first.model, 'gemini-3.5-flash-lite');
  assert.equal(first.failures.length, 2);
  await client({ prompt: 'Review same source', schema });
  assert.deepEqual(calls, ['gemini-3.8-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.5-flash-lite']);
  assert.ok(messages.some(message => message.includes('Chuyển sang model dự phòng')));
  assert.equal(releases, 2);
  for (const code of ['STUDIO_QUOTA', 'STUDIO_TIMEOUT', 'STUDIO_TRANSIENT', 'AI_INVALID_RESPONSE', undefined]) {
    calls.length = 0;
    const failure = createPlanningClient({ env: {}, browserWorker, run: async ({ model }) => {
      calls.push(model); throw Object.assign(new Error(code || 'Login required'), { code });
    } });
    await assert.rejects(failure({ prompt: 'source', schema }));
    assert.equal(calls.length, code === 'STUDIO_TRANSIENT' ? 4 : ['STUDIO_QUOTA', 'STUDIO_TIMEOUT'].includes(code) ? 2 : 1);
  }
  calls.length = 0;
  const disabled = createPlanningClient({ env: { AI_STUDIO_PLANNING_FALLBACK_MODEL: '' }, browserWorker, run: async ({ model }) => {
    calls.push(model); throw Object.assign(new Error('quota'), { code: 'STUDIO_QUOTA' });
  } });
  await assert.rejects(disabled({ prompt: 'source', schema }));
  assert.equal(calls.length, 1);
});
