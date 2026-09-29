/**
 * 2D Stickman Vector Art Generator & Scene Beat Data
 * Supplies vector-drawn Stickman explainer illustrations and multi-beat scene breakdowns.
 * Guarantees that each visual beat lasts AT MOST 5.0 seconds (<= 150 frames @ 30 FPS).
 */

import { VisualBeat, SceneData } from '../types/scenes';

export type StickmanStyle = 'whiteboard' | 'blueprint' | 'pastel' | 'dark_neon' | 'comic_memo';

export type CharacterPose =
  | 'explaining'
  | 'shocked'
  | 'running'
  | 'lifting'
  | 'thinking'
  | 'contract'
  | 'balance'
  | 'ghost'
  | 'fire_panic'
  | 'trainer'
  | 'money_rain'
  | 'broken_machine';

export interface GenerateImageOptions {
  title: string;
  prompt: string;
  sceneId?: number;
  beatIndex?: number;
  style?: StickmanStyle;
  pose?: CharacterPose;
  primaryColor?: string;
  customNote?: string;
}

/**
 * Generates an SVG stickman character based on pose
 */
function getCharacterSvg(pose: CharacterPose, x: number = 300, y: number = 480, strokeColor: string = '#232323'): string {
  switch (pose) {
    case 'shocked':
      return `
        <g transform="translate(${x}, ${y})">
          <!-- Head with shocked expression -->
          <circle cx="100" cy="100" r="54" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="8" />
          <ellipse cx="85" cy="90" rx="6" ry="10" fill="${strokeColor}" />
          <ellipse cx="115" cy="90" rx="6" ry="10" fill="${strokeColor}" />
          <ellipse cx="100" cy="126" rx="14" ry="18" fill="${strokeColor}" />
          <!-- Sweat drops -->
          <path d="M 155 75 Q 170 85 160 95 Q 150 90 155 75 Z" fill="#3498DB" stroke="${strokeColor}" stroke-width="3" />
          <path d="M 45 75 Q 30 85 40 95 Q 50 90 45 75 Z" fill="#3498DB" stroke="${strokeColor}" stroke-width="3" />
          <!-- Hands on head -->
          <path d="M 100 160 L 50 120 L 60 70" fill="none" stroke="${strokeColor}" stroke-width="8" stroke-linecap="round" />
          <path d="M 100 160 L 150 120 L 140 70" fill="none" stroke="${strokeColor}" stroke-width="8" stroke-linecap="round" />
          <!-- Body -->
          <line x1="100" y1="160" x2="100" y2="330" stroke="${strokeColor}" stroke-width="9" stroke-linecap="round" />
          <!-- Legs shaking -->
          <path d="M 100 330 L 65 420 L 50 510" fill="none" stroke="${strokeColor}" stroke-width="9" stroke-linecap="round" />
          <path d="M 100 330 L 135 420 L 150 510" fill="none" stroke="${strokeColor}" stroke-width="9" stroke-linecap="round" />
        </g>
      `;

    case 'running':
      return `
        <g transform="translate(${x}, ${y})">
          <!-- Head leaning forward -->
          <circle cx="120" cy="90" r="50" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="8" />
          <circle cx="140" cy="85" r="6" fill="${strokeColor}" />
          <path d="M 130 115 Q 145 125 155 110" fill="none" stroke="${strokeColor}" stroke-width="5" stroke-linecap="round" />
          <!-- Headband -->
          <path d="M 75 75 Q 120 60 165 75" fill="none" stroke="#E74C3C" stroke-width="12" />
          <!-- Body forward tilt -->
          <line x1="110" y1="140" x2="80" y2="310" stroke="${strokeColor}" stroke-width="9" stroke-linecap="round" />
          <!-- Arms pumping -->
          <path d="M 100 170 L 160 210 L 210 180" fill="none" stroke="${strokeColor}" stroke-width="8" stroke-linecap="round" />
          <path d="M 100 170 L 40 210 L 10 260" fill="none" stroke="${strokeColor}" stroke-width="8" stroke-linecap="round" />
          <!-- Legs sprinting -->
          <path d="M 80 310 L 150 380 L 220 370" fill="none" stroke="${strokeColor}" stroke-width="9" stroke-linecap="round" />
          <path d="M 80 310 L 20 370 L 0 470" fill="none" stroke="${strokeColor}" stroke-width="9" stroke-linecap="round" />
          <!-- Speed wind lines -->
          <line x1="-60" y1="120" x2="20" y2="120" stroke="${strokeColor}" stroke-width="4" stroke-dasharray="16 10" />
          <line x1="-80" y1="180" x2="-10" y2="180" stroke="${strokeColor}" stroke-width="4" stroke-dasharray="20 12" />
        </g>
      `;

    case 'lifting':
      return `
        <g transform="translate(${x}, ${y})">
          <!-- Head strained -->
          <circle cx="100" cy="110" r="50" fill="#FDEDEC" stroke="${strokeColor}" stroke-width="8" />
          <line x1="80" y1="100" x2="95" y2="105" stroke="${strokeColor}" stroke-width="5" />
          <line x1="120" y1="100" x2="105" y2="105" stroke="${strokeColor}" stroke-width="5" />
          <ellipse cx="100" cy="130" rx="16" ry="8" fill="#E74C3C" stroke="${strokeColor}" stroke-width="4" />
          <!-- Heavy Barbell overhead -->
          <line x1="-120" y1="20" x2="320" y2="20" stroke="${strokeColor}" stroke-width="14" stroke-linecap="round" />
          <rect x="-160" y="-30" width="40" height="100" rx="8" fill="#2C3E50" stroke="${strokeColor}" stroke-width="6" />
          <rect x="-200" y="-45" width="40" height="130" rx="10" fill="#E74C3C" stroke="${strokeColor}" stroke-width="6" />
          <rect x="320" y="-30" width="40" height="100" rx="8" fill="#2C3E50" stroke="${strokeColor}" stroke-width="6" />
          <rect x="360" y="-45" width="40" height="130" rx="10" fill="#E74C3C" stroke="${strokeColor}" stroke-width="6" />
          <!-- Arms holding barbell -->
          <path d="M 100 180 L 10 90 L 0 25" fill="none" stroke="${strokeColor}" stroke-width="9" stroke-linecap="round" />
          <path d="M 100 180 L 190 90 L 200 25" fill="none" stroke="${strokeColor}" stroke-width="9" stroke-linecap="round" />
          <!-- Torso -->
          <line x1="100" y1="160" x2="100" y2="330" stroke="${strokeColor}" stroke-width="9" stroke-linecap="round" />
          <!-- Legs wide squat -->
          <path d="M 100 330 L 30 400 L 10 490" fill="none" stroke="${strokeColor}" stroke-width="9" stroke-linecap="round" />
          <path d="M 100 330 L 170 400 L 190 490" fill="none" stroke="${strokeColor}" stroke-width="9" stroke-linecap="round" />
        </g>
      `;

    case 'balance':
      return `
        <g transform="translate(${x}, ${y})">
          <!-- Head wobbling -->
          <circle cx="100" cy="100" r="50" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="8" />
          <circle cx="90" cy="95" r="6" fill="${strokeColor}" />
          <circle cx="120" cy="95" r="6" fill="${strokeColor}" />
          <path d="M 85 130 Q 100 115 125 135" fill="none" stroke="${strokeColor}" stroke-width="5" stroke-linecap="round" />
          <!-- Body -->
          <line x1="100" y1="150" x2="100" y2="320" stroke="${strokeColor}" stroke-width="8" stroke-linecap="round" />
          <!-- Arms stretched out for balance -->
          <line x1="-50" y1="180" x2="250" y2="170" stroke="${strokeColor}" stroke-width="8" stroke-linecap="round" />
          <!-- One leg balancing -->
          <line x1="100" y1="320" x2="100" y2="460" stroke="${strokeColor}" stroke-width="9" stroke-linecap="round" />
          <path d="M 100 320 L 160 360 L 190 340" fill="none" stroke="${strokeColor}" stroke-width="8" stroke-linecap="round" />
          <!-- Fulcrum triangle -->
          <polygon points="100,470 50,560 150,560" fill="#E67E22" stroke="${strokeColor}" stroke-width="7" />
          <!-- Seesaw beam -->
          <line x1="-120" y1="460" x2="320" y2="475" stroke="${strokeColor}" stroke-width="12" stroke-linecap="round" />
        </g>
      `;

    case 'ghost':
      return `
        <g transform="translate(${x}, ${y})">
          <!-- Lazy Sofa -->
          <rect x="-60" y="240" width="380" height="180" rx="20" fill="#E8EEF5" stroke="${strokeColor}" stroke-width="7" />
          <rect x="-80" y="160" width="100" height="260" rx="16" fill="#BDC3C7" stroke="${strokeColor}" stroke-width="6" />
          <!-- Ghost Stickman on sofa with phone -->
          <circle cx="100" cy="150" r="48" fill="#F4F6F7" stroke="${strokeColor}" stroke-width="7" stroke-dasharray="10 5" />
          <circle cx="115" cy="145" r="5" fill="${strokeColor}" />
          <!-- Sleeping Zzz -->
          <text x="170" y="110" font-family="'Comic Sans MS', cursive, sans-serif" font-weight="900" font-size="28" fill="#7F8C8D">Z</text>
          <text x="195" y="80" font-family="'Comic Sans MS', cursive, sans-serif" font-weight="900" font-size="36" fill="#7F8C8D">z</text>
          <!-- Body slouching -->
          <path d="M 100 200 Q 80 270 140 290" fill="none" stroke="${strokeColor}" stroke-width="8" stroke-linecap="round" stroke-dasharray="8 4" />
          <!-- Holding smartphone sending auto-pay -->
          <path d="M 100 220 L 160 250" fill="none" stroke="${strokeColor}" stroke-width="7" stroke-linecap="round" />
          <rect x="155" y="230" width="35" height="55" rx="6" fill="#2ECC71" stroke="${strokeColor}" stroke-width="4" />
          <text x="172" y="265" font-family="sans-serif" font-weight="900" font-size="24" text-anchor="middle" fill="#FFFFFF">$</text>
          <!-- Dollar bills floating out of phone to gym -->
          <path d="M 190 230 Q 240 180 300 210" fill="none" stroke="#27AE60" stroke-width="4" stroke-dasharray="6 4" />
          <text x="320" y="210" font-family="sans-serif" font-weight="900" font-size="34" fill="#27AE60">$$$ 100% LÃI RÒNG</text>
          <!-- Legs lying on sofa -->
          <line x1="140" y1="290" x2="260" y2="290" stroke="${strokeColor}" stroke-width="8" stroke-dasharray="8 4" />
        </g>
      `;

    case 'trainer':
      return `
        <g transform="translate(${x}, ${y})">
          <!-- Head with coach cap -->
          <circle cx="100" cy="100" r="50" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="8" />
          <path d="M 60 75 Q 100 50 140 75 L 170 70" fill="none" stroke="#E74C3C" stroke-width="10" stroke-linecap="round" />
          <circle cx="115" cy="95" r="6" fill="${strokeColor}" />
          <!-- Whistle in mouth -->
          <rect x="130" y="105" width="25" height="15" rx="4" fill="#F1C40F" stroke="${strokeColor}" stroke-width="4" />
          <!-- Whistle cord around neck -->
          <path d="M 85 130 Q 100 160 115 130" fill="none" stroke="${strokeColor}" stroke-width="4" />
          <!-- Body standing upright -->
          <line x1="100" y1="150" x2="100" y2="320" stroke="${strokeColor}" stroke-width="9" stroke-linecap="round" />
          <!-- Clipboard in left hand, pointing with right -->
          <path d="M 100 180 L 170 170 L 240 150" fill="none" stroke="${strokeColor}" stroke-width="8" stroke-linecap="round" />
          <path d="M 100 180 L 40 210 L 20 180" fill="none" stroke="${strokeColor}" stroke-width="8" stroke-linecap="round" />
          <rect x="0" y="150" width="45" height="60" rx="5" fill="#BDC3C7" stroke="${strokeColor}" stroke-width="4" />
          <!-- Legs firm stance -->
          <line x1="100" y1="320" x2="60" y2="480" stroke="${strokeColor}" stroke-width="9" stroke-linecap="round" />
          <line x1="100" y1="320" x2="140" y2="480" stroke="${strokeColor}" stroke-width="9" stroke-linecap="round" />
        </g>
      `;

    case 'explaining':
    default:
      return `
        <g transform="translate(${x}, ${y})">
          <!-- Head -->
          <circle cx="100" cy="100" r="54" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="8" />
          <circle cx="90" cy="90" r="6" fill="${strokeColor}" />
          <circle cx="120" cy="90" r="6" fill="${strokeColor}" />
          <path d="M 90 125 Q 105 140 120 125" fill="none" stroke="${strokeColor}" stroke-width="5" stroke-linecap="round" />
          <!-- Teacher / Presenter Glasses -->
          <rect x="72" y="76" width="32" height="26" rx="6" fill="none" stroke="${strokeColor}" stroke-width="4" />
          <rect x="114" y="76" width="32" height="26" rx="6" fill="none" stroke="${strokeColor}" stroke-width="4" />
          <line x1="104" y1="88" x2="114" y2="88" stroke="${strokeColor}" stroke-width="4" />
          <!-- Body -->
          <line x1="100" y1="154" x2="100" y2="330" stroke="${strokeColor}" stroke-width="9" stroke-linecap="round" />
          <!-- Pointing Arm with Pointer stick -->
          <path d="M 100 190 L 190 160 L 320 130" fill="none" stroke="${strokeColor}" stroke-width="8" stroke-linecap="round" />
          <polygon points="320,120 350,130 320,140" fill="${strokeColor}" />
          <!-- Other Arm relaxed or on hip -->
          <path d="M 100 190 L 50 240 L 65 300" fill="none" stroke="${strokeColor}" stroke-width="7" stroke-linecap="round" />
          <!-- Legs -->
          <line x1="100" y1="330" x2="60" y2="490" stroke="${strokeColor}" stroke-width="9" stroke-linecap="round" />
          <line x1="100" y1="330" x2="140" y2="490" stroke="${strokeColor}" stroke-width="9" stroke-linecap="round" />
        </g>
      `;
  }
}

/**
 * Generates background and props for the Stickman Vector illustration
 */
export function generateStickmanSvg(options: GenerateImageOptions): string {
  const {
    title,
    prompt,
    sceneId = 1,
    beatIndex = 1,
    style = 'whiteboard',
    pose = 'explaining',
    customNote,
  } = options;

  let bgColor = '#FAF7EE';
  let strokeColor = '#232323';
  let accentColor = '#E67E22';
  let cardBg = '#FFFFFF';
  let gridSvg = '';

  if (style === 'blueprint') {
    bgColor = '#0C2033';
    strokeColor = '#FFFFFF';
    accentColor = '#38BDF8';
    cardBg = '#16354D';
    gridSvg = `
      <defs>
        <pattern id="bpGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
        </pattern>
      </defs>
      <rect width="1920" height="1080" fill="url(#bpGrid)" />
    `;
  } else if (style === 'dark_neon') {
    bgColor = '#090D16';
    strokeColor = '#E2E8F0';
    accentColor = '#10B981';
    cardBg = '#1E293B';
    gridSvg = `
      <defs>
        <radialGradient id="neonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(16,185,129,0.15)"/>
          <stop offset="100%" stop-color="rgba(9,13,22,0)"/>
        </radialGradient>
      </defs>
      <circle cx="960" cy="540" r="600" fill="url(#neonGlow)" />
    `;
  } else if (style === 'pastel') {
    bgColor = '#F0F9FF';
    strokeColor = '#1E293B';
    accentColor = '#3B82F6';
    cardBg = '#FFFFFF';
  } else if (style === 'comic_memo') {
    bgColor = '#FFFBEB';
    strokeColor = '#18181B';
    accentColor = '#F59E0B';
    cardBg = '#FEF3C7';
  }

  const charSvg = getCharacterSvg(pose, 260, 360, strokeColor);

  return `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800;900&amp;display=swap');
          text {
            font-family: 'Be Vietnam Pro', system-ui, -apple-system, sans-serif;
          }
        </style>
      </defs>

      <!-- Background -->
      <rect width="1920" height="1080" fill="${bgColor}" />
      ${gridSvg}

      <!-- Ground / Floor line -->
      <line x1="60" y1="870" x2="1860" y2="870" stroke="${strokeColor}" stroke-width="8" stroke-linecap="round" />
      <path d="M 120 890 L 160 870 M 340 900 L 380 870 M 600 890 L 640 870 M 1100 890 L 1140 870 M 1500 890 L 1540 870" stroke="${strokeColor}" stroke-width="4" stroke-linecap="round" />

      <!-- Top Technical Badge / Watermark -->
      <rect x="60" y="40" width="340" height="54" rx="14" fill="${cardBg}" stroke="${strokeColor}" stroke-width="4" />
      <circle cx="90" cy="67" r="10" fill="${accentColor}" />
      <text x="120" y="74" font-weight="900" font-size="20" fill="${strokeColor}">CẢNH #${sceneId} • NHỊP ${beatIndex}</text>

      <rect x="1560" y="40" width="300" height="54" rx="14" fill="${cardBg}" stroke="${strokeColor}" stroke-width="4" />
      <text x="1710" y="74" font-weight="800" font-size="18" text-anchor="middle" fill="${strokeColor}">MAX 5 GIÂY / HÌNH</text>

      <!-- Main Visual Stage: Center Graphic & Infographic Cards -->
      <g transform="translate(680, 160)">
        <!-- Main Board / Diagram Container -->
        <rect x="0" y="0" width="1120" height="650" rx="28" fill="${cardBg}" stroke="${strokeColor}" stroke-width="8" />
        <rect x="30" y="30" width="1060" height="70" rx="16" fill="${accentColor}" stroke="${strokeColor}" stroke-width="5" />
        <text x="560" y="76" font-weight="900" font-size="34" text-anchor="middle" fill="#FFFFFF">${title.toUpperCase()}</text>

        <!-- Sub Graphic Inside Board -->
        <g transform="translate(60, 140)">
          <!-- Dynamic Charts / Diagrams / Visual Metaphors -->
          <rect x="0" y="0" width="460" height="420" rx="18" fill="rgba(0,0,0,0.03)" stroke="${strokeColor}" stroke-width="4" stroke-dasharray="10 8" />
          
          <!-- Bar Graph or Pie Chart -->
          <line x1="40" y1="360" x2="420" y2="360" stroke="${strokeColor}" stroke-width="5" />
          <line x1="40" y1="60" x2="40" y2="360" stroke="${strokeColor}" stroke-width="5" />
          
          <rect x="70" y="240" width="55" height="120" rx="6" fill="#3498DB" stroke="${strokeColor}" stroke-width="4" />
          <rect x="155" y="180" width="55" height="180" rx="6" fill="#2ECC71" stroke="${strokeColor}" stroke-width="4" />
          <rect x="240" y="110" width="55" height="250" rx="6" fill="#E67E22" stroke="${strokeColor}" stroke-width="4" />
          <rect x="325" y="70" width="55" height="290" rx="6" fill="#E74C3C" stroke="${strokeColor}" stroke-width="4" />

          <!-- Growth Arrow -->
          <path d="M 80 220 Q 220 120 370 50" fill="none" stroke="${accentColor}" stroke-width="8" stroke-linecap="round" />
          <polygon points="360,40 390,45 375,70" fill="${accentColor}" />

          <text x="230" y="395" font-weight="800" font-size="20" text-anchor="middle" fill="${strokeColor}">BIỂU ĐỒ PHÂN TÍCH</text>
        </g>

        <!-- Right Side: Key Bullet Explanations & Dollar Metaphors -->
        <g transform="translate(560, 150)">
          <!-- Callout 1 -->
          <rect x="0" y="0" width="480" height="110" rx="16" fill="${cardBg}" stroke="${strokeColor}" stroke-width="5" />
          <circle cx="45" cy="55" r="24" fill="#2ECC71" stroke="${strokeColor}" stroke-width="4" />
          <text x="45" y="64" font-weight="900" font-size="26" text-anchor="middle" fill="#FFFFFF">$</text>
          <text x="90" y="50" font-weight="800" font-size="22" fill="${strokeColor}">TỐI ƯU HÓA DÒNG TIỀN</text>
          <text x="90" y="80" font-weight="600" font-size="16" fill="#64748B">Quy luật chu kỳ tài chính &amp; chi phí</text>

          <!-- Callout 2 -->
          <rect x="0" y="140" width="480" height="110" rx="16" fill="${cardBg}" stroke="${strokeColor}" stroke-width="5" />
          <circle cx="45" cy="195" r="24" fill="#E74C3C" stroke="${strokeColor}" stroke-width="4" />
          <text x="45" y="204" font-weight="900" font-size="24" text-anchor="middle" fill="#FFFFFF">!</text>
          <text x="90" y="190" font-weight="800" font-size="22" fill="${strokeColor}">RỦI RO THIẾT BỊ &amp; MẶT BẰNG</text>
          <text x="90" y="220" font-weight="600" font-size="16" fill="#64748B">Hợp đồng dài hạn &amp; đòn bẩy rủi ro</text>

          <!-- Callout 3: Prompt highlight -->
          <rect x="0" y="280" width="480" height="120" rx="16" fill="rgba(245,158,11,0.12)" stroke="${accentColor}" stroke-width="4" stroke-dasharray="8 6" />
          <text x="240" y="325" font-weight="800" font-size="18" text-anchor="middle" fill="${accentColor}">Ý TƯỞNG HÌNH ẢNH 2D</text>
          <text x="240" y="360" font-weight="600" font-size="15" text-anchor="middle" fill="${strokeColor}">
            ${prompt.length > 55 ? prompt.substring(0, 52) + '...' : prompt}
          </text>
        </g>
      </g>

      <!-- Stickman Main Character -->
      ${charSvg}

      <!-- Speech Bubble or Thought Cloud -->
      <g transform="translate(200, 220)">
        <path d="M 0 0 L 280 0 Q 310 0 310 30 L 310 90 Q 310 120 280 120 L 160 120 L 120 160 L 130 120 L 30 120 Q 0 120 0 90 Z" fill="${cardBg}" stroke="${strokeColor}" stroke-width="6" />
        <text x="155" y="55" font-weight="900" font-size="22" text-anchor="middle" fill="${accentColor}">
          ${customNote || 'CHI TIẾT # ' + beatIndex}
        </text>
        <text x="155" y="88" font-weight="700" font-size="17" text-anchor="middle" fill="${strokeColor}">
          Thời lượng: &lt;= 5.0s
        </text>
      </g>
    </svg>
  `;
}

/**
 * Generates an expanded set of visual beats for all 14 scenes.
 * Every visual beat has a duration of AT MOST 5.0 seconds (150 frames @ 30 FPS).
 */
export function buildMultiBeatScenes(scenes: SceneData[]): SceneData[] {
  return scenes.map((scene) => {
    const totalFrames = scene.duration_in_frames;
    const totalSec = scene.duration_in_seconds;

    // Determine how many visual beats are needed so that EVERY beat is <= 5.0 seconds
    const maxDurationSec = 4.8;
    const neededBeats = Math.max(2, Math.ceil(totalSec / maxDurationSec));

    const beatFrames = Math.floor(totalFrames / neededBeats);
    const beats: VisualBeat[] = [];

    // Distinct character poses and prompts for sub-beats
    const poses: CharacterPose[] = [
      'explaining',
      scene.id % 2 === 0 ? 'shocked' : 'running',
      scene.id % 3 === 0 ? 'balance' : 'lifting',
      'trainer',
    ];

    const subTitles = [
      `${scene.title} - Bối cảnh`,
      `${scene.title} - Trọng tâm`,
      `${scene.title} - Đúc kết`,
      `${scene.title} - Mở rộng`,
    ];

    for (let i = 0; i < neededBeats; i++) {
      const isLast = i === neededBeats - 1;
      const currentBeatFrames = isLast
        ? totalFrames - (neededBeats - 1) * beatFrames
        : beatFrames;
      const durationSec = currentBeatFrames / 30;
      const startOffset = i * beatFrames;

      const beatPose = poses[i % poses.length];
      const beatTitle = subTitles[i] || `Nhịp ${i + 1}`;

      const svgArt = generateStickmanSvg({
        title: beatTitle,
        prompt: scene.prompt,
        sceneId: scene.id,
        beatIndex: i + 1,
        pose: beatPose,
        style: i === 0 ? 'whiteboard' : i === 1 ? 'pastel' : 'comic_memo',
        customNote: `Nhịp ${i + 1}/${neededBeats} • ${(durationSec).toFixed(1)}s`,
      });

      beats.push({
        id: `scene_${scene.id}_beat_${i + 1}`,
        sub_index: i + 1,
        title: beatTitle,
        prompt: `${scene.prompt} (Góc nhìn nhịp ${i + 1}: nhân vật ${beatPose}, chuyển động tối đa 5s)`,
        image_file: i === 0 ? scene.image_file : `scene_${scene.id}.png`,
        svg_data: svgArt,
        duration_in_seconds: Number(durationSec.toFixed(2)),
        duration_in_frames: currentBeatFrames,
        start_frame_offset: startOffset,
        caption: scene.text,
      });
    }

    return {
      ...scene,
      beats,
    };
  });
}
