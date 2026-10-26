const { ChatGPTBrowser, parseJSON } = require('./chatgptBrowser.cjs');
const { TYPES, ATTRS, EMOTIONS, DEFS, ENUM_ATTRS, MOTION_FIELDS, ANIMATE_ATTRS, BOOLEAN_FIELDS } = require('./remotionSchema.cjs');
const { inspectShot, applyRepairs } = require('./remotionInspection.cjs');
const { prepareShot } = require('./remotionNormalize.cjs');
const { STYLE, compactContext } = require('./remotionPrompts.cjs');
const request = async (prompt, options) => parseJSON(await ChatGPTBrowser.getInstance().request(prompt, options));
const words = text => String(text).trim().split(/\s+/u);

async function planStory(text, title, density, ask = request, options = {}) {
  const {skill,inspectSceneList,toStoryboard}=require('./remotionSceneList.cjs');
  const idea=options.inputKind==='idea';
  const seconds=Math.max(2,options.seconds || (idea ? (options.sceneCount||10)*4.5 : words(text).length/3.2/(options.speed||1)));
  const min=Math.ceil(seconds/6),max=Math.max(min,Math.floor(seconds/2));
  const count=options.sceneCount;
  if(min>150 || (count!==undefined && (!Number.isInteger(count)||count<min||count>max||count>150)))throw new Error(`Audio requires ${min}–${max} scenes of 2–6 seconds.`);
  const base=`${skill()}\n${count===undefined ? `Choose ${min}–${Math.min(max,150)} scenes by story turns, not equal text chunks; prefer fewer scenes. Total` : `Plan ${count} scenes for`} ${seconds.toFixed(2)} seconds. Each scene is one continuous action chain, no internal cuts. ${idea?'Develop the raw idea into a complete narrative arc and write concise Vietnamese narration for each scene.':'Preserve all source narration in order.'} The examples are not the requested story.\nTITLE:${title}\nSOURCE NARRATION:${text}`;
  let prompt=base,candidate,inspection,lastError;
  let reviewIndices;
  for(let attempt=0;attempt<4;attempt++) {
    try {
      const response=await ask(prompt);
      candidate=inspection?.issues.length && !inspection.issues.some(i=>!i.path) ? applyRepairs(candidate,inspection.issues,response) : response;
      inspection=inspectSceneList(candidate,{requireStory:true});candidate=inspection.data;
      if(Array.isArray(candidate?.scenes)&&(count===undefined ? candidate.scenes.length<min || candidate.scenes.length>Math.min(max,150) : candidate.scenes.length!==count))inspection.issues.push({path:'/scenes',message:`Return ${count===undefined ? `${min}–${Math.min(max,150)}` : count} scenes; keep related actions together.`});
      if(!inspection.issues.length) {
        try { inspection.issues=await require('./remotionReliability.cjs').retryPart(()=>require('./remotionVisualStory.cjs').reviewVisualStory(candidate,ask,reviewIndices),{attempts:3}); } catch(error) {error.retryExhausted=true;throw error;}
        reviewIndices=inspection.issues.map(issue=>Number(issue.path.split('/')[2]));
      }
      if(!inspection.issues.length)return toStoryboard(candidate,idea?candidate.scenes.map(s=>s.audio.narration_subtitle).join(' '):text,seconds,!idea);
      lastError=new Error('Scene List needs corrections.');lastError.issues=inspection.issues;
    } catch(error) {if(error.retryExhausted)throw error;lastError=error;}
    const issues=inspection?.issues.length ? inspection.issues : [{path:'',message:lastError.message}];
    prompt=`FIX THESE ITEMS FIRST:${JSON.stringify(issues)}\n${issues.some(i=>!i.path)?'Return a complete corrected Scene List JSON.':'Return {"repairs":[{"path":"exact reported path","value":"replacement"}]}. Fix ALL reported fields; keep accepted fields unchanged.'}\nCURRENT:${JSON.stringify(candidate)}\n${base}`;
  }
  lastError.retryExhausted=true;throw lastError;
}

function shotPrompt(input) {
  const { text, direction, seconds, instruction, current } = input;
  return `One continuous scene, one set, no internal cuts. Camera follows approved actions. Return JSON only.
${STYLE}
${input.approvedStory ? `APPROVED VISUAL CONTRACT:${JSON.stringify(input.approvedStory)}
Set: static environment shapes inside one g id="set", child IDs set-*. Keep moving props/people outside. ${input.setSummary ? `Existing set is injected unchanged; omit set. World landmarks:${JSON.stringify(input.setSummary)}` : 'Design layered foreground/action-plane/background with a clear light source. Keep the action plane readable.'}
Use approved framing and beats; no extra cuts, pulsing labels, idle zoom, flash transitions or unrelated effects.` : ''}
1920x1080; keep focal action within y56..1024 (black bars added). Layers draw back to front.
JSON: {"version":1,"styleId":"STICKMAN_500IQ_V1","direction":"action and continuity","background":"#C9BAA2","camera":{"focusX":960,"focusY":540,"scale":1},"layers":[{"id":"leo","type":"character","hero":true,"x":500,"y":350,"scale":1,"emotion":"calm","rightHandX":{"keys":[{"at":0,"value":55},{"at":0.6,"value":140},{"at":1,"value":140,"ease":"hold"}]}}]}
Types:${TYPES.join(',')}. Shape attrs:${ATTRS.join(',')}. Colors:hex,none,url(#id); definition IDs:${DEFS.join(',')}. Numeric dimensions; text uses layer.text, not attrs.text. Emotions:${EMOTIONS.join(',')}.
Attribute enums:${JSON.stringify(ENUM_ATTRS)}. Use only listed keys; SVG attributes go in attrs using camelCase. No CSS style/transform strings.
Motion fields:${MOTION_FIELDS.join(',')}. Value:number OR {from,to,start:0,end:1} OR {keys:[{at:0,value:0,ease:"smooth"},{at:1,value:1}]}. Times are 0..1 fractions, keys strictly ordered; ease:smooth|linear|hold. Visibility:enter/exit 0..1. Booleans:${BOOLEAN_FIELDS.join(',')}. animate only:${ANIMATE_ATTRS.join(',')}.
Character origin=head; feet y440. Front: shoulders±31,108, reach220. Side view facing:1 (right) or -1 (left): shoulders≈0,108, reach160, hands rest y265. Use side view for walking. Hands use local coordinates. Use character children with attachment:"leftHand"|"rightHand" for held props. Walking: walking:true, fixed facing/y/scale, animate x; omit stride. Hands clamp to reach; place contact targets within reach. Group with children; animate holds numeric SVG attrs. Camera focusX/focusY is world point centered on screen; scale zooms. Show contact then result. Max250 layers,8 levels. No external assets,href,events,HTML/styles.
Rotation pivots at layer local (0,0): position the group at the hinge/clock center and draw rotating geometry around zero. Phone preset bounds are x±154,y±284: a hand-held phone child needs scale 0.10–0.16, x:0,y:-25; never scale:1. Use phone:true for a simple attached phone, OR a child phone, never both. A held prop stays attached to the hand. Head radius≈60; align furniture to hips/feet. Reusable props:phone,mug,steam,signal. Use g/shapes if the character preset cannot match the approved appearance.
NARRATION:${text}
DURATION:${seconds}s
STORY BIBLE / OUTLINE / CONTINUITY:${JSON.stringify(compactContext({...input,direction:undefined}))}
DIRECTOR PLAN:${typeof direction === 'string' ? direction : JSON.stringify(direction || {})}
${current ? `CURRENT DESIGN:${JSON.stringify(current)}\nREQUESTED EDIT:${instruction || ''}` : ''}`;
}
async function planShot(input, ask = request, options = {}) {
  const basePrompt = shotPrompt(input);
  let prompt = basePrompt, lastError, candidate, inspection;
  let repairFailures = 0;
  const total = 6;
  for (let attempt = options.initial === undefined ? 0 : -1; attempt < total; attempt++) {
    try {
      options.assertRunning?.();
      options.onProgress?.({attempt:Math.max(1,attempt+1),total});
      const response = attempt === -1 ? options.initial : await ask(prompt, {images:options.getRepairImages?.() || []});
      options.assertRunning?.();
      candidate = inspection && !inspection.issues.some(issue=>!issue.path) ? applyRepairs(candidate,inspection.issues,response) : response;
      if(options.set && candidate?.layers)candidate=require('./remotionStageAssets.cjs').applySet(candidate,options.set);
      inspection = inspectShot(candidate,options.onWarning);
      candidate = inspection.data;
      if (candidate && typeof candidate === 'object') await options.onDraft?.(candidate);
      if(!inspection.issues.length && input.approvedStory && !options.set && !require('./remotionStageAssets.cjs').extractSet(candidate))inspection.issues.push({path:'/layers',message:'Include one static environment group id=set with only shape/g layers. Actors and moving props must be outside it.'});
      if(!inspection.issues.length)candidate=prepareShot(candidate,options.onWarning);
      let visualReviewFailed=false;
      if(!inspection.issues.length && options.inspectRendered) {try {inspection.issues=await options.inspectRendered(candidate);visualReviewFailed=inspection.issues.length>0;}catch(error){error.retryExhausted=true;throw error;}}
      if(!inspection.issues.length) return prepareShot(candidate,options.onWarning);
      lastError = new Error('Shot requires corrections.');
      if(visualReviewFailed)lastError.code='VISUAL_QUALITY';
      lastError.issues = inspection.issues;
    } catch(error) {
      options.assertRunning?.();
      if(error.retryExhausted)throw error;
      lastError=error;
      repairFailures++;
    }
    if (repairFailures >= 2 || attempt >= 3) {
      inspection = {issues:[{path:'',message:`Rebuild this scene from the approved contract. Previous attempt: ${lastError.message}. Return a complete shot, not repairs. Keep the approved cast, setting, action and timing; simplify geometry if necessary.`}]};
    }

    const issues = inspection?.issues || [{path:'',message:lastError.message}];
    prompt = `FIX THESE ITEMS FIRST: ${JSON.stringify(issues)}\n${inspection && !issues.some(issue=>!issue.path) ? 'Return JSON only: {"repairs":[{"path":"/layers/0/x","value":100}]}. Use reported paths or their child paths; prefer the smallest necessary change. Use remove:true only for optional fields. Do not return a new shot or alter any accepted field. Fix ALL listed issues in this response.' : 'The response is unusable. Return one complete valid shot JSON.'}\n${lastError?.issues ? '' : `Last repair problem: ${lastError.message}\n`}CURRENT SHOT:${JSON.stringify(candidate)}\n${options.getRepairImages?.().length ? "The attached contact sheet is the ACTUAL render of CURRENT SHOT. Use it to locate the defect. For touch/contact, solve one shared world-space point for fingertip and target, accounting for every parent translation/scale. Seated characters use the front rig: shoulder (+/-31,108), total arm reach 220; targets beyond reach are clamped. Bring props into reach instead of extending hand values beyond the limit. Preserve accepted layers.\n" : ""}CONTRACT:\n${basePrompt}`;
  }
  lastError.retryExhausted = true;
  throw lastError;
}
async function planSequence(input, ask = request) {
  return [{ weight: 1, shot: await planShot(input, ask) }];
}
module.exports = { planStory, planShot, planSequence, shotPrompt };
