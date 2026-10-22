const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { planStory, planSequence } = require('./remotionPlanner.cjs');
const editor = require('./projectEditor.cjs');
const { alignAudio, transcribeAudio, transcriptScenes } = require('./audioAlignment.cjs');
const { renderRemotion } = require('./remotionRender.cjs');

async function generateVideo(options) {
  const { title = 'Hoạt hình người que', subtitle = '', voice = 'vi-VN-Standard-B', speed = 1, importedAudio, audioBoundaries, imageDensity = 'balanced', onProgress = () => {} } = options;
  const notify = (stepKey, percent, message) => onProgress({ type: 'progress', stepKey, percent, message });
  const publicRoot = path.resolve('public');
  const run = randomUUID();
  fs.mkdirSync(path.join(publicRoot, 'audio'), { recursive: true });
  const state = await require('./chatgptBrowser.cjs').ChatGPTBrowser.getInstance().open();
  if (!state.connected) throw new Error(state.message);
  let text = options.scenes?.length ? options.scenes.map(scene => scene.narration || scene.text).join('\n\n') : options.content || options.script || '';
  const referenceScript = text;
  let source, sourceDuration, transcript;
  if (importedAudio) {
    if (!/^import_[\w-]+\.wav$/.test(importedAudio)) throw new Error('Hãy nhập audio qua chức năng tải tệp.');
    source = editor.asset(publicRoot, 'audio', importedAudio);
    sourceDuration = await editor.probe(source);
    notify('storyboard', 5, 'Nhận dạng lời thoại từ audio đã nhập…');
    transcript = await transcribeAudio(source);
    text = transcript.text;
  }
  if (typeof text !== 'string' || !text.trim() || text.length > 80000) throw new Error('Cần kịch bản hoặc lời thoại hợp lệ, tối đa 80.000 ký tự.');
  notify('storyboard', 10, 'ChatGPT đang phân tích lời thoại và lên ý tưởng phân cảnh…');
  const storyboard = source && audioBoundaries?.length
    ? transcriptScenes(transcript, audioBoundaries, sourceDuration)
    : await planStory(text, title, imageDensity);
  let cuts;
  if (source) {
    notify('tts', 17, 'Căn phân cảnh theo lời đọc trong audio…');
    cuts = audioBoundaries?.length ? audioBoundaries : (await alignAudio(source, storyboard.map(scene => scene.text))).slice(1).map(t => t.start);
  }
  const lengths30 = source ? editor.allocateAudioFrames(storyboard, Math.round(sourceDuration * 30), cuts) : null;
  let offset30 = 0, start = 0, previous = '';
  const scenes = [];
  for (const [i, planned] of storyboard.entries()) {
    const file = `remotion_${run}_${i}.${source ? 'wav' : 'mp3'}`;
    const target = path.join(publicRoot, 'audio', file);
    notify('tts', 20 + i / storyboard.length * 55, `Chuẩn bị lời đọc cảnh ${i + 1}/${storyboard.length}…`);
    let seconds;
    if (source) {
      await editor.sliceAudio(source, target, offset30, lengths30[i]);
      seconds = lengths30[i] / 30;
      offset30 += lengths30[i];
    } else seconds = await require('./videoGenerator.cjs').generateTTSAudio(planned.text, target, voice, speed);
    const frames = Math.max(1, Math.round(seconds * 60));
    notify('beat_plan', 22 + i / storyboard.length * 55, `ChatGPT đang dựng bố cục và chuyển động cảnh ${i + 1}/${storyboard.length}…`);
    const sequence = await planSequence({ text: planned.text, direction: planned.direction, seconds, previous, bible: storyboard.bible, outline: storyboard.outline });
    const weight = sequence.reduce((sum, item) => sum + item.weight, 0);
    let beatOffset = 0, cumulative = 0;
    const beats = sequence.map(({ shot, weight: share }, j) => {
      cumulative += share;
      const end = j === sequence.length - 1 ? frames : Math.max(beatOffset + 1, Math.min(frames - (sequence.length - j - 1), Math.round(frames * cumulative / weight)));
      const length = end - beatOffset;
      const beat = { id: `shot_${run}_${i}_${j}`, sub_index: j + 1, title: `${planned.title} \u00b7 ${j + 1}`, caption: planned.text, prompt: shot.direction,
        image_file: '', image_method: 'remotion', remotion: shot, duration_in_seconds: length / 60, duration_in_frames: length, start_frame_offset: beatOffset };
      beatOffset = end;
      return beat;
    });
    previous = JSON.stringify(sequence[sequence.length - 1].shot);
    scenes.push({ id: i + 1, title: planned.title, text: planned.text, narration: planned.text, prompt: planned.direction,
      audio_file: file, image_file: '', beats, duration_in_seconds: frames / 60, duration_in_frames: frames, start_frame: start });
    start += frames;
  }
  const project = { metadata: { title, subtitle, video_mode: 'remotion', remotion_style: 'STICKMAN_500IQ_V1', fps: 60, width: 1920, height: 1080,
    story_bible: storyboard.bible, story_outline: storyboard.outline, voice, speed, image_density: imageDensity, audio_source: source ? 'import' : 'tts', imported_audio: importedAudio,
    ...(transcript ? { audio_transcript: transcript, narration_source: 'audio_transcript', reference_script: referenceScript } : {}),
    total_scenes: scenes.length, total_duration_in_frames: start, total_duration_in_seconds: (start / 60).toFixed(2), created_at: new Date().toISOString() }, scenes };
  notify('images', 78, 'Đã dựng các lớp vector. Chuẩn bị xuất bằng Remotion…');
  await renderRemotion(project, publicRoot, publicRoot, progress => notify('render', 80 + progress * .19, `Remotion đang xuất MP4: ${progress}%`));
  notify('done', 100, 'Hoạt hình đã sẵn sàng.');
  return { ...project, success: true };
}
module.exports = { generateVideo };
