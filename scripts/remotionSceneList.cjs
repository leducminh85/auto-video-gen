const fs=require('node:fs');
const path=require('node:path');
const {spreadTiming}=require('./remotionReliability.cjs');
const skill=()=>fs.readFileSync(path.resolve(__dirname,'../.agents/skills/remotion-scene-director/SKILL.md'),'utf8').replace(/^---[\s\S]*?---\s*/, '');
const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const nonempty=v=>typeof v==='string'&&!!v.trim();
function inspectSceneList(raw, {requireStory=false}={}) {
 const data=structuredClone(raw),issues=[];
 const issue=(path,message)=>issues.push({path,message});
 if(!object(data)||!object(data.metadata)||!Array.isArray(data.scenes)||!data.scenes.length)return {data,issues:[{path:'',message:'Return metadata and a nonempty scenes array.'}]};
 const m=data.metadata;
 for(const key of ['title','theme'])if(!nonempty(m[key]))issue(`/metadata/${key}`,'Required text.');
 m.fps=30;
 if(!Array.isArray(m.characters)||!m.characters.length)issue('/metadata/characters','Declare characters with unique id and appearance.');
 const ids=new Set();
 for(const [i,c] of (Array.isArray(m.characters)?m.characters:[]).entries()){
  if(!object(c)||!nonempty(c.id)||!nonempty(c.appearance)||ids.has(c.id))issue(`/metadata/characters/${i}`,'Unique id and appearance required.');
  else ids.add(c.id);
 }
 if(!Array.isArray(m.locations)||!m.locations.length||m.locations.some(l=>!nonempty(l))||new Set(m.locations).size!==m.locations.length)issue('/metadata/locations','Declare unique location IDs.');
 for(const [i,s] of data.scenes.entries()){
  const p=`/scenes/${i}`;
  if(!object(s)){issue(p,'Scene must be an object.');continue;}
  s.scene_id=i+1;
  if(requireStory||s.story)issues.push(...require('./remotionVisualStory.cjs').inspectDirection(s.story,p+'/story'));
  const seconds=Number(s.duration_seconds);
  if(!Number.isFinite(seconds)||seconds<2||seconds>6)issue(p+'/duration_seconds','Use 2–6 seconds.');
  else {s.duration_frames=Math.round(seconds*30);s.duration_seconds=s.duration_frames/30;}
  if(!Array.isArray(m.locations)||!m.locations.includes(s.location))issue(p+'/location','Use a declared metadata location.');
  for(const key of ['camera_movement','visual_action'])if(!nonempty(s[key]))issue(p+'/'+key,'Required observable direction.');
  if(!object(s.character_states))issue(p+'/character_states','Map declared character IDs to pose and expression.');
  else for(const [id,state] of Object.entries(s.character_states)){
   if(!ids.has(id))issue(p+'/character_states/'+id,'Undeclared character.');
   if(!object(state)||!nonempty(state.pose)||!nonempty(state.expression))issue(p+'/character_states/'+id,'pose and expression required.');
  }
  if(!Array.isArray(s.vfx)||s.vfx.some(v=>!nonempty(v)))issue(p+'/vfx','Use a string array, possibly empty.');
  if(!object(s.audio))issue(p+'/audio','Narration, shadow_voice, sfx and music_mood required.');
  else {
   for(const key of ['narration_subtitle','shadow_voice','music_mood'])if(typeof s.audio[key]!=='string')issue(p+'/audio/'+key,'Use a string; empty is allowed.');
   if(!Array.isArray(s.audio.sfx)||s.audio.sfx.some(v=>!nonempty(v)))issue(p+'/audio/sfx','Use a string array.');
  }
  if(typeof s.remotion_component_suggestion!=='string'||!/^<[A-Z][A-Za-z0-9]*\s*\/>$/.test(s.remotion_component_suggestion))issue(p+'/remotion_component_suggestion','Component name only, e.g. <HomeScene />; no executable code.');
 }
 if(!issues.length){
  const pick=(o,keys)=>Object.fromEntries(keys.map(k=>[k,o[k]]));
  data.metadata={...pick(m,['title','fps','theme','locations']),characters:m.characters.map(c=>pick(c,['id','appearance']))};
  data.scenes=data.scenes.map(s=>({...(s.story?{story:s.story}:{}),...pick(s,['scene_id','duration_seconds','duration_frames','location','camera_movement','visual_action','vfx','remotion_component_suggestion']),character_states:Object.fromEntries(Object.entries(s.character_states).map(([id,state])=>[id,pick(state,['pose','expression'])])),audio:pick(s.audio,['narration_subtitle','shadow_voice','sfx','music_mood'])}));
 }
 return {data,issues};
}
function fitSceneFrames(weights,total,candidates=[]) {
 const n=weights.length,min=total<60?total:60,max=180;
 if(!n||total<n*min||total>n*max)throw new Error(`Audio ${total/30}s needs ${Math.ceil(total/180)}–${Math.max(1,Math.floor(total/60))} scenes of 2–6s.`);
 const sum=weights.reduce((a,b)=>a+b,0);let cursor=0,acc=0;const lengths=[];
 weights.forEach((w,i)=>{acc+=w;const rest=n-i-1;const ideal=Number.isFinite(candidates[i+1])?Math.round(candidates[i+1]):Math.round(total*acc/sum);const end=i===n-1?total:Math.max(cursor+min,total-rest*max,Math.min(cursor+max,total-rest*min,ideal));lengths.push(end-cursor);cursor=end;});
 return lengths;
}
function toStoryboard(list,source,seconds,sourceLocked=true) {
 const tokens=source.trim().split(/\s+/u);
 if(list.scenes.length>tokens.length)throw new Error('More scenes than narration words.');
 const weights=list.scenes.map(s=>Math.max(1,s.audio.narration_subtitle.trim().split(/\s+/u).length));
 const starts=spreadTiming(weights,tokens.length,[]);
 let cursor=0;const exact=[];
 for(const s of list.scenes){exact.push(cursor);cursor+=s.audio.narration_subtitle.trim().split(/\s+/u).length;}
 const verbatim=list.scenes.map(s=>s.audio.narration_subtitle.trim()).join(' ')===tokens.join(' ');
 const frames=fitSceneFrames(list.scenes.map(s=>s.duration_frames),Math.round(seconds*30));
 const scenes=list.scenes.map((s,i)=>{
  const text=tokens.slice((verbatim?exact:starts)[i],(verbatim?exact:starts)[i+1]??tokens.length).join(' ');
  const scene={...s,duration_frames:frames[i],duration_seconds:frames[i]/30,audio:{...s.audio,narration_subtitle:text,shadow_voice:sourceLocked?'':s.audio.shadow_voice}};
  return {title:(s.story?.intent||s.visual_action).slice(0,90),text,direction:s.visual_action,actions:s.story?.beats.map(b=>b.action)||[],layout:{setting:s.location,subject:Object.keys(s.character_states).join(', '),prop:'',subjectX:305,propX:514},scene_spec:scene};
 });
 scenes.sceneList={metadata:list.metadata,scenes:scenes.map(s=>s.scene_spec)};
 scenes.bible={premise:list.metadata.theme,cast:list.metadata.characters.map(c=>({...c,role:c.appearance})),locations:list.metadata.locations.map(id=>({id,description:id})),arc:list.metadata.theme};
 scenes.outline=scenes.map(({title,direction})=>({title,direction}));return scenes;
}
function exportDraft(d) {
 if(!d.sceneList)throw new Error('Bản nháp cũ chưa có Scene List theo skill mới.');
 return {metadata:d.sceneList.metadata,scenes:d.storyboard.map((s,i)=>({...s.scene_spec,scene_id:i+1,visual_action:s.direction,location:s.layout.setting,duration_frames:d.lengths30?.[i]??s.scene_spec.duration_frames,duration_seconds:(d.lengths30?.[i]??s.scene_spec.duration_frames)/30,audio:{...s.scene_spec.audio,narration_subtitle:s.text}}))};
}
module.exports={skill,inspectSceneList,fitSceneFrames,toStoryboard,exportDraft};
