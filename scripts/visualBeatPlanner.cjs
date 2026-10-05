const { localDirection, finalizeDirection, repeatedSubject } = require('./visualDirection.cjs');

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
 * Build production-ready whiteboard doodle prompt matching user's exact specification
 */
function buildWhiteboardPrompt({ actionDescription, keyText, accentColor = 'cyan blue' }) {
  const cleanAction = (actionDescription || 'A stickman character actively engaging in the scene').trim().replace(/\.+$/, '');
  const cleanKey = (keyText || '').trim();
  const textClause = cleanKey
    ? ` The text "${cleanKey}" is written clearly and boldly, placed safely inside the illustration.`
    : ' Pure visual storytelling with absolutely NO on-screen text, NO letters, and NO words.';
  return `A hyper-minimalist whiteboard animation doodle, Pictionary drawing style, horizontal 16:9 widescreen composition with generous white padding. ${cleanAction}.${textClause} Characters are absolute pure stickmen with an empty circle for a head, absolutely NO facial features, NO eyes, NO mouth, and single thin black lines for bodies and limbs. Drawn with thick black marker outlines. Completely FLAT colors, ZERO shading, ZERO drop shadows under feet, NO gray tones, NO 3D effects. All characters and drawing elements are well within the safe zone, arranged according to the specified composition with at least 15% clear white margin from all edges. Pure white background with ONLY ONE subtle ${accentColor} accent color used for highlights. Clean, extremely simplified 2D flat vector explainer video illustration.`;
}

/**
 * Dynamic subtle accent color selection
 */
function getSubtleAccentColor(visualMethod, index = 0) {
  switch (visualMethod) {
    case 'numbers':
    case 'infographic':
      return 'cyan blue';
    case 'comparison':
    case 'problem_conflict':
      return 'amber orange';
    case 'typography':
      return 'golden yellow';
    case 'object_metaphor':
      return 'emerald green';
    case 'process':
      return 'cyan blue';
    default: {
      const palette = ['cyan blue', 'amber orange', 'emerald green', 'golden yellow'];
      return palette[index % palette.length];
    }
  }
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
  // Vietnamese stop words
  'chúng', 'ta', 'tôi', 'bạn', 'mọi', 'người', 'của', 'và', 'hoặc', 'nhưng', 'mà', 'thì', 'là',
  'rằng', 'ở', 'tại', 'với', 'cho', 'để', 'được', 'bị', 'do', 'bởi', 'khiến', 'làm', 'này',
  'đó', 'kia', 'những', 'các', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'ngày', 'nay', 'hiện',
  'tại', 'trong', 'ngoài', 'trên', 'dưới', 'rất', 'quá', 'lắm', 'luôn', 'sẽ', 'đang', 'đã',
  'cũng', 'chỉ', 'đều', 'vừa', 'mới', 'tự', 'ra', 'vào', 'lại', 'thấy', 'nghĩ', 'rõ', 'không',
  'chưa', 'chẳng', 'thế', 'nào', 'gì', 'sao', 'về', 'theo', 'như', 'khi', 'nếu',
  // English stop words & grammatical fillers
  'if', 'we', 'you', 'they', 'he', 'she', 'it', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'a', 'an', 'the', 'and', 'but', 'or', 'so', 'as',
  'at', 'by', 'for', 'from', 'in', 'into', 'of', 'off', 'on', 'onto', 'out', 'over', 'to', 'up',
  'with', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'any', 'because', 'before',
  'below', 'between', 'both', 'can', 'cannot', 'could', 'down', 'during', 'each', 'few', 'further',
  'here', 'how', 'i', 'me', 'my', 'more', 'most', 'no', 'nor', 'not', 'only', 'own', 'same',
  'should', 'some', 'such', 'than', 'that', 'their', 'theirs', 'them', 'then', 'there', 'these',
  'this', 'those', 'through', 'too', 'under', 'until', 'very', 'what', 'when', 'where', 'which',
  'while', 'who', 'whom', 'why', 'will', 'would', 'make', 'just', 'like', 'get', 'got', 'one',
  'two', 'three', 'take', 'come', 'go', 'also', 'well', 'talk', 'talks', 'talking', 'tell',
  'see', 'need', 'needs', 'needed', 'usually', 'become', 'another', 'might', 'choose', 'right',
  'keep', 'keeping', 'good', 'condition'
]);

function extractDynamicKeyText(text) {
  if (!text) return '';

  // 1. Metric / Number / Percentage first (highest value)
  const metricMatch = text.match(/(\d+(?:[.,]\d+)?\s*(?:%|triệu|tỷ|usd|đ|k|tiếng|giờ|phút|giây|tháng|năm|người|kg|members|\$))/i);
  if (metricMatch) {
    return metricMatch[0].trim().toUpperCase();
  }

  // 2. Strong keyword phrases in quotation marks
  const quoteMatch = text.match(/["'«“]([^"'»”]{2,20})["'»”]/);
  if (quoteMatch) {
    return quoteMatch[1].trim().toUpperCase();
  }

  // 3. Extract meaningful concept keywords (excluding stop words)
  const clean = text.replace(/[,.!?;:()"'«»“”\n\r]/g, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const contentWords = words.filter((w) => {
    const low = w.toLowerCase();
    return !BEAT_STOPWORDS.has(low) && low.length >= 3;
  });

  // Only return if we have 1-2 truly meaningful content words
  if (contentWords.length >= 2) {
    return contentWords.slice(0, 2).join(' ').toUpperCase();
  } else if (contentWords.length === 1) {
    return contentWords[0].toUpperCase();
  }

  // Do NOT force arbitrary filler text! Return empty string so visual is clean and natural.
  return '';
}

/**
 * Detect the dominant business / subject domain of the entire video
 * so that all scenes remain visually grounded in this world rather than floating in isolation.
 */
function extractDomainAnchor(videoTitle, sceneTitle, sceneText) {
  const title = String(videoTitle || '').trim();
  const usefulTitle = /^(kịch bản( video)?|video( script)?|untitled|video giải thích mới)$/iu.test(title) ? '' : title;
  const source = String(sceneText || sceneTitle || '').trim();
  const topic = (usefulTitle || source).slice(0, 600) || 'Use only the supplied narration';
  return {
    topic,
    topicVn: topic,
    props: '',
    environment: 'Only the setting supported by the narration; omit the background if no setting is specified',
  };
}

/**
 * Dynamic Universal Visual Beat Planner (Offline Fallback)
 * Analyzes sentence structure dynamically and grounds every beat in the video's core domain.
 */
function createLocalBeatPlan({ beatText, sceneText, sceneTitle, videoTitle, overallTopic, recentPlans = [] }) {
  const domain = extractDomainAnchor(overallTopic || videoTitle, sceneTitle, sceneText);
  const plan = localDirection({ beatText, sceneText, domain, history: recentPlans });
  const metrics = extractBasicMetrics(beatText || '');
  if (metrics.percentage || metrics.money) {
    plan.keyText = metrics.percentage || metrics.money;
    plan.visualMethod = 'numbers';
  }
  return finalizeDirection(plan, recentPlans, buildWhiteboardPrompt);
}

/**
 * AI Visual Planner with Smart Multi-Tier AI Support (Gemini + OpenAI)
 */
async function planVisualBeatsWithAI({
  scene,
  beats,
  styleGuide,
  geminiApiKey,
  openaiApiKey,
  previousMethod,
  videoTitle,
  overallTopic,
  fullScriptContext,
  recentPlans = [],
}) {
  const apiKey = geminiApiKey || process.env.GEMINI_API_KEY || '';
  const oaiKey = openaiApiKey || process.env.OPENAI_API_KEY || '';

  if (!apiKey && !oaiKey) return null;

  try {
    const beatsSummary = beats
      .map((b, i) => `Beat ${i + 1} (${b.duration_in_seconds}s): "${b.text}"`)
      .join('\n');

    const dominantTopic = overallTopic || videoTitle || scene.title || 'Explainer Video';

    const prompt = `You are a World-Class Storyboard Visual Director for high-impact YouTube explainer animations (style of Kurzgesagt, Vox, Polymatter, Casually Explained).

OVERARCHING VIDEO TOPIC & DOMAIN (BẮT BUỘC NEO CHỦ ĐỀ CHÍNH):
- Dominant Video Topic: "${dominantTopic}"
${fullScriptContext ? `- Full Script Context: "${fullScriptContext.substring(0, 12000)}..."` : ''}

CURRENT SCENE CONTEXT:
- Scene Title: "${scene.title}"
- Scene Narration: "${scene.text}"

Segmented Visual Beats to plan (${beats.length} beats):
${beatsSummary}

Previous visual method: "${previousMethod || 'none'}"
RECENT SHOTS ACROSS THE VIDEO (do not repeat the same subject/action/layout):
${JSON.stringify(recentPlans.slice(-6).map(p => ({ action: p.what_to_show || p.action, objects: p.objects, shot: p.shotType, setting: p.environment })))}

Plan this sequence as successive visual evidence for the narration, not repeated illustrations of the topic.
Each beat must add a distinct narrated idea or detail. Change the focal action AND framing between adjacent beats.
Use close object details, interactions, establishing views or top-down arrangements when the meaning supports them.
Domain grounding needs only one relevant cue, NOT the full room and every domain prop in every image.
Do not put a stickman presenter, board, treatment chair or desk in every image.
Keep the SAME amber orange accent, black strokes, white background and character proportions throughout.
Do not invent numerical results, comparisons or services absent from the narration. No charts without source data.

YOUR MISSION:
Plan out visually rich, contextually anchored whiteboard doodle beats.

CRITICAL DIRECTIVE #1 - THEMATIC DOMAIN GROUNDING (QUY TẮC SỐNG CÒN: MỌI HÌNH PHẢI NEO THEO CHỦ ĐỀ CHÍNH):
- The entire video is about: "${dominantTopic}".
- EVERY SINGLE SCENE AND BEAT MUST BE VISUALLY ANCHORED IN THIS SPECIFIC DOMAIN: "${dominantTopic}".
- ABSOLUTELY BANNED: NEVER generate generic, disconnected clip-art metaphors (e.g. NEVER draw a generic stickman climbing a generic arrow, NEVER draw generic floating lightbulbs, NEVER draw generic trophies, NEVER draw generic podiums, NEVER draw an abstract house or office unless specifically relevant to ${dominantTopic}).
- INSTEAD: Always translate abstract concepts (growth, demand, location, marketing, risk, revenue, maintenance) into CONCRETE REAL-WORLD ACTIONS within the world of "${dominantTopic}".
  * Example: If the video is about Bicycle Rental:
    - "Steady customer demand" -> Stickman customers (students, workers, tourists) riding rental bicycles along a park lane or picking up bikes at a busy bike rack.
    - "Flexible location" -> A stickman setting up a mobile bicycle rental booth with a row of 5 bicycles near a university campus gate or beach promenade.
    - "Good customer service" -> A smiling customer returning a rental bicycle at the rental counter, receiving a member discount card from the bicycle shop owner.
    - "Expenses & Maintenance" -> A stickman mechanic wearing an apron repairing a bicycle wheel and oiling a chain in a bike workshop corner.
  * Every beat needs a relevant domain cue, but only the subjects and props needed for its specific narrated idea.

CRITICAL DIRECTIVE #2 - NO GENERIC PHRASES:
- NEVER use vague filler like "diễn đạt trực quan", "visual representation", "explaining concept", "illustrating the idea", or raw narration repetition.

CRITICAL DIRECTIVE #3 - ART STYLE:
Every beat's "imageGenerationPrompt" MUST strictly follow this exact template:
"A hyper-minimalist whiteboard animation doodle, Pictionary drawing style, horizontal 16:9 widescreen composition with generous white padding. {Action description in English, grounded in ${dominantTopic}}. {Text clause: either 'The text \"{1-2 concept words}\" is written clearly and boldly, placed safely inside the illustration.' OR 'Pure visual storytelling with absolutely NO on-screen text, NO letters, and NO words.'} Characters are absolute pure stickmen with an empty circle for a head, absolutely NO facial features, NO eyes, NO mouth, and single thin black lines for bodies and limbs. Drawn with thick black marker outlines. Completely FLAT colors, ZERO shading, ZERO drop shadows under feet, NO gray tones, NO 3D effects. All text, characters, and drawing elements are well within the safe zone, arranged according to the specified composition with at least 15% clear white margin from all edges. Pure white background with ONLY ONE subtle amber orange accent color used for highlights. Clean, extremely simplified 2D flat vector explainer video illustration."

CRITICAL DIRECTIVE #4 - DIVERSE VISUAL METHODS:
Choose the method that explains the narration. Vary actions, focal objects, setting and shot size; changing a method label alone is not diversity. Use comparison only for a narrated contrast, and numbers only for supplied metrics.

CRITICAL DIRECTIVE #5 - KEY TEXT DIRECTIVES & VARIETY:
- "keyText": 1-2 meaningful, punchy CONCEPTUAL words in UPPERCASE (e.g. "MAINTENANCE", "LOCATION", "PROFIT", "80%"), OR leave as empty string "" for pure visual storytelling.
- NEVER use arbitrary narration fragments or grammatical connectors (e.g. NEVER "IF WE TALK", "AND MAKE THE", "WHILE ONE", "OF THE", "CHÚNG TA CẦN", "BICYCLES NOT NEED").
- VARIETY (CRITICAL): Do NOT force text onto every scene! At least 50% of the beats MUST have "keyText": "" (empty string) to allow pure visual comic storytelling without clutter.
- Only use text when highlighting a crucial concept keyword, contrast, or number.

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
    "keyText": "1-2 UPPERCASE CONCEPT WORDS or empty string \"\" for pure visual",
    "environment": "Specific setting needed by this action, omit unrelated room details",
    "imageGenerationPrompt": "Full English image prompt following the exact ART STYLE rule above."
  }
]`;

    const normalizeBeatArray = (json) => {
      if (!Array.isArray(json) || json.length !== beats.length) return null;
      const sequence = [...recentPlans];
      const normalizedPlans = json.map((p, idx) => {
        const whatToShow = p.what_to_show || `${p.subject || 'Stickman character'} in relevant scene`;
        const howToShow = p.how_to_show || `${p.action || 'interacting with elements'}`;
        let keyText = (p.keyText || '').substring(0, 20).toUpperCase().trim();
        if (
          !keyText ||
          BEAT_STOPWORDS.has(keyText.toLowerCase()) ||
          /^(IF WE|AND MAKE|WHILE ONE|THE MAIN|BICYCLES NOT|Ý CHÍNH|CHỦ ĐỀ|CẢNH|SCENE|BEAT)$/i.test(keyText)
        ) {
          keyText = '';
        }
        const normalized = {
          planningSource: 'ai',
          meaning: beats[idx].text || beats[idx].caption || p.meaning || '',
          what_to_show: whatToShow,
          how_to_show: howToShow,
          subject: p.subject || 'Chủ thể chính',
          action: p.action || howToShow,
          objects: Array.isArray(p.objects) ? p.objects : [],
          environment: p.environment || dominantTopic,
          composition: p.composition || 'Center focused',
          shotType: p.shotType || 'medium',
          visualMethod: p.visualMethod || 'character_action',
          keyText,
          mustNotInclude: [],
          transitionIntent: '',
        };
        if (repeatedSubject(normalized, sequence)) return null;
        const directed = finalizeDirection(normalized, sequence, buildWhiteboardPrompt);
        sequence.push(directed);
        return directed;
      });
      return normalizedPlans.every(Boolean) ? normalizedPlans : null;
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
 * Preserve the narration when image providers fail rather than inventing a visual metaphor.
 */
function generateSemanticSvgForBeat({ beat, scene, styleGuide }) {
  return renderNarrationFallback(beat);
}

function renderNarrationFallback(beat) {
  const narration = beat.text || beat.caption || beat.plan?.meaning || '';
  const lines = [];
  for (const word of narration.split(/\s+/).filter(Boolean)) {
    if (!lines.length || `${lines.at(-1)} ${word}`.length > 62) lines.push(word);
    else lines[lines.length - 1] += ` ${word}`;
  }
  const fontSize = Math.min(48, 680 / Math.max(1, lines.length) / 1.5);
  const lineHeight = fontSize * 1.5;
  const top = 540 - ((lines.length - 1) * lineHeight) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <rect width="1920" height="1080" fill="white"/>
    <path d="M260 250V830" stroke="#D97706" stroke-width="8"/>
    <text font-family="Arial, sans-serif" font-size="${fontSize}" fill="#171717">
      ${lines.map((line, i) => `<tspan x="320" y="${top + i * lineHeight}">${escapeXml(line)}</tspan>`).join('')}
    </text>
  </svg>`;
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
  buildWhiteboardPrompt,
  getSubtleAccentColor,
  extractDomainAnchor,
};
