const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const googleTTS = require('google-tts-api');
const sharp = require('sharp');

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const AUDIO_DIR = path.join(PUBLIC_DIR, 'audio');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src/data');

[PUBLIC_DIR, AUDIO_DIR, IMAGES_DIR, SRC_DATA_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Character Poses SVGs
const POSES = {
  explaining: (x, y, stroke = '#232323') => `
    <g transform="translate(${x}, ${y})">
      <circle cx="100" cy="100" r="50" fill="#FFFFFF" stroke="${stroke}" stroke-width="8" />
      <circle cx="88" cy="90" r="6" fill="${stroke}" />
      <circle cx="118" cy="90" r="6" fill="${stroke}" />
      <path d="M 88 120 Q 103 135 118 120" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round" />
      <line x1="100" y1="150" x2="100" y2="300" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <path d="M 100 180 L 160 210 L 220 180" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <path d="M 100 180 L 50 230" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <line x1="100" y1="300" x2="60" y2="440" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <line x1="100" y1="300" x2="140" y2="440" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
    </g>
  `,
  shocked: (x, y, stroke = '#232323') => `
    <g transform="translate(${x}, ${y})">
      <circle cx="100" cy="100" r="52" fill="#FFFFFF" stroke="${stroke}" stroke-width="8" />
      <ellipse cx="85" cy="90" rx="7" ry="11" fill="${stroke}" />
      <ellipse cx="115" cy="90" rx="7" ry="11" fill="${stroke}" />
      <ellipse cx="100" cy="126" rx="14" ry="18" fill="${stroke}" />
      <path d="M 155 75 Q 170 85 160 95 Q 150 90 155 75 Z" fill="#38BDF8" stroke="${stroke}" stroke-width="3" />
      <path d="M 100 155 L 50 115 L 60 65" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <path d="M 100 155 L 150 115 L 140 65" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <line x1="100" y1="155" x2="100" y2="310" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <path d="M 100 310 L 65 410 L 50 490" fill="none" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <path d="M 100 310 L 135 410 L 150 490" fill="none" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
    </g>
  `,
  thinking: (x, y, stroke = '#232323') => `
    <g transform="translate(${x}, ${y})">
      <circle cx="100" cy="100" r="50" fill="#FFFFFF" stroke="${stroke}" stroke-width="8" />
      <circle cx="85" cy="90" r="5" fill="${stroke}" />
      <circle cx="115" cy="90" r="5" fill="${stroke}" />
      <line x1="90" y1="125" x2="115" y2="125" stroke="${stroke}" stroke-width="5" stroke-linecap="round" />
      <line x1="100" y1="150" x2="100" y2="300" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <path d="M 100 180 L 140 230 L 125 140" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <path d="M 100 180 L 55 240" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <line x1="100" y1="300" x2="70" y2="440" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <line x1="100" y1="300" x2="130" y2="440" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
    </g>
  `,
  celebrating: (x, y, stroke = '#232323') => `
    <g transform="translate(${x}, ${y})">
      <circle cx="100" cy="100" r="50" fill="#FFFFFF" stroke="${stroke}" stroke-width="8" />
      <circle cx="85" cy="88" r="6" fill="${stroke}" />
      <circle cx="115" cy="88" r="6" fill="${stroke}" />
      <path d="M 85 115 Q 100 135 115 115" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round" />
      <line x1="100" y1="150" x2="100" y2="300" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <path d="M 100 170 L 40 100 L 20 60" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <path d="M 100 170 L 160 100 L 180 60" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <line x1="100" y1="300" x2="60" y2="440" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <line x1="100" y1="300" x2="140" y2="440" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
    </g>
  `,
};

const BG_PALETTES = [
  '#FBF7ED',
  '#F0FDF4',
  '#EFF6FF',
  '#FFF7ED',
  '#FAF5FF',
  '#F8FAFC',
];

/**
 * Generate high-quality Vietnamese TTS audio with fallback
 */
async function generateTTSAudio(text, voiceId, speed, outputPath) {
  const tempRaw = path.join('/tmp', `tts_raw_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`);
  let generated = false;

  // 1. Try Microsoft Edge Neural voices or macOS say
  if (voiceId === 'vi-VN-Standard-A') {
    try {
      execSync(`python3 -m edge_tts --voice "vi-VN-HoaiMyNeural" --text "${text.replace(/"/g, '\\"')}" --write-media "${tempRaw}"`, { stdio: 'pipe' });
      generated = true;
    } catch (e) {}
  } else if (voiceId === 'vi-VN-Standard-B') {
    try {
      execSync(`python3 -m edge_tts --voice "vi-VN-NamMinhNeural" --text "${text.replace(/"/g, '\\"')}" --write-media "${tempRaw}"`, { stdio: 'pipe' });
      generated = true;
    } catch (e) {}
  } else if (voiceId === 'vi-VN-Standard-C') {
    try {
      execSync(`say -v Linh "${text.replace(/"/g, '\\"')}" -o /tmp/say_tmp.aiff && /opt/homebrew/bin/ffmpeg -y -i /tmp/say_tmp.aiff "${tempRaw}" 2>/dev/null`, { stdio: 'pipe' });
      generated = true;
    } catch (e) {
      try {
        execSync(`python3 -m edge_tts --voice "vi-VN-HoaiMyNeural" --text "${text.replace(/"/g, '\\"')}" --write-media "${tempRaw}"`, { stdio: 'pipe' });
        generated = true;
      } catch (e2) {}
    }
  } else if (voiceId === 'vi-VN-Standard-D') {
    try {
      execSync(`python3 -m edge_tts --voice "vi-VN-NamMinhNeural" --text "${text.replace(/"/g, '\\"')}" --write-media "${tempRaw}"`, { stdio: 'pipe' });
      generated = true;
    } catch (e) {}
  }

  // Fallback to Google TTS if edge-tts/say failed or for vi-VN-Studio-AI
  if (!generated) {
    try {
      const base64 = await googleTTS.getAudioBase64(text, {
        lang: 'vi',
        slow: false,
        host: 'https://translate.google.com',
        timeout: 12000,
      });
      fs.writeFileSync(tempRaw, Buffer.from(base64, 'base64'));
      generated = true;
    } catch (e) {
      console.error('Google TTS error:', e);
    }
  }

  // Adjust playback speed if speed !== 1.0 using ffmpeg atempo
  const safeSpeed = Math.max(0.5, Math.min(2.0, Number(speed) || 1.0));
  if (safeSpeed !== 1.0) {
    execSync(`/opt/homebrew/bin/ffmpeg -y -i "${tempRaw}" -filter:a "atempo=${safeSpeed}" -vn "${outputPath}" 2>/dev/null`);
    try { fs.unlinkSync(tempRaw); } catch (_) {}
  } else {
    fs.copyFileSync(tempRaw, outputPath);
    try { fs.unlinkSync(tempRaw); } catch (_) {}
  }

  // Probe exact duration with ffprobe
  let durationInSeconds = 4.0;
  try {
    const probe = execSync(`/opt/homebrew/bin/ffprobe -i "${outputPath}" -show_entries format=duration -v quiet -of csv="p=0"`).toString().trim();
    durationInSeconds = parseFloat(probe) || 4.0;
  } catch (err) {
    const stat = fs.statSync(outputPath);
    durationInSeconds = Math.max(3.0, (text.split(/\s+/).length / 3.0) / safeSpeed);
  }

  return durationInSeconds;
}

/**
 * Generate Scene SVG
 */
function createSceneSvg(scene, index, totalScenes) {
  const bg = BG_PALETTES[index % BG_PALETTES.length];
  const poseKeys = ['explaining', 'shocked', 'thinking', 'celebrating'];
  const poseKey = poseKeys[index % poseKeys.length];
  const charSvg = POSES[poseKey](240, 480);

  // Clean title & text
  const cleanTitle = (scene.title || `Cảnh ${index + 1}`).replace(/<[^>]+>/g, '');
  const cleanText = (scene.text || '').replace(/<[^>]+>/g, '');
  const shortText = cleanText.length > 95 ? cleanText.substring(0, 92) + '...' : cleanText;

  return `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <!-- Background flat pastel -->
      <rect width="1920" height="1080" fill="${bg}" />
      
      <!-- Top header bar -->
      <rect x="0" y="0" width="1920" height="64" fill="rgba(15, 23, 42, 0.05)" />
      <text x="60" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="22" fill="#475569">
        CẢNH ${scene.id || index + 1}/${totalScenes} • ${cleanTitle.toUpperCase()}
      </text>
      <text x="1860" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="20" text-anchor="end" fill="#94A3B8">
        STICKMAN VIDEO STUDIO
      </text>

      <!-- Stickman Main Character -->
      ${charSvg}

      <!-- Center Explainer Card / Visual Focal Point -->
      <g transform="translate(760, 240)">
        <rect x="0" y="0" width="980" height="600" rx="28" fill="#FFFFFF" stroke="#232323" stroke-width="7" />
        
        <!-- Header ribbon -->
        <rect x="0" y="0" width="980" height="90" rx="24" fill="#6366F1" stroke="#232323" stroke-width="6" />
        <text x="490" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="36" text-anchor="middle" fill="#FFFFFF" letter-spacing="1">
          ${cleanTitle}
        </text>

        <!-- Illustration Graphics inside Card -->
        <g transform="translate(60, 140)">
          <!-- Idea / Lightbulb -->
          <circle cx="120" cy="120" r="64" fill="#FEF08A" stroke="#232323" stroke-width="6" />
          <path d="M 120 40 L 120 16 M 176 64 L 194 46 M 200 120 L 224 120 M 176 176 L 194 194 M 64 64 L 46 46 M 40 120 L 16 120 M 64 176 L 46 194" stroke="#EAB308" stroke-width="6" stroke-linecap="round" />
          <text x="120" y="138" font-size="52" text-anchor="middle">💡</text>

          <!-- Key Text Bullets -->
          <g transform="translate(240, 40)">
            <rect x="0" y="0" width="620" height="64" rx="14" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="3" />
            <text x="30" y="42" font-family="sans-serif" font-weight="800" font-size="24" fill="#334155">
              📌 Trọng tâm: ${cleanTitle}
            </text>

            <rect x="0" y="90" width="620" height="120" rx="14" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="3" />
            <text x="30" y="135" font-family="sans-serif" font-weight="600" font-size="22" fill="#475569">
              ${cleanText.length > 55 ? cleanText.substring(0, 52) + '...' : cleanText}
            </text>
            <text x="30" y="175" font-family="sans-serif" font-weight="500" font-size="18" fill="#64748B">
              Đồng bộ hoạt ảnh Stickman &amp; Giọng đọc AI tự nhiên
            </text>
          </g>
        </g>

        <!-- Bottom badge inside card -->
        <rect x="60" y="470" width="860" height="80" rx="16" fill="#F8FAFC" stroke="#232323" stroke-width="4" />
        <text x="490" y="522" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="24" text-anchor="middle" fill="#0F172A">
          ✨ Hoạt ảnh 2D Whiteboard Explainer • Độ phân giải 1080p
        </text>
      </g>

      <!-- Bottom Subtitle Bar -->
      <g transform="translate(140, 930)">
        <rect x="0" y="0" width="1640" height="100" rx="22" fill="rgba(15, 23, 42, 0.94)" stroke="rgba(255, 255, 255, 0.2)" stroke-width="3" />
        <text x="820" y="62" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="26" text-anchor="middle" fill="#FFFFFF">
          ${shortText}
        </text>
      </g>
    </svg>
  `;
}

/**
 * Main Video Generator Function
 */
async function generateVideo({ title, subtitle, voice, speed, scenes }) {
  const timestamp = Date.now();
  const selectedVoice = voice || 'vi-VN-Standard-A';
  const playbackSpeed = Number(speed) || 1.0;

  console.log(`\n======================================================`);
  console.log(`[VIDEO GENERATOR] Bắt đầu tạo video: "${title}"`);
  console.log(`Voice: ${selectedVoice}, Tốc độ: ${playbackSpeed}x, Số cảnh: ${scenes.length}`);
  console.log(`======================================================`);

  const finalizedScenes = [];
  const clipPaths = [];
  let totalFrames = 0;

  for (let i = 0; i < scenes.length; i++) {
    const rawScene = scenes[i];
    const sceneId = i + 1;
    const sceneTitle = rawScene.title || `Cảnh ${sceneId}`;
    const sceneText = rawScene.text || '';

    const audioFileName = `scene_${sceneId}.mp3`;
    const audioPath = path.join(AUDIO_DIR, audioFileName);

    const imageFileName = `scene_${sceneId}.png`;
    const imagePath = path.join(IMAGES_DIR, imageFileName);

    console.log(`[Cảnh ${sceneId}/${scenes.length}] Đang tạo TTS & Visual: "${sceneTitle}"...`);

    // 1. Generate Audio
    const durationInSeconds = await generateTTSAudio(sceneText, selectedVoice, playbackSpeed, audioPath);
    // 30 FPS standard + 12 frames padding (~0.4s)
    const durationInFrames = Math.ceil(durationInSeconds * 30) + 12;

    // 2. Generate SVG and PNG image
    const svgContent = createSceneSvg({ id: sceneId, title: sceneTitle, text: sceneText }, i, scenes.length);
    await sharp(Buffer.from(svgContent)).png({ quality: 95 }).toFile(imagePath);

    // 3. Render video clip with ffmpeg
    const clipOut = path.join(PUBLIC_DIR, `clip_${sceneId}.mp4`);
    const clipDuration = (durationInFrames / 30).toFixed(2);
    try {
      execSync(`/opt/homebrew/bin/ffmpeg -y -loop 1 -t ${clipDuration} -i "${imagePath}" -i "${audioPath}" -c:v libx264 -tune stillimage -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -af "apad=pad_dur=0.4" -shortest "${clipOut}"`, { stdio: 'ignore' });
      clipPaths.push(clipOut);
    } catch (clipErr) {
      console.warn(`ffmpeg clip error for scene ${sceneId}:`, clipErr);
    }

    const sceneRecord = {
      id: sceneId,
      title: sceneTitle,
      text: sceneText,
      prompt: `Minimalist 2D line art, stickman explaining ${sceneTitle}, clean whiteboard explainer style.`,
      audio_file: audioFileName,
      image_file: imageFileName,
      duration_in_seconds: Number(durationInSeconds.toFixed(2)),
      duration_in_frames: durationInFrames,
      start_frame: totalFrames,
    };

    totalFrames += durationInFrames;
    finalizedScenes.push(sceneRecord);
  }

  // Concatenate clips into final-video.mp4
  const finalVideoPath = path.join(PUBLIC_DIR, 'final-video.mp4');
  if (clipPaths.length > 0) {
    const listFile = path.join(PUBLIC_DIR, 'clips_list.txt');
    const listContent = clipPaths.map((p) => `file '${p}'`).join('\n');
    fs.writeFileSync(listFile, listContent);
    try {
      execSync(`/opt/homebrew/bin/ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${finalVideoPath}"`, { stdio: 'ignore' });
      console.log(`✓ Đã ghép xong final-video.mp4 (${fs.statSync(finalVideoPath).size} bytes)`);
    } catch (concatErr) {
      console.warn('ffmpeg concat error:', concatErr);
    }
  }

  const metadata = {
    title: title || 'Video Stickman Mới',
    subtitle: subtitle || `Giọng đọc ${playbackSpeed}x`,
    fps: 30,
    width: 1920,
    height: 1080,
    total_scenes: finalizedScenes.length,
    total_duration_in_frames: totalFrames,
    total_duration_in_seconds: (totalFrames / 30).toFixed(2),
    created_at: new Date().toISOString(),
    voice: selectedVoice,
    speed: playbackSpeed,
  };

  const outputData = {
    metadata,
    scenes: finalizedScenes,
  };

  // Write scenes.json in public/ and src/data/
  fs.writeFileSync(path.join(PUBLIC_DIR, 'scenes.json'), JSON.stringify(outputData, null, 2));
  fs.writeFileSync(path.join(SRC_DATA_DIR, 'scenes.json'), JSON.stringify(outputData, null, 2));

  console.log(`🎉 [XONG]: Đã tạo thành công video gồm ${finalizedScenes.length} cảnh, tổng thời lượng ${(totalFrames / 30).toFixed(1)}s.`);

  return {
    success: true,
    metadata,
    scenes: finalizedScenes,
    finalVideoUrl: '/final-video.mp4',
  };
}

module.exports = {
  generateVideo,
  generateTTSAudio,
};
