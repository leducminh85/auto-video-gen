const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const production = require('../src/data/scenes.json');
function audioFixture() {
  const wav = Buffer.alloc(44 + 320000);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(320000, 40); return wav;
}
async function main() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(10000);
    let project = structuredClone(production);
    const source = project.scenes[0];
    source.duration_in_frames = 300; source.duration_in_seconds = 10;
    source.beats = [90, 60, 150].map((frames, i) => ({ ...source.beats[0], id: `fixture-${i}`, sub_index: i + 1, duration_in_frames: frames, duration_in_seconds: frames / 30, start_frame_offset: [0, 90, 150][i] }));
    let failImage = true, failSave = false, renders = 0, images = 0;
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/audio/import_ux.wav', route => {
      const wav = audioFixture();
      const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers().range || '');
      const start = range ? Number(range[1]) : 0;
      const end = range?.[2] ? Number(range[2]) : wav.length - 1;
      return route.fulfill({ status: range ? 206 : 200, contentType: 'audio/wav', headers: { 'Accept-Ranges': 'bytes', 'Content-Length': String(end - start + 1), ...(range ? { 'Content-Range': `bytes ${start}-${end}/${wav.length}` } : {}) }, body: wav.subarray(start, end + 1) });
    });
    await page.route('**/final-video.mp4?*', route => route.fulfill({ contentType: 'video/mp4', body: Buffer.from('download fixture') }));
    await page.route('**/api/**', route => {
      const url = new URL(route.request().url()).pathname;
      if (url === '/api/project') {
        if (route.request().method() === 'POST') {
          if (failSave) return route.fulfill({ status: 500, json: { error: 'Không lưu được. Thử lại.' } });
          project = route.request().postDataJSON(); project.metadata.render_dirty = true;
        }
        return route.fulfill({ json: project });
      }
      if (url === '/api/project/render') { renders++; project = route.request().postDataJSON(); project.metadata.render_dirty = false; return route.fulfill({ json: project }); }
      if (url === '/api/audio/import') return route.fulfill({ json: { file: 'import_ux.wav', duration: 20 } });
      if (url === '/api/image-provider/status') return route.fulfill({ json: { preferredProvider: 'google_ai_studio' } });
      if (url === '/api/regenerate-beat') {
        images++;
        return route.fulfill(failImage ? { status: 500, json: { error: 'Không tạo được ảnh thử nghiệm.' } } : { json: { success: true, imageFile: source.image_file, timestamp: Date.now() } });
      }
      throw new Error(`Unexpected API ${url}`);
    });
    const open = () => page.getByRole('button', { name: 'Tạo video mới', exact: true }).click();
    await page.goto(process.env.STUDIO_URL || 'http://localhost:3001');
    await open();
    const script = await page.locator('#script-content').boundingBox();
    assert.ok(script.y < 350 && script.x < 300, 'Script is visible on opening, in the main column');
    assert.equal(await page.locator('.style-settings').getAttribute('open'), null);
    await page.getByRole('radio', { name: 'Nhập audio có sẵn' }).check();
    await page.locator('#audio-upload').setInputFiles({ name: 'my-voice.wav', mimeType: 'audio/wav', buffer: audioFixture() });
    await page.getByText('my-voice.wav', { exact: true }).waitFor();
    await page.getByLabel('Nội dung lời thoại').fill('A bird carries a twig.\n\nIt builds a nest.');
    await page.getByLabel('Tự đặt thời điểm chuyển cảnh').check();
    await page.locator('#cut-0').fill('');
    assert.equal(await page.getByLabel('Tự đặt thời điểm chuyển cảnh').isChecked(), true);
    await page.locator('#cut-0').fill('8.5');
    await page.waitForFunction(() => document.querySelector('audio[controls]')?.readyState >= 2);
    await page.locator('audio[controls]').evaluate(audio => { audio.currentTime = 4.25; });
    await page.getByRole('button', { name: 'Lấy vị trí đang nghe cho cảnh 1' }).click();
    assert.equal(await page.locator('#cut-0').inputValue(), '4.25');
    await page.keyboard.press('Escape'); await open();
    assert.equal(await page.getByRole('radio', { name: 'Nhập audio có sẵn' }).isChecked(), true);
    assert.equal(await page.locator('#cut-0').inputValue(), '4.25');
    await page.reload(); await open();
    await page.getByText('my-voice.wav', { exact: true }).waitFor();
    assert.equal(await page.locator('#cut-0').inputValue(), '4.25');
    await page.screenshot({ path: '/tmp/ux-audio-desktop.png' });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Chỉnh ảnh trong cảnh', exact: true }).click();
    await page.getByRole('button', { name: 'Thêm ảnh vào cảnh', exact: true }).click();
    assert.equal(await page.getByLabel('Mô tả hình ảnh', { exact: true }).inputValue(), source.text);
    await page.getByLabel('Chèn sau ảnh', { exact: true }).selectOption('fixture-1');
    await page.getByLabel('Mô tả hình ảnh', { exact: true }).fill('A bird carrying a twig.');
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const action = await page.getByRole('button', { name: 'Tạo ảnh mới', exact: true }).boundingBox();
      assert.ok(action.y > 0 && action.y + action.height <= 844, `Main action visible at ${width}px`);
      assert.equal(await page.getByRole('dialog').evaluate(el => el.scrollWidth > el.clientWidth), false);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: '/tmp/ux-add-mobile-final.png' });
    await page.getByRole('button', { name: 'Tạo ảnh mới', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Không tạo được ảnh thử nghiệm.' }).waitFor();
    assert.equal(project.scenes[0].beats.length, 3);
    failImage = false;
    await page.getByRole('button', { name: 'Tạo ảnh mới', exact: true }).click();
    await page.getByRole('button', { name: 'Thêm vào cảnh', exact: true }).waitFor();
    await page.getByLabel('Mô tả hình ảnh', { exact: true }).fill('A bird flying home.');
    assert.equal(await page.getByRole('button', { name: 'Thêm vào cảnh', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Tạo lại theo mô tả', exact: true }).click();
    failSave = true;
    await page.getByRole('button', { name: 'Thêm vào cảnh', exact: true }).click();
    await page.getByRole('dialog').getByRole('alert').waitFor();
    assert.equal(project.scenes[0].beats.length, 3);
    failSave = false;
    await page.getByRole('button', { name: 'Thêm vào cảnh', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.deepEqual(project.scenes[0].beats.map(beat => beat.duration_in_frames), [90, 30, 30, 150]);
    assert.equal(images, 3, 'Save retry does not regenerate image');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Xuất và tải MP4', exact: true }).click();
    await download;
    assert.equal(renders, 1);
    await page.getByRole('button', { name: 'Tải MP4', exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log('PASS: script-first layout, persistent imported audio, per-scene timing, clearable inputs, mobile primary action, insertion position, generation/save retry, changed prompt protection, one-click render/download. All mutations mocked.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
