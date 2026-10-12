const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    let submitted;
    await page.route('**/api/generate-video', route => {
      submitted = route.request().postDataJSON();
      return route.fulfill({ status: 200, contentType: 'application/x-ndjson', body: JSON.stringify({ type: 'error', error: 'Kế hoạch AI chưa đạt: JSON không hợp lệ.' }) + '\n' });
    });
    await page.goto(`${process.env.STUDIO_URL || 'http://localhost:3000'}/project/new`);
    await page.getByRole('radio', { name: /Dày/ }).check();
    await page.getByLabel('Tạo giọng đọc', { exact: true }).check();
    await page.getByLabel('Nội dung lời thoại').fill('Một con chim mang cành cây về tổ. Nó xây tổ để bảo vệ chim non.');
    await page.getByLabel('Nội dung lời thoại').press('End');
    await page.keyboard.type(' A bird');
    assert.ok((await page.getByLabel('Nội dung lời thoại').inputValue()).endsWith(' A bird'), 'Space is available while writing narration');
    await page.reload();
    assert.equal(await page.getByRole('radio', { name: /Dày/ }).isChecked(), true);
    await page.getByRole('group', { name: 'Nhịp đổi ảnh' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: '/tmp/wevic-density-desktop.png' });
    await page.getByRole('button', { name: 'Tạo video', exact: true }).click();
    await page.getByText('Kế hoạch AI chưa đạt: JSON không hợp lệ.', { exact: true }).waitFor();
    assert.equal(submitted.imageDensity, 'dense');
    assert.ok(submitted.content.endsWith(' A bird'), 'Full narration is passed to the AI pipeline');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('group', { name: 'Nhịp đổi ảnh' }).scrollIntoViewIfNeeded();
    const box = await page.getByRole('group', { name: 'Nhịp đổi ảnh' }).boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= 390);
    await page.screenshot({ path: '/tmp/wevic-density-mobile.png' });
    await page.getByLabel('Nhập audio có sẵn', { exact: true }).check();
    await page.route('**/api/audio/import', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ file: 'import_fixture.wav', duration: 12 }) }));
    await page.getByLabel('Tệp audio', { exact: true }).setInputFiles({ name: 'recording.wav', mimeType: 'audio/wav', buffer: Buffer.from('fixture') });
    await page.getByText('recording.wav', { exact: true }).waitFor();
    await page.getByLabel('Kịch bản tham khảo (không bắt buộc)').fill('');
    assert.equal(await page.getByRole('button', { name: 'Tạo video', exact: true }).isEnabled(), true);
    await page.getByRole('button', { name: 'Tạo video', exact: true }).click();
    await page.getByText('Kế hoạch AI chưa đạt: JSON không hợp lệ.', { exact: true }).waitFor();
    assert.equal(submitted.importedAudio, 'import_fixture.wav');
    assert.equal(submitted.content, '');
    assert.equal(submitted.audioBoundaries, undefined);
    await page.getByLabel('Tạo giọng đọc', { exact: true }).check();
    assert.equal(await page.getByRole('button', { name: 'Tạo video', exact: true }).isDisabled(), true);
    console.log('PASS: density persists, request contains selection, mobile control fits. No generation performed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
