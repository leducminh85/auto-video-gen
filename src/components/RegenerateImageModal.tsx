import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Check,
  Loader2,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  Film,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { SceneData, VisualBeat } from '../types/scenes';

interface RegenerateImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: SceneData;
  selectedBeat?: VisualBeat | null;
  onSaveImage: (
    sceneId: number,
    beatId: string | undefined,
    newPrompt: string,
    imageFile?: string,
    imageVersion?: number
  ) => void;
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
  const defaultImageFile = selectedBeat?.image_file || scene.image_file || `scene_${scene.id}_beat_${currentBeatIndex}.png`;
  
  // Get original beat prompt
  const originalPrompt = (
    selectedBeat?.plan?.imageGenerationPrompt ||
    selectedBeat?.prompt ||
    scene.prompt ||
    ''
  ).trim();

  // Get original diegetic text
  const originalDiegetic = (
    selectedBeat?.plan?.diegeticText ||
    selectedBeat?.plan?.keyText ||
    selectedBeat?.main_text ||
    ''
  ).trim();

  // States
  const [prompt, setPrompt] = useState<string>(originalPrompt);
  const [diegeticLabel, setDiegeticLabel] = useState<string>(originalDiegetic);
  const [imageFile, setImageFile] = useState<string>(defaultImageFile);
  const [imageVersion, setImageVersion] = useState<number>(selectedBeat?.image_version || Date.now());
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [hasNewImage, setHasNewImage] = useState<boolean>(false);
  const [providerName, setProviderName] = useState<string>('Google AI Studio');

  // Fetch active provider status on modal open
  useEffect(() => {
    let isMounted = true;
    fetch('/api/image-provider/status')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.preferredProvider === 'google_ai_studio') {
          setProviderName('Google AI Studio (Gemini 2.5 Flash)');
        } else if (data.preferredProvider === 'flux_local') {
          setProviderName('FLUX.1 [schnell]');
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleResetPrompt = () => {
    setPrompt(originalPrompt);
    setDiegeticLabel(originalDiegetic);
    setError(null);
  };

  const handleGenerateNewImage = async () => {
    if (!prompt.trim()) {
      setError('Vui lòng nhập prompt để tạo ảnh.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setStatusMessage('Đang gửi prompt đến AI Studio...');

    try {
      const response = await fetch('/api/regenerate-beat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneId: scene.id,
          subIndex: currentBeatIndex,
          prompt: prompt.trim(),
          diegeticLabel: diegeticLabel.trim(),
          durationInFrames: selectedBeat?.duration_in_frames || 90,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Tạo ảnh bằng AI thất bại. Vui lòng thử lại.');
      }

      const newTimestamp = data.timestamp || Date.now();
      setImageFile(data.imageFile || defaultImageFile);
      setImageVersion(newTimestamp);
      setHasNewImage(true);
      setStatusMessage('✓ Tạo ảnh và render clip Ken-Burns thành công!');
    } catch (err: any) {
      console.error('Lỗi tạo ảnh:', err);
      setError(err.message || 'Không thể tạo ảnh. Vui lòng kiểm tra lại trình duyệt AI Studio.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    onSaveImage(
      scene.id,
      selectedBeat?.id,
      prompt.trim(),
      imageFile,
      imageVersion
    );
    onClose();
  };

  const previewUrl = `/images/${imageFile}?v=${imageVersion}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
      }}
      className="animate-fade-in"
    >
      <div
        style={{
          background: 'var(--bg-surface, #1e293b)',
          border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
          borderRadius: 16,
          width: '100%',
          maxWidth: 960,
          maxHeight: '92vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-elevated, #0f172a)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              }}
            >
              <Sparkles style={{ width: 18, height: 18, color: '#0f172a' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #f8fafc)', margin: 0 }}>
                  Tạo lại ảnh bằng AI
                </h3>
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontWeight: 600,
                  }}
                >
                  {providerName}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', margin: '2px 0 0 0' }}>
                Cảnh #{scene.id} · Nhịp #{currentBeatIndex} · {selectedBeat?.title || scene.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isGenerating}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
              color: 'var(--text-secondary, #cbd5e1)',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Body Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 24,
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1.1fr) minmax(320px, 1fr)',
            gap: 24,
          }}
        >
          {/* Left Column: Image Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Film style={{ width: 14, height: 14, color: 'var(--accent, #f59e0b)' }} />
                Xem trước hình ảnh (16:9 1080p)
              </span>
              {hasNewImage && (
                <span
                  style={{
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: '#10b981',
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 style={{ width: 13, height: 13 }} />
                  Đã tạo ảnh mới
                </span>
              )}
            </div>

            <div
              style={{
                aspectRatio: '16/9',
                width: '100%',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
                background: '#090d16',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
              }}
            >
              <img
                src={previewUrl}
                alt={`Scene ${scene.id} Beat ${currentBeatIndex}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: isGenerating ? 0.4 : 1,
                  transition: 'opacity 0.2s ease',
                }}
                onError={(e) => {
                  // Fallback if image not generated yet
                  (e.target as HTMLImageElement).src = '/images/placeholder.png';
                }}
              />

              {/* Generating Overlay */}
              {isGenerating && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    zIndex: 10,
                  }}
                >
                  <Loader2
                    className="animate-spin"
                    style={{ width: 40, height: 40, color: 'var(--accent, #f59e0b)' }}
                  />
                  <div style={{ textAlign: 'center', padding: '0 20px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                      Đang tạo ảnh bằng AI...
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      {statusMessage || 'Đang vẽ nhân vật stickman & render clip 1080p'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <AlertCircle style={{ width: 16, height: 16, color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.4 }}>
                  {error}
                </div>
              </div>
            )}

            {/* Image Meta Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11,
                color: 'var(--text-muted, #94a3b8)',
                padding: '4px 6px',
              }}
            >
              <span>{imageFile}</span>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'var(--accent, #f59e0b)',
                  textDecoration: 'none',
                }}
              >
                Xem ảnh gốc <ExternalLink style={{ width: 11, height: 11 }} />
              </a>
            </div>

            {/* Beat Context Info */}
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.07))',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #cbd5e1)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Ngữ cảnh câu thoại
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-primary, #f1f5f9)', lineHeight: 1.4 }}>
                "{selectedBeat?.caption || scene.text || 'N/A'}"
              </div>
              {selectedBeat?.plan?.meaning && (
                <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', fontStyle: 'italic', marginTop: 2 }}>
                  Ý nghĩa thể hiện: {selectedBeat.plan.meaning}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Prompt Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Prompt Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-secondary, #cbd5e1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <FileText style={{ width: 14, height: 14, color: 'var(--accent, #f59e0b)' }} />
                  Prompt hiện tại của Beat
                </label>
                <button
                  type="button"
                  onClick={handleResetPrompt}
                  disabled={isGenerating}
                  style={{
                    fontSize: 11,
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted, #94a3b8)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="Khôi phục lại prompt ban đầu của beat"
                >
                  <RotateCcw style={{ width: 11, height: 11 }} />
                  Khôi phục gốc
                </button>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={9}
                disabled={isGenerating}
                placeholder="Nhập prompt mô tả hình ảnh cho AI..."
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 10,
                  background: 'var(--bg-base, #090d16)',
                  border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                  color: 'var(--text-primary, #f8fafc)',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: 12,
                  lineHeight: 1.5,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginTop: 4 }}>
                💡 Chuẩn phong cách: Whiteboard Doodle (Pictionary) · Tỷ lệ 16:9 lề an toàn ≥15% · Stickman đầu tròn rỗng, KHÔNG mắt mũi miệng · Nét bút dạ đen · Nền trắng tinh khiết.
              </div>
            </div>

            {/* Diegetic Label (Text in scene) */}
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary, #cbd5e1)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Chữ hiển thị trong hình (Biển hiệu / Bảng đen)
              </label>
              <input
                type="text"
                value={diegeticLabel}
                onChange={(e) => setDiegeticLabel(e.target.value)}
                disabled={isGenerating}
                placeholder="VD: COFFEE SHOP, 50% SALE, GYM CLOSED..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  background: 'var(--bg-base, #090d16)',
                  border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                  color: 'var(--text-primary, #f8fafc)',
                  fontSize: 12,
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: 10, color: 'var(--text-muted, #94a3b8)', marginTop: 4 }}>
                Tối đa 2-3 từ ngắn gọn để AI lồng ghép tự nhiên vào bối cảnh tranh vẽ.
              </div>
            </div>

            {/* Prominent Action Button: "Tạo ảnh mới" */}
            <div style={{ marginTop: 'auto', paddingTop: 8 }}>
              <button
                type="button"
                onClick={handleGenerateNewImage}
                disabled={isGenerating}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: 10,
                  background: isGenerating
                    ? 'rgba(245, 158, 11, 0.3)'
                    : 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  border: 'none',
                  color: isGenerating ? '#cbd5e1' : '#0f172a',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: isGenerating ? 'none' : '0 4px 14px rgba(245, 158, 11, 0.35)',
                  transition: 'all 0.2s ease',
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" style={{ width: 18, height: 18, color: '#f59e0b' }} />
                    Đang tạo ảnh mới...
                  </>
                ) : (
                  <>
                    <Sparkles style={{ width: 18, height: 18, color: '#0f172a' }} />
                    Tạo ảnh mới
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-elevated, #0f172a)',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)' }}>
            {hasNewImage ? '✓ Ảnh mới đã được lưu trên ổ đĩa' : 'Nhấn "Tạo ảnh mới" để vẽ lại bằng AI'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isGenerating}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                color: 'var(--text-secondary, #cbd5e1)',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: 13,
              }}
            >
              Hủy
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleApply}
              disabled={isGenerating}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                background: '#10b981',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: 13,
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Check style={{ width: 15, height: 15 }} />
              Áp dụng vào Video
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
