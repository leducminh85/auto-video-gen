const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    let submitted;
    await page.route('**/api/generate-video', route => {
      submitted = route.request().postDataJSON();
      return route.fulfill({ status: 400, json: { error: 'Test: no generation performed' } });
    });
    await page.goto(process.env.STUDIO_URL || 'http://localhost:3000');
    await page.getByRole('button', { name: 'Tạo video mới', exact: true }).click();
    await page.getByRole('radio', { name: /Dày/ }).check();
    await page.getByLabel('Tạo giọng đọc', { exact: true }).check();
    await page.getByLabel('Nội dung lời thoại').fill('Một con chim mang cành cây về tổ. Nó xây tổ để bảo vệ chim non.');
    await page.getByLabel('Nội dung lời thoại').press('End');
    await page.keyboard.type(' A bird');
    assert.ok((await page.getByLabel('Nội dung lời thoại').inputValue()).endsWith(' A bird'), 'Space is available while writing narration');
    await page.reload();
    await page.getByRole('button', { name: 'Tạo video mới', exact: true }).click();
    assert.equal(await page.getByRole('radio', { name: /Dày/ }).isChecked(), true);
    await page.getByRole('group', { name: 'Nhịp đổi ảnh' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: '/tmp/wevic-density-desktop.png' });
    await page.getByRole('button', { name: 'Tạo video', exact: true }).click();
    await page.waitForTimeout(500);
    assert.equal(submitted.imageDensity, 'dense');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('group', { name: 'Nhịp đổi ảnh' }).scrollIntoViewIfNeeded();
    const box = await page.getByRole('group', { name: 'Nhịp đổi ảnh' }).boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= 390);
    await page.screenshot({ path: '/tmp/wevic-density-mobile.png' });
    console.log('PASS: density persists, request contains selection, mobile control fits. No generation performed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
