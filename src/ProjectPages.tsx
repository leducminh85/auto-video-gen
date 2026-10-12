import { useEffect, useRef, useState } from 'react';
import {
  MoreVertical,
  Plus,
  Film,
  Search,
  Pencil,
  Trash2,
  Clock,
  Sparkles,
  ArrowUpDown,
  X,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import App from './App';
import { CreatorPanel } from './components/CreatorPanel';
import { useDialog } from './utils/useDialog';
import type { VideoMetadata } from './types/scenes';

type Project = { id: string; title: string; thumbnail: string | null; duration: number; updatedAt: string };
const emptyMetadata: VideoMetadata = {
  title: '',
  subtitle: '',
  fps: 30,
  width: 1920,
  height: 1080,
  total_scenes: 0,
  total_duration_in_frames: 1,
  total_duration_in_seconds: '0',
  created_at: '',
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function DeleteProject({
  project,
  onClose,
  onDeleted,
}: {
  project: Project;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ref = useDialog(onClose, !busy);

  async function remove() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không xóa được dự án.');
      onDeleted();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="project-modal-overlay">
      <div
        className="project-delete-dialog"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        aria-describedby="delete-description"
        tabIndex={-1}
      >
        <div className="delete-symbol">
          <Trash2 size={22} aria-hidden="true" />
        </div>
        <h2 id="delete-title">Xóa dự án video?</h2>
        <p id="delete-description">
          Dự án <strong>"{project.title}"</strong> cùng toàn bộ ảnh minh họa và file xuất sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.
        </p>
        {error && (
          <div className="dialog-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        <div className="project-dialog-actions">
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={busy}
            onClick={() => void remove()}
          >
            {busy ? 'Đang xóa…' : 'Xác nhận xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RenameProject({
  project,
  onClose,
  onRenamed,
}: {
  project: Project;
  onClose: () => void;
  onRenamed: (title: string, updatedAt: string) => void;
}) {
  const [title, setTitle] = useState(project.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ref = useDialog(onClose, !busy);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);

  async function rename(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !title.trim()) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không đổi được tên dự án.');
      onRenamed(result.metadata.title, result.metadata.updated_at);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="project-modal-overlay">
      <div
        className="project-delete-dialog project-rename-dialog"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-title"
        tabIndex={-1}
      >
        <div className="rename-symbol">
          <Pencil size={22} aria-hidden="true" />
        </div>
        <h2 id="rename-title">Đổi tên dự án</h2>
        <form onSubmit={rename}>
          <label htmlFor="project-name" className="dialog-field-label">
            Tên mới của dự án
          </label>
          <input
            ref={input}
            id="project-name"
            className="input dialog-input"
            value={title}
            maxLength={160}
            disabled={busy}
            onChange={(event) => setTitle(event.target.value)}
            aria-describedby={error ? 'rename-error' : undefined}
            placeholder="Nhập tên dự án…"
          />
          {error && (
            <div id="rename-error" className="dialog-error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          <div className="project-dialog-actions">
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={onClose}>
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || !title.trim() || title.trim() === project.title}
            >
              {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [renaming, setRenaming] = useState<Project | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'recent' | 'name' | 'duration'>('recent');

  const visibleProjects = projects
    .filter((project) =>
      project.title.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi'))
    )
    .sort((a, b) => {
      if (sort === 'name') {
        return a.title.localeCompare(b.title, 'vi');
      }
      if (sort === 'duration') {
        return b.duration - a.duration;
      }
      return String(b.updatedAt).localeCompare(String(a.updatedAt));
    });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không tải được dự án.');
      setProjects(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const closeMenus = (event: PointerEvent) => {
      document.querySelectorAll<HTMLDetailsElement>('.project-menu[open]').forEach((menu) => {
        if (!menu.contains(event.target as Node)) menu.open = false;
      });
    };
    document.addEventListener('pointerdown', closeMenus);
    return () => document.removeEventListener('pointerdown', closeMenus);
  }, []);

  return (
    <>
      <div className="library-shell project-library" inert={!!deleting || !!renaming}>
        {/* Studio Modern Navigation Bar */}
        <header className="library-topbar">
          <div className="topbar-container">
            <a href="/" className="workspace-brand" aria-label="Wevic Video Studio">
              <div className="brand-logo-mark">
                <img src="/favicon.svg" alt="" width="24" height="24" />
              </div>
              <div className="brand-titles">
                <span className="brand-name">Wevic</span>
                <span className="brand-tag">Studio</span>
              </div>
            </a>


          </div>
        </header>

        {/* Dashboard Main Workspace */}
        <main className="dashboard">
          {/* Hero Section */}
          <section className="dashboard-hero">
            <div className="hero-content">
              <div className="hero-title-row">
                <h1>Dự án video của bạn</h1>
                <span className="project-count-chip">
                  {loading ? '…' : `${projects.length} dự án`}
                </span>
              </div>

            </div>

            <a className="btn btn-primary hero-create-btn" href="/project/new">
              <Plus size={18} aria-hidden="true" />
              <span>Tạo video mới</span>
            </a>
          </section>

          {/* Clean Tonal Toolbar */}
          <section className="library-toolbar" aria-label="Bộ lọc và tìm kiếm">
            <div className="search-box-wrapper">
              <label htmlFor="search-projects" className="sr-only">
                Tìm kiếm dự án
              </label>
              <Search size={16} className="search-icon" aria-hidden="true" />
              <input
                id="search-projects"
                type="search"
                className="search-input"
                placeholder="Tìm dự án theo tên…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setQuery('')}
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="toolbar-controls">
              <div className="sort-control">
                <ArrowUpDown size={14} className="sort-icon" aria-hidden="true" />
                <label htmlFor="sort-select" className="sr-only">
                  Sắp xếp dự án
                </label>
                <select
                  id="sort-select"
                  className="sort-select"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as any)}
                >
                  <option value="recent">Mới cập nhật</option>
                  <option value="name">Tên A–Z</option>
                  <option value="duration">Thời lượng dài nhất</option>
                </select>
              </div>
            </div>
          </section>

          {/* Main Grid or Status Displays */}
          {loading ? (
            <div className="library-loading" role="status">
              <div className="project-grid skeleton-grid">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="project-card-skeleton" aria-hidden="true">
                    <div className="skeleton-thumb" />
                    <div className="skeleton-body">
                      <div className="skeleton-line-long" />
                      <div className="skeleton-line-short" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="dashboard-state-card error-card" role="alert">
              <div className="state-icon error-icon">
                <AlertCircle size={28} />
              </div>
              <h2>Không thể tải danh sách dự án</h2>
              <p>{error}</p>
              <button type="button" className="btn btn-secondary" onClick={() => void load()}>
                Thử tải lại
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div className="dashboard-state-card empty-card">
              <div className="state-icon empty-icon">
                <Film size={32} />
              </div>
              <h2>Chưa có dự án video nào</h2>
              <p>Bắt đầu tạo video hoạt hình đầu tiên từ kịch bản hoặc file âm thanh của bạn.</p>
              <a className="btn btn-primary state-cta" href="/project/new">
                <Plus size={17} />
                <span>Bắt đầu tạo video đầu tiên</span>
              </a>
            </div>
          ) : visibleProjects.length === 0 ? (
            <div className="dashboard-state-card search-empty-card">
              <div className="state-icon search-icon-wrap">
                <Search size={28} />
              </div>
              <h2>Không tìm thấy dự án phù hợp</h2>
              <p>Không có dự án nào khớp với từ khóa "{query}". Thử tìm với tên khác.</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setQuery('')}
              >
                Xóa tìm kiếm
              </button>
            </div>
          ) : (
            <section className="project-grid" aria-label="Danh sách dự án">
              {visibleProjects.map((project) => (
                <article className="project-card" key={project.id}>
                  {/* Thumbnail Banner with Play Overlay and Duration */}
                  <div className="project-media">
                    <a
                      className="project-open"
                      href={`/project/${project.id}`}
                      aria-label={`Mở dự án ${project.title}`}
                    >
                      <div className="project-thumbnail">
                        {project.thumbnail ? (
                          <img
                            src={project.thumbnail}
                            alt=""
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="thumbnail-fallback">
                            <Film size={32} />
                          </div>
                        )}
                        <div className="duration-badge">
                          <Clock size={11} aria-hidden="true" />
                          <span>{formatDuration(project.duration)}</span>
                        </div>
                      </div>
                    </a>

                    {/* Quick Options Menu */}
                    <details
                      className="project-menu"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.currentTarget.open = false;
                          e.currentTarget.querySelector('summary')?.focus();
                        }
                      }}
                    >
                      <summary aria-label={`Tùy chọn ${project.title}`}>
                        <MoreVertical size={16} aria-hidden="true" />
                      </summary>
                      <div className="menu-popover">
                        <button
                          type="button"
                          className="menu-item"
                          onClick={(e) => {
                            e.currentTarget.closest('details')!.open = false;
                            setRenaming(project);
                          }}
                        >
                          <Pencil size={14} aria-hidden="true" />
                          <span>Đổi tên</span>
                        </button>
                        <button
                          type="button"
                          className="menu-item menu-delete"
                          onClick={(e) => {
                            e.currentTarget.closest('details')!.open = false;
                            setDeleting(project);
                          }}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          <span>Xóa dự án</span>
                        </button>
                      </div>
                    </details>
                  </div>

                  {/* Card Content */}
                  <div className="project-info">
                    <a
                      className="project-title-link"
                      href={`/project/${project.id}`}
                    >
                      <h2 className="project-title">{project.title}</h2>
                    </a>
                    <div className="project-meta-row">
                      <span className="project-date">{formatDate(project.updatedAt)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </main>
      </div>

      {/* Rename Dialog */}
      {renaming && (
        <RenameProject
          project={renaming}
          onClose={() => setRenaming(null)}
          onRenamed={(title, updatedAt) => {
            setProjects((items) =>
              items.map((item) => (item.id === renaming.id ? { ...item, title, updatedAt } : item))
            );
            setRenaming(null);
          }}
        />
      )}

      {/* Delete Dialog */}
      {deleting && (
        <DeleteProject
          project={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setProjects((items) => items.filter((item) => item.id !== deleting.id));
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}

export default function ProjectPages() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/') return <Dashboard />;
  if (path === '/project/new')
    return (
      <CreatorPanel
        currentScenes={[]}
        currentMetadata={emptyMetadata}
        onCancel={() => window.location.assign('/')}
        onGenerateNewVideo={(_, metadata) => window.location.assign(`/project/${metadata.project_id}`)}
      />
    );
  const match = path.match(/^\/project\/([a-zA-Z0-9-]+)$/);
  if (match) return <App projectId={match[1]} />;
  return (
    <main className="dashboard">
      <div className="dashboard-state-card">
        <h2>Không tìm thấy trang</h2>
        <p>Đường dẫn bạn yêu cầu không tồn tại hoặc đã bị xóa.</p>
        <a className="btn btn-secondary" href="/">
          Về danh sách dự án
        </a>
      </div>
    </main>
  );
}
