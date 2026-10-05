const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const { createLocalBeatPlan, extractDomainAnchor, generateSemanticSvgForBeat } = require('./visualBeatPlanner.cjs');

async function main() {
  const input = process.argv[2] || 'public/scenes.json';
  const output = process.argv[3] || 'artifacts/visual-plan-preview';
  const data = JSON.parse(fs.readFileSync(input, 'utf8'));
  const scenes = data.scenes || data;
  const domain = extractDomainAnchor(data.title || '', '', scenes.map(s => s.text || s.narration || '').join('\n'));
  const history = [];
  const review = [];
  const thumbnails = [];
  fs.mkdirSync(output, { recursive: true });
  for (const scene of scenes) {
    for (const beat of scene.beats || []) {
      const text = beat.text || beat.caption || '';
      const plan = createLocalBeatPlan({ beatText: text, sceneText: scene.text, overallTopic: domain.topic, recentPlans: history });
      const name = `scene_${scene.id}_beat_${beat.sub_index}`;
      const svg = generateSemanticSvgForBeat({ beat: { ...beat, text, plan } });
      fs.writeFileSync(path.join(output, `${name}.svg`), svg);
      const index = thumbnails.length;
      thumbnails.push({ input: await sharp(Buffer.from(svg)).resize(480, 270).png().toBuffer(), left: (index % 3) * 480, top: Math.floor(index / 3) * 270 });
      review.push({ scene: scene.id, beat: beat.sub_index, narration: text, previous: beat.plan, proposed: plan });
      history.push(plan);
    }
  }
  fs.writeFileSync(path.join(output, 'plans.json'), JSON.stringify({ domain, note: 'Offline planning and SVG fallback preview; these are not AI-generated images.', beats: review }, null, 2));
  if (thumbnails.length) await sharp({ create: { width: 1440, height: Math.ceil(thumbnails.length / 3) * 270, channels: 3, background: 'white' } }).composite(thumbnails).png().toFile(path.join(output, 'fallback-contact-sheet.png'));
  console.log(`${review.length} beat plans and SVG fallback previews written to ${output}; project images unchanged.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
