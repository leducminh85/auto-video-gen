import React, { useState } from 'react';
import { X, RefreshCw, Image as ImageIcon, Loader2 } from 'lucide-react';
import { SceneData, VisualBeat } from '../types/scenes';
import { useDialog } from '../utils/useDialog';
import { IconButton } from './IconButton';
import { defaultPrompt } from '../config/imageStyle.json';

interface RegenerateImageModalProps {
  isOpen: boolean;
  adding?: boolean;
  insertAfterId?: string;
  imageStylePrompt?: string;
  onInsertAfterChange?: (id: string) => void;
  onClose: () => void;
  scene: SceneData;
  selectedBeat: VisualBeat | null;
  onSaveImage: (sceneId: number, beatId: string | undefined, prompt: string, imageFile?: string, imageVersion?: number) => void | Promise<void>;
}

export const RegenerateImageModal: React.FC<RegenerateImageModalProps> = props =>
  props.isOpen ? <ImageDialog key={`${props.scene.id}:${props.selectedBeat?.id}`} {...props} /> : null;

function ImageDialog({ scene, selectedBeat, adding, imageStylePrompt, insertAfterId, onInsertAfterChange, onClose, onSaveImage }: RegenerateImageModalProps) {
  const initialPrompt = adding ? selectedBeat?.caption || scene.text : selectedBeat?.plan?.imageGenerationPrompt || selectedBeat?.prompt || scene.prompt;
  const [style, setStyle] = useState(imageStylePrompt || defaultPrompt);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [label, setLabel] = useState(selectedBeat?.plan?.diegeticText || '');
  const [generated, setGenerated] = useState<{ file: string; version: number; prompt: string; label: string } | null>(null);
  const [busy, setBusy] = useState<'generate' | 'save' | null>(null);
  const [error, setError] = useState('');
  const dialogRef = useDialog(onClose, !busy);
  const fullPrompt = adding ? `${style.trim()}\n\nScene content: ${prompt.trim()}` : prompt.trim();
  const changed = generated && (fullPrompt !== generated.prompt || label.trim() !== generated.label);
  const source = generated ? `/images/${generated.file}?v=${generated.version}` : !adding ? `/images/${selectedBeat?.image_file || scene.image_file}?v=${selectedBeat?.image_version || scene.image_version || ''}` : null;
  const [imageFailed, setImageFailed] = useState(false);
  const anchor = scene.beats?.find(beat => beat.id === insertAfterId);
  const generate = async () => {
    if (!prompt.trim() || busy) return;
    setBusy('generate'); setError('');
    try {
      const response = await fetch('/api/regenerate-beat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneId: scene.id, subIndex: selectedBeat?.sub_index || 1, prompt: fullPrompt, diegeticLabel: label.trim() }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Không tạo được ảnh. Thử lại hoặc sửa mô tả.');
      setGenerated({ file: result.imageFile, version: result.timestamp || Date.now(), prompt: fullPrompt, label: label.trim() });
      setImageFailed(false);
    } catch (error: any) { setError(error.message); }
    finally { setBusy(null); }
  };
  const save = async () => {
    if (!generated || changed || busy) return;
    setBusy('save'); setError('');
    try {
      await onSaveImage(scene.id, selectedBeat?.id, generated.prompt, generated.file, generated.version);
      onClose();
    } catch (error: any) { setError(error.message); }
    finally { setBusy(null); }
  };
  return <div className="image-dialog-overlay">
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="image-dialog-title" tabIndex={-1} className="image-dialog">
      <header className="image-dialog-header">
        <div><h2 id="image-dialog-title">{adding ? 'Thêm ảnh vào cảnh' : 'Tạo lại ảnh'}</h2><p>Cảnh {scene.id} · {scene.title}</p></div>
        <IconButton label="Đóng hộp tạo lại ảnh" disabled={!!busy} onClick={onClose}><X size={18} /></IconButton>
      </header>
      <div className="image-dialog-body">
        <div className="image-dialog-preview">
          <div className="image-preview-frame">
            {source && !imageFailed ? <img src={source} alt={generated ? 'Ảnh vừa tạo' : 'Ảnh hiện tại'} onError={() => setImageFailed(true)} /> : <div className="image-empty"><ImageIcon size={32} /><p>{imageFailed ? 'Không tải được ảnh xem trước.' : 'Ảnh mới sẽ xuất hiện ở đây'}</p><span>Viết mô tả rồi bấm Tạo ảnh mới.</span></div>}
            {busy === 'generate' && <div className="image-progress" role="status"><Loader2 className="animate-spin" /> Đang tạo ảnh…</div>}
          </div>
          <p className="editor-help">{generated ? 'Kiểm tra ảnh trước khi lưu vào cảnh.' : adding ? 'Ảnh chỉ được chèn sau khi bạn bấm Thêm vào cảnh.' : 'Ảnh hiện tại được giữ cho đến khi bạn lưu ảnh mới.'}</p>
          <details className="image-narration"><summary>Lời thoại của cảnh</summary><p>{scene.text}</p></details>
        </div>
        <div className="image-dialog-controls">
          {adding && <div>
            <label htmlFor="insert-position">Chèn sau ảnh</label>
            <select id="insert-position" className="input" value={insertAfterId} disabled={!!busy} onChange={event => onInsertAfterChange?.(event.target.value)}>
              {scene.beats?.map(beat => <option key={beat.id} value={beat.id} disabled={beat.duration_in_frames < 2}>Ảnh {beat.sub_index} · {beat.duration_in_seconds.toFixed(1)} giây</option>)}
            </select>
            <p className="editor-help">{anchor ? `Chia ${anchor.duration_in_seconds.toFixed(1)} giây của ảnh ${anchor.sub_index} cho hai ảnh. Các ảnh khác và audio giữ nguyên.` : 'Chọn ảnh để chia thời gian hiển thị.'}</p>
          </div>}
          <div><label htmlFor="image-prompt">Mô tả hình ảnh</label><textarea id="image-prompt" className="input" rows={9} maxLength={20000} value={prompt} disabled={!!busy} onChange={event => setPrompt(event.target.value)} /></div>
          {adding && <details><summary>Phong cách cho ảnh mới</summary><label htmlFor="new-image-style" className="sr-only">Phong cách cho ảnh mới</label><textarea id="new-image-style" className="input" rows={5} value={style} maxLength={10000} disabled={!!busy} onChange={event => setStyle(event.target.value)} /></details>}
          <details><summary>Chữ cần xuất hiện trong ảnh (tùy chọn)</summary><label htmlFor="image-label" className="sr-only">Chữ trong ảnh</label><input id="image-label" className="input" value={label} disabled={!!busy} onChange={event => setLabel(event.target.value)} /></details>
          {error && <p className="editor-error" role="alert">{error}</p>}
          {changed && <p className="editor-help" role="status">Mô tả đã thay đổi. Hãy tạo lại ảnh trước khi lưu.</p>}
          {generated && !changed && <IconButton label="Tạo ảnh khác" disabled={!!busy} onClick={() => void generate()}><RefreshCw size={17} /></IconButton>}
        </div>
      </div>
      <footer className="image-dialog-footer">
        <IconButton label="Hủy" disabled={!!busy} onClick={onClose}><X size={17} /></IconButton>
        {!generated || changed ? <button className="btn btn-primary" disabled={!!busy || !prompt.trim()} onClick={() => void generate()}>{busy === 'generate' ? 'Đang tạo ảnh…' : changed ? 'Tạo lại theo mô tả' : 'Tạo ảnh mới'}</button> : <button className="btn btn-primary" disabled={!!busy} onClick={() => void save()}>{busy === 'save' ? 'Đang lưu…' : adding ? 'Thêm vào cảnh' : 'Lưu ảnh vào cảnh'}</button>}
      </footer>
    </div>
  </div>;
}
