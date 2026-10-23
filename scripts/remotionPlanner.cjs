const { ChatGPTBrowser, parseJSON } = require('./chatgptBrowser.cjs');
const { TYPES, ATTRS, EMOTIONS, DEFS, ENUM_ATTRS, MOTION_FIELDS, ANIMATE_ATTRS, BOOLEAN_FIELDS } = require('./remotionSchema.cjs');
const { inspectShot, applyRepairs } = require('./remotionInspection.cjs');
const { prepareShot } = require('./remotionNormalize.cjs');
const { STYLE, compactContext } = require('./remotionPrompts.cjs');
const request = async prompt => parseJSON(await ChatGPTBrowser.getInstance().request(prompt));
const words = text => String(text).trim().split(/\s+/u);

async function planStory(text, title, density, ask = request, options = {}) {
  const tokens = words(text);
  const maxScenes = Math.max(1, Math.ceil((options.seconds || tokens.length / 3.4) / 6));
  const result = await ask(`Plan a 2D narrated story. Return JSON only, no explanation.
${STYLE}
Use at most ${maxScenes} scenes, each a continuous situation lasting about 5–9 seconds. Keep related narration together. Each scene uses ONE stable set and a sequential action chain (anticipation, contact, result, reaction). No shot lists, inserts, reaction cuts or word-by-word scene changes. Keep cast, proportions and prop ownership consistent; show data as a readable change within the same composition. Preserve source wording using indexed ranges, start inclusive/end exclusive. First startWord=0, final endWord=${tokens.length}.
JSON: {"bible":{"premise":"...","cast":[{"id":"leo","hero":true,"role":"..."}],"locations":[{"id":"room","description":"..."}],"arc":"..."},"scenes":[{"title":"...","startWord":0,"endWord":${tokens.length},"direction":"location, cast, action, resulting state","actions":["prepare","contact","result","reaction"],"layout":{"setting":"studio","subject":"Leo","prop":"laptop","subjectX":305,"propX":514}}]}
Title:${title}; pacing: few continuous scenes, regardless of image density
WORDS:${tokens.map((word,index)=>`${index}:${word}`).join(' ')}`);
  if (!Array.isArray(result.scenes) || !result.scenes.length || result.scenes.length > 150) throw new Error('ChatGPT chưa trả về phân cảnh hợp lệ.');
  if (result.scenes.length > maxScenes) throw new Error(`Too many scenes: ${result.scenes.length}; combine related ideas into at most ${maxScenes} continuous scenes.`);
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
    return { actions: Array.isArray(scene.actions) ? scene.actions.slice(0,6).map(String) : [], layout: scene.layout || {}, title: String(scene.title || `Cảnh ${index + 1}`).slice(0, 160), text, direction: String(scene.direction || '').slice(0, 4000) };
  });
  if (cursor !== tokens.length) throw new Error('Phân cảnh chưa bao phủ toàn bộ lời thoại.');
  scenes.bible = result.bible || {};
  scenes.outline = scenes.map(({ title, direction }) => ({ title, direction }));
  return scenes;
}

function shotPrompt(input) {
  const { text, direction, seconds, instruction, current } = input;
  return `Create ONE continuous animated scene. Stable set/camera; sequential actions throughout. No internal cuts. Return JSON only; no React/code or explanation.
${STYLE}
1920x1080; keep focal action within y56..1024 (black bars added). Layers draw back to front.
JSON: {"version":1,"styleId":"STICKMAN_500IQ_V1","direction":"action and continuity","background":"#C9BAA2","camera":{"focusX":960,"focusY":540,"scale":1},"layers":[{"id":"leo","type":"character","hero":true,"x":500,"y":350,"scale":1,"emotion":"calm","rightHandX":{"keys":[{"at":0,"value":55},{"at":0.6,"value":140},{"at":1,"value":140,"ease":"hold"}]}}]}
Types:${TYPES.join(',')}. Shape attrs:${ATTRS.join(',')}. Colors:hex,none,url(#id); definition IDs:${DEFS.join(',')}. Numeric dimensions; text uses layer.text, not attrs.text. Emotions:${EMOTIONS.join(',')}.
Attribute enums:${JSON.stringify(ENUM_ATTRS)}. Use only listed keys; SVG attributes go in attrs using camelCase. No CSS style/transform strings.
Motion fields:${MOTION_FIELDS.join(',')}. Value:number OR {from,to,start:0,end:1} OR {keys:[{at:0,value:0,ease:"smooth"},{at:1,value:1}]}. Times are 0..1 fractions, keys strictly ordered; ease:smooth|linear|hold. Visibility:enter/exit 0..1. Booleans:${BOOLEAN_FIELDS.join(',')}. animate only:${ANIMATE_ATTRS.join(',')}.
Character origin=head; shoulder=(±31,108), feet y440 standing/y330 seated, arms reach max250. Hand endpoints are local coordinates. Use character children with attachment:"leftHand"|"rightHand" for held props. Stop stride at rest. Group via children. animate maps numeric SVG attrs to motion values. Camera focusX/focusY is world point centered on screen; scale zooms. Keep contact visible and hold after result. Max250 layers,8 levels. No external assets,href,events,HTML/styles.
Rotation pivots at layer local (0,0): position the group at the hinge/clock center and draw rotating geometry around zero. Phone preset bounds are x±154,y±284: a hand-held phone child needs scale 0.10–0.16, x:0,y:-25; never scale:1. Use phone:true for a simple attached phone, OR a child phone, never both. A held prop stays attached to the hand. Faces visible. Head radius≈65, height≈505; align furniture to hips/feet. Reusable props:phone,mug,steam,signal. kitchen is a full-room preset; leak:true and flow:1→0 animate its sink at (727,621).
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
  return [{ weight: 1, shot: await planShot(input, ask) }];
}
module.exports = { planStory, planShot, planSequence, shotPrompt };
