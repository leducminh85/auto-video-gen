/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import {
  Play,
  Pause,
  Download,
  Film,
  Layers,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  Code2,
  Eye,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
  Wand2,
  PlusCircle,
  X,
  Image as ImageIcon,
  Clock,
  Music,
  FileText,
} from 'lucide-react';
import { MainVideo } from './remotion/MainVideo';
import scenesDataJson from './data/scenes.json';
import { ProductionData, SceneData, VisualBeat, VideoMetadata } from './types/scenes';
import { buildMultiBeatScenes } from './utils/stickmanArtGenerator';
import { CreatorPanel } from './components/CreatorPanel';
import { RegenerateImageModal } from './components/RegenerateImageModal';

const initialProductionData = scenesDataJson as ProductionData;
const initialMultiBeatScenes = buildMultiBeatScenes(initialProductionData.scenes);

export default function App() {
  const [activeTab, setActiveTab] = useState<'preview' | 'scenes' | 'data'>('preview');
  const [scenes, setScenes] = useState<SceneData[]>(initialMultiBeatScenes);
  const [metadata, setMetadata] = useState<VideoMetadata>({
    ...initialProductionData.metadata,
    max_image_duration_sec: 5.0,
  });
  const [selectedSceneId, setSelectedSceneId] = useState<number>(1);
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const [showCreatorDrawer, setShowCreatorDrawer] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [videoTimestamp, setVideoTimestamp] = useState<number>(Date.now());

  // Regenerate Modal state
  const [regenerateModalOpen, setRegenerateModalOpen] = useState<boolean>(false);
  const [sceneToRegenerate, setSceneToRegenerate] = useState<SceneData | null>(null);
  const [beatToRegenerate, setBeatToRegenerate] = useState<VisualBeat | null>(null);

  const remotionPlayerRef = useRef<PlayerRef>(null);
  const singleAudioRef = useRef<HTMLAudioElement | null>(null);
  const playerSectionRef = useRef<HTMLDivElement>(null);

  const selectedScene = scenes.find((s) => s.id === selectedSceneId) || scenes[0];
  const selectedSceneBeats = selectedScene?.beats || [];
  const totalImagesCount = scenes.reduce((acc, sc) => acc + (sc.beats?.length || 1), 0);

  const showToast = (msg: string, duration: number = 4000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), duration);
  };

  const togglePlay = () => {
    if (remotionPlayerRef.current?.isPlaying()) {
      remotionPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      remotionPlayerRef.current?.play();
      setIsPlaying(true);
    }
  };

  const jumpToScene = (scene: SceneData, beatOffset: number = 0) => {
    setSelectedSceneId(scene.id);
    const targetFrame = scene.start_frame + beatOffset;
    if (remotionPlayerRef.current) {
      remotionPlayerRef.current.seekTo(targetFrame);
      if (!remotionPlayerRef.current.isPlaying()) {
        remotionPlayerRef.current.play();
        setIsPlaying(true);
      }
    }
    setActiveTab('preview');
  };

  const playSceneAudio = (scene: SceneData) => {
    if (singleAudioRef.current) {
      singleAudioRef.current.pause();
    }
    if (playingAudioId === scene.id) {
      setPlayingAudioId(null);
      return;
    }
    const audio = new Audio(`/audio/${scene.audio_file}`);
    audio.onended = () => setPlayingAudioId(null);
    audio.play();
    singleAudioRef.current = audio;
    setPlayingAudioId(scene.id);
  };

  const handleOpenRegenerate = (scene: SceneData, beat?: VisualBeat) => {
    setSceneToRegenerate(scene);
    setBeatToRegenerate(beat || scene.beats?.[0] || null);
    setRegenerateModalOpen(true);
  };

  const handleSaveRegeneratedImage = (
    sceneId: number,
    beatId: string | undefined,
    svgData: string,
    newPrompt: string
  ) => {
    setScenes((prev) =>
      prev.map((sc) => {
        if (sc.id !== sceneId) return sc;
        if (sc.beats && sc.beats.length > 0) {
          const updatedBeats = sc.beats.map((b) => {
            if (!beatId || b.id === beatId) {
              return { ...b, svg_data: svgData, prompt: newPrompt };
            }
            return b;
          });
          return { ...sc, beats: updatedBeats };
        }
        return { ...sc, prompt: newPrompt };
      })
    );
    showToast('✓ Ảnh mới đã được áp dụng');
  };

  const handleGenerateNewVideo = (newScenes: SceneData[], newMetadata: VideoMetadata) => {
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

  const copyJsonToClipboard = () => {
    const exportData: ProductionData = { metadata, scenes };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const totalDuration = parseFloat(metadata.total_duration_in_seconds);
  const durationDisplay = `${Math.floor(totalDuration / 60)}:${String(Math.floor(totalDuration % 60)).padStart(2, '0')}`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ───── Header ───── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          padding: '0 24px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Film style={{ width: 16, height: 16, color: 'var(--text-inverse)' }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Stickman Studio
            </h1>
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {metadata.title}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Info chips */}
          <span className="badge badge-accent" style={{ marginRight: 4 }}>
            {scenes.length} cảnh · {totalImagesCount} hình · {durationDisplay}
          </span>

          <button
            className="btn btn-primary"
            onClick={() => setShowCreatorDrawer(true)}
          >
            <PlusCircle style={{ width: 14, height: 14 }} />
            <span>Tạo Video Mới</span>
          </button>

          <a
            href={`/final-video.mp4?t=${videoTimestamp}`}
            download={`${(metadata.title || 'stickman-video').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.mp4`}
            className="btn btn-secondary"
          >
            <Download style={{ width: 14, height: 14 }} />
            <span>Tải MP4</span>
          </a>
        </div>
      </header>

      {/* ───── Main Content ───── */}
      <main
        style={{
          flex: 1,
          maxWidth: 1200,
          width: '100%',
          margin: '0 auto',
          padding: '24px 24px 64px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* ───── Player Section ───── */}
        <section ref={playerSectionRef} className="surface" style={{ overflow: 'hidden' }}>
          {/* Tab bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div className="tab-group">
              <button
                className={`tab-item ${activeTab === 'preview' ? 'tab-item-active' : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Eye style={{ width: 14, height: 14 }} />
                  Preview
                </span>
              </button>
              <button
                className={`tab-item ${activeTab === 'scenes' ? 'tab-item-active' : ''}`}
                onClick={() => setActiveTab('scenes')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers style={{ width: 14, height: 14 }} />
                  Cảnh & Hình ảnh
                </span>
              </button>
              <button
                className={`tab-item ${activeTab === 'data' ? 'tab-item-active' : ''}`}
                onClick={() => setActiveTab('data')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Code2 style={{ width: 14, height: 14 }} />
                  JSON
                </span>
              </button>
            </div>

            <span
              className="mono"
              style={{ color: 'var(--text-muted)', fontSize: 11 }}
            >
              Cảnh {selectedScene.id}/{scenes.length}
            </span>
          </div>

          {/* Player viewport */}
          <div className="player-container">
            {activeTab === 'preview' && (
              <Player
                ref={remotionPlayerRef}
                component={MainVideo}
                inputProps={{ scenes }}
                durationInFrames={metadata.total_duration_in_frames}
                compositionWidth={metadata.width}
                compositionHeight={metadata.height}
                fps={metadata.fps}
                style={{ width: '100%', height: '100%' }}
                controls
                autoPlay={false}
                loop
                acknowledgeRemotionLicense
              />
            )}

            {activeTab === 'scenes' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'var(--bg-base)',
                  padding: 24,
                  overflowY: 'auto',
                }}
              >
                <div style={{ maxWidth: 960, margin: '0 auto' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 16,
                      paddingBottom: 12,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          margin: 0,
                        }}
                      >
                        {scenes.length} cảnh · {totalImagesCount} hình ảnh
                      </h3>
                      <p
                        style={{
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          margin: '4px 0 0',
                        }}
                      >
                        Chọn cảnh để xem chi tiết, hoặc tạo lại hình ảnh
                      </p>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleOpenRegenerate(selectedScene)}
                    >
                      <Wand2 style={{ width: 14, height: 14 }} />
                      <span>Tạo lại ảnh cảnh #{selectedScene.id}</span>
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {scenes.map((sc) => {
                      const beatsCount = sc.beats?.length || 1;
                      const isActive = selectedSceneId === sc.id;
                      return (
                        <div
                          key={sc.id}
                          className={`card ${isActive ? 'card-active' : ''}`}
                          style={{ padding: 12, cursor: 'pointer' }}
                          onClick={() => jumpToScene(sc)}
                        >
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div
                              style={{
                                width: 120,
                                height: 72,
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                background: 'var(--bg-base)',
                                border: '1px solid var(--border)',
                                flexShrink: 0,
                                position: 'relative',
                              }}
                            >
                              <img
                                src={
                                  sc.beats?.[0]?.svg_data
                                    ? `data:image/svg+xml;utf8,${encodeURIComponent(sc.beats[0].svg_data)}`
                                    : `/images/${sc.image_file}`
                                }
                                alt={sc.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                }}
                              />
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: 4,
                                  right: 4,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  background: 'rgba(0,0,0,0.75)',
                                  color: 'var(--accent)',
                                  fontFamily: 'var(--font-mono)',
                                }}
                              >
                                {beatsCount} hình
                              </span>
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: 'var(--accent)',
                                  }}
                                >
                                  #{sc.id}
                                </span>
                                <span
                                  className="mono"
                                  style={{
                                    fontSize: 11,
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  {sc.duration_in_seconds.toFixed(1)}s
                                </span>
                              </div>
                              <h4
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: 'var(--text-primary)',
                                  margin: '2px 0',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {sc.title}
                              </h4>
                              <p
                                style={{
                                  fontSize: 12,
                                  color: 'var(--text-secondary)',
                                  margin: 0,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  lineHeight: 1.4,
                                }}
                              >
                                {sc.text}
                              </p>
                            </div>
                          </div>

                          {/* Beat chips */}
                          <div
                            style={{
                              marginTop: 8,
                              paddingTop: 8,
                              borderTop: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                            }}
                          >
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {sc.beats?.slice(0, 4).map((b) => (
                                <button
                                  key={b.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    jumpToScene(sc, b.start_frame_offset);
                                  }}
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'var(--bg-hover)',
                                    border: '1px solid var(--border)',
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                  }}
                                  title={`Hình ${b.sub_index} (${b.duration_in_seconds}s)`}
                                >
                                  #{b.sub_index}
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRegenerate(sc);
                              }}
                              style={{
                                padding: '3px 10px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--accent-muted)',
                                border: '1px solid var(--accent-border)',
                                fontSize: 11,
                                fontWeight: 600,
                                color: 'var(--accent)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                transition: 'all 0.15s',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Wand2 style={{ width: 12, height: 12 }} />
                              Tạo lại
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'var(--bg-base)',
                  padding: 24,
                  overflow: 'auto',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                    }}
                  >
                    Dữ liệu cấu trúc scenes (JSON)
                  </span>
                  <button className="btn btn-secondary" onClick={copyJsonToClipboard}>
                    {copiedJson ? (
                      <Check style={{ width: 14, height: 14, color: 'var(--success)' }} />
                    ) : (
                      <Copy style={{ width: 14, height: 14 }} />
                    )}
                    <span>{copiedJson ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
                <pre
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 16,
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--success)',
                    overflow: 'auto',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {JSON.stringify({ metadata, scenes }, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Timeline
              </span>
              <span
                className="mono"
                style={{ fontSize: 11, color: 'var(--text-muted)' }}
              >
                {totalDuration.toFixed(1)}s · {metadata.total_duration_in_frames} frames
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                height: 28,
                background: 'var(--bg-base)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                padding: 3,
                gap: 2,
                border: '1px solid var(--border)',
              }}
            >
              {scenes.map((sc) => {
                const widthPercent =
                  (sc.duration_in_frames / metadata.total_duration_in_frames) * 100;
                const isCurrent = selectedSceneId === sc.id;
                return (
                  <button
                    key={sc.id}
                    onClick={() => jumpToScene(sc)}
                    style={{
                      width: `${widthPercent}%`,
                      height: '100%',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 10,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                      background: isCurrent ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: isCurrent ? 'var(--text-inverse)' : 'var(--text-muted)',
                      ...(isCurrent
                        ? {
                            boxShadow: '0 0 0 1px var(--accent)',
                          }
                        : {}),
                    }}
                    title={`Cảnh ${sc.id}: ${sc.title}`}
                  >
                    {sc.id}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ───── Selected Scene Inspector ───── */}
        <section className="surface" style={{ padding: 20 }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                className="badge badge-accent"
                style={{ fontSize: 12, fontWeight: 700 }}
              >
                #{selectedScene.id}
              </span>
              <div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {selectedScene.title}
                </h3>
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    margin: '2px 0 0',
                  }}
                >
                  {selectedSceneBeats.length} hình ảnh · {selectedScene.duration_in_seconds.toFixed(1)}s · {selectedScene.duration_in_frames} frames
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-primary"
                onClick={() => handleOpenRegenerate(selectedScene)}
              >
                <Wand2 style={{ width: 14, height: 14 }} />
                <span>Tạo lại ảnh</span>
              </button>
              <button
                className={`btn ${
                  playingAudioId === selectedScene.id ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => playSceneAudio(selectedScene)}
              >
                {playingAudioId === selectedScene.id ? (
                  <VolumeX style={{ width: 14, height: 14 }} />
                ) : (
                  <Volume2 style={{ width: 14, height: 14 }} />
                )}
                <span>{playingAudioId === selectedScene.id ? 'Dừng' : 'Audio'}</span>
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  jumpToScene(selectedScene);
                }}
              >
                <Play style={{ width: 12, height: 12 }} />
                <span>Phát</span>
              </button>
            </div>
          </div>

          {/* Beats gallery */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <span
                className="label"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ImageIcon style={{ width: 14, height: 14, color: 'var(--accent)' }} />
                Hình ảnh trong cảnh #{selectedScene.id}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 12,
              }}
            >
              {selectedSceneBeats.map((beat) => (
                <div
                  key={beat.id}
                  className="card"
                  style={{ padding: 10 }}
                >
                  <div
                    style={{
                      aspectRatio: '16/9',
                      width: '100%',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      position: 'relative',
                      marginBottom: 8,
                    }}
                  >
                    <img
                      src={
                        beat.svg_data
                          ? `data:image/svg+xml;utf8,${encodeURIComponent(beat.svg_data)}`
                          : `/images/${beat.image_file || selectedScene.image_file}`
                      }
                      alt={beat.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(0,0,0,0.75)',
                        color: 'var(--accent)',
                      }}
                    >
                      #{beat.sub_index}
                    </span>
                    <span
                      className="mono"
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(0,0,0,0.75)',
                        color: 'var(--success)',
                      }}
                    >
                      {beat.duration_in_seconds}s
                    </span>
                  </div>

                  <h5
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: '0 0 4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {beat.title}
                  </h5>
                  <p
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.4,
                    }}
                  >
                    {beat.prompt}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <button
                      onClick={() => handleOpenRegenerate(selectedScene, beat)}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--accent)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: 0,
                      }}
                    >
                      <Wand2 style={{ width: 12, height: 12 }} />
                      Đổi ảnh
                    </button>
                    <button
                      onClick={() => jumpToScene(selectedScene, beat.start_frame_offset)}
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: 0,
                      }}
                    >
                      Xem
                      <ChevronRight style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Script & Prompt */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid var(--border)',
            }}
          >
            <div>
              <span className="label" style={{ marginBottom: 6, display: 'block' }}>
                <FileText
                  style={{
                    width: 12,
                    height: 12,
                    display: 'inline',
                    verticalAlign: 'middle',
                    marginRight: 4,
                    color: 'var(--accent)',
                  }}
                />
                Lời thoại
              </span>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 12,
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                "{selectedScene.text}"
              </p>
            </div>
            <div>
              <span className="label" style={{ marginBottom: 6, display: 'block' }}>
                <Sparkles
                  style={{
                    width: 12,
                    height: 12,
                    display: 'inline',
                    verticalAlign: 'middle',
                    marginRight: 4,
                    color: 'var(--accent)',
                  }}
                />
                Prompt
              </span>
              <p
                className="mono"
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 12,
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {selectedScene.prompt}
              </p>
            </div>
          </div>
        </section>

        {/* ───── All Scenes Quick Nav ───── */}
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <h3
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Tất cả {scenes.length} cảnh
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 8,
            }}
          >
            {scenes.map((sc) => (
              <div
                key={sc.id}
                className={`scene-card ${selectedSceneId === sc.id ? 'active' : ''}`}
                onClick={() => jumpToScene(sc)}
              >
                <div
                  style={{
                    aspectRatio: '16/9',
                    width: '100%',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    background: 'var(--bg-base)',
                    marginBottom: 6,
                    position: 'relative',
                  }}
                >
                  <img
                    src={
                      sc.beats?.[0]?.svg_data
                        ? `data:image/svg+xml;utf8,${encodeURIComponent(sc.beats[0].svg_data)}`
                        : `/images/${sc.image_file}`
                    }
                    alt={sc.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--accent)',
                    }}
                  >
                    #{sc.id}
                  </span>
                  <span
                    className="mono"
                    style={{ fontSize: 10, color: 'var(--text-muted)' }}
                  >
                    {sc.duration_in_seconds.toFixed(0)}s
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    margin: '2px 0 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sc.title}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ───── Creator Drawer ───── */}
      {showCreatorDrawer && (
        <>
          <div
            className="drawer-overlay"
            onClick={() => setShowCreatorDrawer(false)}
          />
          <div className="drawer-panel">
            <CreatorPanel
              currentScenes={scenes}
              onGenerateNewVideo={handleGenerateNewVideo}
              onCancel={() => setShowCreatorDrawer(false)}
            />
          </div>
        </>
      )}

      {/* ───── Regenerate Image Modal ───── */}
      {sceneToRegenerate && (
        <RegenerateImageModal
          isOpen={regenerateModalOpen}
          onClose={() => setRegenerateModalOpen(false)}
          scene={sceneToRegenerate}
          selectedBeat={beatToRegenerate}
          onSaveImage={handleSaveRegeneratedImage}
        />
      )}

      {/* ───── Toast Notification ───── */}
      {toastMessage && (
        <div className="toast toast-success">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--success)' }} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ───── Footer ───── */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '20px 24px',
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        <p style={{ margin: 0 }}>
          Stickman Video Studio · Remotion + AI Pipeline · Font Be Vietnam Pro
        </p>
      </footer>
    </div>
  );
}
