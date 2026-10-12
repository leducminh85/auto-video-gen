const { test } = require('node:test');
const assert = require('node:assert/strict');
const { segmentSceneIntoBeats } = require('./visualBeatPlanner.cjs');
const { applyBeatTiming, transcriptScenes } = require('./audioAlignment.cjs');

test('density increases images while preserving all narration and frame totals', () => {
  const text = 'Một khách bước vào quán và ngồi xuống máy tính. Người tiếp theo gọi nước rồi bắt đầu chơi cùng bạn bè. Tuy nhiên, quán vẫn còn nhiều máy trống để phục vụ khách mới.';
  const counts = [];
  for (const density of ['sparse','balanced','dense']) {
    const beats = segmentSceneIntoBeats({id:1,title:'Test',text},18,540,density);
    counts.push(beats.length);
    assert.equal(beats.map(b=>b.text).join(' '),text);
    assert.equal(beats.reduce((n,b)=>n+b.duration_in_frames,0),540);
  }
  assert.ok(counts[0] < counts[1] && counts[1] < counts[2]);
});
test('beat frames use actual speech timestamps and conserve scene duration', () => {
  const beats = applyBeatTiming([{id:'a'},{id:'b'}],[{start:33.14},{start:39.26}],353,33.1333333);
  assert.equal(beats[1].start_frame_offset,184);
  assert.equal(beats.reduce((n,b)=>n+b.duration_in_frames,0),353);
  assert.throws(()=>applyBeatTiming([{},{}],[{start:0},{start:100}],300));
  assert.throws(()=>applyBeatTiming([{},{}],[{start:0},{start:NaN}],300));
  assert.throws(()=>applyBeatTiming([{}],[{start:0}],NaN));
});

test('manual boundaries use audio words, preserving all words independently of the reference script', () => {
  const transcript = { words: [{ word: ' First', start: 0, end: 1 }, { word: ' sentence.', start: 1, end: 2 }, { word: ' Second.', start: 4, end: 5 }] };
  assert.deepEqual(transcriptScenes(transcript, [3], 6).map(s => s.text), ['First sentence.', 'Second.']);
  assert.equal(transcriptScenes(transcript, [], 6)[0].text, 'First sentence. Second.');
  assert.throws(() => transcriptScenes(transcript, [3, 2], 6), /Mốc cắt/);
  assert.throws(() => transcriptScenes(transcript, [3, 3.5], 6), /không có lời đọc/);
});
