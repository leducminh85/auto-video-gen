import { StudioBrand } from './components/StudioBrand';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { Download, CheckCircle2, Code2, Eye, Copy, Check, PlusCircle, Undo2, Loader2 } from 'lucide-react';
import { MainVideo } from './remotion/MainVideo';
import scenesDataJson from './data/scenes.json';
import { ProductionData, SceneData, VisualBeat, VideoMetadata } from './types/scenes';
import { buildMultiBeatScenes } from './utils/stickmanArtGenerator';
import { RegenerateImageModal } from './components/RegenerateImageModal';
import { insertBeat, removeBeat } from './utils/beatEditing';
import { SceneTimeline } from './components/SceneTimeline';
import { IconButton } from './components/IconButton';
import { defaultPrompt } from './config/imageStyle.json';
import { VectorShotEditor } from './components/VectorShotEditor';
import { BeatThumbnail } from './components/BeatThumbnail';

const initialProductionData = scenesDataJson as ProductionData;
const initialMultiBeatScenes = buildMultiBeatScenes(initialProductionData.scenes);

export default function App({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<'preview' | 'data'>('preview');
  const [scenes, setScenes] = useState<SceneData[]>(initialMultiBeatScenes);
  const playerInputProps = useMemo(() => ({ scenes }), [scenes]);
  const [metadata, setMetadata] = useState<VideoMetadata>({
    ...initialProductionData.metadata,
    max_image_duration_sec: 5.0,
  });
  const [selectedSceneId, setSelectedSceneId] = useState<number>(1);
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [projectBusy, setProjectBusy] = useState(false);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [insertAfterId, setInsertAfterId] = useState('');
  const [exporting, setExporting] = useState(false);
  const [addingBeat, setAddingBeat] = useState(false);
  const [undoProject, setUndoProject] = useState<ProductionData | null>(null);
  useEffect(() => {
    let active = true;
    fetch(`/api/projects/${projectId}`).then(async response => {
      if (!response.ok) throw new Error('Không đọc được dự án đã lưu.');
      return response.json();
    }).then(project => {
      if (!active) return;
      setScenes(buildMultiBeatScenes(project.scenes));
      setMetadata(project.metadata);
      setSelectedSceneId(project.scenes[0]?.id || 1);
    }).catch(error => { if (active) setProjectError(error.message); })
      .finally(() => { if (active) setProjectLoading(false); });
    return () => { active = false; };
  }, []);
  const [videoTimestamp, setVideoTimestamp] = useState<number>(Date.now());

  // Regenerate Modal state
  const [regenerateModalOpen, setRegenerateModalOpen] = useState<boolean>(false);
  const [sceneToRegenerate, setSceneToRegenerate] = useState<SceneData | null>(null);
  const [beatToRegenerate, setBeatToRegenerate] = useState<VisualBeat | null>(null);

  const remotionPlayerRef = useRef<PlayerRef>(null);
  const pendingPlayback = useRef(false);
  const playerSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const player = remotionPlayerRef.current;
    if (!player) return;
    const onFrame = (event: { detail: { frame: number } }) => {
      setCurrentFrame(event.detail.frame);
      if (player.isPlaying()) {
        const active = scenes.find(scene => event.detail.frame >= scene.start_frame && event.detail.frame < scene.start_frame + scene.duration_in_frames);
        if (active) setSelectedSceneId(active.id);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    player.addEventListener('frameupdate', onFrame);
    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    return () => { player.removeEventListener('frameupdate', onFrame); player.removeEventListener('play', onPlay); player.removeEventListener('pause', onPause); };
  }, [videoTimestamp, activeTab, scenes]);
  useEffect(() => { setSelectedBeatId(null); }, [selectedSceneId]);


  const selectedScene = scenes.find((s) => s.id === selectedSceneId) || scenes[0];
  const selectedSceneBeats = selectedScene?.beats || [];
  const totalImagesCount = scenes.reduce((acc, sc) => acc + (sc.beats?.length || 1), 0);

  const showToast = (msg: string, duration: number = 4000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), duration);
  };

  const togglePlay = () => {
    if (!remotionPlayerRef.current) {
      pendingPlayback.current = true;
      setActiveTab('preview');
      return;
    }
    if (remotionPlayerRef.current?.isPlaying()) {
      remotionPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      remotionPlayerRef.current?.play();
      setIsPlaying(true);
    }
  };

  const playbackShortcut = useRef(togglePlay);
  playbackShortcut.current = togglePlay;
  useEffect(() => {
    const handleSpace = (event: KeyboardEvent) => {
      if (regenerateModalOpen || (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, button, a, [contenteditable]'))) return;
      if ((event.code !== 'Space' && event.key !== ' ') || event.isComposing) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.type === 'keydown' && !event.repeat) playbackShortcut.current();
    };
    window.addEventListener('keydown', handleSpace, true);
    window.addEventListener('keyup', handleSpace, true);
    return () => {
      window.removeEventListener('keydown', handleSpace, true);
      window.removeEventListener('keyup', handleSpace, true);
    };
  }, [regenerateModalOpen]);
  useEffect(() => {
    if (activeTab === 'preview' && pendingPlayback.current && remotionPlayerRef.current) {
      pendingPlayback.current = false;
      remotionPlayerRef.current.play();
    }
  }, [activeTab]);

  const handleOpenRegenerate = (scene: SceneData, beat?: VisualBeat) => {
    if (projectBusy || projectLoading) return;
    setAddingBeat(false);
    setSceneToRegenerate(scene);
    setBeatToRegenerate(beat || scene.beats?.[0] || null);
    setRegenerateModalOpen(true);
  };

  const persistProject = async (next: ProductionData, render = false, remember = true, quiet = false) => {
    setProjectBusy(true);
    setProjectError(null);
    remotionPlayerRef.current?.pause();
    setIsPlaying(false);
    const restoreFrame = remotionPlayerRef.current?.getCurrentFrame() || selectedScene.start_frame;
    try {
      const response = await fetch(`/api/projects/${projectId}${render ? '/render' : ''}`,  {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.error || 'Không lưu được thay đổi.');
      if (remember && !render) setUndoProject({ scenes, metadata });
      setScenes(saved.scenes);
      setMetadata(saved.metadata);
      setVideoTimestamp(Date.now());
      requestAnimationFrame(() => remotionPlayerRef.current?.seekTo(restoreFrame));
      if (!quiet) showToast(render ? 'MP4 đã sẵn sàng.' : 'Đã lưu chỉnh sửa.');
      return true;
    } catch (error: any) { setProjectError(error.message); return false; }
    finally { setProjectBusy(false); }
  };

  const downloadVideo = async () => {
    if (projectBusy || projectLoading) return;
    setExporting(true);
    try {
      if (metadata.render_dirty && !await persistProject({ scenes, metadata }, true)) return;
      const link = document.createElement('a');
      link.href = `/projects/${projectId}/final-video.mp4?t=${Date.now()}`;
      link.download = `${(metadata.title || 'video').replace(/[^\p{L}\p{N} -]/gu, '')}.mp4`;
      document.body.appendChild(link); link.click(); link.remove();
    } finally { setExporting(false); }
  };

  const selectScene = (scene: SceneData) => {
    setSelectedSceneId(scene.id);
    remotionPlayerRef.current?.pause();
    remotionPlayerRef.current?.seekTo(scene.start_frame);
    setCurrentFrame(scene.start_frame);
    setIsPlaying(false);
  };

  const seekTimeline = (offset: number) => {
    remotionPlayerRef.current?.pause();
    const frame = selectedScene.start_frame + offset;
    remotionPlayerRef.current?.seekTo(frame);
    setCurrentFrame(frame);
    setIsPlaying(false);
  };

  const handleAddBeat = () => {
    if (!selectedScene || projectBusy) return;
    if (metadata.video_mode === 'remotion') {
      const source = selectedSceneBeats.find(beat => beat.id === selectedBeatId && beat.duration_in_frames >= 2) || selectedSceneBeats.find(beat => beat.duration_in_frames >= 2);
      if (!source) return;
      const edited = insertBeat(selectedScene, { ...structuredClone(source), id: crypto.randomUUID(), title: `${source.title} · bản sao` }, source.id, metadata.fps);
      void persistProject({ metadata, scenes: scenes.map(scene => scene.id === edited.id ? edited : scene) });
      return;
    }
    const prompt = `${metadata.image_style_prompt || defaultPrompt}\n\nNội dung cần minh họa: ${selectedScene.text}`;
    setSceneToRegenerate(selectedScene);
    setBeatToRegenerate({ ...selectedSceneBeats[0], id: crypto.randomUUID(), sub_index: selectedSceneBeats.length + 1, title: 'Ảnh mới', prompt, plan: undefined, caption: selectedScene.text });
    setInsertAfterId(selectedSceneBeats.find(beat => beat.duration_in_frames >= 2)?.id || '');
    setAddingBeat(true);
    setRegenerateModalOpen(true);
  };

  const handleDeleteBeat = (beat: VisualBeat) => {
    if (selectedSceneBeats.length <= 1 || projectBusy) return;
    const edited = removeBeat(selectedScene, beat.id, metadata.fps);
    void persistProject({ metadata, scenes: scenes.map(scene => scene.id === edited.id ? edited : scene) });
    setSelectedBeatId(null);
  };

  const handleSaveRegeneratedImage = async (sceneId: number, beatId: string | undefined, newPrompt: string, imageFile?: string, imageVersion?: number) => {
    const next = scenes.map(scene => {
      if (scene.id !== sceneId) return scene;
      const update = (beat: VisualBeat) => ({ ...beat, svg_data: null, prompt: newPrompt, image_file: imageFile || beat.image_file, image_version: imageVersion || Date.now(), ...(beat.plan ? { plan: { ...beat.plan, imageGenerationPrompt: newPrompt } } : {}) });
      if (addingBeat && beatToRegenerate) return insertBeat(scene, update(beatToRegenerate), insertAfterId, metadata.fps);
      return { ...scene, beats: (scene.beats || []).map(beat => beat.id === beatId ? update(beat) : beat) };
    });
    if (!await persistProject({ metadata, scenes: next })) throw new Error('Không lưu được ảnh. Vui lòng thử áp dụng lại.');
  };


  const copyJsonToClipboard = async () => {
    const exportData: ProductionData = { metadata, scenes };
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2500);
    } catch { showToast('Không thể sao chép. Hãy cho phép truy cập bộ nhớ tạm.'); }
  };

  const totalDuration = parseFloat(metadata.total_duration_in_seconds);
  const durationDisplay = `${Math.floor(totalDuration / 60)}:${String(Math.floor(totalDuration % 60)).padStart(2, '0')}`;

  if (projectLoading || (projectError && !metadata.project_id)) return <div className="studio-shell"><header className="studio-topbar"><div className="header-identity"><StudioBrand /></div><a className="dashboard-back" href="/">Dự án</a></header><main className="dashboard"><p role={projectError ? 'alert' : 'status'}>{projectError || 'Đang mở dự án…'}</p></main></div>;
  return (
    <div className="studio-shell">
      <header className="studio-topbar" inert={regenerateModalOpen}>
        <div className="header-identity"><StudioBrand /><h1 className="header-page-title" title={metadata.title}>{metadata.title}</h1></div>
        <div className="toolbar-actions">
          <span className="studio-project-summary">{scenes.length} cảnh · {totalImagesCount} {metadata.video_mode === 'remotion' ? 'đoạn hoạt hình' : 'ảnh'} · {durationDisplay}</span>
          <a className="dashboard-back" href="/">Dự án</a>
          <IconButton label={exporting ? 'Đang xuất MP4' : metadata.render_dirty ? 'Xuất và tải MP4' : 'Tải MP4'} className="icon-accent" disabled={projectBusy || projectLoading || exporting} onClick={() => void downloadVideo()}>{exporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}</IconButton>
        </div>
      </header>
      {(projectError || projectLoading) && <div className="project-notice" inert={regenerateModalOpen} role={projectError ? 'alert' : 'status'}>
        {projectError || 'Đang mở dự án…'}
      </div>}
      <main className="studio-workspace" inert={regenerateModalOpen}>
        <section ref={playerSectionRef} className="studio-section preview-section" aria-labelledby="preview-title">
          <div className="studio-section-heading"><h2 id="preview-title">Xem trước</h2><div className="toolbar-actions">
            <IconButton label="Xem trước" aria-pressed={activeTab === 'preview'} onClick={() => setActiveTab('preview')}><Eye size={17} /></IconButton>
            <IconButton label="JSON" aria-pressed={activeTab === 'data'} onClick={() => setActiveTab('data')}><Code2 size={17} /></IconButton>
            {activeTab === 'data' && <IconButton label="Sao chép JSON" onClick={copyJsonToClipboard}>{copiedJson ? <Check size={17} /> : <Copy size={17} />}</IconButton>}
          </div></div>
          {activeTab === 'preview' ? <div className="studio-player"><Player key={videoTimestamp} ref={remotionPlayerRef} component={MainVideo} inputProps={playerInputProps} durationInFrames={metadata.total_duration_in_frames} compositionWidth={metadata.width} compositionHeight={metadata.height} fps={metadata.fps} style={{ width: '100%', height: '100%' }} controls autoPlay={false} loop acknowledgeRemotionLicense /></div> : <pre className="studio-json">{JSON.stringify({ metadata, scenes }, null, 2)}</pre>}
          <div className="preview-caption"><span className="preview-format">{metadata.width} × {metadata.height} · {metadata.fps} fps</span><span className="preview-time">{(currentFrame / metadata.fps).toFixed(2)} / {totalDuration.toFixed(2)} giây</span></div>
        </section>
        <section className="studio-section scenes-section" aria-labelledby="scenes-title">
          <div className="studio-section-heading"><h2 id="scenes-title">Phân cảnh</h2><span className="section-meta">{scenes.length} cảnh</span></div>
          <div className="studio-scene-list">
            {scenes.map(scene => <button key={scene.id} className={`studio-scene-item ${selectedScene.id === scene.id ? 'active' : ''}`} aria-label={`Chọn cảnh ${scene.id}: ${scene.title}`} aria-pressed={selectedScene.id === scene.id} disabled={projectBusy} onClick={() => selectScene(scene)}>
              {scene.beats?.[0] && <BeatThumbnail beat={scene.beats[0]} />}
              <span className="scene-item-copy"><strong>Cảnh {scene.id} <span>{scene.duration_in_seconds.toFixed(1)}s</span></strong><span>{scene.text}</span><small>{scene.beats?.length || 1} {metadata.video_mode === 'remotion' ? 'đoạn hoạt hình' : 'ảnh'}</small></span>
            </button>)}
          </div>
          <details className="timeline-narration"><summary>Lời thoại của cảnh</summary><p>{selectedScene.text}</p></details>
        </section>
        <section className="studio-section timeline-section" aria-labelledby="timeline-title">
          <div className="studio-section-heading timeline-heading">
            <div><h2 id="timeline-title">Chi tiết cảnh</h2><p>Cảnh {selectedScene.id} · {selectedSceneBeats.length} {metadata.video_mode === 'remotion' ? 'đoạn hoạt hình' : 'ảnh'} · {selectedScene.duration_in_seconds.toFixed(2)} giây</p></div>
            <div className="toolbar-actions">
              <IconButton label={metadata.video_mode === 'remotion' ? 'Nhân đôi đoạn hoạt hình' : 'Thêm ảnh vào cảnh'} disabled={projectBusy || projectLoading || !selectedSceneBeats.some(beat => beat.duration_in_frames >= 2)} onClick={handleAddBeat}><PlusCircle size={18} /></IconButton>
              <IconButton label="Hoàn tác" disabled={!undoProject || projectBusy} onClick={async () => { if (undoProject && await persistProject(undoProject, false, false)) setUndoProject(null); }}><Undo2 size={18} /></IconButton>
            </div>
          </div>
          <SceneTimeline key={selectedScene.id} scene={selectedScene} fps={metadata.fps} busy={projectBusy || projectLoading} selectedId={selectedBeatId} playhead={currentFrame - selectedScene.start_frame}
            onSelect={beat => { setSelectedBeatId(beat.id); seekTimeline(beat.start_frame_offset); }} onSeek={seekTimeline}
            onCommit={edited => persistProject({ metadata, scenes: scenes.map(scene => scene.id === edited.id ? edited : scene) }, false, true, true)}
            onRegenerate={beat => handleOpenRegenerate(selectedScene, beat)} onDelete={handleDeleteBeat} />
        </section>
      </main>
      {sceneToRegenerate && metadata.video_mode !== 'remotion' && <RegenerateImageModal isOpen={regenerateModalOpen} onClose={() => setRegenerateModalOpen(false)} scene={sceneToRegenerate} selectedBeat={beatToRegenerate} onSaveImage={handleSaveRegeneratedImage} adding={addingBeat} imageStylePrompt={metadata.image_style_prompt} insertAfterId={insertAfterId} onInsertAfterChange={setInsertAfterId} />}
      {regenerateModalOpen && beatToRegenerate?.remotion && <VectorShotEditor beat={beatToRegenerate} fps={metadata.fps} onClose={() => setRegenerateModalOpen(false)} onSave={shot => persistProject({ metadata, scenes: scenes.map(scene => scene.id === sceneToRegenerate?.id ? { ...scene, beats: scene.beats?.map(beat => beat.id === beatToRegenerate.id ? { ...beat, remotion: shot, prompt: shot.direction } : beat) } : scene) })} />}
      {toastMessage && <div className="toast toast-success" role="status"><CheckCircle2 size={16} /><span>{toastMessage}</span></div>}
    </div>
  );
}
