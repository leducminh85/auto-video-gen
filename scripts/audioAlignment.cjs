const { spawn } = require('node:child_process');
const path = require('node:path');

function alignAudio(audio, chunks, range = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.WEVIC_PYTHON || 'python3', [path.join(__dirname, 'alignAudio.py')], { stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '', errors = '';
    const timer = setTimeout(() => child.kill(), 30 * 60 * 1000);
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { errors = (errors + data).slice(-6000); });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`Không thể căn lời đọc với audio. ${errors || 'Tiến trình nhận diện bị dừng.'} Cần Python và faster-whisper (scripts/requirements-audio.txt).`));
      try { resolve(JSON.parse(output)); } catch { reject(new Error('Kết quả căn audio không hợp lệ.')); }
    });
    child.stdin.on('error', () => {});
    child.stdin.end(JSON.stringify({ audio, chunks, ...range }));
  });
}

function applyBeatTiming(beats, timing, totalFrames, offset = 0, fps = 30) {
  const starts = timing.map((t, i) => i === 0 ? 0 : Math.round((t.start - offset) * fps));
  if (starts.length !== beats.length || starts.some((n, i) => n < 0 || n >= totalFrames || (i > 0 && n <= starts[i - 1]))) throw new Error('Mốc ảnh không hợp lệ sau khi căn audio.');
  return beats.map((beat, i) => ({ ...beat, start_frame_offset: starts[i], duration_in_frames: (starts[i + 1] ?? totalFrames) - starts[i], duration_in_seconds: ((starts[i + 1] ?? totalFrames) - starts[i]) / fps }));
}
module.exports = { alignAudio, applyBeatTiming };
