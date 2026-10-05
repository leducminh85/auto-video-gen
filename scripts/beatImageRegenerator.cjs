const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const ImageGenerationManager = require('./image-generation/ImageGenerationManager.cjs');

/**
 * Regenerate a single beat image via AI (Google AI Studio / Flux Local)
 * and immediately re-render its FFmpeg clip so the entire video remains in sync.
 */
async function regenerateBeatImage({
  sceneId,
  subIndex = 1,
  prompt,
  diegeticLabel = '',
  durationInFrames = 90,
  preferredProvider = null,
}) {
  if (!sceneId || !prompt) {
    throw new Error('Thiếu sceneId hoặc prompt để tạo lại ảnh.');
  }

  const sId = Number(sceneId);
  const bIdx = Number(subIndex);
  const beatImageFile = `scene_${sId}_beat_${bIdx}.png`;
  const imagesDir = path.resolve(process.cwd(), 'public/images');
  const beatPngPath = path.join(imagesDir, beatImageFile);
  const tempSceneDir = path.resolve(process.cwd(), `public/temp_scene_${sId}`);
  const beatClipOut = path.join(tempSceneDir, `beat_${bIdx}.mp4`);
  const sceneClipOut = path.resolve(process.cwd(), `public/clip_${sId}.mp4`);
  const audioPath = path.resolve(process.cwd(), `public/audio/scene_${sId}.mp3`);

  // Ensure directories exist
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
  if (!fs.existsSync(tempSceneDir)) fs.mkdirSync(tempSceneDir, { recursive: true });

  // Delete stale beat image before generating
  try {
    if (fs.existsSync(beatPngPath)) fs.unlinkSync(beatPngPath);
  } catch (_) {}

  console.log(`\n========================================================`);
  console.log(`🎨 [Regenerate AI] Đang tạo lại ảnh cho Cảnh ${sId} Nhịp ${bIdx}...`);
  console.log(`Prompt: "${prompt.substring(0, 100)}..."`);
  if (diegeticLabel) console.log(`Diegetic Text: "${diegeticLabel}"`);
  console.log(`========================================================\n`);

  const manager = ImageGenerationManager.getInstance();
  const assignedTabId = (bIdx % 2 === 0) ? 1 : 2;

  const result = await manager.generateImage({
    prompt,
    diegeticLabel,
    outputPath: beatPngPath,
    requestId: `regen_s${sId}_b${bIdx}_${Date.now()}`,
    preferredProvider,
    imageIndex: bIdx,
    tabId: assignedTabId,
  });

  if (!result.success || !fs.existsSync(beatPngPath) || fs.statSync(beatPngPath).size < 5000) {
    throw new Error(result.error?.message || 'Tạo ảnh AI không thành công.');
  }

  // If subIndex === 1, also update scene hero image
  if (bIdx === 1) {
    try {
      fs.copyFileSync(beatPngPath, path.join(imagesDir, `scene_${sId}.png`));
    } catch (_) {}
  }

  const ffmpegBin = fs.existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg';

  // Re-render beat clip with smooth micro-motion (Ken-Burns push-in)
  const beatSec = (Number(durationInFrames || 90) / 30).toFixed(2);
  try {
    execSync(
      `${ffmpegBin} -y -loop 1 -i "${beatPngPath}" -vf "scale=1920:1080,zoompan=z='min(zoom+0.0003,1.015)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30" -c:v libx264 -t ${beatSec} -pix_fmt yuv420p -r 30 -an "${beatClipOut}"`,
      { stdio: 'ignore' }
    );
    console.log(`✓ [FFmpeg] Re-rendered beat clip: ${beatClipOut}`);
  } catch (err) {
    console.warn(`⚠️ Lỗi render beat clip:`, err.message);
  }

  // Re-concatenate scene clip if audio exists
  const beatListFile = path.join(tempSceneDir, 'beat_list.txt');
  if (fs.existsSync(beatListFile) && fs.existsSync(audioPath)) {
    try {
      execSync(
        `${ffmpegBin} -y -f concat -safe 0 -i "${beatListFile}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -af "apad=pad_dur=0.4" -shortest "${sceneClipOut}"`,
        { stdio: 'ignore' }
      );
      console.log(`✓ [FFmpeg] Re-assembled scene clip: ${sceneClipOut}`);
    } catch (err) {
      console.warn(`⚠️ Lỗi ghép scene clip:`, err.message);
    }
  }

  const timestamp = Date.now();
  return {
    success: true,
    sceneId: sId,
    subIndex: bIdx,
    imageFile: beatImageFile,
    imageUrl: `/images/${beatImageFile}?t=${timestamp}`,
    timestamp,
    provider: result.provider || 'google_ai_studio',
  };
}

module.exports = {
  regenerateBeatImage,
};
