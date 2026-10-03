const fs = require('fs');
const path = require('path');

/**
 * Global Video Style Guide
 * Enforces uniform visual direction, character proportions, color palette, and stroke weights.
 */
function createVideoStyleGuide(title = '', tone = 'explainer') {
  return {
    characterStyle: 'minimalist_vector_stickman',
    strokeWidth: 7,
    palette: {
      background: '#FDFBF7',      // Warm cream paper
      bgAccent: '#F3EFE6',        // Subtle contrast
      card: '#FFFFFF',            // Crisp card surface
      outline: '#1E293B',         // Deep slate outline
      primary: '#2563EB',         // Royal blue
      secondary: '#10B981',       // Emerald growth
      accent: '#F59E0B',          // Amber warm focus
      danger: '#EF4444',          // Coral red alert
      purple: '#8B5CF6',          // Modern violet
      muted: '#64748B',           // Muted slate
      highlight: '#FEF3C7',       // Soft gold glow
    },
    typography: "'Be Vietnam Pro', system-ui, -apple-system, sans-serif",
    levelOfDetail: 'focused',
  };
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
 * Basic Metrics Extractor (Dynamic & Domain-Agnostic)
 */
function extractBasicMetrics(text) {
  const clean = (text || '').trim();
  const percentMatch = clean.match(/(\d+(?:[.,]\d+)?\s*%)/i);
  const moneyMatch = clean.match(/(\d+(?:[.,]\d+)?\s*(?:nghìn|triệu|tỷ|k|đồng|đ|usd|\$))/i);
  const timeMatch = clean.match(/(\d+(?:[.,]\d+)?\s*(?:giây|phút|tiếng|giờ|ngày|tháng|năm))/i);

  return {
    percentage: percentMatch ? percentMatch[0].replace(/\s+/g, '') : null,
    money: moneyMatch ? moneyMatch[0] : null,
    time: timeMatch ? timeMatch[0] : null,
  };
}

/**
 * Distribute an array of clauses into N balanced buckets
 */
function distributeIntoBuckets(items, bucketCount) {
  const count = Math.min(bucketCount, items.length);
  const buckets = Array.from({ length: count }, () => []);
  const baseSize = Math.floor(items.length / count);
  let remainder = items.length % count;
  let idx = 0;

  for (let b = 0; b < count; b++) {
    const take = baseSize + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    buckets[b] = items.slice(idx, idx + take);
    idx += take;
  }
  return buckets.filter((b) => b.length > 0).map((b) => b.join(' '));
}

/**
 * Visual Beat Segmentation (Cinematic explainer pacing: 4.5s - 8.0s per beat)
 * Reduces visual noise, avoids rapid image flipping, gives viewers time to absorb the visual idea.
 */
function segmentSceneIntoBeats(scene, durationInSeconds, totalFrames) {
  const text = (scene.text || scene.narration || '').trim();

  // Natural Explainer Pacing:
  // - Scenes under 7.5s: 1 focused visual beat (1 complete illustration per sentence)
  // - Scenes 7.5s - 14.0s: 2 balanced visual beats (e.g. Context/Problem -> Action/Resolution)
  // - Scenes over 14.0s: 3 visual beats (average ~5s - 7s per beat)
  let targetBeatCount = 1;
  if (durationInSeconds <= 7.5) {
    targetBeatCount = 1;
  } else if (durationInSeconds <= 14.0) {
    targetBeatCount = 2;
  } else {
    targetBeatCount = Math.min(3, Math.max(2, Math.round(durationInSeconds / 6.0)));
  }

  // If only 1 beat needed, use full text directly (eliminates visual fragmentation)
  if (targetBeatCount === 1) {
    return [
      {
        id: `scene_${scene.id}_beat_1`,
        sub_index: 1,
        title: `${scene.title} - Beat 1`,
        text: text,
        caption: text,
        duration_in_seconds: Number(durationInSeconds.toFixed(2)),
        duration_in_frames: totalFrames,
        start_frame_offset: 0,
      },
    ];
  }

  // For multi-beat scenes (> 7.5s): Split by major idea transition, NOT micro-commas
  const masked = text.replace(/(\d)[.,](\d)/g, '$1___NUMSEP___$2');

  // Split only on strong clause transitions or sentence boundaries
  const majorSplitRegex = /(?<=[.!?;\n])\s+|\s+(?:tuy nhiên|ngược lại|trong khi đó|thay vì|nhưng|mặc dù|để rồi|dẫn đến|chính vì vậy|đồng thời|bên cạnh đó)\s+/i;
  let rawClauses = masked
    .split(majorSplitRegex)
    .map((s) => s.replace(/___NUMSEP___/g, '.').trim())
    .filter((s) => s.length > 8 && s.split(/\s+/).length >= 3);

  // If no major split found, split by comma ONLY if both halves have >= 4 words
  if (rawClauses.length < targetBeatCount) {
    const commaSplit = masked
      .split(/(?<=[,])\s+/)
      .map((s) => s.replace(/___NUMSEP___/g, '.').trim())
      .filter((s) => s.length > 8 && s.split(/\s+/).length >= 4);

    if (commaSplit.length >= targetBeatCount) {
      rawClauses = commaSplit;
    }
  }

  let parts = [];
  if (rawClauses.length >= targetBeatCount) {
    parts = distributeIntoBuckets(rawClauses, targetBeatCount);
  } else {
    // Balanced word split across targetBeatCount
    const words = text.split(/\s+/);
    const wordsPerBeat = Math.ceil(words.length / targetBeatCount);
    for (let i = 0; i < words.length; i += wordsPerBeat) {
      parts.push(words.slice(i, i + wordsPerBeat).join(' '));
    }
  }

  // Ensure minimum duration: Merge any tiny part (< 3.0s or < 4 words) into its neighbor
  let mergedParts = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const wCount = p.split(/\s+/).length;
    if (wCount < 4 && mergedParts.length > 0) {
      mergedParts[mergedParts.length - 1] += ' ' + p;
    } else {
      mergedParts.push(p);
    }
  }
  if (mergedParts.length === 0) mergedParts = [text];

  const finalTotalWords = mergedParts.reduce((acc, p) => acc + p.split(/\s+/).length, 0) || 1;
  let allocatedFrames = 0;

  return mergedParts.map((part, idx) => {
    const isLast = idx === mergedParts.length - 1;
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

const BEAT_STOPWORDS = new Set([
  'chúng', 'ta', 'tôi', 'bạn', 'mọi', 'người', 'của', 'và', 'hoặc', 'nhưng', 'mà', 'thì', 'là',
  'rằng', 'ở', 'tại', 'với', 'cho', 'để', 'được', 'bị', 'do', 'bởi', 'khiến', 'làm', 'này',
  'đó', 'kia', 'những', 'các', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'ngày', 'nay', 'hiện',
  'tại', 'trong', 'ngoài', 'trên', 'dưới', 'rất', 'quá', 'lắm', 'luôn', 'sẽ', 'đang', 'đã',
  'cũng', 'chỉ', 'đều', 'vừa', 'mới', 'tự', 'ra', 'vào', 'lại', 'thấy', 'nghĩ', 'rõ', 'không',
  'chưa', 'chẳng', 'thế', 'nào', 'gì', 'sao'
]);

function extractDynamicKeyText(text, fallbackTitle) {
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
  const contentWords = words.filter((w) => !BEAT_STOPWORDS.has(w.toLowerCase()));

  if (contentWords.length >= 2) {
    return contentWords.slice(0, 3).join(' ').toUpperCase();
  } else if (contentWords.length === 1) {
    return contentWords[0].toUpperCase();
  }

  return (fallbackTitle || 'Ý CHÍNH').toUpperCase();
}

/**
 * Dynamic Universal Visual Beat Planner (Offline Fallback)
 * Analyzes sentence structure dynamically without any hardcoded domains.
 */
function createLocalBeatPlan({ beatText, beatIndex, totalBeats, sceneTitle, sceneText, videoTitle, prevMethod }) {
  const clean = (beatText || '').trim();
  const metrics = extractBasicMetrics(clean);

  let visualMethod = 'character_action';
  let shotType = 'medium';
  let meaning = clean;
  let whatToShow = '';
  let howToShow = '';
  let subject = 'Nhân vật stickman';
  let action = '';
  let objects = [];
  let environment = 'Clean studio';
  let keyText = extractDynamicKeyText(clean, sceneTitle);

  // 1. Metric / Number / Percentage
  if (metrics.percentage || metrics.money) {
    visualMethod = 'numbers';
    shotType = 'infographic';
    keyText = metrics.percentage || metrics.money.toUpperCase();
    action = `Nhấn mạnh số liệu quan trọng: ${keyText}`;
    whatToShow = `A prominent statistical infographic card highlighting the bold metric "${keyText}" with clean comparative data bars.`;
    howToShow = `Studio presentation framing. Stickman presenter pointing with confidence to the prominent data board.`;
  }
  // 2. Contrast / Comparison / Dilemma
  else if (/nhưng|tuy nhiên|ngược lại|so với|thay vì|khác biệt|chứ không|mặt khác|nghịch lý/i.test(clean)) {
    visualMethod = 'comparison';
    shotType = 'wide';
    keyText = extractDynamicKeyText(clean, 'SO SÁNH');
    action = 'Đối chiếu hai khía cạnh đối lập để làm rõ sự khác biệt';
    whatToShow = `Split visual comparison of two contrasting elements or choices representing: ${keyText}.`;
    howToShow = `Split-screen Left vs Right layout with VS emblem in center. Stickman in the middle evaluating both sides thoughtfully.`;
  }
  // 3. Process / Steps / Progression
  else if (/quy trình|bước|tiến trình|giai đoạn|tiếp theo|hành trình|trải qua|thực hiện/i.test(clean)) {
    visualMethod = 'process';
    shotType = 'diagram';
    keyText = extractDynamicKeyText(clean, 'QUY TRÌNH');
    action = 'Thực hiện tuần tự các bước trong tiến trình';
    whatToShow = `A progressive milestone roadmap with connecting checkpoint arrows showing clear operational advancement.`;
    howToShow = `Horizontal process flowchart (Step 1 -> Step 2 -> Step 3). Stickman character stepping forward along the path.`;
  }
  // 4. Growth / Success / Positive Outcome
  else if (/tăng|phát triển|thành công|doanh thu|tiềm năng|lợi ích|kết quả|hiệu quả|tối ưu/i.test(clean)) {
    visualMethod = 'numbers';
    shotType = 'infographic';
    keyText = extractDynamicKeyText(clean, 'TĂNG TRƯỞNG');
    action = 'Nhấn mạnh sự tăng trưởng và hiệu quả vượt bậc';
    whatToShow = `Stickman presenter standing beside a dynamic upward-trending performance chart with glowing achievement badges.`;
    howToShow = `Infographic studio layout. Stickman pointing enthusiastically to the rising curve of success.`;
  }
  // 5. Rule / Principle / Core Takeaway
  else if (/nguyên tắc|bài học|chìa khóa|cốt lõi|kết luận|tóm lại|quan trọng/i.test(clean)) {
    visualMethod = 'typography';
    shotType = 'medium';
    keyText = extractDynamicKeyText(clean, 'BÀI HỌC');
    action = 'Đúc kết nguyên tắc vàng quan trọng nhất';
    whatToShow = `A prestigious golden rule medal and glowing lightbulb emblem summarizing the ultimate takeaway lesson.`;
    howToShow = `Center hero composition with clean badge layout, radiating focal light, and confident stickman presenter.`;
  }
  // 6. Natural Character Action (Dynamic based on topic keywords)
  else {
    const methodsPool = ['character_action', 'object_metaphor', 'process', 'environment'];
    visualMethod = methodsPool[(beatIndex - 1) % methodsPool.length];
    keyText = extractDynamicKeyText(clean, sceneTitle);
    action = `Minh họa chủ đề: ${keyText}`;
    whatToShow = `Stickman character actively engaged with realistic props and visual elements representing: ${keyText}.`;
    howToShow = `Medium clean studio shot. Expressive stick figure body language with clear visual comic storytelling and bold lines.`;
  }

  // Prevent consecutive identical visual methods
  if (prevMethod && visualMethod === prevMethod) {
    const pool = ['comparison', 'object_metaphor', 'character_action', 'numbers', 'process', 'typography'];
    visualMethod = pool.find((m) => m !== prevMethod) || 'character_action';
  }

  // Ensure whatToShow and howToShow are populated
  if (!whatToShow) {
    whatToShow = `Stickman character actively engaged with props illustrating: ${keyText}.`;
  }
  if (!howToShow) {
    howToShow = `Medium clean studio shot. Expressive stick figure body language conveying the scene idea.`;
  }

  const imageGenerationPrompt = `A hyper-minimalist whiteboard animation doodle, Pictionary drawing style. [WHAT TO SHOW: ${whatToShow}]. [HOW TO SHOW: ${howToShow}]. Character is a pure simple stickman (circle for head, simple lines for body and limbs, completely faceless). Drawn with thick black marker outlines. Completely FLAT colors, ZERO shading, ZERO gradients, NO 3D effects. Pure white background with only one subtle accent color. Explainer video flat vector graphic, clean, extremely simplified.`;

  return {
    meaning,
    what_to_show: whatToShow,
    how_to_show: howToShow,
    subject,
    action,
    objects,
    environment,
    composition: 'Center focused',
    shotType,
    visualMethod,
    keyText: keyText.substring(0, 24).toUpperCase(),
    mustNotInclude: [],
    transitionIntent: 'Nối tiếp mạch diễn giải',
    imageGenerationPrompt,
  };
}

/**
 * AI Visual Planner with Smart Multi-Tier AI Support (Gemini + OpenAI)
 */
async function planVisualBeatsWithAI({ scene, beats, styleGuide, geminiApiKey, openaiApiKey, previousMethod }) {
  const apiKey = geminiApiKey || process.env.GEMINI_API_KEY || '';
  const oaiKey = openaiApiKey || process.env.OPENAI_API_KEY || '';

  if (!apiKey && !oaiKey) return null;

  try {
    const beatsSummary = beats
      .map((b, i) => `Beat ${i + 1} (${b.duration_in_seconds}s): "${b.text}"`)
      .join('\n');

    const prompt = `You are a World-Class Storyboard Visual Director for high-impact YouTube explainer animations (style of Kurzgesagt, Vox, Polymatter, Casually Explained).

Context:
- Scene Title: "${scene.title}"
- Full Narration: "${scene.text}"

Segmented Visual Beats to plan (${beats.length} beats):
${beatsSummary}

Previous visual method: "${previousMethod || 'none'}"

YOUR MISSION:
Right at this planning stage, you must explicitly plan out:
1. WHAT TO SHOW (what_to_show - ảnh thể hiện điều gì): Specific subjects, characters, environment, physical props, and concrete elements.
2. HOW TO SHOW IT (how_to_show - ảnh thể hiện như thế nào): Camera framing, composition (wide, split-screen, medium, isometric), character acting/pose/gesture, visual metaphor or diagram layout.
3. imageGenerationPrompt (FULL ENGLISH PROMPT FOR IMAGE MODEL): A production-ready, vivid prompt for image generation (Google Imagen / Flux).

CRITICAL DIRECTIVES:
- NO GENERIC PHRASES: NEVER use vague filler like "diễn đạt trực quan", "visual representation", "explaining concept", "illustrating the idea", or raw narration repetition.
- SPECIFICITY: Ground everything specifically in the topic of the narration (e.g. computer store, electronics workbench, customer examining PC parts, student studying on laptop, business growth chart).
- ART STYLE: imageGenerationPrompt must follow this structure:
  "A hyper-minimalist whiteboard animation doodle, Pictionary drawing style. [WHAT TO SHOW: specific subject, setting, and key objects]. [HOW TO SHOW: composition, character pose, actions, and visual dynamics]. Character is a pure simple stickman (circle for head, simple lines for body and limbs, completely faceless). Drawn with thick black marker outlines. Completely FLAT colors, ZERO shading, ZERO gradients, NO 3D effects. Pure white background with only one subtle accent color. Explainer video flat vector graphic, clean, extremely simplified."
- DIVERSE VISUAL METHODS: alternate between 'character_action', 'object_metaphor', 'comparison', 'infographic', 'numbers', 'process', 'typography', 'environment'.
- KEY TEXT: 'keyText' must be 1 to 3 punchy Vietnamese words or exact metric for on-screen text/badge (e.g. "NHU CẦU ỔN ĐỊNH", "ĐA NGUỒN THU", "GIÁ TRỊ TRỌN GÓI").

Return ONLY a JSON array with exactly ${beats.length} items matching this schema:
[
  {
    "meaning": "Vietnamese 1-sentence summary of the beat idea",
    "what_to_show": "Detailed English explanation of what subjects, setting, and objects are in the image",
    "how_to_show": "Detailed English explanation of camera angle, composition, character pose, and visual technique",
    "subject": "Main subject in English/Vietnamese",
    "action": "Specific physical action in English/Vietnamese (NOT generic)",
    "objects": ["specific object 1", "specific object 2"],
    "visualMethod": "character_action | object_metaphor | comparison | infographic | numbers | process | typography | environment",
    "shotType": "wide | medium | close-up | diagram | infographic",
    "keyText": "1-3 UPPERCASE WORDS",
    "imageGenerationPrompt": "Full English image prompt in hyper-minimalist whiteboard animation doodle style following the ART STYLE rule above."
  }
]`;

    const normalizeBeatArray = (json) => {
      if (!Array.isArray(json) || json.length !== beats.length) return null;
      return json.map((p) => {
        const whatToShow = p.what_to_show || `${p.subject || 'Stickman character'} in relevant scene`;
        const howToShow = p.how_to_show || `${p.action || 'interacting with elements'}`;
        const genPrompt = p.imageGenerationPrompt && !/diễn đạt trực quan/i.test(p.imageGenerationPrompt)
          ? p.imageGenerationPrompt
          : `A hyper-minimalist whiteboard animation doodle, Pictionary drawing style. [WHAT TO SHOW: ${whatToShow}]. [HOW TO SHOW: ${howToShow}]. Character is a pure simple stickman (circle for head, simple lines for body and limbs, completely faceless). Drawn with thick black marker outlines. Completely FLAT colors, ZERO shading, ZERO gradients, NO 3D effects. Pure white background with only one subtle accent color. Explainer video flat vector graphic, clean, extremely simplified.`;

        return {
          meaning: p.meaning || '',
          what_to_show: whatToShow,
          how_to_show: howToShow,
          subject: p.subject || 'Chủ thể chính',
          action: p.action || howToShow,
          objects: Array.isArray(p.objects) ? p.objects : [],
          environment: p.environment || 'Clean studio',
          composition: p.composition || 'Center focused',
          shotType: p.shotType || 'medium',
          visualMethod: p.visualMethod || 'character_action',
          keyText: (p.keyText || '').toUpperCase(),
          mustNotInclude: [],
          transitionIntent: '',
          imageGenerationPrompt: genPrompt,
        };
      });
    };

    // Tier 1: Try Gemini API
    if (apiKey) {
      const candidateModels = [
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-2.5-flash',
      ];
      for (const model of candidateModels) {
        try {
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
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const parsed = JSON.parse(rawText);
              const normalized = normalizeBeatArray(parsed);
              if (normalized) return normalized;
            }
          }
        } catch (_) {}
      }
    }

    // Tier 2: Try OpenAI API
    if (oaiKey) {
      try {
        const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${oaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a World-Class Storyboard Visual Director for high-impact YouTube explainer animations. Return ONLY a JSON object with a key "beats" containing the array of beats.',
              },
              { role: 'user', content: prompt + '\nIMPORTANT: Return a JSON object with a "beats" array property.' },
            ],
            response_format: { type: 'json_object' },
          }),
        });

        if (oaiRes.ok) {
          const data = await oaiRes.json();
          const contentStr = data.choices?.[0]?.message?.content;
          if (contentStr) {
            const parsed = JSON.parse(contentStr);
            const arrayCandidate = Array.isArray(parsed) ? parsed : parsed.beats || parsed.items;
            const normalized = normalizeBeatArray(arrayCandidate);
            if (normalized) return normalized;
          }
        }
      } catch (_) {}
    }
  } catch (_) {}
  return null;
}

/**
 * Semantic Validator
 */
function validateVisualBeat({ beatText, plan }) {
  const issues = [];
  let score = 100;
  const lowerText = (beatText || '').toLowerCase();
  const lowerKeyText = (plan.keyText || '').toLowerCase();
  const lowerAction = (plan.action || '').toLowerCase();
  const lowerPrompt = (plan.imageGenerationPrompt || '').toLowerCase();

  const bannedKeywords = ['beer', 'bia', 'quán bia', 'két bia'];
  for (const banned of bannedKeywords) {
    if (!lowerText.includes(banned) && lowerKeyText.includes(banned)) {
      issues.push(`Hallucination không liên quan: "${banned}"`);
      score -= 30;
    }
  }

  // Reject generic filler phrases
  if (lowerAction.includes('diễn đạt trực quan') || lowerPrompt.includes('diễn đạt trực quan')) {
    issues.push('Prompt hoặc action chứa cụm từ cấm "diễn đạt trực quan" thay vì vạch rõ cảnh cụ thể');
    score -= 40;
  }

  if ((plan.keyText || '').split(/\s+/).length > 5) {
    issues.push('KeyText dài hơn 5 từ');
    score -= 15;
  }

  return {
    score: Math.max(0, score),
    issues,
    regenerate: score < 80,
  };
}

/**
 * Universal 1920x1080 Vector SVG Synthesizer (Zero Hardcoded Domains)
 * Renders dynamic explainer graphics driven 100% by the visual plan.
 */
function generateSemanticSvgForBeat({ beat, scene, styleGuide }) {
  const guide = styleGuide || createVideoStyleGuide();
  const plan = beat.plan || {};
  const p = guide.palette;
  const sw = guide.strokeWidth;
  const text = (beat.text || beat.caption || beat.plan?.meaning || '').trim();
  const keyText = escapeXml(plan.keyText || 'Ý CHÍNH');
  const method = plan.visualMethod || 'character_action';

  let contentSvg = '';
  switch (method) {
    case 'comparison':
      contentSvg = renderGenericComparison(plan, text, p, sw, guide);
      break;
    case 'numbers':
    case 'infographic':
      contentSvg = renderGenericNumbers(plan, text, p, sw, guide);
      break;
    case 'process':
      contentSvg = renderGenericProcess(plan, text, p, sw, guide);
      break;
    case 'typography':
      contentSvg = renderGenericTypography(plan, text, p, sw, guide);
      break;
    case 'object_metaphor':
      contentSvg = renderGenericMetaphor(plan, text, p, sw, guide);
      break;
    case 'environment':
      contentSvg = renderGenericEnvironment(plan, text, p, sw, guide);
      break;
    default:
      contentSvg = renderGenericCharacter(plan, text, p, sw, guide);
      break;
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

      <rect width="1920" height="1080" fill="url(#bgGlow)" />

      <g opacity="0.025">
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <circle cx="30" cy="30" r="2" fill="${p.outline}" />
        </pattern>
        <rect width="1920" height="1080" fill="url(#grid)" />
      </g>

      ${contentSvg}

      <!-- Top Stylized KeyText Pill Badge -->
      <g transform="translate(960, 80)">
        <rect x="-260" y="-35" width="520" height="70" rx="35" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw - 1}" filter="url(#cardShadow)"/>
        <circle cx="-205" cy="0" r="10" fill="${p.accent}" />
        <text x="-175" y="11" font-family="${guide.typography}" font-weight="900" font-size="28" fill="${p.outline}" letter-spacing="1.2">
          ${keyText}
        </text>
      </g>
    </svg>
  `;
}

// ==================== DYNAMIC UNIVERSAL VECTOR RENDERERS ====================

function renderGenericComparison(plan, text, p, sw, guide) {
  const parts = text.split(/thay vì|so với|chứ không|ngược lại|đối lập|nhưng|tuy nhiên/i);
  const objs = plan.objects || [];
  const leftLabel = escapeXml(objs[0] || parts[0]?.trim().substring(0, 32) || 'LỰA CHỌN A');
  const rightLabel = escapeXml(objs[1] || parts[1]?.trim().substring(0, 32) || 'LỰA CHỌN B');

  return `
    <g transform="translate(960, 560)">
      <!-- Left Card (Option A / Contrast) -->
      <g transform="translate(-460, -250)">
        <rect x="0" y="0" width="410" height="500" rx="36" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#cardShadow)"/>
        <rect x="30" y="30" width="350" height="75" rx="18" fill="#FEE2E2" stroke="${p.danger}" stroke-width="4"/>
        <text x="205" y="78" font-family="${guide.typography}" font-weight="900" font-size="22" fill="${p.danger}" text-anchor="middle">${leftLabel}</text>
        <circle cx="205" cy="240" r="70" fill="#FEF2F2" stroke="${p.danger}" stroke-width="5"/>
        <path d="M 180 215 L 230 265 M 230 215 L 180 265" stroke="${p.danger}" stroke-width="10" stroke-linecap="round"/>
        <text x="205" y="370" font-family="${guide.typography}" font-weight="800" font-size="20" fill="${p.muted}" text-anchor="middle">Hạn chế / Thách thức</text>
      </g>

      <!-- Center VS Badge -->
      <g transform="translate(0, 0)">
        <circle cx="0" cy="0" r="50" fill="${p.accent}" stroke="${p.outline}" stroke-width="${sw}"/>
        <text x="0" y="14" font-family="${guide.typography}" font-weight="900" font-size="34" fill="${p.outline}" text-anchor="middle">VS</text>
      </g>

      <!-- Right Card (Option B / Solution) -->
      <g transform="translate(50, -250)">
        <rect x="0" y="0" width="410" height="500" rx="36" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#cardShadow)"/>
        <rect x="30" y="30" width="350" height="75" rx="18" fill="#DCFCE7" stroke="${p.secondary}" stroke-width="4"/>
        <text x="205" y="78" font-family="${guide.typography}" font-weight="900" font-size="22" fill="${p.secondary}" text-anchor="middle">${rightLabel}</text>
        <circle cx="205" cy="240" r="70" fill="#F0FDF4" stroke="${p.secondary}" stroke-width="5"/>
        <path d="M 175 240 L 195 265 L 235 215" fill="none" stroke="${p.secondary}" stroke-width="10" stroke-linecap="round"/>
        <text x="205" y="370" font-family="${guide.typography}" font-weight="800" font-size="20" fill="${p.secondary}" text-anchor="middle">Ưu điểm vượt trội</text>
      </g>
    </g>
  `;
}

function renderGenericNumbers(plan, text, p, sw, guide) {
  const metric = escapeXml(plan.keyText || '100%');
  const subDesc = escapeXml(plan.what_to_show || plan.action || text.substring(0, 60));

  return `
    <g transform="translate(960, 540)">
      <rect x="-500" y="-260" width="1000" height="520" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <circle cx="0" cy="-30" r="150" fill="none" stroke="${p.primary}" stroke-width="18" stroke-dasharray="750" stroke-dashoffset="150" stroke-linecap="round"/>
      <text x="0" y="5" font-family="${guide.typography}" font-weight="900" font-size="110" fill="${p.primary}" letter-spacing="-3" text-anchor="middle">
        ${metric}
      </text>
      <text x="0" y="150" font-family="${guide.typography}" font-weight="800" font-size="28" fill="${p.outline}" text-anchor="middle">
        ${escapeXml(text.length > 55 ? text.substring(0, 52) + '...' : text)}
      </text>
      <text x="0" y="200" font-family="${guide.typography}" font-weight="700" font-size="20" fill="${p.muted}" text-anchor="middle">
        ${subDesc.length > 65 ? subDesc.substring(0, 62) + '...' : subDesc}
      </text>
    </g>
  `;
}

function renderGenericProcess(plan, text, p, sw, guide) {
  const objs = plan.objects || [];
  const label1 = escapeXml(objs[0] || '01 BẮT ĐẦU');
  const label2 = escapeXml(plan.keyText || objs[1] || '02 TRIỂN KHAI');
  const label3 = escapeXml(objs[2] || '03 KẾT QUẢ');

  return `
    <g transform="translate(960, 560)">
      <line x1="-500" y1="0" x2="500" y2="0" stroke="${p.outline}" stroke-width="${sw}" stroke-dasharray="16 12"/>
      <!-- Step 1 -->
      <g transform="translate(-560, -180)">
        <rect x="0" y="0" width="320" height="360" rx="28" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#cardShadow)"/>
        <circle cx="160" cy="-20" r="40" fill="${p.primary}" stroke="${p.outline}" stroke-width="5"/>
        <text x="160" y="-8" font-family="${guide.typography}" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">01</text>
        <text x="160" y="100" font-family="${guide.typography}" font-weight="900" font-size="24" fill="${p.outline}" text-anchor="middle">${label1}</text>
      </g>
      <!-- Step 2 (Hero Focus) -->
      <g transform="translate(-160, -210)">
        <rect x="0" y="0" width="320" height="390" rx="28" fill="${p.card}" stroke="${p.secondary}" stroke-width="${sw + 2}" filter="url(#softShadow)"/>
        <circle cx="160" cy="-20" r="45" fill="${p.secondary}" stroke="${p.outline}" stroke-width="5"/>
        <text x="160" y="-6" font-family="${guide.typography}" font-weight="900" font-size="32" fill="#FFFFFF" text-anchor="middle">02</text>
        <text x="160" y="110" font-family="${guide.typography}" font-weight="900" font-size="24" fill="${p.secondary}" text-anchor="middle">${label2}</text>
      </g>
      <!-- Step 3 -->
      <g transform="translate(240, -180)">
        <rect x="0" y="0" width="320" height="360" rx="28" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#cardShadow)"/>
        <circle cx="160" cy="-20" r="40" fill="${p.accent}" stroke="${p.outline}" stroke-width="5"/>
        <text x="160" y="-8" font-family="${guide.typography}" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">03</text>
        <text x="160" y="100" font-family="${guide.typography}" font-weight="900" font-size="24" fill="${p.outline}" text-anchor="middle">${label3}</text>
      </g>
    </g>
  `;
}

function renderGenericTypography(plan, text, p, sw, guide) {
  const badgeLabel = escapeXml(plan.keyText || 'ĐIỂM CỐT LÕI');
  return `
    <g transform="translate(960, 550)">
      <rect x="-580" y="-240" width="1160" height="480" rx="40" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <text x="-500" y="-100" font-family="Georgia, serif" font-weight="900" font-size="160" fill="${p.accent}" opacity="0.4">“</text>
      <text x="0" y="20" font-family="${guide.typography}" font-weight="900" font-size="44" fill="${p.outline}" text-anchor="middle" letter-spacing="-0.5">
        ${escapeXml(text.length > 60 ? text.substring(0, 57) + '...' : text)}
      </text>
      <g transform="translate(0, 140)">
        <rect x="-200" y="-28" width="400" height="56" rx="28" fill="${p.secondary}" stroke="${p.outline}" stroke-width="4"/>
        <text x="0" y="9" font-family="${guide.typography}" font-weight="900" font-size="22" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
          ${badgeLabel}
        </text>
      </g>
    </g>
  `;
}

function renderGenericMetaphor(plan, text, p, sw, guide) {
  return `
    <g transform="translate(960, 540)">
      <circle cx="0" cy="0" r="220" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <circle cx="0" cy="0" r="160" fill="none" stroke="${p.danger}" stroke-width="8"/>
      <circle cx="0" cy="0" r="100" fill="none" stroke="${p.danger}" stroke-width="8"/>
      <circle cx="0" cy="0" r="40" fill="${p.danger}" stroke="${p.outline}" stroke-width="5"/>
      <path d="M 0 0 L 140 -140" stroke="${p.outline}" stroke-width="10" stroke-linecap="round"/>
      <polygon points="140,-140 120,-115 165,-120" fill="${p.accent}"/>
      <text x="0" y="290" font-family="${guide.typography}" font-weight="900" font-size="38" fill="${p.outline}" text-anchor="middle">
        ${escapeXml(plan.keyText || 'MỤC TIÊU TRỌNG TÂM')}
      </text>
    </g>
  `;
}

function renderGenericEnvironment(plan, text, p, sw, guide) {
  const mainTitle = escapeXml(plan.keyText || 'KHÔNG GIAN HOẠT ĐỘNG');
  const subAction = escapeXml(plan.what_to_show || text.substring(0, 60));

  return `
    <g transform="translate(960, 540)">
      <rect x="-600" y="-260" width="1200" height="520" rx="40" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <!-- Perspective Stage Grid Lines -->
      <line x1="-540" y1="140" x2="540" y2="140" stroke="${p.outline}" stroke-width="4" opacity="0.3"/>
      <line x1="-540" y1="140" x2="-200" y2="-120" stroke="${p.outline}" stroke-width="2" opacity="0.2"/>
      <line x1="540" y1="140" x2="200" y2="-120" stroke="${p.outline}" stroke-width="2" opacity="0.2"/>

      <!-- Center Screen / Stage Board -->
      <g transform="translate(0, -20)">
        <rect x="-350" y="-120" width="700" height="200" rx="20" fill="${p.bgAccent}" stroke="${p.outline}" stroke-width="5"/>
        <text x="0" y="-50" font-family="${guide.typography}" font-weight="900" font-size="36" fill="${p.primary}" text-anchor="middle">
          ${mainTitle}
        </text>
        <text x="0" y="20" font-family="${guide.typography}" font-weight="800" font-size="24" fill="${p.outline}" text-anchor="middle">
          ${escapeXml(text.length > 55 ? text.substring(0, 52) + '...' : text)}
        </text>
        <text x="0" y="60" font-family="${guide.typography}" font-weight="700" font-size="18" fill="${p.muted}" text-anchor="middle">
          ${escapeXml(subAction.length > 60 ? subAction.substring(0, 57) + '...' : subAction)}
        </text>
      </g>
    </g>
  `;
}

function renderGenericCharacter(plan, text, p, sw, guide) {
  const mainTitle = escapeXml(plan.keyText || 'TRỌNG TÂM LUẬN ĐIỂM');
  const subAction = escapeXml(plan.action ? plan.action.substring(0, 55) : 'Khám phá và diễn giải chi tiết vấn đề');

  return `
    <g transform="translate(620, 540)">
      <ellipse cx="0" cy="280" rx="160" ry="24" fill="${p.outline}" opacity="0.08" />
      <circle cx="0" cy="-60" r="65" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}"/>
      <circle cx="20" cy="-65" r="7" fill="${p.outline}"/>
      <path d="M 10 -40 Q 25 -30 40 -45" fill="none" stroke="${p.outline}" stroke-width="5" stroke-linecap="round"/>
      <line x1="0" y1="5" x2="0" y2="180" stroke="${p.outline}" stroke-width="${sw + 2}" stroke-linecap="round"/>
      <path d="M 0 180 L -70 280 M 0 180 L 70 280" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
      <path d="M 0 50 L 100 0 L 220 -40" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
      <circle cx="220" cy="-40" r="8" fill="${p.danger}"/>
    </g>

    <g transform="translate(1300, 480)">
      <rect x="-300" y="-200" width="600" height="400" rx="36" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <rect x="-260" y="-160" width="520" height="80" rx="16" fill="${p.background}" stroke="${p.outline}" stroke-width="4"/>
      <text x="0" y="-110" font-family="${guide.typography}" font-weight="900" font-size="32" fill="${p.primary}" text-anchor="middle">
        ${mainTitle}
      </text>
      <line x1="-220" y1="-30" x2="220" y2="-30" stroke="${p.outline}" stroke-width="4" stroke-dasharray="8 8"/>
      <text x="0" y="35" font-family="${guide.typography}" font-weight="800" font-size="24" fill="${p.outline}" text-anchor="middle">
        ${escapeXml(text.length > 55 ? text.substring(0, 52) + '...' : text)}
      </text>
      <text x="0" y="95" font-family="${guide.typography}" font-weight="700" font-size="18" fill="${p.muted}" text-anchor="middle">
        ${subAction}
      </text>
    </g>
  `;
}

/**
 * Quality Gate (Explainer Pacing: 4.5s - 8.5s per beat, 1-3 beats per scene)
 */
function runProjectQualityGate(scenes) {
  const issues = [];
  let totalBeats = 0;
  let totalDurationSec = 0;

  for (const scene of scenes) {
    const beats = scene.beats || [];
    totalBeats += beats.length;

    if (beats.length === 0) {
      issues.push(`Cảnh ${scene.id} chưa có nhịp thị giác (beat).`);
    } else if (beats.length > 4) {
      issues.push(`Cảnh ${scene.id} có ${beats.length} beats (quá nhiều, dễ gây rối mắt cho người xem).`);
    }

    for (const beat of beats) {
      totalDurationSec += beat.duration_in_seconds;
      if (beat.duration_in_seconds > 14.0) {
        issues.push(`Beat ${beat.id} dài ${beat.duration_in_seconds}s (vượt quá 14s, cần chia nhỏ để giữ nhịp).`);
      }
    }
  }

  const avgDuration = totalBeats > 0 ? Number((totalDurationSec / totalBeats).toFixed(2)) : 0;
  const passed = issues.length === 0;

  return {
    total_beats: totalBeats,
    avg_beat_duration_sec: avgDuration,
    validation_passed: passed,
    issues,
  };
}

module.exports = {
  createVideoStyleGuide,
  segmentSceneIntoBeats,
  createLocalBeatPlan,
  planVisualBeatsWithAI,
  validateVisualBeat,
  generateSemanticSvgForBeat,
  runProjectQualityGate,
};
