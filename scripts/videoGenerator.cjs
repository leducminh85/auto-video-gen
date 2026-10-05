const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const googleTTS = require('google-tts-api');
const sharp = require('sharp');

// Load environment variables from .env if present
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

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

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Natural Content-Driven Scene Beat Segmenter
 * Does NOT impose an arbitrary <= 5s limit!
 * Allocates 1 or 2 high-impact illustrations based on natural thought shifts.
 */
function segmentSceneNaturally(scene, durationInSeconds, totalFrames) {
  const text = (scene.text || '').trim();

  // If short (<= 11s), 1 single strong visual illustration
  if (durationInSeconds <= 11.0) {
    return [
      {
        id: `scene_${scene.id}_beat_1`,
        sub_index: 1,
        title: scene.title,
        text,
        caption: text,
        duration_in_seconds: Number(durationInSeconds.toFixed(2)),
        duration_in_frames: totalFrames,
        start_frame_offset: 0,
      },
    ];
  }

  // Preserve numbers with dots (e.g. 2.600%, 500.000)
  const masked = text.replace(/(\d)\.(\d)/g, '$1___DOT___$2');
  const sentences = masked
    .split(/(?<=[.!?;\n])\s+/)
    .map((s) => s.replace(/___DOT___/g, '.').trim())
    .filter(Boolean);

  if (sentences.length <= 1) {
    return [
      {
        id: `scene_${scene.id}_beat_1`,
        sub_index: 1,
        title: scene.title,
        text,
        caption: text,
        duration_in_seconds: Number(durationInSeconds.toFixed(2)),
        duration_in_frames: totalFrames,
        start_frame_offset: 0,
      },
    ];
  }

  // Target word count per beat ~ 28 to 35 words (approx 8-11s of speech)
  const targetWords = 28;
  const parts = [];
  let current = [];
  let curCount = 0;

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const cnt = s.split(/\s+/).length;
    current.push(s);
    curCount += cnt;

    // If reached target words and still have sentences left
    if (curCount >= targetWords && i < sentences.length - 1) {
      parts.push(current.join(' '));
      current = [];
      curCount = 0;
    }
  }

  if (current.length > 0) {
    // If the trailing part is too short (< 14 words) and we already have parts, merge it
    if (curCount < 14 && parts.length > 0) {
      parts[parts.length - 1] += ' ' + current.join(' ');
    } else {
      parts.push(current.join(' '));
    }
  }

  const totalWords = parts.reduce((acc, p) => acc + p.split(/\s+/).length, 0) || 1;
  let allocated = 0;

  return parts.map((part, idx) => {
    const isLast = idx === parts.length - 1;
    const wordsCount = part.split(/\s+/).length;
    let frames = Math.round(totalFrames * (wordsCount / totalWords));
    if (isLast) frames = totalFrames - allocated;
    const startOffset = allocated;
    allocated += frames;
    const durSec = Number((frames / 30).toFixed(2));

    return {
      id: `scene_${scene.id}_beat_${idx + 1}`,
      sub_index: idx + 1,
      title: `${scene.title} - Phần ${idx + 1}`,
      text: part,
      caption: part,
      duration_in_seconds: durSec,
      duration_in_frames: frames,
      start_frame_offset: startOffset,
    };
  });
}

/**
 * Extract 1-2 Punchy Comic Title Words & Primary Metric from text
 */
function extractComicFeatures(clauseText, sceneTitle = '') {
  const clean = (clauseText || '').trim();
  const lower = clean.toLowerCase();

  // Extract percentage or prominent metric
  const percentMatch = clean.match(/(\d+(?:[.,]\d+)?\s*%\s*(?:-\s*\d+(?:[.,]\d+)?\s*%)?)/i);
  const metricMatch = clean.match(/(\d+(?:[.,]\d+)?\s*(?:triệu|tỷ|usd|đ|k|tiếng|ngày|tháng|năm|phút|giây|hội viên|đô|kg|bước))/i);

  const percentage = percentMatch ? percentMatch[0].replace(/\s+/g, '') : null;
  const metric = metricMatch ? metricMatch[0] : null;

  // Determine Visual Scene Metaphor Template
  let sceneType = 'universal';
  let comicTitle = 'CONCEPT';

  // 1. Beer Crate / Price Tag / Cans (Reference Image 4: BEER $43)
  if (/đóng thùng|thùng bia|lon bia|két bia|giá bán|43|đổ xô đi mở/i.test(lower)) {
    sceneType = 'beer_crate_price';
    comicTitle = metric || '$43';
  }
  // 2. Draft Beer Tap / Bar Counter / Handshake (Reference Image 5: FRESH ALE)
  else if (/taproom|rót bia|vòi bia|quầy bar|quá trình sản xuất|rời khỏi nhà xưởng|phân phối|tươi|lager|ale/i.test(lower)) {
    sceneType = 'beer_tap_hand';
    comicTitle = 'FRESH ALE';
  }
  // 3. Fermentation Tank / Brewing Machine / Printing Money
  else if (/bồn chứa|máy in tiền|cỗ máy in tiền|15 đô|xưởng nấu bia|mẻ bia/i.test(lower)) {
    sceneType = 'brewery_tank_machine';
    comicTitle = 'MÁY IN TIỀN';
  }
  // 4. 4 Core Ingredients: Water, Malt, Hops, Yeast
  else if (/nước, mạch nha|hoa bia|bốn thành phần|nguyên liệu cơ bản|nguyên liệu thô|15 đến 30 cent|cent/i.test(lower)) {
    sceneType = 'ingredients_four';
    comicTitle = '4 NGUYÊN LIỆU';
  }
  // 5. Giant Markup: +2,600% / Beer Mug
  else if (/2\.?600%|biên lợi nhuận khủng|8 đô|chênh lệch/i.test(lower)) {
    sceneType = 'profit_glass_jump';
    comicTitle = '+2,600%';
  }
  // 6. Closed Shutter / Bankruptcy / 5 Years
  else if (/đóng cửa|dậm chân tại chỗ|vật lộn|5 năm|lặng lẽ đóng cửa|phá sản/i.test(lower)) {
    sceneType = 'closed_shutter_business';
    comicTitle = 'CLOSED';
  }
  // 7. Startup Blueprint / 500K - 1.5M Capital
  else if (/500\.000|1[,.]5 triệu|chưa kiếm nổi một xu|10 thùng|60 người|quy mô|mở một xưởng/i.test(lower)) {
    sceneType = 'capital_startup_blueprint';
    comicTitle = '$500K - $1.5M';
  }
  // 8. Money Drain / Break Even / Bank Account
  else if (/tài khoản ngân hàng|hòa vốn|trầy trật|lần theo từng đồng/i.test(lower)) {
    sceneType = 'pie_chart';
    comicTitle = 'HÒA VỐN';
  }
  // 9. Crowd / Rush / Influx / Early Year / Queue / Gym join (Reference Image 1: WAVE)
  else if (/đăng ký|ồ ạt|đông đúc|hội viên|làn sóng|tháng một|tháng 1|đầu năm|mùa hè|giờ cao điểm|xếp hàng|ùn ùn|nườm nượp|wave|cỗ máy doanh thu/i.test(lower)) {
    sceneType = 'crowd_wave';
    comicTitle = 'WAVE';
  }
  // 10. Obstacle / Not Easy / Padlocked door / Cancellation barrier (Reference Image 3: NOT EASY)
  else if (/khó khăn|hủy|rào cản|không dễ|not easy|hợp đồng|thủ tục|rắc rối|phức tạp|bắt buộc|khóa|cản trở|bẫy|giữ chân|nản lòng/i.test(lower)) {
    sceneType = 'locked_door';
    comicTitle = 'NOT EASY';
  }
  // 11. Percentage / Royalty / Franchise / Fee cut (Reference Image 2: ROYALTY)
  else if (/nhượng quyền|royalty|hoa hồng|chiết khấu|phí doanh thu|cắt giảm|chia chác|thuế/i.test(lower) || (percentage && /doanh thu|lợi nhuận|nộp|chia|phí|thương hiệu/i.test(lower))) {
    sceneType = 'pie_chart';
    comicTitle = percentage ? `ROYALTY ${percentage}` : 'ROYALTY';
  }
  // 12. Freedom / Walking away / Violation / Say NO / Clean exit (Reference Image 4: VIOLATION)
  else if (/vi phạm|violation|khiếu nại|cơ quan quản lý|pháp luật|luật|bảo vệ|phạt|pháp lý|tự do|từ chối|hủy thành công|thoát|bước đi|rời bỏ|quyền/i.test(lower)) {
    sceneType = 'street_walk';
    comicTitle = 'VIOLATION';
  }
  // 13. Cooking / Broth / Kitchen / Recipe
  else if (/\b(phở|xương|nước dùng|gia vị|bếp|ẩm thực|nướng|luộc|thảo quả|hoa hồi|thịt bò)\b/i.test(lower)) {
    sceneType = 'cooking';
    comicTitle = metric ? `${metric.toUpperCase()}` : 'CHUẨN VỊ';
  }
  // 14. Tech / Code / Algorithm / Python / JS
  else if (/code|lập trình|thuật toán|developer|python|javascript|react|ai|dữ liệu|api|bug|bot|mã nguồn/i.test(lower)) {
    sceneType = 'tech_code';
    comicTitle = metric ? `${metric.toUpperCase()}` : 'ALGORITHM';
  }
  // 15. Compound Growth / Investment / Exponential wealth
  else if (/lãi kép|đầu tư|sinh lời|tích lũy|7 tỷ|2 triệu|tăng trưởng|về hưu|cấp số nhân/i.test(lower)) {
    sceneType = 'growth';
    comicTitle = 'LÃI KÉP';
  }
  // 16. Pure Percentage fallback
  else if (percentage) {
    sceneType = 'pie_chart';
    comicTitle = `TỶ LỆ ${percentage}`;
  }
  // 17. Lifestyle Inflation / Scooter vs Car / Income vs Expense
  else if (/15 lên 30|xe máy|ô tô|lương|chi tiêu|lối sống|dậm chân|sĩ diện|lạm phát lối sống/i.test(lower)) {
    sceneType = 'lifestyle_vs';
    comicTitle = 'LÃI SUẤT';
  }
  // 18. Peaceful Morning / Freedom from alarm / True Wealth
  else if (/thức dậy|buổi sáng|bình yên|báo thức|thảnh thơi|an nhiên|ngủ|xa xỉ/i.test(lower)) {
    sceneType = 'peaceful_morning';
    comicTitle = 'TỰ DO';
  }
  // 19. Fallback Universal
  else {
    sceneType = 'universal';
    comicTitle = sceneTitle ? sceneTitle.replace(/^(CẢNH|SCENE)\s*\d+[:.-]\s*/i, '').trim().split(/\s+/).slice(0, 2).join(' ').toUpperCase() : 'CHIẾN LƯỢC';
  }

  return {
    sceneType,
    comicTitle,
    percentage: percentage || '5-10%',
    metric: metric || '100%',
  };
}

/**
 * Smart Visual Scene Analyzer using Gemini AI with Anti-Repetition Diversity
 */
async function analyzeWithGemini(clauseText, sceneTitle = '', customKey = null, previousSceneType = '') {
  const apiKey = customKey || process.env.GEMINI_API_KEY || '';
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;
    const prompt = `You are an expert visual director for 2D minimalist cartoon explainer YouTube videos (style: Casually Explained, Vox).
Given scene text: "${clauseText}"
Scene title: "${sceneTitle}"
Previous beat sceneType was: "${previousSceneType || 'none'}"

CRITICAL DIVERSITY RULE:
Do NOT repeat the same visual metaphor as previous beats! Pick the most specific, creative, and distinct visual sceneType.
Available sceneTypes:
- 'beer_crate_price': Cardboard beer crate with 12 cans, price tag, and red rising arrow (retail markup, high price, beer case).
- 'beer_tap_hand': Hand pulling draft beer tap handle (FRESH ALE / LAGER), bar counter, handshake icon (taprooms, serving fresh beer, distributor deal).
- 'brewery_tank_machine': Giant stainless steel conical brewing fermentation tank with cash slot ($15 bills flowing out, money machine).
- 'ingredients_four': 4 circular pedestals showing Water, Barley/Malt, Hops, Yeast with a 15¢-30¢ price tag (raw materials).
- 'profit_glass_jump': Giant +2,600% starburst badge with frosty foaming beer mug (extreme profit margin, price markup).
- 'closed_shutter_business': Shuttered metal roll-down door of a bankrupt shop with CLOSED sign and 5 years calendar (business failure, struggling).
- 'capital_startup_blueprint': Blueprint floor plan of taproom/brewery with giant red stamp $500K-$1.5M and 0$ income (massive upfront investment).
- 'crowd_wave': Snaking crowd path heading into building with January calendar and $ NEW BILLING (rush, massive signups).
- 'pie_chart': Giant pie chart with red slice, calendar ghim, worried stickman pointing (percentages, fee cuts, royalties, break even).
- 'locked_door': NOT EASY padlocked heavy door with panicked stickman (obstacles, hard to cancel).
- 'street_walk': Street sidewalk, tree, building with crossed-out poster, happy stickman walking with briefcase and checkmark (freedom, violation).
- 'growth': Exponential growth curve, compound interest.
- 'cooking': Chef stickman with aromatic broth pot and spices.
- 'tech_code': Dark code terminal, developer stickman.
- 'universal': Lightbulb eureka idea with metric.

Return JSON:
{
  "comicTitle": "1 or 2 uppercase punchy words in Vietnamese or English (e.g. BEER $43, FRESH ALE, MÁY IN TIỀN, 4 NGUYÊN LIỆU, +2600%, CLOSED, $1.5 TRIỆU)",
  "sceneType": "one of the above types (MUST BE DIFFERENT from '${previousSceneType}')",
  "percentage": "extracted percentage if any, else null",
  "metric": "extracted metric if any, else null"
}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (res.ok) {
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        return {
          sceneType: parsed.sceneType || 'universal',
          comicTitle: (parsed.comicTitle || 'CHIẾN LƯỢC').toUpperCase(),
          percentage: parsed.percentage || null,
          metric: parsed.metric || null,
          fromGemini: true,
        };
      }
    }
  } catch (_) {
    // Graceful fallback to local rules
  }
  return null;
}

/**
 * Creative 2D Cartoon SVG Scene Synthesizer
 * Matches the hand-drawn visual style of the reference images.
 */
function createCartoonSceneSvg({ clauseText, sceneTitle, sceneIndex, subIndex, features }) {
  const { sceneType, comicTitle, percentage, metric } = features;
  const safeTitle = escapeXml(comicTitle);
  const safeClause = escapeXml(clauseText.length > 95 ? clauseText.substring(0, 92) + '...' : clauseText);

  // 1. BEER CRATE WITH $43 PRICE TAG & RED RISING ARROW (Reference Image 4)
  if (sceneType === 'beer_crate_price') {
    const displayPrice = escapeXml(metric || '$43');
    return `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="1920" height="1080" fill="#FFFFFF" />

        <!-- Beer Crate & Cans Group -->
        <g transform="translate(420, 260)">
          <!-- Back Cans Row (peeking over) -->
          <g transform="translate(60, 60)">
            <g transform="translate(0, 0)">
              <rect x="0" y="20" width="105" height="140" rx="16" fill="#4B6A45" stroke="#1E293B" stroke-width="8" stroke-linejoin="round"/>
              <ellipse cx="52" cy="20" rx="42" ry="18" fill="#D4AF37" stroke="#1E293B" stroke-width="6"/>
            </g>
            <g transform="translate(130, -5)">
              <rect x="0" y="20" width="105" height="140" rx="16" fill="#4B6A45" stroke="#1E293B" stroke-width="8" stroke-linejoin="round"/>
              <ellipse cx="52" cy="20" rx="42" ry="18" fill="#D4AF37" stroke="#1E293B" stroke-width="6"/>
            </g>
            <g transform="translate(260, -10)">
              <rect x="0" y="20" width="105" height="140" rx="16" fill="#4B6A45" stroke="#1E293B" stroke-width="8" stroke-linejoin="round"/>
              <ellipse cx="52" cy="20" rx="42" ry="18" fill="#D4AF37" stroke="#1E293B" stroke-width="6"/>
            </g>
            <g transform="translate(390, -15)">
              <rect x="0" y="20" width="105" height="140" rx="16" fill="#4B6A45" stroke="#1E293B" stroke-width="8" stroke-linejoin="round"/>
              <ellipse cx="52" cy="20" rx="42" ry="18" fill="#D4AF37" stroke="#1E293B" stroke-width="6"/>
            </g>
          </g>

          <!-- Cardboard Crate Handle Back Support -->
          <path d="M 120 70 L 620 40 L 620 220 L 120 250 Z" fill="#C29462" stroke="#1E293B" stroke-width="8" stroke-linejoin="round"/>
          <rect x="300" y="90" width="180" height="50" rx="25" fill="#FFFFFF" stroke="#1E293B" stroke-width="8" transform="rotate(-3 390 115)"/>

          <!-- Front Cans Row -->
          <g transform="translate(80, 140)">
            <g transform="translate(0, 20)">
              <rect x="0" y="0" width="115" height="180" rx="20" fill="#587B51" stroke="#1E293B" stroke-width="8" stroke-linejoin="round"/>
              <ellipse cx="57" cy="0" rx="46" ry="20" fill="#E2C766" stroke="#1E293B" stroke-width="6"/>
              <path d="M 20 80 Q 57 110 95 80" fill="none" stroke="#D1E7DD" stroke-width="6" opacity="0.6"/>
            </g>
            <g transform="translate(130, 12)">
              <rect x="0" y="0" width="115" height="180" rx="20" fill="#587B51" stroke="#1E293B" stroke-width="8" stroke-linejoin="round"/>
              <ellipse cx="57" cy="0" rx="46" ry="20" fill="#E2C766" stroke="#1E293B" stroke-width="6"/>
              <path d="M 20 80 Q 57 110 95 80" fill="none" stroke="#D1E7DD" stroke-width="6" opacity="0.6"/>
            </g>
            <g transform="translate(260, 4)">
              <rect x="0" y="0" width="115" height="180" rx="20" fill="#587B51" stroke="#1E293B" stroke-width="8" stroke-linejoin="round"/>
              <ellipse cx="57" cy="0" rx="46" ry="20" fill="#E2C766" stroke="#1E293B" stroke-width="6"/>
              <path d="M 20 80 Q 57 110 95 80" fill="none" stroke="#D1E7DD" stroke-width="6" opacity="0.6"/>
            </g>
            <g transform="translate(390, -4)">
              <rect x="0" y="0" width="115" height="180" rx="20" fill="#587B51" stroke="#1E293B" stroke-width="8" stroke-linejoin="round"/>
              <ellipse cx="57" cy="0" rx="46" ry="20" fill="#E2C766" stroke="#1E293B" stroke-width="6"/>
              <path d="M 20 80 Q 57 110 95 80" fill="none" stroke="#D1E7DD" stroke-width="6" opacity="0.6"/>
            </g>
          </g>

          <!-- Cardboard Box Body -->
          <polygon points="40,240 700,180 710,640 40,680" fill="#D3A26D" stroke="#1E293B" stroke-width="10" stroke-linejoin="round"/>
          <polygon points="-80,310 40,240 40,680 -90,610" fill="#BA8957" stroke="#1E293B" stroke-width="10" stroke-linejoin="round"/>

          <!-- Hand-Drawn BEER Text on Box Front -->
          <text x="380" y="490" font-family="'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif" font-weight="900" font-size="140" fill="#1E293B" letter-spacing="12" text-anchor="middle" transform="rotate(-5 380 490)">
            BEER
          </text>

          <!-- Hanging Price Tag -->
          <g transform="translate(600, 10)">
            <path d="M 30 110 Q 70 30 120 70 Q 140 10 170 30" fill="none" stroke="#1E293B" stroke-width="6" stroke-linecap="round"/>
            <g transform="translate(130, 20) rotate(8)">
              <polygon points="0,0 360,-40 420,120 60,160" fill="#FFFFFF" stroke="#1E293B" stroke-width="9" stroke-linejoin="round"/>
              <circle cx="35" cy="70" r="12" fill="none" stroke="#1E293B" stroke-width="6"/>
              <text x="210" y="95" font-family="'Comic Sans MS', sans-serif" font-weight="900" font-size="120" fill="#1E293B" text-anchor="middle">
                ${displayPrice}
              </text>
            </g>
          </g>
        </g>

        <!-- Big Red Upward Arrow on the Right -->
        <g transform="translate(1360, 420)">
          <path d="M 140 0 L 260 180 L 190 180 L 190 420 L 90 420 L 90 180 L 20 180 Z" fill="#EF4444" stroke="#1E293B" stroke-width="12" stroke-linejoin="round"/>
        </g>
      </svg>
    `;
  }

  // 2. DRAFT BEER TAP & HANDSHAKE PARTNERSHIP (Reference Image 5)
  if (sceneType === 'beer_tap_hand') {
    return `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="1920" height="1080" fill="#FFFFFF" />

        <!-- Partnership Handshake Icon in Top Left -->
        <g transform="translate(180, 140)">
          <g transform="scale(1.6)">
            <rect x="0" y="50" width="30" height="44" rx="6" fill="#1E3A8A" stroke="#1E293B" stroke-width="6"/>
            <path d="M 28 56 L 68 20 Q 95 35 78 68 L 50 82 Z" fill="#2563EB" stroke="#1E293B" stroke-width="6" stroke-linejoin="round"/>
            <rect x="135" y="50" width="30" height="44" rx="6" fill="#1E3A8A" stroke="#1E293B" stroke-width="6"/>
            <path d="M 137 56 L 97 20 Q 70 35 87 68 L 115 82 Z" fill="#60A5FA" stroke="#1E293B" stroke-width="6" stroke-linejoin="round"/>
            <path d="M 45 72 Q 80 95 120 72" fill="none" stroke="#1E293B" stroke-width="7" stroke-linecap="round"/>
            <circle cx="58" cy="84" r="8" fill="#2563EB" stroke="#1E293B" stroke-width="5"/>
            <circle cx="78" cy="90" r="8" fill="#2563EB" stroke="#1E293B" stroke-width="5"/>
            <circle cx="98" cy="88" r="8" fill="#60A5FA" stroke="#1E293B" stroke-width="5"/>
            <circle cx="114" cy="80" r="8" fill="#60A5FA" stroke="#1E293B" stroke-width="5"/>
          </g>
        </g>

        <!-- Bar Counter Line -->
        <line x1="80" y1="880" x2="1840" y2="880" stroke="#854D0E" stroke-width="16" stroke-linecap="round"/>
        <rect x="180" y="880" width="1580" height="24" fill="#A16207" stroke="#1E293B" stroke-width="4"/>

        <!-- Beer Tap Column / Tower -->
        <g transform="translate(720, 520)">
          <ellipse cx="60" cy="460" rx="90" ry="24" fill="#334155" stroke="#1E293B" stroke-width="8"/>
          <rect x="10" y="0" width="100" height="460" rx="10" fill="#475569" stroke="#1E293B" stroke-width="8"/>
          <ellipse cx="60" cy="0" rx="50" ry="18" fill="#64748B" stroke="#1E293B" stroke-width="8"/>

          <g transform="translate(100, 30)">
            <rect x="0" y="10" width="70" height="40" rx="6" fill="#64748B" stroke="#1E293B" stroke-width="7"/>
            <path d="M 60 40 Q 90 70 80 120 L 50 120 Q 55 80 40 50 Z" fill="#94A3B8" stroke="#1E293B" stroke-width="7" stroke-linejoin="round"/>
            <g transform="translate(130, 220)">
              <polygon points="10,0 70,0 60,110 20,110" fill="#FFFFFF" stroke="#1E293B" stroke-width="6"/>
            </g>
          </g>

          <!-- Handle 1: LAGER -->
          <g transform="translate(40, 40) rotate(-22)">
            <polygon points="20,-240 70,-240 60,0 30,0" fill="#92400E" stroke="#1E293B" stroke-width="8" stroke-linejoin="round"/>
            <text x="45" y="-100" font-family="sans-serif" font-weight="900" font-size="28" fill="#1E293B" letter-spacing="6" text-anchor="middle" transform="rotate(90 45 -100)">
              LAGER
            </text>
          </g>

          <!-- Handle 2: FRESH ALE -->
          <g transform="translate(130, 20) rotate(10)">
            <polygon points="20,-260 80,-260 70,0 30,0" fill="#FDE047" stroke="#1E293B" stroke-width="8" stroke-linejoin="round"/>
            <path d="M 50 -130 Q 65 -110 50 -90 Q 35 -110 50 -130 Z" fill="#15803D" stroke="#1E293B" stroke-width="4"/>
            <text x="50" y="-190" font-family="sans-serif" font-weight="900" font-size="24" fill="#1E293B" letter-spacing="2" text-anchor="middle">FRESH</text>
            <text x="50" y="-160" font-family="sans-serif" font-weight="900" font-size="24" fill="#1E293B" letter-spacing="2" text-anchor="middle">ALE</text>
          </g>

          <!-- Hand gripping Handle 2 -->
          <g transform="translate(140, -140)">
            <path d="M 700 240 L 400 180 L 80 40 L 40 120 L 400 280 L 700 360 Z" fill="#FDBA74" stroke="#1E293B" stroke-width="9" stroke-linejoin="round"/>
            <path d="M 700 240 L 540 208 L 540 338 L 700 360 Z" fill="#FB923C" stroke="#1E293B" stroke-width="8"/>
            <circle cx="50" cy="50" r="32" fill="#FDBA74" stroke="#1E293B" stroke-width="7"/>
            <ellipse cx="25" cy="30" rx="14" ry="10" fill="#FDBA74" stroke="#1E293B" stroke-width="6"/>
            <ellipse cx="18" cy="55" rx="14" ry="10" fill="#FDBA74" stroke="#1E293B" stroke-width="6"/>
            <ellipse cx="16" cy="80" rx="14" ry="10" fill="#FDBA74" stroke="#1E293B" stroke-width="6"/>
            <path d="M 75 35 Q 95 65 75 95" fill="none" stroke="#1E293B" stroke-width="7" stroke-linecap="round"/>
          </g>
        </g>
      </svg>
    `;
  }

  // 3. BREWERY FERMENTATION TANK / MONEY PRINTING MACHINE
  if (sceneType === 'brewery_tank_machine') {
    return `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="1920" height="1080" fill="#FBF8EE" />

        <text x="960" y="150" font-family="'Comic Sans MS', sans-serif" font-weight="900" font-size="90" fill="#EAB308" stroke="#1E293B" stroke-width="8" stroke-linejoin="round" text-anchor="middle" paint-order="stroke fill">
          ${safeTitle}
        </text>

        <!-- Big Stainless Steel Conical Fermenter Tank -->
        <g transform="translate(860, 480)">
          <line x1="-160" y1="200" x2="-220" y2="440" stroke="#1E293B" stroke-width="12" stroke-linecap="round"/>
          <line x1="160" y1="200" x2="220" y2="440" stroke="#1E293B" stroke-width="12" stroke-linecap="round"/>
          <line x1="0" y1="240" x2="0" y2="440" stroke="#1E293B" stroke-width="12" stroke-linecap="round"/>

          <rect x="-180" y="-220" width="360" height="380" rx="20" fill="#CBD5E1" stroke="#1E293B" stroke-width="10"/>
          <ellipse cx="0" cy="-220" rx="180" ry="40" fill="#E2E8F0" stroke="#1E293B" stroke-width="10"/>
          <path d="M -140 -200 L -140 140" stroke="#FFFFFF" stroke-width="16" stroke-linecap="round" opacity="0.6"/>
          
          <polygon points="-180,160 180,160 0,320" fill="#94A3B8" stroke="#1E293B" stroke-width="10" stroke-linejoin="round"/>
          
          <rect x="-20" y="320" width="40" height="50" fill="#475569" stroke="#1E293B" stroke-width="8"/>
          <circle cx="35" cy="345" r="16" fill="#DC2626" stroke="#1E293B" stroke-width="6"/>

          <g transform="translate(100, -270)">
            <circle cx="0" cy="0" r="45" fill="#FFFFFF" stroke="#1E293B" stroke-width="8"/>
            <line x1="0" y1="0" x2="22" y2="-18" stroke="#DC2626" stroke-width="6" stroke-linecap="round"/>
            <circle cx="0" cy="0" r="8" fill="#1E293B"/>
          </g>

          <!-- Cash Output Slot on Tank Front -->
          <g transform="translate(-100, 20)">
            <rect x="0" y="0" width="200" height="24" rx="6" fill="#1E293B"/>
            <g transform="translate(30, 16) rotate(12)">
              <rect x="0" y="0" width="130" height="70" rx="6" fill="#86EFAC" stroke="#1E293B" stroke-width="6"/>
              <text x="65" y="44" font-family="sans-serif" font-weight="900" font-size="28" fill="#15803D" text-anchor="middle">$15</text>
            </g>
          </g>
        </g>

        <!-- Happy Stickman Holding Beer Glass on Left -->
        <g transform="translate(360, 480)">
          <circle cx="100" cy="100" r="65" fill="#FFFFFF" stroke="#1E293B" stroke-width="9"/>
          <circle cx="85" cy="95" r="6" fill="#1E293B"/>
          <circle cx="115" cy="95" r="6" fill="#1E293B"/>
          <path d="M 85 125 Q 100 145 120 125" fill="none" stroke="#1E293B" stroke-width="6" stroke-linecap="round"/>

          <path d="M 60 165 L 140 165 L 145 320 L 55 320 Z" fill="#60A5FA" stroke="#1E293B" stroke-width="9" stroke-linejoin="round"/>
          
          <path d="M 60 190 L -30 160 L -40 130" fill="none" stroke="#1E293B" stroke-width="9" stroke-linecap="round"/>
          <g transform="translate(-110, 80)">
            <rect x="0" y="30" width="60" height="90" rx="8" fill="#FDE047" stroke="#1E293B" stroke-width="6"/>
            <path d="M -5 30 Q 30 10 65 30 Z" fill="#FFFFFF" stroke="#1E293B" stroke-width="5"/>
            <circle cx="10" cy="18" r="14" fill="#FFFFFF" stroke="#1E293B" stroke-width="4"/>
            <circle cx="35" cy="14" r="16" fill="#FFFFFF" stroke="#1E293B" stroke-width="4"/>
            <circle cx="55" cy="20" r="12" fill="#FFFFFF" stroke="#1E293B" stroke-width="4"/>
            <path d="M 0 45 Q -25 75 0 105" fill="none" stroke="#1E293B" stroke-width="6" stroke-linecap="round"/>
          </g>
          <path d="M 140 190 L 260 140" fill="none" stroke="#1E293B" stroke-width="9" stroke-linecap="round"/>

          <line x1="85" y1="320" x2="85" y2="480" stroke="#1E293B" stroke-width="10" stroke-linecap="round"/>
          <line x1="115" y1="320" x2="115" y2="480" stroke="#1E293B" stroke-width="10" stroke-linecap="round"/>
          <ellipse cx="75" cy="485" rx="20" ry="10" fill="#1E293B"/>
          <ellipse cx="125" cy="485" rx="20" ry="10" fill="#1E293B"/>
        </g>
      </svg>
    `;
  }

  // 4. FOUR INGREDIENTS DISPLAY: WATER, MALT, HOPS, YEAST
  if (sceneType === 'ingredients_four') {
    return `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="1920" height="1080" fill="#FBF8EE" />

        <text x="960" y="150" font-family="'Comic Sans MS', sans-serif" font-weight="900" font-size="90" fill="#1E293B" text-anchor="middle">
          ${safeTitle}
        </text>

        <!-- 4 Ingredient Circles -->
        <g transform="translate(240, 360)">
          <circle cx="120" cy="120" r="115" fill="#E0F2FE" stroke="#1E293B" stroke-width="9"/>
          <path d="M 120 40 C 90 90 60 130 60 160 C 60 195 87 220 120 220 C 153 220 180 195 180 160 C 180 130 150 90 120 40 Z" fill="#38BDF8" stroke="#1E293B" stroke-width="8" stroke-linejoin="round"/>
          <text x="120" y="290" font-family="sans-serif" font-weight="900" font-size="34" fill="#1E293B" text-anchor="middle">NƯỚC</text>
        </g>

        <g transform="translate(600, 360)">
          <circle cx="120" cy="120" r="115" fill="#FEF3C7" stroke="#1E293B" stroke-width="9"/>
          <g transform="translate(120, 130)">
            <line x1="0" y1="-80" x2="0" y2="80" stroke="#B45309" stroke-width="8" stroke-linecap="round"/>
            <ellipse cx="-25" cy="-40" rx="20" ry="10" fill="#F59E0B" stroke="#1E293B" stroke-width="5" transform="rotate(-30 -25 -40)"/>
            <ellipse cx="25" cy="-25" rx="20" ry="10" fill="#F59E0B" stroke="#1E293B" stroke-width="5" transform="rotate(30 25 -25)"/>
            <ellipse cx="-25" cy="0" rx="20" ry="10" fill="#F59E0B" stroke="#1E293B" stroke-width="5" transform="rotate(-30 -25 0)"/>
            <ellipse cx="25" cy="15" rx="20" ry="10" fill="#F59E0B" stroke="#1E293B" stroke-width="5" transform="rotate(30 25 15)"/>
          </g>
          <text x="120" y="290" font-family="sans-serif" font-weight="900" font-size="34" fill="#1E293B" text-anchor="middle">MẠCH NHA</text>
        </g>

        <g transform="translate(960, 360)">
          <circle cx="120" cy="120" r="115" fill="#DCFCE7" stroke="#1E293B" stroke-width="9"/>
          <g transform="translate(120, 120)">
            <polygon points="0,-70 50,0 35,60 0,80 -35,60 -50,0" fill="#22C55E" stroke="#1E293B" stroke-width="8" stroke-linejoin="round"/>
            <path d="M -30 10 Q 0 -20 30 10" fill="none" stroke="#166534" stroke-width="6"/>
            <path d="M -25 40 Q 0 10 25 40" fill="none" stroke="#166534" stroke-width="6"/>
          </g>
          <text x="120" y="290" font-family="sans-serif" font-weight="900" font-size="34" fill="#1E293B" text-anchor="middle">HOA BIA</text>
        </g>

        <g transform="translate(1320, 360)">
          <circle cx="120" cy="120" r="115" fill="#FCE7F3" stroke="#1E293B" stroke-width="9"/>
          <circle cx="100" cy="100" r="32" fill="#F43F5E" stroke="#1E293B" stroke-width="6"/>
          <circle cx="145" cy="85" r="22" fill="#FB7185" stroke="#1E293B" stroke-width="5"/>
          <circle cx="130" cy="140" r="28" fill="#FDA4AF" stroke="#1E293B" stroke-width="6"/>
          <circle cx="90" cy="150" r="18" fill="#F43F5E" stroke="#1E293B" stroke-width="5"/>
          <text x="120" y="290" font-family="sans-serif" font-weight="900" font-size="34" fill="#1E293B" text-anchor="middle">MEN BIA</text>
        </g>

        <g transform="translate(760, 800)">
          <rect x="0" y="0" width="400" height="95" rx="16" fill="#EF4444" stroke="#1E293B" stroke-width="8"/>
          <text x="200" y="65" font-family="sans-serif" font-weight="900" font-size="48" fill="#FFFFFF" text-anchor="middle">
            15¢ - 30¢ / LY
          </text>
        </g>
      </svg>
    `;
  }

  // 5. GIANT PROFIT MARKUP BADGE (+2,600% / BEER GLASS)
  if (sceneType === 'profit_glass_jump') {
    return `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="1920" height="1080" fill="#FBF8EE" />

        <!-- Giant +2,600% Badge -->
        <g transform="translate(1180, 480)">
          <circle cx="0" cy="0" r="320" fill="#EF4444" stroke="#1E293B" stroke-width="12"/>
          <circle cx="0" cy="0" r="290" fill="#DC2626" stroke="#FFFFFF" stroke-width="6"/>
          <text x="0" y="-40" font-family="'Comic Sans MS', sans-serif" font-weight="900" font-size="110" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" paint-order="stroke fill" text-anchor="middle">
            ${safeTitle}
          </text>
          <text x="0" y="70" font-family="sans-serif" font-weight="900" font-size="48" fill="#FEF08A" stroke="#1E293B" stroke-width="4" paint-order="stroke fill" text-anchor="middle">
            CHÊNH LỆCH GIÁ
          </text>
          <text x="0" y="140" font-family="sans-serif" font-weight="900" font-size="34" fill="#FFFFFF" text-anchor="middle">
            VỐN 30¢ ➔ BÁN 8$
          </text>
        </g>

        <!-- Big Frosty Beer Glass on Left -->
        <g transform="translate(420, 280)">
          <polygon points="50,140 250,140 220,540 80,540" fill="#FEF08A" stroke="#1E293B" stroke-width="10" stroke-linejoin="round"/>
          <ellipse cx="150" cy="540" rx="70" ry="24" fill="#E2E8F0" stroke="#1E293B" stroke-width="8"/>
          <polygon points="65,190 235,190 215,520 85,520" fill="#FBBF24" stroke="none"/>
          <path d="M 30 150 Q 150 70 270 150 Q 280 200 240 200 Q 150 170 60 200 Z" fill="#FFFFFF" stroke="#1E293B" stroke-width="8"/>
          <circle cx="50" cy="120" r="28" fill="#FFFFFF" stroke="#1E293B" stroke-width="6"/>
          <circle cx="95" cy="95" r="34" fill="#FFFFFF" stroke="#1E293B" stroke-width="6"/>
          <circle cx="150" cy="85" r="38" fill="#FFFFFF" stroke="#1E293B" stroke-width="6"/>
          <circle cx="205" cy="100" r="32" fill="#FFFFFF" stroke="#1E293B" stroke-width="6"/>
          <circle cx="245" cy="130" r="26" fill="#FFFFFF" stroke="#1E293B" stroke-width="6"/>
          <g transform="translate(220, 320) rotate(10)">
            <polygon points="0,0 160,-20 180,60 20,80" fill="#22C55E" stroke="#1E293B" stroke-width="6"/>
            <text x="90" y="48" font-family="sans-serif" font-weight="900" font-size="44" fill="#FFFFFF" text-anchor="middle">8$</text>
          </g>
        </g>
      </svg>
    `;
  }

  // 6. CLOSED SHUTTER / BANKRUPTCY (< 5 YEARS)
  if (sceneType === 'closed_shutter_business') {
    return `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="1920" height="1080" fill="#E2E8F0" />

        <g transform="translate(480, 160)">
          <rect x="-40" y="0" width="1040" height="840" fill="#94A3B8" stroke="#1E293B" stroke-width="10"/>
          <rect x="0" y="80" width="960" height="720" fill="#64748B" stroke="#1E293B" stroke-width="8"/>
          <line x1="0" y1="160" x2="960" y2="160" stroke="#334155" stroke-width="6"/>
          <line x1="0" y1="240" x2="960" y2="240" stroke="#334155" stroke-width="6"/>
          <line x1="0" y1="320" x2="960" y2="320" stroke="#334155" stroke-width="6"/>
          <line x1="0" y1="400" x2="960" y2="400" stroke="#334155" stroke-width="6"/>
          <line x1="0" y1="480" x2="960" y2="480" stroke="#334155" stroke-width="6"/>
          <line x1="0" y1="560" x2="960" y2="560" stroke="#334155" stroke-width="6"/>

          <g transform="translate(240, 240) rotate(-6)">
            <line x1="80" y1="-80" x2="80" y2="0" stroke="#1E293B" stroke-width="8"/>
            <line x1="400" y1="-80" x2="400" y2="0" stroke="#1E293B" stroke-width="8"/>
            <rect x="0" y="0" width="480" height="180" rx="12" fill="#DC2626" stroke="#1E293B" stroke-width="10"/>
            <text x="240" y="125" font-family="'Comic Sans MS', sans-serif" font-weight="900" font-size="110" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" paint-order="stroke fill" letter-spacing="8" text-anchor="middle">
              CLOSED
            </text>
          </g>

          <g transform="translate(420, 680)">
            <circle cx="60" cy="30" r="35" fill="none" stroke="#1E293B" stroke-width="14"/>
            <rect x="20" y="30" width="80" height="80" rx="10" fill="#F59E0B" stroke="#1E293B" stroke-width="8"/>
          </g>

          <g transform="translate(740, 360) rotate(12)">
            <rect x="0" y="0" width="180" height="190" rx="10" fill="#FFFFFF" stroke="#1E293B" stroke-width="7"/>
            <rect x="0" y="0" width="180" height="45" rx="10" fill="#EF4444" stroke="#1E293B" stroke-width="7"/>
            <text x="90" y="32" font-family="sans-serif" font-weight="900" font-size="20" fill="#FFFFFF" text-anchor="middle">THỜI GIAN</text>
            <text x="90" y="115" font-family="sans-serif" font-weight="900" font-size="52" fill="#1E293B" text-anchor="middle">&lt; 5</text>
            <text x="90" y="160" font-family="sans-serif" font-weight="900" font-size="30" fill="#DC2626" text-anchor="middle">NĂM</text>
          </g>
        </g>

        <!-- Sad stickman sitting -->
        <g transform="translate(180, 520)">
          <circle cx="100" cy="100" r="60" fill="#FFFFFF" stroke="#1E293B" stroke-width="9"/>
          <path d="M 70 85 Q 85 95 100 85" fill="none" stroke="#1E293B" stroke-width="6" stroke-linecap="round"/>
          <path d="M 75 135 Q 100 115 125 135" fill="none" stroke="#1E293B" stroke-width="6" stroke-linecap="round"/>
          <circle cx="80" cy="100" r="6" fill="#1E293B"/>
          <circle cx="120" cy="100" r="6" fill="#1E293B"/>
          <path d="M 60 160 L 140 160 L 130 300 L 50 300 Z" fill="#94A3B8" stroke="#1E293B" stroke-width="9"/>
          <path d="M 60 180 L 10 140 L 45 110" fill="none" stroke="#1E293B" stroke-width="9" stroke-linecap="round"/>
          <line x1="70" y1="300" x2="30" y2="420" stroke="#1E293B" stroke-width="10" stroke-linecap="round"/>
          <line x1="110" y1="300" x2="160" y2="420" stroke="#1E293B" stroke-width="10" stroke-linecap="round"/>
        </g>
      </svg>
    `;
  }

  // 7. STARTUP CAPITAL BLUEPRINT ($500,000 - $1,500,000)
  if (sceneType === 'capital_startup_blueprint') {
    return `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="1920" height="1080" fill="#0F172A" />

        <g stroke="#1E293B" stroke-width="2" opacity="0.6">
          <line x1="0" y1="200" x2="1920" y2="200"/>
          <line x1="0" y1="400" x2="1920" y2="400"/>
          <line x1="0" y1="600" x2="1920" y2="600"/>
          <line x1="0" y1="800" x2="1920" y2="800"/>
          <line x1="300" y1="0" x2="300" y2="1080"/>
          <line x1="600" y1="0" x2="600" y2="1080"/>
          <line x1="900" y1="0" x2="900" y2="1080"/>
          <line x1="1200" y1="0" x2="1200" y2="1080"/>
          <line x1="1500" y1="0" x2="1500" y2="1080"/>
        </g>

        <g transform="translate(360, 220)">
          <rect x="0" y="0" width="1200" height="660" rx="16" fill="#1E293B" stroke="#38BDF8" stroke-width="8"/>
          <rect x="20" y="20" width="480" height="80" rx="8" fill="#0F172A" stroke="#38BDF8" stroke-width="4"/>
          <text x="40" y="70" font-family="'Courier New', monospace" font-weight="900" font-size="34" fill="#38BDF8">
            BLUEPRINT: 10 THÙNG / 60 CHỖ
          </text>

          <rect x="60" y="130" width="460" height="480" fill="none" stroke="#38BDF8" stroke-width="6" stroke-dasharray="16,8"/>
          <text x="290" y="380" font-family="sans-serif" font-weight="900" font-size="38" fill="#94A3B8" text-anchor="middle">
            KHU NẤU BIA (BREWERY)
          </text>

          <rect x="560" y="130" width="580" height="480" fill="none" stroke="#38BDF8" stroke-width="6" stroke-dasharray="16,8"/>
          <text x="850" y="380" font-family="sans-serif" font-weight="900" font-size="38" fill="#94A3B8" text-anchor="middle">
            QUẦY TAPROOM (BAR &amp; 60 GHẾ)
          </text>

          <g transform="translate(600, 320) rotate(-10)">
            <rect x="-380" y="-80" width="760" height="160" rx="20" fill="none" stroke="#EF4444" stroke-width="12"/>
            <text x="0" y="25" font-family="'Comic Sans MS', sans-serif" font-weight="900" font-size="80" fill="#EF4444" text-anchor="middle">
              $500,000 - $1,500,000
            </text>
          </g>

          <g transform="translate(60, 530)">
            <rect x="0" y="0" width="280" height="60" rx="8" fill="#F59E0B" stroke="#1E293B" stroke-width="4"/>
            <text x="140" y="42" font-family="sans-serif" font-weight="900" font-size="28" fill="#1E293B" text-anchor="middle">
              0$ DOANH THU
            </text>
          </g>
        </g>
      </svg>
    `;
  }

  // 8. PIE CHART SCENE (Reference Image 2: ROYALTY 5-10% with worried character)
  if (sceneType === 'pie_chart') {
    return `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="1920" height="1080" fill="#FBF8EE" />

        <!-- Bold Comic Title -->
        <text x="960" y="160" font-family="'Comic Sans MS', 'Chalkboard SE', 'Fredoka', 'Be Vietnam Pro', system-ui, sans-serif" font-weight="900" font-size="96" fill="#EF4444" stroke="#1E293B" stroke-width="8" stroke-linejoin="round" text-anchor="middle" paint-order="stroke fill">
          ${safeTitle}
        </text>

        <!-- Giant Hand-Drawn Pie Chart -->
        <g transform="translate(850, 560)">
          <!-- Blue Base Circle -->
          <circle cx="0" cy="0" r="300" fill="#60A5FA" stroke="#1E293B" stroke-width="12" />
          <!-- Red Slice -->
          <path d="M 0 0 L 0 -300 A 300 300 0 0 1 190 -230 Z" fill="#EF4444" stroke="#1E293B" stroke-width="10" />
          <text x="90" y="-120" font-family="sans-serif" font-weight="900" font-size="52" fill="#FFFFFF" stroke="#1E293B" stroke-width="4" paint-order="stroke fill" text-anchor="middle">
            ${escapeXml(percentage)}
          </text>
          
          <!-- Pinned Mini Calendar -->
          <g transform="translate(100, -50)">
            <rect x="0" y="0" width="160" height="90" rx="10" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
            <line x1="0" y1="28" x2="160" y2="28" stroke="#1E293B" stroke-width="4" />
            <text x="80" y="55" font-family="sans-serif" font-weight="900" font-size="20" fill="#1E293B" text-anchor="middle">EVERY</text>
            <text x="80" y="78" font-family="sans-serif" font-weight="900" font-size="20" fill="#1E293B" text-anchor="middle">MONTH</text>
          </g>
        </g>

        <!-- Worried Stickman Pointing Finger -->
        <g transform="translate(1380, 480)">
          <circle cx="100" cy="100" r="70" fill="#FFFFFF" stroke="#1E293B" stroke-width="10" />
          <!-- Worried eyebrows & eyes -->
          <path d="M 65 75 Q 80 65 95 80" fill="none" stroke="#1E293B" stroke-width="6" stroke-linecap="round" />
          <path d="M 135 75 Q 120 65 105 80" fill="none" stroke="#1E293B" stroke-width="6" stroke-linecap="round" />
          <circle cx="80" cy="95" r="8" fill="#1E293B" />
          <circle cx="120" cy="95" r="8" fill="#1E293B" />
          <path d="M 80 135 Q 100 120 120 135" fill="none" stroke="#1E293B" stroke-width="6" stroke-linecap="round" />
          <!-- Sweat Drop -->
          <path d="M 145 90 Q 155 100 150 110 Q 140 105 145 90 Z" fill="#38BDF8" stroke="#1E293B" stroke-width="3" />
          
          <!-- Light Blue Shirt -->
          <path d="M 60 170 L 140 170 L 145 320 L 55 320 Z" fill="#BFDBFE" stroke="#1E293B" stroke-width="10" stroke-linejoin="round" />
          <!-- Pointing Arm with Index Finger -->
          <path d="M 60 200 L -120 120" fill="none" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
          <circle cx="-125" cy="118" r="14" fill="#FFFFFF" stroke="#1E293B" stroke-width="5" />
          <path d="M -125 118 L -155 105" stroke="#1E293B" stroke-width="7" stroke-linecap="round" />
          <!-- Relaxed arm -->
          <path d="M 140 200 L 170 270 L 165 310" fill="none" stroke="#1E293B" stroke-width="8" stroke-linecap="round" />
          <!-- Legs -->
          <line x1="85" y1="320" x2="85" y2="480" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
          <line x1="115" y1="320" x2="115" y2="480" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
          <ellipse cx="75" cy="485" rx="20" ry="10" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
          <ellipse cx="125" cy="485" rx="20" ry="10" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
        </g>
      </svg>
    `;
  }

  // 2. LOCKED DOOR SCENE (e.g. Image 3: NOT EASY / EASY crossed out)
  if (sceneType === 'locked_door') {
    return `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="1920" height="1080" fill="#EAECEF" />

        <!-- Crossed out EASY in top left -->
        <g transform="translate(180, 160)">
          <text x="0" y="0" font-family="'Comic Sans MS', sans-serif" font-weight="900" font-size="88" fill="#EF4444" stroke="#1E293B" stroke-width="4" paint-order="stroke fill">EASY</text>
          <line x1="-30" y1="20" x2="250" y2="-70" stroke="#DC2626" stroke-width="12" stroke-linecap="round" />
        </g>

        <!-- Big sign: NOT EASY -->
        <g transform="translate(800, 120)">
          <rect x="0" y="0" width="560" height="120" fill="#FFFFFF" stroke="#1E293B" stroke-width="8" />
          <text x="280" y="82" font-family="sans-serif" font-weight="900" font-size="80" fill="#1E293B" text-anchor="middle">${safeTitle}</text>
        </g>

        <!-- Heavy Door with multiple locks and padlocks -->
        <g transform="translate(1000, 270)">
          <rect x="-10" y="-10" width="340" height="660" fill="#CBD5E1" stroke="#1E293B" stroke-width="8" />
          <rect x="10" y="10" width="300" height="620" fill="#E2E8F0" stroke="#1E293B" stroke-width="6" />
          <!-- Glass Window -->
          <rect x="110" y="80" width="80" height="160" fill="#F8FAFC" stroke="#1E293B" stroke-width="6" />
          <line x1="125" y1="100" x2="145" y2="150" stroke="#94A3B8" stroke-width="3" />
          <!-- Steel lock bars -->
          <rect x="0" y="150" width="320" height="24" rx="4" fill="#94A3B8" stroke="#1E293B" stroke-width="5" />
          <rect x="0" y="320" width="320" height="24" rx="4" fill="#94A3B8" stroke="#1E293B" stroke-width="5" />
          <rect x="0" y="480" width="320" height="24" rx="4" fill="#94A3B8" stroke="#1E293B" stroke-width="5" />
          <!-- Padlocks -->
          <g transform="translate(50, 190)">
            <circle cx="20" cy="10" r="16" fill="none" stroke="#1E293B" stroke-width="6" />
            <rect x="5" y="10" width="30" height="30" rx="4" fill="#F59E0B" stroke="#1E293B" stroke-width="5" />
          </g>
          <g transform="translate(240, 360)">
            <circle cx="20" cy="10" r="16" fill="none" stroke="#1E293B" stroke-width="6" />
            <rect x="5" y="10" width="30" height="30" rx="4" fill="#F59E0B" stroke="#1E293B" stroke-width="5" />
          </g>
          <!-- Paper notices taped to door -->
          <rect x="30" y="240" width="60" height="70" fill="#FFFFFF" stroke="#64748B" stroke-width="2" />
          <rect x="220" y="80" width="70" height="90" fill="#FFFFFF" stroke="#64748B" stroke-width="2" />
          <text x="255" y="110" font-size="12" font-weight="900" text-anchor="middle">FORMS</text>
        </g>

        <!-- Panicked Stickman in front of door -->
        <g transform="translate(850, 320)">
          <circle cx="100" cy="100" r="75" fill="#FFFFFF" stroke="#1E293B" stroke-width="10" />
          <circle cx="75" cy="95" r="16" fill="none" stroke="#1E293B" stroke-width="6" />
          <circle cx="75" cy="95" r="6" fill="#1E293B" />
          <circle cx="125" cy="95" r="16" fill="none" stroke="#1E293B" stroke-width="6" />
          <circle cx="125" cy="95" r="6" fill="#1E293B" />
          <line x1="85" y1="135" x2="115" y2="135" stroke="#1E293B" stroke-width="7" stroke-linecap="round" />
          <!-- Sweat drops flying -->
          <path d="M 25 60 Q 10 70 20 80" fill="none" stroke="#38BDF8" stroke-width="5" stroke-linecap="round" />
          <path d="M 175 60 Q 190 70 180 80" fill="none" stroke="#38BDF8" stroke-width="5" stroke-linecap="round" />
          <!-- Blue shirt body -->
          <path d="M 60 175 L 140 175 L 145 320 L 55 320 Z" fill="#3B82F6" stroke="#1E293B" stroke-width="10" stroke-linejoin="round" />
          <!-- Raised hands in panic -->
          <path d="M 60 205 L 10 160 L 25 100" fill="none" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
          <path d="M 140 205 L 190 160 L 175 100" fill="none" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
          <!-- Legs -->
          <line x1="80" y1="320" x2="80" y2="480" stroke="#1E293B" stroke-width="12" stroke-linecap="round" />
          <line x1="120" y1="320" x2="120" y2="480" stroke="#1E293B" stroke-width="12" stroke-linecap="round" />
          <ellipse cx="70" cy="485" rx="20" ry="10" fill="#1E293B" stroke="#1E293B" stroke-width="4" />
          <ellipse cx="130" cy="485" rx="20" ry="10" fill="#1E293B" stroke="#1E293B" stroke-width="4" />
        </g>
      </svg>
    `;
  }

  // 3. STREET SUCCESS / ESCAPE / VIOLATION (e.g. Image 4)
  if (sceneType === 'street_walk') {
    return `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <!-- Sky background -->
        <rect width="1920" height="760" fill="#93C5FD" />
        
        <!-- Green grass bank -->
        <rect y="720" width="1920" height="70" fill="#86EFAC" stroke="#1E293B" stroke-width="4" />

        <!-- Sidewalk -->
        <polygon points="0,790 1920,790 1920,930 0,930" fill="#E2E8F0" stroke="#1E293B" stroke-width="5" />
        <line x1="200" y1="790" x2="160" y2="930" stroke="#94A3B8" stroke-width="3" />
        <line x1="450" y1="790" x2="410" y2="930" stroke="#94A3B8" stroke-width="3" />
        <line x1="750" y1="790" x2="710" y2="930" stroke="#94A3B8" stroke-width="3" />
        <line x1="1050" y1="790" x2="1010" y2="930" stroke="#94A3B8" stroke-width="3" />
        <line x1="1350" y1="790" x2="1310" y2="930" stroke="#94A3B8" stroke-width="3" />
        <line x1="1650" y1="790" x2="1610" y2="930" stroke="#94A3B8" stroke-width="3" />

        <!-- Asphalt Road -->
        <rect y="930" width="1920" height="150" fill="#334155" stroke="#1E293B" stroke-width="5" />

        <!-- Tree on left -->
        <g transform="translate(100, 280)">
          <path d="M 80 500 L 100 240 Q 70 200 100 160 L 120 240 L 140 500 Z" fill="#78350F" stroke="#1E293B" stroke-width="6" />
          <circle cx="110" cy="180" r="110" fill="#4ADE80" stroke="#1E293B" stroke-width="8" />
          <circle cx="40" cy="220" r="70" fill="#22C55E" stroke="#1E293B" stroke-width="7" />
          <circle cx="170" cy="200" r="75" fill="#4ADE80" stroke="#1E293B" stroke-width="7" />
        </g>

        <!-- Building on right -->
        <g transform="translate(820, 200)">
          <rect x="-20" y="0" width="960" height="46" rx="8" fill="#64748B" stroke="#1E293B" stroke-width="6" />
          <rect x="0" y="46" width="920" height="540" fill="#FDBA74" stroke="#1E293B" stroke-width="8" />
          
          <text x="580" y="150" font-family="sans-serif" font-weight="900" font-size="90" fill="#1E293B">GYM</text>

          <g transform="translate(500, 220)">
            <rect x="0" y="0" width="180" height="366" fill="#FED7AA" stroke="#1E293B" stroke-width="6" />
            <rect x="25" y="25" width="130" height="140" fill="#E0F2FE" stroke="#1E293B" stroke-width="5" />
            <circle cx="150" cy="200" r="10" fill="#1E293B" />
          </g>

          <rect x="730" y="240" width="170" height="180" fill="#E0F2FE" stroke="#1E293B" stroke-width="6" />

          <!-- Big Crossed Out Poster on Wall -->
          <g transform="translate(60, 160)">
            <rect x="0" y="0" width="380" height="300" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
            <text x="190" y="80" font-family="sans-serif" font-weight="900" font-size="44" fill="#DC2626" text-anchor="middle">MAKE</text>
            <text x="190" y="150" font-family="sans-serif" font-weight="900" font-size="44" fill="#DC2626" text-anchor="middle">CANCELING</text>
            <text x="190" y="220" font-family="sans-serif" font-weight="900" font-size="44" fill="#DC2626" text-anchor="middle">DIFFICULT</text>
            <circle cx="190" cy="145" r="140" fill="none" stroke="#DC2626" stroke-width="18" opacity="0.85" />
            <line x1="90" y1="45" x2="290" y2="245" stroke="#DC2626" stroke-width="18" opacity="0.85" />
          </g>
        </g>

        <!-- Street Lamp -->
        <g transform="translate(1820, 310)">
          <line x1="20" y1="120" x2="20" y2="480" stroke="#1E293B" stroke-width="10" />
          <path d="M 0 120 L 40 120 L 30 50 L 10 50 Z" fill="#FEF08A" stroke="#1E293B" stroke-width="6" />
          <path d="M -10 50 Q 20 20 50 50 Z" fill="#1E293B" stroke="#1E293B" stroke-width="5" />
        </g>

        <!-- Happy Walking Stickman on Sidewalk with Briefcase & Green Checkmark -->
        <g transform="translate(480, 480)">
          <path d="M 80 -10 L 105 15 L 155 -35" fill="none" stroke="#22C55E" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
          
          <g transform="translate(160, 50)">
            <rect x="0" y="0" width="170" height="42" rx="6" fill="#FFFFFF" stroke="#1E293B" stroke-width="4" />
            <text x="85" y="28" font-family="sans-serif" font-weight="900" font-size="20" fill="#1E293B" text-anchor="middle">${safeTitle}</text>
          </g>

          <circle cx="100" cy="100" r="54" fill="#FFFFFF" stroke="#1E293B" stroke-width="8" />
          <circle cx="88" cy="92" r="5" fill="#1E293B" />
          <circle cx="116" cy="92" r="5" fill="#1E293B" />
          <path d="M 88 116 Q 102 130 116 116" fill="none" stroke="#1E293B" stroke-width="5" stroke-linecap="round" />
          
          <path d="M 70 156 L 130 156 L 135 270 L 65 270 Z" fill="#94A3B8" stroke="#1E293B" stroke-width="8" stroke-linejoin="round" />
          <path d="M 65 270 L 135 270 L 140 330 L 105 330 L 100 290 L 95 330 L 60 330 Z" fill="#2563EB" stroke="#1E293B" stroke-width="7" />

          <line x1="80" y1="330" x2="45" y2="440" stroke="#1E293B" stroke-width="9" stroke-linecap="round" />
          <line x1="120" y1="330" x2="155" y2="440" stroke="#1E293B" stroke-width="9" stroke-linecap="round" />
          <ellipse cx="38" cy="445" rx="16" ry="8" fill="#FFFFFF" stroke="#1E293B" stroke-width="5" />
          <ellipse cx="162" cy="445" rx="16" ry="8" fill="#FFFFFF" stroke="#1E293B" stroke-width="5" />

          <path d="M 125 180 L 160 250 L 175 280" fill="none" stroke="#1E293B" stroke-width="8" stroke-linecap="round" />
          <rect x="150" y="280" width="80" height="60" rx="8" fill="#065F46" stroke="#1E293B" stroke-width="5" />
          <path d="M 175 280 L 175 268 Q 190 262 205 268 L 205 280" fill="none" stroke="#1E293B" stroke-width="4" />
          <path d="M 75 180 L 40 230 L 25 250" fill="none" stroke="#1E293B" stroke-width="8" stroke-linecap="round" />
        </g>
      </svg>
    `;
  }

  // 4. CROWD WAVE / REGISTRATION INFLUX (e.g. Image 1)
  if (sceneType === 'crowd_wave') {
    return `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="1920" height="660" fill="#93C5FD" />
        <rect y="640" width="1920" height="440" fill="#86EFAC" />

        <text x="180" y="140" font-family="'Comic Sans MS', sans-serif" font-weight="900" font-size="110" fill="#1E293B">${safeTitle}</text>

        <!-- Calendar sheet -->
        <g transform="translate(180, 320)">
          <text x="120" y="-30" font-family="sans-serif" font-weight="900" font-size="28" fill="#1E293B" text-anchor="middle">MONTHLY BILLING</text>
          <rect x="0" y="0" width="240" height="230" rx="10" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
          <rect x="0" y="0" width="240" height="50" rx="10" fill="#EF4444" stroke="#1E293B" stroke-width="6" />
          <text x="120" y="36" font-family="sans-serif" font-weight="900" font-size="24" fill="#FFFFFF" text-anchor="middle">JANUARY</text>
          <circle cx="55" cy="140" r="18" fill="none" stroke="#EF4444" stroke-width="4" />
          <text x="55" y="146" font-size="18" font-family="sans-serif" font-weight="800" text-anchor="middle">15</text>
          <circle cx="55" cy="190" r="18" fill="none" stroke="#EF4444" stroke-width="4" />
          <text x="55" y="196" font-size="18" font-family="sans-serif" font-weight="800" text-anchor="middle">29</text>
        </g>

        <!-- Golden Dollar Sign -->
        <g transform="translate(850, 160)">
          <text x="0" y="210" font-family="sans-serif" font-weight="900" font-size="190" fill="#FCD34D" stroke="#1E293B" stroke-width="8" paint-order="stroke fill" text-anchor="middle">$</text>
          <text x="0" y="270" font-family="sans-serif" font-weight="900" font-size="34" fill="#1E293B" text-anchor="middle">NEW BILLING</text>
        </g>

        <!-- Building on right -->
        <g transform="translate(1320, 220)">
          <rect x="-20" y="0" width="620" height="46" rx="8" fill="#64748B" stroke="#1E293B" stroke-width="6" />
          <rect x="0" y="46" width="600" height="600" fill="#FDBA74" stroke="#1E293B" stroke-width="8" />
          <text x="260" y="160" font-family="sans-serif" font-weight="900" font-size="80" fill="#1E293B" letter-spacing="10">G-Y-M</text>
          <rect x="180" y="260" width="140" height="386" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
          <text x="250" y="365" font-family="sans-serif" font-weight="900" font-size="20" fill="#1E293B" text-anchor="middle">JOIN NOW</text>
        </g>

        <!-- Winding pathway -->
        <path d="M 0 780 Q 400 780 700 680 Q 1000 580 1420 780 L 1520 780 L 1520 860 Q 1000 660 700 760 Q 400 860 0 860 Z" fill="#E2E8F0" stroke="#1E293B" stroke-width="6" />

        <!-- Crowd stick figures -->
        <g transform="translate(0, 0)">
          <g transform="translate(1380, 600)"><circle cx="50" cy="50" r="26" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" /><line x1="50" y1="76" x2="45" y2="170" stroke="#1E293B" stroke-width="7" /><line x1="45" y1="170" x2="25" y2="230" stroke="#1E293B" stroke-width="7" /><line x1="45" y1="170" x2="70" y2="230" stroke="#1E293B" stroke-width="7" /></g>
          <g transform="translate(1260, 620)"><circle cx="50" cy="50" r="26" fill="#1E293B" stroke="#1E293B" stroke-width="6" /><line x1="50" y1="76" x2="45" y2="170" stroke="#1E293B" stroke-width="7" /><line x1="45" y1="170" x2="25" y2="230" stroke="#1E293B" stroke-width="7" /><line x1="45" y1="170" x2="70" y2="230" stroke="#1E293B" stroke-width="7" /></g>
          <g transform="translate(1080, 600)"><circle cx="50" cy="50" r="26" fill="#F8FAFC" stroke="#1E293B" stroke-width="6" /><line x1="50" y1="76" x2="45" y2="160" stroke="#1E293B" stroke-width="7" /><line x1="45" y1="160" x2="20" y2="220" stroke="#1E293B" stroke-width="7" /><line x1="45" y1="160" x2="65" y2="220" stroke="#1E293B" stroke-width="7" /></g>
          <g transform="translate(860, 560)"><circle cx="50" cy="50" r="26" fill="#F59E0B" stroke="#1E293B" stroke-width="6" /><line x1="50" y1="76" x2="45" y2="160" stroke="#1E293B" stroke-width="7" /><line x1="45" y1="160" x2="25" y2="220" stroke="#1E293B" stroke-width="7" /><line x1="45" y1="160" x2="70" y2="220" stroke="#1E293B" stroke-width="7" /></g>
          <g transform="translate(680, 590)"><circle cx="50" cy="50" r="26" fill="#3B82F6" stroke="#1E293B" stroke-width="6" /><line x1="50" y1="76" x2="45" y2="160" stroke="#1E293B" stroke-width="7" /><line x1="45" y1="160" x2="25" y2="220" stroke="#1E293B" stroke-width="7" /><line x1="45" y1="160" x2="70" y2="220" stroke="#1E293B" stroke-width="7" /></g>
          <g transform="translate(420, 680)"><circle cx="50" cy="50" r="26" fill="#10B981" stroke="#1E293B" stroke-width="6" /><line x1="50" y1="76" x2="45" y2="160" stroke="#1E293B" stroke-width="7" /><line x1="45" y1="160" x2="25" y2="220" stroke="#1E293B" stroke-width="7" /><line x1="45" y1="160" x2="70" y2="220" stroke="#1E293B" stroke-width="7" /></g>
          <g transform="translate(180, 710)"><circle cx="50" cy="50" r="26" fill="#F8FAFC" stroke="#1E293B" stroke-width="6" /><line x1="50" y1="76" x2="45" y2="160" stroke="#1E293B" stroke-width="7" /><line x1="45" y1="160" x2="25" y2="220" stroke="#1E293B" stroke-width="7" /><line x1="45" y1="160" x2="70" y2="220" stroke="#1E293B" stroke-width="7" /></g>
        </g>
      </svg>
    `;
  }

  // 5. CULINARY / COOKING SCENE (Giant Stock Pot & Chef Stickman)
  if (sceneType === 'cooking') {
    return `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="1920" height="1080" fill="#FBF8EE" />

        <text x="960" y="160" font-family="'Comic Sans MS', sans-serif" font-weight="900" font-size="96" fill="#EA580C" stroke="#1E293B" stroke-width="8" stroke-linejoin="round" text-anchor="middle" paint-order="stroke fill">
          ${safeTitle}
        </text>

        <!-- Big Broth Pot with aromatic steam -->
        <g transform="translate(800, 520)">
          <!-- Steam curls -->
          <path d="M 0 -120 Q -30 -180 0 -240 Q 30 -300 0 -360" fill="none" stroke="#F97316" stroke-width="8" stroke-linecap="round" />
          <path d="M 120 -120 Q 150 -180 120 -240 Q 90 -300 120 -360" fill="none" stroke="#FB923C" stroke-width="10" stroke-linecap="round" />
          <path d="M -120 -120 Q -90 -180 -120 -240 Q -150 -300 -120 -360" fill="none" stroke="#F97316" stroke-width="8" stroke-linecap="round" />

          <!-- Pot -->
          <ellipse cx="0" cy="0" rx="360" ry="45" fill="#E2E8F0" stroke="#1E293B" stroke-width="12" />
          <path d="M -360 0 L -330 280 Q 0 360 330 280 L 360 0" fill="#FFFFFF" stroke="#1E293B" stroke-width="12" />
          <ellipse cx="0" cy="20" rx="320" ry="35" fill="#FDBA74" />
          <ellipse cx="0" cy="20" rx="220" ry="22" fill="#EA580C" />
          <!-- Pot Handles -->
          <path d="M -360 50 Q -430 50 -430 110 Q -430 170 -350 170" fill="none" stroke="#1E293B" stroke-width="12" />
          <path d="M 360 50 Q 430 50 430 110 Q 430 170 350 170" fill="none" stroke="#1E293B" stroke-width="12" />
          <!-- Gas Flame -->
          <path d="M -200 340 Q -160 280 -120 340 Q -80 280 -40 340 Q 0 280 40 340 Q 80 280 120 340 Q 160 280 200 340" fill="none" stroke="#EF4444" stroke-width="14" stroke-linecap="round" />

          <!-- Big Timer Badge -->
          <g transform="translate(0, 360)">
            <rect x="-180" y="0" width="360" height="74" rx="20" fill="#F97316" stroke="#1E293B" stroke-width="6" />
            <text x="0" y="50" font-family="sans-serif" font-weight="900" font-size="34" fill="#FFFFFF" text-anchor="middle">⏱️ ${escapeXml(metric)}</text>
          </g>
        </g>

        <!-- Chef Stickman -->
        <g transform="translate(1420, 460)">
          <!-- Toque hat -->
          <path d="M 60 70 Q 45 20 80 15 Q 100 5 120 15 Q 155 20 140 70 Z" fill="#FFFFFF" stroke="#1E293B" stroke-width="8" />
          <rect x="62" y="65" width="76" height="20" rx="4" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
          <circle cx="100" cy="115" r="54" fill="#FFFFFF" stroke="#1E293B" stroke-width="8" />
          <circle cx="88" cy="106" r="6" fill="#1E293B" />
          <circle cx="116" cy="106" r="6" fill="#1E293B" />
          <path d="M 88 132 Q 102 146 116 132" fill="none" stroke="#1E293B" stroke-width="6" stroke-linecap="round" />

          <path d="M 60 175 L 140 175 L 145 320 L 55 320 Z" fill="#FFFFFF" stroke="#1E293B" stroke-width="10" stroke-linejoin="round" />
          <!-- Apron lines -->
          <line x1="80" y1="200" x2="120" y2="200" stroke="#F97316" stroke-width="6" />
          <!-- Holding wooden spoon into pot -->
          <path d="M 60 200 L -120 140" fill="none" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
          <line x1="-120" y1="140" x2="-220" y2="90" stroke="#78350F" stroke-width="12" stroke-linecap="round" />
          <ellipse cx="-230" cy="85" rx="20" ry="12" fill="#F59E0B" stroke="#1E293B" stroke-width="4" />
          <!-- Legs -->
          <line x1="80" y1="320" x2="80" y2="480" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
          <line x1="120" y1="320" x2="120" y2="480" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
        </g>
      </svg>
    `;
  }

  // 6. TECH / CODE / ALGORITHM SCENE
  if (sceneType === 'tech_code') {
    return `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="1920" height="1080" fill="#F1F5F9" />

        <text x="960" y="160" font-family="'Comic Sans MS', sans-serif" font-weight="900" font-size="96" fill="#0284C7" stroke="#1E293B" stroke-width="8" stroke-linejoin="round" text-anchor="middle" paint-order="stroke fill">
          ${safeTitle}
        </text>

        <!-- Giant Monitor with Code -->
        <g transform="translate(680, 240)">
          <!-- Monitor Frame -->
          <rect x="0" y="0" width="760" height="520" rx="24" fill="#0F172A" stroke="#1E293B" stroke-width="10" />
          <rect x="20" y="20" width="720" height="480" rx="14" fill="#020617" />
          <!-- Window Dots -->
          <circle cx="50" cy="50" r="8" fill="#EF4444" />
          <circle cx="75" cy="50" r="8" fill="#F59E0B" />
          <circle cx="100" cy="50" r="8" fill="#10B981" />
          <line x1="20" y1="75" x2="740" y2="75" stroke="#1E293B" stroke-width="3" />

          <!-- Syntax Lines -->
          <text x="50" y="130" font-family="monospace" font-weight="700" font-size="28" fill="#F43F5E">const</text>
          <text x="145" y="130" font-family="monospace" font-weight="700" font-size="28" fill="#FCD34D">target</text>
          <text x="260" y="130" font-family="monospace" font-weight="700" font-size="28" fill="#F43F5E">=</text>
          <text x="290" y="130" font-family="monospace" font-weight="700" font-size="28" fill="#38BDF8">"${escapeXml(metric)}";</text>

          <text x="50" y="200" font-family="monospace" font-weight="700" font-size="28" fill="#818CF8">function</text>
          <text x="195" y="200" font-family="monospace" font-weight="700" font-size="28" fill="#34D399">optimize()</text>
          <text x="360" y="200" font-family="monospace" font-weight="700" font-size="28" fill="#F8FAFC">{</text>

          <text x="90" y="270" font-family="monospace" font-weight="700" font-size="28" fill="#F43F5E">return</text>
          <text x="205" y="270" font-family="monospace" font-weight="700" font-size="28" fill="#A7F3D0">"100% Success ✓";</text>

          <text x="50" y="340" font-family="monospace" font-weight="700" font-size="28" fill="#F8FAFC">}</text>

          <!-- Terminal Status Box -->
          <rect x="40" y="380" width="680" height="90" rx="12" fill="#0F172A" stroke="#22C55E" stroke-width="4" />
          <text x="70" y="435" font-family="monospace" font-weight="900" font-size="26" fill="#22C55E">&gt; BUILD PASSED • ZERO BUGS ⚡</text>

          <!-- Monitor Stand -->
          <rect x="340" y="520" width="80" height="90" fill="#64748B" stroke="#1E293B" stroke-width="8" />
          <ellipse cx="380" cy="620" rx="160" ry="24" fill="#94A3B8" stroke="#1E293B" stroke-width="8" />
        </g>

        <!-- Tech Stickman Typing -->
        <g transform="translate(320, 460)">
          <circle cx="100" cy="100" r="65" fill="#FFFFFF" stroke="#1E293B" stroke-width="9" />
          <!-- Tech Visor -->
          <rect x="65" y="80" width="70" height="24" rx="8" fill="#06B6D4" stroke="#1E293B" stroke-width="4" />
          <circle cx="85" cy="92" r="4" fill="#FFFFFF" />
          <circle cx="115" cy="92" r="4" fill="#FFFFFF" />
          <path d="M 88 130 Q 100 142 112 130" fill="none" stroke="#1E293B" stroke-width="5" stroke-linecap="round" />

          <!-- Body with blue shirt -->
          <path d="M 60 170 L 140 170 L 135 320 L 65 320 Z" fill="#0284C7" stroke="#1E293B" stroke-width="9" />
          <!-- Typing Arms extended to monitor -->
          <path d="M 130 200 L 260 220 L 340 260" fill="none" stroke="#1E293B" stroke-width="9" stroke-linecap="round" />
          <path d="M 110 210 L 240 240 L 320 280" fill="none" stroke="#1E293B" stroke-width="9" stroke-linecap="round" />
          <!-- Legs -->
          <line x1="85" y1="320" x2="60" y2="480" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
          <line x1="115" y1="320" x2="140" y2="480" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
        </g>
      </svg>
    `;
  }

  // 7. COMPOUND GROWTH / WEALTH SCENE
  if (sceneType === 'growth') {
    return `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="1920" height="1080" fill="#F0FDF4" />

        <text x="960" y="160" font-family="'Comic Sans MS', sans-serif" font-weight="900" font-size="96" fill="#15803D" stroke="#1E293B" stroke-width="8" stroke-linejoin="round" text-anchor="middle" paint-order="stroke fill">
          ${safeTitle}
        </text>

        <!-- Rocket Growth Curve & Coin Stairs -->
        <g transform="translate(680, 260)">
          <!-- Coin Stack 1 -->
          <rect x="0" y="380" width="100" height="120" rx="10" fill="#FBBF24" stroke="#1E293B" stroke-width="6" />
          <text x="50" y="445" font-family="sans-serif" font-weight="900" font-size="34" fill="#78350F" text-anchor="middle">₫</text>

          <!-- Coin Stack 2 -->
          <rect x="140" y="280" width="100" height="220" rx="10" fill="#FBBF24" stroke="#1E293B" stroke-width="6" />
          <text x="190" y="395" font-family="sans-serif" font-weight="900" font-size="34" fill="#78350F" text-anchor="middle">₫</text>

          <!-- Coin Stack 3 -->
          <rect x="280" y="160" width="100" height="340" rx="10" fill="#FBBF24" stroke="#1E293B" stroke-width="6" />
          <text x="330" y="340" font-family="sans-serif" font-weight="900" font-size="34" fill="#78350F" text-anchor="middle">₫</text>

          <!-- Coin Stack 4 (Huge) -->
          <rect x="420" y="40" width="120" height="460" rx="10" fill="#F59E0B" stroke="#1E293B" stroke-width="7" />
          <text x="480" y="260" font-family="sans-serif" font-weight="900" font-size="44" fill="#78350F" text-anchor="middle">7 TỶ</text>

          <!-- Giant Green Upward Curve -->
          <path d="M -40 450 Q 200 360 480 0" fill="none" stroke="#16A34A" stroke-width="18" stroke-linecap="round" />
          <polygon points="450,-30 520,10 460,40" fill="#16A34A" stroke="#1E293B" stroke-width="4" />
        </g>

        <!-- Confident Investor Stickman Gesturing -->
        <g transform="translate(360, 460)">
          <circle cx="100" cy="100" r="68" fill="#FFFFFF" stroke="#1E293B" stroke-width="9" />
          <circle cx="86" cy="90" r="7" fill="#1E293B" />
          <circle cx="118" cy="90" r="7" fill="#1E293B" />
          <path d="M 88 122 Q 102 138 120 122" fill="none" stroke="#1E293B" stroke-width="6" stroke-linecap="round" />

          <path d="M 60 170 L 140 170 L 145 320 L 55 320 Z" fill="#10B981" stroke="#1E293B" stroke-width="9" />
          <!-- Gesturing Arm to Growth -->
          <path d="M 140 200 L 260 140 L 380 90" fill="none" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
          <polygon points="375,80 405,88 385,108" fill="#10B981" stroke="#1E293B" stroke-width="3" />
          <!-- Other Arm Holding Seedling Pot -->
          <path d="M 60 200 L -20 230 L -30 270" fill="none" stroke="#1E293B" stroke-width="8" stroke-linecap="round" />
          <circle cx="-35" cy="285" r="22" fill="#FBBF24" stroke="#1E293B" stroke-width="5" />
          <text x="-35" y="294" font-weight="900" font-size="24" fill="#78350F" text-anchor="middle">₫</text>

          <line x1="85" y1="320" x2="65" y2="480" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
          <line x1="115" y1="320" x2="135" y2="480" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
        </g>
      </svg>
    `;
  }

  // 8. FALLBACK UNIVERSAL CARTOON (Clean, bold, creative, zero clutter)
  return `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <rect width="1920" height="1080" fill="#FBF8EE" />

      <!-- Top Bold Comic Title -->
      <text x="960" y="160" font-family="'Comic Sans MS', sans-serif" font-weight="900" font-size="96" fill="#3B82F6" stroke="#1E293B" stroke-width="8" stroke-linejoin="round" text-anchor="middle" paint-order="stroke fill">
        ${safeTitle}
      </text>

      <!-- Centerpiece Creative Idea / Metaphor -->
      <g transform="translate(860, 480)">
        <!-- Giant Glowing Lightbulb -->
        <circle cx="0" cy="0" r="180" fill="#FDE047" stroke="#1E293B" stroke-width="12" />
        <rect x="-60" y="150" width="120" height="70" rx="10" fill="#94A3B8" stroke="#1E293B" stroke-width="8" />
        <line x1="-50" y1="185" x2="50" y2="185" stroke="#1E293B" stroke-width="6" />
        <!-- Filament -->
        <path d="M -50 40 Q 0 -60 50 40" fill="none" stroke="#CA8A04" stroke-width="10" stroke-linecap="round" />
        
        <!-- Sparkle Rays -->
        <line x1="0" y1="-220" x2="0" y2="-280" stroke="#EAB308" stroke-width="12" stroke-linecap="round" />
        <line x1="180" y1="-140" x2="230" y2="-190" stroke="#EAB308" stroke-width="12" stroke-linecap="round" />
        <line x1="-180" y1="-140" x2="-230" y2="-190" stroke="#EAB308" stroke-width="12" stroke-linecap="round" />
        <line x1="220" y1="0" x2="280" y2="0" stroke="#EAB308" stroke-width="12" stroke-linecap="round" />
        <line x1="-220" y1="0" x2="-280" y2="0" stroke="#EAB308" stroke-width="12" stroke-linecap="round" />

        <text x="0" y="270" font-family="sans-serif" font-weight="900" font-size="44" fill="#1E293B" text-anchor="middle">
          ${escapeXml(metric)}
        </text>
      </g>

      <!-- Eureka Stickman Character on Left -->
      <g transform="translate(360, 460)">
        <circle cx="100" cy="100" r="68" fill="#FFFFFF" stroke="#1E293B" stroke-width="9" />
        <circle cx="86" cy="90" r="7" fill="#1E293B" />
        <circle cx="118" cy="90" r="7" fill="#1E293B" />
        <path d="M 88 122 Q 102 138 120 122" fill="none" stroke="#1E293B" stroke-width="6" stroke-linecap="round" />

        <!-- Blue shirt -->
        <path d="M 60 170 L 140 170 L 145 320 L 55 320 Z" fill="#3B82F6" stroke="#1E293B" stroke-width="9" />
        <!-- Both Arms Raised in Excitement -->
        <path d="M 60 200 L -20 130 L -10 60" fill="none" stroke="#1E293B" stroke-width="9" stroke-linecap="round" />
        <path d="M 140 200 L 220 130 L 280 80" fill="none" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
        <polygon points="275,70 305,78 285,98" fill="#3B82F6" />

        <!-- Jumping Legs -->
        <path d="M 75 320 L 40 400 L 60 480" fill="none" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
        <path d="M 125 320 L 160 400 L 180 480" fill="none" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
      </g>
    </svg>
  `;
}

/**
 * High-Quality Voice TTS Synthesis
 */
async function generateTTSAudio(text, outputPath, voice = 'vi-VN-Standard-A', speed = 1.0) {
  const safeSpeed = Math.min(Math.max(Number(speed) || 1.0, 0.5), 2.0);
  const cleanText = (text || '').trim();

  // CRITICAL FIX: NEVER reuse stale audio from a previous script!
  // Always delete any existing audio at outputPath to guarantee fresh audio matching the new script.
  try {
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  } catch (_) {}

  const tempTxt = outputPath.replace('.mp3', '_script.txt');
  const tempRaw = outputPath.replace('.mp3', '_raw.mp3');
  const tempAiff = outputPath.replace('.mp3', '_say.aiff');

  const VOICE_MAP = {
    'vi-VN-Standard-A': { voice: 'vi-VN-HoaiMyNeural', pitch: '+0Hz' },
    'vi-VN-Standard-B': { voice: 'vi-VN-NamMinhNeural', pitch: '+0Hz' },
    'vi-VN-Standard-C': { voice: 'vi-VN-HoaiMyNeural', pitch: '+2Hz' },
    'vi-VN-Standard-D': { voice: 'vi-VN-NamMinhNeural', pitch: '-1Hz' },
    'vi-VN-Studio-AI': { voice: 'vi-VN-HoaiMyNeural', pitch: '+0Hz' },
    'vi-VN-Nam-Deep': { voice: 'vi-VN-NamMinhNeural', pitch: '-3Hz' },
    'vi-VN-Nu-Warm': { voice: 'vi-VN-HoaiMyNeural', pitch: '-2Hz' },
    'vi-VN-Nam-Tech': { voice: 'vi-VN-NamMinhNeural', pitch: '+1Hz' },
    'vi-VN-Nu-Energetic': { voice: 'vi-VN-HoaiMyNeural', pitch: '+3Hz' },
    'en-US-GuyNeural': { voice: 'en-US-GuyNeural', pitch: '+0Hz' },
    'en-US-JennyNeural': { voice: 'en-US-JennyNeural', pitch: '+0Hz' },
    'en-US-AriaNeural': { voice: 'en-US-AriaNeural', pitch: '+0Hz' },
    'en-US-ChristopherNeural': { voice: 'en-US-ChristopherNeural', pitch: '+0Hz' },
    'en-GB-RyanNeural': { voice: 'en-GB-RyanNeural', pitch: '+0Hz' },
    'en-GB-SoniaNeural': { voice: 'en-GB-SoniaNeural', pitch: '+0Hz' },
  };

  let success = false;

  // 1. Try Microsoft Edge TTS (natural neural voices) via temp text file to avoid escaping issues
  try {
    fs.writeFileSync(tempTxt, cleanText, 'utf8');
    const ratePercent = Math.round((safeSpeed - 1.0) * 100);
    const rateStr = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;
    const cfg = VOICE_MAP[voice] || (voice.includes('Nam') ? { voice: 'vi-VN-NamMinhNeural', pitch: '+0Hz' } : { voice: 'vi-VN-HoaiMyNeural', pitch: '+0Hz' });
    const edgeVoice = cfg.voice;
    const pitchStr = cfg.pitch || '+0Hz';

    execSync(
      `edge-tts --voice "${edgeVoice}" --pitch="${pitchStr}" --rate="${rateStr}" -f "${tempTxt}" --write-media "${outputPath}" 2>/dev/null`,
      { timeout: 30000 }
    );
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
      success = true;
    }
  } catch (_) {
    success = false;
  } finally {
    try { if (fs.existsSync(tempTxt)) fs.unlinkSync(tempTxt); } catch (_) {}
  }

  // 2. Fallback to Google TTS (supports long text chunking via getAllAudioBase64)
  if (!success) {
    try {
      const isEnglish = voice.startsWith('en-');
      const lang = isEnglish ? 'en' : 'vi';
      const parts = await googleTTS.getAllAudioBase64(cleanText, {
        lang,
        slow: false,
        timeout: 15000,
      });
      if (parts && parts.length > 0) {
        const buffer = Buffer.concat(parts.map((p) => Buffer.from(p.base64, 'base64')));
        fs.writeFileSync(tempRaw, buffer);
        if (safeSpeed !== 1.0) {
          execSync(`/opt/homebrew/bin/ffmpeg -y -i "${tempRaw}" -filter:a "atempo=${safeSpeed}" -vn "${outputPath}" 2>/dev/null`);
          try { fs.unlinkSync(tempRaw); } catch (_) {}
        } else {
          fs.copyFileSync(tempRaw, outputPath);
          try { fs.unlinkSync(tempRaw); } catch (_) {}
        }
        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
          success = true;
        }
      }
    } catch (_) {}
  }

  // 3. Fallback to macOS native high-quality speech (offline Linh / Samantha)
  if (!success) {
    try {
      const isEnglish = voice.startsWith('en-');
      const macVoice = isEnglish ? 'Samantha' : 'Linh';
      fs.writeFileSync(tempTxt, cleanText, 'utf8');
      execSync(`say -v "${macVoice}" -f "${tempTxt}" -o "${tempAiff}" 2>/dev/null`);
      if (fs.existsSync(tempAiff) && fs.statSync(tempAiff).size > 1000) {
        const filter = safeSpeed !== 1.0 ? `-filter:a "atempo=${safeSpeed}"` : '';
        execSync(`/opt/homebrew/bin/ffmpeg -y -i "${tempAiff}" ${filter} -q:a 2 -vn "${outputPath}" 2>/dev/null`);
        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
          success = true;
        }
      }
    } catch (_) {} finally {
      try { if (fs.existsSync(tempTxt)) fs.unlinkSync(tempTxt); } catch (_) {}
      try { if (fs.existsSync(tempAiff)) fs.unlinkSync(tempAiff); } catch (_) {}
    }
  }

  // 4. Absolute emergency silence fallback so pipeline never crashes
  if (!success || !fs.existsSync(outputPath) || fs.statSync(outputPath).size < 500) {
    const fallbackDur = Math.max(3.0, (cleanText.split(/\s+/).length / 2.8) / safeSpeed);
    execSync(`/opt/homebrew/bin/ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t ${fallbackDur.toFixed(2)} -q:a 9 -acodec libmp3lame "${outputPath}" 2>/dev/null`);
  }

  let durationInSeconds = 4.0;
  try {
    const probe = execSync(`/opt/homebrew/bin/ffprobe -i "${outputPath}" -show_entries format=duration -v quiet -of csv="p=0"`).toString().trim();
    durationInSeconds = parseFloat(probe) || 4.0;
  } catch (err) {
    durationInSeconds = Math.max(3.0, (cleanText.split(/\s+/).length / 3.0) / safeSpeed);
  }

  return durationInSeconds;
}

/**
 * Main Video Generator Pipeline
 */
async function generateVideo({
  title,
  subtitle,
  voice,
  speed,
  scenes,
  script,
  content,
  geminiApiKey,
  openaiApiKey,
  preferredImageProvider,
  onProgress,
}) {
  if (preferredImageProvider) {
    try {
      const ImageGenerationManager = require('./image-generation/ImageGenerationManager.cjs');
      ImageGenerationManager.getInstance().setPreferredProvider(preferredImageProvider);
    } catch (_) {}
  }

  const { generateStoryboardFromContent } = require('./storyboardGenerator.cjs');
  const {
    createVideoStyleGuide,
    segmentSceneIntoBeats,
    createLocalBeatPlan,
    planVisualBeatsWithAI,
    validateVisualBeat,
    generateSemanticSvgForBeat,
    runProjectQualityGate,
    buildWhiteboardPrompt,
  } = require('./visualBeatPlanner.cjs');
  const { generateFluxImage } = require('./fluxImageGenerator.cjs');

  const notify = (stepKey, percent, message, details = {}) => {
    if (typeof onProgress === 'function') {
      try {
        onProgress({
          type: 'progress',
          stepKey,
          percent: Math.min(100, Math.max(0, Math.round(percent))),
          message,
          timestamp: new Date().toLocaleTimeString(),
          ...details,
        });
      } catch (err) {
        // silent
      }
    }
  };

  // Store full data reference for downstream DALL-E 3 access
  const data = { openaiApiKey };

  const selectedVoice = voice || 'vi-VN-Standard-A';
  const playbackSpeed = Number(speed) || 1.0;
  const styleGuide = createVideoStyleGuide(title);
  const generationRunId = Date.now();

  // Clean up all existing scene images and audio so no stale assets from previous runs remain
  try {
    const existingImages = fs.readdirSync(IMAGES_DIR);
    for (const f of existingImages) {
      if (f.startsWith('scene_') && f.endsWith('.png')) {
        try { fs.unlinkSync(path.join(IMAGES_DIR, f)); } catch (_) {}
      }
    }
  } catch (_) {}

  try {
    const existingAudio = fs.readdirSync(AUDIO_DIR);
    for (const f of existingAudio) {
      if (f.startsWith('scene_') && f.endsWith('.mp3')) {
        try { fs.unlinkSync(path.join(AUDIO_DIR, f)); } catch (_) {}
      }
    }
  } catch (_) {}

  notify('storyboard', 5, 'Khởi động Studio Pipeline: Dọn dẹp cache & nạp kịch bản mới...');

  console.log(`\n======================================================`);
  console.log(`🎨 [TẠO VIDEO THEO PHONG CÁCH STICKMAN CARTOON EXPLAINER V2]`);
  console.log(`Tiêu đề: ${title || 'Video Giải Thích Mới'}`);
  console.log(`Giọng đọc: ${selectedVoice} (${playbackSpeed}x)`);
  console.log(`======================================================\n`);

  // 1. Run AI Storyboard Generator to split content & plan diverse scenes
  notify('storyboard', 10, 'Đang phân tích kịch bản, xác định nhịp điệu và cấu trúc phân cảnh...');
  console.log(`[Bước 1/5] Chạy Storyboard Generator để phân tích và tạo kịch bản phân cảnh...`);
  const plannedScenes = await generateStoryboardFromContent({
    content: content || script,
    scenesInput: scenes,
    geminiApiKey,
    openaiApiKey,
  });

  const totalScenes = plannedScenes.length;
  console.log(`✓ Kế hoạch Storyboard gồm ${totalScenes} phân cảnh:`);
  plannedScenes.forEach((sc, i) => {
    console.log(`   [${i + 1}] Loại: [${(sc.visual_type || 'character').toUpperCase()}] | Tiêu đề: "${sc.title}"`);
  });

  notify('storyboard', 18, `✓ Hoàn thành cấu trúc kịch bản gồm ${totalScenes} phân cảnh chi tiết`, {
    totalScenes,
    scenes: plannedScenes.map((s, idx) => ({ id: idx + 1, title: s.title, type: s.visual_type })),
  });

  let totalFrames = 0;
  const finalizedScenes = [];
  const sceneClipPaths = [];
  let previousMethod = null;

  // ==========================================
  // PHASE 1: Audio Generation & Visual Beat Planning
  // ==========================================
  console.log(`\n========================================================`);
  console.log(`🎙️ [Phase 1] Tổng hợp Audio TTS & Lập kế hoạch Visual Beats cho ${totalScenes} phân cảnh...`);
  console.log(`========================================================\n`);

  const scenesData = [];

  for (let i = 0; i < totalScenes; i++) {
    const rawScene = plannedScenes[i];
    const sceneId = i + 1;
    const sceneTitle = rawScene.title || `Cảnh ${sceneId}`;
    const sceneText = (rawScene.narration || rawScene.text || '').trim();

    console.log(`\n--- Phân cảnh ${sceneId}/${totalScenes}: "${sceneTitle}" ---`);

    // 1. Generate Voice Audio via TTS (Stage 2: 18% -> 35%)
    const audioFileName = `scene_${sceneId}.mp3`;
    const audioPath = path.join(AUDIO_DIR, audioFileName);

    const ttsStartPct = 18 + ((i + 0.2) / totalScenes) * 17;
    notify('tts', ttsStartPct, `[Cảnh ${sceneId}/${totalScenes}] Đang tổng hợp giọng nói AI (${selectedVoice})...`, {
      sceneIndex: sceneId,
      totalScenes,
      sceneTitle,
    });

    console.log(`[Bước 2/5] Đang tổng hợp giọng nói AI cho cảnh ${sceneId}...`);
    const durationInSeconds = await generateTTSAudio(sceneText, audioPath, selectedVoice, playbackSpeed);
    const durationInFrames = Math.round(durationInSeconds * 30);
    console.log(`✓ Audio cảnh ${sceneId} hoàn tất: ${durationInSeconds.toFixed(2)}s (${durationInFrames} frames)`);

    const ttsDonePct = 18 + ((i + 1) / totalScenes) * 17;
    notify('tts', ttsDonePct, `✓ Cảnh ${sceneId}/${totalScenes}: Thu âm giọng đọc thành công (${durationInSeconds.toFixed(1)}s)`, {
      sceneIndex: sceneId,
      totalScenes,
      sceneTitle,
      duration: durationInSeconds,
    });

    // 2. Segment into visual beats
    const planStartPct = 35 + ((i + 0.3) / totalScenes) * 15;
    notify('beat_plan', planStartPct, `[Cảnh ${sceneId}/${totalScenes}] Đang phân tích nhịp thị giác & chuyển động câu chuyện...`, {
      sceneIndex: sceneId,
      totalScenes,
      sceneTitle,
    });

    console.log(`[Bước 3/5] Phân chia thành các Visual Beats theo diễn tiến câu chuyện...`);
    const segmentedBeats = segmentSceneIntoBeats(
      { id: sceneId, title: sceneTitle, text: sceneText },
      durationInSeconds,
      durationInFrames
    );
    console.log(`✓ Cảnh ${sceneId} được chia thành ${segmentedBeats.length} visual beats (trung bình ${(durationInSeconds / segmentedBeats.length).toFixed(1)}s/beat)`);

    // 3. Visual Planner: Plan structured visual beats with AI + Smart local fallback
    console.log(`[Bước 4/5] Lập kế hoạch hình ảnh (Visual Planner) & Kiểm định ngữ nghĩa (Validator)...`);
    let beatPlans = await planVisualBeatsWithAI({
      scene: { id: sceneId, title: sceneTitle, text: sceneText },
      beats: segmentedBeats,
      styleGuide,
      geminiApiKey,
      openaiApiKey,
      previousMethod,
    });

    if (!beatPlans || beatPlans.length !== segmentedBeats.length) {
      beatPlans = segmentedBeats.map((b, bIdx) =>
        createLocalBeatPlan({
          beatText: b.text,
          beatIndex: bIdx + 1,
          totalBeats: segmentedBeats.length,
          sceneTitle,
          sceneText,
          videoTitle: title,
          prevMethod: bIdx > 0 ? beatPlans?.[bIdx - 1]?.visualMethod : previousMethod,
        })
      );
    }

    const planDonePct = 35 + ((i + 1) / totalScenes) * 15;
    notify('beat_plan', planDonePct, `✓ Cảnh ${sceneId}/${totalScenes}: Đã lên kế hoạch ${segmentedBeats.length} nhịp thị giác`, {
      sceneIndex: sceneId,
      totalScenes,
      sceneTitle,
      totalBeatsInScene: segmentedBeats.length,
    });

    const tempSceneDir = path.join(PUBLIC_DIR, `temp_scene_${sceneId}`);
    if (!fs.existsSync(tempSceneDir)) fs.mkdirSync(tempSceneDir, { recursive: true });

    scenesData.push({
      sceneIndex: i,
      rawScene,
      sceneId,
      sceneTitle,
      sceneText,
      audioFileName,
      audioPath,
      durationInSeconds,
      durationInFrames,
      segmentedBeats,
      beatPlans,
      tempSceneDir,
    });
  }

  // ==========================================
  // PHASE 2: Collect & Validate All Visual Beats
  // ==========================================
  const allBeatsToGenerate = [];

  for (const sData of scenesData) {
    for (let bIdx = 0; bIdx < sData.segmentedBeats.length; bIdx++) {
      const beat = sData.segmentedBeats[bIdx];
      let plan = sData.beatPlans[bIdx];

      // Semantic Validation & Quality Check
      let validation = validateVisualBeat({ beatText: beat.text, plan });
      if (validation.regenerate) {
        console.warn(`   ⚠️ Beat ${beat.sub_index} có cảnh báo ngữ nghĩa (${validation.issues.join('; ')}). Tự động tinh chỉnh kế hoạch...`);
        plan = createLocalBeatPlan({
          beatText: beat.text,
          beatIndex: bIdx + 1,
          totalBeats: sData.segmentedBeats.length,
          sceneTitle: sData.sceneTitle,
          sceneText: sData.sceneText,
          videoTitle: title,
          prevMethod: previousMethod,
        });
        validation = validateVisualBeat({ beatText: beat.text, plan });
      }

      beat.plan = plan;
      beat.validation = validation;
      previousMethod = plan.visualMethod;

      const globalIndex = allBeatsToGenerate.length;
      const beatImageFile = `scene_${sData.sceneId}_beat_${beat.sub_index}.png`;
      const beatPngPath = path.join(IMAGES_DIR, beatImageFile);

      allBeatsToGenerate.push({
        sceneIndex: sData.sceneIndex,
        sceneId: sData.sceneId,
        sceneTitle: sData.sceneTitle,
        sceneText: sData.sceneText,
        beatIndex: bIdx,
        beat,
        plan,
        validation,
        globalIndex,
        beatImageFile,
        beatPngPath,
        imageMethod: 'svg_fallback',
        svgContent: null,
      });
    }
  }

  // ==========================================
  // PHASE 3: Parallel Image Generation Across 2 Tabs (Tab 1: Even, Tab 2: Odd)
  // ==========================================
  console.log(`\n========================================================`);
  console.log(`🎨 [Phase 3] Tạo ${allBeatsToGenerate.length} ảnh song song qua 2 tab Google AI Studio (Tab 1: Chẵn, Tab 2: Lẻ)...`);
  console.log(`========================================================\n`);

  let completedImagesCount = 0;
  const totalBeatsCount = allBeatsToGenerate.length;

  await Promise.all(
    allBeatsToGenerate.map(async (item) => {
      const { sceneId, sceneTitle, beat, plan, globalIndex, beatImageFile, beatPngPath } = item;
      const assignedTabId = (globalIndex % 2 === 0) ? 1 : 2;
      const parityLabel = (globalIndex % 2 === 0) ? 'CHẴN (Tab 1)' : 'LẺ (Tab 2)';
      const keyLabel = plan.diegeticText || plan.keyText || sceneTitle;

      // Notify Image Generation Started
      const beatProgressFraction = completedImagesCount / Math.max(1, totalBeatsCount);
      const imgStartPct = 50 + beatProgressFraction * 30;

      notify('images', imgStartPct, `[${parityLabel} • Ảnh #${globalIndex + 1}/${totalBeatsCount}] Đang tạo: "${keyLabel}"...`, {
        sceneIndex: sceneId,
        totalScenes,
        beatIndex: beat.sub_index,
        globalIndex,
        assignedTabId,
        label: keyLabel,
        method: plan.visualMethod,
      });

      // Clear stale image file
      try {
        if (fs.existsSync(beatPngPath)) fs.unlinkSync(beatPngPath);
      } catch (_) {}

      const openaiApiKey = data?.openaiApiKey || process.env.OPENAI_API_KEY;
      const diegeticLabel = plan.diegeticText || plan.keyText || '';
      const subjectDesc = plan.subject || 'stickman character';
      const actionDesc = plan.action || plan.meaning || beat.text;
      const contextDesc = sceneTitle ? `related to ${sceneTitle}` : '';

      const fallbackAction = `${subjectDesc} actively demonstrating ${contextDesc}: ${actionDesc}`.trim();
      const fallbackPrompt = buildWhiteboardPrompt({
        actionDescription: fallbackAction,
        keyText: diegeticLabel,
        accentColor: 'cyan blue',
      });
      const imgPrompt = plan.imageGenerationPrompt || fallbackPrompt;

      let imageMethod = 'svg_fallback';
      let svgContent = null;

      // STEP 1: PRIORITIZE GOOGLE AI STUDIO / FLUX (Routes even to Tab 1, odd to Tab 2)
      try {
        console.log(`   🎨 [${parityLabel}] Đang tạo ảnh #${globalIndex + 1} (Cảnh ${sceneId} Beat ${beat.sub_index}): "${diegeticLabel || actionDesc.substring(0, 40)}"...`);
        const fluxRes = await generateFluxImage({
          prompt: imgPrompt,
          diegeticLabel,
          outputPath: beatPngPath,
          imageIndex: globalIndex,
          tabId: assignedTabId,
        });
        if (fluxRes.success && fs.existsSync(beatPngPath) && fs.statSync(beatPngPath).size > 5000) {
          imageMethod = fluxRes.method || 'flux';
          console.log(`   ✓ [${parityLabel}] Hoàn tất ảnh #${globalIndex + 1} (${imageMethod}): ${beatImageFile}`);
        }
      } catch (fluxErr) {
        console.warn(`   ⚠️ Lỗi tạo ảnh beat #${globalIndex + 1}:`, fluxErr.message);
      }

      // STEP 2: SECONDARY AI FALLBACK (DALL-E 3)
      if (imageMethod === 'svg_fallback' && openaiApiKey && imgPrompt) {
        try {
          console.log(`   🎨 [DALL-E 3] Fallback OpenAI cho ảnh #${globalIndex + 1}...`);
          const fullPrompt = diegeticLabel
            ? `${imgPrompt}. Ensure exact text "${diegeticLabel}" is written clearly in the scene on a sign, chalkboard, or label.`
            : imgPrompt;

          const dalleRes = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
              model: 'dall-e-3',
              prompt: fullPrompt.substring(0, 4000),
              n: 1,
              size: '1792x1024',
              quality: 'standard',
              style: 'vivid',
            }),
          });

          if (dalleRes.ok) {
            const dalleData = await dalleRes.json();
            const imageUrl = dalleData.data?.[0]?.url;
            if (imageUrl) {
              const imgFetchRes = await fetch(imageUrl);
              const arrayBuffer = await imgFetchRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              await sharp(buffer)
                .resize(1920, 1080, {
                  fit: 'contain',
                  background: { r: 255, g: 255, b: 255, alpha: 1 },
                })
                .png({ quality: 95 })
                .toFile(beatPngPath);

              imageMethod = 'dall-e-3';
              console.log(`   ✓ DALL-E 3 thành công: ${beatImageFile}`);
            }
          }
        } catch (dallErr) {
          console.warn(`   ⚠️ Lỗi DALL-E 3: ${dallErr.message}`);
        }
      }

      // STEP 3: FALLBACK TO SEMANTIC SVG ONLY IF ALL AI METHODS FAILED
      if (imageMethod === 'svg_fallback') {
        console.log(`   🎨 [SVG Fallback] Dựng hình đồ họa vector cho beat #${globalIndex + 1}...`);
        svgContent = generateSemanticSvgForBeat({
          beat,
          scene: { id: sceneId, title: sceneTitle, text: item.sceneText, videoTitle: title },
          styleGuide,
        });
        await sharp(Buffer.from(svgContent)).png({ quality: 95 }).toFile(beatPngPath);
      }

      item.imageMethod = imageMethod;
      item.svgContent = svgContent;

      completedImagesCount++;
      const donePct = 50 + (completedImagesCount / Math.max(1, totalBeatsCount)) * 30;
      notify('images', donePct, `✓ [Ảnh ${completedImagesCount}/${totalBeatsCount}] Cảnh ${sceneId}.${beat.sub_index} [${imageMethod.toUpperCase()}]: "${keyLabel}"`, {
        sceneIndex: sceneId,
        totalScenes,
        beatIndex: beat.sub_index,
        globalIndex,
        imageMethod,
        keyLabel,
        completedImagesCount,
        totalBeatsCount,
      });
    })
  );

  // ==========================================
  // PHASE 4: Assemble Clips and Combine with Audio in Exact Chronological Order
  // ==========================================
  console.log(`\n========================================================`);
  console.log(`🎬 [Phase 4] Ghép nối các phân cảnh theo đúng thứ tự kịch bản...`);
  console.log(`========================================================\n`);

  for (let i = 0; i < scenesData.length; i++) {
    const sData = scenesData[i];
    const sceneId = sData.sceneId;
    const sceneTitle = sData.sceneTitle;
    const sceneText = sData.sceneText;
    const tempSceneDir = sData.tempSceneDir;
    const audioPath = sData.audioPath;
    const durationInSeconds = sData.durationInSeconds;
    const durationInFrames = sData.durationInFrames;

    // Filter and sort beats for this scene in STRICT sub_index order
    const sceneBeats = allBeatsToGenerate
      .filter((item) => item.sceneId === sceneId)
      .sort((a, b) => a.beat.sub_index - b.beat.sub_index);

    const beatClipPaths = [];
    const beats = [];

    for (const item of sceneBeats) {
      const { beat, plan, validation, beatImageFile, beatPngPath, imageMethod, svgContent } = item;

      if (beat.sub_index === 1) {
        try {
          fs.copyFileSync(beatPngPath, path.join(IMAGES_DIR, `scene_${sceneId}.png`));
        } catch (_) {}
      }

      // Render beat clip with smooth micro-motion (Ken-Burns push-in)
      const beatClipOut = path.join(tempSceneDir, `beat_${beat.sub_index}.mp4`);
      const beatSec = (beat.duration_in_frames / 30).toFixed(2);
      try {
        execSync(
          `/opt/homebrew/bin/ffmpeg -y -loop 1 -i "${beatPngPath}" -vf "scale=1920:1080,zoompan=z='min(zoom+0.0003,1.015)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30" -c:v libx264 -t ${beatSec} -pix_fmt yuv420p -r 30 -an "${beatClipOut}"`,
          { stdio: 'ignore' }
        );
        beatClipPaths.push(beatClipOut);
      } catch (err) {
        console.warn(`Lỗi render clip beat ${beat.id}:`, err);
      }

      beats.push({
        id: beat.id,
        sub_index: beat.sub_index,
        title: beat.title,
        text: beat.text,
        prompt: `2D cartoon explainer, ${plan.visualMethod}, ${plan.keyText}, clean vector art, 1080p.`,
        caption: beat.caption,
        image_file: beatImageFile,
        image_version: generationRunId,
        svg_data: svgContent,
        duration_in_seconds: beat.duration_in_seconds,
        duration_in_frames: beat.duration_in_frames,
        start_frame_offset: beat.start_frame_offset,
        plan,
        validation,
        visual_type: plan.visualMethod === 'character_action' ? 'character' : plan.visualMethod === 'object_metaphor' ? 'object_metaphor' : plan.visualMethod,
        main_text: plan.keyText,
        sub_text: plan.meaning,
        motion: 'slide',
      });
    }

    // Combine beat clips with scene audio
    const renderScenePct = 80 + ((i + 0.8) / totalScenes) * 12;
    notify('render', renderScenePct, `[Cảnh ${sceneId}/${totalScenes}] Đang kết hợp clip Ken-Burns với giọng đọc audio...`, {
      sceneIndex: sceneId,
      totalScenes,
      sceneTitle,
    });

    console.log(`[Bước 5/5] Ghép nối các beat clips với giọng đọc audio của cảnh ${sceneId}...`);
    const sceneClipOut = path.join(PUBLIC_DIR, `clip_${sceneId}.mp4`);

    if (beatClipPaths.length > 0) {
      const beatListFile = path.join(tempSceneDir, 'beat_list.txt');
      fs.writeFileSync(beatListFile, beatClipPaths.map((p) => `file '${p}'`).join('\n'));

      try {
        execSync(
          `/opt/homebrew/bin/ffmpeg -y -f concat -safe 0 -i "${beatListFile}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -af "apad=pad_dur=0.4" -shortest "${sceneClipOut}"`,
          { stdio: 'ignore' }
        );
        sceneClipPaths.push(sceneClipOut);
      } catch (err) {
        console.warn(`Lỗi ghép scene ${sceneId}:`, err);
      }
    }

    const rawScene = sData.rawScene;
    const sceneRecord = {
      id: sceneId,
      scene_id: rawScene.scene_id || `scene_0${sceneId}`,
      title: sceneTitle,
      text: sceneText,
      narration: sceneText,
      prompt: beats[0]?.prompt || `2D cartoon explainer, ${sceneTitle}`,
      audio_file: sData.audioFileName,
      audio_version: generationRunId,
      image_file: `scene_${sceneId}_beat_1.png`,
      image_version: generationRunId,
      visual_type: beats[0]?.visual_type || 'character',
      visual_description: beats[0]?.plan?.meaning || '',
      subject: beats[0]?.plan?.subject || '',
      environment: beats[0]?.plan?.environment || '',
      objects: beats[0]?.plan?.objects || [],
      composition: beats[0]?.plan?.composition || '',
      action: beats[0]?.plan?.action || '',
      main_text: beats[0]?.main_text || sceneTitle,
      sub_text: beats[0]?.sub_text || '',
      motion: 'slide',
      camera: 'static',
      beats,
      duration_in_seconds: Number(durationInSeconds.toFixed(2)),
      duration_in_frames: durationInFrames,
      start_frame: totalFrames,
    };

    totalFrames += durationInFrames;
    finalizedScenes.push(sceneRecord);
  }

  // Quality Gate Check before export
  notify('render', 93, 'Đang kiểm định chất lượng phân cảnh (Quality Gate Check)...');
  const qualityReport = runProjectQualityGate(finalizedScenes);
  console.log(`\n🛡️ [QUALITY GATE CHECK]: Passed=${qualityReport.validation_passed} | Total Beats=${qualityReport.total_beats} | Avg Beat Dur=${qualityReport.avg_beat_duration_sec}s`);
  if (qualityReport.issues.length > 0) {
    qualityReport.issues.forEach((iss) => console.log(`   • ${iss}`));
  }

  // Concatenate all scene clips into final-video.mp4
  notify('render', 95, 'Đang xuất và ghép nối file video tổng hợp final-video.mp4...');
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
    } finally {
      try {
        if (fs.existsSync(listFile)) fs.unlinkSync(listFile);
        for (let sId = 1; sId <= totalScenes; sId++) {
          const d = path.join(PUBLIC_DIR, `temp_scene_${sId}`);
          if (fs.existsSync(d)) {
            fs.rmSync(d, { recursive: true, force: true });
          }
        }
      } catch (_) {}
    }
  }

  notify('render', 99, 'Đang đồng bộ hóa metadata & danh sách phân cảnh vào Remotion Player...');

  const metadata = {
    title: title || 'Video Giải Thích Đa Dạng',
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
    style_guide: styleGuide,
    quality_report: qualityReport,
  };

  const outputData = {
    metadata,
    scenes: finalizedScenes,
  };

  fs.writeFileSync(path.join(PUBLIC_DIR, 'scenes.json'), JSON.stringify(outputData, null, 2));
  fs.writeFileSync(path.join(SRC_DATA_DIR, 'scenes.json'), JSON.stringify(outputData, null, 2));

  console.log(`\n🎉 [HOÀN TẤT XUẤT SẮC - DATA-DRIVEN CARTOON EXPLAINER]:`);
  console.log(`- ${finalizedScenes.length} Phân cảnh với ${qualityReport.total_beats} visual beats.`);
  finalizedScenes.forEach((s) => {
    console.log(`  • Cảnh ${s.id}: ${s.beats?.length || 1} beats - ${s.title}`);
  });
  console.log(`- Tổng thời lượng: ${(totalFrames / 30).toFixed(1)}s (${totalFrames} frames)`);

  notify('done', 100, `🎉 Hoàn tất 100%! Đã tạo xong ${finalizedScenes.length} cảnh với ${qualityReport.total_beats} visual beats.`, {
    totalScenes: finalizedScenes.length,
    totalBeats: qualityReport.total_beats,
    durationSeconds: (totalFrames / 30).toFixed(1),
  });

  return {
    success: true,
    metadata,
    scenes: finalizedScenes,
    finalVideoUrl: '/final-video.mp4',
  };
}

// Support direct execution via CLI
if (require.main === module) {
  (async () => {
    try {
      const args = process.argv.slice(2);
      let content = null;
      let cliTitle = 'Video Giải Thích Mới';
      if (args[0]) {
        if (fs.existsSync(args[0])) {
          content = fs.readFileSync(args[0], 'utf8');
          cliTitle = path.basename(args[0], path.extname(args[0])).replace(/[_-]+/g, ' ');
        } else {
          content = args.join(' ');
        }
      }
      const testContent = content || `CẢNH 1: Nghịch Lý Giá Cà Phê
Một ly cà phê take-away có giá 50.000 đồng, trong khi chi phí hạt cà phê và nước thực tế chưa tới 3.000 đồng.

CẢNH 2: 94% Giá Trị Nằm Ở Đâu?
Chênh lệch khổng lồ hơn 1.500% không biến chủ quán thành triệu phú, mà bị chia cắt bởi tiền mặt bằng đắc địa và khấu hao máy pha espresso.

CẢNH 3: Bẫy Khách Ngồi Cả Ngày
Khách hàng mua một ly cà phê 35.000 đồng rồi cắm sạc laptop ngồi suốt 6 tiếng làm tiêu hao tiền điện và triệt tiêu doanh thu trên mỗi mét vuông.

CẢNH 4: Quy Tắc Take-Away Tối Ưu
Các chuỗi cà phê thành công nhất tối ưu 80% doanh thu từ khách mua mang đi trong 60 giây thay vì mở rộng diện tích bàn ghế sang chảnh.

CẢNH 5: Bí Quyết Kinh Doanh Bền Vững
Lợi nhuận thực sự đến từ tốc độ quay vòng ly cà phê mỗi sáng, chứ không phụ thuộc vào việc trang trí quán đẹp để khách check-in sống ảo.`;

      if (!content && testContent.includes('Cà Phê')) {
        cliTitle = 'Kinh Tế Học Quán Cà Phê';
      }

      await generateVideo({
        title: cliTitle,
        subtitle: 'Cartoon Explainer',
        content: testContent,
      });
    } catch (err) {
      console.error('CLI execution error:', err);
      process.exit(1);
    }
  })();
}

module.exports = {
  generateVideo,
  generateTTSAudio,
  segmentSceneNaturally,
  extractComicFeatures,
  createCartoonSceneSvg,
};
