const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');

const LOCAL_SD_PORT = process.env.LOCAL_SD_PORT || '7860';
const LOCAL_SD_API_URL = process.env.LOCAL_SD_API_URL || `http://127.0.0.1:${LOCAL_SD_PORT}/sdapi/v1/txt2img`;

/**
 * Fast ping to check if local Draw Things / WebUI server is active
 */
async function isLocalServerAlive(url = `http://127.0.0.1:${LOCAL_SD_PORT}`) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.status < 500;
  } catch (_) {
    return false;
  }
}

/**
 * Generate image via Local Draw Things / SD WebUI / Forge API (Metal accelerated on Mac M4)
 */
async function generateViaLocalServer({ prompt, outputPath, width = 1024, height = 576, steps = 4 }) {
  const isAlive = await isLocalServerAlive();
  if (!isAlive) return { success: false };

  try {
    console.log(`   🎨 [FLUX.1 Local Server] Đang tạo ảnh qua Draw Things / Local WebUI (127.0.0.1:${LOCAL_SD_PORT})...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const res = await fetch(LOCAL_SD_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        steps,
        width,
        height,
        cfg_scale: 3.5,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const b64 = data.images?.[0];
      if (b64) {
        const buffer = Buffer.from(b64, 'base64');
        await sharp(buffer)
          .resize(1920, 1080, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          })
          .png({ quality: 95 })
          .toFile(outputPath);
        return { success: true, method: 'local_flux_server' };
      }
    }
  } catch (err) {
    console.warn(`   ⚠️ Lỗi Local Server FLUX:`, err.message);
  }
  return { success: false };
}

// Serialize local GPU execution to avoid Metal memory contention
let mfluxLock = Promise.resolve();

/**
 * Generate image via local Apple Silicon mflux on Mac M4 Metal GPU
 */
async function generateViaMflux({ prompt, outputPath }) {
  const prevLock = mfluxLock;
  let releaseLock;
  mfluxLock = new Promise((resolve) => { releaseLock = resolve; });
  await prevLock;

  const tempPromptFile = outputPath.replace('.png', '_prompt.txt');
  const tempMfluxOut = outputPath.replace('.png', '_mflux.png');
  try {
    const cleanPrompt = prompt.replace(/\r?\n/g, ' ').trim();
    fs.writeFileSync(tempPromptFile, cleanPrompt, 'utf8');

    console.log(`   🎨 [FLUX.1 MLX] Đang render cục bộ bằng mflux trên GPU Metal Apple M4...`);
    execSync(
      `mflux-generate --model dhairyashil/FLUX.1-schnell-mflux-4bit --base-model schnell --steps 4 --width 1024 --height 576 --prompt-file "${tempPromptFile}" --output "${tempMfluxOut}"`,
      { stdio: 'pipe', timeout: 180000 }
    );

    if (fs.existsSync(tempMfluxOut) && fs.statSync(tempMfluxOut).size > 5000) {
      await sharp(tempMfluxOut)
        .resize(1920, 1080, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .png({ quality: 95 })
        .toFile(outputPath);
      try { fs.unlinkSync(tempMfluxOut); } catch (_) {}
      try { fs.unlinkSync(tempPromptFile); } catch (_) {}
      return { success: true, method: 'local_mflux' };
    }
  } catch (err) {
    console.warn(`   ⚠️ FLUX.1 MLX chưa sẵn sàng:`, err.message);
  } finally {
    try { if (fs.existsSync(tempPromptFile)) fs.unlinkSync(tempPromptFile); } catch (_) {}
    try { if (fs.existsSync(tempMfluxOut)) fs.unlinkSync(tempMfluxOut); } catch (_) {}
    if (typeof releaseLock === 'function') releaseLock();
  }
  return { success: false };
}

module.exports = {
  isLocalServerAlive,
  generateViaLocalServer,
  generateViaMflux,
};
