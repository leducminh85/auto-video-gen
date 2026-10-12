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

test('model picker clicks Images inside the dialog instead of the covered background control', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(2000);
    await page.setContent(`<button class="model-selector-card" onclick="document.querySelector('#overlay').hidden=false">Gemini Flash</button>
      <button role="radio" onclick="throw Error('wrong Images control')">Images</button>
      <div id="overlay" hidden style="position:fixed;inset:0;background:white"><div role="dialog">
        <button onclick="document.querySelector('#model').hidden=false">Images</button>
        <button id="model" hidden onclick="document.querySelector('.model-selector-card').textContent='Nano Banana';document.querySelector('#overlay').hidden=true"><span>Nano Banana</span></button>
      </div></div>`);
    const tab = { page };
    await GoogleAIStudioBrowser.prototype.selectImageModel.call({}, tab, IMAGE_MODELS[0]);
    assert.equal(tab.modelId, IMAGE_MODELS[0].id);
    assert.equal(await page.locator('#overlay').isVisible(), false);
  } finally { await browser.close(); }
});

test('exhaustion is bounded and reports each model; safety and other errors stop immediately', async () => {
  const visited = [];
  const result = await withModelFallback(async model => {
    visited.push(model.id);
    return { success: false, error: { code: ERROR_CODES.QUOTA_EXCEEDED } };
  });
  assert.deepEqual(visited, IMAGE_MODELS.map(model => model.id));
  assert.equal(result.error.details.attempts.length, 4);
  for (const code of [ERROR_CODES.SAFETY_REJECTION, ERROR_CODES.BROWSER_ERROR, ERROR_CODES.AUTH_REQUIRED]) {
    let count = 0;
    await withModelFallback(async () => { count++; return { success: false, error: { code } }; });
    assert.equal(count, 1);
  }
});

test('image timeouts and service errors retry once before changing model', async () => {
  for (const code of [ERROR_CODES.TIMEOUT, ERROR_CODES.SERVICE_ERROR]) {
    const visited = [];
    const result = await withModelFallback(async model => {
      visited.push(model.id);
      return visited.length < 3 ? { success: false, error: { code, message: 'temporary failure' } } : { success: true };
    });
    assert.deepEqual(visited, [IMAGE_MODELS[0].id, IMAGE_MODELS[0].id, IMAGE_MODELS[1].id]);
    assert.equal(result.success, true);
    let attempts = 0;
    await withModelFallback(async () => { attempts++; return { success: false, error: { code } }; });
    assert.equal(attempts, IMAGE_MODELS.length * 2);
  }
});

test('provider reads an image from only the new response without an RPC image payload', async () => {
  const browser = await chromium.launch({ headless: true });
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'wevic-dom-image-'));
  try {
    const page = await browser.newPage();
    const image = await sharp(randomBytes(300 * 200 * 3), { raw: { width: 300, height: 200, channels: 3 } }).png().toBuffer();
    const dataUrl = `data:image/png;base64,${image.toString('base64')}`;
    await page.setContent(`<textarea aria-label="prompt"></textarea><button id="run">Run</button><ms-chat-turn><div class="model"><img src="${dataUrl}" /></div></ms-chat-turn>`);
    await page.evaluate(dataUrl => {
      document.querySelector('#run').onclick = () => {
        setTimeout(() => {
          const turn = document.createElement('ms-chat-turn');
          turn.innerHTML = `<div class="model"><img alt="Image" src="${dataUrl}" /></div>`;
          document.body.appendChild(turn);
        }, 750);
      };
    }, dataUrl);
    const provider = new GoogleAIStudioProvider();
    const tab = { id: 1, page, isInitialized: true, turnCount: 1, modelId: IMAGE_MODELS[0].id };
    let releases = 0, resets = 0;
    provider.browserWorker = { acquireTab: async () => tab, releaseTab: () => releases++, resetTab: async () => { resets++; } };
    const started = Date.now();
    const result = await provider.generate({ prompt: 'A closed gate blocks a path. The word blocked is narration, not a safety error.', outputPath: path.join(directory, 'image.png') });
    assert.equal(result.success, true, JSON.stringify(result));
    assert.ok(Date.now() - started >= 750, 'must not accept the previous response image');
    assert.ok(Date.now() - started < 10000, 'must read the DOM image without waiting for network timeout');
    assert.equal(releases, 1);
    assert.equal(resets, 1, 'each image starts a fresh chat even when the tab already has a generated image');
  } finally { await browser.close(); await fs.rm(directory, { recursive: true, force: true }); }
});

test('completed empty image response fails promptly and cancels the tab before release', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const tab = { id: 1, page };
    let released = false;
    const provider = new GoogleAIStudioProvider();
    provider.browserWorker = {
      acquireTab: async () => tab,
      resetTab: async () => {
        await page.setContent('<textarea aria-label="prompt"></textarea><button id="run">Run</button><div id="result"></div>');
        await page.evaluate(() => {
          document.querySelector('#run').onclick = () => {
            document.querySelector('#result').innerHTML = '<ms-chat-turn><div class="model"><button aria-label="Good response">Done</button></div></ms-chat-turn>';
          };
        });
      },
      releaseTab: () => { released = true; assert.equal(page.url(), 'about:blank'); },
    };
    const started = Date.now();
    const result = await provider._executeGeneration({ prompt: 'A bird flies.', outputPath: '/tmp/should-not-exist-demo.png', requestId: 'empty-fixture' });
    assert.equal(result.error.code, ERROR_CODES.SERVICE_ERROR);
    assert.match(result.error.message, /không trả ảnh/);
    assert.ok(Date.now() - started < 15000);
    assert.equal(released, true);
  } finally { await browser.close(); }
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

test('provider returns quota immediately for local fallback and releases its tab', async () => {
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
    assert.equal(result.success, false);
    assert.equal(result.error.code, ERROR_CODES.QUOTA_EXCEEDED);
    assert.deepEqual(submissions.map(item => item.model), [IMAGE_MODELS[0].name]);
    assert.ok(submissions.every(item => item.prompt === 'A bird carries a twig.'));
    assert.equal(released, 1);
    assert.equal(page.listenerCount('response'), 0);

    await page.goto('http://studio.test/');
    await page.locator('#models button').filter({ hasText: 'gemini-2.5-flash-image' }).evaluate(element => element.remove());
    await assert.rejects(select(tab, IMAGE_MODELS[0]), error => error.code === ERROR_CODES.MODEL_UNAVAILABLE);
  } finally {
    await browser.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
});
