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
 * Helper constants and dynamic keyword extraction
 */
const VN_STOPWORDS = new Set([
  'chúng', 'ta', 'tôi', 'bạn', 'mọi', 'người', 'của', 'và', 'hoặc', 'nhưng', 'mà', 'thì', 'là',
  'rằng', 'ở', 'tại', 'với', 'cho', 'để', 'được', 'bị', 'do', 'bởi', 'khiến', 'làm', 'này',
  'đó', 'kia', 'những', 'các', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'ngày', 'nay', 'hiện',
  'tại', 'trong', 'ngoài', 'trên', 'dưới', 'rất', 'quá', 'lắm', 'luôn', 'sẽ', 'đang', 'đã',
  'cũng', 'chỉ', 'đều', 'vừa', 'mới', 'tự', 'ra', 'vào', 'lại', 'thấy', 'nghĩ', 'rõ', 'không',
  'chưa', 'chẳng', 'thế', 'nào', 'gì', 'sao'
]);

function extractDynamicMainText(text, fallbackTitle) {
  if (!text) return (fallbackTitle || 'Ý CHÍNH').toUpperCase();

  // 1. Metric / Number / Percentage first
  const metricMatch = text.match(/(\d+(?:[.,]\d+)?\s*(?:%|triệu|tỷ|usd|đ|k|tiếng|giờ|phút|giây|tháng|năm|người|kg|members|\$))/i);
  if (metricMatch) {
    return metricMatch[0].trim().toUpperCase();
  }

  // 2. Strong keyword phrases in quotation marks
  const quoteMatch = text.match(/["'«“]([^"'»”]{2,20})["'»”]/);
  if (quoteMatch) {
    return quoteMatch[1].trim().toUpperCase();
  }

  // 3. Extract 2-3 content words
  const clean = text.replace(/[,.!?;:()"'«»“”\n\r]/g, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const contentWords = words.filter((w) => !VN_STOPWORDS.has(w.toLowerCase()));

  if (contentWords.length >= 2) {
    return contentWords.slice(0, 3).join(' ').toUpperCase();
  } else if (contentWords.length === 1) {
    return contentWords[0].toUpperCase();
  }

  return (fallbackTitle || 'Ý CHÍNH').toUpperCase();
}

/**
 * Split a continuous long text into 3 to 6 logical scenes
 */
function splitLongTextIntoMultipleScenes(rawText) {
  const clean = (rawText || '').trim();
  // Split into sentences
  const rawSentences = clean
    .split(/(?<=[.!?;\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  if (rawSentences.length <= 1) {
    // If not separated by punctuation, split by word count
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length <= 25) {
      return [{ title: 'Tổng Quan', text: clean }];
    }
    const targetSceneCount = Math.min(5, Math.max(3, Math.ceil(words.length / 30)));
    const wordsPerScene = Math.ceil(words.length / targetSceneCount);
    const scenes = [];
    for (let i = 0; i < words.length; i += wordsPerScene) {
      const slice = words.slice(i, i + wordsPerScene).join(' ');
      const title = extractDynamicMainText(slice, `Phần ${scenes.length + 1}`);
      scenes.push({ title, text: slice });
    }
    return scenes;
  }

  // Target 3 to 6 scenes depending on number of sentences
  const targetCount = Math.min(6, Math.max(3, Math.ceil(rawSentences.length / 2)));
  const buckets = Array.from({ length: Math.min(targetCount, rawSentences.length) }, () => []);
  const baseSize = Math.floor(rawSentences.length / buckets.length);
  let remainder = rawSentences.length % buckets.length;
  let idx = 0;

  for (let b = 0; b < buckets.length; b++) {
    const take = baseSize + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    buckets[b] = rawSentences.slice(idx, idx + take);
    idx += take;
  }

  return buckets
    .filter((b) => b.length > 0)
    .map((b, sIdx) => {
      const sceneText = b.join(' ');
      const title = extractDynamicMainText(sceneText, `Cảnh ${sIdx + 1}`);
      return { title, text: sceneText };
    });
}

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
  let main_text = extractDynamicMainText(text, `Cảnh ${sceneIndex}`);
  let sub_text = text.length > 60 ? text.substring(0, 57) + '...' : text;
  let subject = 'Chủ đề chính';
  let environment = 'Studio trực quan';
  let objects = [];
  let composition = 'Trung tâm màn hình';
  let action = 'Nhấn mạnh luận điểm';
  let motion = 'slide';
  let camera = 'static';

  if (percentage || /tỷ lệ|phần trăm|chiếm|thị phần|cơ cấu/i.test(lower)) {
    visual_type = 'chart';
    if (!metric) main_text = percentage ? `TỶ TRỌNG ${percentage}` : main_text;
    objects = ['biểu đồ tròn', 'tỷ lệ %', 'dữ liệu'];
    motion = 'scale';
  } else if (metric || /\d+\s*(?:người|hội viên|khách|thành viên|members|usd|\$)/i.test(lower)) {
    visual_type = 'numbers';
    if (metric) main_text = metric.toUpperCase();
    objects = ['con số hero', 'bộ đếm', 'danh sách'];
    motion = 'count';
    camera = 'slow_push';
  } else if (/so với|thay vì|lựa chọn|khác biệt|ngược lại|đối lập|option a|option b/i.test(lower)) {
    visual_type = 'comparison';
    objects = ['Lựa chọn A', 'Lựa chọn B', 'Huy hiệu VS'];
    composition = 'Chia đôi màn hình trái phải';
    action = 'Đối chiếu ưu nhược điểm trực diện';
    motion = 'slide';
  } else if (/dòng tiền|mô hình|quy trình|hệ thống|kết nối|bước 1|luồng|funnel|pipeline/i.test(lower)) {
    visual_type = 'diagram';
    objects = ['Đầu vào', 'Xử lý', 'Đầu ra'];
    composition = 'Sơ đồ khối liên kết mũi tên';
    action = 'Dòng chảy thông tin liên tục';
    motion = 'connect';
  } else if (/bước|tiến trình|giai đoạn|lộ trình|nấu|ninh|hầm|pha chế|thực hiện/i.test(lower)) {
    visual_type = 'process';
    objects = ['Giai đoạn 1', 'Giai đoạn 2', 'Kết quả'];
    composition = 'Trục tiến trình ngang';
    motion = 'stagger';
  } else if (/kết luận|tóm lại|chìa khóa|bài học|tự do|quy tắc vàng|nguyên tắc/i.test(lower) || (sceneIndex === totalScenes && totalScenes > 2)) {
    visual_type = 'typography';
    objects = ['Dòng chữ punchy', 'Con dấu cam kết'];
    motion = 'punch';
    camera = 'slow_push';
  } else if (/công cụ|vũ khí|chìa khóa|đòn bẩy|bẫy|rào cản/i.test(lower)) {
    visual_type = 'object_metaphor';
    objects = ['Biểu tượng trung tâm', 'Đòn bẩy', 'Ổ khóa'];
    motion = 'scale';
  } else if (/không gian|cửa hàng|tòa nhà|đường phố|văn phòng|quán|nhà xưởng/i.test(lower)) {
    visual_type = 'environment';
    environment = 'Bối cảnh thực tế';
    objects = ['Mặt tiền', 'Không gian bối cảnh', 'Nhân vật quan sát'];
    motion = 'slide';
  } else {
    visual_type = 'character';
    subject = 'Nhân vật quan sát';
    objects = ['Nhân vật suy ngẫm', 'Hộp thoại phân tích'];
    motion = 'slide';
  }

  // Anti-repetition check with previous scene
  if (prevType && visual_type === prevType) {
    const alternatePool = ['numbers', 'diagram', 'object_metaphor', 'comparison', 'chart', 'process', 'typography'];
    const chosen = alternatePool.find((t) => t !== prevType) || 'typography';
    visual_type = chosen;
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
    const candidateModels = ['gemini-flash-lite-latest', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];
    for (const model of candidateModels) {
      try {
        const prompt = `You are a World-Class Storyboard Director for YouTube 2D Animated Explainer Videos (similar to Vox, Casually Explained, PolyMatter).
Given the following raw content/script:
"""
${rawText.substring(0, 4000)}
"""

YOUR MISSION:
Split this content into 3 to 7 impactful scenes (each 3 to 10 seconds, ~18-40 words of narration).
For each scene, choose the visual_type that best explains the concept visually:

VISUAL LIBRARY TYPES:
- 'character': Stickman reacting, pointing, thinking, experiencing the situation.
- 'environment': Storefront, kitchen, street, office, studio with depth.
- 'numbers': Big hero number counter with CountUp or metric highlights.
- 'diagram': Flowchart, input -> process -> output, pipeline.
- 'chart': Donut / Pie chart, bar comparison, percentage breakdown.
- 'comparison': Split screen Left vs Right with VS badge.
- 'object_metaphor': Central metaphorical objects (tools, scales, pots, locks, signs).
- 'process': Sequential milestones (Step 1 -> Step 2 -> Step 3).
- 'typography': Kinetic typography punchy statement for core takeaway.

CRITICAL RULES:
1. 'main_text' MUST be 1-3 punchy Vietnamese words extracted directly from the narration topic.
2. Return ONLY valid JSON matching this schema:
[
  {
    "scene_id": "scene_01",
    "title": "Short title in Vietnamese",
    "narration": "Exact Vietnamese narration text for voiceover",
    "visual_type": "one of the visual types above",
    "visual_description": "Clear visual description explaining the concept",
    "subject": "e.g. main subject",
    "environment": "e.g. clean studio / kitchen / office",
    "objects": ["obj1", "obj2"],
    "composition": "e.g. center hero",
    "action": "clear visual action",
    "main_text": "1-3 uppercase punchy words",
    "sub_text": "Key takeaway sentence",
    "motion": "fade | slide | scale | count | stagger | punch | connect",
    "camera": "static | slow_push | slow_pan | punch_in",
    "metric": "extracted metric if any",
    "percentage": "extracted percentage if any"
  }
]`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
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
              console.log(`✓ Gemini AI (${model}) đã tạo thành công Storyboard gồm ${parsed.length} phân cảnh đa dạng!`);
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
        console.warn(`Gemini AI Storyboard call failed on ${model}:`, err.message);
      }
    }
  }

  // Local Rule-Based Fallback
  console.log(`⚙️ Sử dụng Local Storyboard Engine để phân tích kịch bản...`);
  let rawScenes = [];

  // Check if scenesInput already has multiple valid scenes
  if (scenesInput && scenesInput.length > 1) {
    rawScenes = scenesInput;
  } else if (scenesInput && scenesInput.length === 1 && (scenesInput[0].text || '').split(/\s+/).length > 30) {
    // If user passed a single big scene, split it into multiple balanced scenes
    rawScenes = splitLongTextIntoMultipleScenes(scenesInput[0].text);
  } else {
    // Split raw content by scenes or paragraphs
    const paragraphs = rawText
      .split(/(?:CẢNH|SCENE|PHẦN|ĐOẠN)\s*\d+[:.-]|\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 15);

    if (paragraphs.length > 1) {
      rawScenes = paragraphs.map((p, idx) => {
        const firstLine = p.split('\n')[0].replace(/^#+\s*/, '').trim();
        const title = firstLine.length < 40 ? firstLine : extractDynamicMainText(p, `Cảnh ${idx + 1}`);
        const text = p.length > firstLine.length ? p.substring(firstLine.length).trim() : p;
        return { title, text: text || firstLine };
      });
    } else {
      // Single continuous paragraph or plain text -> split into multiple scenes!
      rawScenes = splitLongTextIntoMultipleScenes(rawText);
    }
  }

  // Ensure at least 2 scenes
  if (rawScenes.length === 1 && (rawScenes[0].text || '').split(/\s+/).length > 20) {
    rawScenes = splitLongTextIntoMultipleScenes(rawScenes[0].text);
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
