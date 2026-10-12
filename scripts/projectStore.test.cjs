const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createStore } = require('./projectStore.cjs');
const project = () => ({ metadata: { title: 'Original', fps: 30, total_duration_in_seconds: '1' }, scenes: [{ id: 1, duration_in_frames: 30, audio_file: 'a.wav', beats: [{ id: 'b', image_file: 'b.png', duration_in_frames: 30 }] }] });
test('migrates once, isolates project edits and exports, and does not resurrect deleted projects', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'project-store-'));
  try {
    fs.writeFileSync(path.join(root, 'scenes.json'), JSON.stringify(project()));
    fs.writeFileSync(path.join(root, 'final-video.mp4'), 'legacy-video');
    const store = createStore(root);
    const [legacy] = store.list();
    assert.equal(store.list().length, 1);
    const other = store.create(project(), path.join(root, 'final-video.mp4'));
    const id = other.metadata.project_id;
    const edited = store.read(id); edited.metadata.title = 'Edited';
    await store.save(id, edited);
    assert.equal(store.read(legacy.id).metadata.title, 'Original');
    assert.equal(store.read(id).metadata.title, 'Edited');
    fs.writeFileSync(path.join(root, 'final-video.mp4'), 'next-video');
    assert.equal(fs.readFileSync(path.join(root, 'projects', legacy.id, 'final-video.mp4'), 'utf8'), 'legacy-video');
    assert.throws(() => store.read('../scenes'), /ID/);
    store.remove(legacy.id);
    assert.equal(store.read(id).metadata.title, 'Edited');
    await assert.rejects(store.save(legacy.id, project()), /Không tìm thấy/);
    store.remove(id);
    assert.deepEqual(createStore(root).list(), []);
    assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'scenes.json'))).metadata.title, 'Original');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
