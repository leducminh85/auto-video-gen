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

/**
 * Generate image via local Apple Silicon mflux on Mac M4 Metal GPU
 */
async function generateViaMflux({ prompt, outputPath }) {
  try {
    const tempMfluxOut = outputPath.replace('.png', '_mflux.png');
    const safePrompt = prompt.replace(/"/g, '\\"').substring(0, 500);

    console.log(`   🎨 [FLUX.1 MLX] Đang render cục bộ bằng mflux trên GPU Metal Apple M4...`);
    execSync(
      `mflux-generate --model dhairyashil/FLUX.1-schnell-mflux-4bit --base-model schnell --steps 4 --width 1024 --height 576 --prompt "${safePrompt}" --output "${tempMfluxOut}"`,
      { stdio: 'pipe', timeout: 120000 }
    );

    if (fs.existsSync(tempMfluxOut) && fs.statSync(tempMfluxOut).size > 5000) {
      await sharp(tempMfluxOut)
        .resize(1920, 1080, { fit: 'cover', position: 'centre' })
        .png({ quality: 95 })
        .toFile(outputPath);
      try { fs.unlinkSync(tempMfluxOut); } catch (_) {}
      return { success: true, method: 'local_mflux' };
    }
  } catch (err) {
    console.warn(`   ⚠️ FLUX.1 MLX chưa sẵn sàng:`, err.message);
  }
  return { success: false };
}

/**
 * Generate image via Free Cloud FLUX.1 (Pollinations.ai)
 * 100% Free, NO API Key needed, high aesthetic quality
 */
async function generateViaFreeFlux({ prompt, outputPath }) {
  try {
    console.log(`   🎨 [FLUX.1 Cloud Free] Đang tạo ảnh FLUX.1 chất lượng cao (miễn phí, không cần key)...`);
    const cleanPrompt = prompt
      .replace(/[^\w\s.,$%-]/g, ' ')
      .trim()
      .substring(0, 300);

    const encodedPrompt = encodeURIComponent(
      `${cleanPrompt}, 2D cartoon explainer, minimalist stickman style, warm paper background, clear vector line art, 1080p`
    );
    const seed = Math.floor(Math.random() * 999999);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=1280&height=720&nologo=true&seed=${seed}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

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
  } catch (err) {
    console.warn(`   ⚠️ FLUX Cloud Free:`, err.message);
  }
  return { success: false };
}

/**
 * Comprehensive FLUX.1 Engine with Automatic Cascading Fallback
 */
async function generateFluxImage({ prompt, diegeticLabel, outputPath }) {
  const fullPrompt = diegeticLabel
    ? `${prompt}. Hand-drawn stickman comic explainer style. The exact text "${diegeticLabel}" is legibly written on a sign, label, or chalkboard.`
    : `${prompt}. Hand-drawn stickman comic explainer style, clean line art.`;

  // 1. Try Local Server on Mac M4 first (Draw Things / WebUI at 127.0.0.1:7860)
  const localRes = await generateViaLocalServer({ prompt: fullPrompt, outputPath });
  if (localRes.success) {
    return localRes;
  }

  // 2. Try Local mflux CLI (if HF_TOKEN is present)
  const mfluxRes = await generateViaMflux({ prompt: fullPrompt, outputPath });
  if (mfluxRes.success) {
    return mfluxRes;
  }

  // 3. Try Free Cloud FLUX.1 (Pollinations - Zero key needed)
  const freeRes = await generateViaFreeFlux({ prompt: fullPrompt, outputPath });
  if (freeRes.success) {
    return freeRes;
  }

  return { success: false };
}

module.exports = {
  generateFluxImage,
  generateViaLocalServer,
  generateViaMflux,
  generateViaFreeFlux,
};
