const path=require('node:path');
const {bundle}=require('@remotion/bundler');
const {selectComposition,renderMedia,renderStill}=require('@remotion/renderer');
(async()=>{
 const serveUrl=await bundle({entryPoint:path.resolve('scripts/fixtures/motionProof.tsx')});
 const browserExecutable=require('playwright').chromium.executablePath();
 const composition=await selectComposition({serveUrl,id:'MotionProof',browserExecutable});
 const root=path.resolve('reports/motion-proof-v2');
 require('node:fs').mkdirSync(root,{recursive:true});
 if(process.argv.includes('--stills')) {
  for(const frame of [0,90,215,300]) await renderStill({serveUrl,composition,browserExecutable,frame,output:path.join(root,`revision-${frame}.png`),scale:.5});
  process.exit(0);
 }
 await renderMedia({serveUrl,composition,browserExecutable,codec:'h264',outputLocation:path.join(root,'motion-proof.mp4'),concurrency:3});
 for(const frame of [0,45,90,136,180,215,250,300]) require('node:child_process').execFileSync('ffmpeg',['-v','error','-y','-ss',String(frame/60),'-i',path.join(root,'motion-proof.mp4'),'-frames:v','1','-vf','scale=960:540',path.join(root,`frame-${frame}.png`)]);
 console.log(root);
 process.exit(0);
})().catch(e=>{console.error(e);process.exitCode=1;});
