const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { fixture } = require('./fixtures/remotionProject.cjs');
const { normalizeProject } = require('./projectEditor.cjs');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let project = fixture(), submitted;
  project.scenes[0].beats[0].remotion.layers.find(layer => layer.id === 'leo').rightHandX = { keys: [{ at: 0, value: 55 }, { at: .4, value: 140 }, { at: .7, value: 140, ease: 'hold' }, { at: 1, value: 55 }] };
  const root = process.env.STUDIO_URL || 'http://localhost:5173';
  const screenshots = path.resolve('data/remotion-ui');
  fs.mkdirSync(screenshots, { recursive: true });
  try {
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url()).pathname;
      if (url === '/api/image-provider/status') return route.fulfill({ json: {} });
      if (url.startsWith('/api/chatgpt/')) return route.fulfill({ json: { connected: true, message: 'ChatGPT đã sẵn sàng.' } });
      if (url === '/api/projects/remotion-fixture' || url.endsWith('/render')) {
        if (route.request().method() === 'POST') { project = normalizeProject(route.request().postDataJSON()); project.metadata.render_dirty = true; }
        return route.fulfill({ json: project });
      }
      if (url === '/api/remotion/revise') {
        const data = route.request().postDataJSON();
        const shot = structuredClone(data.current); shot.background = '#CCD5CC';
        return route.fulfill({ json: { shot } });
      }
      if (url === '/api/generate-video') {
        submitted = route.request().postDataJSON();
        return route.fulfill({ contentType: 'application/x-ndjson', body: `${JSON.stringify({ type: 'complete', result: project })}\n` });
      }
      return route.fulfill({ json: [] });
    });
    await page.route('**/audio/fixture.wav*', route => route.fulfill({ path: path.resolve('data/remotion-smoke/audio/fixture.wav'), contentType: 'audio/wav' }));
    await page.goto(`${root}/project/new`);
    await page.getByRole('radio', { name: /Hoạt hình người que/ }).check();
    await page.getByRole('button', { name: 'Kiểm tra kết nối' }).click();
    await page.getByText('ChatGPT đã sẵn sàng.').waitFor();
    await page.reload();
    assert.ok(await page.getByRole('radio', { name: /Hoạt hình người que/ }).isChecked());
    await page.getByLabel('Tiêu đề video', { exact: true }).fill('Kiểm thử Remotion');
    await page.getByLabel('Nội dung lời thoại phân cảnh', { exact: true }).fill('Leo nhìn cuốn sách trên bàn.');
    await page.screenshot({ path: path.join(screenshots, 'creator-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(screenshots, 'creator-mobile.png'), fullPage: true });
    await page.getByRole('button', { name: 'Tạo video ngay' }).click();
    await page.waitForURL('**/project/remotion-fixture');
    assert.equal(submitted.videoMode, 'remotion');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('button', { name: 'Chỉnh hoạt hình' }).click();
    await page.getByLabel('Lớp đang chỉnh').selectOption('leo');
    await page.getByLabel('rightHandX cuối cảnh', { exact: true }).fill('80');
    await page.locator('summary').filter({ hasText: 'rightHandX' }).click();
    await page.getByLabel('rightHandX mốc 2 giá trị', { exact: true }).fill('160');
    await page.getByLabel('x cuối cảnh', { exact: true }).fill('850');
    await page.getByLabel('Biểu cảm').selectOption('pleased');
    await page.getByLabel('Chuyển động miệng').check();
    await page.getByLabel('Lớp đang chỉnh').selectOption('title');
    await page.getByLabel('Nội dung chữ').fill('Cuốn sách mới');
    await page.getByLabel('Yêu cầu ChatGPT chỉnh cảnh').fill('Đổi nền sang màu sage dịu.');
    await page.getByRole('button', { name: 'Dựng lại cảnh với ChatGPT' }).click();
    await page.getByLabel('Màu nền').waitFor();
    await page.waitForFunction(() => document.querySelector('.vector-layer-controls input')?.value === '#CCD5CC');
    await page.screenshot({ path: path.join(screenshots, 'editor-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(screenshots, 'editor-mobile.png') });
    await page.getByRole('button', { name: 'Lưu hoạt hình', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    const saved = project.scenes[0].beats[0].remotion;
    assert.equal(saved.layers.find(layer => layer.id === 'leo').x.to, 850);
    assert.deepEqual(saved.layers.find(layer => layer.id === 'leo').rightHandX.keys.map(point => point.value), [55, 160, 140, 80]);
    assert.equal(saved.layers.find(layer => layer.id === 'title').text, 'Cuốn sách mới');
    assert.equal(saved.background, '#CCD5CC');
    await page.reload();
    await page.getByRole('button', { name: 'Nhân đôi đoạn hoạt hình' }).click();
    await page.waitForFunction(() => document.querySelectorAll('.timeline-clip').length === 2);
    assert.equal(project.scenes[0].beats.reduce((sum, beat) => sum + beat.duration_in_frames, 0), 120);
    await page.getByRole('button', { name: 'Hoàn tác', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.timeline-clip').length === 1);
    assert.equal(project.scenes[0].beats[0].remotion.background, '#CCD5CC');
    assert.deepEqual(errors, []);
    console.log('Creator mode, draft, request payload, live editor, ChatGPT revision, persistence, duplication, undo and mobile layout passed.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
