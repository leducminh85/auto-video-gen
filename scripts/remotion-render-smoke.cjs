const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const { fixture } = require('./fixtures/remotionProject.cjs');

async function main() {
  const root = path.resolve('data/remotion-smoke');
  fs.mkdirSync(path.join(root, 'audio'), { recursive: true });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=2', path.join(root, 'audio/fixture.wav')], { windowsHide: true });
  const project = await require('./remotionRender.cjs').renderRemotion(fixture(), root, root);
  const info = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', path.join(root, 'final-video.mp4')], { encoding: 'utf8', windowsHide: true }));
  const video = info.streams.find(stream => stream.codec_type === 'video');
  assert.equal(video.nb_frames, '120'); assert.equal(video.r_frame_rate, '60/1');
  assert.equal(video.width, 1920); assert.equal(video.height, 1080);
  assert.ok(info.streams.some(stream => stream.codec_type === 'audio'));
  assert.ok(fs.existsSync(path.join(root, 'images', project.scenes[0].image_file)));
  console.log('Rendered 120 frames at 1080p/60fps with audio and thumbnail:', root);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
