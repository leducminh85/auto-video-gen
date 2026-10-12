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
    const projectRoot = path.join(root, 'project-test');
    fs.mkdirSync(projectRoot);
    await editor.renderProject(edited, projectRoot, root);
    assert.ok(fs.statSync(path.join(projectRoot, 'final-video.mp4')).size > 0);
    assert.deepEqual(fs.readFileSync(path.join(root, 'final-video.mp4')), before);
    edited.scenes[0].beats[0].image_file = 'missing.png';
    await assert.rejects(editor.renderProject(edited, root), /Không tìm thấy/);
    assert.deepEqual(fs.readFileSync(path.join(root, 'final-video.mp4')), before);
    edited.scenes[0].beats = [];
    assert.throws(() => editor.normalizeProject(edited), /ít nhất một ảnh/);
    await assert.rejects(editor.importAudio(Buffer.from('not audio'), root));
    assert.throws(() => editor.asset(root, 'audio', '../source.wav'));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('AI plans imported audio and custom style through the full pipeline without TTS or local planning', async () => {
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
    let planningCalls = 0;
    let rejectAlignment = false;
    let rejectImages = false;
    const context = {
      module: { exports: {} }, __dirname: path.join(root, 'scripts'),
      Buffer, process: { env: {} }, console: { log() {}, warn() {}, error() {} },
      require(name) {
        if (name === 'child_process') return { execSync() { throw new Error('TTS subprocess must not run'); } };
        if (name === 'google-tts-api') return { getAudioBase64() { throw new Error('TTS must not run'); } };
        if (name === './aiPlanningClient.cjs') return { createPlanningClient: () => async ({ schema, prompt }) => {
          assert.match(prompt, /referenceScript/);
          assert.match(prompt, /wins a trophy/);
          assert.match(prompt, /audio_transcript/);
          planningCalls++;
          let data;
          if (schema.properties.scenes) data = { continuity: 'One brown bird.', scenes: [
            { startWord: 0, endWord: 5, title: 'One', intent: 'Bird carries twig' },
            { startWord: 5, endWord: 9, title: 'Two', intent: 'Bird builds nest' },
          ] };
          else if (schema.properties.boundaries) data = { boundaries: [{ startWord: 0, reason: 'One brief narrated action.' }] };
          else if (schema.properties.items) {
            const count = planningCalls === 2 ? 2 : 1;
            data = { passed: true, issues: [], items: Array.from({ length: count }, (_, i) => ({ index: i + 1, faithful: true, coherent: true, distinct: true, drawable: true, evidence: planningCalls === 8 || i === 1 ? 'It builds a nest.' : 'A bird carries a twig.', reason: 'Matches the narrated bird action.' })) };
          } else {
            const first = planningCalls === 4;
            const action = first ? 'A bird carries a twig in its beak.' : 'The bird weaves branches into a round nest.';
            data = { beats: [{ startWord: 0, endWord: first ? 5 : 4, what_to_show: action, action, how_to_show: 'Focus on the beak and branches.', subject: 'Bird', environment: 'Tree', objects: ['twig'], shotType: 'close-up', visualMethod: 'character_action', keyText: '', continuity: 'Same brown bird', transitionIntent: 'Next narrated action', mustNotInclude: [], imagePrompt: action }] };
          }
          return { data, provider: 'fixture', model: 'fixture' };
        } };
        if (name === './audioAlignment.cjs') return { ...require('./audioAlignment.cjs'), transcribeAudio: async () => {
          if (rejectAlignment) throw new Error('Không nhận dạng được lời nói trong audio');
          const text = 'A bird carries a twig. It builds a nest.';
          return { text, model: 'fixture', words: text.split(' ').map((word, i) => ({ word, start: i / 10, end: (i + 1) / 10 })) };
        }, alignAudio: async (_audio, chunks, range = {}) => {
          if (rejectAlignment) throw new Error('Audio và kịch bản chưa khớp');
          return chunks.map((_, i) => ({ start: (range.start || 0) + i * 0.4, end: (range.start || 0) + (i + 1) * 0.4, confidence: 1 }));
        } };
        if (name === './visualBeatPlanner.cjs') return { ...planner, createLocalBeatPlan() { throw new Error('No local planning'); }, segmentSceneIntoBeats() { throw new Error('AI must choose image boundaries'); } };
        if (name === './fluxImageGenerator.cjs') return { generateFluxImage: async ({ prompt, outputPath }) => {
          prompts.push(prompt);
          if (rejectImages) return { success: false, error: { message: 'Studio image generation failed' } };
          await sharp(require('node:crypto').randomBytes(160 * 90 * 3), { raw: { width: 160, height: 90, channels: 3 } }).png().toFile(outputPath);
          return { success: true, method: 'fixture' };
        } };
        return require(name);
      },
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'videoGenerator.cjs'), 'utf8'), context);
    const progress = [];
    const result = await context.module.exports.generateVideo({
      title: 'Audio fixture', importedAudio: imported.file, imageDensity: 'dense', imageStylePrompt: 'Watercolor on textured paper',
      content: 'A bird wins a trophy.',
      scenes: [{ title: 'One', text: 'A bird carries a twig.' }, { title: 'Two', text: 'It builds a nest.' }],
      onProgress: event => progress.push(event.percent),
    });
    assert.ok(progress.every((percent, i) => i === 0 || percent >= progress[i - 1]), 'progress must not move backwards between scenes');
    assert.equal(result.metadata.total_duration_in_frames, 30);
    assert.equal(result.metadata.audio_source, 'import');
    assert.equal(result.metadata.narration_source, 'audio_transcript');
    assert.equal(result.metadata.reference_script, 'A bird wins a trophy.');
    assert.equal(result.scenes.map(scene => scene.text).join(' '), 'A bird carries a twig. It builds a nest.');
    assert.equal(result.scenes.length, 2);
    assert.deepEqual(Array.from(result.scenes, scene => scene.duration_in_frames), [12, 18]);
    assert.equal(result.metadata.image_density, 'dense');
    assert.equal(result.metadata.timing_source, 'speech_alignment');
    assert.equal(planningCalls, 8);
    assert.equal(result.metadata.ai_planning.storyboard.passed, true);
    assert.equal(result.metadata.quality_report.validation_passed, true);
    assert.ok(result.scenes.every(scene => scene.beats.every(beat => beat.plan.planningSource === 'ai')));
    assert.ok(result.scenes.every(scene => scene.audio_file.endsWith('.wav')));
    assert.ok(prompts.every(prompt => prompt.startsWith('Watercolor on textured paper')));
    assert.ok(fs.statSync(path.join(root, 'public', 'final-video.mp4')).size > 0);
    const savedProject = fs.readFileSync(path.join(root, 'public', 'scenes.json'), 'utf8');
    rejectAlignment = true;
    await assert.rejects(context.module.exports.generateVideo({
      importedAudio: imported.file, scenes: [{ text: 'Narration missing from audio.' }],
    }), /Không nhận dạng được lời nói/);
    assert.equal(planningCalls, 8, 'audio mismatch must stop before any AI request');
    assert.equal(fs.readFileSync(path.join(root, 'public', 'scenes.json'), 'utf8'), savedProject);
    rejectAlignment = false;
    rejectImages = true;
    planningCalls = 0;
    await assert.rejects(context.module.exports.generateVideo({
      importedAudio: imported.file, content: 'A bird wins a trophy.', imageDensity: 'dense', imageStylePrompt: 'Watercolor on textured paper',
    }), /Không tạo được 2\/2 ảnh AI.*Studio image generation failed/);
    assert.equal(fs.readFileSync(path.join(root, 'public', 'scenes.json'), 'utf8'), savedProject, 'failed images must not replace the project with SVG placeholders');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('image providers preserve custom styles without adding stickman instructions', () => {
  const FluxProvider = require('./image-generation/providers/FluxProvider.cjs');
  const GoogleProvider = require('./image-generation/providers/GoogleAIStudioProvider.cjs');
  for (const Provider of [FluxProvider, GoogleProvider]) {
    assert.equal(Provider.prototype.preparePrompt('Watercolor bird on textured paper'), 'Watercolor bird on textured paper');
  }
});

test('failed AI review leaves the previous project and its assets intact', async () => {
  const vm = require('node:vm');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wevic-planning-failure-'));
  try {
    fs.mkdirSync(path.join(root, 'scripts'));
    const publicRoot = path.join(root, 'public');
    fs.mkdirSync(path.join(publicRoot, 'images'), { recursive: true });
    fs.mkdirSync(path.join(publicRoot, 'audio'));
    const files = ['scenes.json', 'final-video.mp4', 'images/scene_1_beat_1.png', 'audio/scene_1.mp3'];
    files.forEach(file => fs.writeFileSync(path.join(publicRoot, file), 'previous project'));
    const context = {
      module: { exports: {} }, __dirname: path.join(root, 'scripts'), Buffer,
      process: { env: {} }, console: { log() {}, warn() {}, error() {} },
      require(name) {
        if (name === './aiPlanningClient.cjs') return { createPlanningClient: () => async ({ schema }) => ({ provider: 'fixture', model: 'fixture', data: schema.properties.scenes
          ? { continuity: 'Bird', scenes: [{ startWord: 0, endWord: 3, title: 'Bird', intent: 'Flight' }] }
          : { passed: false, issues: ['Unsupported visual outcome'], items: [] } }) };
        if (name === './fluxImageGenerator.cjs') return { generateFluxImage() { throw new Error('Images must wait for approved plans'); } };
        return require(name);
      },
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'videoGenerator.cjs'), 'utf8'), context);
    await assert.rejects(context.module.exports.generateVideo({ content: 'A bird flies.' }), /chưa đạt sau 3 lần/);
    files.forEach(file => assert.equal(fs.readFileSync(path.join(publicRoot, file), 'utf8'), 'previous project'));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
