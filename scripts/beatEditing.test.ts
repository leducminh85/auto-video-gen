import { test } from 'node:test';
import assert from 'node:assert/strict';
import { insertBeat, removeBeat } from '../src/utils/beatEditing';
import type { SceneData, VisualBeat } from '../src/types/scenes';

const beats = [90, 60, 150].map((duration, index) => ({ id: `b${index}`, image_file: `${index}.png`, duration_in_frames: duration, prompt: 'bird', sub_index: index + 1, title: 'Bird', duration_in_seconds: duration / 30, start_frame_offset: [0, 90, 150][index] }));
const scene = { id: 1, audio_file: 'voice.wav', duration_in_frames: 300, beats } as SceneData;
const assertTimeline = (result: SceneData, durations: number[]) => {
  assert.deepEqual(result.beats!.map(beat => beat.duration_in_frames), durations);
  assert.equal(result.beats!.reduce((sum, beat) => sum + beat.duration_in_frames, 0), 300);
  let offset = 0;
  for (const beat of result.beats!) { assert.equal(beat.start_frame_offset, offset); offset += beat.duration_in_frames; }
  assert.equal(result.audio_file, scene.audio_file);
};
test('inserting a beat splits only its selected neighbor', () => {
  const result = insertBeat(scene, { ...beats[0], id: 'new' }, 'b1', 30);
  assertTimeline(result, [90, 30, 30, 150]);
  assert.deepEqual(result.beats!.map(beat => beat.id), ['b0', 'b1', 'new', 'b2']);
  assert.equal(scene.beats![1].duration_in_frames, 60);
});
test('deletion gives time to the preceding image, or the first remaining image', () => {
  assertTimeline(removeBeat(scene, 'b0', 30), [150, 150]);
  assertTimeline(removeBeat(scene, 'b1', 30), [150, 150]);
  assertTimeline(removeBeat(scene, 'b2', 30), [90, 210]);
  assert.equal(scene.beats!.length, 3);
});
test('last image and one-frame split are rejected without modifying the scene', () => {
  assert.throws(() => removeBeat({ ...scene, beats: [beats[0]] }, 'b0', 30));
  assert.throws(() => insertBeat({ ...scene, beats: [{ ...beats[0], duration_in_frames: 1 }] }, {} as VisualBeat, 'b0', 30));
});

test('reordering preserves image identity, duration and exact contiguous offsets', async () => {
  const { reorderBeat } = await import('../src/utils/beatEditing');
  const result = reorderBeat(scene, 'b0', 2, 30);
  assertTimeline(result, [60, 150, 90]);
  assert.deepEqual(result.beats!.map(beat => beat.id), ['b1', 'b2', 'b0']);
  assert.deepEqual(scene.beats!.map(beat => beat.id), ['b0', 'b1', 'b2']);
});
test('resizing shares time only across one boundary, snaps and clamps to one frame', async () => {
  const { resizeBeatBoundary } = await import('../src/utils/beatEditing');
  assertTimeline(resizeBeatBoundary(scene, 0, 120.4, 30), [120, 30, 150]);
  assertTimeline(resizeBeatBoundary(scene, 0, -100, 30), [1, 149, 150]);
  assertTimeline(resizeBeatBoundary(scene, 0, 999, 30), [149, 1, 150]);
  assertTimeline(resizeBeatBoundary(scene, 1, 299, 30), [90, 209, 1]);
  assert.throws(() => resizeBeatBoundary(scene, 2, 100, 30));
  assert.throws(() => resizeBeatBoundary(scene, 0, NaN, 30));
});
