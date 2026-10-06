import type { SceneData, VisualBeat } from '../types/scenes';

function withTiming(scene: SceneData, beats: VisualBeat[], fps: number): SceneData {
  if (!beats.length || beats.some(beat => beat.duration_in_frames < 1)) throw new Error('Mỗi cảnh cần ít nhất một ảnh có thời lượng hợp lệ.');
  let offset = 0;
  const next = beats.map((beat, index) => {
    const result = { ...beat, sub_index: index + 1, duration_in_seconds: beat.duration_in_frames / fps, start_frame_offset: offset };
    offset += beat.duration_in_frames;
    return result;
  });
  if (offset !== scene.duration_in_frames) throw new Error('Thời lượng ảnh không khớp với audio.');
  return { ...scene, beats: next, image_file: next[0].image_file, image_version: next[0].image_version, prompt: next[0].prompt };
}

export function insertBeat(scene: SceneData, beat: VisualBeat, afterId: string, fps: number): SceneData {
  const beats = [...(scene.beats || [])];
  const index = beats.findIndex(item => item.id === afterId);
  if (index < 0 || beats[index].duration_in_frames < 2) throw new Error('Ảnh này quá ngắn để chia thêm. Hãy chọn ảnh khác.');
  const frames = beats[index].duration_in_frames;
  beats.splice(index, 1, { ...beats[index], duration_in_frames: Math.ceil(frames / 2) }, { ...beat, duration_in_frames: Math.floor(frames / 2) });
  return withTiming(scene, beats, fps);
}

export function removeBeat(scene: SceneData, beatId: string, fps: number): SceneData {
  const beats = (scene.beats || []).map(beat => ({ ...beat }));
  const index = beats.findIndex(beat => beat.id === beatId);
  if (beats.length <= 1 || index < 0) throw new Error('Cảnh cần giữ ít nhất một ảnh.');
  const [removed] = beats.splice(index, 1);
  beats[Math.max(0, index - 1)].duration_in_frames += removed.duration_in_frames;
  return withTiming(scene, beats, fps);
}

export function reorderBeat(scene: SceneData, beatId: string, targetIndex: number, fps: number): SceneData {
  const beats = [...(scene.beats || [])];
  const index = beats.findIndex(beat => beat.id === beatId);
  if (index < 0 || !Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= beats.length) throw new Error('Vị trí ảnh không hợp lệ.');
  const [beat] = beats.splice(index, 1);
  beats.splice(targetIndex, 0, beat);
  return withTiming(scene, beats, fps);
}

export function resizeBeatBoundary(scene: SceneData, boundaryIndex: number, endFrame: number, fps: number): SceneData {
  const beats = (scene.beats || []).map(beat => ({ ...beat }));
  if (boundaryIndex < 0 || boundaryIndex >= beats.length - 1 || !Number.isFinite(endFrame)) throw new Error('Mốc thời gian không hợp lệ.');
  const left = beats[boundaryIndex];
  const right = beats[boundaryIndex + 1];
  const start = beats.slice(0, boundaryIndex).reduce((sum, beat) => sum + beat.duration_in_frames, 0);
  const end = start + left.duration_in_frames + right.duration_in_frames;
  const clamped = Math.max(start + 1, Math.min(end - 1, Math.round(endFrame)));
  left.duration_in_frames = clamped - start;
  right.duration_in_frames = end - clamped;
  return withTiming(scene, beats, fps);
}
