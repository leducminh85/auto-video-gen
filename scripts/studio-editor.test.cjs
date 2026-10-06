function wavFixture() {
  const wav = Buffer.alloc(44 + 16000);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(16000, 40); return wav;
}
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const production = require('../src/data/scenes.json');

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    let project = structuredClone(production);
    let submitted, imageRequest;
    let failSave = false, failRender = false;
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/audio/import_test.wav', route => route.fulfill({ contentType: 'audio/wav', body: wavFixture() }));
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url()).pathname;
      const body = () => route.request().postDataJSON();
      if (url === '/api/project') {
        if (route.request().method() === 'POST') {
          if (failSave) return route.fulfill({ status: 500, json: { error: 'Không ghi được dự án thử nghiệm.' } });
          project = body(); project.metadata.render_dirty = true;
        }
        return route.fulfill({ json: project });
      }
      if (url === '/api/project/render') {
        if (failRender) return route.fulfill({ status: 500, json: { error: 'Ghép thử nghiệm thất bại.' } });
        project = body(); project.metadata.render_dirty = false;
        return route.fulfill({ json: project });
      }
      if (url === '/api/image-provider/status') return route.fulfill({ json: { preferredProvider: 'google_ai_studio' } });
      if (url === '/api/regenerate-beat') {
        imageRequest = body();
        return route.fulfill({ json: { success: true, imageFile: production.scenes[0].beats[0].image_file, timestamp: Date.now() } });
      }
      if (url === '/api/audio/import') return route.fulfill({ json: { file: 'import_test.wav', duration: 20 } });
      if (url === '/api/generate-video') {
        submitted = body();
        return route.fulfill({ contentType: 'application/x-ndjson', body: JSON.stringify({ type: 'complete', result: project }) + '\n' });
      }
      throw new Error(`Unexpected API request ${url}`);
    });
    await page.goto(process.env.STUDIO_URL || 'http://localhost:3001');
    const deleteButtons = () => page.getByRole('button', { name: /^Xóa ảnh \d+$/ });
    const startCount = project.scenes[0].beats.length;
    const frames = project.scenes[0].duration_in_frames;
    await deleteButtons().first().click();
    await page.waitForFunction(() => !document.querySelector('[aria-label="Hoàn tác"]').disabled);
    assert.equal(await page.locator('.timeline-clip').count(), startCount - 1);
    assert.equal(project.scenes[0].duration_in_frames, frames);
    assert.equal(project.scenes[0].beats.reduce((sum, beat) => sum + beat.duration_in_frames, 0), frames);
    assert.equal(await page.getByRole('button', { name: 'Xuất và tải MP4' }).count(), 1);
    await page.reload();
    await page.getByRole('button', { name: 'Thêm ảnh vào cảnh', exact: true }).waitFor();
    await page.waitForFunction(() => !document.querySelector('[aria-label="Tạo video mới"]').disabled);
    assert.equal(await page.locator('.timeline-clip').count(), startCount - 1);
    await page.getByRole('button', { name: 'Thêm ảnh vào cảnh', exact: true }).click();
    await page.getByLabel('Mô tả hình ảnh', { exact: true }).fill('Watercolor bird with a twig');
    await page.getByRole('button', { name: 'Tạo ảnh mới', exact: true }).click();
    await page.getByRole('button', { name: 'Thêm vào cảnh' }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.match(imageRequest.prompt, /Scene content: Watercolor bird with a twig$/);
    assert.equal(await page.locator('.timeline-clip').count(), startCount);
    assert.equal(project.scenes[0].beats.reduce((sum, beat) => sum + beat.duration_in_frames, 0), frames);
    await page.getByRole('button', { name: 'Hoàn tác', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[aria-label="Hoàn tác"]').disabled && !document.querySelector('[aria-label="Tạo video mới"]').disabled);
    assert.equal(await page.locator('.timeline-clip').count(), startCount - 1);
    failSave = true;
    const oldCount = await page.locator('.timeline-clip').count();
    if (oldCount > 1) {
      await deleteButtons().first().click();
      await page.getByRole('alert').waitFor();
      assert.equal(await page.locator('.timeline-clip').count(), oldCount);
    }
    failSave = false;
    failRender = true;
    await page.getByRole('button', { name: 'Xuất và tải MP4', exact: true }).click();
    await page.getByText('Ghép thử nghiệm thất bại.', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Xuất và tải MP4' }).count(), 1);
    failRender = false;
    await page.getByRole('button', { name: 'Xuất và tải MP4', exact: true }).click();
    await page.getByRole('button', { name: 'Tải MP4', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Tạo video mới', exact: true }).click();
    await page.locator('.style-settings summary').click();
    assert.ok((await page.getByLabel('Prompt phong cách', { exact: true }).inputValue()).length > 0);
    await page.getByLabel('Prompt phong cách', { exact: true }).fill('Watercolor on paper');
    await page.getByRole('radio', { name: 'Nhập audio có sẵn', exact: true }).check();
    assert.equal(await page.getByRole('button', { name: 'Tạo video', exact: true }).isDisabled(), true);
    await page.locator('#audio-upload').setInputFiles({ name: 'voice.wav', mimeType: 'audio/wav', buffer: Buffer.from('fixture-upload') });
    await page.getByText('voice.wav', { exact: true }).waitFor();
    await page.getByLabel('Nội dung lời thoại').fill('A bird builds a nest.\n\nIt carries a twig home.');
    await page.getByLabel('Tự đặt thời điểm chuyển cảnh').check();
    await page.locator('#cut-0').fill('25');
    await page.getByRole('button', { name: 'Tạo video', exact: true }).click();
    await page.getByRole('alert').waitFor();
    assert.equal(submitted, undefined);
    await page.locator('#cut-0').fill('8.5');
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.getByRole('dialog').evaluate(element => element.scrollWidth > element.clientWidth), false);
    }
    await page.screenshot({ path: '/tmp/wevic-creator-editor.png', fullPage: false });
    await page.getByRole('button', { name: 'Tạo video', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal(submitted.importedAudio, 'import_test.wav');
    assert.deepEqual(submitted.audioBoundaries, [8.5]);
    assert.equal(submitted.scenes.length, 2);
    assert.equal(submitted.imageStylePrompt, 'Watercolor on paper');
    await page.getByRole('button', { name: 'Tạo video mới', exact: true }).click();
    await page.locator('.style-settings summary').click();
    assert.equal(await page.getByLabel('Prompt phong cách', { exact: true }).inputValue(), 'Watercolor on paper');
    await page.getByRole('button', { name: 'Khôi phục phong cách mặc định' }).click();
    assert.equal(await page.getByLabel('Prompt phong cách', { exact: true }).inputValue(), require('../src/config/imageStyle.json').defaultPrompt);
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 390, height: 900 });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: '/tmp/wevic-editor-mobile.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS: add/delete/undo, exact timing, reload, render failure/retry, audio upload and boundaries, editable style, mobile layouts. API mutations mocked.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
