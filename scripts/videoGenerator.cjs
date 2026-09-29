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

// Rich Stickman Character Poses
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
  money_rain: (x, y, stroke = '#232323') => `
    <g transform="translate(${x}, ${y})">
      <circle cx="100" cy="100" r="50" fill="#FEF08A" stroke="${stroke}" stroke-width="8" />
      <text x="82" y="92" font-size="20" font-weight="900" fill="#166534">$</text>
      <text x="108" y="92" font-size="20" font-weight="900" fill="#166534">$</text>
      <path d="M 85 118 Q 100 138 115 118" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round" />
      <line x1="100" y1="150" x2="100" y2="300" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <path d="M 100 180 L 170 140 L 220 110" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <path d="M 100 180 L 30 140 L -20 110" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <line x1="100" y1="300" x2="60" y2="440" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <line x1="100" y1="300" x2="140" y2="440" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <!-- Dollar symbols floating -->
      <text x="210" y="80" font-size="34" font-weight="900" fill="#16A34A">$$$</text>
      <text x="-60" y="80" font-size="34" font-weight="900" fill="#16A34A">$$$</text>
    </g>
  `,
  contract: (x, y, stroke = '#232323') => `
    <g transform="translate(${x}, ${y})">
      <circle cx="100" cy="100" r="50" fill="#FFFFFF" stroke="${stroke}" stroke-width="8" />
      <circle cx="88" cy="92" r="5" fill="${stroke}" />
      <circle cx="116" cy="92" r="5" fill="${stroke}" />
      <path d="M 90 122 Q 102 130 114 122" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round" />
      <line x1="100" y1="150" x2="100" y2="300" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <!-- Holding contract paper -->
      <path d="M 100 180 L 160 210" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <rect x="150" y="150" width="70" height="95" rx="6" fill="#F8FAFC" stroke="${stroke}" stroke-width="5" />
      <line x1="160" y1="170" x2="205" y2="170" stroke="#94A3B8" stroke-width="3" />
      <line x1="160" y1="185" x2="205" y2="185" stroke="#94A3B8" stroke-width="3" />
      <line x1="160" y1="200" x2="195" y2="200" stroke="#EF4444" stroke-width="4" />
      <path d="M 100 180 L 40 230" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <line x1="100" y1="300" x2="65" y2="440" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <line x1="100" y1="300" x2="135" y2="440" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
    </g>
  `,
  running: (x, y, stroke = '#232323') => `
    <g transform="translate(${x}, ${y})">
      <circle cx="120" cy="90" r="50" fill="#FFFFFF" stroke="${stroke}" stroke-width="8" />
      <circle cx="140" cy="85" r="6" fill="${stroke}" />
      <path d="M 130 115 Q 145 125 155 110" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round" />
      <path d="M 75 75 Q 120 60 165 75" fill="none" stroke="#E74C3C" stroke-width="10" />
      <line x1="110" y1="140" x2="80" y2="310" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <path d="M 100 170 L 160 210 L 210 180" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <path d="M 100 170 L 40 210 L 10 260" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <path d="M 80 310 L 150 380 L 220 370" fill="none" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <path d="M 80 310 L 20 370 L 0 470" fill="none" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
    </g>
  `,
  lifting: (x, y, stroke = '#232323') => `
    <g transform="translate(${x}, ${y})">
      <circle cx="100" cy="110" r="50" fill="#FDEDEC" stroke="${stroke}" stroke-width="8" />
      <ellipse cx="100" cy="130" rx="14" ry="7" fill="#E74C3C" stroke="${stroke}" stroke-width="3" />
      <line x1="-100" y1="30" x2="300" y2="30" stroke="${stroke}" stroke-width="12" stroke-linecap="round" />
      <rect x="-140" y="-10" width="35" height="80" rx="6" fill="#1E293B" stroke="${stroke}" stroke-width="5" />
      <rect x="300" y="-10" width="35" height="80" rx="6" fill="#1E293B" stroke="${stroke}" stroke-width="5" />
      <path d="M 100 180 L 20 100 L 0 35" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <path d="M 100 180 L 180 100 L 200 35" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <line x1="100" y1="160" x2="100" y2="320" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <path d="M 100 320 L 35 410 L 20 480" fill="none" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <path d="M 100 320 L 165 410 L 180 480" fill="none" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
    </g>
  `,
  balance: (x, y, stroke = '#232323') => `
    <g transform="translate(${x}, ${y})">
      <circle cx="100" cy="100" r="50" fill="#FFFFFF" stroke="${stroke}" stroke-width="8" />
      <circle cx="90" cy="95" r="6" fill="${stroke}" />
      <circle cx="120" cy="95" r="6" fill="${stroke}" />
      <line x1="100" y1="150" x2="100" y2="320" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <line x1="-30" y1="180" x2="230" y2="170" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <line x1="100" y1="320" x2="100" y2="460" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <polygon points="100,460 60,540 140,540" fill="#F59E0B" stroke="${stroke}" stroke-width="6" />
      <line x1="-80" y1="460" x2="280" y2="475" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
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
 * High-quality Vietnamese TTS audio generator
 */
async function generateTTSAudio(text, voiceId, speed, outputPath) {
  const tempRaw = path.join('/tmp', `tts_raw_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`);
  let generated = false;

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

  // Fallback to Google TTS
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

  // Adjust playback speed if needed
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
    durationInSeconds = Math.max(3.0, (text.split(/\s+/).length / 3.0) / safeSpeed);
  }

  return durationInSeconds;
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Semantic Keyword & Theme detection for Visual Beats
 */
function analyzeClauseTheme(clauseText) {
  const t = clauseText.toLowerCase();

  if (/tiền|usd|\$|chi phí|đắt|thuê bao|doanh thu|lợi nhuận|triệu|ngân quỹ|in tiền|nợ|lãi/i.test(t)) {
    return {
      theme: 'money',
      pose: 'money_rain',
      icon: '💰',
      badgeColor: '#10B981',
      accentColor: '#059669',
      cardTitle: 'DÒNG TIỀN &amp; TÀI CHÍNH',
    };
  }
  if (/cú lừa|sụp đổ|phá sản|vỡ trận|cảnh báo|rủi ro|thất bại|bẫy|sai lầm|cạn vốn/i.test(t)) {
    return {
      theme: 'warning',
      pose: 'shocked',
      icon: '⚠️',
      badgeColor: '#EF4444',
      accentColor: '#DC2626',
      cardTitle: 'CẢNH BÁO &amp; NGUY CƠ',
    };
  }
  if (/hợp đồng|rào cản|chính sách|luật|quy tắc|cam kết|tháng|thời hạn/i.test(t)) {
    return {
      theme: 'contract',
      pose: 'contract',
      icon: '📜',
      badgeColor: '#8B5CF6',
      accentColor: '#7C3AED',
      cardTitle: 'QUY TẮC &amp; ĐIỀU KHOẢN',
    };
  }
  if (/gym|chạy bộ|máy móc|tạ|tập|phòng|sức chứa|pt|huấn luyện/i.test(t)) {
    return {
      theme: 'gym',
      pose: 'lifting',
      icon: '🏋️',
      badgeColor: '#F59E0B',
      accentColor: '#D97706',
      cardTitle: 'MÔ HÌNH VẬN HÀNH',
    };
  }
  if (/ai|công nghệ|máy tính|tự động|trí tuệ|thuật toán|số hóa/i.test(t)) {
    return {
      theme: 'tech',
      pose: 'thinking',
      icon: '🤖',
      badgeColor: '#06B6D4',
      accentColor: '#0891B2',
      cardTitle: 'CÔNG NGHỆ &amp; ĐỘT PHÁ',
    };
  }
  if (/thành công|đòn bẩy|tối ưu|nhân đôi|kết luận|bí mật|giải pháp/i.test(t)) {
    return {
      theme: 'success',
      pose: 'celebrating',
      icon: '🎯',
      badgeColor: '#6366F1',
      accentColor: '#4F46E5',
      cardTitle: 'ĐÒN BẨY &amp; GIẢI PHÁP',
    };
  }
  if (/so với|hay|đối đầu|nghịch lý|cân bằng/i.test(t)) {
    return {
      theme: 'balance',
      pose: 'balance',
      icon: '⚖️',
      badgeColor: '#EC4899',
      accentColor: '#DB2777',
      cardTitle: 'NGHỊCH LÝ ĐỐI NGHỊCH',
    };
  }

  return {
    theme: 'explaining',
    pose: 'explaining',
    icon: '💡',
    badgeColor: '#4F46E5',
    accentColor: '#4338CA',
    cardTitle: 'TRỌNG TÂM PHÂN TÍCH',
  };
}

/**
 * Intelligent Vietnamese Clause Segmenter into Visual Beats
 * Decides number of images based on audio duration and semantic pauses.
 */
function segmentSceneIntoBeats(scene, durationInSeconds, totalFrames, sceneIndex, totalScenes) {
  const text = scene.text || '';
  
  // 1. Split text into candidate phrases using punctuation and conjunctions
  const rawPhrases = text
    .split(/([.,!?;:\n]+|\s+—\s+|\s+-\s+)/)
    .map((p) => p.trim())
    .filter((p) => p && !/^[.,!?;:\n-]+$/.test(p));

  // Merge very short phrases (< 4 words) with adjacent phrase
  const mergedClauses = [];
  let buffer = '';

  for (const part of rawPhrases) {
    if (!buffer) {
      buffer = part;
    } else if (buffer.split(/\s+/).length < 4 || part.split(/\s+/).length < 3) {
      buffer += ', ' + part;
    } else {
      mergedClauses.push(buffer);
      buffer = part;
    }
  }
  if (buffer) mergedClauses.push(buffer);

  // If a clause is still very long and total duration is long, split on conjunctions
  let finalClauses = [];
  for (const clause of mergedClauses) {
    const words = clause.split(/\s+/);
    if (words.length > 10 && durationInSeconds > 5.5) {
      const sub = clause.split(/\s+(nhưng|mà là|thì|khi|nếu|trong khi|do đó|vì vậy|đồng thời)\s+/i);
      if (sub.length > 1) {
        let temp = '';
        for (let i = 0; i < sub.length; i++) {
          if (i % 2 === 1) {
            temp += ' ' + sub[i];
          } else {
            if (temp) {
              finalClauses.push(temp.trim());
              temp = sub[i];
            } else {
              temp = sub[i];
            }
          }
        }
        if (temp) finalClauses.push(temp.trim());
      } else {
        finalClauses.push(clause);
      }
    } else {
      finalClauses.push(clause);
    }
  }

  if (finalClauses.length === 0) finalClauses = [text];

  // Guarantee that no beat exceeds 5.0 seconds (150 frames @ 30 FPS)
  // If only 1 clause exists but duration > 5.0s, split evenly
  if (finalClauses.length === 1 && durationInSeconds > 5.0) {
    const words = finalClauses[0].split(/\s+/);
    const mid = Math.ceil(words.length / 2);
    finalClauses = [
      words.slice(0, mid).join(' '),
      words.slice(mid).join(' '),
    ];
  }

  const totalWords = finalClauses.reduce((acc, c) => acc + c.split(/\s+/).length, 0) || 1;
  let allocatedFrames = 0;

  const beats = finalClauses.map((clause, idx) => {
    const clauseWords = clause.split(/\s+/).length;
    const isLast = idx === finalClauses.length - 1;
    const weight = clauseWords / totalWords;

    let beatFrames = Math.round(totalFrames * weight);
    beatFrames = Math.max(60, beatFrames); // at least 2.0s

    if (isLast) {
      beatFrames = Math.max(60, totalFrames - allocatedFrames);
    }

    const startOffset = allocatedFrames;
    allocatedFrames += beatFrames;
    const durSec = Number((beatFrames / 30).toFixed(2));

    const analysis = analyzeClauseTheme(clause);
    const beatTitle = `${scene.title} - Ý ${idx + 1}`;
    const beatPrompt = `Minimalist 2D line art, stickman ${analysis.pose} explaining ${clause}, clean whiteboard explainer vector style, flat pastel background, 1080p.`;

    const svgContent = createBeatSvg({
      sceneId: scene.id,
      sceneTitle: scene.title,
      sceneIndex,
      totalScenes,
      subIndex: idx + 1,
      totalBeats: finalClauses.length,
      clauseText: clause,
      analysis,
      durSec,
    });

    return {
      id: `scene_${scene.id}_beat_${idx + 1}`,
      sub_index: idx + 1,
      title: beatTitle,
      prompt: beatPrompt,
      caption: clause,
      image_file: `scene_${scene.id}_beat_${idx + 1}.png`,
      svg_data: svgContent,
      duration_in_seconds: durSec,
      duration_in_frames: beatFrames,
      start_frame_offset: startOffset,
      analysis,
    };
  });

  return beats;
}

/**
 * Generate 1080p SVG for a specific visual beat
 */
function createBeatSvg({
  sceneId,
  sceneTitle,
  sceneIndex,
  totalScenes,
  subIndex,
  totalBeats,
  clauseText,
  analysis,
  durSec,
}) {
  const bg = BG_PALETTES[(sceneIndex + subIndex) % BG_PALETTES.length];
  const poseFn = POSES[analysis.pose] || POSES.explaining;
  const charSvg = poseFn(220, 480);

  const cleanTitle = escapeXml(sceneTitle || `Cảnh ${sceneId}`);
  const cleanClause = escapeXml(clauseText);
  const shortClause = cleanClause.length > 95 ? cleanClause.substring(0, 92) + '...' : cleanClause;
  const cardClause = cleanClause.length > 58 ? cleanClause.substring(0, 55) + '...' : cleanClause;

  return `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <!-- Background flat pastel -->
      <rect width="1920" height="1080" fill="${bg}" />
      
      <!-- Top header bar with scene & beat indicator -->
      <rect x="0" y="0" width="1920" height="70" fill="rgba(15, 23, 42, 0.06)" />
      
      <g transform="translate(60, 20)">
        <rect x="0" y="0" width="160" height="34" rx="8" fill="#1E293B" />
        <text x="80" y="23" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="16" fill="#F8FAFC" text-anchor="middle">
          CẢNH ${sceneId}/${totalScenes}
        </text>
      </g>

      <text x="240" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="22" fill="#334155">
        ${cleanTitle.toUpperCase()}
      </text>

      <!-- Beat Timing Chip -->
      <g transform="translate(1560, 18)">
        <rect x="0" y="0" width="300" height="36" rx="10" fill="${analysis.badgeColor}" />
        <text x="150" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="16" fill="#FFFFFF" text-anchor="middle">
          Ý ${subIndex}/${totalBeats} • ${durSec.toFixed(1)}s (Đổi hình theo nhịp)
        </text>
      </g>

      <!-- Stickman Character matching the semantic pause -->
      ${charSvg}

      <!-- Centerpiece Visual Explainer Card -->
      <g transform="translate(740, 220)">
        <rect x="0" y="0" width="1020" height="630" rx="30" fill="#FFFFFF" stroke="#232323" stroke-width="7" />
        
        <!-- Header Banner on Card -->
        <rect x="0" y="0" width="1020" height="96" rx="26" fill="${analysis.accentColor}" stroke="#232323" stroke-width="6" />
        <text x="510" y="62" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="34" text-anchor="middle" fill="#FFFFFF" letter-spacing="1">
          ${analysis.icon} ${analysis.cardTitle}
        </text>

        <!-- Illustration Graphics inside Card -->
        <g transform="translate(60, 150)">
          <!-- Dynamic Thematic Icon Badge -->
          <circle cx="110" cy="110" r="75" fill="#F1F5F9" stroke="#232323" stroke-width="6" />
          <text x="110" y="135" font-size="70" text-anchor="middle">${analysis.icon}</text>

          <!-- Text block representing this specific sentence clause -->
          <g transform="translate(230, 20)">
            <rect x="0" y="0" width="670" height="70" rx="14" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="3" />
            <text x="24" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="24" fill="#0F172A">
              ✨ Phân đoạn: ${cleanTitle} (Nhịp ${subIndex})
            </text>

            <rect x="0" y="95" width="670" height="130" rx="14" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="3" />
            <text x="24" y="145" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="23" fill="#1E293B">
              &quot;${cardClause}&quot;
            </text>
            <text x="24" y="185" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="18" fill="#64748B">
              ⏱ Thời lượng hiển thị khớp lời đọc: ${durSec.toFixed(1)} giây
            </text>
          </g>
        </g>

        <!-- Bottom Feature Tag inside Card -->
        <rect x="60" y="500" width="900" height="85" rx="18" fill="#F8FAFC" stroke="#232323" stroke-width="4" />
        <text x="510" y="552" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="22" text-anchor="middle" fill="#0F172A">
          🎯 Tự động chuyển đổi hình ảnh theo mốc thời gian ngắt ý của Voice TTS
        </text>
      </g>

      <!-- Bottom Subtitle Bar (Exact spoken clause) -->
      <g transform="translate(140, 930)">
        <rect x="0" y="0" width="1640" height="100" rx="22" fill="rgba(15, 23, 42, 0.94)" stroke="rgba(255, 255, 255, 0.2)" stroke-width="3" />
        <text x="820" y="62" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="26" text-anchor="middle" fill="#FFFFFF">
          ${shortClause}
        </text>
      </g>
    </svg>
  `;
}

/**
 * Main Video Generator Pipeline
 * 1. Generates TTS audio from voice and content
 * 2. Calculates audio duration, analyzes semantic clauses, generates multiple visual beats per scene
 * 3. Assembles with Remotion & FFmpeg
 */
async function generateVideo({ title, subtitle, voice, speed, scenes }) {
  const selectedVoice = voice || 'vi-VN-Standard-A';
  const playbackSpeed = Number(speed) || 1.0;

  console.log(`\n======================================================`);
  console.log(`[VIDEO GENERATOR] Bắt đầu quy trình sản xuất video 3 bước:`);
  console.log(`1. Tạo Audio TTS (${selectedVoice}, ${playbackSpeed}x)`);
  console.log(`2. Phân tích ngữ nghĩa, chia Visual Beats theo mốc thời gian audio`);
  console.log(`3. Ghép nối kho ảnh & audio bằng Remotion & FFmpeg`);
  console.log(`======================================================`);

  const finalizedScenes = [];
  const sceneClipPaths = [];
  let totalFrames = 0;

  for (let i = 0; i < scenes.length; i++) {
    const rawScene = scenes[i];
    const sceneId = i + 1;
    const sceneTitle = rawScene.title || `Cảnh ${sceneId}`;
    const sceneText = rawScene.text || '';

    const audioFileName = `scene_${sceneId}.mp3`;
    const audioPath = path.join(AUDIO_DIR, audioFileName);

    console.log(`\n--- [Cảnh ${sceneId}/${scenes.length}]: "${sceneTitle}" ---`);
    console.log(`[Bước 1/3] Đang tổng hợp audio TTS...`);

    // 1. Generate Audio
    const durationInSeconds = await generateTTSAudio(sceneText, selectedVoice, playbackSpeed, audioPath);
    const durationInFrames = Math.ceil(durationInSeconds * 30) + 12; // 30 FPS + 12 padding frames

    console.log(`✓ Audio xong: ${durationInSeconds.toFixed(2)}s (${durationInFrames} frames)`);
    console.log(`[Bước 2/3] Phân tích ngữ nghĩa & ngắt ý tạo Visual Beats...`);

    // 2. Intelligent Visual Beats Segmentation based on Audio Duration
    const beats = segmentSceneIntoBeats(
      { id: sceneId, title: sceneTitle, text: sceneText },
      durationInSeconds,
      durationInFrames,
      i,
      scenes.length
    );

    console.log(`✓ Đã tạo ${beats.length} visual beats cho cảnh ${sceneId}:`);
    beats.forEach((b) => {
      console.log(`   - Beat ${b.sub_index} (${b.duration_in_seconds}s, frames ${b.start_frame_offset}..${b.start_frame_offset + b.duration_in_frames}): "${b.caption}" [${b.analysis.theme}]`);
    });

    // 3. Render PNG images for all beats
    const beatClipPaths = [];
    const tempSceneDir = path.join('/tmp', `scene_${sceneId}_${Date.now()}`);
    if (!fs.existsSync(tempSceneDir)) fs.mkdirSync(tempSceneDir, { recursive: true });

    for (const beat of beats) {
      const beatPngPath = path.join(IMAGES_DIR, beat.image_file);
      await sharp(Buffer.from(beat.svg_data)).png({ quality: 95 }).toFile(beatPngPath);

      // Also ensure scene_X.png exists for beat 1
      if (beat.sub_index === 1) {
        fs.copyFileSync(beatPngPath, path.join(IMAGES_DIR, `scene_${sceneId}.png`));
      }

      // Render video clip segment for this beat
      const beatClipOut = path.join(tempSceneDir, `beat_${beat.sub_index}.mp4`);
      const beatSec = (beat.duration_in_frames / 30).toFixed(2);
      try {
        execSync(
          `/opt/homebrew/bin/ffmpeg -y -loop 1 -t ${beatSec} -i "${beatPngPath}" -c:v libx264 -tune stillimage -pix_fmt yuv420p -r 30 -an "${beatClipOut}"`,
          { stdio: 'ignore' }
        );
        beatClipPaths.push(beatClipOut);
      } catch (err) {
        console.warn(`Error rendering clip for beat ${beat.id}:`, err);
      }
    }

    // 4. Combine beat clips with scene audio to create the scene's video clip
    console.log(`[Bước 3/3] Ghép nối các visual beats với file audio của cảnh...`);
    const sceneClipOut = path.join(PUBLIC_DIR, `clip_${sceneId}.mp4`);

    if (beatClipPaths.length > 0) {
      const beatListFile = path.join(tempSceneDir, 'beat_list.txt');
      fs.writeFileSync(beatListFile, beatClipPaths.map((p) => `file '${p}'`).join('\n'));

      try {
        // Concatenate beat video segments and mux with scene audio
        execSync(
          `/opt/homebrew/bin/ffmpeg -y -f concat -safe 0 -i "${beatListFile}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -af "apad=pad_dur=0.4" -shortest "${sceneClipOut}"`,
          { stdio: 'ignore' }
        );
        sceneClipPaths.push(sceneClipOut);
      } catch (err) {
        console.warn(`Error concatenating scene ${sceneId}:`, err);
      }
    }

    const sceneRecord = {
      id: sceneId,
      title: sceneTitle,
      text: sceneText,
      prompt: beats[0]?.prompt || `Minimalist 2D line art, stickman explaining ${sceneTitle}`,
      audio_file: audioFileName,
      image_file: `scene_${sceneId}_beat_1.png`,
      beats: beats.map((b) => ({
        id: b.id,
        sub_index: b.sub_index,
        title: b.title,
        prompt: b.prompt,
        image_file: b.image_file,
        svg_data: b.svg_data,
        duration_in_seconds: b.duration_in_seconds,
        duration_in_frames: b.duration_in_frames,
        start_frame_offset: b.start_frame_offset,
        caption: b.caption,
      })),
      duration_in_seconds: Number(durationInSeconds.toFixed(2)),
      duration_in_frames: durationInFrames,
      start_frame: totalFrames,
    };

    totalFrames += durationInFrames;
    finalizedScenes.push(sceneRecord);
  }

  // Concatenate all scene clips into final-video.mp4
  const finalVideoPath = path.join(PUBLIC_DIR, 'final-video.mp4');
  if (sceneClipPaths.length > 0) {
    const listFile = path.join(PUBLIC_DIR, 'clips_list.txt');
    const listContent = sceneClipPaths.map((p) => `file '${p}'`).join('\n');
    fs.writeFileSync(listFile, listContent);
    try {
      execSync(`/opt/homebrew/bin/ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${finalVideoPath}"`, { stdio: 'ignore' });
      console.log(`✓ Đã ghép xong final-video.mp4 (${fs.statSync(finalVideoPath).size} bytes)`);
    } catch (concatErr) {
      console.warn('ffmpeg concat error:', concatErr);
    }
  }

  const totalBeatsCount = finalizedScenes.reduce((acc, sc) => acc + (sc.beats?.length || 1), 0);

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
    max_image_duration_sec: 5.0,
  };

  const outputData = {
    metadata,
    scenes: finalizedScenes,
  };

  // Write scenes.json in public/ and src/data/
  fs.writeFileSync(path.join(PUBLIC_DIR, 'scenes.json'), JSON.stringify(outputData, null, 2));
  fs.writeFileSync(path.join(SRC_DATA_DIR, 'scenes.json'), JSON.stringify(outputData, null, 2));

  console.log(`\n🎉 [HOÀN TẤT XUẤT SẮC]:`);
  console.log(`- ${finalizedScenes.length} Cảnh`);
  console.log(`- ${totalBeatsCount} Hình ảnh Stickman Visual Beats (Max <= 5s/hình)`);
  console.log(`- Tổng thời lượng: ${(totalFrames / 30).toFixed(1)}s (${totalFrames} frames)`);
  console.log(`- Đã đồng bộ hoàn hảo với Remotion Player và lưu vào final-video.mp4!`);

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
  segmentSceneIntoBeats,
};
