const { spawn } = require('node:child_process');
const path = require('node:path');

function alignAudio(audio, chunks, range = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.WEVIC_PYTHON || (process.platform === 'win32' ? 'python' : 'python3'), ['-X', 'utf8', path.join(__dirname, 'alignAudio.py')], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '', errors = '';
    const timer = setTimeout(() => child.kill(), 30 * 60 * 1000);
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { errors = (errors + data).slice(-6000); });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) {
        const dependencyHelp = /No module named|ModuleNotFoundError/.test(errors) ? ' Cần Python và faster-whisper (scripts/requirements-audio.txt).' : '';
        return reject(new Error(`Không thể căn lời đọc với audio. ${errors.trim() || 'Tiến trình nhận diện bị dừng.'}${dependencyHelp}`));
      }
      try { resolve(JSON.parse(output)); } catch { reject(new Error('Kết quả căn audio không hợp lệ.')); }
    });
    child.stdin.on('error', () => {});
    child.stdin.end(JSON.stringify({ audio, chunks, ...range }));
  });
}

function applyBeatTiming(beats, timing, totalFrames, offset = 0, fps = 30) {
  const starts = timing.map((t, i) => i === 0 ? 0 : Math.round((t.start - offset) * fps));
  if (!Number.isInteger(totalFrames) || totalFrames < 1 || starts.length !== beats.length || starts.some((n, i) => !Number.isFinite(n) || n < 0 || n >= totalFrames || (i > 0 && n <= starts[i - 1]))) throw new Error('Mốc ảnh không hợp lệ sau khi căn audio.');
  return beats.map((beat, i) => ({ ...beat, start_frame_offset: starts[i], duration_in_frames: (starts[i + 1] ?? totalFrames) - starts[i], duration_in_seconds: ((starts[i + 1] ?? totalFrames) - starts[i]) / fps }));
}
async function transcribeAudio(audio) {
  const result = await alignAudio(audio, [], { mode: 'transcribe' });
  if (!result.text?.trim() || !Array.isArray(result.words) || !result.words.length) throw new Error('Không nhận dạng được lời nói trong audio.');
  if (result.words.some(w => typeof w.word !== 'string' || !Number.isFinite(w.start) || !Number.isFinite(w.end) || w.start < 0 || w.end < w.start)) throw new Error('Mốc nhận dạng audio không hợp lệ.');
  return result;
}

function transcriptScenes(transcript, boundaries = [], duration) {
  if (!Array.isArray(boundaries) || boundaries.some((t, i) => !Number.isFinite(t) || t <= (boundaries[i - 1] ?? 0) || t >= duration)) throw new Error('Mốc cắt audio không hợp lệ.');
  const groups = Array.from({ length: boundaries.length + 1 }, () => []);
  for (const word of transcript.words) {
    const next = boundaries.findIndex(t => word.start < t);
    groups[next < 0 ? boundaries.length : next].push(word.word.trim());
  }
  return groups.map((words, i) => {
    const text = words.join(' ').trim();
    if (!text) throw new Error(`Khoảng audio ${i + 1} không có lời đọc. Hãy điều chỉnh mốc cắt.`);
    return { title: `Đoạn audio ${i + 1}`, text, narration: text };
  });
}
module.exports = { alignAudio, applyBeatTiming, transcribeAudio, transcriptScenes };
