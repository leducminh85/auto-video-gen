const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const sharp = require('sharp');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { IMAGE_MODELS, isQuotaError, selectedModel, withModelFallback } = require('./modelFallback.cjs');
const { ERROR_CODES } = require('./types.cjs');
const GoogleAIStudioProvider = require('./providers/GoogleAIStudioProvider.cjs');
const GoogleAIStudioBrowser = require('./browser/GoogleAIStudioBrowser.cjs');

test('recognizes quota messages without treating generic errors as quota', () => {
  for (const text of ['Out of limit', 'RESOURCE_EXHAUSTED', 'user has exceeded quota', 'quota for the day', 'out of free generations', 'Rate limit exceeded', "You've reached your daily limit", 'Too many requests']) assert.equal(isQuotaError(text), true, text);
  for (const text of ['permission denied', 'safety policy', 'internal error', 'Draw a banana']) assert.equal(isQuotaError(text), false, text);
});

test('identifies exact model variants instead of accepting any image model', () => {
  for (const model of IMAGE_MODELS) {
    assert.equal(selectedModel(model.name)?.id, model.id);
    assert.equal(selectedModel(model.id)?.id, model.id);
  }
  assert.equal(selectedModel('Nano Banana Lite')?.id, IMAGE_MODELS[1].id);
  assert.equal(selectedModel('Nano Banana Pro'), undefined);
  assert.equal(selectedModel('Nano Banana 2.10'), undefined);
});

test('exhaustion is bounded and reports each model; safety and other errors stop immediately', async () => {
  const visited = [];
  const result = await withModelFallback(async model => {
    visited.push(model.id);
    return { success: false, error: { code: ERROR_CODES.QUOTA_EXCEEDED } };
  });
  assert.deepEqual(visited, IMAGE_MODELS.map(model => model.id));
  assert.equal(result.error.details.attempts.length, 4);
  for (const code of [ERROR_CODES.SAFETY_REJECTION, ERROR_CODES.BROWSER_ERROR, ERROR_CODES.AUTH_REQUIRED, ERROR_CODES.TIMEOUT]) {
    let count = 0;
    await withModelFallback(async () => { count++; return { success: false, error: { code } }; });
    assert.equal(count, 1);
  }
});

test('unavailable models are skipped without submitting to a different unverified model', async () => {
  const visited = [];
  const result = await withModelFallback(async model => {
    visited.push(model.name);
    return visited.length < 3 ? { success: false, error: { code: ERROR_CODES.MODEL_UNAVAILABLE } } : { success: true, metadata: {} };
  });
  assert.deepEqual(visited, IMAGE_MODELS.slice(0, 3).map(model => model.name));
  assert.equal(result.metadata.model, IMAGE_MODELS[2].id);
});

test('provider switches models in order for RPC and UI quota, resends prompt and releases tabs', async () => {
  const browser = await chromium.launch({ headless: true });
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'wevic-model-test-'));
  try {
    const page = await browser.newPage();
    const image = await sharp(randomBytes(300 * 200 * 3), { raw: { width: 300, height: 200, channels: 3 } }).png().toBuffer();
    const submissions = [];
    const html = `<button class="model-selector-card" onclick="document.querySelector('#models').hidden=false">Nano Banana 2.1</button>
      <div id="models" hidden>${IMAGE_MODELS.map(model => `<button onclick="document.querySelector('.model-selector-card').textContent='${model.name}';document.querySelector('#models').hidden=true"><span>${model.name}</span><small>${model.id}</small></button>`).join('')}</div>
      <textarea aria-label="prompt"></textarea><div role="alert"></div>
      <button onclick="fetch('/MakerSuiteService/GenerateContent',{method:'POST',body:JSON.stringify({model:document.querySelector('.model-selector-card').textContent,prompt:document.querySelector('textarea').value})}).then(r=>r.text()).then(()=>{if(document.querySelector('.model-selector-card').textContent==='Nano Banana 2')document.querySelector('[role=alert]').textContent='Out of limit'})">Run</button>`;
    await page.route('http://studio.test/', route => route.fulfill({ contentType: 'text/html', body: html }));
    await page.route('**/MakerSuiteService/GenerateContent', route => {
      submissions.push(route.request().postDataJSON());
      const index = submissions.length;
      return route.fulfill({ status: index === 1 ? 429 : 200, body: index === 2 ? 'RESOURCE_EXHAUSTED' : index === 4 ? JSON.stringify(['image/png', image.toString('base64')]) : '{}' });
    });
    const tab = { id: 1, page, isInitialized: false, turnCount: 0 };
    let released = 0;
    const provider = new GoogleAIStudioProvider();
    const select = (tab, model) => GoogleAIStudioBrowser.prototype.selectImageModel.call({}, tab, model);
    provider.browserWorker = {
      acquireTab: async () => tab,
      releaseTab: () => { released++; },
      resetTab: async (tab, model) => {
        await page.goto('http://studio.test/');
        await select(tab, model);
        tab.isInitialized = true; tab.hasError = false; tab.turnCount = 0;
      },
      selectImageModel: select,
    };
    const result = await provider.generate({ prompt: 'A bird carries a twig.', outputPath: path.join(directory, 'image.png'), requestId: 'fixture', tabId: 1 });
    assert.equal(result.success, true, JSON.stringify(result));
    assert.deepEqual(submissions.map(item => item.model), IMAGE_MODELS.map(model => model.name));
    assert.ok(submissions.every(item => item.prompt === 'A bird carries a twig.'));
    assert.equal(released, 4);
    assert.equal(page.listenerCount('response'), 0);
    assert.equal(result.metadata.model, IMAGE_MODELS[3].id);
    assert.ok((await fs.stat(result.imagePath)).size > 5000);

    await page.goto('http://studio.test/');
    await page.locator('#models button').filter({ hasText: 'gemini-2.5-flash-image' }).evaluate(element => element.remove());
    await assert.rejects(select(tab, IMAGE_MODELS[0]), error => error.code === ERROR_CODES.MODEL_UNAVAILABLE);
  } finally {
    await browser.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
});
