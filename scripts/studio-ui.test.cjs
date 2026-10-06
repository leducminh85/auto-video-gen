const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const production = require('../src/data/scenes.json');

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/image-provider/status', route => route.fulfill({ json: { preferredProvider: 'google_ai_studio' } }));
    let currentProject = structuredClone(production);
    await page.route('**/api/project', route => {
      if (route.request().method() === 'POST') currentProject = route.request().postDataJSON();
      return route.fulfill({ json: currentProject });
    });
    let submitted;
    let failGeneration = true;
    await page.route('**/api/generate-video', route => {
      submitted = route.request().postDataJSON();
      return failGeneration
        ? route.fulfill({ status: 503, json: { error: 'Dịch vụ thử nghiệm đang bận.' } })
        : route.fulfill({ contentType: 'application/x-ndjson', body: JSON.stringify({ type: 'complete', result: production }) + '\n' });
    });
    await page.route('**/api/regenerate-beat', route => route.fulfill({ json: { success: true, imageFile: production.scenes[0].beats[0].image_file, timestamp: Date.now() } }));
    await page.goto(process.env.STUDIO_URL || 'http://localhost:3001');
    assert.equal(await page.title(), 'Wevic Video Studio');
    assert.equal(await page.locator('link[rel="icon"]').getAttribute('href'), '/favicon.svg');
    const openCreator = () => page.getByRole('button', { name: 'Tạo video mới', exact: true }).click();
    await openCreator();
    assert.ok((await page.getByLabel('Nội dung lời thoại').inputValue()).length > 0);
    await page.getByLabel('Tên video', { exact: true }).fill('Kiểm tra bản nháp');
    await page.getByLabel('Nội dung lời thoại').fill('Một con chim mang cành cây về tổ. Nó xây tổ để bảo vệ chim non.');
    await page.getByRole('button', { name: /Giọng đọc và tốc độ/ }).click();
    await page.getByRole('radio', { name: 'Jenny', exact: true }).check();
    await page.getByRole('button', { name: /1.25×/ }).click();
    await page.keyboard.press('Escape');
    await openCreator();
    assert.match(await page.getByRole('button', { name: /Giọng đọc và tốc độ/ }).innerText(), /Jenny/);
    assert.match(await page.getByLabel('Nội dung lời thoại').inputValue(), /chim non/);
    await page.reload();
    await openCreator();
    assert.match(await page.getByRole('button', { name: /Giọng đọc và tốc độ/ }).innerText(), /1.25/);
    await page.getByRole('button', { name: 'Tạo video', exact: true }).click();
    await page.getByRole('alert').waitFor();
    assert.match(await page.getByRole('alert').innerText(), /đang bận/);
    assert.equal(submitted.voice, 'en-US-JennyNeural');
    assert.equal(submitted.speed, 1.25);
    failGeneration = false;
    await page.getByRole('button', { name: 'Tạo video', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await openCreator();
    assert.match(await page.getByLabel('Nội dung lời thoại').inputValue(), /chim non/);
    await page.getByRole('button', { name: 'Xóa kịch bản', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Tạo video', exact: true }).isDisabled(), true);
    await page.locator('input[type="file"][accept*=".txt"]').setInputFiles({ name: 'script.txt', mimeType: 'text/plain', buffer: Buffer.from('Kịch bản nhập từ tệp văn bản.') });
    await page.waitForFunction(() => document.querySelector('#script-content').value.includes('nhập từ tệp'));
    assert.match(await page.getByLabel('Nội dung lời thoại').inputValue(), /nhập từ tệp/);
    await page.keyboard.press('Escape');
    for (const name of ['JSON', 'Xem trước']) {
      await page.getByRole('button', { name, exact: true }).click();
    }
    await page.getByRole('button', { name: 'Tạo lại ảnh', exact: true }).first().click();
    assert.equal(await page.getByRole('button', { name: 'Lưu ảnh vào cảnh' }).count(), 0);
    await page.getByLabel('Mô tả hình ảnh', { exact: true }).fill('A bird carries a twig, black outlines on white.');
    await page.getByRole('button', { name: 'Tạo ảnh mới', exact: true }).click();
    await page.getByRole('button', { name: 'Lưu ảnh vào cảnh' }).click();
    await page.getByRole('button', { name: 'Tạo lại ảnh', exact: true }).first().click();
    assert.match(await page.getByLabel('Mô tả hình ảnh', { exact: true }).inputValue(), /bird carries/);
    await page.keyboard.press('Escape');
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => scrollTo(0, 0));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await openCreator();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.getByLabel('Nội dung lời thoại').focus();
      assert.notEqual(await page.getByLabel('Nội dung lời thoại').evaluate(element => getComputedStyle(element).outlineStyle), 'none');
      await page.getByRole('button', { name: 'Tạo video', exact: true }).focus();
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')), true);
      await page.keyboard.press('Escape');
      assert.match(await page.locator(':focus').getAttribute('aria-label'), /Tạo video mới/);
      await page.getByRole('button', { name: 'Tạo lại ảnh', exact: true }).first().click();
      assert.equal(await page.getByRole('dialog').evaluate(element => [...element.querySelectorAll('button, input, textarea')].some(control => control.getBoundingClientRect().right > innerWidth + 1)), false);
      await page.keyboard.press('Escape');
    }
    assert.deepEqual(errors, []);
    console.log('PASS: branding, persisted draft/voice/speed, reload, generation error/success, file import, tabs, image regeneration, keyboard focus and responsive layouts. API mutations were mocked.');
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
