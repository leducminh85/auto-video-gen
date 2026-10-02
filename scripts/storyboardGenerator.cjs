const fs = require('fs');
const path = require('path');

const VALID_VISUAL_TYPES = [
  'character',
  'environment',
  'object_metaphor',
  'diagram',
  'numbers',
  'comparison',
  'chart',
  'process',
  'typography',
  'icon_grid',
];

const VALID_MOTIONS = [
  'fade',
  'slide',
  'scale',
  'draw',
  'count',
  'stagger',
  'move',
  'disappear',
  'highlight',
  'connect',
  'punch',
];

const VALID_CAMERAS = ['static', 'slow_push', 'slow_pan', 'punch_in'];

/**
 * Intelligent Local Rule-Based Scene Analyzer (Fallback when Gemini is unavailable)
 */
function analyzeSceneLocally(narration, sceneIndex = 1, totalScenes = 5, prevType = null) {
  const text = (narration || '').trim();
  const lower = text.toLowerCase();

  // 1. Extract Metrics & Percentages
  const percentMatch = text.match(/(\d+(?:[.,]\d+)?\s*%\s*(?:-\s*\d+(?:[.,]\d+)?\s*%)?)/i);
  const metricMatch = text.match(/(\d+(?:[.,]\d+)?\s*(?:triệu|tỷ|usd|đ|k|tiếng|ngày|tháng|năm|phút|giây|hội viên|đô|kg|bước|\$))/i);

  const percentage = percentMatch ? percentMatch[0].replace(/\s+/g, '') : null;
  const metric = metricMatch ? metricMatch[0] : null;

  // 2. Select Visual Type based on Content Concepts
  let visual_type = 'character';
  let main_text = 'Ý CHÍNH';
  let sub_text = 'Nguyên lý cốt lõi';
  let subject = 'Chủ đề chính';
  let environment = 'Không gian làm việc';
  let objects = [];
  let composition = 'Trung tâm màn hình';
  let action = 'Nhấn mạnh luận điểm';
  let motion = 'slide';
  let camera = 'static';

  if (percentage || /tỷ lệ|phần trăm|chiếm|thị phần|cơ cấu/i.test(lower)) {
    visual_type = 'chart';
    main_text = percentage ? `TỶ TRỌNG ${percentage}` : 'TỶ LỆ PHÂN BỔ';
    sub_text = 'Phần lớn chi phí và doanh thu nằm ở đây';
    objects = ['biểu đồ tròn', 'tỷ lệ %', 'dữ liệu'];
    motion = 'scale';
  } else if (metric || /\d+\s*(?:người|hội viên|khách|thành viên|members|usd|\$)/i.test(lower)) {
    visual_type = 'numbers';
    main_text = metric ? `${metric.toUpperCase()}` : 'CON SỐ TRỌNG YẾU';
    sub_text = 'Dữ liệu thực tế cho thấy sự chênh lệch lớn';
    objects = ['con số hero', 'bộ đếm', 'danh sách'];
    motion = 'count';
    camera = 'slow_push';
  } else if (/so với|thay vì|lựa chọn|khác biệt|ngược lại|đối lập|option a|option b/i.test(lower)) {
    visual_type = 'comparison';
    main_text = 'SO SÁNH HAI MÔ HÌNH';
    sub_text = 'Cách tiếp cận truyền thống vs Phương pháp tối ưu';
    objects = ['Lựa chọn A', 'Lựa chọn B', 'Huy hiệu VS'];
    composition = 'Chia đôi màn hình trái phải';
    action = 'Đối chiếu ưu nhược điểm trực diện';
    motion = 'slide';
  } else if (/dòng tiền|mô hình|quy trình|hệ thống|kết nối|bước 1|luồng|funnel|pipeline/i.test(lower)) {
    visual_type = 'diagram';
    main_text = 'CHU KỲ VẬN HÀNH';
    sub_text = 'Luồng tiền và giá trị chuyển giao';
    objects = ['Đầu vào', 'Xử lý', 'Đầu ra'];
    composition = 'Sơ đồ khối liên kết mũi tên';
    action = 'Dòng chảy thông tin liên tục';
    motion = 'connect';
  } else if (/bước|tiến trình|giai đoạn|lộ trình|tháng 1|mùa hè|cuối năm/i.test(lower)) {
    visual_type = 'process';
    main_text = 'LỘ TRÌNH PHÁT TRIỂN';
    sub_text = 'Các mốc thời gian quan trọng';
    objects = ['Giai đoạn 1', 'Giai đoạn 2', 'Kết quả'];
    composition = 'Trục tiến trình ngang';
    motion = 'stagger';
  } else if (/kết luận|tóm lại|chìa khóa|bài học|tự do|quy tắc vàng/i.test(lower) || sceneIndex === totalScenes) {
    visual_type = 'typography';
    main_text = 'BÀI HỌC CỐT LÕI';
    sub_text = 'Nguyên tắc vàng để làm chủ kết quả';
    objects = ['Dòng chữ punchy', 'Con dấu cam kết'];
    motion = 'punch';
    camera = 'slow_push';
  } else if (/thẻ|tiền|hợp đồng|khóa|cân bằng|bẫy|rào cản|máy in tiền/i.test(lower)) {
    visual_type = 'object_metaphor';
    main_text = 'BẢN CHẤT LỢI NHUẬN';
    sub_text = 'Vũ khí giữ chân và tối ưu biên lợi nhuận';
    objects = ['Thẻ thành viên', 'Dòng tiền tự động', 'Ổ khóa'];
    motion = 'scale';
  } else if (/phòng gym|cửa hàng|tòa nhà|đường phố|văn phòng|quán cafe|nhà xưởng/i.test(lower) || sceneIndex === 1) {
    visual_type = 'environment';
    main_text = 'BỐI CẢNH THỰC TẾ';
    sub_text = 'Khảo sát thực tế hiện trường';
    environment = 'Tòa nhà mặt phố';
    objects = ['Mặt tiền tòa nhà', 'Lối đi bộ', 'Nhân vật quan sát'];
    motion = 'slide';
  } else {
    visual_type = 'character';
    main_text = 'GÓC NHÌN CHUYÊN GIA';
    sub_text = 'Phân tích hành vi và tâm lý';
    subject = 'Nhân vật quan sát';
    objects = ['Nhân vật suy ngẫm', 'Hộp thoại phân tích'];
    motion = 'slide';
  }

  // Anti-repetition check with previous scene
  if (prevType && visual_type === prevType) {
    const alternatePool = ['numbers', 'diagram', 'object_metaphor', 'comparison', 'chart', 'typography'];
    const chosen = alternatePool.find((t) => t !== prevType) || 'typography';
    visual_type = chosen;
    main_text = 'GÓC NHÌN ĐẶC BIỆT';
  }

  return {
    visual_type,
    visual_description: `${visual_type.toUpperCase()}: ${main_text} - ${sub_text}`,
    subject,
    environment,
    objects,
    composition,
    action,
    main_text,
    sub_text,
    motion,
    camera,
    metric,
    percentage,
  };
}

/**
 * Enforce Strict Visual Variation Rules (Plan Rule #4, #16, #21)
 * Rule 1: No identical visual_type > 2 scenes in a row.
 * Rule 2: Character/environment ratio strictly <= 30%.
 * Rule 3: Diverse camera and motion settings.
 */
function enforceVisualVariationRules(scenes) {
  if (!scenes || scenes.length === 0) return scenes;

  const validAlternates = [
    'numbers',
    'diagram',
    'chart',
    'comparison',
    'object_metaphor',
    'process',
    'typography',
  ];

  let characterCount = 0;
  const maxCharacters = Math.max(1, Math.floor(scenes.length * 0.35));

  for (let i = 0; i < scenes.length; i++) {
    const current = scenes[i];

    // Check consecutive repetition (> 2 consecutive)
    if (i >= 2) {
      const prev1 = scenes[i - 1].visual_type;
      const prev2 = scenes[i - 2].visual_type;
      if (current.visual_type === prev1 && prev1 === prev2) {
        // Swap to an unused alternate
        const unused = validAlternates.find((t) => t !== prev1 && t !== (scenes[i + 1]?.visual_type || ''));
        if (unused) {
          current.visual_type = unused;
          current.motion = unused === 'numbers' ? 'count' : unused === 'chart' ? 'scale' : 'slide';
        }
      }
    }

    // Check Character/Environment ratio
    if (current.visual_type === 'character' || current.visual_type === 'environment') {
      characterCount++;
      if (characterCount > maxCharacters && i > 0) {
        // Demote excessive character scenes to data-driven scenes
        const replacement = validAlternates[i % validAlternates.length];
        current.visual_type = replacement;
        current.motion = replacement === 'numbers' ? 'count' : 'slide';
      }
    }

    // Ensure camera variety
    if (!current.camera || current.camera === 'static') {
      if (current.visual_type === 'typography' || current.visual_type === 'numbers') {
        current.camera = 'slow_push';
      } else if (current.visual_type === 'environment') {
        current.camera = 'slow_pan';
      } else {
        current.camera = 'static';
      }
    }
  }

  return scenes;
}

/**
 * AI Storyboard Generator using Gemini Flash
 * Receives raw text/script and generates the complete storyboard.
 */
async function generateStoryboardFromContent({ content, scenesInput, geminiApiKey }) {
  console.log(`\n🎬 [STORYBOARD GENERATOR] Đang phân tích content để tạo kịch bản hình ảnh đa dạng...`);

  const apiKey = geminiApiKey || process.env.GEMINI_API_KEY || '';
  const rawText = content || (scenesInput || []).map((s) => `${s.title}: ${s.text}`).join('\n\n');

  if (apiKey && rawText.length > 20) {
    try {
      const prompt = `You are a World-Class Storyboard Director for YouTube 2D Animated Explainer Videos (similar to Vox, Casually Explained, PolyMatter).
Given the following raw content/script:
"""
${rawText.substring(0, 4000)}
"""

YOUR MISSION:
Split this content into 4 to 8 impactful scenes (each 3 to 10 seconds, ~18-40 words of narration).
For each scene, choose the visual_type that best explains the concept visually:

VISUAL LIBRARY TYPES:
- 'character': 20-30% max. Person/stickman reacting, pointing, thinking, counting money.
- 'environment': Storefront, gym exterior, city street, office background with parallax.
- 'numbers': Big hero number counter with CountUp, or icon grid with disappearing items (e.g. 1,500 members -> 300 active).
- 'diagram': Flowchart, input -> process -> output, money flow, pipeline.
- 'chart': Donut / Pie chart, bar comparison, percentage breakdown.
- 'comparison': Split screen Left vs Right with VS badge (Option A vs Option B, expectation vs reality).
- 'object_metaphor': Central metaphorical objects (Credit cards, locks, scales of justice, money bills).
- 'process': Sequential milestones (Step 1 -> Step 2 -> Step 3).
- 'typography': Kinetic typography punchy statement for core takeaway/conclusion.

CRITICAL ANTI-REPETITION RULES:
1. Never use the same visual_type in more than 2 consecutive scenes!
2. Character/environment must be strictly <= 30% of total scenes.
3. Every scene MUST have a 1-3 word punchy 'main_text' in uppercase (e.g. "1,500 MEMBERS", "TỶ LỆ 80%", "SO SÁNH", "TỰ DO TÀI CHÍNH").

Return ONLY valid JSON matching this schema:
[
  {
    "scene_id": "scene_01",
    "title": "Short title in Vietnamese",
    "narration": "Exact Vietnamese narration text for voiceover",
    "visual_type": "one of the visual types above",
    "visual_description": "Clear visual description explaining the concept",
    "subject": "e.g. inactive members",
    "environment": "e.g. modern storefront",
    "objects": ["credit card", "dumbbell", "calendar"],
    "composition": "e.g. split screen / center hero",
    "action": "e.g. people leave while cards keep paying",
    "main_text": "1-3 uppercase punchy words",
    "sub_text": "Key takeaway sentence",
    "motion": "fade | slide | scale | count | stagger | punch | connect",
    "camera": "static | slow_push | slow_pan | punch_in",
    "metric": "extracted metric if any, e.g. 1,500 or $500K",
    "percentage": "extracted percentage if any, e.g. 80%"
  }
]`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`✓ Gemini AI đã tạo thành công Storyboard gồm ${parsed.length} phân cảnh đa dạng!`);
            const normalized = parsed.map((sc, idx) => ({
              id: idx + 1,
              scene_id: sc.scene_id || `scene_0${idx + 1}`,
              title: sc.title || `Cảnh ${idx + 1}`,
              text: sc.narration || sc.text || '',
              narration: sc.narration || sc.text || '',
              visual_type: VALID_VISUAL_TYPES.includes(sc.visual_type) ? sc.visual_type : 'character',
              visual_description: sc.visual_description || '',
              subject: sc.subject || '',
              environment: sc.environment || '',
              objects: Array.isArray(sc.objects) ? sc.objects : [],
              composition: sc.composition || '',
              action: sc.action || '',
              main_text: (sc.main_text || sc.title || '').toUpperCase(),
              sub_text: sc.sub_text || '',
              motion: VALID_MOTIONS.includes(sc.motion) ? sc.motion : 'slide',
              camera: VALID_CAMERAS.includes(sc.camera) ? sc.camera : 'static',
              metric: sc.metric || null,
              percentage: sc.percentage || null,
            }));

            return enforceVisualVariationRules(normalized);
          }
        }
      }
    } catch (err) {
      console.warn(`Gemini AI Storyboard call encountered an issue, switching to local rule engine:`, err.message);
    }
  }

  // Local Rule-Based Fallback
  console.log(`⚙️ Sử dụng Local Storyboard Engine để phân tích kịch bản...`);
  let rawScenes = [];

  if (scenesInput && scenesInput.length > 0) {
    rawScenes = scenesInput;
  } else {
    // Split raw content by scenes or paragraphs
    const paragraphs = rawText
      .split(/(?:CẢNH|SCENE|PHẦN|ĐOẠN)\s*\d+[:.-]|\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 15);

    rawScenes = paragraphs.map((p, idx) => {
      const firstLine = p.split('\n')[0].replace(/^#+\s*/, '').trim();
      const title = firstLine.length < 40 ? firstLine : `Cảnh ${idx + 1}`;
      const text = p.length > firstLine.length ? p.substring(firstLine.length).trim() : p;
      return { title, text: text || firstLine };
    });
  }

  let prevType = null;
  const storyboardScenes = rawScenes.map((raw, idx) => {
    const analysis = analyzeSceneLocally(raw.text || '', idx + 1, rawScenes.length, prevType);
    prevType = analysis.visual_type;

    return {
      id: idx + 1,
      scene_id: `scene_0${idx + 1}`,
      title: raw.title || `Cảnh ${idx + 1}`,
      text: raw.text || '',
      narration: raw.text || '',
      ...analysis,
    };
  });

  return enforceVisualVariationRules(storyboardScenes);
}

module.exports = {
  generateStoryboardFromContent,
  enforceVisualVariationRules,
  analyzeSceneLocally,
  VALID_VISUAL_TYPES,
};
