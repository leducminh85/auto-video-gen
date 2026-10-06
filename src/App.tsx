/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { Play, Pause, Download, Layers, Volume2, VolumeX, CheckCircle2, Code2, Eye, Copy, Check, PlusCircle, Undo2, Loader2 } from 'lucide-react';
import { MainVideo } from './remotion/MainVideo';
import scenesDataJson from './data/scenes.json';
import { ProductionData, SceneData, VisualBeat, VideoMetadata } from './types/scenes';
import { buildMultiBeatScenes } from './utils/stickmanArtGenerator';
import { CreatorPanel } from './components/CreatorPanel';
import { RegenerateImageModal } from './components/RegenerateImageModal';
import { insertBeat, removeBeat } from './utils/beatEditing';
import { SceneTimeline } from './components/SceneTimeline';
import { IconButton } from './components/IconButton';
import { defaultPrompt } from './config/imageStyle.json';

const initialProductionData = scenesDataJson as ProductionData;
const initialMultiBeatScenes = buildMultiBeatScenes(initialProductionData.scenes);

export default function App() {
  const [activeTab, setActiveTab] = useState<'preview' | 'data'>('preview');
  const [scenes, setScenes] = useState<SceneData[]>(initialMultiBeatScenes);
  const [metadata, setMetadata] = useState<VideoMetadata>({
    ...initialProductionData.metadata,
    max_image_duration_sec: 5.0,
  });
  const [selectedSceneId, setSelectedSceneId] = useState<number>(1);
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const [showCreatorDrawer, setShowCreatorDrawer] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [projectBusy, setProjectBusy] = useState(false);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [insertAfterId, setInsertAfterId] = useState('');
  const [exporting, setExporting] = useState(false);
  const editorRef = useRef<HTMLElement>(null);
  const [addingBeat, setAddingBeat] = useState(false);
  const [undoProject, setUndoProject] = useState<ProductionData | null>(null);
  useEffect(() => {
    let active = true;
    fetch('/api/project').then(async response => {
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
  const singleAudioRef = useRef<HTMLAudioElement | null>(null);
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
  useEffect(() => { setSelectedBeatId(null); singleAudioRef.current?.pause(); setPlayingAudioId(null); }, [selectedSceneId]);

  useEffect(() => () => { singleAudioRef.current?.pause(); }, []);

  const selectedScene = scenes.find((s) => s.id === selectedSceneId) || scenes[0];
  const selectedSceneBeats = selectedScene?.beats || [];
  const totalImagesCount = scenes.reduce((acc, sc) => acc + (sc.beats?.length || 1), 0);

  const showToast = (msg: string, duration: number = 4000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), duration);
  };

  const togglePlay = () => {
    singleAudioRef.current?.pause();
    setPlayingAudioId(null);
    if (remotionPlayerRef.current?.isPlaying()) {
      remotionPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      remotionPlayerRef.current?.play();
      setIsPlaying(true);
    }
  };

  const playSceneAudio = (scene: SceneData) => {
    remotionPlayerRef.current?.pause();
    setIsPlaying(false);
    if (singleAudioRef.current) {
      singleAudioRef.current.pause();
    }
    if (playingAudioId === scene.id) {
      setPlayingAudioId(null);
      return;
    }
    const audio = new Audio(`/audio/${scene.audio_file}`);
    audio.onended = () => setPlayingAudioId(null);
    audio.ontimeupdate = () => { const frame = Math.min(scene.start_frame + scene.duration_in_frames - 1, scene.start_frame + Math.round(audio.currentTime * metadata.fps)); setCurrentFrame(frame); remotionPlayerRef.current?.seekTo(frame); };
    audio.play().catch(() => { setPlayingAudioId(null); showToast('Không phát được giọng đọc của cảnh này.'); });
    singleAudioRef.current = audio;
    setPlayingAudioId(scene.id);
  };

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
    singleAudioRef.current?.pause();
    setPlayingAudioId(null);
    setIsPlaying(false);
    const restoreFrame = remotionPlayerRef.current?.getCurrentFrame() || selectedScene.start_frame;
    try {
      const response = await fetch(render ? '/api/project/render' : '/api/project', {
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
      link.href = `/final-video.mp4?t=${Date.now()}`;
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
    singleAudioRef.current?.pause();
    setPlayingAudioId(null);
    remotionPlayerRef.current?.pause();
    const frame = selectedScene.start_frame + offset;
    remotionPlayerRef.current?.seekTo(frame);
    setCurrentFrame(frame);
    setIsPlaying(false);
  };

  const handleAddBeat = () => {
    if (!selectedScene || projectBusy) return;
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

  const handleGenerateNewVideo = (newScenes: SceneData[], newMetadata: VideoMetadata) => {
    setUndoProject(null);
    setProjectError(null);
    setScenes(newScenes);
    setMetadata(newMetadata);
    setSelectedSceneId(newScenes[0]?.id || 1);
    setActiveTab('preview');
    setShowCreatorDrawer(false);
    setVideoTimestamp(Date.now());

    const totalImages = newScenes.reduce((acc, sc) => acc + (sc.beats?.length || 1), 0);
    showToast(`✓ Video mới: ${newScenes.length} cảnh, ${totalImages} hình ảnh`, 6000);

    setTimeout(() => {
      if (remotionPlayerRef.current) {
        remotionPlayerRef.current.seekTo(0);
        remotionPlayerRef.current.play();
        setIsPlaying(true);
      }
      playerSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
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

  return (
    <div className="studio-shell">
      <header className="studio-topbar" inert={showCreatorDrawer || regenerateModalOpen}>
        <div className="studio-identity"><img src="/favicon.svg" alt="" width={34} height={34} /><div><h1>Wevic Video Studio</h1><p>{metadata.title}</p></div></div>
        <div className="toolbar-actions">
          <span className="studio-project-summary">{scenes.length} cảnh · {totalImagesCount} ảnh · {durationDisplay}</span>
          <IconButton label="Tạo video mới" disabled={projectBusy || projectLoading} onClick={() => setShowCreatorDrawer(true)}><PlusCircle size={20} /></IconButton>
          <IconButton label={exporting ? 'Đang xuất MP4' : metadata.render_dirty ? 'Xuất và tải MP4' : 'Tải MP4'} className="icon-accent" disabled={projectBusy || projectLoading || exporting} onClick={() => void downloadVideo()}>{exporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}</IconButton>
        </div>
      </header>
      {(projectError || projectLoading || metadata.render_dirty) && <div className="project-notice" inert={showCreatorDrawer || regenerateModalOpen} role={projectError ? 'alert' : 'status'}>
        {projectError || (projectLoading ? 'Đang mở dự án…' : 'Đã lưu chỉnh sửa. Xuất MP4 để tải video với timeline mới.')}
      </div>}
      <main className="studio-workspace" inert={showCreatorDrawer || regenerateModalOpen}>
        <section ref={playerSectionRef} className="studio-section preview-section" aria-labelledby="preview-title">
          <div className="studio-section-heading"><h2 id="preview-title"><span>01</span> Xem trước</h2><div className="toolbar-actions">
            <IconButton label="Xem trước" aria-pressed={activeTab === 'preview'} onClick={() => setActiveTab('preview')}><Eye size={17} /></IconButton>
            <IconButton label="JSON" aria-pressed={activeTab === 'data'} onClick={() => setActiveTab('data')}><Code2 size={17} /></IconButton>
            {activeTab === 'data' && <IconButton label="Sao chép JSON" onClick={copyJsonToClipboard}>{copiedJson ? <Check size={17} /> : <Copy size={17} />}</IconButton>}
          </div></div>
          {activeTab === 'preview' ? <div className="studio-player"><Player key={videoTimestamp} ref={remotionPlayerRef} component={MainVideo} inputProps={{ scenes }} durationInFrames={metadata.total_duration_in_frames} compositionWidth={metadata.width} compositionHeight={metadata.height} fps={metadata.fps} style={{ width: '100%', height: '100%' }} controls autoPlay={false} loop acknowledgeRemotionLicense /></div> : <pre className="studio-json">{JSON.stringify({ metadata, scenes }, null, 2)}</pre>}
          <div className="preview-caption"><span>{(currentFrame / metadata.fps).toFixed(2)} / {totalDuration.toFixed(2)} giây</span><IconButton label="Chỉnh ảnh trong cảnh" onClick={() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><Layers size={17} /></IconButton></div>
        </section>
        <section className="studio-section scenes-section" aria-labelledby="scenes-title">
          <div className="studio-section-heading"><h2 id="scenes-title"><span>02</span> Phân cảnh</h2><span className="section-meta">{scenes.length} cảnh</span></div>
          <div className="studio-scene-list">
            {scenes.map(scene => <button key={scene.id} className={`studio-scene-item ${selectedScene.id === scene.id ? 'active' : ''}`} aria-label={`Chọn cảnh ${scene.id}: ${scene.title}`} aria-pressed={selectedScene.id === scene.id} disabled={projectBusy} onClick={() => selectScene(scene)}>
              <img src={`/images/${scene.beats?.[0]?.image_file || scene.image_file}?v=${scene.beats?.[0]?.image_version || scene.image_version || ''}`} alt="" />
              <span className="scene-item-copy"><strong>Cảnh {scene.id} <span>{scene.duration_in_seconds.toFixed(1)}s</span></strong><span>{scene.text}</span><small>{scene.beats?.length || 1} ảnh</small></span>
            </button>)}
          </div>
        </section>
        <section ref={editorRef} className="studio-section timeline-section" aria-labelledby="timeline-title">
          <div className="studio-section-heading timeline-heading">
            <div><h2 id="timeline-title"><span>03</span> Chi tiết cảnh</h2><p>Cảnh {selectedScene.id} · {selectedSceneBeats.length} ảnh · {selectedScene.duration_in_seconds.toFixed(2)} giây</p></div>
            <div className="toolbar-actions">
              <label className="sr-only" htmlFor="editing-scene">Chọn cảnh để chỉnh ảnh</label>
              <select id="editing-scene" className="input" value={selectedSceneId} disabled={projectBusy} onChange={event => { const scene = scenes.find(item => item.id === Number(event.target.value)); if (scene) selectScene(scene); }}>{scenes.map(scene => <option key={scene.id} value={scene.id}>Cảnh {scene.id}</option>)}</select>
              <IconButton label={isPlaying ? 'Tạm dừng' : 'Phát'} onClick={togglePlay}>{isPlaying ? <Pause size={18} /> : <Play size={18} />}</IconButton>
              <IconButton label={playingAudioId === selectedScene.id ? 'Dừng audio' : 'Nghe audio cảnh'} onClick={() => playSceneAudio(selectedScene)}>{playingAudioId === selectedScene.id ? <VolumeX size={18} /> : <Volume2 size={18} />}</IconButton>
              <IconButton label="Thêm ảnh vào cảnh" disabled={projectBusy || projectLoading || !selectedSceneBeats.some(beat => beat.duration_in_frames >= 2)} onClick={handleAddBeat}><PlusCircle size={18} /></IconButton>
              <IconButton label="Hoàn tác" disabled={!undoProject || projectBusy} onClick={async () => { if (undoProject && await persistProject(undoProject, false, false)) setUndoProject(null); }}><Undo2 size={18} /></IconButton>
            </div>
          </div>
          <SceneTimeline key={selectedScene.id} scene={selectedScene} fps={metadata.fps} busy={projectBusy || projectLoading} selectedId={selectedBeatId} playhead={currentFrame - selectedScene.start_frame}
            onSelect={beat => { setSelectedBeatId(beat.id); seekTimeline(beat.start_frame_offset); }} onSeek={seekTimeline}
            onCommit={edited => persistProject({ metadata, scenes: scenes.map(scene => scene.id === edited.id ? edited : scene) }, false, true, true)}
            onRegenerate={beat => handleOpenRegenerate(selectedScene, beat)} onDelete={handleDeleteBeat} />
          <details className="timeline-narration"><summary>Lời thoại của cảnh</summary><p>{selectedScene.text}</p></details>
        </section>
      </main>
      {showCreatorDrawer && <div className="creator-fullscreen-overlay"><CreatorPanel currentScenes={scenes} currentMetadata={metadata} onGenerateNewVideo={handleGenerateNewVideo} onCancel={() => setShowCreatorDrawer(false)} /></div>}
      {sceneToRegenerate && <RegenerateImageModal isOpen={regenerateModalOpen} onClose={() => setRegenerateModalOpen(false)} scene={sceneToRegenerate} selectedBeat={beatToRegenerate} onSaveImage={handleSaveRegeneratedImage} adding={addingBeat} imageStylePrompt={metadata.image_style_prompt} insertAfterId={insertAfterId} onInsertAfterChange={setInsertAfterId} />}
      {toastMessage && <div className="toast toast-success" role="status"><CheckCircle2 size={16} /><span>{toastMessage}</span></div>}
    </div>
  );
}
