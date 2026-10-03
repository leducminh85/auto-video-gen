# BẢN ĐẶC TẢ TOÀN DIỆN & MÃ NGUỒN HỆ THỐNG: 2D STICKMAN VIDEO STUDIO

> **Mục đích tài liệu**: Tài liệu này chứa toàn bộ kiến trúc, thuật toán, schema dữ liệu, prompt AI, công thức toán học và mã nguồn cốt lõi (Source Code) của hệ thống **Remix Stickman Video Studio**.  
> Bất kỳ AI hoặc kỹ sư phần mềm nào khi đọc tài liệu này đều có thể hiểu tường tận 100% cách từng thành phần của video được sinh ra, luồng thực thi dữ liệu, và có thể tái tạo hoặc mở rộng toàn bộ hệ thống mà không cần tham chiếu thêm file ngoài.

---

## MỤC LỤC

1. [Tổng Quan Kiến Trúc & Công Nghệ](#1-tổng-quan-kiến-trúc--công-nghệ)
2. [Hệ Thống Phân Loại & Kiểu Dữ Liệu (Data Schema & Types)](#2-hệ-thống-phân-loại--kiểu-dữ-liệu-data-schema--types)
3. [Luồng Thực Thi Tổng Thể (Execution Flow Architecture)](#3-luồng-thực-thi-tổng-thể-execution-flow-architecture)
4. [Tạo Audio & Đo Đạc Thời Lượng (TTS & ffprobe Engine)](#4-tạo-audio--đo-đạc-thời-lượng-tts--ffprobe-engine)
5. [Thuật Toán Phân Rã Nhịp Thị Giác (Visual Beat Segmentation)](#5-thuật-toán-phân-rã-nhịp-thị-giác-visual-beat-segmentation)
6. [Đạo Diễn Hình Ảnh AI & Bộ Lọc Chống Ảo Giác (Visual Planner & Validator)](#6-đạo-diễn-hình-ảnh-ai--bộ-lọc-chống-ảo-giác-visual-planner--validator)
7. [Thuật Toán & Mã Nguồn Sinh Đồ Họa Vector SVG 1080p](#7-thuật-toán--mã-nguồn-sinh-đồ-họa-vector-svg-1080p)
8. [Pipeline Render Video Headless (FFmpeg Zoompan & Concat)](#8-pipeline-render-video-headless-ffmpeg-zoompan--concat)
9. [Cầu Nối API Server (Vite Middleware Server Plugin)](#9-cầu-nối-api-server-vite-middleware-server-plugin)
10. [Lớp Render Remotion & Chuyển Động Động Lực Học (Remotion React Engine)](#10-lớp-render-remotion--chuyển-động-động-lực-học-remotion-react-engine)
11. [Giao Diện Web Studio & Cơ Chế Sửa Đổi Tương Tác](#11-giao-diện-web-studio--cơ-chế-sửa-đổi-tương-tác)
12. [Cấu Trúc File scenes.json Chuẩn Mẫu](#12-cấu-trúc-file-scenesjson-chuẩn-mẫu)

---

## 1. TỔNG QUAN KIẾN TRÚC & CÔNG NGHỆ

### 1.1 Mục tiêu sản phẩm
Hệ thống giải quyết bài toán: Chuyển một đoạn kịch bản chữ (tiếng Việt, phân cảnh hoặc văn bản tự do) thành một video dạng **Premium Hand-drawn Cartoon Explainer** hoàn chỉnh, chuẩn 1920x1080 @ 30fps. 
- Phong cách hình ảnh: **Detailed Hand-Drawn Economics Explainer** — nhân vật stickman đầu tròn trắng tối giản sống trong môi trường 3D/Isometric chi tiết có màu sắc earthy (gạch đỏ, nâu cafe, beige, xanh nhạt). Tương tự kênh YouTube về kinh tế học chất lượng cao.
- Tiêu chí cốt lõi: **Không có hình ảnh chết (No Stale Frames)**. Cứ mỗi 1.5s – 3.5s, màn hình bắt buộc phải có biến đổi thị giác (Visual Beat) khớp đúng với ý nghĩa ngữ âm mà người thuyết minh đang nói.
- Đa dạng thị giác: 5 Visual Methods xoay vòng — scenic_environment, character_interaction, diegetic_infographic, object_close_up, split_screen_comparison.
- **Diegetic Infographics**: Biểu đồ, số liệu, nhãn giá nằm trong không gian vật lý (trên bảng phấn, tường gạch, bảng hiệu) chứ không phải đồ thị chèn lên màn hình.

### 1.2 Công nghệ sử dụng
- **Ngôn ngữ**: TypeScript & JavaScript (Node.js CommonJS & ESM).
- **Video Framework**: Remotion 4.x (`@remotion/player`, `@remotion/bundler`, `@remotion/cli`).
- **Web App**: React 19, Vite 8, TailwindCSS 4, Lucide Icons.
- **Xử lý đồ họa & đa phương tiện**: 
  - **DALL-E 3 API** (OpenAI): Sinh ảnh hand-drawn chi tiết 1792x1024, resize bằng `sharp` ra 1920x1080.
  - `sharp`: Rasterize SVG (fallback) hoặc resize/crop ảnh DALL-E 3.
  - `ffmpeg` & `ffprobe`: Ghép nối video, tạo hiệu ứng Ken-Burns zoompan, pad âm thanh, concat demuxer.
  - `google-tts-api`: Tổng hợp giọng đọc tiếng Việt theo vùng miền.
- **Trí tuệ nhân tạo**: 
  - **Google Gemini Flash** (Art Director / Visual Planner): Lập kế hoạch phân cảnh, xuất `imageGenerationPrompt` chi tiết.
  - **OpenAI DALL-E 3** (Image Generator): Sinh ảnh hand-drawn từ prompt của Gemini.

---

## 2. HỆ THỐNG PHÂN LOẠI & KIỂU DỮ LIỆU (DATA SCHEMA & TYPES)

Toàn bộ hệ thống giao tiếp thông qua các interface chuẩn hóa được định nghĩa tại `src/types/scenes.ts`:

```typescript
// 1. Phân loại dạng thị giác
export type VisualType =
  | 'character'        // Nhân vật stickman hành động/cảm xúc
  | 'environment'      // Bối cảnh không gian thực tế
  | 'object'           // Đồ vật độc lập
  | 'diagram'          // Sơ đồ hệ thống, chu trình khép kín
  | 'numbers'          // Con số hero đếm tăng dần
  | 'comparison'       // So sánh chia đôi màn hình A vs B
  | 'chart'            // Biểu đồ tròn/donut, phần trăm
  | 'timeline'         // Dòng thời gian
  | 'process'          // Quy trình tiến trình ngang 3 bước
  | 'typography'       // Bài học triết lý, con dấu cam kết
  | 'object_metaphor'  // Ẩn dụ đồ vật trọng tâm (thẻ ngân hàng, bẫy chuột...)
  | 'icon_grid'        // Lưới icon số lượng lớn
  | 'before_after';    // Trước và sau

// 2. Chuyển động và góc máy
export type MotionPreset =
  | 'fade' | 'slide' | 'scale' | 'draw' | 'count' 
  | 'stagger' | 'move' | 'disappear' | 'highlight' | 'connect' | 'punch';

export type CameraPreset = 'static' | 'slow_push' | 'slow_pan' | 'punch_in';
export type TransitionType = 'cut' | 'fade' | 'push';
export type ShotType = 'wide' | 'medium' | 'close-up' | 'infographic' | 'diagram';

export type VisualMethod =
  | 'character_action'
  | 'object_metaphor'
  | 'infographic'
  | 'comparison'
  | 'process'
  | 'numbers'
  | 'diagram'
  | 'typography'
  | 'environment';

// 3. Kế hoạch thị giác chi tiết cho từng Beat
export interface VisualBeatPlan {
  meaning: string;            // Tóm tắt ý nghĩa ngữ nghĩa của nhịp thoại
  subject: string;            // Chủ thể trọng tâm
  action: string;             // Hành động minh họa trực quan
  objects: string[];          // Danh sách các vật thể (tối đa 4-5 vật thể)
  environment: string;        // Môi trường (vd: Clean studio)
  composition: string;        // Bố cục hình học (vd: Center hero, Split-screen)
  shotType: ShotType;         // Cự ly máy quay
  visualMethod: VisualMethod; // Phương thức thể hiện
  keyText: string;            // Từ khóa chắt lọc (1 - 3 từ uppercase)
  mustNotInclude: string[];   // Từ cấm để chống ảo giác AI (Anti-hallucination)
  transitionIntent: string;   // Ý định nối tiếp sang beat sau
}

// 4. Kết quả kiểm định chất lượng ngữ nghĩa
export interface ValidationResult {
  score: number;      // Thang điểm 0 - 100
  issues: string[];   // Các lỗi phát hiện
  regenerate: boolean;// Cờ kích hoạt tự động tái tạo
}

// 5. Cấu trúc 1 Visual Beat (Thời lượng 1.5s - 3.5s)
export interface VisualBeat {
  id: string;
  sub_index: number;
  title: string;
  prompt: string;
  image_file: string;
  svg_data?: string;
  duration_in_seconds: number;
  duration_in_frames: number;
  start_frame_offset: number; // Offset frame tương đối trong phân cảnh
  caption?: string;
  visual_type?: VisualType;
  main_text?: string;
  sub_text?: string;
  motion?: MotionPreset;
  plan?: VisualBeatPlan;
  validation?: ValidationResult;
}

// 6. Cấu trúc 1 Phân Cảnh (Scene)
export interface SceneData {
  id: number;
  scene_id?: string;
  title: string;
  text: string;
  narration?: string;
  prompt: string;
  audio_file: string;
  image_file: string;
  beats?: VisualBeat[];
  duration_in_seconds: number;
  duration_in_frames: number;
  start_frame: number;
  visual_type?: VisualType;
  visual_description?: string;
  subject?: string;
  environment?: string;
  objects?: string[];
  composition?: string;
  action?: string;
  main_text?: string;
  sub_text?: string;
  motion?: MotionPreset;
  camera?: CameraPreset;
  transition?: TransitionType;
  metric?: string | null;
  percentage?: string | null;
}

// 7. Metadata và toàn bộ gói sản xuất
export interface VideoMetadata {
  title: string;
  subtitle: string;
  fps: number;
  width: number;
  height: number;
  total_scenes: number;
  total_duration_in_frames: number;
  total_duration_in_seconds: string;
  created_at: string;
  voice?: string;
  speed?: number;
  max_image_duration_sec?: number;
}

export interface ProductionData {
  metadata: VideoMetadata;
  scenes: SceneData[];
}
```

---

## 3. LUỒNG THỰC THI TỔNG THỂ (EXECUTION FLOW ARCHITECTURE)

```
                            [User Text Input / Script]
                                        │
                                        ▼
             ┌──────────────────────────────────────────────────────┐
             │ BƯỚC 1: Storyboard Generator                         │
             │ - Parse câu cú thành các Scene                       │
             │ - Gán VisualType sơ bộ                               │
             │ - Áp dụng luật chống lặp (Rule #4: max char <= 35%)  │
             └──────────────────────────┬───────────────────────────┘
                                        │
                                        ▼
             ┌──────────────────────────────────────────────────────┐
             │ BƯỚC 2: Audio Synthesis & Timing                     │
             │ - Gọi Google TTS: Sinh scene_X.mp3                   │
             │ - ffprobe đo duration chuẩn xác                      │
             │ - Tính toán: frames = duration * 30 fps              │
             └──────────────────────────┬───────────────────────────┘
                                        │
                                        ▼
             ┌──────────────────────────────────────────────────────┐
             │ BƯỚC 3: Visual Beat Segmentation                     │
             │ - Ngắt mệnh đề theo dấu câu & liên từ tiếng Việt     │
             │ - Cắt lát mỗi cảnh thành 2 - 4 nhịp (1.5s - 3.5s)    │
             │ - Phân bổ frames & start_frame_offset                │
             └──────────────────────────┬───────────────────────────┘
                                        │
                                        ▼
             ┌──────────────────────────────────────────────────────┐
             │ BƯỚC 4: Visual Planner & Semantic Validator          │
             │ - Gọi Gemini Flash lập VisualBeatPlan (9 methods)    │
             │ - Fallback sang Local Rule-Based Planner             │
             │ - Validator chấm điểm (0-100), trừ điểm ảo giác      │
             │ - Tự động tái tạo nếu điểm < 80                      │
             └──────────────────────────┬───────────────────────────┘
                                        │
                                        ▼
             ┌──────────────────────────────────────────────────────┐
             │ BƯỚC 5: Vector SVG & PNG Rasterization               │
             │ - generateSemanticSvgForBeat: Tạo XML SVG 1920x1080  │
             │ - sharp(svgBuffer).png() -> scene_X_beat_Y.png       │
             └──────────────────────────┬───────────────────────────┘
                                        │
                                        ▼
             ┌──────────────────────────────────────────────────────┐
             │ BƯỚC 6: Micro-Motion Beat Clips (FFmpeg)             │
             │ - Zoompan Ken-Burns (z='min(zoom+0.0008,1.035)')     │
             │ - Xuất temp_scene_X/beat_Y.mp4                       │
             └──────────────────────────┬───────────────────────────┘
                                        │
                                        ▼
             ┌──────────────────────────────────────────────────────┐
             │ BƯỚC 7: Concat Beat Clips + Scene Audio              │
             │ - Ghép các beat clips với scene_X.mp3                │
             │ - Thêm pad duration 0.4s: apad=pad_dur=0.4           │
             │ - Xuất clip_X.mp4                                    │
             └──────────────────────────┬───────────────────────────┘
                                        │
                                        ▼
             ┌──────────────────────────────────────────────────────┐
             │ BƯỚC 8: Ghép Video Toàn Diện (Final Concat)          │
             │ - ffmpeg concat toàn bộ clip_X.mp4                   │
             │ - Tạo public/final-video.mp4                         │
             │ - Lưu scenes.json đồng bộ (public/ & src/data/)      │
             └──────────────────────────┬───────────────────────────┘
                                        │
                                        ▼
             ┌──────────────────────────────────────────────────────┐
             │ BƯỚC 9: Trình Chiếu Remotion Studio Player           │
             │ - App.tsx nạp dữ liệu scenes.json                    │
             │ - Remotion Player phát video mượt mà 60fps canvas    │
             │ - Người dùng có thể tua, chọn beat, sửa ảnh tức thì  │
             └──────────────────────────────────────────────────────┘
```

---

## 4. TẠO AUDIO & ĐO ĐẠC THỜI LƯỢNG (TTS & FFPROBE ENGINE)

### 4.1 Hàm sinh Audio & trích xuất thời lượng
Được triển khai trong `scripts/videoGenerator.cjs`:

```javascript
const googleTTS = require('google-tts-api');
const { execSync } = require('child_process');
const fs = require('fs');

async function generateTTSAudio(text, outputPath, voice = 'vi-VN-Standard-A', speed = 1.0) {
  // 1. Phân giải tốc độ cho Google TTS API (chỉ nhận boolean slow hoặc chuẩn)
  const isSlow = speed < 0.85;

  // 2. Lấy Base64 audio từ Google Translate TTS Engine
  const base64Audio = await googleTTS.getAudioBase64(text, {
    lang: 'vi',
    slow: isSlow,
    host: 'https://translate.google.com',
    timeout: 20000,
  });

  const rawBuffer = Buffer.from(base64Audio, 'base64');
  const tempPath = outputPath.replace('.mp3', '_raw.mp3');
  fs.writeFileSync(tempPath, rawBuffer);

  // 3. Xử lý tốc độ phát bằng bộ lọc atempo của FFmpeg (nếu speed != 1.0)
  if (Math.abs(speed - 1.0) > 0.05 && speed >= 0.5 && speed <= 2.0) {
    execSync(
      `/opt/homebrew/bin/ffmpeg -y -i "${tempPath}" -filter:a "atempo=${speed}" -vn "${outputPath}"`,
      { stdio: 'ignore' }
    );
    try { fs.unlinkSync(tempPath); } catch (_) {}
  } else {
    fs.renameSync(tempPath, outputPath);
  }

  // 4. Trích xuất thời lượng chính xác bằng ffprobe
  const probeOutput = execSync(
    `/opt/homebrew/bin/ffprobe -i "${outputPath}" -show_entries format=duration -v quiet -of csv="p=0"`
  ).toString().trim();

  const durationInSeconds = parseFloat(probeOutput) || 4.0;
  return durationInSeconds;
}
```

### 4.2 Công thức chuyển đổi sang khung hình (Frames)
```javascript
// Chuẩn video của dự án là 30 FPS
const durationInFrames = Math.round(durationInSeconds * 30);
```

---

## 5. THUẬT TOÁN PHÂN RÃ NHỊP THỊ GIÁC (VISUAL BEAT SEGMENTATION)

Nằm trong `scripts/visualBeatPlanner.cjs`. Thuật toán này biến lời thuyết minh thành từng nhịp hình ảnh 1.5s – 3.5s.

```javascript
function segmentSceneIntoBeats(scene, durationInSeconds, totalFrames) {
  const text = (scene.text || scene.narration || '').trim();

  // 1. Xác định số lượng Beat mục tiêu theo thời lượng
  let targetBeatCount = 2;
  if (durationInSeconds <= 3.8) {
    targetBeatCount = 2;
  } else if (durationInSeconds <= 7.0) {
    targetBeatCount = 3;
  } else {
    targetBeatCount = 4;
  }

  // 2. Bảo vệ các số thập phân có dấu chấm/phẩy (ví dụ: 50.000, 2.5%) không bị tách nhầm
  const masked = text.replace(/(\d)[.,](\d)/g, '$1___NUMSEP___$2');

  // 3. Tách theo ranh giới ngữ pháp: Dấu ngắt câu + Liên từ đối lập tiếng Việt
  const rawClauses = masked
    .split(/(?<=[.!?;\n])\s+|(?<=[,])\s+|\s+(?:khiến chúng ta|thay vì|nhưng|mặc dù|trong khi|bởi vì|dẫn đến|để rồi|ngược lại)\s+/i)
    .map((s) => s.replace(/___NUMSEP___/g, '.').trim())
    .filter((s) => s.length > 5);

  let parts = [];

  if (rawClauses.length >= targetBeatCount) {
    const chunkSize = Math.ceil(rawClauses.length / targetBeatCount);
    for (let i = 0; i < rawClauses.length; i += chunkSize) {
      parts.push(rawClauses.slice(i, i + chunkSize).join(' '));
    }
  } else if (rawClauses.length > 1) {
    parts = rawClauses;
  } else {
    // Nếu là 1 câu đơn dài, tách đều theo số lượng từ
    const words = text.split(/\s+/);
    if (words.length <= 10 || targetBeatCount === 1) {
      parts = [text];
    } else {
      const wordsPerBeat = Math.ceil(words.length / targetBeatCount);
      for (let i = 0; i < words.length; i += wordsPerBeat) {
        parts.push(words.slice(i, i + wordsPerBeat).join(' '));
      }
    }
  }

  // 4. Pass kiểm tra thứ 2: Nếu bất kỳ beat nào vượt quá 3.8s, tiếp tục chia đôi
  let refinedParts = [];
  const wordsTotal = parts.reduce((acc, p) => acc + p.split(/\s+/).length, 0) || 1;
  for (const part of parts) {
    const wordCount = part.split(/\s+/).length;
    const estSec = (wordCount / wordsTotal) * durationInSeconds;
    if (estSec > 3.8 && wordCount >= 7) {
      const w = part.split(/\s+/);
      const half = Math.ceil(w.length / 2);
      refinedParts.push(w.slice(0, half).join(' '));
      refinedParts.push(w.slice(half).join(' '));
    } else {
      refinedParts.push(part);
    }
  }

  // 5. Phân bổ frames và start_frame_offset chính xác
  const finalTotalWords = refinedParts.reduce((acc, p) => acc + p.split(/\s+/).length, 0) || 1;
  let allocatedFrames = 0;

  return refinedParts.map((part, idx) => {
    const isLast = idx === refinedParts.length - 1;
    const wordsCount = part.split(/\s+/).length;
    let frames = Math.round(totalFrames * (wordsCount / finalTotalWords));

    if (isLast) {
      frames = totalFrames - allocatedFrames;
    }
    const startOffset = allocatedFrames;
    allocatedFrames += frames;
    const durSec = Number((frames / 30).toFixed(2));

    return {
      id: `scene_${scene.id}_beat_${idx + 1}`,
      sub_index: idx + 1,
      title: `${scene.title} - Beat ${idx + 1}`,
      text: part,
      caption: part,
      duration_in_seconds: durSec,
      duration_in_frames: frames,
      start_frame_offset: startOffset,
    };
  });
}
```

---

## 6. ĐẠO DIỄN HÌNH ẢNH AI & BỘ LỌC CHỐNG ẢO GIÁC (VISUAL PLANNER & VALIDATOR)

### 6.1 Prompt Đạo Diễn Hình Ảnh Gửi Gemini Flash
Prompt được thiết kế nghiêm ngặt để ép Gemini trả về JSON đúng cấu trúc và cấm sinh các vật thể vô lý:

```text
You are an elite Visual Director for animated 2D explainer videos (like Vox, Kurzgesagt, Casually Explained).
Scene Title: "${scene.title}"
Full Scene Narration: "${scene.text}"

Segmented Visual Beats:
${beatsSummary}

Previous scene/beat visual method was: "${previousMethod || 'none'}"

YOUR MISSION:
Create a precise, semantic VisualBeatPlan for EACH of the ${beats.length} beats.
The visual must clearly explain the narration EVEN IF THE AUDIO IS MUTED.

CRITICAL ART DIRECTION & ANTI-HALLUCINATION RULES:
1. NO RANDOM OBJECTS: NEVER include beer, bars, gym, buildings, storefronts, calendars, or cars unless the narration explicitly talks about them!
2. High semantic relevance: every object must directly visualize the specific thought in that beat.
3. 1 Clear Focal Point > scattered decorative items.
4. Minimalist text: "keyText" must be 1 to 3 punchy words (or number) in Vietnamese, e.g. "DOPAMINE", "BẤM MUA", "VÍ RỖNG", "LÃI KÉP", "SO SÁNH", "80%".
5. Visual Diversity: Alternate visualMethod between beats!
   Valid visualMethod choices:
   - 'character_action': character doing a specific action/emotion (clicking phone, holding wallet, eureka, stress)
   - 'object_metaphor': central high-impact metaphor (smartphone checkout, dopamine spark, piggy bank, balance scale)
   - 'numbers': hero metric stat or counter
   - 'comparison': split-screen Left vs Right with VS badge
   - 'process': 3-step sequential horizontal progress
   - 'diagram': flow loop or system diagram
   - 'infographic': data breakdown or proportion
   - 'typography': punchy core lesson / quote badge

Return ONLY a JSON array with exactly ${beats.length} items matching this schema:
[
  {
    "meaning": "Vietnamese summary of the beat",
    "subject": "Main subject (e.g. nhân vật stickman / smartphone)",
    "action": "Specific visual action",
    "objects": ["object1", "object2"],
    "environment": "clean minimalist studio",
    "composition": "e.g. center hero / split screen / left-right",
    "shotType": "wide | medium | close-up | infographic | diagram",
    "visualMethod": "character_action | object_metaphor | numbers | comparison | process | diagram | infographic | typography",
    "keyText": "1-3 uppercase words",
    "mustNotInclude": ["beer", "gym", "building", "random items"],
    "transitionIntent": "How this connects to the next beat"
  }
]
```

### 6.2 Bộ Kiểm Định Ngữ Nghĩa (Semantic Validator)
Đảm bảo chất lượng trước khi vẽ hình ảnh:

```javascript
function validateVisualBeat({ beatText, plan }) {
  const issues = [];
  let score = 100;

  const lowerText = (beatText || '').toLowerCase();
  const lowerObjects = (plan.objects || []).map((o) => o.toLowerCase());
  const lowerKeyText = (plan.keyText || '').toLowerCase();

  // 1. Quét từ cấm / Hallucination ảo giác
  const bannedKeywords = ['beer', 'bia', 'gym', 'tạ', 'quán bia', 'bar counter', 'két bia', 'fermentation'];
  for (const banned of bannedKeywords) {
    if (!lowerText.includes(banned)) {
      if (lowerObjects.some((o) => o.includes(banned)) || lowerKeyText.includes(banned)) {
        issues.push(`Phát hiện object hallucination không liên quan: "${banned}"`);
        score -= 30;
      }
    }
  }

  // 2. Kiểm tra độ dài keyText (tối đa 4 từ)
  const keyWords = (plan.keyText || '').trim().split(/\s+/);
  if (keyWords.length > 4) {
    issues.push(`KeyText quá dài (${keyWords.length} từ). Phải rút ngắn thành 1-3 từ.`);
    score -= 15;
  }

  // 3. Kiểm tra tính toàn vẹn số liệu
  const numberInText = beatText.match(/(\d+(?:[.,]\d+)?\s*%|\d+(?:[.,]\d+)?\s*(?:triệu|tỷ|usd|đô|\$))/i);
  if (numberInText) {
    const rawNum = numberInText[0].replace(/\s+/g, '');
    const hasNumInPlan = plan.keyText.includes(rawNum) || plan.objects.some((o) => o.includes(rawNum));
    if (!hasNumInPlan && plan.visualMethod !== 'numbers') {
      issues.push(`Đoạn thoại chứa số liệu quan trọng "${rawNum}" nhưng kế hoạch hình ảnh chưa làm nổi bật.`);
      score -= 15;
    }
  }

  // 4. Kiểm tra số lượng vật thể (tránh cluttering)
  if (plan.objects.length > 5) {
    issues.push(`Quá nhiều vật thể (${plan.objects.length}), vi phạm nguyên tắc tập trung 1 ý chính.`);
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    issues,
    regenerate: score < 80, // Dưới 80 điểm bắt buộc chạy lại Local Heuristic Planner
  };
}
```

---

## 7. THUẬT TOÁN & MÃ NGUỒN SINH ĐỒ HỌA VECTOR SVG 1080P

Hàm `generateSemanticSvgForBeat` trong `scripts/visualBeatPlanner.cjs` chịu trách nhiệm tổng hợp toàn bộ các phần tử vector thành một file ảnh 1920x1080 hoàn mỹ:

### 7.1 Bộ khung chuẩn SVG 1920x1080
```javascript
function generateSemanticSvgForBeat({ beat, scene, styleGuide }) {
  const plan = beat.plan;
  const p = styleGuide.palette;
  const strokeW = styleGuide.strokeWidth;
  const method = plan?.visualMethod || 'character_action';

  let contentSvg = '';
  switch (method) {
    case 'comparison': contentSvg = renderComparisonSvg(plan, p, strokeW); break;
    case 'numbers': contentSvg = renderNumbersSvg(plan, beat.text, p, strokeW); break;
    case 'process': contentSvg = renderProcessSvg(plan, p, strokeW); break;
    case 'diagram': contentSvg = renderDiagramSvg(plan, p, strokeW); break;
    case 'typography': contentSvg = renderTypographySvg(plan, p, strokeW); break;
    case 'object_metaphor': contentSvg = renderMetaphorSvg(plan, beat.text, p, strokeW); break;
    case 'character_action':
    default:
      contentSvg = renderCharacterActionSvg(plan, beat.text, p, strokeW); break;
  }

  return `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="${p.background}" />
        </radialGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0F172A" flood-opacity="0.08"/>
        </filter>
        <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.06"/>
        </filter>
      </defs>

      <!-- Nền giấy kem ấm với gradient mịn -->
      <rect width="1920" height="1080" fill="url(#bgGlow)" />

      <!-- Lưới Grid Studio phong cách Whiteboard tinh tế -->
      <g opacity="0.03">
        ${Array.from({ length: 19 }).map((_, i) => `<line x1="${(i + 1) * 100}" y1="0" x2="${(i + 1) * 100}" y2="1080" stroke="#000" stroke-width="2"/>`).join('')}
        ${Array.from({ length: 10 }).map((_, i) => `<line x1="0" y1="${(i + 1) * 100}" x2="1920" y2="${(i + 1) * 100}" stroke="#000" stroke-width="2"/>`).join('')}
      </g>

      <!-- Nội dung hình học vector của Beat -->
      ${contentSvg}

      <!-- Badge Tiêu đề Beat dưới góc -->
      <g transform="translate(100, 940)">
        <rect x="0" y="0" width="auto" height="60" rx="16" fill="#1E293B" opacity="0.06" />
      </g>
    </svg>
  `;
}
```

### 7.2 Chi tiết mã nguồn vẽ các Visual Method

#### A. Comparison Svg (So sánh chia đôi màn hình)
```javascript
function renderComparisonSvg(plan, p, strokeW) {
  const leftLabel = escapeXml(plan.objects?.[0] || 'LỰA CHỌN A');
  const rightLabel = escapeXml(plan.objects?.[1] || 'LỰA CHỌN B');

  return `
    <g transform="translate(160, 220)">
      <!-- Card Trái -->
      <rect x="0" y="0" width="720" height="640" rx="28" fill="#FFFFFF" stroke="${p.outline}" stroke-width="${strokeW}" filter="url(#cardShadow)" />
      <rect x="0" y="0" width="720" height="90" rx="28" fill="#F1F5F9" />
      <text x="360" y="58" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="34" text-anchor="middle" fill="#64748B">${leftLabel}</text>

      <!-- Card Phải -->
      <rect x="880" y="0" width="720" height="640" rx="28" fill="#FFFFFF" stroke="${p.primary}" stroke-width="${strokeW + 1}" filter="url(#cardShadow)" />
      <rect x="880" y="0" width="720" height="90" rx="28" fill="${p.primary}" />
      <text x="1240" y="58" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="34" text-anchor="middle" fill="#FFFFFF">${rightLabel}</text>

      <!-- Huy hiệu VS ở giữa -->
      <circle cx="800" cy="320" r="64" fill="#EF4444" stroke="#FFFFFF" stroke-width="8" filter="url(#softShadow)" />
      <text x="800" y="336" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="44" text-anchor="middle" fill="#FFFFFF">VS</text>
    </g>
  `;
}
```

#### B. Numbers / Infographic Svg (Con số khổng lồ)
```javascript
function renderNumbersSvg(plan, text, p, strokeW) {
  const keyNum = escapeXml(plan.keyText || '100%');
  const meaning = escapeXml(plan.meaning || text || 'CHỈ SỐ TRỌNG YẾU');

  return `
    <g transform="translate(360, 200)">
      <rect x="0" y="0" width="1200" height="680" rx="36" fill="#FFFFFF" stroke="${p.outline}" stroke-width="${strokeW}" filter="url(#softShadow)" />
      
      <!-- Con số Hero -->
      <text x="600" y="360" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="180" text-anchor="middle" fill="${p.danger}" letter-spacing="-4">
        ${keyNum}
      </text>

      <!-- Thanh đo lường tỷ lệ ngang -->
      <rect x="200" y="440" width="800" height="32" rx="16" fill="#E2E8F0" />
      <rect x="200" y="440" width="620" height="32" rx="16" fill="${p.danger}" />

      <!-- Ý nghĩa diễn giải bên dưới -->
      <text x="600" y="550" font-family="'Be Vietnam Pro', sans-serif" font-weight="700" font-size="32" text-anchor="middle" fill="${p.muted}">
        ${meaning.substring(0, 50)}
      </text>
    </g>
  `;
}
```

#### C. Character Action Svg (Người que tương tác)
```javascript
function renderCharacterActionSvg(plan, text, p, strokeW) {
  return `
    <g transform="translate(300, 320)">
      <!-- Đầu stickman -->
      <circle cx="200" cy="120" r="65" fill="#FFFFFF" stroke="${p.outline}" stroke-width="${strokeW}" />
      <circle cx="180" cy="110" r="8" fill="${p.outline}" />
      <circle cx="220" cy="110" r="8" fill="${p.outline}" />
      <path d="M 185 145 Q 200 160 215 145" fill="none" stroke="${p.outline}" stroke-width="6" stroke-linecap="round" />

      <!-- Thân -->
      <line x1="200" y1="185" x2="200" y2="360" stroke="${p.outline}" stroke-width="${strokeW + 2}" stroke-linecap="round" />

      <!-- Tay chỉ sang thẻ ý tưởng -->
      <path d="M 200 230 L 320 200 L 440 230" fill="none" stroke="${p.outline}" stroke-width="${strokeW}" stroke-linecap="round" />

      <!-- Chân đứng vững -->
      <line x1="200" y1="360" x2="140" y2="520" stroke="${p.outline}" stroke-width="${strokeW + 2}" stroke-linecap="round" />
      <line x1="200" y1="360" x2="260" y2="520" stroke="${p.outline}" stroke-width="${strokeW + 2}" stroke-linecap="round" />

      <!-- Khung thông điệp bên phải -->
      <g transform="translate(480, 60)">
        <rect x="0" y="0" width="760" height="380" rx="28" fill="#FFFFFF" stroke="${p.outline}" stroke-width="${strokeW}" filter="url(#cardShadow)" />
        <rect x="0" y="0" width="760" height="70" rx="28" fill="${p.highlight}" />
        <text x="50" y="48" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="28" fill="#B45309">Ý TƯỞNG CỐT LÕI</text>
        <text x="50" y="160" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="52" fill="${p.outline}">
          ${escapeXml(plan.keyText || 'HÀNH ĐỘNG')}
        </text>
        <text x="50" y="240" font-family="'Be Vietnam Pro', sans-serif" font-weight="600" font-size="26" fill="${p.muted}">
          ${escapeXml(plan.meaning?.substring(0, 60) || text?.substring(0, 60))}
        </text>
      </g>
    </g>
  `;
}
```

---

## 8. PIPELINE RENDER VIDEO HEADLESS (FFMPEG ZOORGAN & CONCAT)

Mã nguồn trong `scripts/videoGenerator.cjs` thực hiện render từ ảnh + audio ra video MP4 hoàn chỉnh mà không cần mở trình duyệt:

### 8.1 Lệnh tạo chuyển động Ken-Burns cho từng Beat
```javascript
// Render từng ảnh beat thành đoạn clip có chuyển động zoompan nhẹ nhàng
const beatSec = (beat.duration_in_frames / 30).toFixed(2);

const cmdBeat = `/opt/homebrew/bin/ffmpeg -y -loop 1 -i "${beatPngPath}" ` +
  `-vf "scale=1920:1080,zoompan=z='min(zoom+0.0008,1.035)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30" ` +
  `-c:v libx264 -t ${beatSec} -pix_fmt yuv420p -r 30 -an "${beatClipOut}"`;

execSync(cmdBeat, { stdio: 'ignore' });
```

### 8.2 Lệnh ghép Beat Clips với Giọng Nói Scene
```javascript
// Tạo file beat_list.txt chứa danh sách các beat clip trong cảnh
// file 'temp_scene_1/beat_1.mp4'
// file 'temp_scene_1/beat_2.mp4'
const cmdScene = `/opt/homebrew/bin/ffmpeg -y -f concat -safe 0 -i "${beatListFile}" ` +
  `-i "${audioPath}" -c:v copy -c:a aac -b:a 192k -af "apad=pad_dur=0.4" -shortest "${sceneClipOut}"`;

execSync(cmdScene, { stdio: 'ignore' });
```

### 8.3 Lệnh ghép tất cả các cảnh thành final-video.mp4
```javascript
// Sử dụng concat demuxer ghép không cần re-encode (-c copy) siêu tốc
const concatCmd = `/opt/homebrew/bin/ffmpeg -y -f concat -safe 0 -i "${clipsListFile}" -c copy "${finalVideoPath}"`;
execSync(concatCmd, { stdio: 'ignore' });
```

---

## 9. CẦU NỐI API SERVER (VITE MIDDLEWARE SERVER PLUGIN)

Toàn bộ hệ thống giao tiếp giữa Client Web và Node.js Automation Pipeline thông qua Middleware trong `vite.config.ts`:

```typescript
import { defineConfig, Plugin } from 'vite';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function videoApiPlugin(): Plugin {
  return {
    name: 'video-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Intercept POST request từ CreatorPanel
        if (req.url === '/api/generate-video' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              const scriptPath = require.resolve('./scripts/videoGenerator.cjs');
              
              // Xóa require cache để luôn lấy mã nguồn mới nhất
              delete require.cache[scriptPath];
              const { generateVideo } = require(scriptPath);

              // Kích hoạt toàn bộ Pipeline
              const result = await generateVideo(data);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              console.error('API Error in /api/generate-video:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message || String(err) }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), videoApiPlugin()],
  // ...
});
```

---

## 10. LỚP RENDER REMOTION & CHUYỂN ĐỘNG ĐỘNG LỰC HỌC (REMOTION REACT ENGINE)

### 10.1 Entry Point Remotion Root (`src/remotion/Root.tsx`)
```tsx
export const RemotionRoot: React.FC = () => {
  const metadata = scenesJson.metadata;
  const scenes = buildMultiBeatScenes(scenesJson.scenes as any);

  return (
    <Composition
      id="StickmanExplainerVideo"
      component={MainVideo}
      durationInFrames={metadata.total_duration_in_frames}
      fps={metadata.fps || 30}
      width={1920}
      height={1080}
      defaultProps={{ scenes }}
    />
  );
};
```

### 10.2 Trục Sequence Video Chính (`src/remotion/MainVideo.tsx`)
Mỗi cảnh được bọc trong một thẻ `<Sequence>` của Remotion, sắp xếp nối tiếp nhau qua `start_frame`:
```tsx
export const MainVideo: React.FC<{ scenes: SceneData[] }> = ({ scenes }) => {
  return (
    <div style={{ flex: 1, backgroundColor: '#000000', width: 1920, height: 1080, position: 'relative' }}>
      {scenes.map((scene) => (
        <Sequence
          key={scene.id}
          from={scene.start_frame}
          durationInFrames={scene.duration_in_frames}
          name={`Scene ${scene.id} - ${scene.title}`}
        >
          <SceneRenderer scene={scene} />
        </Sequence>
      ))}
    </div>
  );
};
```

### 10.3 Điều Phối Beat & Khung Hình (`src/remotion/SceneRenderer.tsx`)
```tsx
export const SceneRenderer: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const beats = scene.beats || [/* fallback */];

  // 1. Tìm Beat đang kích hoạt theo frame hiện tại
  let activeBeatIndex = 0;
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const beatEnd = b.start_frame_offset + b.duration_in_frames;
    if (frame >= b.start_frame_offset && (frame < beatEnd || i === beats.length - 1)) {
      activeBeatIndex = i;
      break;
    }
  }

  const activeBeat = beats[activeBeatIndex];
  const beatLocalFrame = Math.max(0, frame - activeBeat.start_frame_offset);
  const beatDuration = activeBeat.duration_in_frames;

  // 2. Ken-Burns micro-zoom trong Remotion Canvas
  const beatScale = interpolate(beatLocalFrame, [0, beatDuration], [1.0, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const beatOpacity = interpolate(beatLocalFrame, [0, 5], [0.3, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 3. Render Vector SVG trực tiếp hoặc component chuyên biệt
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#FDFBF7' }}>
      <CameraContainer camera={scene.camera || 'static'} durationInFrames={scene.duration_in_frames}>
        <div style={{ transform: `scale(${beatScale})`, opacity: beatOpacity, width: '100%', height: '100%' }}>
          <img src={staticFile(`images/${activeBeat.image_file}`)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      </CameraContainer>

      {/* Âm thanh đồng bộ của cảnh */}
      <Audio src={staticFile(`audio/${scene.audio_file}`)} volume={1} />
    </div>
  );
};
```

### 10.4 Các Component Chuyển Động Vật Lý (Motion Primitives)
- **`Slide.tsx`**: Sử dụng hàm `spring()` với preset nhẹ nhàng:
  ```typescript
  export const springPresets = {
    gentle: { damping: 14, mass: 1, stiffness: 120 },
    punch: { damping: 8, mass: 0.8, stiffness: 220 },
  };
  ```
- **`CountUp.tsx`**: Đếm số nguyên hoặc số thập phân tăng dần theo số frame đã trôi qua.
- **`Punch.tsx`**: Nảy phóng đại 1.15 lần tại frame kích hoạt rồi quay về 1.0 trong 8-12 frames.
- **`Person.tsx`**: Tự động thở `translateY(Math.sin(frame * 0.04) * 1px)` và chớp mắt `frame % 110 > 105`.

---

## 11. GIAO DIỆN WEB STUDIO & CƠ CHẾ SỬA ĐỔI TƯƠNG TÁC

### 11.1 Các tính năng chính trên UI (`src/App.tsx`)
1. **Remotion Player tương tác**: Phát video, tạm dừng, nhảy đến phân cảnh bất kỳ (`jumpToScene`), tua đến từng nhịp Beat.
2. **Timeline Beat Navigator**: Hiển thị toàn bộ ảnh thumbnail của các beat bên dưới thanh điều khiển.
3. **Audio Waveform & Nghe thử**: Phát riêng lẻ từng file audio của từng phân cảnh để kiểm tra phát âm.
4. **Hộp thoại Tạo Video (`CreatorPanel.tsx`)**:
   - Chọn 1 trong 5 giọng đọc mẫu.
   - Chọn tốc độ từ 0.75x đến 1.5x.
   - Chọn kịch bản có sẵn hoặc dán văn bản mới, tải file text.
   - Tiến trình hiển thị logs trực tiếp 3 bước real-time.
5. **Vẽ lại hình ảnh tức thì (`RegenerateImageModal.tsx`)**:
   - Cho phép người dùng bấm vào bất kỳ Beat nào trên màn hình để mở hộp thoại vẽ lại ảnh.
   - Chọn lại phong cách (Whiteboard, Blueprint, Pastel, Comic, Dark Neon).
   - Chọn lại tư thế nhân vật (Explaining, Shocked, Running, Lifting, Balance, Ghost...).
   - Bấm lưu: Cập nhật trực tiếp chuỗi SVG vào trạng thái Video của Player mà không cần render lại audio.

---

## 12. CẤU TRÚC FILE SCENES.JSON CHUẨN MẪU

Dưới đây là một đoạn trích từ file `src/data/scenes.json` do pipeline tự động sinh ra:

```json
{
  "metadata": {
    "title": "Kinh Tế Học Phòng Gym",
    "subtitle": "Giọng đọc 1x",
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "total_scenes": 14,
    "total_duration_in_frames": 2420,
    "total_duration_in_seconds": "80.67",
    "created_at": "2026-10-03T08:00:00.000Z",
    "voice": "vi-VN-Standard-A",
    "speed": 1
  },
  "scenes": [
    {
      "id": 1,
      "scene_id": "scene_01",
      "title": "Ảo Tưởng Giờ Cao Điểm",
      "text": "Đến phòng gym vào giờ cao điểm, thấy máy chạy bộ kín người, phòng tạ đông đúc và quầy lễ tân xếp hàng, ai cũng nghĩ đây là cỗ máy in tiền béo bở.",
      "narration": "Đến phòng gym vào giờ cao điểm, thấy máy chạy bộ kín người, phòng tạ đông đúc và quầy lễ tân xếp hàng, ai cũng nghĩ đây là cỗ máy in tiền béo bở.",
      "audio_file": "scene_1.mp3",
      "image_file": "scene_1_beat_1.png",
      "visual_type": "character",
      "duration_in_seconds": 6.84,
      "duration_in_frames": 205,
      "start_frame": 0,
      "beats": [
        {
          "id": "scene_1_beat_1",
          "sub_index": 1,
          "title": "Ảo Tưởng Giờ Cao Điểm - Beat 1",
          "caption": "Đến phòng gym vào giờ cao điểm, thấy máy chạy bộ kín người",
          "image_file": "scene_1_beat_1.png",
          "duration_in_seconds": 3.42,
          "duration_in_frames": 103,
          "start_frame_offset": 0,
          "visual_type": "character",
          "main_text": "GIỜ CAO ĐIỂM",
          "sub_text": "Phòng tập đông đúc người xếp hàng",
          "plan": {
            "meaning": "Cảnh tượng phòng gym đông đúc tạo cảm giác siêu lợi nhuận",
            "subject": "Nhân vật stickman quan sát",
            "action": "Nhìn đám đông xếp hàng kín máy tập",
            "objects": ["máy chạy bộ", "hàng người xếp"],
            "environment": "Phòng gym giờ cao điểm",
            "composition": "Nhân vật góc trái nhìn đám đông bên phải",
            "shotType": "medium",
            "visualMethod": "character_action",
            "keyText": "GIỜ CAO ĐIỂM",
            "mustNotInclude": ["beer", "bar", "car"]
          }
        },
        {
          "id": "scene_1_beat_2",
          "sub_index": 2,
          "title": "Ảo Tưởng Giờ Cao Điểm - Beat 2",
          "caption": "ai cũng nghĩ đây là cỗ máy in tiền béo bở.",
          "image_file": "scene_1_beat_2.png",
          "duration_in_seconds": 3.42,
          "duration_in_frames": 102,
          "start_frame_offset": 103,
          "visual_type": "object_metaphor",
          "main_text": "MÁY IN TIỀN",
          "sub_text": "Ảo tưởng về dòng tiền khổng lồ",
          "plan": {
            "meaning": "Ảo tưởng kinh doanh béo bở",
            "subject": "Cỗ máy in tiền ẩn dụ",
            "action": "Tiền đô la bay ra từ cỗ máy",
            "objects": ["cỗ máy in tiền", "tiền đô"],
            "environment": "Clean studio",
            "composition": "Hero object ở trung tâm",
            "shotType": "medium",
            "visualMethod": "object_metaphor",
            "keyText": "MÁY IN TIỀN",
            "mustNotInclude": ["beer", "gym"]
          }
        }
      ]
    }
  ]
}
```

---

## 13. TỔNG KẾT

Tài liệu trên đã bao quát toàn bộ mã nguồn và logic hoạt động của hệ thống `remix-stickman-video-studio`.

### 3 Trụ Cột Nghệ Thuật Giúp Video Đẹp Như Bản Gốc:
1. **Khái niệm "Diegetic Infographic"**: Các biểu đồ, tỷ lệ, nhãn giá không nằm lơ lửng trên màn hình mà được vẽ trực tiếp lên bảng phấn quán cafe, khắc lên tường gạch, hoặc dán trên máy pha cà phê. Prompt Gemini ép AI thiết kế theo hướng này.
2. **"Stickman in a Realistic World"**: Nhân vật stickman đầu tròn trắng tối giản, nhưng sống trong không gian 3D/Isometric chi tiết có chất liệu gạch, gỗ, chrome, ánh sáng và đổ bóng. Prompt DALL-E 3 được dặn kỹ: "simple stickman with round white head... inside detailed colored environments".
3. **Bảng màu Earthy / Warm Watercolor**: Tông màu ấm trầm (nâu cafe, đỏ gạch, vàng mù tạt, xanh rêu, beige pastel) mang lại cảm giác phóng sự điện ảnh sang trọng.

### Điểm mấu chốt kỹ thuật:
1. **Pipeline 2 tầng AI**: Gemini Flash (Art Director/Planner) → DALL-E 3 (Image Generator) → SVG Fallback.
2. **Phân tích thời lượng chính xác bằng ffprobe** kết hợp chuyển đổi tốc độ giọng đọc bằng **FFmpeg atempo**.
3. **Thuật toán bẻ nhỏ cảnh thành Visual Beats 1.5s - 3.5s** giải quyết triệt để vấn đề hình ảnh tĩnh.
4. **5 Visual Methods xoay vòng** (scenic_environment, character_interaction, diegetic_infographic, object_close_up, split_screen_comparison) kết hợp **Semantic Validator** loại trừ ảo giác.
5. **Hiệu ứng chuyển động Remotion Spring Physics** và **FFmpeg Ken-Burns zoompan** mang lại trải nghiệm xem mượt mà, sống động.
