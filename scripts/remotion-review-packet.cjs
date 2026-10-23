const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const sharp = require('sharp');
async function reviewPacket(projectFile, videoFile, output) {
  const project = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
  fs.mkdirSync(output, { recursive: true });
  const evidence = [];
  for (const scene of project.scenes) for (const beat of scene.beats) {
    const start = scene.start_frame + beat.start_frame_offset;
    const frames = new Set([0, Math.floor(beat.duration_in_frames * .45), beat.duration_in_frames - 1]);
    for (const event of beat.direction_plan?.events || []) for (const delta of [-7, 0, 7]) frames.add(Math.max(0, Math.min(beat.duration_in_frames-1, Math.round(event.at * (beat.duration_in_frames-1))+delta)));
    const images = [];
    for (const frame of [...frames].sort((a,b)=>a-b)) {
      const file = path.join(output, `${beat.id}-${frame}.jpg`);
      execFileSync('ffmpeg', ['-v','error','-y','-ss',String((start+frame)/project.metadata.fps),'-i',videoFile,'-frames:v','1','-vf','scale=480:270',file]);
      images.push(file);
    }
    const sheet = path.join(output, `${beat.id}-sheet.jpg`);
    await sharp({ create: { width: 1440, height: Math.ceil(images.length/3)*270, channels: 3, background: '#222222' } }).composite(images.map((input,i)=>({input,left:(i%3)*480,top:Math.floor(i/3)*270}))).jpeg().toFile(sheet);
    evidence.push({ scene:scene.id, beat:beat.id, caption:beat.caption, plan:beat.direction_plan, sheet, images });
  }
  const criteria = ['hook_within_3_seconds','purpose_and_focal_subject','consistent_character_and_props','contact_and_causal_response','readable_truthful_graphics','two_palette_systems','motivated_cuts','varied_narrative_rhythm','phone_readability','silent_view_comprehension','audio_alignment'];
  fs.writeFileSync(path.join(output,'review.json'), JSON.stringify({ status:'pending', standard:'docs/REMOTION_OUTPUT_STANDARD.md', videoFile, evidence, criteria: Object.fromEntries(criteria.map(key=>[key,{status:'pending',evidence:[],issues:[]}])) },null,2));
  return evidence;
}
if (require.main === module) reviewPacket(...process.argv.slice(2)).catch(error=>{console.error(error);process.exitCode=1;});
module.exports = { reviewPacket };
