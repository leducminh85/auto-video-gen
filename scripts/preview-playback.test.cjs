const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.audioSeeks = [];
      document.addEventListener('seeking', event => {
        if (event.target.tagName === 'AUDIO') window.audioSeeks.push(event.target.currentTime);
      }, true);
    });
    await page.goto(process.env.STUDIO_URL || 'http://localhost:3000');
    await page.locator('.audio-waveform[data-status="ready"]').waitFor();
    const project = await page.evaluate(() => fetch('/api/project').then(r => r.json()));
    await page.getByRole('button', { name: 'Phát', exact: true }).click();
    const started = Date.now();
    await page.waitForTimeout(20000);
    const sample = await page.evaluate(() => ({
      frameTime: Number(document.querySelector('.preview-caption').textContent.split('/')[0]),
      audio: [...document.querySelectorAll('audio')].filter(a => !a.paused && a.currentSrc).map(a => ({ src: a.currentSrc, time: a.currentTime })),
      seeks: window.audioSeeks,
    }));
    assert.ok(Math.abs(sample.frameTime - (Date.now() - started) / 1000) < 0.6, `Player clock drift: ${JSON.stringify(sample)}`);
    assert.equal(sample.audio.length, 1, 'Only one scene audio plays');
    const scene = project.scenes.find(s => sample.audio[0].src.includes(s.audio_file));
    assert.ok(scene, 'Audio belongs to a project scene');
    assert.ok(Math.abs(sample.audio[0].time + scene.start_frame / project.metadata.fps - sample.frameTime) < 0.3, 'Audio and image clocks stay aligned');
    assert.ok(sample.seeks.length <= 1, `Unexpected repeated audio corrections: ${sample.seeks}`);
    await page.getByRole('button', { name: 'Tạm dừng', exact: true }).click();
    const paused = await page.locator('.preview-caption').innerText();
    await page.waitForTimeout(500);
    assert.equal(await page.locator('.preview-caption').innerText(), paused);
    await page.getByRole('button', { name: /^Chọn cảnh 2:/ }).click();
    const seekTime = Number((await page.locator('.preview-caption').innerText()).split('/')[0]);
    assert.ok(Math.abs(seekTime - project.scenes[1].start_frame / project.metadata.fps) < 0.04);
    await page.getByRole('button', { name: 'Phát', exact: true }).click();
    await page.waitForTimeout(1000);
    const resumedStart = Number((await page.locator('.preview-caption').innerText()).split('/')[0]);
    await page.waitForTimeout(2000);
    const resumed = Number((await page.locator('.preview-caption').innerText()).split('/')[0]);
    assert.ok(Math.abs(resumed - resumedStart - 2) < 0.4, `Resuming after seek retains the playback clock: ${seekTime} -> ${resumed}`);
    assert.deepEqual(errors, []);
    console.log('PASS: real project playback, no repeated audio seeking, audio/image clock alignment, pause, scene seek and resume.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
