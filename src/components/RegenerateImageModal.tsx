import React, { useState } from 'react';
import {
  RefreshCw,
  X,
  Check,
  Download,
  Wand2,
  Palette,
  User,
  Eye,
} from 'lucide-react';
import { SceneData, VisualBeat } from '../types/scenes';
import {
  generateStickmanSvg,
  StickmanStyle,
  CharacterPose,
} from '../utils/stickmanArtGenerator';

interface RegenerateImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: SceneData;
  selectedBeat?: VisualBeat | null;
  onSaveImage: (sceneId: number, beatId: string | undefined, svgData: string, newPrompt: string) => void;
}

export const RegenerateImageModal: React.FC<RegenerateImageModalProps> = ({
  isOpen,
  onClose,
  scene,
  selectedBeat,
  onSaveImage,
}) => {
  if (!isOpen) return null;

  const currentBeatIndex = selectedBeat ? selectedBeat.sub_index : 1;
  const initialPrompt = selectedBeat ? selectedBeat.prompt : scene.prompt;

  const [prompt, setPrompt] = useState<string>(initialPrompt);
  const [style, setStyle] = useState<StickmanStyle>('whiteboard');
  const [pose, setPose] = useState<CharacterPose>(
    scene.id % 2 === 0 ? 'shocked' : 'explaining'
  );
  const [title, setTitle] = useState<string>(selectedBeat ? selectedBeat.title : scene.title);
  const [customNote, setCustomNote] = useState<string>(`Nhịp ${currentBeatIndex} · Cảnh ${scene.id}`);

  const previewSvg = generateStickmanSvg({
    title,
    prompt,
    sceneId: scene.id,
    beatIndex: currentBeatIndex,
    style,
    pose,
    customNote,
  });

  const previewDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(previewSvg)}`;

  const handleApply = () => {
    onSaveImage(scene.id, selectedBeat?.id, previewSvg, prompt);
    onClose();
  };

  const handleRandomize = () => {
    const styles: StickmanStyle[] = ['whiteboard', 'pastel', 'blueprint', 'comic_memo', 'dark_neon'];
    const poses: CharacterPose[] = ['explaining', 'shocked', 'running', 'lifting', 'balance', 'ghost', 'trainer'];
    setStyle(styles[Math.floor(Math.random() * styles.length)]);
    setPose(poses[Math.floor(Math.random() * poses.length)]);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = previewDataUri;
    link.download = `scene_${scene.id}_beat_${currentBeatIndex}.svg`;
    link.click();
  };

  const STYLE_OPTIONS = [
    { id: 'whiteboard', name: 'Whiteboard', desc: 'Bảng trắng' },
    { id: 'pastel', name: 'Pastel', desc: 'Màu sắc' },
    { id: 'blueprint', name: 'Blueprint', desc: 'Kỹ thuật' },
    { id: 'comic_memo', name: 'Comic', desc: 'Châm biếm' },
    { id: 'dark_neon', name: 'Neon', desc: 'Phát sáng' },
  ];

  const POSE_OPTIONS = [
    { id: 'explaining', name: '👨‍🏫 Thuyết trình' },
    { id: 'shocked', name: '😱 Shock' },
    { id: 'running', name: '🏃 Chạy' },
    { id: 'lifting', name: '🏋️ Nâng tạ' },
    { id: 'balance', name: '⚖️ Cân bằng' },
    { id: 'ghost', name: '🛋️ Vô hình' },
    { id: 'trainer', name: '📋 HLV' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
      }}
      className="animate-fade-in"
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wand2 style={{ width: 16, height: 16, color: 'var(--accent)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Tạo lại hình ảnh
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Cảnh #{scene.id} · Nhịp #{currentBeatIndex}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 20,
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: 20,
          }}
        >
          {/* Left: Preview */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Eye style={{ width: 12, height: 12, color: 'var(--accent)' }} />
                Xem trước (16:9)
              </span>
            </div>
            <div
              style={{
                aspectRatio: '16/9',
                width: '100%',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: 'var(--bg-base)',
                position: 'relative',
              }}
            >
              <img
                src={previewDataUri}
                alt="Preview"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: 6 }}>
                <button className="btn btn-secondary" onClick={handleDownload} style={{ fontSize: 11, padding: '5px 10px' }}>
                  <Download style={{ width: 12, height: 12 }} />
                  SVG
                </button>
                <button className="btn btn-primary" onClick={handleRandomize} style={{ fontSize: 11, padding: '5px 10px' }}>
                  <RefreshCw style={{ width: 12, height: 12 }} />
                  Random
                </button>
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Style */}
            <div>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Palette style={{ width: 12, height: 12, color: 'var(--accent)' }} />
                Phong cách
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id as StickmanStyle)}
                    className={`card ${style === s.id ? 'card-active' : ''}`}
                    style={{
                      padding: '8px 10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      border: `1px solid ${style === s.id ? 'var(--accent-border)' : 'var(--border)'}`,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pose */}
            <div>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <User style={{ width: 12, height: 12, color: 'var(--accent)' }} />
                Tư thế
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {POSE_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPose(p.id as CharacterPose)}
                    style={{
                      padding: '7px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${pose === p.id ? 'var(--accent-border)' : 'var(--border)'}`,
                      background: pose === p.id ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: pose === p.id ? 'var(--text-inverse)' : 'var(--text-secondary)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="label" style={{ marginBottom: 6, display: 'block' }}>
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="input"
                style={{
                  width: '100%',
                  resize: 'vertical',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
                placeholder="Mô tả hình ảnh stickman..."
              />
            </div>

            {/* Title & Note */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="Tiêu đề"
                style={{ fontSize: 12, fontWeight: 600 }}
              />
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="input"
                placeholder="Ghi chú"
                style={{ fontSize: 12 }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <button className="btn btn-ghost" onClick={onClose}>
            Hủy
          </button>
          <button className="btn btn-primary" onClick={handleApply} style={{ padding: '8px 20px' }}>
            <Check style={{ width: 14, height: 14 }} />
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};
