const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');

/**
 * Multi-Tier FLUX.1 Image Generation Engine
 * Tier 1: Local Mac Metal Server (Draw Things / SD WebUI / ComfyUI on http://127.0.0.1:7860)
 * Tier 2: Local MLX Apple Silicon (mflux-generate if HF_TOKEN is configured)
 * Tier 3: Free Cloud FLUX.1 (Pollinations.ai - Zero API key, 100% free)
 */

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
        negative_prompt: 'blurry, distorted, low quality, photorealistic, ugly',
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
          .resize(1920, 1080, { fit: 'cover', position: 'centre' })
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
    const cleanPrompt = prompt.replace(/\r?\n/g, ' ').trim().substring(0, 600);
    fs.writeFileSync(tempPromptFile, cleanPrompt, 'utf8');

    console.log(`   🎨 [FLUX.1 MLX] Đang render cục bộ bằng mflux trên GPU Metal Apple M4...`);
    execSync(
      `mflux-generate --model dhairyashil/FLUX.1-schnell-mflux-4bit --base-model schnell --steps 4 --width 1024 --height 576 --prompt-file "${tempPromptFile}" --output "${tempMfluxOut}"`,
      { stdio: 'pipe', timeout: 180000 }
    );

    if (fs.existsSync(tempMfluxOut) && fs.statSync(tempMfluxOut).size > 5000) {
      await sharp(tempMfluxOut)
        .resize(1920, 1080, { fit: 'cover', position: 'centre' })
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

/**
 * Generate image via Free Cloud FLUX.1 (Pollinations.ai)
 * 100% Free, NO API Key needed, high aesthetic quality
 */
async function generateViaFreeFlux({ prompt, outputPath }) {
  const cleanPrompt = prompt
    .replace(/[^\p{L}\p{N}\s.,$%-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 300);

  const encodedPrompt = encodeURIComponent(
    `${cleanPrompt}, 2D cartoon explainer, minimalist stickman style, warm paper background, clear vector line art, 1080p`
  );
  const seed = Math.floor(Math.random() * 999999);

  const candidateUrls = [
    `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=1280&height=720&nologo=true&seed=${seed}`,
    `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${seed}`,
    `https://image.pollinations.ai/prompt/${encodedPrompt}?model=turbo&width=1280&height=720&nologo=true&seed=${seed}`,
  ];

  for (const url of candidateUrls) {
    try {
      console.log(`   🎨 [FLUX.1 Cloud Free] Đang tạo ảnh AI chất lượng cao (miễn phí)...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s per candidate

      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Apple Silicon)' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (buffer.length > 5000) {
          await sharp(buffer)
            .resize(1920, 1080, { fit: 'cover', position: 'centre' })
            .png({ quality: 95 })
            .toFile(outputPath);
          return { success: true, method: 'flux_free' };
        }
      }
    } catch (_) {}
  }
  return { success: false };
}

/**
 * Comprehensive FLUX.1 Engine with Automatic Cascading Fallback
 * Prioritizes FLUX.1 generation for video rendering
 */
async function generateFluxImage({ prompt, diegeticLabel, outputPath }) {
  const fullPrompt = diegeticLabel
    ? `${prompt}. Hand-drawn stickman comic explainer style. The exact text "${diegeticLabel}" is legibly written on a sign, label, or chalkboard.`
    : `${prompt}. Hand-drawn stickman comic explainer style, clean line art.`;

  // 1. If explicit local mflux requested via env
  if (process.env.USE_LOCAL_MFLUX === 'true') {
    const mfluxRes = await generateViaMflux({ prompt: fullPrompt, outputPath });
    if (mfluxRes.success) return mfluxRes;
  }

  // 2. Try Local Draw Things / SD WebUI Server on Mac M4 Metal (127.0.0.1:7860)
  const localRes = await generateViaLocalServer({ prompt: fullPrompt, outputPath });
  if (localRes.success) {
    return localRes;
  }

  // 3. Try Fast Cloud FLUX.1 (Pollinations - Zero key needed, instant 2-3s response)
  const freeRes = await generateViaFreeFlux({ prompt: fullPrompt, outputPath });
  if (freeRes.success) {
    return freeRes;
  }

  // 4. Try Local Apple Silicon Metal mflux on Mac M4
  const mfluxRes = await generateViaMflux({ prompt: fullPrompt, outputPath });
  if (mfluxRes.success) {
    return mfluxRes;
  }

  return { success: false };
}

module.exports = {
  generateFluxImage,
  generateViaLocalServer,
  generateViaMflux,
  generateViaFreeFlux,
};
