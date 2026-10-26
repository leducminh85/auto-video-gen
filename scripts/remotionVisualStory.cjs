const ROLES=['hook','context','evidence','mechanism','data','consequence','reaction'];
const FRAMINGS=['wide','medium','close','insert','over_shoulder','pov','comparison'];
const text=v=>typeof v==='string'&&v.trim().length>0;
function inspectDirection(d,path) {
 const issues=[],add=(key,message)=>issues.push({path:`${path}/${key}`,message});
 if(!d||typeof d!=='object'||Array.isArray(d))return [{path,message:'Provide the visual storytelling contract, not a generic illustration.'}];
 for(const field of ['sequence','intent','evidence','before','after','focus','cut_reason'])if(!text(d[field]))add(field,'Describe a specific visible story fact.');
 if(!ROLES.includes(d.role))add('role',`Choose ${ROLES.join(',')}.`);
 if(!FRAMINGS.includes(d.framing))add('framing',`Choose ${FRAMINGS.join(',')}.`);
 if(text(d.before)&&d.before.trim()===d.after?.trim())add('after','Show a changed state or newly revealed evidence, not the same picture.');
 if(!Array.isArray(d.beats)||!d.beats.length||d.beats.length>4)add('beats','Use 1–4 observable beats, not a mandatory four-step formula.');
 else {
  let previous=-1;
  d.beats.forEach((b,i)=>{if(!b||!Number.isFinite(b.at)||b.at<0||b.at>=1||b.at<=previous||!text(b.action))add(`beats/${i}`,'Use increasing at fractions in [0,1), plus observable action.');previous=b?.at;});
 }
 return issues;
}
function approvedBoard(scene) {
 const d=scene.scene_spec?.story;
 if(!d)return null;
 const issues=inspectDirection(d,'/story');
 if(issues.length)throw Object.assign(new Error('Storyboard cần sửa chỉ dẫn hình ảnh.'),{issues});
 const words=scene.text.trim().split(/\s+/u);
 const beats=scene.actions?.length ? scene.actions.map((action,i)=>({at:d.beats[i]?.at??i/scene.actions.length,action})) : d.beats;
 return {source:'approved_visual_story',review:{passed:true,scope:'human_approved_plan'},shots:[{
  startWord:0,endWord:words.length,role:d.role,framing:d.framing,focalSubject:d.focus,visualMeaning:d.evidence,
  action:scene.direction,cameraMovement:scene.scene_spec.camera_movement,effects:scene.scene_spec.vfx,characterStates:scene.scene_spec.character_states,composition:scene.layout,incomingState:d.before,outgoingState:d.after,sequence:d.sequence,cutReason:d.cut_reason,
  events:beats.map(b=>({word:Math.min(words.length-1,Math.floor(b.at*words.length)),at:b.at,action:b.action})),
 }]};
}
async function reviewVisualStory(list,ask,indices=list.scenes.map((_,i)=>i)) {
 const allIssues=[];
 for(let offset=0;offset<indices.length;offset+=6) {
 const batch=indices.slice(offset,offset+6);
 const context=new Set(batch.flatMap(i=>[i-1,i,i+1]).filter(i=>i>=0&&i<list.scenes.length));
 const result=await ask(`REVIEW VISUAL STORY. Return JSON only: {"passed":true,"issues":[]} or {"passed":false,"issues":[{"scene":0,"message":"specific observable correction"}]}.
Evaluate only scene indices ${batch.join(',')}; neighbors are continuity context. Flag weak visual meaning, narration merely restated as text/icons, repeated staging with no new evidence, unsupported facts or broken cause/effect. A reaction/insert can carry ONE beat; do not demand all phases in every shot. Transitions need a new fact, viewpoint or time/place change. Do not demand effects, extra cuts or a hook in every scene. List ALL material problems together, max 2 concise issues per scene. Do not judge pixels you have not seen.
SCENES:${JSON.stringify(list.scenes.flatMap((s,i)=>context.has(i)?[{i,narration:s.audio.narration_subtitle,location:s.location,action:s.visual_action,story:s.story}]:[]))}`);
 if(typeof result?.passed!=='boolean'||!Array.isArray(result.issues)||result.passed!==!result.issues.length)throw new Error('Visual story review must return passed and issues.');
 const byScene=new Map();
 for(const issue of result.issues) {
  if(!Number.isInteger(issue.scene)||!batch.includes(issue.scene)||!text(issue.message))throw new Error('Visual review must identify an affected scene index.');
  byScene.set(issue.scene,[...(byScene.get(issue.scene)||[]),issue.message]);
 }
 allIssues.push(...[...byScene].map(([i,messages])=>({path:`/scenes/${i}`,message:messages.join(' ')})));
 }
 return allIssues;
}
module.exports={ROLES,FRAMINGS,inspectDirection,approvedBoard,reviewVisualStory};
