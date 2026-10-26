const fs = require('node:fs');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const active = global.__activeStoryboardRenders ||= new Set();
const stopped = global.__stoppedStoryboardRenders ||= new Set();
const root = () => path.resolve('data/storyboard-drafts');
function file(id) {
  if (!/^[\w-]{10,80}$/.test(id)) throw new Error('Storyboard không hợp lệ.');
  return path.join(root(), `${id}.json`);
}
function write(draft) { fs.mkdirSync(root(),{recursive:true}); const target=file(draft.id); const temp=`${target}.${randomUUID()}.tmp`; fs.writeFileSync(temp,JSON.stringify(draft,null,2)); fs.renameSync(temp,target); return draft; }
function read(id) { const d=JSON.parse(fs.readFileSync(file(id),'utf8')); if(d.status==='building'&&!active.has(id)){d.status='failed';write(d);} return d; }
function publicDraft(d) {
  let offset=0;
  return {id:d.id,revision:d.revision,progress:d.progress,lastError:d.lastError,stopRequested:stopped.has(d.id),approvedRevision:d.approvedRevision ?? (d.approvedAt && d.status!=='draft' ? d.revision : undefined),status:d.status,projectId:d.projectId,title:d.title,editableNarration:d.options.inputKind==='idea',sceneList:d.sceneList ? require('./remotionSceneList.cjs').exportDraft(d) : undefined,estimatedTiming:!d.lengths30,scenes:d.storyboard.map((s,i)=>{
    const duration=d.lengths30 ? d.lengths30[i]/30 : (s.scene_spec?.duration_frames ? s.scene_spec.duration_frames/30 : s.text.split(/\s+/u).length/3.2/(d.options.speed||1));
    const result={...s,start:offset,duration};offset+=duration;return result;
  }),audio:d.options.importedAudio};
}
function createDraft(plan) {
  let id=plan.run;
  if (fs.existsSync(file(id))) { const prior=read(id); if(prior.status==='building') throw new Error('Storyboard này đang được dựng.'); if(prior.status!=='complete') return publicDraft(prior); id+=`-${randomUUID().slice(0,8)}`; }
  const storyboard=plan.storyboard.map(s=>({...s,direction:typeof s.direction==='string'?s.direction:'Mô tả hành động theo lời đọc: '+s.text,actions:Array.isArray(s.actions)?s.actions.slice(0,6).map(String):[],layout:{setting:String(s.layout?.setting||'Không gian'),subject:String(s.layout?.subject||'Chủ thể'),prop:String(s.layout?.prop||'Đạo cụ'),subjectX:Number.isFinite(s.layout?.subjectX)?Math.max(100,Math.min(700,s.layout.subjectX)):305,propX:Number.isFinite(s.layout?.propX)?Math.max(100,Math.min(700,s.layout.propX)):514}}));
  return publicDraft(write({...plan,storyboard,id,revision:1,status:'draft'}));
}
function text(value,label,max=6000) { if(typeof value!=='string'||!value.trim()||value.length>max) throw new Error(`${label} cần có nội dung, tối đa ${max} ký tự.`); return value.trim(); }
function saveDraft(id, input) {
  const d=read(id);
  if(d.status==='building'||d.status==='complete') throw new Error('Storyboard đã được duyệt để dựng.');
  if(input.revision!==d.revision) throw new Error('Storyboard đã thay đổi. Hãy mở lại bản mới nhất.');
  if(!Array.isArray(input.scenes)||input.scenes.length!==d.storyboard.length) throw new Error('Giữ số cảnh và lời đọc theo audio.');
  d.storyboard=d.storyboard.map((s,i)=>{
    const edit=input.scenes[i];
    const actions=edit.actions || [];
    if(!Array.isArray(actions)||actions.length>(s.scene_spec?.story?4:6)) throw new Error(`Mỗi cảnh có tối đa ${s.scene_spec?.story?4:6} mốc hành động.`);
    const layout=edit.layout||{};
    let spec=s.scene_spec;
    if(spec) {
      const proposed=edit.scene_spec || spec;
      spec={...spec,...(spec.story?{story:{...(proposed.story||spec.story),beats:actions.map((action,j)=>({at:actions.length===spec.story.beats.length ? spec.story.beats[j].at : j/actions.length,action}))}}:{}),camera_movement:proposed.camera_movement,character_states:proposed.character_states,vfx:Array.isArray(proposed.vfx)?proposed.vfx.map(v=>String(v).trim()).filter(Boolean):proposed.vfx,audio:{...spec.audio,sfx:Array.isArray(proposed.audio?.sfx)?proposed.audio.sfx.map(v=>String(v).trim()).filter(Boolean):proposed.audio?.sfx,music_mood:proposed.audio?.music_mood},location:layout.setting,visual_action:edit.direction};
    }
    return {...s,text:d.options.inputKind==='idea'?text(edit.text,'Lời đọc',4000):s.text,scene_spec:spec,title:text(edit.title,'Tên cảnh',160),direction:text(edit.direction,'Mô tả cảnh'),actions:actions.map(a=>text(a,'Hành động',600)),layout:{setting:text(layout.setting||'Không gian','Bối cảnh',120),subject:text(layout.subject||'Nhân vật','Chủ thể',120),prop:text(layout.prop||'Đạo cụ','Đạo cụ',120),subjectX:Math.max(100,Math.min(700,Number(layout.subjectX)||305)),propX:Math.max(100,Math.min(700,Number(layout.propX)||514))}};
  });
  if(d.sceneList) {
    const {exportDraft,inspectSceneList}=require('./remotionSceneList.cjs');
    const result=inspectSceneList(exportDraft(d));
    if(result.issues.length)throw new Error(result.issues.map(i=>`${i.path}: ${i.message}`).join('\n'));
    d.sceneList=result.data;
    d.storyboard.forEach((s,i)=>{s.scene_spec=result.data.scenes[i];});
  }
  d.outline=d.storyboard.map(({title,direction})=>({title,direction}));d.revision++;d.status='draft';delete d.approvedRevision;delete d.approvedAt;write(d);return publicDraft(d);
}
function begin(id,revision) { const d=read(id);if(d.revision!==revision||!['draft','failed'].includes(d.status))throw new Error('Storyboard đã được duyệt hoặc đã có bản sửa mới.');d.status='building';delete d.lastError;active.add(id);stopped.delete(id);d.progress={message:'Chuẩn bị tác vụ',percent:0,updatedAt:new Date().toISOString()};d.approvedRevision=revision;d.approvedAt ||= new Date().toISOString();write(d);return d; }
function finish(id,status,projectId,lastError) { const d=read(id);d.status=status;d.lastError=lastError;d.projectId=projectId;write(d);active.delete(id); }
function progress(id,event) { if(!active.has(id))return;const d=read(id);d.progress={message:event.message,percent:event.percent,updatedAt:new Date().toISOString()};write(d); }
function requestStop(id) { const d=read(id);if(d.status==='building')stopped.add(id);return publicDraft(d); }
function assertRunning(id) { if(stopped.has(id))throw Object.assign(new Error('Đã dừng tác vụ. Có thể tiếp tục từ các cảnh đã đạt.'),{retryExhausted:true}); }
module.exports={createDraft,read,publicDraft,saveDraft,begin,finish,progress,requestStop,assertRunning};
