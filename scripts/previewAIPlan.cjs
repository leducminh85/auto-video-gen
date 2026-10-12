const fs = require('node:fs');
const path = require('node:path');
const { planStoryboard, planSceneImages, sourceWords, narrationSource } = require('./aiProductionPlanner.cjs');
const { createPlanningClient } = require('./aiPlanningClient.cjs');
const { defaultPrompt } = require('../src/config/imageStyle.json');

async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw new Error('Usage: node scripts/previewAIPlan.cjs <script.txt|project.json> <report.json>');
  const destination = path.resolve(output);
  if ([input, 'public/scenes.json', 'src/data/scenes.json'].some(file => path.resolve(file) === destination)) throw new Error('Chọn tệp báo cáo khác tệp nguồn và dự án đang dùng.');
  const envFile = path.resolve(__dirname, '../.env');
  const env = { ...(fs.existsSync(envFile) ? require('dotenv').parse(fs.readFileSync(envFile)) : {}), ...process.env };
  const send = createPlanningClient({ env, onStatus: message => console.log(message) });
  const request = async args => {
    const start = Date.now();
    const result = await send(args);
    const kind = args.schema.properties.items ? 'Review' : args.schema.properties.scenes ? 'Storyboard' : 'Images';
    console.log(`${kind}: ${result.model}, ${((Date.now() - start) / 1000).toFixed(1)}s${kind === 'Review' ? `, passed=${result.data.passed}, issues=${JSON.stringify(result.data.issues)}` : ''}`);
    return result;
  };
  const content = fs.readFileSync(input, 'utf8');
  let project;
  try { project = JSON.parse(content); } catch {}
  const style = project?.metadata?.image_style_prompt || defaultPrompt;
  const density = project?.metadata?.image_density || 'balanced';
  fs.writeFileSync(destination, JSON.stringify({ complete: false, input: path.resolve(input) }, null, 2));
  console.log('AI đang lập và kiểm tra phân cảnh...');
  let narration = content;
  let referenceScript = '';
  if (project?.metadata?.audio_source === 'import' && project.metadata.imported_audio) {
    const audio = require('./projectEditor.cjs').asset(path.resolve(__dirname, '../public'), 'audio', project.metadata.imported_audio);
    narration = (await require('./audioAlignment.cjs').transcribeAudio(audio)).text;
    referenceScript = project.metadata.reference_script ?? narrationSource(content, project.scenes);
  }
  const storyboard = await planStoryboard({ content: narration, scenesInput: project?.scenes, referenceScript, narrationSourceType: narration !== content ? 'audio_transcript' : 'script', title: project?.metadata?.title || path.basename(input), imageStylePrompt: style, imageDensity: density, request });
  const words = sourceWords(storyboard.fullScript).words.length;
  const duration = Number(project?.metadata?.total_duration_in_seconds) || words / 2.8;
  const report = { timing_source: 'estimated_preview_only', total_seconds: duration, storyboard, scenes: [] };
  const history = [];
  for (const scene of storyboard.scenes) {
    console.log(`AI đang lập và kiểm tra ảnh cảnh ${scene.id}/${storyboard.scenes.length}...`);
    const frames = Math.max(1, Math.round(duration * 30 * (scene.endWord - scene.startWord) / words));
    const result = await planSceneImages({ scene, storyboard, durationInSeconds: frames / 30, totalFrames: frames, imageDensity: density, imageStylePrompt: style, recentPlans: history, request });
    report.scenes.push({ ...scene, ...result });
    history.push(...result.beats.map(beat => beat.plan));
    fs.writeFileSync(destination, JSON.stringify({ ...report, complete: false }, null, 2));
  }
  fs.writeFileSync(destination, JSON.stringify({ ...report, complete: true }, null, 2));
  console.log(`Đã kiểm tra ${report.scenes.length} cảnh / ${history.length} ảnh. Báo cáo: ${destination}. Chưa tạo ảnh hoặc video; thời lượng là ước tính.`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => require('./image-generation/browser/GoogleAIStudioBrowser.cjs').getInstance().close());
