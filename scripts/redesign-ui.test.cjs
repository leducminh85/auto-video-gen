const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const remoteFonts = []; page.on('request', req => { if (/fonts\.(googleapis|gstatic)\.com/.test(req.url())) remoteFonts.push(req.url()); });
    const base = process.env.STUDIO_URL || 'http://localhost:3000';
    const projects = await (await page.request.get(`${base}/api/projects`)).json();
    const original = projects.find(p => !p.title.startsWith('Project route test'));
    assert.ok(original);
    await page.route('**/api/projects', route => route.fulfill({ json: [
      { ...original, id: 'a', title: 'Chim xây tổ', updatedAt: '2026-10-10T00:00:00Z' },
      { ...original, id: 'b', title: 'Buổi sáng ở quán', updatedAt: '2026-10-12T00:00:00Z' },
    ] }));
    await page.goto(base);
    await page.getByRole('heading', { name: 'Chim xây tổ', exact: true }).waitFor();
    await page.getByRole('searchbox', { name: 'Tìm dự án' }).fill('CHIM');
    assert.equal(await page.locator('.project-card').count(), 1);
    await page.getByRole('searchbox').fill('không tồn tại');
    await page.getByRole('heading', { name: 'Không tìm thấy dự án' }).waitFor();
    await page.getByRole('button', { name: 'Xóa tìm kiếm' }).click();
    await page.getByRole('combobox', { name: 'Sắp xếp dự án' }).selectOption('name');
    assert.deepEqual(await page.locator('.project-title-row h2').allTextContents(), ['Buổi sáng ở quán', 'Chim xây tổ']);
    await page.unroute('**/api/projects');
    await page.reload();
    await page.locator('.project-card').first().waitFor();
    fs.mkdirSync('reports', { recursive: true });
    await page.screenshot({ path: 'reports/redesign-dashboard.png', fullPage: true });
    await page.goto(`${base}/project/new`);
    await page.locator('#script-content').waitFor();
    await page.screenshot({ path: 'reports/redesign-creator.png' });
    await page.getByLabel('Nội dung lời thoại').fill('Một con chim mang cành cây về tổ.');
    let finish;
    await page.route('**/api/generate-video', async route => { await new Promise(resolve => { finish = resolve; }); await route.fulfill({ status: 503, json: { error: 'Lỗi kiểm tra. Có thể thử lại.' } }); });
    await page.getByRole('button', { name: 'Tạo video', exact: true }).click();
    await page.getByRole('heading', { name: 'Đang tạo video của bạn' }).waitFor();
    assert.equal(await page.getByRole('progressbar', { name: 'Tiến độ tạo video' }).getAttribute('max'), '100');
    await page.screenshot({ path: 'reports/redesign-progress.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.locator('.creation-progress').evaluate(el => el.scrollWidth <= el.clientWidth));
    await page.screenshot({ path: 'reports/redesign-progress-mobile.png' });
    finish();
    await page.getByRole('alert').filter({ hasText: 'Lỗi kiểm tra' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Tạo video', exact: true }).isEnabled(), true);
    await page.goto(`${base}/project/${original.id}`);
    await page.getByRole('heading', { name: 'Xem trước', exact: true }).waitFor();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('.audio-waveform[data-status="ready"]').waitFor();
    await page.screenshot({ path: 'reports/redesign-editor.png' });
    await page.getByRole('button', { name: 'Tạo lại ảnh', exact: true }).first().click();
    await page.screenshot({ path: 'reports/redesign-image-dialog.png' });
    await page.keyboard.press('Escape');
    for (const url of [base, `${base}/project/new`, `${base}/project/${original.id}`]) {
      await page.goto(url);
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${url} at ${width}`);
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.ok(await page.locator('.icon-button').first().evaluate(el => parseFloat(getComputedStyle(el).transitionDuration) < .01));
    assert.deepEqual(remoteFonts, []);
    assert.deepEqual(errors, []);
    console.log('PASS: search/sort/empty state, generation progress/error/retry, local fonts, desktop/mobile pages, reduced motion. Generation mocked; existing project only read.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
