const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const editor = require('./projectEditor.cjs');
function createStore(publicRoot) {
  const root = path.join(publicRoot, 'projects');
  const directory = id => {
    if (!/^[a-zA-Z0-9-]+$/.test(id) || id === 'new') throw new Error('ID project không hợp lệ.');
    return path.join(root, id);
  };
  function read(id) {
    const file = path.join(directory(id), 'scenes.json');
    if (!fs.existsSync(file)) { const error = new Error('Không tìm thấy project.'); error.status = 404; throw error; }
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  function create(project, videoFile) {
    const id = randomUUID();
    const dir = directory(id);
    fs.mkdirSync(dir, { recursive: true });
    try {
      const data = structuredClone(project);
      data.metadata.project_id = id;
      data.metadata.updated_at = new Date().toISOString();
      if (videoFile && fs.existsSync(videoFile)) fs.copyFileSync(videoFile, path.join(dir, 'final-video.mp4'));
      else data.metadata.render_dirty = true;
      editor.saveProject(data, dir);
      return data;
    } catch (error) { fs.rmSync(dir, { recursive: true, force: true }); throw error; }
  }
  function migrate() {
    fs.mkdirSync(root, { recursive: true });
    const marker = path.join(root, '.migrated');
    if (fs.existsSync(marker)) return;
    if (!fs.readdirSync(root).some(name => !name.startsWith('.')) && fs.existsSync(path.join(publicRoot, 'scenes.json'))) {
      create(JSON.parse(fs.readFileSync(path.join(publicRoot, 'scenes.json'), 'utf8')), path.join(publicRoot, 'final-video.mp4'));
    }
    fs.writeFileSync(marker, '1');
  }
  function list() {
    migrate();
    return fs.readdirSync(root).filter(id => !id.startsWith('.')).map(id => {
      const data = read(id);
      const image = data.scenes[0]?.beats?.[0]?.image_file || data.scenes[0]?.image_file;
      return { id, title: data.metadata.title || 'Video chưa đặt tên', thumbnail: image ? `/images/${encodeURIComponent(image)}` : null,
        duration: Number(data.metadata.total_duration_in_seconds), updatedAt: data.metadata.updated_at || data.metadata.created_at };
    }).sort((a,b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }
  async function save(id, input, render = false) {
    read(id);
    const project = editor.normalizeProject(input);
    project.metadata.project_id = id;
    project.metadata.updated_at = new Date().toISOString();
    if (render) return editor.renderProject(project, directory(id), publicRoot);
    project.metadata.render_dirty = true;
    editor.saveProject(project, directory(id));
    return project;
  }
  function remove(id) { read(id); fs.rmSync(directory(id), { recursive: true }); }
  return { read, create, migrate, list, save, remove };
}
module.exports = { createStore };
