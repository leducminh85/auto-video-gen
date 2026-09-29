/**
 * Automated 2D Stickman Explainer Video Production Pipeline
 * Step 1: Script Segmentation (JSON)
 * Step 2: TTS Audio Generation & Timing Calculation (ffprobe -> duration_in_frames @ 30 FPS)
 * Step 3: Stickman Vector Line Art Image Generation (1920x1080 16:9 PNGs via sharp)
 * Step 4: Remotion Assembly & Video Rendering to final-video.mp4
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const googleTTS = require('google-tts-api');
const sharp = require('sharp');

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const AUDIO_DIR = path.join(PUBLIC_DIR, 'audio');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');

// Ensure directories exist
[PUBLIC_DIR, AUDIO_DIR, IMAGES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log("=== BẮT ĐẦU PIPELINE SẢN XUẤT VIDEO 2D STICKMAN EXPLAINER ===");

// BƯỚC 1: PHÂN TÍCH & PHÂN CẢNH (Script Segmentation)
const scenesData = [
  {
    id: 1,
    title: "Ảo Tưởng Giờ Cao Điểm",
    text: "Đến phòng gym vào giờ cao điểm, thấy máy chạy bộ kín người, phòng tạ đông đúc và quầy lễ tân xếp hàng, ai cũng nghĩ đây là cỗ máy in tiền béo bở.",
    prompt: "Minimalist 2D line art, stickman character looking at an overcrowded gym lobby with people queuing and treadmills running full speed, flat pastel cream background, simple whiteboard explainer animation style, vector art, no shading, clean lines.",
    bgColor: "#FBF7ED",
    svgElements: `
      <!-- Facade / Gym entrance -->
      <rect x="1200" y="300" width="600" height="650" rx="12" fill="#EFA26A" stroke="#232323" stroke-width="8" />
      <rect x="1220" y="270" width="560" height="60" rx="8" fill="#5C4033" stroke="#232323" stroke-width="6" />
      <text x="1500" y="400" font-family="'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif" font-weight="900" font-size="80" text-anchor="middle" fill="#232323" letter-spacing="12">G - Y - M</text>
      
      <!-- Door -->
      <rect x="1380" y="520" width="220" height="430" fill="#E8EEF5" stroke="#232323" stroke-width="7" />
      <rect x="1410" y="560" width="160" height="180" fill="#C5D9E8" stroke="#232323" stroke-width="5" />
      <rect x="1430" y="780" width="120" height="90" fill="#FFFFFF" stroke="#232323" stroke-width="5" />
      <text x="1490" y="825" font-family="sans-serif" font-weight="800" font-size="28" text-anchor="middle" fill="#232323">JOIN</text>
      <text x="1490" y="855" font-family="sans-serif" font-weight="800" font-size="28" text-anchor="middle" fill="#232323">NOW</text>

      <!-- Pathway & Grass -->
      <path d="M 0 950 Q 600 950 1100 880 T 1490 950 L 1920 950 L 1920 1080 L 0 1080 Z" fill="#9BC380" stroke="#232323" stroke-width="7" />
      <path d="M 0 880 Q 500 860 1000 800 T 1380 950 L 1480 950 Q 1100 780 500 840 T 0 910 Z" fill="#D6DBDF" stroke="#232323" stroke-width="6" />

      <!-- Calendar Sign Monthly Billing -->
      <g transform="translate(180, 160)">
        <rect x="0" y="0" width="300" height="260" rx="16" fill="#FFFFFF" stroke="#232323" stroke-width="7" />
        <rect x="0" y="0" width="300" height="60" rx="12" fill="#E74C3C" stroke="#232323" stroke-width="6" />
        <text x="150" y="42" font-family="sans-serif" font-weight="900" font-size="32" text-anchor="middle" fill="#FFFFFF">JANUARY</text>
        <circle cx="80" cy="110" r="22" fill="none" stroke="#E74C3C" stroke-width="6" />
        <text x="80" y="118" font-family="sans-serif" font-weight="700" font-size="24" text-anchor="middle">1</text>
        <circle cx="150" cy="160" r="22" fill="none" stroke="#E74C3C" stroke-width="6" />
        <text x="150" y="168" font-family="sans-serif" font-weight="700" font-size="24" text-anchor="middle">15</text>
        <circle cx="220" cy="210" r="22" fill="none" stroke="#E74C3C" stroke-width="6" />
        <text x="220" y="218" font-family="sans-serif" font-weight="700" font-size="24" text-anchor="middle">29</text>
        <text x="150" y="-20" font-family="sans-serif" font-weight="900" font-size="34" text-anchor="middle" fill="#232323">MONTHLY BILLING</text>
      </g>

      <!-- Huge Dollar Sign -->
      <text x="750" y="320" font-family="'Comic Sans MS', cursive, sans-serif" font-weight="900" font-size="160" fill="#E67E22" stroke="#232323" stroke-width="6">$</text>
      <text x="750" y="390" font-family="sans-serif" font-weight="900" font-size="38" text-anchor="middle" fill="#232323">NEW BILLING</text>

      <!-- Stickman Main Character watching -->
      <g transform="translate(180, 520)">
        <!-- Head -->
        <circle cx="100" cy="100" r="50" fill="#FFFFFF" stroke="#232323" stroke-width="7" />
        <circle cx="90" cy="90" r="6" fill="#232323" />
        <circle cx="120" cy="90" r="6" fill="#232323" />
        <path d="M 90 125 Q 105 140 120 125" fill="none" stroke="#232323" stroke-width="5" stroke-linecap="round" />
        <!-- Body -->
        <line x1="100" y1="150" x2="100" y2="280" stroke="#232323" stroke-width="8" stroke-linecap="round" />
        <!-- Arms -->
        <path d="M 100 180 L 150 220 L 210 200" fill="none" stroke="#232323" stroke-width="7" stroke-linecap="round" />
        <path d="M 100 180 L 50 230" fill="none" stroke="#232323" stroke-width="7" stroke-linecap="round" />
        <!-- Legs -->
        <line x1="100" y1="280" x2="60" y2="400" stroke="#232323" stroke-width="8" stroke-linecap="round" />
        <line x1="100" y1="280" x2="140" y2="400" stroke="#232323" stroke-width="8" stroke-linecap="round" />
      </g>

      <!-- Crowd of stick figures rushing to gym -->
      ${[400, 480, 560, 650, 740, 830, 920, 1020, 1140].map((x, i) => `
        <g transform="translate(${x}, ${580 + (i % 3) * 35})">
          <circle cx="30" cy="30" r="22" fill="${i % 2 === 0 ? '#232323' : '#FFFFFF'}" stroke="#232323" stroke-width="5" />
          <line x1="30" y1="52" x2="30" y2="130" stroke="#232323" stroke-width="6" />
          <line x1="30" y1="70" x2="${45 + (i % 2) * 15}" y2="100" stroke="#232323" stroke-width="5" />
          <line x1="30" y1="70" x2="${15 - (i % 2) * 10}" y2="100" stroke="#232323" stroke-width="5" />
          <line x1="30" y1="130" x2="${45 + (i % 2) * 10}" y2="200" stroke="#232323" stroke-width="6" />
          <line x1="30" y1="130" x2="${15 - (i % 2) * 10}" y2="200" stroke="#232323" stroke-width="6" />
        </g>
      `).join('')}
    `
  },
  {
    id: 2,
    title: "Bản Chất Mô Hình Thuê Bao",
    text: "Sự thật bóc trần: Phòng gym không phải kinh doanh thể thao, mà là mô hình thuê bao subscription có chứa tạ và máy móc.",
    prompt: "Minimalist 2D line art, stickman character pointing at a big subscription contract box with dumbell and machine gears inside, flat pastel blue background, simple whiteboard explainer animation style, vector art, no shading, clean lines.",
    bgColor: "#EBF3FA",
    svgElements: `
      <!-- Title Badge -->
      <g transform="translate(660, 100)">
        <rect x="0" y="0" width="600" height="90" rx="20" fill="#2980B9" stroke="#232323" stroke-width="6" />
        <text x="300" y="58" font-family="'Comic Sans MS', sans-serif" font-weight="900" font-size="44" text-anchor="middle" fill="#FFFFFF">SUBSCRIPTION BUSINESS</text>
      </g>

      <!-- Center Box: Gym as Subscription -->
      <g transform="translate(720, 260)">
        <rect x="0" y="0" width="680" height="600" rx="24" fill="#FFFFFF" stroke="#232323" stroke-width="9" />
        <text x="340" y="80" font-family="sans-serif" font-weight="900" font-size="46" text-anchor="middle" fill="#232323">MÔ HÌNH THUÊ BAO</text>
        <line x1="60" y1="110" x2="620" y2="110" stroke="#BDC3C7" stroke-width="4" stroke-dasharray="10 8" />
        
        <!-- Recurring arrow circle -->
        <circle cx="340" cy="280" r="130" fill="none" stroke="#27AE60" stroke-width="12" stroke-dasharray="24 12" />
        <text x="340" y="270" font-family="sans-serif" font-weight="900" font-size="64" text-anchor="middle" fill="#27AE60">$$$</text>
        <text x="340" y="325" font-family="sans-serif" font-weight="800" font-size="30" text-anchor="middle" fill="#7F8C8D">HÀNG THÁNG</text>
        
        <!-- Dumbbell Icon inside -->
        <g transform="translate(340, 480)">
          <rect x="-180" y="-30" width="50" height="60" rx="8" fill="#34495E" stroke="#232323" stroke-width="6" />
          <rect x="130" y="-30" width="50" height="60" rx="8" fill="#34495E" stroke="#232323" stroke-width="6" />
          <line x1="-130" y1="0" x2="130" y2="0" stroke="#232323" stroke-width="16" />
          <text x="0" y="70" font-family="sans-serif" font-weight="800" font-size="32" text-anchor="middle" fill="#2C3E50">+ TẠ &amp; MÁY MÓC</text>
        </g>
      </g>

      <!-- Stickman Presenter -->
      <g transform="translate(240, 360)">
        <circle cx="100" cy="100" r="60" fill="#FFFFFF" stroke="#232323" stroke-width="8" />
        <circle cx="90" cy="90" r="7" fill="#232323" />
        <circle cx="125" cy="90" r="7" fill="#232323" />
        <path d="M 85 130 Q 110 150 135 130" fill="none" stroke="#232323" stroke-width="6" />
        <!-- Glasses -->
        <rect x="70" y="75" width="35" height="28" rx="6" fill="none" stroke="#232323" stroke-width="5" />
        <rect x="115" y="75" width="35" height="28" rx="6" fill="none" stroke="#232323" stroke-width="5" />
        <line x1="105" y1="88" x2="115" y2="88" stroke="#232323" stroke-width="5" />
        <!-- Body -->
        <line x1="100" y1="160" x2="100" y2="340" stroke="#232323" stroke-width="9" />
        <!-- Arm pointing to box -->
        <path d="M 100 210 L 220 180 L 380 150" fill="none" stroke="#232323" stroke-width="9" stroke-linecap="round" />
        <polygon points="380,140 410,150 380,160" fill="#232323" />
        <path d="M 100 210 L 40 280 L 10 350" fill="none" stroke="#232323" stroke-width="8" stroke-linecap="round" />
        <!-- Legs -->
        <line x1="100" y1="340" x2="50" y2="520" stroke="#232323" stroke-width="9" />
        <line x1="100" y1="340" x2="160" y2="520" stroke="#232323" stroke-width="9" />
      </g>

      <!-- Crossed out Sport icon -->
      <g transform="translate(1500, 360)">
        <circle cx="100" cy="100" r="90" fill="#FDEDEC" stroke="#E74C3C" stroke-width="8" />
        <text x="100" y="110" font-family="sans-serif" font-weight="900" font-size="34" text-anchor="middle" fill="#C0392B">FITNESS?</text>
        <line x1="30" y1="30" x2="170" y2="170" stroke="#E74C3C" stroke-width="12" />
        <text x="100" y="240" font-family="sans-serif" font-weight="900" font-size="32" text-anchor="middle" fill="#E74C3C">KHÔNG PHẢI!</text>
      </g>
    `
  },
  {
    id: 3,
    title: "Chi Phí Ban Đầu Khổng Lồ",
    text: "Chi phí mở cửa ban đầu cực kỳ tốn kém, từ 300.000 đến hơn 1 triệu USD chỉ cho tiền cọc, sàn cao su chịu lực, và hệ thống thông gió HVAC khổng lồ.",
    prompt: "Minimalist 2D line art, stickman character looking shocked at a massive pile of dollar bills vanishing into heavy rubber flooring and giant HVAC ventilation pipes, flat pastel mint background, simple whiteboard explainer animation style, vector art, no shading, clean lines.",
    bgColor: "#EEF8F2",
    svgElements: `
      <!-- Title -->
      <text x="960" y="120" font-family="sans-serif" font-weight="900" font-size="52" text-anchor="middle" fill="#232323">CHI PHÍ BAN ĐẦU: $300K - $1.000.000+</text>

      <!-- Breakdown Cards -->
      <!-- 1: Rent Deposit -->
      <g transform="translate(160, 220)">
        <rect x="0" y="0" width="340" height="420" rx="16" fill="#FFFFFF" stroke="#232323" stroke-width="6" />
        <text x="170" y="60" font-family="sans-serif" font-weight="900" font-size="30" text-anchor="middle">TIỀN CỌC THUÊ</text>
        <text x="170" y="110" font-family="sans-serif" font-weight="800" font-size="24" fill="#7F8C8D" text-anchor="middle">3 - 6 Tháng</text>
        <rect x="40" y="150" width="260" height="180" rx="8" fill="#F4F6F6" stroke="#232323" stroke-width="4" />
        <text x="170" y="250" font-size="64" text-anchor="middle">🏢</text>
        <text x="170" y="380" font-family="sans-serif" font-weight="900" font-size="32" fill="#E74C3C" text-anchor="middle">$50K - $150K</text>
      </g>

      <!-- 2: Rubber Flooring -->
      <g transform="translate(560, 220)">
        <rect x="0" y="0" width="340" height="420" rx="16" fill="#FFFFFF" stroke="#232323" stroke-width="6" />
        <text x="170" y="60" font-family="sans-serif" font-weight="900" font-size="30" text-anchor="middle">SÀN CAO SU</text>
        <text x="170" y="110" font-family="sans-serif" font-weight="800" font-size="24" fill="#7F8C8D" text-anchor="middle">Chịu lực chống nứt</text>
        <rect x="40" y="150" width="260" height="180" rx="8" fill="#2C3E50" stroke="#232323" stroke-width="4" />
        <pattern id="dotPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="3" fill="#95A5A6" />
        </pattern>
        <rect x="40" y="150" width="260" height="180" fill="url(#dotPattern)" />
        <text x="170" y="380" font-family="sans-serif" font-weight="900" font-size="32" fill="#E74C3C" text-anchor="middle">$10K - $40K</text>
      </g>

      <!-- 3: HVAC Ventilation -->
      <g transform="translate(960, 220)">
        <rect x="0" y="0" width="380" height="420" rx="16" fill="#FFFFFF" stroke="#232323" stroke-width="6" />
        <text x="190" y="60" font-family="sans-serif" font-weight="900" font-size="30" text-anchor="middle">HỆ THỐNG HVAC</text>
        <text x="190" y="110" font-family="sans-serif" font-weight="800" font-size="22" fill="#7F8C8D" text-anchor="middle">2.000+ CFM Khí tươi</text>
        <path d="M 50 240 Q 190 150 330 240" fill="none" stroke="#3498DB" stroke-width="18" stroke-linecap="round" />
        <path d="M 80 270 Q 190 200 300 270" fill="none" stroke="#85C1E9" stroke-width="12" stroke-linecap="round" />
        <text x="190" y="235" font-size="44" text-anchor="middle">🌀</text>
        <text x="190" y="380" font-family="sans-serif" font-weight="900" font-size="32" fill="#E74C3C" text-anchor="middle">$10K - $50K</text>
      </g>

      <!-- Shocked Stickman -->
      <g transform="translate(1480, 420)">
        <!-- Head with shock eyes -->
        <circle cx="120" cy="100" r="70" fill="#FFFFFF" stroke="#232323" stroke-width="8" />
        <circle cx="95" cy="85" r="16" fill="#FFFFFF" stroke="#232323" stroke-width="5" />
        <circle cx="95" cy="85" r="6" fill="#232323" />
        <circle cx="145" cy="85" r="16" fill="#FFFFFF" stroke="#232323" stroke-width="5" />
        <circle cx="145" cy="85" r="6" fill="#232323" />
        <ellipse cx="120" cy="135" rx="18" ry="24" fill="#232323" />
        <!-- Sweat drops -->
        <path d="M 60 70 Q 45 80 50 95 Q 65 95 60 70 Z" fill="#3498DB" stroke="#232323" stroke-width="3" />
        <path d="M 180 60 Q 195 70 190 85 Q 175 85 180 60 Z" fill="#3498DB" stroke="#232323" stroke-width="3" />
        <!-- Hands on cheeks in horror -->
        <line x1="120" y1="170" x2="120" y2="340" stroke="#232323" stroke-width="9" />
        <path d="M 120 220 L 50 160 L 60 120" fill="none" stroke="#232323" stroke-width="8" stroke-linecap="round" />
        <path d="M 120 220 L 190 160 L 180 120" fill="none" stroke="#232323" stroke-width="8" stroke-linecap="round" />
        <line x1="120" y1="340" x2="70" y2="520" stroke="#232323" stroke-width="9" />
        <line x1="120" y1="340" x2="170" y2="520" stroke="#232323" stroke-width="9" />
      </g>
    `
  },
  {
    id: 4,
    title: "Mua Đứt Hay Thuê Tài Chính?",
    text: "Mua đứt thiết bị sẽ ngốn sạch dòng tiền dự phòng, còn thuê tài chính thì phải gánh lãi suất 8% và khoản nợ cố định dù phòng gym vắng khách.",
    prompt: "Minimalist 2D line art, stickman character sweating balancing on a scale between cash purchase and heavy monthly lease debt contract, flat pastel peach background, simple whiteboard explainer animation style, vector art, no shading, clean lines.",
    bgColor: "#FDF2E9",
    svgElements: `
      <!-- Big Scale Graphic -->
      <g transform="translate(960, 480)">
        <!-- Scale Base -->
        <polygon points="-60,320 60,320 0,60" fill="#7F8C8D" stroke="#232323" stroke-width="8" />
        <rect x="-160" y="320" width="320" height="40" rx="8" fill="#34495E" stroke="#232323" stroke-width="6" />
        <!-- Pivot arm -->
        <line x1="-420" y1="-20" x2="420" y2="80" stroke="#232323" stroke-width="14" stroke-linecap="round" />
        
        <!-- Left Pan: BUY (CASH) -->
        <g transform="translate(-420, -20)">
          <line x1="0" y1="0" x2="-80" y2="160" stroke="#232323" stroke-width="5" />
          <line x1="0" y1="0" x2="80" y2="160" stroke="#232323" stroke-width="5" />
          <path d="M -110 160 Q 0 210 110 160 Z" fill="#E67E22" stroke="#232323" stroke-width="6" />
          <rect x="-90" y="80" width="180" height="80" rx="10" fill="#FFFFFF" stroke="#232323" stroke-width="5" />
          <text x="0" y="125" font-family="sans-serif" font-weight="900" font-size="28" text-anchor="middle" fill="#C0392B">MUA ĐỨT</text>
          <text x="0" y="150" font-family="sans-serif" font-weight="700" font-size="18" text-anchor="middle" fill="#7F8C8D">Cạn kiệt dòng tiền</text>
        </g>

        <!-- Right Pan: LEASE (DEBT) -->
        <g transform="translate(420, 80)">
          <line x1="0" y1="0" x2="-80" y2="160" stroke="#232323" stroke-width="5" />
          <line x1="0" y1="0" x2="80" y2="160" stroke="#232323" stroke-width="5" />
          <path d="M -110 160 Q 0 210 110 160 Z" fill="#C0392B" stroke="#232323" stroke-width="6" />
          <rect x="-90" y="60" width="180" height="100" rx="10" fill="#FFFFFF" stroke="#232323" stroke-width="5" />
          <text x="0" y="100" font-family="sans-serif" font-weight="900" font-size="28" text-anchor="middle" fill="#C0392B">THUÊ LEASE</text>
          <text x="0" y="125" font-family="sans-serif" font-weight="800" font-size="22" text-anchor="middle" fill="#E74C3C">Lãi ~8%/năm</text>
          <text x="0" y="150" font-family="sans-serif" font-weight="700" font-size="18" text-anchor="middle" fill="#7F8C8D">Nợ cố định hàng tháng</text>
        </g>
      </g>

      <!-- Sweating Stickman Center -->
      <g transform="translate(890, 140)">
        <circle cx="70" cy="70" r="55" fill="#FFFFFF" stroke="#232323" stroke-width="8" />
        <circle cx="50" cy="60" r="6" fill="#232323" />
        <circle cx="85" cy="60" r="6" fill="#232323" />
        <path d="M 50 95 Q 70 80 90 95" fill="none" stroke="#232323" stroke-width="5" />
        <!-- Sweat -->
        <path d="M 120 40 Q 135 50 130 65 Q 115 65 120 40 Z" fill="#3498DB" stroke="#232323" stroke-width="2" />
        <!-- Question marks -->
        <text x="140" y="30" font-family="sans-serif" font-weight="900" font-size="48" fill="#E74C3C">?</text>
        <!-- Body -->
        <line x1="70" y1="125" x2="70" y2="280" stroke="#232323" stroke-width="8" />
        <line x1="70" y1="170" x2="-20" y2="230" stroke="#232323" stroke-width="7" />
        <line x1="70" y1="170" x2="160" y2="230" stroke="#232323" stroke-width="7" />
      </g>
    `
  },
  {
    id: 5,
    title: "Quy Tắc 10 Đến 15 Phút",
    text: "Quy tắc vị trí 10 đến 15 phút: 80% hội viên chỉ đến từ bán kính di chuyển ngắn, nếu chọn sai vị trí hoặc giá thuê quá cao, bạn cầm chắc thất bại.",
    prompt: "Minimalist 2D line art, stickman character measuring a circular 10-15 minute radius map around a gym building with residential houses, flat pastel light blue background, simple whiteboard explainer animation style, vector art, no shading, clean lines.",
    bgColor: "#EAF2F8",
    svgElements: `
      <!-- Map Radius Target -->
      <g transform="translate(1080, 540)">
        <circle cx="0" cy="0" r="380" fill="#E8F8F5" stroke="#16A085" stroke-width="6" stroke-dasharray="16 10" />
        <circle cx="0" cy="0" r="260" fill="#D1F2EB" stroke="#1ABC9C" stroke-width="8" />
        <circle cx="0" cy="0" r="140" fill="#A3E4D7" stroke="#16A085" stroke-width="8" />
        
        <!-- Gym center icon -->
        <rect x="-60" y="-50" width="120" height="100" rx="10" fill="#E67E22" stroke="#232323" stroke-width="6" />
        <text x="0" y="10" font-family="sans-serif" font-weight="900" font-size="28" text-anchor="middle" fill="#FFFFFF">GYM</text>

        <!-- Houses in radius -->
        <text x="-180" y="-140" font-size="44">🏡</text>
        <text x="170" y="-120" font-size="44">🏢</text>
        <text x="-160" y="160" font-size="44">🏬</text>
        <text x="180" y="180" font-size="44">🏠</text>

        <text x="0" y="-290" font-family="sans-serif" font-weight="900" font-size="34" text-anchor="middle" fill="#16A085">BÁN KÍNH 10 - 15 PHÚT</text>
        <text x="0" y="320" font-family="sans-serif" font-weight="900" font-size="42" text-anchor="middle" fill="#E74C3C">80% HỘI VIÊN TẬP TRUNG TẠI ĐÂY</text>
      </g>

      <!-- Stickman with compass / ruler -->
      <g transform="translate(240, 360)">
        <circle cx="90" cy="90" r="60" fill="#FFFFFF" stroke="#232323" stroke-width="8" />
        <circle cx="75" cy="80" r="7" fill="#232323" />
        <circle cx="110" cy="80" r="7" fill="#232323" />
        <path d="M 80 120 Q 95 135 110 120" fill="none" stroke="#232323" stroke-width="5" />
        <!-- Body -->
        <line x1="90" y1="150" x2="90" y2="340" stroke="#232323" stroke-width="9" />
        <!-- Big compass / pointer -->
        <line x1="90" y1="210" x2="280" y2="280" stroke="#E74C3C" stroke-width="10" stroke-linecap="round" />
        <polygon points="280,265 310,285 280,305" fill="#E74C3C" />
        <line x1="90" y1="210" x2="20" y2="290" stroke="#232323" stroke-width="8" />
        <line x1="90" y1="340" x2="40" y2="520" stroke="#232323" stroke-width="9" />
        <line x1="90" y1="340" x2="150" y2="520" stroke="#232323" stroke-width="9" />
      </g>
    `
  },
  {
    id: 6,
    title: "Bí Mật Hội Viên Vô Hình",
    text: "Bí mật lợi nhuận nằm ở Hội Viên Vô Hình: Người đi tập chăm chỉ làm mòn máy móc và tăng chi phí, còn người đóng tiền rồi lặn mất tăm mới mang lại 100% lợi nhuận ròng.",
    prompt: "Minimalist 2D line art, stickman character comparing an active sweating gym member wearing down treadmill with a ghost stickman sitting on sofa sending monthly money, flat pastel cream background, simple whiteboard explainer animation style, vector art, no shading, clean lines.",
    bgColor: "#FAF6EE",
    svgElements: `
      <!-- Comparison Split -->
      <!-- Left: Active Member (High Cost) -->
      <g transform="translate(180, 200)">
        <rect x="0" y="0" width="680" height="720" rx="20" fill="#FDEDEC" stroke="#E74C3C" stroke-width="6" />
        <text x="340" y="70" font-family="sans-serif" font-weight="900" font-size="38" text-anchor="middle" fill="#C0392B">HỘI VIÊN A: CHĂM CHỈ (3 buổi/tuần)</text>
        <line x1="60" y1="100" x2="620" y2="100" stroke="#E74C3C" stroke-width="3" />
        
        <!-- Treadmill runner stickman -->
        <g transform="translate(180, 160)">
          <!-- Treadmill -->
          <line x1="0" y1="260" x2="280" y2="260" stroke="#232323" stroke-width="12" />
          <line x1="260" y1="260" x2="280" y2="140" stroke="#232323" stroke-width="8" />
          <rect x="250" y="120" width="50" height="30" rx="4" fill="#E74C3C" />
          <!-- Running Stickman -->
          <circle cx="120" cy="60" r="35" fill="#FFFFFF" stroke="#232323" stroke-width="6" />
          <line x1="120" y1="95" x2="100" y2="170" stroke="#232323" stroke-width="7" />
          <line x1="100" y1="120" x2="160" y2="140" stroke="#232323" stroke-width="6" />
          <line x1="100" y1="120" x2="60" y2="150" stroke="#232323" stroke-width="6" />
          <line x1="100" y1="170" x2="150" y2="240" stroke="#232323" stroke-width="7" />
          <line x1="100" y1="170" x2="40" y2="220" stroke="#232323" stroke-width="7" />
          <!-- Sweat -->
          <text x="70" y="40" font-size="28">💦</text>
        </g>

        <!-- Consequence bullets -->
        <g transform="translate(80, 480)" font-family="sans-serif" font-weight="700" font-size="26" fill="#78281F">
          <text x="0" y="40">❌ Mòn băng chuyền máy chạy</text>
          <text x="0" y="90">❌ Tốn nước nóng tắm, giặt khăn</text>
          <text x="0" y="140">❌ Chen chúc chật chội sàn tập</text>
          <text x="0" y="190" fill="#C0392B" font-weight="900">➔ CHI PHÍ PHỤC VỤ TĂNG CAO!</text>
        </g>
      </g>

      <!-- Right: Ghost Member (100% Profit) -->
      <g transform="translate(1060, 200)">
        <rect x="0" y="0" width="680" height="720" rx="20" fill="#EAFAF1" stroke="#27AE60" stroke-width="6" />
        <text x="340" y="70" font-family="sans-serif" font-weight="900" font-size="38" text-anchor="middle" fill="#1E8449">HỘI VIÊN B: "VÔ HÌNH" (Đi 2 lần rồi bỏ)</text>
        <line x1="60" y1="100" x2="620" y2="100" stroke="#27AE60" stroke-width="3" />

        <!-- Ghost / Couch Stickman -->
        <g transform="translate(200, 160)">
          <!-- Sofa -->
          <rect x="20" y="180" width="240" height="80" rx="16" fill="#85929E" stroke="#232323" stroke-width="6" />
          <!-- Ghost outline stickman -->
          <circle cx="140" cy="80" r="45" fill="none" stroke="#27AE60" stroke-width="6" stroke-dasharray="8 6" />
          <path d="M 140 125 L 140 210" stroke="#27AE60" stroke-width="7" stroke-dasharray="8 6" />
          <path d="M 140 150 L 210 190" stroke="#27AE60" stroke-width="6" stroke-dasharray="8 6" />
          <path d="M 140 150 L 70 190" stroke="#27AE60" stroke-width="6" stroke-dasharray="8 6" />
          <text x="140" y="70" font-size="44" text-anchor="middle">👻</text>
        </g>

        <!-- Consequence bullets -->
        <g transform="translate(80, 480)" font-family="sans-serif" font-weight="700" font-size="26" fill="#145A32">
          <text x="0" y="40">✅ 0 hao mòn máy móc</text>
          <text x="0" y="90">✅ 0 tốn nước, điện, nhân sự</text>
          <text x="0" y="140">✅ Vẫn trừ thẻ đều đặn hàng tháng</text>
          <text x="0" y="190" fill="#27AE60" font-weight="900">➔ 100% LỢI NHUẬN RÒNG ĐÚT TÚI!</text>
        </g>
      </g>
    `
  },
  {
    id: 7,
    title: "Nghịch Lý Sức Chứa",
    text: "Nghịch lý sức chứa: Phòng 7.000 hội viên chỉ chứa nổi 200 người; nếu chỉ 10% cùng đến tập một lúc, phòng gym sẽ ngay lập tức vỡ trận và vi phạm phòng cháy chữa cháy.",
    prompt: "Minimalist 2D line art, stickman gym owner in panic holding a fire safety violation sign as an enormous wave of stickmen crowd tries to squeeze into a tiny gym door, flat pastel yellow background, simple whiteboard explainer animation style, vector art, no shading, clean lines.",
    bgColor: "#FEF9E7",
    svgElements: `
      <!-- Big Contrast numbers -->
      <g transform="translate(240, 160)">
        <rect x="0" y="0" width="460" height="200" rx="16" fill="#FFFFFF" stroke="#232323" stroke-width="6" />
        <text x="230" y="70" font-family="sans-serif" font-weight="900" font-size="36" text-anchor="middle" fill="#7F8C8D">HỘI VIÊN ĐĂNG KÝ</text>
        <text x="230" y="150" font-family="sans-serif" font-weight="900" font-size="72" text-anchor="middle" fill="#2980B9">7.000+</text>
      </g>

      <text x="820" y="280" font-family="sans-serif" font-weight="900" font-size="80" text-anchor="middle" fill="#E74C3C">VS</text>

      <g transform="translate(940, 160)">
        <rect x="0" y="0" width="460" height="200" rx="16" fill="#FFFFFF" stroke="#232323" stroke-width="6" />
        <text x="230" y="70" font-family="sans-serif" font-weight="900" font-size="36" text-anchor="middle" fill="#7F8C8D">SỨC CHỨA TỐI ĐA</text>
        <text x="230" y="150" font-family="sans-serif" font-weight="900" font-size="72" text-anchor="middle" fill="#E74C3C">200 - 300</text>
      </g>

      <!-- Tiny Door with huge crowd bottleneck -->
      <g transform="translate(960, 480)">
        <!-- Gym Door -->
        <rect x="200" y="60" width="160" height="360" fill="#E8EEF5" stroke="#232323" stroke-width="8" />
        <text x="280" y="220" font-family="sans-serif" font-weight="900" font-size="30" text-anchor="middle" fill="#C0392B">CỬA VÀO</text>
        
        <!-- Fire safety sign -->
        <rect x="420" y="80" width="280" height="150" rx="12" fill="#E74C3C" stroke="#232323" stroke-width="6" />
        <text x="560" y="140" font-family="sans-serif" font-weight="900" font-size="30" text-anchor="middle" fill="#FFFFFF">VI PHẠM PCCC!</text>
        <text x="560" y="180" font-family="sans-serif" font-weight="800" font-size="22" text-anchor="middle" fill="#FFFFFF">QUÁ TẢI SỨC CHỨA</text>
      </g>

      <!-- Panicked Owner Stickman -->
      <g transform="translate(180, 440)">
        <circle cx="100" cy="100" r="65" fill="#FFFFFF" stroke="#232323" stroke-width="8" />
        <circle cx="80" cy="85" r="14" fill="#FFFFFF" stroke="#232323" stroke-width="4" />
        <circle cx="80" cy="85" r="5" fill="#232323" />
        <circle cx="125" cy="85" r="14" fill="#FFFFFF" stroke="#232323" stroke-width="4" />
        <circle cx="125" cy="85" r="5" fill="#232323" />
        <ellipse cx="100" cy="130" rx="20" ry="15" fill="#C0392B" />
        <text x="40" y="50" font-size="38">😱</text>
        <!-- Body -->
        <line x1="100" y1="165" x2="100" y2="340" stroke="#232323" stroke-width="9" />
        <path d="M 100 220 L 20 180 L 10 130" fill="none" stroke="#232323" stroke-width="8" stroke-linecap="round" />
        <path d="M 100 220 L 180 180 L 210 140" fill="none" stroke="#232323" stroke-width="8" stroke-linecap="round" />
        <line x1="100" y1="340" x2="60" y2="520" stroke="#232323" stroke-width="9" />
        <line x1="100" y1="340" x2="150" y2="520" stroke="#232323" stroke-width="9" />
      </g>

      <!-- Huge crowd line trying to enter -->
      ${[450, 520, 590, 670, 750, 830, 910].map((x, i) => `
        <g transform="translate(${x}, ${620 + (i % 2) * 40})">
          <circle cx="20" cy="20" r="18" fill="#232323" />
          <line x1="20" y1="38" x2="20" y2="100" stroke="#232323" stroke-width="5" />
          <line x1="20" y1="100" x2="${30 + (i % 2) * 10}" y2="160" stroke="#232323" stroke-width="5" />
          <line x1="20" y1="100" x2="${10 - (i % 2) * 10}" y2="160" stroke="#232323" stroke-width="5" />
        </g>
      `).join('')}
    `
  },
  {
    id: 8,
    title: "Cú Lừa Tháng Một",
    text: "Cú lừa tháng Một: 12% hội viên đăng ký ồ ạt đầu năm, nhưng 80% sẽ bỏ cuộc trước mùa hè; chủ phòng gym tiêu hết tiền sớm sẽ đối mặt thảm họa cạn vốn.",
    prompt: "Minimalist 2D line art, stickman character running excitedly into gym in January then lying exhausted on ground by summer while money calendar flips, flat pastel sky blue background, simple whiteboard explainer animation style, vector art, no shading, clean lines.",
    bgColor: "#E8F4F8",
    svgElements: `
      <!-- January vs Summer Timeline Curve -->
      <path d="M 200 480 Q 550 180 900 350 T 1650 780" fill="none" stroke="#E74C3C" stroke-width="12" stroke-linecap="round" />
      
      <!-- January Peak -->
      <g transform="translate(460, 160)">
        <rect x="0" y="0" width="300" height="150" rx="16" fill="#FFFFFF" stroke="#232323" stroke-width="6" />
        <text x="150" y="50" font-family="sans-serif" font-weight="900" font-size="32" text-anchor="middle" fill="#27AE60">THÁNG 1: ĐỈNH</text>
        <text x="150" y="90" font-family="sans-serif" font-weight="800" font-size="24" text-anchor="middle">12% Đăng ký cả năm</text>
        <text x="150" y="125" font-family="sans-serif" font-weight="700" font-size="20" text-anchor="middle" fill="#7F8C8D">"Quyết tâm năm mới!"</text>
      </g>

      <!-- Excited stickman jumping -->
      <g transform="translate(380, 360)">
        <circle cx="50" cy="50" r="35" fill="#FFFFFF" stroke="#232323" stroke-width="6" />
        <circle cx="40" cy="45" r="5" fill="#232323" />
        <circle cx="65" cy="45" r="5" fill="#232323" />
        <path d="M 40 65 Q 52 80 65 65" fill="none" stroke="#232323" stroke-width="4" />
        <line x1="50" y1="85" x2="50" y2="180" stroke="#232323" stroke-width="7" />
        <line x1="50" y1="110" x2="0" y2="60" stroke="#232323" stroke-width="6" />
        <line x1="50" y1="110" x2="100" y2="60" stroke="#232323" stroke-width="6" />
        <line x1="50" y1="180" x2="10" y2="250" stroke="#232323" stroke-width="7" />
        <line x1="50" y1="180" x2="90" y2="250" stroke="#232323" stroke-width="7" />
      </g>

      <!-- Drop to Summer -->
      <g transform="translate(1300, 480)">
        <rect x="0" y="0" width="340" height="150" rx="16" fill="#FFFFFF" stroke="#232323" stroke-width="6" />
        <text x="170" y="50" font-family="sans-serif" font-weight="900" font-size="32" text-anchor="middle" fill="#C0392B">MÙA HÈ: BỎ TẬP</text>
        <text x="170" y="90" font-family="sans-serif" font-weight="800" font-size="26" text-anchor="middle" fill="#E74C3C">80% Đã bỏ cuộc!</text>
        <text x="170" y="125" font-family="sans-serif" font-weight="700" font-size="20" text-anchor="middle" fill="#7F8C8D">Tháng 2 rụng nhiều nhất</text>
      </g>

      <!-- Exhausted Stickman flat on ground -->
      <g transform="translate(1200, 780)">
        <line x1="0" y1="50" x2="360" y2="50" stroke="#BDC3C7" stroke-width="4" />
        <!-- Head on ground -->
        <circle cx="100" cy="20" r="30" fill="#FFFFFF" stroke="#232323" stroke-width="6" />
        <text x="100" y="15" font-size="20" text-anchor="middle">x x</text>
        <!-- Flat body -->
        <line x1="130" y1="30" x2="260" y2="35" stroke="#232323" stroke-width="7" />
        <line x1="260" y1="35" x2="310" y2="45" stroke="#232323" stroke-width="7" />
        <line x1="180" y1="32" x2="160" y2="45" stroke="#232323" stroke-width="6" />
        <text x="200" y="0" font-size="28">💤</text>
      </g>
    `
  },
  {
    id: 9,
    title: "Nhượng Quyền Hay Tự Mở?",
    text: "Nhượng quyền mang lại thương hiệu nhưng bạn phải nộp 5 đến 10% doanh thu mỗi tháng vĩnh viễn, còn tự mở độc lập thì phải tự bơi từ con số không.",
    prompt: "Minimalist 2D line art, stickman character looking worried pointing at a pie chart with 5-10 percent monthly royalty cut going to corporate franchise, flat pastel warm cream background, simple whiteboard explainer animation style, vector art, no shading, clean lines.",
    bgColor: "#F9F6ED",
    svgElements: `
      <!-- Title text like reference image 2 -->
      <text x="960" y="150" font-family="'Comic Sans MS', cursive, sans-serif" font-weight="900" font-size="90" text-anchor="middle" fill="#C0392B" stroke="#232323" stroke-width="4" letter-spacing="8">ROYALTY</text>

      <!-- Pie Chart Center (Matching reference image 2) -->
      <g transform="translate(960, 520)">
        <!-- Main Blue Pie (90-95%) -->
        <circle cx="0" cy="0" r="280" fill="#63A7D6" stroke="#232323" stroke-width="10" />
        
        <!-- Red Slice (5-10% Franchise cut) -->
        <path d="M 0 0 L 0 -280 A 280 280 0 0 1 180 -214 Z" fill="#E65A4F" stroke="#232323" stroke-width="8" />
        
        <!-- Label on red slice -->
        <text x="80" y="-140" font-family="sans-serif" font-weight="900" font-size="44" fill="#FFFFFF">5-10%</text>

        <!-- Every Month Calendar Note -->
        <g transform="translate(100, -50)">
          <rect x="0" y="0" width="180" height="120" rx="10" fill="#FFFFFF" stroke="#232323" stroke-width="6" />
          <line x1="0" y1="30" x2="180" y2="30" stroke="#E74C3C" stroke-width="4" />
          <circle cx="45" cy="15" r="5" fill="#232323" />
          <circle cx="135" cy="15" r="5" fill="#232323" />
          <text x="90" y="65" font-family="sans-serif" font-weight="900" font-size="24" text-anchor="middle">EVERY</text>
          <text x="90" y="98" font-family="sans-serif" font-weight="900" font-size="24" text-anchor="middle">MONTH</text>
        </g>
      </g>

      <!-- Worried Stickman pointing at pie chart (Matching reference image 2) -->
      <g transform="translate(1380, 360)">
        <circle cx="100" cy="100" r="60" fill="#FFFFFF" stroke="#232323" stroke-width="8" />
        <!-- Worried expression -->
        <ellipse cx="85" cy="90" rx="6" ry="8" fill="#232323" />
        <ellipse cx="120" cy="90" rx="6" ry="8" fill="#232323" />
        <path d="M 85 130 Q 105 115 125 130" fill="none" stroke="#232323" stroke-width="5" />
        <!-- Sweat -->
        <path d="M 145 65 Q 155 75 150 85 Q 140 85 145 65 Z" fill="#3498DB" stroke="#232323" stroke-width="2" />
        <!-- T-shirt body -->
        <path d="M 70 170 L 130 170 L 140 270 L 60 270 Z" fill="#C5D9E8" stroke="#232323" stroke-width="7" />
        <!-- Pointing arm -->
        <path d="M 70 190 L -80 150 L -120 130" fill="none" stroke="#232323" stroke-width="8" stroke-linecap="round" />
        <line x1="130" y1="190" x2="160" y2="280" stroke="#232323" stroke-width="7" />
        <!-- Legs -->
        <line x1="85" y1="270" x2="80" y2="440" stroke="#232323" stroke-width="8" />
        <line x1="115" y1="270" x2="125" y2="440" stroke="#232323" stroke-width="8" />
      </g>
    `
  },
  {
    id: 10,
    title: "Rào Cản Hủy Gói Tinh Quái",
    text: "Rào cản hủy hợp đồng tinh quái: Bắt làm đơn trực tiếp, gửi thư bảo đảm và lợi dụng tâm lý trì hoãn 'tháng sau mình sẽ đi tập lại' để tiếp tục trừ tiền đều đặn.",
    prompt: "Minimalist 2D line art, stickman character frustrated facing a gym door locked with multiple heavy padlocks and paperwork labeled cancellation forms, flat pastel light grey background, simple whiteboard explainer animation style, vector art, no shading, clean lines.",
    bgColor: "#ECEEF0",
    svgElements: `
      <!-- NOT EASY header (Matching reference image 3) -->
      <g transform="translate(680, 80)">
        <rect x="0" y="0" width="560" height="120" rx="8" fill="#FFFFFF" stroke="#232323" stroke-width="7" />
        <text x="280" y="85" font-family="sans-serif" font-weight="900" font-size="78" text-anchor="middle" fill="#232323" letter-spacing="8">NOT EASY</text>
      </g>
      <!-- Crossed out EASY -->
      <text x="320" y="160" font-family="'Comic Sans MS', cursive, sans-serif" font-weight="900" font-size="70" fill="#E74C3C">EASY</text>
      <line x1="280" y1="190" x2="520" y2="90" stroke="#E74C3C" stroke-width="10" />

      <!-- Heavy Door with Dozens of Locks & Forms (Matching reference image 3) -->
      <g transform="translate(980, 260)">
        <rect x="0" y="0" width="460" height="740" fill="#BDC3C7" stroke="#232323" stroke-width="9" />
        <rect x="180" y="120" width="100" height="180" fill="#95A5A6" stroke="#232323" stroke-width="6" />
        
        <!-- Multiple Padlocks & Deadbolts -->
        <rect x="60" y="340" width="120" height="40" rx="6" fill="#7F8C8D" stroke="#232323" stroke-width="6" />
        <rect x="280" y="340" width="120" height="40" rx="6" fill="#7F8C8D" stroke="#232323" stroke-width="6" />
        <rect x="190" y="440" width="80" height="60" rx="8" fill="#F1C40F" stroke="#232323" stroke-width="6" />
        <circle cx="230" cy="420" r="24" fill="none" stroke="#232323" stroke-width="6" />

        <!-- Taped Forms on door -->
        <rect x="300" y="120" width="110" height="130" fill="#FFFFFF" stroke="#232323" stroke-width="4" transform="rotate(8, 300, 120)" />
        <text x="350" y="160" font-family="sans-serif" font-weight="900" font-size="18" text-anchor="middle">FORMS</text>
        <line x1="320" y1="180" x2="380" y2="180" stroke="#7F8C8D" stroke-width="3" />
        <line x1="320" y1="200" x2="380" y2="200" stroke="#7F8C8D" stroke-width="3" />

        <rect x="60" y="460" width="110" height="120" fill="#FFFFFF" stroke="#232323" stroke-width="4" />
        <text x="115" y="495" font-family="sans-serif" font-weight="900" font-size="16" text-anchor="middle">RULES</text>
        <text x="115" y="525" font-family="sans-serif" font-weight="700" font-size="14" text-anchor="middle">30 Days</text>
      </g>

      <!-- Helpless Stickman (Matching reference image 3) -->
      <g transform="translate(560, 360)">
        <circle cx="100" cy="100" r="70" fill="#FFFFFF" stroke="#232323" stroke-width="8" />
        <!-- Shocked eyes and straight mouth -->
        <circle cx="75" cy="85" r="16" fill="#FFFFFF" stroke="#232323" stroke-width="5" />
        <circle cx="75" cy="85" r="5" fill="#232323" />
        <circle cx="125" cy="85" r="16" fill="#FFFFFF" stroke="#232323" stroke-width="5" />
        <circle cx="125" cy="85" r="5" fill="#232323" />
        <line x1="75" y1="135" x2="125" y2="135" stroke="#232323" stroke-width="6" />
        <!-- Sweat marks -->
        <line x1="25" y1="70" x2="40" y2="85" stroke="#232323" stroke-width="4" />
        <line x1="20" y1="95" x2="35" y2="105" stroke="#232323" stroke-width="4" />
        <!-- Blue Shirt -->
        <path d="M 65 170 L 135 170 L 145 320 L 55 320 Z" fill="#2980B9" stroke="#232323" stroke-width="7" />
        <!-- Raised hands in despair -->
        <path d="M 65 200 L 10 160 L 25 100" fill="none" stroke="#232323" stroke-width="8" stroke-linecap="round" />
        <path d="M 135 200 L 220 160 L 240 100" fill="none" stroke="#232323" stroke-width="8" stroke-linecap="round" />
        <!-- Legs -->
        <line x1="75" y1="320" x2="70" y2="520" stroke="#232323" stroke-width="9" />
        <line x1="125" y1="320" x2="130" y2="520" stroke="#232323" stroke-width="9" />
      </g>
    `
  },
  {
    id: 11,
    title: "Các Chi Phí Ẩn Bào Mòn",
    text: "Các chi phí ẩn bào mòn túi tiền: Bản quyền âm nhạc công cộng lên tới hàng ngàn USD, tiền điện chạy máy lạnh 24/7 và chi phí bảo trì thay cáp liên tục.",
    prompt: "Minimalist 2D line art, stickman character juggling music copyright fine warning, huge electric power bills, and broken treadmill cables, flat pastel light rose background, simple whiteboard explainer animation style, vector art, no shading, clean lines.",
    bgColor: "#FDF2F4",
    svgElements: `
      <!-- Title -->
      <text x="960" y="120" font-family="sans-serif" font-weight="900" font-size="52" text-anchor="middle" fill="#C0392B">CHI PHÍ ẨN: CẠN VỐN KHÔNG KỊP TRỞ TAY</text>

      <!-- 3 Hidden costs boxes -->
      <!-- 1: Music License -->
      <g transform="translate(180, 220)">
        <rect x="0" y="0" width="460" height="420" rx="16" fill="#FFFFFF" stroke="#232323" stroke-width="6" />
        <text x="230" y="60" font-family="sans-serif" font-weight="900" font-size="30" text-anchor="middle">BẢN QUYỀN ÂM NHẠC</text>
        <text x="230" y="105" font-family="sans-serif" font-weight="700" font-size="22" fill="#7F8C8D" text-anchor="middle">ASCAP, BMI, SESAC...</text>
        <text x="230" y="210" font-size="70" text-anchor="middle">🎵</text>
        <text x="230" y="320" font-family="sans-serif" font-weight="900" font-size="34" fill="#E74C3C" text-anchor="middle">$1.300 - $4.000/NĂM</text>
        <text x="230" y="370" font-family="sans-serif" font-weight="700" font-size="20" fill="#78281F" text-anchor="middle">Phạt tới $150.000 nếu vi phạm!</text>
      </g>

      <!-- 2: Electricity & Water -->
      <g transform="translate(730, 220)">
        <rect x="0" y="0" width="460" height="420" rx="16" fill="#FFFFFF" stroke="#232323" stroke-width="6" />
        <text x="230" y="60" font-family="sans-serif" font-weight="900" font-size="30" text-anchor="middle">ĐIỆN, NƯỚC, TIỆN ÍCH</text>
        <text x="230" y="105" font-family="sans-serif" font-weight="700" font-size="22" fill="#7F8C8D" text-anchor="middle">Điều hòa &amp; nước nóng 24/7</text>
        <text x="230" y="210" font-size="70" text-anchor="middle">⚡</text>
        <text x="230" y="320" font-family="sans-serif" font-weight="900" font-size="34" fill="#E74C3C" text-anchor="middle">$1.000 - $6.000/THÁNG</text>
        <text x="230" y="370" font-family="sans-serif" font-weight="700" font-size="20" fill="#78281F" text-anchor="middle">Hóa đơn không bao giờ giảm</text>
      </g>

      <!-- 3: Maintenance -->
      <g transform="translate(1280, 220)">
        <rect x="0" y="0" width="460" height="420" rx="16" fill="#FFFFFF" stroke="#232323" stroke-width="6" />
        <text x="230" y="60" font-family="sans-serif" font-weight="900" font-size="30" text-anchor="middle">BẢO TRÌ &amp; THAY THẾ</text>
        <text x="230" y="105" font-family="sans-serif" font-weight="700" font-size="22" fill="#7F8C8D" text-anchor="middle">Đứt cáp, rách thảm, mòn đệm</text>
        <text x="230" y="210" font-size="70" text-anchor="middle">🔧</text>
        <text x="230" y="320" font-family="sans-serif" font-weight="900" font-size="34" fill="#E74C3C" text-anchor="middle">$1.000 - $3.000/THÁNG</text>
        <text x="230" y="370" font-family="sans-serif" font-weight="700" font-size="20" fill="#78281F" text-anchor="middle">Thiết bị hỏng hàng tuần</text>
      </g>

      <!-- Stickman Juggler at bottom -->
      <g transform="translate(960, 720)">
        <circle cx="0" cy="0" r="50" fill="#FFFFFF" stroke="#232323" stroke-width="7" />
        <line x1="0" y1="50" x2="0" y2="180" stroke="#232323" stroke-width="8" />
        <path d="M 0 90 L -120 40 L -140 -20" fill="none" stroke="#232323" stroke-width="7" stroke-linecap="round" />
        <path d="M 0 90 L 120 40 L 140 -20" fill="none" stroke="#232323" stroke-width="7" stroke-linecap="round" />
        <line x1="0" y1="180" x2="-60" y2="300" stroke="#232323" stroke-width="8" />
        <line x1="0" y1="180" x2="60" y2="300" stroke="#232323" stroke-width="8" />
      </g>
    `
  },
  {
    id: 12,
    title: "Bài Học Từ Các Vụ Phá Sản",
    text: "Bài học từ những vụ phá sản lớn như Bally hay 24 Hour Fitness: Sụp đổ không phải vì thiếu khách, mà do nợ xấu phình to và bán hàng chèo kéo ép khách vay nợ dài hạn.",
    prompt: "Minimalist 2D line art, stickman character standing before a crumbling gym empire building stamped Chapter 11 Bankruptcy under heavy weight of debt, flat pastel soft lavender background, simple whiteboard explainer animation style, vector art, no shading, clean lines.",
    bgColor: "#F4ECF7",
    svgElements: `
      <!-- Crumbling Gym Empire Building -->
      <g transform="translate(860, 320)">
        <polygon points="0,0 200,-80 400,0 400,500 0,500" fill="#D7BDE2" stroke="#232323" stroke-width="8" />
        <!-- Cracks -->
        <path d="M 120 180 L 170 260 L 140 340 L 220 450" fill="none" stroke="#232323" stroke-width="6" />
        <path d="M 280 120 L 240 220 L 310 320" fill="none" stroke="#232323" stroke-width="6" />
        
        <!-- Big Red Stamp CHAPTER 11 BANKRUPTCY -->
        <g transform="translate(200, 240) rotate(-15)">
          <rect x="-240" y="-55" width="480" height="110" rx="14" fill="#FFFFFF" stroke="#E74C3C" stroke-width="8" />
          <text x="0" y="5" font-family="sans-serif" font-weight="900" font-size="44" text-anchor="middle" fill="#C0392B">CHAPTER 11</text>
          <text x="0" y="42" font-family="sans-serif" font-weight="900" font-size="28" text-anchor="middle" fill="#E74C3C">PHÁ SẢN DO NỢ XẤU</text>
        </g>
      </g>

      <!-- Weight of Debt crushing down -->
      <g transform="translate(980, 140)">
        <polygon points="-160,0 160,0 120,90 -120,90" fill="#34495E" stroke="#232323" stroke-width="7" />
        <text x="0" y="60" font-family="sans-serif" font-weight="900" font-size="44" text-anchor="middle" fill="#FFFFFF">NỢ VAY CAO</text>
      </g>

      <!-- Sad Stickman Looking at Ruins -->
      <g transform="translate(360, 480)">
        <circle cx="80" cy="80" r="55" fill="#FFFFFF" stroke="#232323" stroke-width="8" />
        <ellipse cx="65" cy="70" rx="6" ry="8" fill="#232323" />
        <ellipse cx="95" cy="70" rx="6" ry="8" fill="#232323" />
        <path d="M 65 110 Q 80 95 95 110" fill="none" stroke="#232323" stroke-width="5" />
        <line x1="80" y1="135" x2="80" y2="300" stroke="#232323" stroke-width="8" />
        <line x1="80" y1="180" x2="20" y2="260" stroke="#232323" stroke-width="7" />
        <line x1="80" y1="180" x2="140" y2="260" stroke="#232323" stroke-width="7" />
        <line x1="80" y1="300" x2="40" y2="460" stroke="#232323" stroke-width="8" />
        <line x1="80" y1="300" x2="120" y2="460" stroke="#232323" stroke-width="8" />
      </g>
    `
  },
  {
    id: 13,
    title: "Đòn Bẩy PT Nhóm Nhỏ",
    text: "Đòn bẩy PT: Dạy 1-kèm-1 nhanh chóng chạm trần doanh thu, huấn luyện nhóm nhỏ 4 người mới là vũ khí tối ưu mặt bằng và nhân đôi lợi nhuận cho cơ sở.",
    prompt: "Minimalist 2D line art, stickman coach training a small group of 4 stickmen together happily with multiplier profit graph surging upwards, flat pastel mint green background, simple whiteboard explainer animation style, vector art, no shading, clean lines.",
    bgColor: "#E8F8F5",
    svgElements: `
      <!-- Comparison Table -->
      <!-- 1 on 1 PT -->
      <g transform="translate(180, 180)">
        <rect x="0" y="0" width="650" height="740" rx="20" fill="#FFFFFF" stroke="#232323" stroke-width="6" />
        <text x="325" y="70" font-family="sans-serif" font-weight="900" font-size="36" text-anchor="middle" fill="#7F8C8D">DẠY 1 - KÈM - 1</text>
        <line x1="60" y1="100" x2="590" y2="100" stroke="#BDC3C7" stroke-width="3" />
        
        <text x="325" y="180" font-family="sans-serif" font-weight="800" font-size="30" text-anchor="middle">Tối đa: 25 buổi/tuần</text>
        <text x="325" y="240" font-family="sans-serif" font-weight="900" font-size="46" text-anchor="middle" fill="#E67E22">$60 - $80 / giờ</text>
        
        <!-- Ceiling Barrier -->
        <rect x="100" y="320" width="450" height="70" rx="10" fill="#FDEDEC" stroke="#E74C3C" stroke-width="5" />
        <text x="325" y="365" font-family="sans-serif" font-weight="900" font-size="28" text-anchor="middle" fill="#C0392B">KỊCH TRẦN DOANH THU</text>
        <text x="325" y="460" font-family="sans-serif" font-weight="700" font-size="26" text-anchor="middle" fill="#7F8C8D">~ $100.000/năm/HLV</text>
      </g>

      <!-- Small Group PT (Semi-private) -->
      <g transform="translate(1090, 180)">
        <rect x="0" y="0" width="650" height="740" rx="20" fill="#EAFAF1" stroke="#27AE60" stroke-width="8" />
        <text x="325" y="70" font-family="sans-serif" font-weight="900" font-size="36" text-anchor="middle" fill="#1E8449">NHÓM NHỎ (4 NGƯỜI)</text>
        <line x1="60" y1="100" x2="590" y2="100" stroke="#27AE60" stroke-width="3" />

        <text x="325" y="180" font-family="sans-serif" font-weight="800" font-size="30" text-anchor="middle">1 HLV kèm 4 học viên</text>
        <text x="325" y="240" font-family="sans-serif" font-weight="900" font-size="52" text-anchor="middle" fill="#27AE60">$160 / GIỜ</text>
        <text x="325" y="290" font-family="sans-serif" font-weight="700" font-size="24" text-anchor="middle" fill="#27AE60">(Khách chỉ trả $40/người)</text>

        <!-- Multiplier badge -->
        <rect x="100" y="350" width="450" height="100" rx="14" fill="#27AE60" stroke="#232323" stroke-width="6" />
        <text x="325" y="415" font-family="sans-serif" font-weight="900" font-size="34" text-anchor="middle" fill="#FFFFFF">GẤP ĐÔI DOANH THU! 🚀</text>
        
        <!-- 4 happy trainees stickmen icons -->
        <g transform="translate(180, 520)">
          ${[0, 80, 160, 240].map((x) => `
            <circle cx="${x}" cy="40" r="22" fill="#FFFFFF" stroke="#232323" stroke-width="4" />
            <line x1="${x}" y1="62" x2="${x}" y2="110" stroke="#232323" stroke-width="5" />
            <line x1="${x}" y1="80" x2="${x-15}" y2="100" stroke="#232323" stroke-width="4" />
            <line x1="${x}" y1="80" x2="${x+15}" y2="100" stroke="#232323" stroke-width="4" />
          `).join('')}
        </g>
      </g>
    `
  },
  {
    id: 14,
    title: "Kết Luận Toàn Bộ Video",
    text: "Thành công trong kinh doanh phòng gym không nằm ở việc hút bao nhiêu người đăng ký ban đầu, mà phụ thuộc vào việc bạn sống sót tốt đến đâu dựa trên những người trả tiền nhưng không bao giờ đến tập.",
    prompt: "Minimalist 2D line art, stickman entrepreneur standing proudly with lightbulb idea pointing at recurring subscription revenue graph, flat pastel sunny cream background, simple whiteboard explainer animation style, vector art, no shading, clean lines.",
    bgColor: "#FEFDE8",
    svgElements: `
      <!-- Big Quote Banner -->
      <g transform="translate(260, 120)">
        <rect x="0" y="0" width="1400" height="260" rx="24" fill="#FFFFFF" stroke="#232323" stroke-width="8" />
        <text x="700" y="80" font-family="sans-serif" font-weight="900" font-size="38" text-anchor="middle" fill="#C0392B">KẾT LUẬN KINH TẾ HỌC PHÒNG GYM</text>
        <text x="700" y="145" font-family="sans-serif" font-weight="800" font-size="32" text-anchor="middle" fill="#232323">"Thành công không phụ thuộc bạn kéo được bao nhiêu người đăng ký ban đầu,"</text>
        <text x="700" y="205" font-family="sans-serif" font-weight="900" font-size="36" text-anchor="middle" fill="#27AE60">MÀ LÀ SỐNG SÓT NHỜ NGƯỜI TRẢ TIỀN NHƯNG KHÔNG BAO GIỜ ĐẾN TẬP!"</text>
      </g>

      <!-- Smiling Stickman with Lightbulb Idea -->
      <g transform="translate(480, 440)">
        <!-- Lightbulb above head -->
        <circle cx="100" cy="0" r="30" fill="#F1C40F" stroke="#232323" stroke-width="6" />
        <rect x="90" y="30" width="20" height="15" rx="3" fill="#7F8C8D" stroke="#232323" stroke-width="4" />
        <line x1="100" y1="-45" x2="100" y2="-60" stroke="#F1C40F" stroke-width="6" stroke-linecap="round" />
        <line x1="60" y1="-25" x2="45" y2="-40" stroke="#F1C40F" stroke-width="6" stroke-linecap="round" />
        <line x1="140" y1="-25" x2="155" y2="-40" stroke="#F1C40F" stroke-width="6" stroke-linecap="round" />

        <!-- Head -->
        <circle cx="100" cy="110" r="60" fill="#FFFFFF" stroke="#232323" stroke-width="8" />
        <circle cx="85" cy="100" r="7" fill="#232323" />
        <circle cx="120" cy="100" r="7" fill="#232323" />
        <path d="M 85 135 Q 105 160 125 135" fill="none" stroke="#232323" stroke-width="6" />
        <!-- Body with tie -->
        <line x1="100" y1="170" x2="100" y2="360" stroke="#232323" stroke-width="9" />
        <polygon points="100,180 92,230 100,250 108,230" fill="#E74C3C" stroke="#232323" stroke-width="4" />
        <!-- Arms thumbs up -->
        <path d="M 100 220 L 190 180 L 220 140" fill="none" stroke="#232323" stroke-width="8" stroke-linecap="round" />
        <text x="230" y="140" font-size="40">👍</text>
        <path d="M 100 220 L 20 260 L -10 320" fill="none" stroke="#232323" stroke-width="8" stroke-linecap="round" />
        <!-- Legs -->
        <line x1="100" y1="360" x2="50" y2="540" stroke="#232323" stroke-width="9" />
        <line x1="100" y1="360" x2="160" y2="540" stroke="#232323" stroke-width="9" />
      </g>

      <!-- Upward Growing Revenue Chart -->
      <g transform="translate(1020, 460)">
        <rect x="0" y="0" width="580" height="460" rx="20" fill="#FFFFFF" stroke="#232323" stroke-width="7" />
        <text x="290" y="60" font-family="sans-serif" font-weight="900" font-size="28" text-anchor="middle" fill="#232323">LỢI NHUẬN THUÊ BAO DÀI HẠN</text>
        <line x1="60" y1="380" x2="520" y2="380" stroke="#232323" stroke-width="5" />
        <line x1="60" y1="380" x2="60" y2="100" stroke="#232323" stroke-width="5" />
        
        <!-- Green Rising curve -->
        <path d="M 60 360 Q 240 330 380 220 T 500 120" fill="none" stroke="#27AE60" stroke-width="12" stroke-linecap="round" />
        <polygon points="500,105 525,120 505,140" fill="#27AE60" />
        <text x="440" y="100" font-family="sans-serif" font-weight="900" font-size="44" fill="#27AE60">+$$$</text>
      </g>
    `
  }
];

console.log(`[BƯỚC 1]: Đã phân tích kịch bản và chia xong ${scenesData.length} cảnh hoàn chỉnh.`);

// Helper function to render SVG to PNG using sharp
async function generateSceneImage(scene) {
  const fullSvg = `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <!-- Background flat pastel -->
      <rect width="1920" height="1080" fill="${scene.bgColor}" />
      
      <!-- Subtle top subtle header bar -->
      <rect x="0" y="0" width="1920" height="60" fill="rgba(0,0,0,0.03)" />
      <text x="60" y="42" font-family="sans-serif" font-weight="800" font-size="24" fill="#666666">CẢNH ${scene.id} / ${scenesData.length} • ${scene.title.toUpperCase()}</text>
      <text x="1860" y="42" font-family="sans-serif" font-weight="700" font-size="22" text-anchor="end" fill="#888888">2D STICKMAN EXPLAINER</text>
      
      <!-- Main Scene Art Elements -->
      ${scene.svgElements}

      <!-- Bottom Subtitle Bar -->
      <rect x="120" y="960" width="1680" height="90" rx="16" fill="rgba(255, 255, 255, 0.95)" stroke="#232323" stroke-width="4" />
      <text x="960" y="1015" font-family="sans-serif" font-weight="700" font-size="26" text-anchor="middle" fill="#1A1A1A">
        ${scene.text.length > 110 ? scene.text.substring(0, 107) + '...' : scene.text}
      </text>
    </svg>
  `;

  const outputPath = path.join(IMAGES_DIR, `scene_${scene.id}.png`);
  await sharp(Buffer.from(fullSvg))
    .png({ quality: 95 })
    .toFile(outputPath);

  return `scene_${scene.id}.png`;
}

// Helper to generate audio and probe duration
async function generateSceneAudio(scene) {
  const audioFileName = `scene_${scene.id}.mp3`;
  const audioPath = path.join(AUDIO_DIR, audioFileName);

  // Generate audio via Google TTS
  const base64 = await googleTTS.getAudioBase64(scene.text, {
    lang: 'vi',
    slow: false,
    host: 'https://translate.google.com',
    timeout: 15000,
  });

  fs.writeFileSync(audioPath, Buffer.from(base64, 'base64'));

  // Use ffprobe to get precise duration
  const probeOutput = execSync(`ffprobe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`).toString().trim();
  const durationInSeconds = parseFloat(probeOutput) || 4.0;
  
  // Video standard is 30 FPS. Adding 15 frames padding (~0.5s) for natural pause between scenes
  const durationInFrames = Math.ceil(durationInSeconds * 30) + 15;

  return {
    audioFileName,
    durationInSeconds,
    durationInFrames
  };
}

async function runPipeline() {
  console.log("\n[BƯỚC 2 & 3]: Đang tạo Audio (TTS) và Hình ảnh 2D Stickman 16:9...");
  
  const finalizedScenes = [];
  let totalFrames = 0;

  for (let i = 0; i < scenesData.length; i++) {
    const scene = scenesData[i];
    process.stdout.write(`Đang xử lý cảnh ${scene.id}/${scenesData.length}: "${scene.title}"... `);

    // Generate Audio
    const { audioFileName, durationInSeconds, durationInFrames } = await generateSceneAudio(scene);
    
    // Generate Image (1920x1080)
    const imageFileName = await generateSceneImage(scene);

    const sceneRecord = {
      id: scene.id,
      title: scene.title,
      text: scene.text,
      prompt: scene.prompt,
      audio_file: audioFileName,
      image_file: imageFileName,
      duration_in_seconds: durationInSeconds,
      duration_in_frames: durationInFrames,
      start_frame: totalFrames
    };

    totalFrames += durationInFrames;
    finalizedScenes.push(sceneRecord);
    console.log(`✓ Xong (${durationInSeconds.toFixed(1)}s, ${durationInFrames} frames)`);
  }

  const outputData = {
    metadata: {
      title: "Bóc Trần Kinh Tế Học & Mô Hình Kinh Doanh Phòng Gym",
      subtitle: "The Economics of Opening a Gym",
      fps: 30,
      width: 1920,
      height: 1080,
      total_scenes: finalizedScenes.length,
      total_duration_in_frames: totalFrames,
      total_duration_in_seconds: (totalFrames / 30).toFixed(2),
      created_at: new Date().toISOString()
    },
    scenes: finalizedScenes
  };

  // Save scenes.json
  const scenesJsonPath = path.join(PUBLIC_DIR, 'scenes.json');
  fs.writeFileSync(scenesJsonPath, JSON.stringify(outputData, null, 2));
  console.log(`\n[BƯỚC 1 & 2 & 3 HOÀN TẤT]: Đã lưu dữ liệu vào ${scenesJsonPath}`);
  console.log(`Tổng thời lượng video: ${(totalFrames / 30).toFixed(1)} giây (${totalFrames} frames @ 30 FPS).`);

  // BƯỚC 4: THIẾT LẬP & RENDER VIDEO BẰNG REMOTION / FFMPEG
  console.log("\n[BƯỚC 4]: Đang render video cuối cùng (final-video.mp4)...");
  
  // Render each scene as a video clip
  const clipsListPath = path.join(PUBLIC_DIR, 'clips_list.txt');
  let clipsListContent = '';

  for (const sc of finalizedScenes) {
    const imgPath = path.join(IMAGES_DIR, sc.image_file);
    const audPath = path.join(AUDIO_DIR, sc.audio_file);
    const clipOut = path.join(PUBLIC_DIR, `clip_${sc.id}.mp4`);

    // Render clip: Still image looped for audio duration + 0.5s pause
    const cmd = `ffmpeg -y -loop 1 -t ${sc.duration_in_frames / 30} -i "${imgPath}" -i "${audPath}" -c:v libx264 -tune stillimage -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -af "apad=pad_dur=0.5" -shortest "${clipOut}"`;
    execSync(cmd, { stdio: 'ignore' });

    clipsListContent += `file '${clipOut}'\n`;
    process.stdout.write(`Rendered clip ${sc.id}... `);
  }

  fs.writeFileSync(clipsListPath, clipsListContent);

  // Concatenate all clips into final-video.mp4
  const finalVideoPath = path.join(PUBLIC_DIR, 'final-video.mp4');
  console.log("\nĐang ghép nối toàn bộ các cảnh thành final-video.mp4...");
  const concatCmd = `ffmpeg -y -f concat -safe 0 -i "${clipsListPath}" -c copy "${finalVideoPath}"`;
  execSync(concatCmd);

  console.log(`\n🎉 [HOÀN THÀNH XUẤT SẮC]: Video hoàn chỉnh đã được render tại ${finalVideoPath}!`);
}

runPipeline().catch(err => {
  console.error("Lỗi trong quá trình thực thi pipeline:", err);
  process.exit(1);
});
