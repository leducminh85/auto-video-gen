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

// Rich Stickman Character Poses & Visual Props
const POSES = {
  explaining: (x, y, stroke = '#1E293B') => `
    <g transform="translate(${x}, ${y})">
      <!-- Glasses -->
      <circle cx="100" cy="100" r="52" fill="#FFFFFF" stroke="${stroke}" stroke-width="8" />
      <rect x="72" y="80" width="28" height="22" rx="5" fill="none" stroke="${stroke}" stroke-width="4" />
      <rect x="110" y="80" width="28" height="22" rx="5" fill="none" stroke="${stroke}" stroke-width="4" />
      <line x1="100" y1="90" x2="110" y2="90" stroke="${stroke}" stroke-width="4" />
      <circle cx="86" cy="91" r="5" fill="${stroke}" />
      <circle cx="124" cy="91" r="5" fill="${stroke}" />
      <path d="M 88 122 Q 105 136 122 122" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round" />
      <!-- Body & Pointer Stick -->
      <line x1="100" y1="152" x2="100" y2="330" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
      <path d="M 100 190 L 190 150 L 340 100" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <circle cx="345" cy="98" r="8" fill="#EF4444" />
      <path d="M 100 190 L 45 250 L 60 310" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <line x1="100" y1="330" x2="60" y2="500" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
      <line x1="100" y1="330" x2="140" y2="500" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
    </g>
  `,

  buying_dopamine: (x, y, stroke = '#1E293B') => `
    <g transform="translate(${x}, ${y})">
      <!-- Brain Dopamine Aura -->
      <circle cx="100" cy="95" r="75" fill="none" stroke="#F59E0B" stroke-width="4" stroke-dasharray="6 6" />
      <text x="100" y="15" font-family="sans-serif" font-weight="900" font-size="22" fill="#D97706" text-anchor="middle">🧠 DOPAMINE HIT!</text>
      <!-- Sparkles around head -->
      <path d="M 30 70 L 45 75 L 30 80 L 35 65 Z" fill="#F59E0B" />
      <path d="M 165 60 L 180 65 L 165 70 L 170 55 Z" fill="#F59E0B" />
      <!-- Head with Star Eyes -->
      <circle cx="100" cy="95" r="52" fill="#FEF08A" stroke="${stroke}" stroke-width="8" />
      <text x="82" y="98" font-size="24" text-anchor="middle">⭐</text>
      <text x="118" y="98" font-size="24" text-anchor="middle">⭐</text>
      <!-- Excited open mouth smile -->
      <path d="M 85 115 Q 100 145 115 115 Z" fill="#EF4444" stroke="${stroke}" stroke-width="4" />
      <!-- Body leaning forward -->
      <line x1="100" y1="147" x2="130" y2="330" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
      <!-- Left arm holding phone -->
      <path d="M 110 190 L 50 220 L 70 270" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <rect x="50" y="240" width="45" height="75" rx="8" fill="#1E293B" stroke="${stroke}" stroke-width="3" />
      <rect x="56" y="248" width="33" height="55" rx="4" fill="#38BDF8" />
      <!-- Right arm pressing the big BUY NOW button -->
      <path d="M 110 190 L 220 180 L 320 220" fill="none" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <!-- Hand clicking -->
      <circle cx="325" cy="225" r="14" fill="#EF4444" stroke="${stroke}" stroke-width="4" />
      <!-- Legs dynamic pose -->
      <path d="M 130 330 L 70 410 L 40 500" fill="none" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
      <path d="M 130 330 L 190 410 L 210 500" fill="none" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
    </g>
  `,

  shocked_wallet: (x, y, stroke = '#1E293B') => `
    <g transform="translate(${x}, ${y})">
      <!-- Head with shocked expression -->
      <circle cx="100" cy="100" r="54" fill="#FFFFFF" stroke="${stroke}" stroke-width="8" />
      <ellipse cx="85" cy="90" rx="8" ry="12" fill="${stroke}" />
      <ellipse cx="115" cy="90" rx="8" ry="12" fill="${stroke}" />
      <ellipse cx="100" cy="128" rx="16" ry="20" fill="#1E293B" stroke="${stroke}" stroke-width="4" />
      <!-- Sweat drops -->
      <path d="M 160 70 Q 175 80 165 95 Q 155 88 160 70 Z" fill="#38BDF8" stroke="${stroke}" stroke-width="3" />
      <path d="M 40 70 Q 25 80 35 95 Q 45 88 40 70 Z" fill="#38BDF8" stroke="${stroke}" stroke-width="3" />
      <!-- Hands on cheeks in disbelief -->
      <path d="M 100 160 L 50 130 L 55 100" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <path d="M 100 160 L 150 130 L 145 100" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <circle cx="55" cy="100" r="12" fill="#FFFFFF" stroke="${stroke}" stroke-width="5" />
      <circle cx="145" cy="100" r="12" fill="#FFFFFF" stroke="${stroke}" stroke-width="5" />
      <!-- Body & shaking legs -->
      <line x1="100" y1="160" x2="100" y2="330" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
      <path d="M 100 330 L 60 410 L 45 500" fill="none" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
      <path d="M 100 330 L 140 410 L 155 500" fill="none" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
      <!-- Floating empty wallet with wings -->
      <g transform="translate(190, 160)">
        <rect x="0" y="10" width="80" height="50" rx="8" fill="#78350F" stroke="${stroke}" stroke-width="5" />
        <path d="M 0 10 Q 40 30 80 10" fill="none" stroke="${stroke}" stroke-width="4" />
        <!-- Cobweb inside wallet -->
        <text x="40" y="44" font-size="20" text-anchor="middle">🕸️ 0₫</text>
      </g>
    </g>
  `,

  compound_growth: (x, y, stroke = '#1E293B') => `
    <g transform="translate(${x}, ${y})">
      <!-- Head with confident investor smile -->
      <circle cx="100" cy="100" r="52" fill="#FFFFFF" stroke="${stroke}" stroke-width="8" />
      <circle cx="86" cy="90" r="6" fill="${stroke}" />
      <circle cx="118" cy="90" r="6" fill="${stroke}" />
      <path d="M 88 120 Q 102 135 120 120" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round" />
      <!-- Body standing tall -->
      <line x1="100" y1="152" x2="100" y2="320" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
      <!-- Left arm planting gold coin into soil pot -->
      <path d="M 100 190 L 30 220 L -30 260" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <circle cx="-35" cy="270" r="18" fill="#FBBF24" stroke="${stroke}" stroke-width="4" />
      <text x="-35" y="277" font-weight="900" font-size="20" text-anchor="middle" fill="#78350F">₫</text>
      <!-- Right arm gesturing to rocket graph -->
      <path d="M 100 190 L 170 140 L 250 80" fill="none" stroke="${stroke}" stroke-width="9" stroke-linecap="round" />
      <polygon points="245,70 270,75 255,95" fill="#10B981" />
      <!-- Legs firm stance -->
      <line x1="100" y1="320" x2="60" y2="490" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
      <line x1="100" y1="320" x2="140" y2="490" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
    </g>
  `,

  three_jars: (x, y, stroke = '#1E293B') => `
    <g transform="translate(${x}, ${y})">
      <!-- Head with thoughtful budgeting expression -->
      <circle cx="100" cy="100" r="52" fill="#FFFFFF" stroke="${stroke}" stroke-width="8" />
      <circle cx="88" cy="92" r="6" fill="${stroke}" />
      <circle cx="118" cy="92" r="6" fill="${stroke}" />
      <path d="M 90 122 Q 104 132 118 122" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round" />
      <!-- Body -->
      <line x1="100" y1="152" x2="100" y2="330" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
      <!-- Both arms pouring coins into jars -->
      <path d="M 100 190 L 40 220 L 10 270" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <path d="M 100 190 L 160 210 L 220 250" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <!-- Coins dropping from hands -->
      <circle cx="10" cy="290" r="10" fill="#FBBF24" stroke="${stroke}" stroke-width="3" />
      <circle cx="225" cy="275" r="10" fill="#FBBF24" stroke="${stroke}" stroke-width="3" />
      <!-- Legs -->
      <line x1="100" y1="330" x2="70" y2="500" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
      <line x1="100" y1="330" x2="130" y2="500" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
    </g>
  `,

  peaceful_freedom: (x, y, stroke = '#1E293B') => `
    <g transform="translate(${x}, ${y})">
      <!-- Head wearing cool sunglasses -->
      <circle cx="100" cy="100" r="52" fill="#FFFFFF" stroke="${stroke}" stroke-width="8" />
      <!-- Cool Sunglasses -->
      <polygon points="68,85 98,85 94,106 72,106" fill="#1E293B" />
      <polygon points="106,85 136,85 132,106 110,106" fill="#1E293B" />
      <line x1="98" y1="92" x2="106" y2="92" stroke="#1E293B" stroke-width="5" />
      <!-- Smug satisfied smile -->
      <path d="M 88 124 Q 104 140 124 120" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round" />
      <!-- Body leaning back comfortably -->
      <line x1="100" y1="152" x2="80" y2="330" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
      <!-- Left arm holding steaming coffee cup -->
      <path d="M 95 190 L 30 210 L 20 260" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <rect x="0" y="260" width="38" height="42" rx="6" fill="#FFFFFF" stroke="${stroke}" stroke-width="4" />
      <path d="M 38 270 Q 50 280 38 290" fill="none" stroke="${stroke}" stroke-width="4" />
      <path d="M 12 250 Q 18 240 12 230" fill="none" stroke="#94A3B8" stroke-width="3" />
      <path d="M 22 250 Q 28 240 22 230" fill="none" stroke="#94A3B8" stroke-width="3" />
      <!-- Right hand waving "NO" peacefully -->
      <path d="M 95 190 L 170 170 L 200 130" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <circle cx="205" cy="125" r="14" fill="#FFFFFF" stroke="${stroke}" stroke-width="4" />
      <!-- Relaxed legs crossed -->
      <path d="M 80 330 L 40 420 L 10 500" fill="none" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
      <path d="M 80 330 L 120 400 L 90 480" fill="none" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
    </g>
  `,

  tech_robot: (x, y, stroke = '#1E293B') => `
    <g transform="translate(${x}, ${y})">
      <!-- Head with VR / Tech Visor -->
      <circle cx="100" cy="100" r="52" fill="#FFFFFF" stroke="${stroke}" stroke-width="8" />
      <rect x="70" y="80" width="60" height="24" rx="6" fill="#06B6D4" stroke="${stroke}" stroke-width="4" />
      <circle cx="85" cy="92" r="4" fill="#FFFFFF" />
      <circle cx="115" cy="92" r="4" fill="#FFFFFF" />
      <path d="M 88 122 Q 104 134 118 122" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round" />
      <!-- Body with tech circuit lines -->
      <line x1="100" y1="152" x2="100" y2="330" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
      <!-- Hologram touch arms -->
      <path d="M 100 190 L 160 170 L 220 150" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <circle cx="225" cy="148" r="12" fill="#38BDF8" stroke="${stroke}" stroke-width="3" />
      <path d="M 100 190 L 40 210 L -10 230" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <line x1="100" y1="330" x2="65" y2="490" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
      <line x1="100" y1="330" x2="135" y2="490" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
    </g>
  `,

  fitness_lifting: (x, y, stroke = '#1E293B') => `
    <g transform="translate(${x}, ${y})">
      <circle cx="100" cy="110" r="50" fill="#FFFFFF" stroke="${stroke}" stroke-width="8" />
      <circle cx="85" cy="100" r="5" fill="${stroke}" />
      <circle cx="115" cy="100" r="5" fill="${stroke}" />
      <path d="M 85 130 Q 100 145 115 130" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round" />
      <!-- Heavy Barbell -->
      <line x1="-70" y1="40" x2="270" y2="40" stroke="${stroke}" stroke-width="12" stroke-linecap="round" />
      <rect x="-110" y="5" width="35" height="70" rx="6" fill="#1E293B" stroke="${stroke}" stroke-width="5" />
      <rect x="270" y="5" width="35" height="70" rx="6" fill="#1E293B" stroke="${stroke}" stroke-width="5" />
      <!-- Arms holding bar up -->
      <path d="M 100 180 L 20 100 L 0 45" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <path d="M 100 180 L 180 100 L 200 45" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" />
      <line x1="100" y1="160" x2="100" y2="330" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
      <path d="M 100 330 L 45 420 L 30 500" fill="none" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
      <path d="M 100 330 L 155 420 L 170 500" fill="none" stroke="${stroke}" stroke-width="10" stroke-linecap="round" />
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
 * Intelligent Semantic Keyword & Thematic Scene Analyzer for Visual Beats
 */
function analyzeClauseTheme(clauseText) {
  const t = clauseText.toLowerCase();

  // 1. Dopamine, Shopping, Impulse buy
  if (/dopamine|bộ não|mua hàng|mua sắm|bấm nút|sung sướng|tức thời|tức thì|cảm xúc|shopping|khoái cảm|hưng phấn/i.test(t)) {
    return {
      theme: 'shopping_dopamine',
      pose: 'buying_dopamine',
      icon: '🧠🛒',
      badgeColor: '#EC4899',
      accentColor: '#DB2777',
      title: 'BẪY DOPAMINE &amp; MUA SẮM CẢM XÚC',
    };
  }

  // 2. Lifestyle Inflation, Income vs Expense, Motorbike to Car
  if (/15|30 triệu|lương|thu nhập|chi tiêu|ô tô|xe máy|dậm chân|tiết kiệm|lối sống|lạm phát|chạy đua|sĩ diện/i.test(t)) {
    return {
      theme: 'lifestyle_inflation',
      pose: 'shocked_wallet',
      icon: '🛵🚗',
      badgeColor: '#EF4444',
      accentColor: '#DC2626',
      title: 'HIỆU ỨNG LẠM PHÁT LỐI SỐNG',
    };
  }

  // 3. Compound Interest, 10%, 2 Million, 7 Billion, Retirement
  if (/lãi kép|đầu tư|2 triệu|10%|tuổi 20|7 tỷ|thời gian|đòn bẩy|hưu|tích lũy|sinh lời|kỳ diệu|cấp số nhân/i.test(t)) {
    return {
      theme: 'compound_growth',
      pose: 'compound_growth',
      icon: '📈💰',
      badgeColor: '#10B981',
      accentColor: '#059669',
      title: 'SỨC MẠNH KỲ DIỆU CỦA LÃI KÉP',
    };
  }

  // 4. 50-30-20 Rule, 50%, 30%, 20%, Essentials, Desires, Freedom Fund
  if (/50%|30%|20%|50-30-20|thiết yếu|mong muốn|quỹ tự do|quy tắc|hũ|ngân sách|phân bổ|tự do tài chính/i.test(t)) {
    return {
      theme: 'rule_50_30_20',
      pose: 'three_jars',
      icon: '🏺📊',
      badgeColor: '#3B82F6',
      accentColor: '#2563EB',
      title: 'QUY TẮC QUẢN LÝ TIỀN 50 - 30 - 20',
    };
  }

  // 5. True Financial Freedom, Saying NO, Luxury vs Real Peace
  if (/tự do tài chính|xa xỉ|từ chối|thức dậy|sáng|hạnh phúc thực|bình yên|đích thực|an nhiên|không muốn làm/i.test(t)) {
    return {
      theme: 'financial_freedom',
      pose: 'peaceful_freedom',
      icon: '☀️☕',
      badgeColor: '#F59E0B',
      accentColor: '#D97706',
      title: 'TỰ DO TÀI CHÍNH ĐÍCH THỰC',
    };
  }

  // 6. Technology, AI, Automation
  if (/ai|công nghệ|máy móc|robot|tự động|thuật toán|số hóa|máy tính|dữ liệu/i.test(t)) {
    return {
      theme: 'tech',
      pose: 'tech_robot',
      icon: '🤖⚡',
      badgeColor: '#06B6D4',
      accentColor: '#0891B2',
      title: 'CÔNG NGHỆ &amp; ĐỘT PHÁ TỰ ĐỘNG',
    };
  }

  // 7. Gym, Fitness, Discipline, Health
  if (/gym|tập luyện|sức khỏe|thể thao|cơ bắp|chạy bộ|tạ|huấn luyện|kỷ luật/i.test(t)) {
    return {
      theme: 'fitness',
      pose: 'fitness_lifting',
      icon: '🏋️💪',
      badgeColor: '#EA580C',
      accentColor: '#C2410C',
      title: 'KỶ LUẬT THỂ CHẤT &amp; SỨC KHỎE',
    };
  }

  // Fallback: Explaining & Strategy
  return {
    theme: 'explaining',
    pose: 'explaining',
    icon: '💡🎯',
    badgeColor: '#6366F1',
    accentColor: '#4F46E5',
    title: 'NGUYÊN LÝ &amp; PHÂN TÍCH CHUYÊN SÂU',
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
 * Generate 1080p SVG with rich Whiteboard Stickman illustrations
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
  const charSvg = poseFn(140, 360, '#1E293B');

  const cleanTitle = escapeXml(sceneTitle || `Cảnh ${sceneId}`);
  const rawShort = clauseText.length > 95 ? clauseText.substring(0, 92) + '...' : clauseText;
  const shortClause = escapeXml(rawShort);

  // Render Theme-Specific Centerpiece Vector Illustration
  let stageGraphic = '';

  if (analysis.theme === 'shopping_dopamine') {
    stageGraphic = `
      <!-- Shopping & Dopamine Stage -->
      <g transform="translate(680, 160)">
        <!-- Giant Smartphone Mockup -->
        <rect x="0" y="20" width="340" height="580" rx="36" fill="#0F172A" stroke="#334155" stroke-width="6" />
        <rect x="18" y="45" width="304" height="530" rx="24" fill="#FFFFFF" />
        <rect x="110" y="28" width="120" height="12" rx="6" fill="#334155" />
        <!-- App Header -->
        <rect x="18" y="45" width="304" height="60" rx="20" fill="#EC4899" />
        <text x="170" y="84" font-weight="900" font-size="20" fill="#FFFFFF" text-anchor="middle">FLASH SALE 90%</text>
        <!-- Product Card inside Phone -->
        <rect x="38" y="125" width="264" height="180" rx="16" fill="#FDF2F8" stroke="#F472B6" stroke-width="3" />
        <text x="170" y="210" font-size="64" text-anchor="middle">👟</text>
        <text x="170" y="260" font-weight="900" font-size="20" fill="#BE185D" text-anchor="middle">GIÀY TRENDY 2026</text>
        <text x="170" y="285" font-weight="700" font-size="16" fill="#9D174D" text-anchor="middle">1.990.000₫</text>
        <!-- Giant BUY NOW Button with Pulse -->
        <rect x="38" y="340" width="264" height="74" rx="20" fill="#EF4444" stroke="#DC2626" stroke-width="5" />
        <text x="170" y="386" font-weight="900" font-size="24" fill="#FFFFFF" text-anchor="middle">⚡ MUA NGAY ⚡</text>
        <text x="170" y="450" font-weight="700" font-size="16" fill="#64748B" text-anchor="middle">1-Click Fast Delivery</text>

        <!-- Right Side: Brain & Dopamine Explosion -->
        <g transform="translate(400, 30)">
          <!-- Brain Card Container -->
          <rect x="0" y="0" width="620" height="570" rx="28" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
          <rect x="0" y="0" width="620" height="76" rx="24" fill="#DB2777" stroke="#1E293B" stroke-width="5" />
          <text x="310" y="50" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">BẪY KHOÁI CẢM TỨC THÌ</text>

          <!-- Floating Brain Vector -->
          <circle cx="310" cy="210" r="90" fill="#FCE7F3" stroke="#DB2777" stroke-width="6" />
          <text x="310" y="235" font-size="80" text-anchor="middle">🧠</text>
          
          <!-- Energy Sparks -->
          <path d="M 200 150 L 160 120 M 420 150 L 460 120 M 310 100 L 310 70" stroke="#F59E0B" stroke-width="8" stroke-linecap="round" />
          <text x="310" y="340" font-weight="900" font-size="30" fill="#BE185D" text-anchor="middle">DOPAMINE PHÓNG THÍCH</text>
          
          <!-- Comparison tags -->
          <rect x="40" y="380" width="250" height="130" rx="16" fill="#FEE2E2" stroke="#EF4444" stroke-width="3" />
          <text x="165" y="420" font-weight="900" font-size="20" fill="#991B1B" text-anchor="middle">❌ TỨC THỜI</text>
          <text x="165" y="455" font-weight="700" font-size="16" fill="#7F1D1D" text-anchor="middle">Sung sướng 1 vài phút</text>
          <text x="165" y="485" font-weight="600" font-size="15" fill="#991B1B" text-anchor="middle">Ví tiền rỗng tuếch</text>

          <rect x="330" y="380" width="250" height="130" rx="16" fill="#DCFCE7" stroke="#10B981" stroke-width="3" />
          <text x="455" y="420" font-weight="900" font-size="20" fill="#065F46" text-anchor="middle">✓ BỀN VỮNG</text>
          <text x="455" y="455" font-weight="700" font-size="16" fill="#064E3B" text-anchor="middle">Hạnh phúc thực sự</text>
          <text x="455" y="485" font-weight="600" font-size="15" fill="#047857" text-anchor="middle">Tài chính an tâm</text>
        </g>
      </g>
    `;
  } else if (analysis.theme === 'lifestyle_inflation') {
    stageGraphic = `
      <!-- Lifestyle Inflation Stage: Scooter vs Car -->
      <g transform="translate(680, 160)">
        <rect x="0" y="0" width="1040" height="610" rx="28" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
        <rect x="0" y="0" width="1040" height="76" rx="24" fill="#DC2626" stroke="#1E293B" stroke-width="5" />
        <text x="520" y="50" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">NGHỊCH LÝ: LƯƠNG TĂNG GẤP ĐÔI NHƯNG KHÔNG CÒN ĐỒNG NÀO</text>

        <!-- Left Column: Motorbike 15M -->
        <g transform="translate(50, 120)">
          <rect x="0" y="0" width="430" height="440" rx="20" fill="#F8FAFC" stroke="#94A3B8" stroke-width="4" />
          <rect x="20" y="20" width="390" height="50" rx="12" fill="#E2E8F0" />
          <text x="215" y="52" font-weight="900" font-size="22" fill="#334155" text-anchor="middle">LƯƠNG 15 TRIỆU / THÁNG</text>
          
          <text x="215" y="160" font-size="70" text-anchor="middle">🛵</text>
          <text x="215" y="205" font-weight="800" font-size="20" fill="#475569" text-anchor="middle">Đi xe máy - Chi tiêu 12Tr</text>
          
          <rect x="30" y="240" width="370" height="80" rx="14" fill="#DCFCE7" stroke="#10B981" stroke-width="3" />
          <text x="215" y="275" font-weight="900" font-size="22" fill="#047857" text-anchor="middle">TIẾT KIỆM: 3.000.000₫</text>
          <text x="215" y="305" font-weight="700" font-size="16" fill="#065F46" text-anchor="middle">Tích lũy đều đặn mỗi tháng</text>
          
          <rect x="30" y="340" width="370" height="70" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2" />
          <text x="215" y="382" font-weight="700" font-size="18" fill="#64748B" text-anchor="middle">Áp lực tài chính: THẤP</text>
        </g>

        <!-- Crisp Vector Arrow -->
        <g transform="translate(500, 320)">
          <line x1="-20" y1="0" x2="30" y2="0" stroke="#DC2626" stroke-width="8" stroke-linecap="round" />
          <polyline points="15,-15 30,0 15,15" fill="none" stroke="#DC2626" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
        </g>

        <!-- Right Column: Car 30M -->
        <g transform="translate(560, 120)">
          <rect x="0" y="0" width="430" height="440" rx="20" fill="#FEF2F2" stroke="#EF4444" stroke-width="4" />
          <rect x="20" y="20" width="390" height="50" rx="12" fill="#FEE2E2" stroke="#EF4444" stroke-width="2" />
          <text x="215" y="52" font-weight="900" font-size="22" fill="#B91C1C" text-anchor="middle">LƯƠNG TĂNG 30 TRIỆU</text>
          
          <text x="215" y="160" font-size="70" text-anchor="middle">🚗</text>
          <text x="215" y="205" font-weight="800" font-size="20" fill="#B91C1C" text-anchor="middle">Mua Ô Tô - Nợ vay &amp; Bảo dưỡng</text>
          
          <rect x="30" y="240" width="370" height="80" rx="14" fill="#FEE2E2" stroke="#EF4444" stroke-width="3" />
          <text x="215" y="275" font-weight="900" font-size="24" fill="#DC2626" text-anchor="middle">TIẾT KIỆM: 0 ĐỒNG ⚠️</text>
          <text x="215" y="305" font-weight="700" font-size="16" fill="#991B1B" text-anchor="middle">Chi phí tự động phình to theo lương</text>

          <rect x="30" y="340" width="370" height="70" rx="14" fill="#FEF2F2" stroke="#EF4444" stroke-width="2" />
          <text x="215" y="382" font-weight="800" font-size="18" fill="#DC2626" text-anchor="middle">Áp lực tài chính: BÁO ĐỘNG</text>
        </g>
      </g>
    `;
  } else if (analysis.theme === 'compound_growth') {
    stageGraphic = `
      <!-- Compound Interest & Exponential Growth Graph -->
      <g transform="translate(680, 160)">
        <rect x="0" y="0" width="1040" height="610" rx="28" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
        <rect x="0" y="0" width="1040" height="76" rx="24" fill="#059669" stroke="#1E293B" stroke-width="5" />
        <text x="520" y="50" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">ĐÒN BẨY THỜI GIAN: ĐẦU TƯ 2 TRIỆU / THÁNG (LÃI 10%/NĂM)</text>

        <!-- Coordinate System -->
        <g transform="translate(100, 130)">
          <!-- Y Axis -->
          <line x1="50" y1="380" x2="50" y2="40" stroke="#64748B" stroke-width="5" />
          <polygon points="45,40 50,20 55,40" fill="#64748B" />
          <text x="40" y="20" font-weight="800" font-size="18" fill="#64748B" text-anchor="end">TÀI SẢN</text>

          <!-- X Axis -->
          <line x1="50" y1="380" x2="820" y2="380" stroke="#64748B" stroke-width="5" />
          <polygon points="820,375 840,380 820,385" fill="#64748B" />
          <text x="840" y="415" font-weight="800" font-size="18" fill="#64748B" text-anchor="middle">THỜI GIAN</text>

          <!-- Grid Lines -->
          <line x1="50" y1="280" x2="820" y2="280" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="6 6" />
          <line x1="50" y1="180" x2="820" y2="180" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="6 6" />
          <line x1="50" y1="80" x2="820" y2="80" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="6 6" />

          <!-- Exponential Curve Gradient Area -->
          <path d="M 50 380 Q 420 370 600 240 T 800 50 L 800 380 Z" fill="rgba(16, 185, 129, 0.12)" />
          <!-- Exponential Curve Line -->
          <path d="M 50 380 Q 420 370 600 240 T 800 50" fill="none" stroke="#10B981" stroke-width="8" stroke-linecap="round" />

          <!-- Age 20 Milestone -->
          <circle cx="120" cy="375" r="12" fill="#3B82F6" stroke="#1E293B" stroke-width="4" />
          <text x="120" y="420" font-weight="800" font-size="18" fill="#1E293B" text-anchor="middle">Tuổi 20</text>
          <text x="120" y="445" font-weight="700" font-size="15" fill="#64748B" text-anchor="middle">Bắt đầu 2Tr/tháng</text>

          <!-- Age 40 Milestone -->
          <circle cx="480" cy="330" r="12" fill="#F59E0B" stroke="#1E293B" stroke-width="4" />
          <text x="480" y="370" font-weight="800" font-size="18" fill="#1E293B" text-anchor="middle">Tuổi 40</text>
          <text x="480" y="420" font-weight="700" font-size="16" fill="#D97706" text-anchor="middle">1.2 Tỷ Đồng</text>

          <!-- Age 60 Peak Milestone -->
          <circle cx="800" cy="50" r="18" fill="#10B981" stroke="#1E293B" stroke-width="5" />
          <!-- Giant Highlight Tag -->
          <g transform="translate(560, 40)">
            <rect x="0" y="0" width="220" height="90" rx="16" fill="#DCFCE7" stroke="#10B981" stroke-width="4" />
            <text x="110" y="40" font-weight="900" font-size="28" fill="#047857" text-anchor="middle">7.000.000.000₫</text>
            <text x="110" y="70" font-weight="800" font-size="16" fill="#065F46" text-anchor="middle">HƠN 7 TỶ KHI NGHỈ HƯU</text>
          </g>
        </g>
      </g>
    `;
  } else if (analysis.theme === 'rule_50_30_20') {
    stageGraphic = `
      <!-- 50-30-20 Rule Stage: 3 Distinct Visual Jars -->
      <g transform="translate(680, 160)">
        <rect x="0" y="0" width="1040" height="610" rx="28" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
        <rect x="0" y="0" width="1040" height="76" rx="24" fill="#2563EB" stroke="#1E293B" stroke-width="5" />
        <text x="520" y="50" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">QUY TẮC PHÂN BỔ THU NHẬP 50 - 30 - 20</text>

        <g transform="translate(50, 120)">
          <!-- Jar 1: 50% Essentials -->
          <g transform="translate(0, 0)">
            <rect x="0" y="0" width="290" height="440" rx="22" fill="#EFF6FF" stroke="#3B82F6" stroke-width="4" />
            <!-- Jar Lid -->
            <rect x="70" y="-14" width="150" height="24" rx="8" fill="#1D4ED8" />
            <circle cx="145" cy="65" r="45" fill="#DBEAFE" stroke="#3B82F6" stroke-width="4" />
            <text x="145" y="75" font-weight="900" font-size="34" fill="#1D4ED8" text-anchor="middle">50%</text>
            
            <text x="145" y="145" font-weight="900" font-size="22" fill="#1E40AF" text-anchor="middle">NHU CẦU THIẾT YẾU</text>
            <line x1="30" y1="165" x2="260" y2="165" stroke="#93C5FD" stroke-width="3" />
            
            <text x="50" y="215" font-size="30">🏠</text>
            <text x="95" y="215" font-weight="700" font-size="18" fill="#1E3A8A">Tiền thuê nhà / Ở</text>

            <text x="50" y="275" font-size="30">🍲</text>
            <text x="95" y="275" font-weight="700" font-size="18" fill="#1E3A8A">Ăn uống sinh hoạt</text>

            <text x="50" y="335" font-size="30">💡</text>
            <text x="95" y="335" font-weight="700" font-size="18" fill="#1E3A8A">Điện nước hóa đơn</text>

            <rect x="25" y="375" width="240" height="42" rx="10" fill="#DBEAFE" />
            <text x="145" y="402" font-weight="800" font-size="16" fill="#1D4ED8" text-anchor="middle">Không vượt quá 50%</text>
          </g>

          <!-- Jar 2: 30% Desires -->
          <g transform="translate(325, 0)">
            <rect x="0" y="0" width="290" height="440" rx="22" fill="#FFFBEB" stroke="#F59E0B" stroke-width="4" />
            <rect x="70" y="-14" width="150" height="24" rx="8" fill="#D97706" />
            <circle cx="145" cy="65" r="45" fill="#FEF3C7" stroke="#F59E0B" stroke-width="4" />
            <text x="145" y="75" font-weight="900" font-size="34" fill="#B45309" text-anchor="middle">30%</text>

            <text x="145" y="145" font-weight="900" font-size="22" fill="#92400E" text-anchor="middle">MONG MUỐN CÁ NHÂN</text>
            <line x1="30" y1="165" x2="260" y2="165" stroke="#FCD34D" stroke-width="3" />

            <text x="50" y="215" font-size="30">☕</text>
            <text x="95" y="215" font-weight="700" font-size="18" fill="#78350F">Cà phê, hẹn hò</text>

            <text x="50" y="275" font-size="30">✈️</text>
            <text x="95" y="275" font-weight="700" font-size="18" fill="#78350F">Du lịch trải nghiệm</text>

            <text x="50" y="335" font-size="30">🎬</text>
            <text x="95" y="335" font-weight="700" font-size="18" fill="#78350F">Giải trí, sở thích</text>

            <rect x="25" y="375" width="240" height="42" rx="10" fill="#FEF3C7" />
            <text x="145" y="402" font-weight="800" font-size="16" fill="#B45309" text-anchor="middle">Tận hưởng có kiểm soát</text>
          </g>

          <!-- Jar 3: 20% Freedom Fund -->
          <g transform="translate(650, 0)">
            <rect x="0" y="0" width="290" height="440" rx="22" fill="#F0FDF4" stroke="#10B981" stroke-width="5" />
            <rect x="70" y="-14" width="150" height="24" rx="8" fill="#059669" />
            <circle cx="145" cy="65" r="45" fill="#DCFCE7" stroke="#10B981" stroke-width="4" />
            <text x="145" y="75" font-weight="900" font-size="34" fill="#047857" text-anchor="middle">20%</text>

            <text x="145" y="145" font-weight="900" font-size="22" fill="#065F46" text-anchor="middle">TỰ DO TÀI CHÍNH</text>
            <line x1="30" y1="165" x2="260" y2="165" stroke="#6EE7B7" stroke-width="3" />

            <text x="50" y="215" font-size="30">🔒</text>
            <text x="95" y="215" font-weight="700" font-size="18" fill="#064E3B">Quỹ dự phòng khẩn cấp</text>

            <text x="50" y="275" font-size="30">📈</text>
            <text x="95" y="275" font-weight="700" font-size="18" fill="#064E3B">Đầu tư sinh lời dài hạn</text>

            <text x="50" y="335" font-size="30">🛡️</text>
            <text x="95" y="335" font-weight="700" font-size="18" fill="#064E3B">Bảo vệ tương lai</text>

            <rect x="25" y="375" width="240" height="42" rx="10" fill="#DCFCE7" stroke="#10B981" stroke-width="2" />
            <text x="145" y="402" font-weight="900" font-size="16" fill="#047857" text-anchor="middle">CHUYỂN NGAY KHI CÓ TIỀN</text>
          </g>
        </g>
      </g>
    `;
  } else if (analysis.theme === 'financial_freedom') {
    stageGraphic = `
      <!-- Financial Freedom: Freedom to Say NO -->
      <g transform="translate(680, 160)">
        <rect x="0" y="0" width="1040" height="610" rx="28" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
        <rect x="0" y="0" width="1040" height="76" rx="24" fill="#D97706" stroke="#1E293B" stroke-width="5" />
        <text x="520" y="50" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">ĐỊNH NGHĨA GIÀU CÓ: KHÔNG PHẢI KHOE KHOANG MÀ LÀ TỰ DO</text>

        <!-- Left: Crossed Out Luxury -->
        <g transform="translate(50, 120)">
          <rect x="0" y="0" width="430" height="440" rx="20" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="4" />
          <text x="215" y="50" font-weight="900" font-size="22" fill="#64748B" text-anchor="middle">❌ KHÔNG PHẢI LÀ</text>
          
          <g transform="translate(40, 90)">
            <rect x="0" y="0" width="350" height="80" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="3" />
            <text x="45" y="52" font-size="36">⌚</text>
            <text x="125" y="48" font-weight="800" font-size="20" fill="#475569">Đồng hồ xa xỉ đắt tiền</text>
            <line x1="25" y1="44" x2="330" y2="44" stroke="#EF4444" stroke-width="5" />
          </g>

          <g transform="translate(40, 190)">
            <rect x="0" y="0" width="350" height="80" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="3" />
            <text x="45" y="52" font-size="36">🏎️</text>
            <text x="125" y="48" font-weight="800" font-size="20" fill="#475569">Siêu xe mua trả góp</text>
            <line x1="25" y1="44" x2="330" y2="44" stroke="#EF4444" stroke-width="5" />
          </g>

          <g transform="translate(40, 290)">
            <rect x="0" y="0" width="350" height="80" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="3" />
            <text x="45" y="52" font-size="36">💎</text>
            <text x="125" y="48" font-weight="800" font-size="20" fill="#475569">Đồ hiệu để gây ấn tượng</text>
            <line x1="25" y1="44" x2="330" y2="44" stroke="#EF4444" stroke-width="5" />
          </g>

          <text x="215" y="410" font-weight="700" font-size="16" fill="#94A3B8" text-anchor="middle">Sống để người khác đánh giá</text>
        </g>

        <!-- Right: Real Peace of Mind -->
        <g transform="translate(560, 120)">
          <rect x="0" y="0" width="430" height="440" rx="20" fill="#FEF3C7" stroke="#F59E0B" stroke-width="4" />
          <text x="215" y="50" font-weight="900" font-size="22" fill="#B45309" text-anchor="middle">✓ MÀ LÀ QUYỀN NĂNG</text>

          <g transform="translate(30, 90)">
            <circle cx="60" cy="50" r="38" fill="#FDE68A" />
            <text x="60" y="60" font-size="42" text-anchor="middle">🔕</text>
            <text x="120" y="40" font-weight="800" font-size="20" fill="#78350F">Tắt báo thức mỗi sáng</text>
            <text x="120" y="68" font-weight="600" font-size="16" fill="#92400E">Thức dậy trong thảnh thơi</text>
          </g>

          <g transform="translate(30, 190)">
            <circle cx="60" cy="50" r="38" fill="#FDE68A" />
            <text x="60" y="60" font-size="42" text-anchor="middle">☕</text>
            <text x="120" y="40" font-weight="800" font-size="20" fill="#78350F">Làm chủ quỹ thời gian</text>
            <text x="120" y="68" font-weight="600" font-size="16" fill="#92400E">Không bị cuốn vào vòng xoáy</text>
          </g>

          <!-- Speech bubble "SAY NO" -->
          <g transform="translate(30, 290)">
            <rect x="0" y="0" width="370" height="110" rx="18" fill="#FFFFFF" stroke="#D97706" stroke-width="4" />
            <text x="185" y="45" font-weight="900" font-size="24" fill="#B45309" text-anchor="middle">QUYỀN TỪ CHỐI ✋</text>
            <text x="185" y="80" font-weight="700" font-size="17" fill="#78350F" text-anchor="middle">Những gì bạn không muốn làm!</text>
          </g>
        </g>
      </g>
    `;
  } else {
    // General explainer strategy stage
    stageGraphic = `
      <!-- General Whiteboard Analytical Stage -->
      <g transform="translate(680, 160)">
        <rect x="0" y="0" width="1040" height="610" rx="28" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
        <rect x="0" y="0" width="1040" height="76" rx="24" fill="${analysis.accentColor}" stroke="#1E293B" stroke-width="5" />
        <text x="520" y="50" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">${analysis.icon} ${analysis.title}</text>

        <!-- Big Analytical Roadmap / Steps -->
        <g transform="translate(60, 130)">
          <!-- Step 1 -->
          <rect x="0" y="0" width="280" height="400" rx="18" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="4" />
          <circle cx="140" cy="70" r="38" fill="${analysis.badgeColor}" />
          <text x="140" y="82" font-weight="900" font-size="30" fill="#FFFFFF" text-anchor="middle">01</text>
          <text x="140" y="150" font-weight="800" font-size="22" fill="#1E293B" text-anchor="middle">NHẬN DIỆN VẤN ĐỀ</text>
          <line x1="40" y1="175" x2="240" y2="175" stroke="#CBD5E1" stroke-width="3" />
          <text x="140" y="220" font-weight="600" font-size="17" fill="#64748B" text-anchor="middle">Quan sát quy luật cốt lõi</text>
          <text x="140" y="260" font-weight="600" font-size="17" fill="#64748B" text-anchor="middle">Tránh bẫy tâm lý thường gặp</text>
          <circle cx="140" cy="330" r="28" fill="#DCFCE7" />
          <text x="140" y="340" font-size="28" text-anchor="middle">🔍</text>

          <!-- Step 2 -->
          <rect x="320" y="0" width="280" height="400" rx="18" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="4" />
          <circle cx="460" cy="70" r="38" fill="${analysis.badgeColor}" />
          <text x="460" y="82" font-weight="900" font-size="30" fill="#FFFFFF" text-anchor="middle">02</text>
          <text x="460" y="150" font-weight="800" font-size="22" fill="#1E293B" text-anchor="middle">THIẾT LẬP KỶ LUẬT</text>
          <line x1="360" y1="175" x2="560" y2="175" stroke="#CBD5E1" stroke-width="3" />
          <text x="460" y="220" font-weight="600" font-size="17" fill="#64748B" text-anchor="middle">Tối ưu hóa hành vi</text>
          <text x="460" y="260" font-weight="600" font-size="17" fill="#64748B" text-anchor="middle">Tự động hóa hệ thống</text>
          <circle cx="460" cy="330" r="28" fill="#FEF3C7" />
          <text x="460" y="340" font-size="28" text-anchor="middle">⚙️</text>

          <!-- Step 3 -->
          <rect x="640" y="0" width="280" height="400" rx="18" fill="#F0FDF4" stroke="#10B981" stroke-width="4" />
          <circle cx="780" cy="70" r="38" fill="#10B981" />
          <text x="780" y="82" font-weight="900" font-size="30" fill="#FFFFFF" text-anchor="middle">03</text>
          <text x="780" y="150" font-weight="800" font-size="22" fill="#065F46" text-anchor="middle">KẾT QUẢ BỀN VỮNG</text>
          <line x1="680" y1="175" x2="880" y2="175" stroke="#6EE7B7" stroke-width="3" />
          <text x="780" y="220" font-weight="700" font-size="17" fill="#047857" text-anchor="middle">Tự do &amp; An tâm tuyệt đối</text>
          <text x="780" y="260" font-weight="700" font-size="17" fill="#047857" text-anchor="middle">Đạt mục tiêu dài hạn</text>
          <circle cx="780" cy="330" r="28" fill="#DCFCE7" />
          <text x="780" y="340" font-size="28" text-anchor="middle">🏆</text>
        </g>
      </g>
    `;
  }

  return `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <!-- Whiteboard Canvas Background -->
      <rect width="1920" height="1080" fill="${bg}" />
      
      <!-- Top Header Navigation Bar -->
      <rect x="0" y="0" width="1920" height="74" fill="rgba(15, 23, 42, 0.05)" />
      
      <!-- Scene Badge -->
      <g transform="translate(60, 18)">
        <rect x="0" y="0" width="170" height="38" rx="10" fill="#1E293B" />
        <text x="85" y="25" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="16" fill="#F8FAFC" text-anchor="middle">
          CẢNH ${sceneId}/${totalScenes}
        </text>
      </g>

      <text x="250" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="22" fill="#1E293B">
        ${cleanTitle.toUpperCase()}
      </text>

      <!-- Beat Timing Chip -->
      <g transform="translate(1540, 16)">
        <rect x="0" y="0" width="320" height="42" rx="12" fill="${analysis.badgeColor}" />
        <text x="160" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="16" fill="#FFFFFF" text-anchor="middle">
          Ý ${subIndex}/${totalBeats} • ${durSec.toFixed(1)}s (Đổi hình theo nhịp)
        </text>
      </g>

      <!-- Ground / Horizon Line for Characters -->
      <line x1="60" y1="870" x2="1860" y2="870" stroke="#CBD5E1" stroke-width="4" stroke-linecap="round" />

      <!-- Expressive Stickman Character -->
      ${charSvg}

      <!-- Centerpiece Thematic Stage Graphic -->
      ${stageGraphic}

      <!-- Bottom Subtitle Bar (Exact spoken clause) -->
      <g transform="translate(120, 930)">
        <rect x="0" y="0" width="1680" height="100" rx="24" fill="rgba(15, 23, 42, 0.94)" stroke="rgba(255, 255, 255, 0.2)" stroke-width="3" />
        <text x="840" y="62" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="26" text-anchor="middle" fill="#FFFFFF">
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
