const { ChatGPTBrowser, parseJSON } = require('./chatgptBrowser.cjs');
const { TYPES, ATTRS, EMOTIONS, DEFS, ENUM_ATTRS, MOTION_FIELDS, ANIMATE_ATTRS, BOOLEAN_FIELDS } = require('./remotionSchema.cjs');
const { inspectShot, applyRepairs } = require('./remotionInspection.cjs');
const { prepareShot } = require('./remotionNormalize.cjs');
const { STYLE, compactContext } = require('./remotionPrompts.cjs');
const request = async prompt => parseJSON(await ChatGPTBrowser.getInstance().request(prompt));
const words = text => String(text).trim().split(/\s+/u);

async function planStory(text, title, density, ask = request, options = {}) {
  const tokens = words(text);
  const result = await ask(`Plan a 2D narrated story. Return JSON only, no explanation.
${STYLE}
Split by narrative idea. Keep cast, locations and prop ownership consistent. Each scene needs one clear visual action; vary wide shots, mechanism inserts and reactions. Preserve source wording using indexed ranges, start inclusive/end exclusive. First startWord=0, final endWord=${tokens.length}.
JSON: {"bible":{"premise":"...","cast":[{"id":"leo","hero":true,"role":"..."}],"locations":[{"id":"room","description":"..."}],"arc":"..."},"scenes":[{"title":"...","startWord":0,"endWord":${tokens.length},"direction":"location, cast, action, resulting state"}]}
Title:${title}; pacing:${density}
WORDS:${tokens.map((word,index)=>`${index}:${word}`).join(' ')}`);
  if (!Array.isArray(result.scenes) || !result.scenes.length || result.scenes.length > 150) throw new Error('ChatGPT chưa trả về phân cảnh hợp lệ.');
  if (options.relaxed) {
    const { spreadTiming } = require('./remotionReliability.cjs');
    result.scenes = result.scenes.slice(0, tokens.length);
    const starts = spreadTiming(result.scenes.map(scene => Math.max(1, Number(scene.endWord) - Number(scene.startWord) || 1)), tokens.length, result.scenes.map(scene => Number.isFinite(Number(scene.startWord)) ? Number(scene.startWord) : undefined));
    result.scenes = result.scenes.map((scene,i) => ({ ...scene, startWord: starts[i], endWord: starts[i+1] ?? tokens.length }));
  }
  let cursor = 0;
  const scenes = result.scenes.map((scene, index) => {
    if (scene.startWord !== cursor || !Number.isInteger(scene.endWord) || scene.endWord <= cursor || scene.endWord > tokens.length) throw new Error('Phân cảnh ChatGPT bị thiếu hoặc trùng lời thoại. Hãy thử lại.');
    const text = tokens.slice(cursor, scene.endWord).join(' ');
    cursor = scene.endWord;
    return { title: String(scene.title || `Cảnh ${index + 1}`).slice(0, 160), text, direction: String(scene.direction || '').slice(0, 4000) };
  });
  if (cursor !== tokens.length) throw new Error('Phân cảnh chưa bao phủ toàn bộ lời thoại.');
  scenes.bible = result.bible || {};
  scenes.outline = scenes.map(({ title, direction }) => ({ title, direction }));
  return scenes;
}

function shotPrompt(input) {
  const { text, direction, seconds, instruction, current } = input;
  return `Create ONE animated vector shot. Return JSON only; no React/code or explanation.
${STYLE}
1920x1080; keep focal action within y56..1024 (black bars added). Layers draw back to front.
JSON: {"version":1,"styleId":"STICKMAN_500IQ_V1","direction":"action and continuity","background":"#C9BAA2","camera":{"focusX":960,"focusY":540,"scale":1},"layers":[{"id":"leo","type":"character","hero":true,"x":500,"y":350,"scale":1,"emotion":"calm","rightHandX":{"keys":[{"at":0,"value":55},{"at":0.6,"value":140},{"at":1,"value":140,"ease":"hold"}]}}]}
Types:${TYPES.join(',')}. Shape attrs:${ATTRS.join(',')}. Colors:hex,none,url(#id); definition IDs:${DEFS.join(',')}. Numeric dimensions; text uses layer.text, not attrs.text. Emotions:${EMOTIONS.join(',')}.
Attribute enums:${JSON.stringify(ENUM_ATTRS)}. Use only listed keys; SVG attributes go in attrs using camelCase. No CSS style/transform strings.
Motion fields:${MOTION_FIELDS.join(',')}. Value:number OR {from,to,start:0,end:1} OR {keys:[{at:0,value:0,ease:"smooth"},{at:1,value:1}]}. Times are 0..1 fractions, keys strictly ordered; ease:smooth|linear|hold. Visibility:enter/exit 0..1. Booleans:${BOOLEAN_FIELDS.join(',')}. animate only:${ANIMATE_ATTRS.join(',')}.
Character origin=head; shoulder=(±31,108), feet y440 standing/y330 seated, arms reach max250. Hand endpoints are local coordinates. Use character children with attachment:"leftHand"|"rightHand" for held props. Stop stride when walking stops. Groups use children. animate maps numeric SVG attrs to motion values. Camera focusX/focusY is world point centered on screen; scale zooms. Keep contact visible and hold after result. Only relevant effects; max250 layers,8 nesting levels. No external assets,href,events,HTML/styles.
Reusable props:phone,mug,steam,signal. kitchen is a full-room preset; leak:true and flow:1→0 animate its sink at (727,621).
NARRATION:${text}
DURATION:${seconds}s
STORY BIBLE / OUTLINE / CONTINUITY:${JSON.stringify(compactContext({...input,direction:undefined}))}
DIRECTOR PLAN:${typeof direction === 'string' ? direction : JSON.stringify(direction || {})}
${current ? `CURRENT DESIGN:${JSON.stringify(current)}\nREQUESTED EDIT:${instruction || ''}` : ''}`;
}
async function planShot(input, ask = request, options = {}) {
  const basePrompt = shotPrompt(input);
  let prompt = basePrompt, lastError, candidate, inspection;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = attempt === 0 && options.initial !== undefined ? options.initial : await ask(prompt);
      candidate = inspection && !inspection.issues.some(issue=>!issue.path) ? applyRepairs(candidate,inspection.issues,response) : response;
      inspection = inspectShot(candidate,options.onWarning);
      candidate = inspection.data;
      if (candidate && typeof candidate === 'object') await options.onDraft?.(candidate);
      if(!inspection.issues.length) return prepareShot(candidate,options.onWarning);
      lastError = new Error('Shot requires corrections.');
      lastError.issues = inspection.issues;
    } catch(error) { lastError=error; }
    const issues = inspection?.issues || [{path:'',message:lastError.message}];
    prompt = `FIX THESE ITEMS FIRST: ${JSON.stringify(issues)}\n${inspection && !issues.some(issue=>!issue.path) ? 'Return JSON only: {"repairs":[{"path":"/layers/0/x","value":100}]}. Use exact reported paths. Use remove:true only for optional fields. Do not return a new shot or alter any accepted field. Fix ALL listed issues in this response.' : 'The response is unusable. Return one complete valid shot JSON.'}\n${lastError?.issues ? '' : `Last repair problem: ${lastError.message}\n`}CURRENT SHOT:${JSON.stringify(candidate)}\nCONTRACT:\n${basePrompt}`;
  }
  lastError.retryExhausted = true;
  throw lastError;
}
async function planSequence(input, ask = request) {
  const count = Math.max(1, Math.min(6, Math.ceil(input.seconds / 3.5)));
  let prompt = shotPrompt(input) + `
Instead of a single shot, return {"shots":[{"weight":1,"shot":<schema above>}]}. Design ${count} camera cuts covering this ${input.seconds}s scene. Weights allocate exact audio duration proportionally; sum need not be 1. Use cuts to reveal action details and reactions, not random new settings. Each shot must have a different purposeful framing and maintain cast/prop continuity. Describe the cut and incoming/outgoing state in direction. On a closeup, enlarge and reposition actors/props with intentional crop, background depth, no clipped focal action. Return all shots together so you can coordinate them. Review the sequence before returning: no floating props, no walking in place, visible contact and consequence, consistent cast, no static slideshow. Full schema in each shot.`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await ask(prompt);
      if (!Array.isArray(result.shots) || !result.shots.length || result.shots.length > 6) throw new Error('Expected 1..6 shots');
      const accepted = [];
      for (const item of result.shots) {
        const weight = Number.isFinite(Number(item.weight)) && Number(item.weight)>0 ? Math.min(100,Number(item.weight)) : 1;
        const shot = await planShot(input, ask, { initial:item.shot });
        accepted.push({weight,shot});
      }
      return accepted;
    } catch (error) {
      if (attempt || error.issues || error.retryExhausted) throw error;
      prompt = `Fix the response structure first: ${error.message}. Return the required shots array.\n` + prompt;
      prompt += `
Validation failed: ${error.message}. Return the entire corrected sequence.`;
    }
  }
}
module.exports = { planStory, planShot, planSequence, shotPrompt };
