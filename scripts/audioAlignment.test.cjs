const { test } = require('node:test');
const assert = require('node:assert/strict');
const { segmentSceneIntoBeats } = require('./visualBeatPlanner.cjs');
const { applyBeatTiming } = require('./audioAlignment.cjs');

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
});
