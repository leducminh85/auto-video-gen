const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const production = require('../src/data/scenes.json');
const { normalizeProject } = require('./projectEditor.cjs');
function audioFixture() {
  const wav = Buffer.alloc(44 + 160000);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(160000, 40);
  for (let i = 0; i < 80000; i++) wav.writeInt16LE(Math.round(Math.sin(i / 9) * (0.4 + 0.3 * Math.sin(i / 1000)) * 30000), 44 + i * 2);
  return wav;
}
async function main() {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, hasTouch: true });
    const page = await context.newPage(); page.setDefaultTimeout(10000);
    const base = structuredClone(production);
    base.scenes = [base.scenes[0]];
    base.scenes[0].duration_in_frames = 300;
    base.scenes[0].audio_file = 'timeline.wav';
    const template = base.scenes[0].beats[0];
    base.scenes[0].beats = [90,60,150].map((frames,i) => ({ ...template, id: `b${i}`, sub_index: i + 1, duration_in_frames: frames, duration_in_seconds: frames / 30, start_frame_offset: [0,90,150][i] }));
    let project = normalizeProject(base), saves = 0, failSave = false;
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.route('**/audio/timeline.wav*', route => route.fulfill({ contentType: 'audio/wav', body: audioFixture() }));
    await page.route('**/api/**', route => {
      const url = new URL(route.request().url()).pathname;
      if (url === '/api/project') {
        if (route.request().method() === 'POST') {
          saves++;
          if (failSave) return route.fulfill({ status: 500, json: { error: 'Không lưu được timeline thử nghiệm.' } });
          project = normalizeProject(route.request().postDataJSON()); project.metadata.render_dirty = true;
        }
        return route.fulfill({ json: project });
      }
      if (url === '/api/image-provider/status') return route.fulfill({ json: {} });
      throw new Error(`Unexpected API ${url}`);
    });
    const durations = () => project.scenes[0].beats.map(b => b.duration_in_frames);
    const saved = async count => { await page.waitForFunction(count => Number(document.querySelectorAll('.timeline-clip').length) === count, project.scenes[0].beats.length); await page.getByRole('button', { name: 'Tạo video mới', exact: true }).waitFor({ state: 'visible' }); await page.waitForFunction(() => !document.querySelector('[aria-label="Tạo video mới"]').disabled); assert.equal(saves, count); };
    await page.goto(process.env.STUDIO_URL || 'http://localhost:3001');
    await page.locator('.audio-waveform[data-status="ready"]').waitFor();
    assert.equal(await page.locator('.studio-workspace > section').count(), 3);
    const unnamed = await page.locator('.studio-workspace .icon-button, .studio-topbar .icon-button').evaluateAll(buttons => buttons.filter(b => !b.getAttribute('aria-label') || !b.getAttribute('title') || b.textContent.trim()).length);
    assert.equal(unnamed, 0);
    await page.getByRole('button', { name: 'Chỉnh ảnh trong cảnh', exact: true }).click();
    await page.locator('.timeline-section').scrollIntoViewIfNeeded();
    const clip = await page.locator('[data-beat-id="b0"]').boundingBox();
    const handle = await page.getByRole('slider', { name: 'Cuối ảnh 1', exact: true }).boundingBox();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down(); await page.mouse.move(handle.x + handle.width / 2 + clip.width / 90 * 30, handle.y + handle.height / 2, { steps: 10 }); await page.mouse.up();
    await saved(1); assert.deepEqual(durations(), [120,30,150]);
    const first = await page.locator('[data-beat-id="b0"] .clip-body').boundingBox();
    const last = await page.locator('[data-beat-id="b2"] .clip-body').boundingBox();
    await page.mouse.move(first.x + first.width / 2, first.y + 50); await page.mouse.down(); await page.mouse.move(last.x + last.width / 2 + 25, last.y + 50, { steps: 12 }); await page.mouse.up();
    await saved(2); assert.deepEqual(project.scenes[0].beats.map(b => b.id), ['b1','b2','b0']); assert.deepEqual(durations(), [30,150,120]);
    const boundary = page.getByRole('slider', { name: 'Cuối ảnh 1', exact: true });
    await boundary.focus(); await page.keyboard.press('Shift+ArrowLeft');
    await saved(3); assert.deepEqual(durations(), [20,160,120]);
    failSave = true; await boundary.focus(); await page.keyboard.press('ArrowRight');
    await page.getByRole('alert').filter({ hasText: 'Không lưu được timeline thử nghiệm.' }).waitFor();
    await saved(4); assert.deepEqual(durations(), [20,160,120]);
    assert.deepEqual(await page.locator('.timeline-clip').evaluateAll(clips => clips.map(clip => Number(clip.dataset.frames))), [20,160,120]);
    failSave = false;
    await page.getByRole('button', { name: 'Hoàn tác', exact: true }).click(); await saved(5); assert.deepEqual(durations(), [30,150,120]);
    await page.reload(); await page.locator('.timeline-clip').first().waitFor();
    assert.deepEqual(await page.locator('.timeline-clip').evaluateAll(clips => clips.map(clip => clip.dataset.beatId)), ['b1','b2','b0']);
    await page.locator('[data-beat-id="b2"] .clip-body').click();
    await page.getByLabel('Thời lượng', { exact: false }).fill('4'); await page.getByLabel('Thời lượng', { exact: false }).press('Enter');
    await saved(6); assert.deepEqual(durations(), [30,120,150]);
    const cancelHandle = await page.getByRole('slider', { name: 'Cuối ảnh 1', exact: true }).boundingBox();
    await page.mouse.move(cancelHandle.x + cancelHandle.width / 2, cancelHandle.y + 50); await page.mouse.down(); await page.mouse.move(cancelHandle.x + 45, cancelHandle.y + 50); await page.keyboard.press('Escape'); await page.mouse.up();
    assert.equal(saves, 6); assert.deepEqual(durations(), [30,120,150]);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.timeline-section').scrollIntoViewIfNeeded();
    await page.locator('.timeline-scroll').evaluate(el => { el.scrollLeft = 0; });
    const touchHandle = await page.getByRole('slider', { name: 'Cuối ảnh 1', exact: true }).boundingBox();
    const cdp = await context.newCDPSession(page);
    const x = touchHandle.x + touchHandle.width / 2, y = touchHandle.y + 60;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 24, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await saved(7); assert.ok(durations()[0] > 30); assert.equal(durations().reduce((a,b) => a+b,0),300);
    for (const width of [320,390,768,1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.locator('.selected-image-preview').evaluate(img => getComputedStyle(img).objectFit), 'contain');
      const image = await page.locator('.selected-image-preview').boundingBox(); assert.ok(image.width >= 200);
    }
    await page.evaluate(() => scrollTo(0,0)); await page.screenshot({ path: '/tmp/timeline-verified-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: '/tmp/timeline-verified-mobile.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS: three sections, icon labels, real decoded waveform, mouse resize/reorder, keyboard resize, duration field, failed-save rollback, undo/reload, Escape cancel, touch resize, responsive images. All mutations mocked.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
