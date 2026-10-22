const fs = require('node:fs');
const path = require('node:path');
const { ChatGPTBrowser, parseJSON } = require('./chatgptBrowser.cjs');
const { validateShot, TYPES, ATTRS, EMOTIONS, DEFS } = require('./remotionSchema.cjs');
const guide = () => fs.readFileSync(path.join(__dirname, '../docs/STYLE_GUIDE_NGUOI_QUE.md'), 'utf8');
const request = async prompt => parseJSON(await ChatGPTBrowser.getInstance().request(prompt));
const reference = () => fs.readFileSync(path.join(__dirname, '../docs/REMOTION_REFERENCE_DIRECTION.md'), 'utf8');
const words = text => String(text).trim().split(/\s+/u);

async function planStory(text, title, density, ask = request) {
  const tokens = words(text);
  const result = await ask(`Direct the ENTIRE narrated film before designing any SVG. Return ONLY JSON {"bible":{"premise":"visual cause and effect","cast":[{"id":"leo","hero":true,"scarf":false,"role":"goal and relationships"}],"locations":[{"id":"workshop","description":"stable geography, palette, lighting, recurring props"}],"arc":"setup, problem, attempt, consequence, payoff"},"scenes":[{"title":"short","startWord":0,"endWord":20,"direction":"location ID, cast IDs, incoming state, concrete action, outgoing state; planned wide/insert/reaction shots"}]}. Preserve every narration word in contiguous zero-based end-exclusive ranges covering all ${tokens.length} words. Segment by narrative event or sentence, NEVER by fixed word counts. A scene can contain multiple camera cuts. Pacing ${density}. Use a recurring lead and supporting cast where narration calls for interaction; each person needs a role and visible response, not decoration. Carry objects, screen direction, positions, and consequences between scenes. Plan anticipation -> contact -> result -> reaction. Do not invent factual claims. Abstract concepts need a concrete visual analogy or a readable diagram, not endless people standing beside text. Alternate establishing shots, inserts of mechanisms, POV, reaction closeups; no arbitrary camera motion. Title: ${title}
REFERENCE ANALYSIS:
${reference()}
STYLE GUIDE:
${guide()}
NARRATION WORDS:
${tokens.map((word, index) => `${index}:${word}`).join(' ')}`);
  if (!Array.isArray(result.scenes) || !result.scenes.length || result.scenes.length > 150) throw new Error('ChatGPT chưa trả về phân cảnh hợp lệ.');
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

function shotPrompt({ text, direction, seconds, previous, instruction, current, bible, outline }) {
  return `Act as a Remotion animation director. Design a complete original SVG scene using the attached style guide and existing Leo rig. Return ONLY JSON matching the schema below. This is declarative Remotion scene data, NOT React source code. Build meaningful environments, props, narrative action and readable composition, not a generic character standing next to a heading. Design depth layers in drawing order, ground contact, anticipation/action/reaction, restrained frame-driven movement. Do not claim data absent from narration. Keep continuity. Reuse the supplied character rig for all people. All coordinates are 1920x1080. Black bars y=0..56 and 1024..1080 are added automatically. x/y translate a layer; attrs x/y are coordinates inside it. Character origin is head center; feet at y+454*scale. Leo hero=true; supporting companion scarf=true. Never recolor Leo. Camera transforms around screen center. Motion start/end, enter/exit are fractions 0..1 of the shot, NOT frames. Set motion end>start; visibility defaults 0..1. Use one important text label at a time, Vietnamese if narration is Vietnamese. No paragraph-sized text. No external assets, code, HTML, href, event handlers, styles or arbitrary SVG tags. Draw complex objects with path or grouped shapes. Props held by a character must track the hand. layer "g" can contain children. Primitive shape dimensions must be numeric (not strings). Colors are hex or none or url(#definition). Avoid glow except on a relevant source.\nSCHEMA:\n{"version":1,"styleId":"STICKMAN_500IQ_V1","direction":"explain choreography and continuity","background":"#F3E8DC","camera":{"scale":{"from":1,"to":1.05}},"layers":[{"id":"unique-id","label":"editable layer name","type":"rect","attrs":{"x":0,"y":800,"width":1920,"height":280,"fill":"#8C6650"}},{"id":"leo","type":"character","hero":true,"x":500,"y":400,"scale":1,"emotion":"confident","phone":false,"walking":false,"talking":false,"raised":{"from":0,"to":0.4,"start":0.2,"end":0.5}}]}\nAllowed types: ${TYPES.join(', ')}. Allowed attrs: ${ATTRS.join(', ')}. Existing definitions: ${DEFS.join(', ')}. Emotions: ${EMOTIONS.join(', ')}. Motion fields x,y,scale,rotation,opacity,raised,look accept a number or {from,to,start?,end?}. Boolean fields hero,scarf,phone,walking,talking. Text layer uses text string outside attrs. Up to 250 layers, 8 nesting levels. Reusable authored scenery from the reference project: kitchen draws a detailed full 1920x1080 kitchen (leak:true opens sink cabinet and animates drips at x726 y716..800; sink x727 y621; flow motion 1 dripping, 0 repaired while cupboard/pipe/bucket remain visible). Use only when relevant. mug draws a steaming teacup at local origin and can attach to a hand. Reuse the exact same environment geometry across cuts, transformed or blurred for depth.
Additional supported animation fields:
Every motion field also accepts {keys:[{at:0,value:0,ease:"hold"},{at:0.2,value:0,ease:"smooth"},{at:0.5,value:100,ease:"hold"},{at:1,value:100}]}. 2..32 strictly ordered at fractions. ease belongs to the outgoing segment: linear, smooth, hold. Use anticipation, contact, settle and holds instead of constant drifting. Camera accepts the same keyframes. Prefer camera {focusX:726,focusY:700,scale:2.5} for an insert: focus is the world point placed at screen centre. Keep x/y offsets zero unless needed. Screen position = (world-focus)*scale + (960,540) + (x,y). Check this math for every focal object; do not crop the hand contact out of frame.
Character fields leftHandX,leftHandY,rightHandX,rightHandY are LOCAL hand endpoints relative to head, shoulder at +/-31,108, arm length max250. Independent hands, headTilt degrees, seated 0..1, stride phase radians (keyframed to stop gait when position stops), speech 0/1 keyframes for speaking turns; look -1..1. Feet y440 when standing,330 seated. Use x movement and stride together. Every supporting character has a face. character children can contain vector props with attachment:"leftHand" or "rightHand"; their local origin follows that hand. Do not duplicate held objects on the table after pickup. Use enter/exit for ownership changes. blur accepts motion for background focus pulls. animate accepts numeric motion for x,y,x1,y1,x2,y2,cx,cy,r,rx,ry,width,height,strokeDashoffset,opacity attributes, for drawing paths, filling bars and local impact effects. Never animate every layer together.
Use contact-timed sparks with 0.08..0.18 second lifespan, legible cause/effect, gaze toward partner or prop. Surround contact events with holds. Complex action needs multiple close/medium/wide cuts, not more labels.\nREFERENCE FILM ANALYSIS:\n${reference()}\nSTORY BIBLE: ${JSON.stringify(bible || {})}\nCOMPLETE STORY OUTLINE: ${JSON.stringify(outline || [])}\nSTYLE GUIDE:\n${guide()}\nNARRATION: ${text}\nDURATION: ${seconds}s\nDIRECTOR PLAN: ${direction || ''}\nPREVIOUS SHOT CONTINUITY: ${previous || 'Opening shot'}\n${current ? `CURRENT DESIGN: ${JSON.stringify(current)}\nREQUESTED EDIT: ${instruction}` : ''}`;
}
async function planShot(input, ask = request) {
  let prompt = shotPrompt(input);
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try { return validateShot(await ask(prompt)); }
    catch (error) { lastError = error; prompt += `\nYour previous response failed validation: ${error.message}. Return a complete corrected JSON design.`; }
  }
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
      return result.shots.map(item => {
        if (!Number.isFinite(item.weight) || item.weight <= 0 || item.weight > 100) throw new Error('Invalid shot weight');
        return { weight: item.weight, shot: validateShot(item.shot) };
      });
    } catch (error) {
      if (attempt) throw error;
      prompt += `
Validation failed: ${error.message}. Return the entire corrected sequence.`;
    }
  }
}
module.exports = { planStory, planShot, planSequence, shotPrompt };
