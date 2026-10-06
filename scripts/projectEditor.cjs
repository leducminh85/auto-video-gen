const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const run = promisify(execFile);
const { defaultPrompt } = require('../src/config/imageStyle.json');
const binary = name => fs.existsSync(`/opt/homebrew/bin/${name}`) ? `/opt/homebrew/bin/${name}` : name;
let busy = false;
async function exclusive(work) {
  if (busy) throw new Error('Đang xử lý video. Vui lòng chờ tác vụ hiện tại hoàn tất.');
  busy = true;
  try { return await work(); } finally { busy = false; }
}
function asset(root, folder, name) {
  if (typeof name !== 'string' || !/^[\w.-]+$/.test(name) || name.startsWith('.')) throw new Error('Tên tệp không hợp lệ.');
  const file = path.join(root, folder, name);
  if (!fs.existsSync(file)) throw new Error(`Không tìm thấy tệp: ${name}`);
  return file;
}
function normalizeProject(input) {
  const project = structuredClone(input);
  if (!project?.metadata || !Array.isArray(project.scenes) || !project.scenes.length) throw new Error('Dự án phải có ít nhất một cảnh.');
  const fps = project.metadata.fps;
  if (!Number.isInteger(fps) || fps < 1 || fps > 60) throw new Error('FPS không hợp lệ.');
  let start = 0;
  const ids = new Set();
  for (const scene of project.scenes) {
    if (!Number.isInteger(scene.id) || scene.id < 1 || ids.has(scene.id)) throw new Error('ID cảnh không hợp lệ hoặc bị trùng.');
    ids.add(scene.id);
    if (!Number.isInteger(scene.duration_in_frames) || scene.duration_in_frames < 1) throw new Error('Thời lượng cảnh không hợp lệ.');
    if (!Array.isArray(scene.beats) || !scene.beats.length) throw new Error('Mỗi cảnh cần ít nhất một ảnh.');
    const beatIds = new Set();
    let offset = 0;
    for (const [index, beat] of scene.beats.entries()) {
      if (typeof beat.id !== 'string' || beatIds.has(beat.id)) throw new Error('ID ảnh không hợp lệ hoặc bị trùng.');
      beatIds.add(beat.id);
      if (!Number.isInteger(beat.duration_in_frames) || beat.duration_in_frames < 1) throw new Error('Mỗi ảnh phải có ít nhất một frame.');
      beat.sub_index = index + 1;
      beat.start_frame_offset = offset;
      beat.duration_in_seconds = beat.duration_in_frames / fps;
      offset += beat.duration_in_frames;
    }
    if (offset !== scene.duration_in_frames) throw new Error('Tổng thời lượng ảnh phải bằng thời lượng cảnh.');
    scene.start_frame = start;
    scene.duration_in_seconds = scene.duration_in_frames / fps;
    scene.image_file = scene.beats[0].image_file;
    scene.image_version = scene.beats[0].image_version;
    scene.prompt = scene.beats[0].prompt;
    start += scene.duration_in_frames;
  }
  project.metadata.total_scenes = project.scenes.length;
  project.metadata.total_duration_in_frames = start;
  project.metadata.total_duration_in_seconds = (start / fps).toFixed(2);
  delete project.metadata.quality_report;
  return project;
}
function saveProject(project, root) {
  const target = path.join(root, 'scenes.json');
  const tmp = `${target}.${randomUUID()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(project, null, 2));
  fs.renameSync(tmp, target);
}
function styledPrompt(plan, stylePrompt = defaultPrompt) {
  return `${stylePrompt.trim() || defaultPrompt}\n\nScene content: ${plan.what_to_show || plan.action || plan.meaning || ''}. Narration: ${plan.meaning || ''}. Composition: ${plan.how_to_show || plan.composition || ''}. Illustrate the narration faithfully without inventing facts. Apply the visual style above to all subjects.`;
}
async function probe(file) {
  const { stdout } = await run(binary('ffprobe'), ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_type:format=duration', '-of', 'json', file]);
  const info = JSON.parse(stdout);
  const duration = Number(info.format?.duration);
  if (!info.streams?.length || !Number.isFinite(duration) || duration <= 0 || duration > 7200) throw new Error('Audio phải có thời lượng từ 0 đến 120 phút.');
  return duration;
}
async function importAudio(buffer, root) {
  if (!buffer.length || buffer.length > 100 * 1024 * 1024) throw new Error('Tệp audio phải nhỏ hơn 100 MB.');
  fs.mkdirSync(path.join(root, 'audio'), { recursive: true });
  const id = `import_${randomUUID()}`;
  const source = path.join(root, 'audio', `${id}.upload`);
  const output = path.join(root, 'audio', `${id}.wav`);
  fs.writeFileSync(source, buffer);
  try {
    await probe(source);
    await run(binary('ffmpeg'), ['-v', 'error', '-y', '-i', source, '-vn', '-ac', '2', '-ar', '48000', output]);
    return { file: path.basename(output), duration: await probe(output) };
  } catch (error) {
    fs.rmSync(output, { force: true });
    throw error;
  } finally { fs.rmSync(source, { force: true }); }
}
function allocateAudioFrames(scenes, totalFrames, boundaries) {
  if (totalFrames < scenes.length) throw new Error('Audio quá ngắn cho số cảnh.');
  if (boundaries !== undefined) {
    if (!Array.isArray(boundaries) || boundaries.length !== scenes.length - 1 || boundaries.some((v, i) => !Number.isFinite(v) || v <= (i ? boundaries[i - 1] : 0))) throw new Error('Mốc cắt audio phải tăng dần, mỗi mốc ứng với một cảnh.');
    const ends = [...boundaries.map(v => Math.round(v * 30)), totalFrames];
    const lengths = ends.map((end, i) => end - (i ? ends[i - 1] : 0));
    if (lengths.some(n => n < 1)) throw new Error('Mốc cắt vượt thời lượng audio hoặc quá gần nhau.');
    return lengths;
  }
  const weights = scenes.map(s => Math.max(1, (s.narration || s.text || '').trim().split(/\s+/).length));
  const total = weights.reduce((a, b) => a + b, 0);
  let weight = 0, previous = 0;
  return weights.map((w, i) => {
    weight += w;
    const end = i === weights.length - 1 ? totalFrames : Math.max(previous + 1, Math.min(totalFrames - (weights.length - i - 1), Math.round(weight / total * totalFrames)));
    const length = end - previous;
    previous = end;
    return length;
  });
}
async function sliceAudio(source, target, startFrames, frames) {
  await run(binary('ffmpeg'), ['-v', 'error', '-y', '-i', source, '-ss', String(startFrames / 30), '-t', String(frames / 30), '-ac', '2', '-ar', '48000', target]);
}
async function renderProject(input, root) {
  const project = normalizeProject(input);
  const { fps, width, height } = project.metadata;
  if (![width, height].every(n => Number.isInteger(n) && n >= 2 && n <= 3840 && n % 2 === 0)) throw new Error('Kích thước video không hợp lệ.');
  for (const scene of project.scenes) {
    asset(root, 'audio', scene.audio_file);
    scene.beats.forEach(b => asset(root, 'images', b.image_file));
  }
  const temp = fs.mkdtempSync(path.join(root, 'render-'));
  const ffmpeg = args => run(binary('ffmpeg'), ['-v', 'error', '-y', ...args], { maxBuffer: 1024 * 1024 });
  try {
    const clips = [];
    for (const [sceneIndex, scene] of project.scenes.entries()) {
      const beats = [];
      for (const [i, beat] of scene.beats.entries()) {
        const file = path.join(temp, `s${sceneIndex}b${i}.mp4`);
        await ffmpeg(['-loop', '1', '-i', asset(root, 'images', beat.image_file), '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:white,setsar=1,zoompan=z='min(zoom+0.0003,1.015)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}:fps=${fps}`, '-frames:v', String(beat.duration_in_frames), '-r', String(fps), '-c:v', 'libx264', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-an', file]);
        beats.push(file);
      }
      const list = path.join(temp, `s${sceneIndex}.txt`);
      fs.writeFileSync(list, beats.map(file => `file '${path.basename(file)}'`).join('\n'));
      const clip = path.join(temp, `scene${sceneIndex}.mp4`);
      await ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-i', asset(root, 'audio', scene.audio_file), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-af', 'apad', '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-t', String(scene.duration_in_frames / fps), clip]);
      clips.push(clip);
    }
    const list = path.join(temp, 'all.txt');
    fs.writeFileSync(list, clips.map(file => `file '${path.basename(file)}'`).join('\n'));
    const output = path.join(temp, 'final.mp4');
    await ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', output]);
    fs.renameSync(output, path.join(root, 'final-video.mp4'));
    project.metadata.render_dirty = false;
    saveProject(project, root);
    return project;
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
module.exports = { exclusive, asset, normalizeProject, saveProject, styledPrompt, probe, importAudio, allocateAudioFrames, sliceAudio, renderProject };
