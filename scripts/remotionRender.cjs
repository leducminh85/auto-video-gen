const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { randomUUID } = require('node:crypto');

async function renderRemotion(project, root, publicRoot, onProgress = () => {}, options = {}) {
  const { bundle } = require('@remotion/bundler');
  const { selectComposition, renderMedia, renderStill } = require('@remotion/renderer');
  const { validateShot } = require('./remotionSchema.cjs');
  const { asset, saveProject } = require('./projectEditor.cjs');
  if (project.metadata.fps !== 60 || project.metadata.width !== 1920 || project.metadata.height !== 1080) throw new Error('Hoạt hình người que cần 1920 × 1080, 60 fps.');
  for (const scene of project.scenes) {
    asset(publicRoot, 'audio', scene.audio_file);
    for (const beat of scene.beats) beat.remotion = validateShot(beat.remotion);
  }
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'wevic-remotion-'));
  const output = path.join(root, `render-${randomUUID()}.mp4`);
  try {
    const assets = path.join(temporary, 'public');
    fs.mkdirSync(path.join(assets, 'audio'), { recursive: true });
    for (const scene of project.scenes) fs.copyFileSync(asset(publicRoot, 'audio', scene.audio_file), path.join(assets, 'audio', scene.audio_file));
    const serveUrl = await bundle({ entryPoint: path.resolve('src/remotion/VectorRenderRoot.tsx'), publicDir: assets, outDir: path.join(temporary, 'bundle') });
    const inputProps = { scenes: project.scenes, animatic: !!options.animatic };
    const browserExecutable = require('playwright').chromium.executablePath();
    const composition = await selectComposition({ serveUrl, id: 'VectorStudio', inputProps, browserExecutable });
    let lastProgress = -1;
    await renderMedia({ serveUrl, composition, inputProps, browserExecutable, codec: 'h264', outputLocation: output, scale: options.animatic ? .4 : 1,
      concurrency: Math.min(4, os.availableParallelism()), onProgress: ({ progress }) => { const percent = Math.round(progress * 100); if (percent !== lastProgress) { lastProgress = percent; onProgress(percent); } } });
    if (options.animatic) {
      fs.renameSync(output, path.join(root, 'animatic.mp4'));
      return project;
    }
    fs.mkdirSync(path.join(publicRoot, 'images'), { recursive: true });
    for (const scene of project.scenes) {
      for (const beat of scene.beats) {
        const name = `remotion_${randomUUID()}.png`;
        await renderStill({ serveUrl, composition, inputProps, browserExecutable, frame: scene.start_frame + beat.start_frame_offset + Math.min(beat.duration_in_frames - 1, Math.floor(beat.duration_in_frames * .45)), output: path.join(publicRoot, 'images', name), imageFormat: 'png', scale: .4 });
        beat.image_file = name;
        beat.image_version = Date.now();
      }
      scene.image_file = scene.beats[0].image_file;
    }
    fs.renameSync(output, path.join(root, 'final-video.mp4'));
    project.metadata.render_dirty = false;
    saveProject(project, root);
    return project;
  } finally {
    fs.rmSync(output, { force: true });
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
module.exports = { renderRemotion };
