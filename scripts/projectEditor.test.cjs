const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const sharp = require('sharp');
const editor = require('./projectEditor.cjs');
const bin = name => fs.existsSync(`/opt/homebrew/bin/${name}`) ? `/opt/homebrew/bin/${name}` : name;

test('audio allocation preserves every frame and validates manual cuts', () => {
  const scenes = [{ text: 'one' }, { text: 'two three' }, { text: 'four' }];
  assert.deepEqual(editor.allocateAudioFrames(scenes, 101), [25, 51, 25]);
  assert.deepEqual(editor.allocateAudioFrames(scenes, 101, [1, 2]), [30, 30, 41]);
  for (const cuts of [[2, 1], [1], [1, 4], [1, NaN], [0, 1]]) assert.throws(() => editor.allocateAudioFrames(scenes, 101, cuts));
});

test('custom style replaces the default style instead of appending contradictory directions', () => {
  const prompt = editor.styledPrompt({ meaning: 'A bird builds a nest', what_to_show: 'A bird carrying a twig', imageGenerationPrompt: 'old stickman whiteboard style' }, 'Watercolor on textured paper');
  assert.match(prompt, /Watercolor on textured paper/);
  assert.match(prompt, /bird carrying a twig/);
  assert.doesNotMatch(prompt, /stickman|whiteboard/);
});

test('import, slice, render and re-render preserve audio and exact frame count', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wevic-editor-'));
  try {
    fs.mkdirSync(path.join(root, 'images'));
    const source = path.join(root, 'source.wav');
    execFileSync(bin('ffmpeg'), ['-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', source]);
    const imported = await editor.importAudio(fs.readFileSync(source), root);
    assert.ok(Math.abs(imported.duration - 1) < 0.01);
    const audioPath = editor.asset(root, 'audio', imported.file);
    await editor.sliceAudio(audioPath, path.join(root, 'audio', 'part.wav'), 0, 30);
    for (const color of ['red', 'blue']) await sharp({ create: { width: 160, height: 90, channels: 3, background: color } }).png().toFile(path.join(root, 'images', `${color}.png`));
    const beat = (id, file, frames) => ({ id, image_file: file, duration_in_frames: frames, prompt: id });
    const project = { metadata: { fps: 30, width: 160, height: 90 }, scenes: [{ id: 1, audio_file: 'part.wav', duration_in_frames: 30, beats: [beat('a', 'red.png', 13), beat('b', 'blue.png', 17)] }] };
    const saved = await editor.renderProject(project, root);
    assert.equal(saved.metadata.render_dirty, false);
    assert.equal(saved.scenes[0].beats[1].start_frame_offset, 13);
    const videoInfo = () => JSON.parse(execFileSync(bin('ffprobe'), ['-v', 'error', '-show_streams', '-of', 'json', path.join(root, 'final-video.mp4')]).toString());
    assert.equal(Number(videoInfo().streams.find(s => s.codec_type === 'video').nb_frames), 30);
    assert.ok(videoInfo().streams.some(s => s.codec_type === 'audio'));
    saved.scenes[0].beats = [beat('b', 'blue.png', 30)];
    const edited = await editor.renderProject(saved, root);
    assert.equal(edited.scenes[0].image_file, 'blue.png');
    assert.equal(Number(videoInfo().streams.find(s => s.codec_type === 'video').nb_frames), 30);
    const before = fs.readFileSync(path.join(root, 'final-video.mp4'));
    edited.scenes[0].beats[0].image_file = 'missing.png';
    await assert.rejects(editor.renderProject(edited, root), /Không tìm thấy/);
    assert.deepEqual(fs.readFileSync(path.join(root, 'final-video.mp4')), before);
    edited.scenes[0].beats = [];
    assert.throws(() => editor.normalizeProject(edited), /ít nhất một ảnh/);
    await assert.rejects(editor.importAudio(Buffer.from('not audio'), root));
    assert.throws(() => editor.asset(root, 'audio', '../source.wav'));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('generation uses imported audio and custom style through the full pipeline without TTS', async () => {
  const vm = require('node:vm');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wevic-pipeline-'));
  try {
    fs.mkdirSync(path.join(root, 'scripts'));
    fs.mkdirSync(path.join(root, 'public'));
    const source = path.join(root, 'voice.wav');
    execFileSync(bin('ffmpeg'), ['-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', source]);
    const imported = await editor.importAudio(fs.readFileSync(source), path.join(root, 'public'));
    const prompts = [];
    const planner = require('./visualBeatPlanner.cjs');
    const context = {
      module: { exports: {} }, __dirname: path.join(root, 'scripts'),
      Buffer, process: { env: {} }, console: { log() {}, warn() {}, error() {} },
      require(name) {
        if (name === 'child_process') return { execSync() { throw new Error('TTS subprocess must not run'); } };
        if (name === 'google-tts-api') return { getAudioBase64() { throw new Error('TTS must not run'); } };
        if (name === './storyboardGenerator.cjs') return { generateStoryboardFromContent() { throw new Error('Imported script must retain its scene boundaries'); } };
        if (name === './visualBeatPlanner.cjs') return { ...planner, planVisualBeatsWithAI: async () => null };
        if (name === './fluxImageGenerator.cjs') return { generateFluxImage: async ({ prompt, outputPath }) => {
          prompts.push(prompt);
          await sharp(require('node:crypto').randomBytes(160 * 90 * 3), { raw: { width: 160, height: 90, channels: 3 } }).png().toFile(outputPath);
          return { success: true, method: 'fixture' };
        } };
        return require(name);
      },
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'videoGenerator.cjs'), 'utf8'), context);
    const result = await context.module.exports.generateVideo({
      title: 'Audio fixture', importedAudio: imported.file, audioBoundaries: [0.5], imageStylePrompt: 'Watercolor on textured paper',
      scenes: [{ title: 'One', text: 'A bird carries a twig.' }, { title: 'Two', text: 'It builds a nest.' }],
    });
    assert.equal(result.metadata.total_duration_in_frames, 30);
    assert.equal(result.metadata.audio_source, 'import');
    assert.equal(result.scenes.length, 2);
    assert.ok(result.scenes.every(scene => scene.duration_in_frames === 15 && scene.audio_file.endsWith('.wav')));
    assert.ok(prompts.every(prompt => prompt.startsWith('Watercolor on textured paper')));
    assert.ok(fs.statSync(path.join(root, 'public', 'final-video.mp4')).size > 0);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('image providers preserve custom styles without adding stickman instructions', () => {
  const FluxProvider = require('./image-generation/providers/FluxProvider.cjs');
  const GoogleProvider = require('./image-generation/providers/GoogleAIStudioProvider.cjs');
  for (const Provider of [FluxProvider, GoogleProvider]) {
    assert.equal(Provider.prototype.preparePrompt('Watercolor bird on textured paper'), 'Watercolor bird on textured paper');
  }
});
