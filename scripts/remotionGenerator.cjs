const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
for (const name of ['remotionReliability','remotionSchema','remotionNormalize','remotionInspection','remotionPrompts','remotionPlanner','remotionDirection']) delete require.cache[require.resolve(`./${name}.cjs`)];
const { retryPart, spreadTiming } = require('./remotionReliability.cjs');
const { planStory, planShot } = require('./remotionPlanner.cjs');
const { directScene, timedBoard } = require('./remotionDirection.cjs');
const editor = require('./projectEditor.cjs');
const { alignAudio, transcribeAudio, transcriptScenes } = require('./audioAlignment.cjs');
const { renderRemotion } = require('./remotionRender.cjs');

async function generateVideo(options) {
  const { title = 'Hoạt hình người que', subtitle = '', voice = 'vi-VN-Standard-B', speed = 1, importedAudio, audioBoundaries, imageDensity = 'balanced', onProgress = () => {} } = options;
  const notify = (stepKey, percent, message) => onProgress({ type: 'progress', stepKey, percent, message });
  const publicRoot = path.resolve('public');
  const identity = { ...options }; delete identity.onProgress; delete identity.approvedPlan;
  const run = options.approvedPlan?.run || createHash('sha256').update(JSON.stringify(identity) + 'storyboard-approval-v1').digest('hex').slice(0, 24);
  const runRoot = path.resolve('data/remotion-runs', run);
  fs.mkdirSync(runRoot, { recursive: true });
  const diagnostic = entry => fs.appendFileSync(path.join(runRoot, 'diagnostics.ndjson'), JSON.stringify({ time: new Date().toISOString(), ...entry }) + '\n');
  const retry = (label, task) => retryPart(task, { attempts: 4, onRetry: (attempt, total) => notify('beat_plan', 22, `${label} · đang thử lại ${attempt}/${total}…`), onError: (error, attempt) => diagnostic({ label, attempt, error: error.stack || error.message }) });
  const keep = async (label, input, task) => {
    const key = createHash('sha256').update(JSON.stringify(input)).digest('hex').slice(0, 20);
    const file = path.join(runRoot, `${label}-${key}.json`);
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
    let result;
    try { result = await retry(label, task); }
    catch (error) {
      const shot = /^shot-(\d+)-(\d+)$/.exec(label);
      if (shot) { error.sceneNumber = Number(shot[1])+1; error.shotNumber = Number(shot[2])+1; }
      diagnostic({ label, issues: error.issues, error: error.message });
      throw error;
    }
    fs.writeFileSync(file, JSON.stringify(result, null, 2));
    return result;
  };
  const checkpoint = data => fs.writeFileSync(path.join(runRoot, 'checkpoint.json'), JSON.stringify(data, null, 2));
  checkpoint({ stage: 'connecting', importedAudio, title, standard: 'docs/REMOTION_OUTPUT_STANDARD.md' });
  fs.mkdirSync(path.join(publicRoot, 'audio'), { recursive: true });
  await retry('Kết nối ChatGPT', async () => { const state = await require('./chatgptBrowser.cjs').ChatGPTBrowser.getInstance().open(); if (!state.connected) throw new Error(state.message); });
  let text = options.scenes?.length ? options.scenes.map(scene => scene.narration || scene.text).join('\n\n') : options.content || options.script || '';
  const referenceScript = text;
  let source, sourceDuration, transcript;
  if (options.approvedPlan) {
    ({ source, sourceDuration, transcript, text } = options.approvedPlan);
  } else if (importedAudio) {
    if (!/^import_[\w-]+\.wav$/.test(importedAudio)) throw new Error('Hãy nhập audio qua chức năng tải tệp.');
    source = editor.asset(publicRoot, 'audio', importedAudio);
    sourceDuration = await retry('Đọc audio', () => editor.probe(source));
    notify('storyboard', 5, 'Nhận dạng lời thoại từ audio đã nhập…');
    transcript = await keep('transcript', { source }, () => transcribeAudio(source));
    text = transcript.text;
  }
  if (typeof text !== 'string' || !text.trim() || text.length > 80000) throw new Error('Cần kịch bản hoặc lời thoại hợp lệ, tối đa 80.000 ký tự.');
  notify('storyboard', 10, 'ChatGPT đang phân tích lời thoại và lên ý tưởng phân cảnh…');
  const storyboard = options.approvedPlan ? Object.assign(options.approvedPlan.storyboard, {bible: options.approvedPlan.bible, outline: options.approvedPlan.outline}) : source && audioBoundaries?.length
    ? transcriptScenes(transcript, audioBoundaries, sourceDuration)
    : await keep('story', { text, title, imageDensity }, async () => { const result = await planStory(text, title, imageDensity, undefined, { relaxed: true, seconds: sourceDuration }); return { scenes: [...result], bible: result.bible, outline: result.outline }; }).then(result => Object.assign(result.scenes, { bible: result.bible, outline: result.outline }));
  checkpoint({ stage: 'story', text, storyboard, bible: storyboard.bible, outline: storyboard.outline });
  let cuts;
  if (options.approvedPlan) cuts = options.approvedPlan.cuts;
  else if (source) {
    notify('tts', 17, 'Căn phân cảnh theo lời đọc trong audio…');
    if (audioBoundaries?.length) cuts = audioBoundaries;
    else {
      let timing = [];
      try { timing = await alignAudio(source, storyboard.map(scene => scene.text)); } catch (error) { diagnostic({ stage: 'scene-timing', fallback: 'proportional', error: error.message }); }
      const starts = spreadTiming(storyboard.map(scene => scene.text.split(/\s+/u).length), Math.round(sourceDuration * 30), timing.map(t => t.start * 30), 15);
      cuts = starts.slice(1).map(frame => frame / 30);
    }
  }
  const lengths30 = source ? editor.allocateAudioFrames(storyboard, Math.round(sourceDuration * 30), cuts) : null;
  if (!options.approvedPlan) {
    const draft = require('./storyboardDrafts.cjs').createDraft({ run, title, storyboard, cuts, lengths30, source, sourceDuration, transcript, text,
      bible: storyboard.bible, outline: storyboard.outline,
      options: {title, subtitle, voice, speed, importedAudio, audioBoundaries, imageDensity, content: referenceScript} });
    checkpoint({stage:'awaiting_storyboard_approval', draftId:draft.id});
    return {approvalRequired:true,draft};
  }
  let offset30 = 0, start = 0, previous = '';
  const scenes = [];
  for (const [i, planned] of storyboard.entries()) {
    const file = `remotion_${run}_${i}.${source ? 'wav' : 'mp3'}`;
    const target = path.join(publicRoot, 'audio', file);
    notify('tts', 20 + i / storyboard.length * 55, `Chuẩn bị lời đọc cảnh ${i + 1}/${storyboard.length}…`);
    let seconds;
    if (source) {
      await retry(`Chuẩn bị audio cảnh ${i + 1}`, () => editor.sliceAudio(source, target, offset30, lengths30[i]));
      seconds = lengths30[i] / 30;
      offset30 += lengths30[i];
    } else seconds = await keep(`audio-${i}`, { text: planned.text, voice, speed }, () => require('./videoGenerator.cjs').generateTTSAudio(planned.text, target, voice, speed));
    const frames = Math.max(1, Math.round(seconds * 60));
    notify('beat_plan', 22 + i / storyboard.length * 55, `ChatGPT đang dựng bố cục và chuyển động cảnh ${i + 1}/${storyboard.length}…`);
    planned.direction = [planned.direction, ...(planned.actions || []).map((action,index) => `${index+1}. ${action}`), planned.layout ? `User-approved composition (800x360 sketch; scale coordinates to 1920x1080): ${JSON.stringify(planned.layout)}` : ''].join('\n');
    const boardInput = { text: planned.text, seconds, direction: planned.direction, userApproved:true, previous, firstScene: i === 0, bible: storyboard.bible, outline: storyboard.outline };
    const boardKey = createHash('sha256').update(JSON.stringify(boardInput)).digest('hex').slice(0,20);
    const revisionFile = path.join(runRoot, `storyboard-${i + 1}-${boardKey}-latest.json`);
    const board = await keep(`board-${i}`, boardInput, () => directScene({ text: planned.text, seconds, direction: planned.direction, userApproved:true, previous, firstScene: i === 0, bible: storyboard.bible, outline: storyboard.outline }, undefined, {
      resumeRevision: fs.existsSync(revisionFile) ? JSON.parse(fs.readFileSync(revisionFile, 'utf8')) : undefined,
      onProgress: ({ attempt, maxAttempts, phase }) => notify('beat_plan', 22 + i / storyboard.length * 55, `${phase === 'review' ? 'Kiểm tra' : attempt > 1 ? 'Tự tối ưu' : 'Thiết kế'} storyboard cảnh ${i + 1}/${storyboard.length} · lượt ${attempt}/${maxAttempts}…`),
      onDiagnostic: diagnostic,
      onAttempt: revision => {
        fs.writeFileSync(path.join(runRoot, `storyboard-${i + 1}-revision-${revision.attempt}.json`), JSON.stringify(revision, null, 2));
        fs.writeFileSync(revisionFile, JSON.stringify(revision, null, 2));
      },
    }));
    fs.writeFileSync(path.join(runRoot, `storyboard-${i + 1}.json`), JSON.stringify(board, null, 2));
    const words = planned.text.trim().split(/\s+/u);
    const anchors = [...new Set(board.shots.flatMap(shot => [shot.startWord, ...shot.events.map(event => event.word)]))].sort((a,b) => a-b);
    let aligned = [];
    try { aligned = await alignAudio(target, anchors.map((word,j) => words.slice(word, anchors[j+1] ?? words.length).join(' '))); } catch (error) { diagnostic({ stage: 'shot-timing', scene: i + 1, fallback: 'proportional', error: error.message }); }
    const anchorFrames = spreadTiming(anchors.map((word,j) => (anchors[j+1] ?? words.length)-word), frames, aligned.map(t => t.start * 60));
    aligned = anchorFrames.map(frame => ({ start: frame / 60 }));
    const wordTiming = Object.fromEntries(anchors.map((word,j) => [word, aligned[j]]));
    const shots = timedBoard(board, board.shots.map(shot => wordTiming[shot.startWord]), frames);
    const beats = [];
    for (const [j, design] of shots.entries()) {
      const caption = words.slice(design.startWord, design.endWord).join(' ');
      const events = design.events.map(event => ({ ...event, at: Math.max(0, Math.min(1, (wordTiming[event.word].start * 60 - design.start_frame_offset) / Math.max(1, design.duration_in_frames - 1))) }));
      const shotInput = { text: caption, seconds: design.duration_in_frames / 60, previous, bible: storyboard.bible, outline: storyboard.outline,
        direction: JSON.stringify({ ...design, events, instruction: 'Use these exact normalized event times in keyframes. Preserve incoming/outgoing state. One leading motion; holds around contact. Follow the approved storyboard; timing is approximate, keep motion smooth and cover the entire audio span.' }) };
      const draftKey = createHash('sha256').update(JSON.stringify(shotInput)).digest('hex').slice(0,20);
      const draftFile = path.join(runRoot, `draft-${i}-${j}-${draftKey}.json`);
      const shot = await keep(`shot-${i}-${j}`, shotInput, () => planShot(shotInput, undefined, {
        initial: fs.existsSync(draftFile) ? JSON.parse(fs.readFileSync(draftFile,'utf8')) : undefined,
        onDraft: draft => fs.writeFileSync(draftFile,JSON.stringify(draft,null,2)),
        onWarning: warning => diagnostic({ stage: 'normalize-shot', scene: i + 1, shot: j + 1, warning }),
      }));
      beats.push({ id: `shot_${run}_${i}_${j}`, sub_index: j + 1, title: `${planned.title} · ${j + 1}`, caption, prompt: shot.direction, direction_plan: { ...design, events },
        image_file: '', image_method: 'remotion', remotion: shot, duration_in_seconds: design.duration_in_frames / 60, duration_in_frames: design.duration_in_frames, start_frame_offset: design.start_frame_offset });
      previous = JSON.stringify({ state: design.outgoingState, shot });
      checkpoint({ stage: 'animation', scene: i + 1, completedScenes: scenes, currentBeats: beats, storyboard: board });
    }
    scenes.push({ id: i + 1, title: planned.title, text: planned.text, narration: planned.text, prompt: planned.direction,
      audio_file: file, image_file: '', beats, storyboard: board, duration_in_seconds: frames / 60, duration_in_frames: frames, start_frame: start });
    start += frames;
  }
  const project = { metadata: { title, subtitle, video_mode: 'remotion', remotion_style: 'STICKMAN_500IQ_V1', fps: 60, width: 1920, height: 1080,
    pacing: 'continuous-scene-v2', output_standard: 'docs/REMOTION_OUTPUT_STANDARD.md', quality_review: { status: 'pending_visual_review', plan_review: 'passed', visual_review: null },
    story_bible: storyboard.bible, story_outline: storyboard.outline, voice, speed, image_density: imageDensity, audio_source: source ? 'import' : 'tts', imported_audio: importedAudio,
    ...(transcript ? { audio_transcript: transcript, narration_source: 'audio_transcript', reference_script: referenceScript } : {}),
    total_scenes: scenes.length, total_duration_in_frames: start, total_duration_in_seconds: (start / 60).toFixed(2), created_at: new Date().toISOString() }, scenes };
  notify('images', 78, 'Đã dựng các lớp vector. Chuẩn bị xuất bằng Remotion…');
  checkpoint({ stage: 'animatic', project });
  await retry('Xuất animatic', () => renderRemotion(project, runRoot, publicRoot, progress => notify('render', 78 + progress * .03, `Animatic: ${progress}%`), { animatic: true }));
  await retry('Xuất MP4', () => renderRemotion(project, runRoot, publicRoot, progress => notify('render', 81 + progress * .18, `Remotion đang xuất MP4: ${progress}%`)));
  try { await require('./remotion-review-packet.cjs').reviewPacket(path.join(runRoot, 'scenes.json'), path.join(runRoot, 'final-video.mp4'), path.join(runRoot, 'review')); } catch (error) { diagnostic({ stage: 'review-packet', error: error.message }); }
  checkpoint({ stage: 'pending_visual_review', project });
  notify('done', 100, 'Hoạt hình đã sẵn sàng.');
  return { ...project, finalVideoPath: path.join(runRoot, 'final-video.mp4'), productionArtifacts: runRoot, success: true };
}
module.exports = { generateVideo };
