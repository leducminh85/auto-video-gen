const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto');
function sampleFrames(duration,beats=[]) {
 const positions=[0,.2,.4,.6,.8,1,...beats.flatMap(b=>[b.at-.015,b.at,b.at+.015])];
 return [...new Set(positions.map(at=>Math.round(Math.max(0,Math.min(1,at))*(duration-1))))].sort((a,b)=>a-b);
}
async function createPreviewer(root) {
 const {bundle}=require('@remotion/bundler');
 const {openBrowser,selectComposition,renderStill}=require('@remotion/renderer');
 const sharp=require('sharp');
 const assets=path.join(root,'visual-review');fs.mkdirSync(assets,{recursive:true});
 const serveUrl=await bundle({entryPoint:path.resolve('src/remotion/ShotReviewRoot.tsx'),publicDir:null});
 const browserExecutable=require('playwright').chromium.executablePath();
 const browser=await openBrowser('chrome',{browserExecutable});
 return {
  close:()=>browser.close({silent:true}),
  async render(shot,duration,beats,key) {
   const inputProps={shot,duration};
   const composition=await selectComposition({serveUrl,id:'ShotReview',inputProps,puppeteerInstance:browser});
   const frames=sampleFrames(duration,beats),tiles=[];
   for(const [i,frame] of frames.entries()) {
    const {buffer}=await renderStill({serveUrl,composition,inputProps,frame,puppeteerInstance:browser,scale:1/3,imageFormat:'png'});
    const label=Buffer.from(`<svg width="640" height="28"><rect width="640" height="28" fill="#161616"/><text x="12" y="20" fill="white" font-size="17">${i+1} · ${(frame/60).toFixed(2)}s · frame ${frame}</text></svg>`);
    const tile=await sharp({create:{width:640,height:388,channels:4,background:'#161616'}}).composite([{input:buffer,top:28,left:0},{input:label,top:0,left:0}]).png().toBuffer();
    tiles.push({input:tile,left:(i%3)*640,top:Math.floor(i/3)*388});
   }
   const file=path.join(assets,`${key}.png`);
   await sharp({create:{width:1920,height:Math.ceil(frames.length/3)*388,channels:4,background:'#161616'}}).composite(tiles).png().toFile(file);
   return {file,frames};
  }
 };
}
function missingImages(result) {
 return result?.images_received === false || (result?.issues || []).some(issue=> /(?:images?|frames?).{0,100}(?:not (?:attached|supplied|provided|visible)|missing|not received)|(?:attach|provide|supply).{0,40}(?:actual|rendered|same rendered).{0,20}(?:images?|frames?)/i.test(issue.message || ''));
}
function reviewIssues(result,shot) {
 if(missingImages(result)) throw new Error('ChatGPT chưa nhận được ảnh kiểm duyệt. Cần gửi lại ảnh, không sửa các layer.');
 if(typeof result?.passed!=='boolean'||!Array.isArray(result.issues)||result.passed!==!result.issues.length)throw new Error('Rendered review must return passed and issues.');
 return result.issues.map(issue=>{
  if(typeof issue.message!=='string'||!issue.message.trim())throw new Error('Rendered review must give a concrete correction.');
  if(issue.target==='camera')return {path:'/camera',message:issue.message};
  const index=shot.layers.findIndex(l=>l.id===issue.target);
  if(index<0)throw new Error('Rendered review must identify an existing top-level layer ID or camera.');
  return {path:`/layers/${index}`,message:issue.message};
 }).filter((issue,i,all)=>all.findIndex(x=>x.path===issue.path)===i).map(issue=>({...issue,message:result.issues.filter(x=>x.target===(issue.path==='/camera'?'camera':shot.layers[Number(issue.path.split('/')[2])].id)).map(x=>x.message).join(' ')}));
}
async function inspectRendered({shot,duration,story,previewer,root,ask,onPreview=()=>{}}) {
 const key=createHash('sha256').update(JSON.stringify({shot,duration,story,version:2})).digest('hex').slice(0,20);
 const record=path.join(root,'visual-review',`${key}.json`);
 if(fs.existsSync(record)){const saved=JSON.parse(fs.readFileSync(record));if(!missingImages(saved)){if(saved.file&&fs.existsSync(saved.file))onPreview(saved.file);return saved.passed?[]:saved.issues;}}
 const cachedImage=path.join(root,'visual-review',`${key}.png`);
 const {file,frames}=fs.existsSync(cachedImage)?{file:cachedImage,frames:sampleFrames(duration,story.beats)}:await previewer.render(shot,duration,story.beats,key);
 onPreview(file);
 const result=await ask(`Inspect the ATTACHED chronological rendered frames, not imagined pixels. Return JSON only: {"passed":true,"issues":[]} or {"passed":false,"issues":[{"target":"top-level layer ID or camera","message":"concrete repair"}]}.
Check visible proof of narration, silhouette/anatomy, readable composition, hand/prop contact, grounded feet, unwanted overlaps/clipping, continuity and distracting effects. Respect deliberate close-up crops and holds. Group all material defects by target. Do not invent defects between sampled frames; this is sampled-frame review, not full motion playback. Preserve approved story and correct layers. If the image attachment itself is absent or unreadable, return {"passed":false,"images_received":false,"issues":[]}. Missing attachments are transport failures, never layer defects. Only request a layer correction for a visible defect in the attached frames.
APPROVED:${JSON.stringify(story)}
LAYER MAP:${JSON.stringify(shot.layers.map(l=>({id:l.id,type:l.type,label:l.label,children:l.children?.map(c=>c.id)})))}
FRAMES:${frames.join(',')}; fps60`,{images:[file]});
 const issues=reviewIssues(result,shot);
 fs.writeFileSync(record,JSON.stringify({passed:!issues.length,scope:'sampled_rendered_frames',frames,file,issues},null,2));
 return issues;
}
module.exports={createPreviewer,inspectRendered,sampleFrames,reviewIssues};
