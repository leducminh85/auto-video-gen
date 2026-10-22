const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { ChatGPTBrowser } = require('./chatgptBrowser.cjs');

test('supports old and new ChatGPT composers and assistant responses', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const worker = new ChatGPTBrowser();
    worker.page = await browser.newPage();
    await worker.page.setContent('<div id="prompt-textarea" contenteditable="true"></div><div data-message-author-role="assistant">old response</div>');
    await worker.composer().fill('script');
    assert.equal(await worker.responses().last().innerText(), 'old response');
    await worker.page.setContent('<div id="prompt-textarea" hidden></div><div role="textbox" contenteditable="true" aria-label="Ask ChatGPT"></div><div data-markdown-text-style="assistant-message">new response</div><div data-markdown-text-style="assistant-message" hidden>stale response</div>');
    await worker.composer().fill('new script');
    assert.equal(await worker.composer().innerText(), 'new script');
    assert.equal(await worker.responses().count(), 1);
    assert.equal(await worker.responses().last().innerText(), 'new response');
  } finally { await browser.close(); }
});
