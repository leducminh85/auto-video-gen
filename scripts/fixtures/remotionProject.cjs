const shot = {
  version: 1, styleId: 'STICKMAN_500IQ_V1', background: '#E8DFD0', direction: 'Cảnh kiểm thử: Leo đứng bên bàn, nhìn cuốn sách và giơ tay.',
  camera: { scale: { from: 1, to: 1.04 } },
  layers: [
    { id: 'floor', type: 'rect', attrs: { x: 0, y: 820, width: 1920, height: 260, fill: '#9F927F' } },
    { id: 'window', label: 'Cửa sổ', type: 'g', x: 1100, y: 170, children: [
      { id: 'window-frame', type: 'rect', attrs: { width: 480, height: 390, fill: '#73685A' } },
      { id: 'window-glass', type: 'rect', attrs: { x: 18, y: 18, width: 444, height: 354, fill: '#BBCBD0' } },
      { id: 'window-cross', type: 'line', attrs: { x1: 240, y1: 0, x2: 240, y2: 390, stroke: '#73685A', strokeWidth: 18 } },
    ] },
    { id: 'leo', label: 'Leo', type: 'character', hero: true, x: 610, y: 400, scale: .95, emotion: 'confident', look: { from: 0, to: .4 }, raised: { from: 0, to: .25, start: .2, end: .65 } },
    { id: 'desk', label: 'Bàn sách', type: 'g', x: 980, y: 690, children: [
      { id: 'top', type: 'rect', attrs: { width: 580, height: 38, rx: 5, fill: 'url(#wood)' } },
      { id: 'leg1', type: 'rect', attrs: { x: 32, y: 38, width: 28, height: 200, fill: '#6D4C41' } },
      { id: 'leg2', type: 'rect', attrs: { x: 520, y: 38, width: 28, height: 200, fill: '#6D4C41' } },
      { id: 'book', type: 'path', attrs: { d: 'M120 0L145 -45Q210 -60 260 -25Q310 -60 380 -45L410 0Q325 -15 260 15Q200 -15 120 0Z', fill: '#FFF1D6', stroke: '#776D5B', strokeWidth: 4 } },
    ] },
    { id: 'title', label: 'Chữ trên cảnh', type: 'text', x: 130, y: 210, text: 'Cảnh kiểm thử Remotion', attrs: { fontSize: 46, fontWeight: 700, fill: '#3F3932' } },
  ],
};
function fixture() {
  return { metadata: { project_id: 'remotion-fixture', title: 'Kiểm thử hoạt hình', subtitle: '', video_mode: 'remotion', fps: 60, width: 1920, height: 1080, total_scenes: 1, total_duration_in_frames: 120, total_duration_in_seconds: '2', created_at: new Date().toISOString() },
    scenes: [{ id: 1, title: 'Leo bên bàn sách', text: 'Leo nhìn cuốn sách trên bàn.', audio_file: 'fixture.wav', image_file: '', prompt: shot.direction, start_frame: 0, duration_in_frames: 120, duration_in_seconds: 2,
      beats: [{ id: 'beat-1', sub_index: 1, title: 'Leo bên bàn sách', caption: 'Leo nhìn cuốn sách trên bàn.', prompt: shot.direction, remotion: structuredClone(shot), image_file: '', start_frame_offset: 0, duration_in_frames: 120, duration_in_seconds: 2 }] }] };
}
module.exports = { fixture, shot };
