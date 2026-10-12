import { useEffect, useState } from 'react';
import { MoreHorizontal, Plus, Film } from 'lucide-react';
import App from './App';
import { CreatorPanel } from './components/CreatorPanel';
import { useDialog } from './utils/useDialog';
import type { VideoMetadata } from './types/scenes';

type Project = { id: string; title: string; thumbnail: string | null; duration: number; updatedAt: string };
const emptyMetadata: VideoMetadata = { title: '', subtitle: '', fps: 30, width: 1920, height: 1080, total_scenes: 0, total_duration_in_frames: 1, total_duration_in_seconds: '0', created_at: '' };
function DeleteProject({ project, onClose, onDeleted }: { project: Project; onClose: () => void; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ref = useDialog(onClose, !busy);
  async function remove() {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không xóa được dự án.');
      onDeleted();
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  return <div className="project-modal-overlay"><div className="project-delete-dialog" ref={ref} role="dialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" tabIndex={-1}>
    <h2 id="delete-title">Xóa dự án?</h2><p id="delete-description">“{project.title}” và video đã xuất sẽ bị xóa. Không thể hoàn tác.</p>
    {error && <p role="alert">{error}</p>}
    <div className="project-dialog-actions"><button disabled={busy} onClick={onClose}>Hủy</button><button className="project-delete-button" disabled={busy} onClick={() => void remove()}>{busy ? 'Đang xóa…' : 'Xóa dự án'}</button></div>
  </div></div>;
}
function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<Project | null>(null);
  async function load() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không tải được dự án.');
      setProjects(data);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  return <><main className="dashboard" inert={!!deleting}>
    <header className="dashboard-heading"><div><div className="dashboard-brand"><img src="/favicon.svg" alt="" width="30" height="30" /><span>Wevic Video Studio</span></div><h1>Dự án của bạn</h1><p>Mỗi dự án là một video. Mở để tiếp tục chỉnh sửa.</p></div><a className="project-create-button" href="/project/new"><Plus size={19} />Tạo project mới</a></header>
    {loading ? <p role="status">Đang tải dự án…</p> : error ? <div role="alert"><p>{error}</p><button onClick={() => void load()}>Thử lại</button></div> : projects.length === 0 ? <div className="project-empty"><Film size={36} /><h2>Chưa có dự án</h2><p>Tạo project mới từ kịch bản hoặc file audio của bạn.</p></div> : <section className="project-grid" aria-label="Danh sách dự án">{projects.map(project => <article className="project-card" key={project.id}>
      <a className="project-open" href={`/project/${project.id}`}><div className="project-thumbnail">{project.thumbnail ? <img src={project.thumbnail} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} /> : <Film size={36} />}<span>{Math.floor(project.duration / 60)}:{String(Math.floor(project.duration % 60)).padStart(2, '0')}</span></div><h2>{project.title}</h2></a>
      <div className="project-card-footer"><span>{project.updatedAt && new Date(project.updatedAt).toLocaleDateString('vi-VN')}</span><details className="project-menu" onKeyDown={e => { if (e.key === 'Escape') { e.currentTarget.open = false; e.currentTarget.querySelector('summary')?.focus(); } }}><summary aria-label={`Tùy chọn ${project.title}`}><MoreHorizontal size={22} /></summary><div><button onClick={e => { e.currentTarget.closest('details')!.open = false; setDeleting(project); }}>Xóa dự án</button></div></details></div>
    </article>)}</section>}
  </main>{deleting && <DeleteProject project={deleting} onClose={() => setDeleting(null)} onDeleted={() => { setProjects(items => items.filter(item => item.id !== deleting.id)); setDeleting(null); }} />}</>;
}
export default function ProjectPages() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/') return <Dashboard />;
  if (path === '/project/new') return <CreatorPanel currentScenes={[]} currentMetadata={emptyMetadata} onCancel={() => window.location.assign('/')} onGenerateNewVideo={(_, metadata) => window.location.assign(`/project/${metadata.project_id}`)} />;
  const match = path.match(/^\/project\/([a-zA-Z0-9-]+)$/);
  if (match) return <App projectId={match[1]} />;
  return <main className="dashboard"><h1>Không tìm thấy trang</h1><a href="/">Về dự án</a></main>;
}
