/**
 * 2D Cartoon Stickman Explainer Vector Art Generator
 * Inspired by YouTube explainer channels (Polymatter, Casually Explained).
 * Focuses on hand-drawn comic style, creative storytelling metaphors, minimal text, and natural timing.
 */

import { VisualBeat, SceneData } from '../types/scenes';

export type StickmanStyle = 'whiteboard' | 'blueprint' | 'pastel' | 'dark_neon' | 'comic_memo';

export type CharacterPose =
  | 'explaining'
  | 'eureka'
  | 'shocked'
  | 'thinking'
  | 'cooking'
  | 'tech_laptop'
  | 'lifting'
  | 'peaceful'
  | 'investing'
  | 'action'
  | 'running'
  | 'balance'
  | 'ghost'
  | 'trainer';

export interface GenerateImageOptions {
  title: string;
  prompt: string;
  sceneId?: number;
  beatIndex?: number;
  style?: StickmanStyle;
  pose?: CharacterPose;
  primaryColor?: string;
  customNote?: string;
  content?: string;
}

function escapeXml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function extractComicFeatures(clauseText: string, sceneTitle = '') {
  const clean = (clauseText || '').trim();
  const lower = clean.toLowerCase();

  const percentMatch = clean.match(/(\d+(?:[.,]\d+)?\s*%\s*(?:-\s*\d+(?:[.,]\d+)?\s*%)?)/i);
  const metricMatch = clean.match(/(\d+(?:[.,]\d+)?\s*(?:triệu|tỷ|usd|đ|k|tiếng|ngày|tháng|năm|phút|giây|hội viên|đô|kg|bước))/i);

  const percentage = percentMatch ? percentMatch[0].replace(/\s+/g, '') : null;
  const metric = metricMatch ? metricMatch[0] : null;

  let sceneType = 'universal';
  let comicTitle = 'CONCEPT';

  // 1. Crowd / Rush / Influx / Early Year / Queue / Gym join (Reference Image 1: WAVE)
  if (/đăng ký|ồ ạt|đông đúc|hội viên|làn sóng|tháng một|tháng 1|đầu năm|mùa hè|giờ cao điểm|xếp hàng|ùn ùn|nườm nượp|wave|cỗ máy doanh thu/i.test(lower)) {
    sceneType = 'crowd_wave';
    comicTitle = 'WAVE';
  }
  // 2. Obstacle / Not Easy / Padlocked door / Cancellation barrier (Reference Image 3: NOT EASY)
  else if (/khó khăn|hủy|rào cản|không dễ|not easy|hợp đồng|thủ tục|rắc rối|phức tạp|bắt buộc|khóa|cản trở|bẫy|giữ chân|nản lòng/i.test(lower)) {
    sceneType = 'locked_door';
    comicTitle = 'NOT EASY';
  }
  // 3. Percentage / Royalty / Franchise / Fee cut (Reference Image 2: ROYALTY)
  else if (/nhượng quyền|royalty|hoa hồng|chiết khấu|phí doanh thu|cắt giảm|chia chác|thuế/i.test(lower) || (percentage && /doanh thu|lợi nhuận|nộp|chia|phí|thương hiệu/i.test(lower))) {
    sceneType = 'pie_chart';
    comicTitle = percentage ? `ROYALTY ${percentage}` : 'ROYALTY';
  }
  // 4. Freedom / Walking away / Violation / Say NO / Clean exit (Reference Image 4: VIOLATION)
  else if (/vi phạm|violation|khiếu nại|cơ quan quản lý|pháp luật|luật|bảo vệ|phạt|pháp lý|tự do|từ chối|hủy thành công|phá sản|thoát|bước đi|rời bỏ|quyền/i.test(lower)) {
    sceneType = 'street_walk';
    comicTitle = 'VIOLATION';
  }
  // 5. Cooking / Broth / Kitchen / Recipe
  else if (/\b(nấu|phở|xương|nước dùng|gia vị|bếp|ẩm thực|nướng|luộc|thảo quả|hoa hồi|thịt bò)\b/i.test(lower)) {
    sceneType = 'cooking';
    comicTitle = metric ? `${metric.toUpperCase()}` : 'CHUẨN VỊ';
  }
  // 6. Tech / Code / Algorithm / Python / JS
  else if (/code|lập trình|thuật toán|developer|python|javascript|react|ai|dữ liệu|api|bug|bot|mã nguồn/i.test(lower)) {
    sceneType = 'tech_code';
    comicTitle = metric ? `${metric.toUpperCase()}` : 'ALGORITHM';
  }
  // 7. Compound Growth / Investment / Exponential wealth
  else if (/lãi kép|đầu tư|sinh lời|tích lũy|7 tỷ|2 triệu|tăng trưởng|về hưu|cấp số nhân/i.test(lower)) {
    sceneType = 'growth';
    comicTitle = 'LÃI KÉP';
  }
  // 8. Percentage fallback
  else if (percentage) {
    sceneType = 'pie_chart';
    comicTitle = `TỶ LỆ ${percentage}`;
  }
  // 9. Peaceful Morning / Freedom from alarm
  else if (/thức dậy|buổi sáng|bình yên|báo thức|thảnh thơi|an nhiên|ngủ|xa xỉ/i.test(lower)) {
    sceneType = 'peaceful_morning';
    comicTitle = 'TỰ DO';
  } else {
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

export function createCartoonSceneSvg({
  clauseText,
  sceneTitle = '',
  features,
}: {
  clauseText: string;
  sceneTitle?: string;
  features: ReturnType<typeof extractComicFeatures>;
}): string {
  const { sceneType, comicTitle, percentage, metric } = features;
  const safeTitle = escapeXml(comicTitle);

  // 1. PIE CHART SCENE (Reference Image 2: ROYALTY 5-10%)
  if (sceneType === 'pie_chart') {
    return `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="1920" height="1080" fill="#FBF8EE" />
        <text x="960" y="160" font-family="'Comic Sans MS', 'Chalkboard SE', 'Fredoka', 'Be Vietnam Pro', system-ui, sans-serif" font-weight="900" font-size="96" fill="#EF4444" stroke="#1E293B" stroke-width="8" stroke-linejoin="round" text-anchor="middle" paint-order="stroke fill">
          ${safeTitle}
        </text>
        <g transform="translate(850, 560)">
          <circle cx="0" cy="0" r="300" fill="#60A5FA" stroke="#1E293B" stroke-width="12" />
          <path d="M 0 0 L 0 -300 A 300 300 0 0 1 190 -230 Z" fill="#EF4444" stroke="#1E293B" stroke-width="10" />
          <text x="90" y="-120" font-family="sans-serif" font-weight="900" font-size="52" fill="#FFFFFF" stroke="#1E293B" stroke-width="4" paint-order="stroke fill" text-anchor="middle">
            ${escapeXml(percentage)}
          </text>
          <g transform="translate(100, -50)">
            <rect x="0" y="0" width="160" height="90" rx="10" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
            <line x1="0" y1="28" x2="160" y2="28" stroke="#1E293B" stroke-width="4" />
            <text x="80" y="55" font-family="sans-serif" font-weight="900" font-size="20" fill="#1E293B" text-anchor="middle">EVERY</text>
            <text x="80" y="78" font-family="sans-serif" font-weight="900" font-size="20" fill="#1E293B" text-anchor="middle">MONTH</text>
          </g>
        </g>
        <g transform="translate(1380, 480)">
          <circle cx="100" cy="100" r="70" fill="#FFFFFF" stroke="#1E293B" stroke-width="10" />
          <path d="M 65 75 Q 80 65 95 80" fill="none" stroke="#1E293B" stroke-width="6" stroke-linecap="round" />
          <path d="M 135 75 Q 120 65 105 80" fill="none" stroke="#1E293B" stroke-width="6" stroke-linecap="round" />
          <circle cx="80" cy="95" r="8" fill="#1E293B" />
          <circle cx="120" cy="95" r="8" fill="#1E293B" />
          <path d="M 80 135 Q 100 120 120 135" fill="none" stroke="#1E293B" stroke-width="6" stroke-linecap="round" />
          <path d="M 145 90 Q 155 100 150 110 Q 140 105 145 90 Z" fill="#38BDF8" stroke="#1E293B" stroke-width="3" />
          <path d="M 60 170 L 140 170 L 145 320 L 55 320 Z" fill="#BFDBFE" stroke="#1E293B" stroke-width="10" stroke-linejoin="round" />
          <path d="M 60 200 L -120 120" fill="none" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
          <circle cx="-125" cy="118" r="14" fill="#FFFFFF" stroke="#1E293B" stroke-width="5" />
          <path d="M -125 118 L -155 105" stroke="#1E293B" stroke-width="7" stroke-linecap="round" />
          <path d="M 140 200 L 170 270 L 165 310" fill="none" stroke="#1E293B" stroke-width="8" stroke-linecap="round" />
          <line x1="85" y1="320" x2="85" y2="480" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
          <line x1="115" y1="320" x2="115" y2="480" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
          <ellipse cx="75" cy="485" rx="20" ry="10" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
          <ellipse cx="125" cy="485" rx="20" ry="10" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
        </g>
      </svg>
    `;
  }

  // 2. LOCKED DOOR SCENE (Reference Image 3: NOT EASY)
  if (sceneType === 'locked_door') {
    return `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="1920" height="1080" fill="#EAECEF" />
        <g transform="translate(180, 160)">
          <text x="0" y="0" font-family="'Comic Sans MS', sans-serif" font-weight="900" font-size="88" fill="#EF4444" stroke="#1E293B" stroke-width="4" paint-order="stroke fill">EASY</text>
          <line x1="-30" y1="20" x2="250" y2="-70" stroke="#DC2626" stroke-width="12" stroke-linecap="round" />
        </g>
        <g transform="translate(800, 120)">
          <rect x="0" y="0" width="560" height="120" fill="#FFFFFF" stroke="#1E293B" stroke-width="8" />
          <text x="280" y="82" font-family="sans-serif" font-weight="900" font-size="80" fill="#1E293B" text-anchor="middle">${safeTitle}</text>
        </g>
        <g transform="translate(1000, 270)">
          <rect x="-10" y="-10" width="340" height="660" fill="#CBD5E1" stroke="#1E293B" stroke-width="8" />
          <rect x="10" y="10" width="300" height="620" fill="#E2E8F0" stroke="#1E293B" stroke-width="6" />
          <rect x="110" y="80" width="80" height="160" fill="#F8FAFC" stroke="#1E293B" stroke-width="6" />
          <rect x="0" y="150" width="320" height="24" rx="4" fill="#94A3B8" stroke="#1E293B" stroke-width="5" />
          <rect x="0" y="320" width="320" height="24" rx="4" fill="#94A3B8" stroke="#1E293B" stroke-width="5" />
          <rect x="0" y="480" width="320" height="24" rx="4" fill="#94A3B8" stroke="#1E293B" stroke-width="5" />
          <g transform="translate(50, 190)">
            <circle cx="20" cy="10" r="16" fill="none" stroke="#1E293B" stroke-width="6" />
            <rect x="5" y="10" width="30" height="30" rx="4" fill="#F59E0B" stroke="#1E293B" stroke-width="5" />
          </g>
          <g transform="translate(240, 360)">
            <circle cx="20" cy="10" r="16" fill="none" stroke="#1E293B" stroke-width="6" />
            <rect x="5" y="10" width="30" height="30" rx="4" fill="#F59E0B" stroke="#1E293B" stroke-width="5" />
          </g>
          <rect x="220" y="80" width="70" height="90" fill="#FFFFFF" stroke="#64748B" stroke-width="2" />
          <text x="255" y="110" font-size="12" font-weight="900" text-anchor="middle">FORMS</text>
        </g>
        <g transform="translate(850, 320)">
          <circle cx="100" cy="100" r="75" fill="#FFFFFF" stroke="#1E293B" stroke-width="10" />
          <circle cx="75" cy="95" r="16" fill="none" stroke="#1E293B" stroke-width="6" />
          <circle cx="75" cy="95" r="6" fill="#1E293B" />
          <circle cx="125" cy="95" r="16" fill="none" stroke="#1E293B" stroke-width="6" />
          <circle cx="125" cy="95" r="6" fill="#1E293B" />
          <line x1="85" y1="135" x2="115" y2="135" stroke="#1E293B" stroke-width="7" stroke-linecap="round" />
          <path d="M 25 60 Q 10 70 20 80" fill="none" stroke="#38BDF8" stroke-width="5" stroke-linecap="round" />
          <path d="M 175 60 Q 190 70 180 80" fill="none" stroke="#38BDF8" stroke-width="5" stroke-linecap="round" />
          <path d="M 60 175 L 140 175 L 145 320 L 55 320 Z" fill="#3B82F6" stroke="#1E293B" stroke-width="10" stroke-linejoin="round" />
          <path d="M 60 205 L 10 160 L 25 100" fill="none" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
          <path d="M 140 205 L 190 160 L 175 100" fill="none" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
          <line x1="80" y1="320" x2="80" y2="480" stroke="#1E293B" stroke-width="12" stroke-linecap="round" />
          <line x1="120" y1="320" x2="120" y2="480" stroke="#1E293B" stroke-width="12" stroke-linecap="round" />
          <ellipse cx="70" cy="485" rx="20" ry="10" fill="#1E293B" stroke="#1E293B" stroke-width="4" />
          <ellipse cx="130" cy="485" rx="20" ry="10" fill="#1E293B" stroke="#1E293B" stroke-width="4" />
        </g>
      </svg>
    `;
  }

  // 3. STREET SUCCESS / ESCAPE / VIOLATION (Reference Image 4: VIOLATION)
  if (sceneType === 'street_walk') {
    return `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="1920" height="760" fill="#93C5FD" />
        <rect y="720" width="1920" height="70" fill="#86EFAC" stroke="#1E293B" stroke-width="4" />
        <polygon points="0,790 1920,790 1920,930 0,930" fill="#E2E8F0" stroke="#1E293B" stroke-width="5" />
        <line x1="200" y1="790" x2="160" y2="930" stroke="#94A3B8" stroke-width="3" />
        <line x1="450" y1="790" x2="410" y2="930" stroke="#94A3B8" stroke-width="3" />
        <line x1="750" y1="790" x2="710" y2="930" stroke="#94A3B8" stroke-width="3" />
        <line x1="1050" y1="790" x2="1010" y2="930" stroke="#94A3B8" stroke-width="3" />
        <line x1="1350" y1="790" x2="1310" y2="930" stroke="#94A3B8" stroke-width="3" />
        <line x1="1650" y1="790" x2="1610" y2="930" stroke="#94A3B8" stroke-width="3" />
        <rect y="930" width="1920" height="150" fill="#334155" stroke="#1E293B" stroke-width="5" />
        <g transform="translate(100, 280)">
          <path d="M 80 500 L 100 240 Q 70 200 100 160 L 120 240 L 140 500 Z" fill="#78350F" stroke="#1E293B" stroke-width="6" />
          <circle cx="110" cy="180" r="110" fill="#4ADE80" stroke="#1E293B" stroke-width="8" />
          <circle cx="40" cy="220" r="70" fill="#22C55E" stroke="#1E293B" stroke-width="7" />
          <circle cx="170" cy="200" r="75" fill="#4ADE80" stroke="#1E293B" stroke-width="7" />
        </g>
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
          <g transform="translate(60, 160)">
            <rect x="0" y="0" width="380" height="300" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
            <text x="190" y="80" font-family="sans-serif" font-weight="900" font-size="44" fill="#DC2626" text-anchor="middle">MAKE</text>
            <text x="190" y="150" font-family="sans-serif" font-weight="900" font-size="44" fill="#DC2626" text-anchor="middle">CANCELING</text>
            <text x="190" y="220" font-family="sans-serif" font-weight="900" font-size="44" fill="#DC2626" text-anchor="middle">DIFFICULT</text>
            <circle cx="190" cy="145" r="140" fill="none" stroke="#DC2626" stroke-width="18" opacity="0.85" />
            <line x1="90" y1="45" x2="290" y2="245" stroke="#DC2626" stroke-width="18" opacity="0.85" />
          </g>
        </g>
        <g transform="translate(1820, 310)">
          <line x1="20" y1="120" x2="20" y2="480" stroke="#1E293B" stroke-width="10" />
          <path d="M 0 120 L 40 120 L 30 50 L 10 50 Z" fill="#FEF08A" stroke="#1E293B" stroke-width="6" />
          <path d="M -10 50 Q 20 20 50 50 Z" fill="#1E293B" stroke="#1E293B" stroke-width="5" />
        </g>
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

  // 4. CROWD WAVE / REGISTRATION INFLUX (Reference Image 1: WAVE)
  if (sceneType === 'crowd_wave') {
    return `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="1920" height="660" fill="#93C5FD" />
        <rect y="640" width="1920" height="440" fill="#86EFAC" />
        <text x="180" y="140" font-family="'Comic Sans MS', sans-serif" font-weight="900" font-size="110" fill="#1E293B">${safeTitle}</text>
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
        <g transform="translate(850, 160)">
          <text x="0" y="210" font-family="sans-serif" font-weight="900" font-size="190" fill="#FCD34D" stroke="#1E293B" stroke-width="8" paint-order="stroke fill" text-anchor="middle">$</text>
          <text x="0" y="270" font-family="sans-serif" font-weight="900" font-size="34" fill="#1E293B" text-anchor="middle">NEW BILLING</text>
        </g>
        <g transform="translate(1320, 220)">
          <rect x="-20" y="0" width="620" height="46" rx="8" fill="#64748B" stroke="#1E293B" stroke-width="6" />
          <rect x="0" y="46" width="600" height="600" fill="#FDBA74" stroke="#1E293B" stroke-width="8" />
          <text x="260" y="160" font-family="sans-serif" font-weight="900" font-size="80" fill="#1E293B" letter-spacing="10">G-Y-M</text>
          <rect x="180" y="260" width="140" height="386" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
          <text x="250" y="365" font-family="sans-serif" font-weight="900" font-size="20" fill="#1E293B" text-anchor="middle">JOIN NOW</text>
        </g>
        <path d="M 0 780 Q 400 780 700 680 Q 1000 580 1420 780 L 1520 780 L 1520 860 Q 1000 660 700 760 Q 400 860 0 860 Z" fill="#E2E8F0" stroke="#1E293B" stroke-width="6" />
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

  // Fallback to Universal Cartoon Studio
  return `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <rect width="1920" height="1080" fill="#FBF8EE" />
      <text x="960" y="160" font-family="'Comic Sans MS', sans-serif" font-weight="900" font-size="96" fill="#3B82F6" stroke="#1E293B" stroke-width="8" stroke-linejoin="round" text-anchor="middle" paint-order="stroke fill">
        ${safeTitle}
      </text>
      <g transform="translate(860, 480)">
        <circle cx="0" cy="0" r="180" fill="#FDE047" stroke="#1E293B" stroke-width="12" />
        <rect x="-60" y="150" width="120" height="70" rx="10" fill="#94A3B8" stroke="#1E293B" stroke-width="8" />
        <line x1="-50" y1="185" x2="50" y2="185" stroke="#1E293B" stroke-width="6" />
        <path d="M -50 40 Q 0 -60 50 40" fill="none" stroke="#CA8A04" stroke-width="10" stroke-linecap="round" />
        <line x1="0" y1="-220" x2="0" y2="-280" stroke="#EAB308" stroke-width="12" stroke-linecap="round" />
        <line x1="180" y1="-140" x2="230" y2="-190" stroke="#EAB308" stroke-width="12" stroke-linecap="round" />
        <line x1="-180" y1="-140" x2="-230" y2="-190" stroke="#EAB308" stroke-width="12" stroke-linecap="round" />
        <text x="0" y="270" font-family="sans-serif" font-weight="900" font-size="44" fill="#1E293B" text-anchor="middle">
          ${escapeXml(metric)}
        </text>
      </g>
      <g transform="translate(360, 460)">
        <circle cx="100" cy="100" r="68" fill="#FFFFFF" stroke="#1E293B" stroke-width="9" />
        <circle cx="86" cy="90" r="7" fill="#1E293B" />
        <circle cx="118" cy="90" r="7" fill="#1E293B" />
        <path d="M 88 122 Q 102 138 120 122" fill="none" stroke="#1E293B" stroke-width="6" stroke-linecap="round" />
        <path d="M 60 170 L 140 170 L 145 320 L 55 320 Z" fill="#3B82F6" stroke="#1E293B" stroke-width="9" />
        <path d="M 60 200 L -20 130 L -10 60" fill="none" stroke="#1E293B" stroke-width="9" stroke-linecap="round" />
        <path d="M 140 200 L 220 130 L 280 80" fill="none" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
        <line x1="85" y1="320" x2="65" y2="480" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
        <line x1="115" y1="320" x2="135" y2="480" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
      </g>
    </svg>
  `;
}

export function generateStickmanSvg(options: GenerateImageOptions): string {
  const targetText = options.content || options.prompt || options.title;
  const features = extractComicFeatures(targetText, options.title);
  return createCartoonSceneSvg({
    clauseText: targetText,
    sceneTitle: options.title,
    features,
  });
}

export function buildMultiBeatScenes(scenes: SceneData[]): SceneData[] {
  return scenes.map((scene) => {
    if (scene.beats && scene.beats.length > 0) {
      return scene;
    }

    const durationSec = scene.duration_in_seconds;
    const totalFrames = scene.duration_in_frames;

    // Natural beat generation (no 5s limit)
    const features = extractComicFeatures(scene.text, scene.title);
    const svgArt = createCartoonSceneSvg({
      clauseText: scene.text,
      sceneTitle: scene.title,
      features,
    });

    const beats: VisualBeat[] = [
      {
        id: `scene_${scene.id}_beat_1`,
        sub_index: 1,
        title: scene.title,
        prompt: `2D cartoon stickman explainer, ${features.comicTitle}`,
        image_file: scene.image_file,
        svg_data: svgArt,
        duration_in_seconds: durationSec,
        duration_in_frames: totalFrames,
        start_frame_offset: 0,
        caption: scene.text,
      },
    ];

    return {
      ...scene,
      beats,
    };
  });
}
