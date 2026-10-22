import { useState } from 'react';
import { Player } from '@remotion/player';
import { useCurrentFrame } from 'remotion';
import type { MotionValue, RemotionShot, VectorLayer } from '../types/remotion';
import type { VisualBeat } from '../types/scenes';
import { VectorShot } from '../remotion/stickman/VectorShot';
import { useDialog } from '../utils/useDialog';

function Preview({ shot, duration }: { shot: RemotionShot; duration: number }) {
  return <VectorShot shot={shot} frame={useCurrentFrame()} duration={duration} />;
}
function flatten(layers: VectorLayer[]): VectorLayer[] { return layers.flatMap(layer => [layer, ...flatten(layer.children || [])]); }
function update(layers: VectorLayer[], id: string, changes: Partial<VectorLayer>): VectorLayer[] {
  return layers.map(layer => layer.id === id ? { ...layer, ...changes } : { ...layer, ...(layer.children ? { children: update(layer.children, id, changes) } : {}) });
}
const endpoint = (value: MotionValue | undefined, end: boolean, fallback = 0) => typeof value === 'number' ? value : value ? ('keys' in value ? value.keys[end ? value.keys.length - 1 : 0].value : end ? value.to : value.from) : fallback;
type MotionKey = 'x' | 'y' | 'scale' | 'rotation' | 'opacity' | 'raised' | 'look' | 'leftHandX' | 'leftHandY' | 'rightHandX' | 'rightHandY' | 'headTilt' | 'seated' | 'stride' | 'speech';

const motionDefault = (key: MotionKey) => ({ scale: 1, opacity: 1, leftHandX: -55, leftHandY: 247, rightHandX: 55, rightHandY: 247 } as Partial<Record<MotionKey, number>>)[key] ?? 0;

export function VectorShotEditor({ beat, fps, onSave, onClose }: { beat: VisualBeat; fps: number; onSave: (shot: RemotionShot) => Promise<boolean>; onClose: () => void }) {
  const [shot, setShot] = useState(() => structuredClone(beat.remotion!));
  const [selectedId, setSelectedId] = useState(shot.layers[0].id);
  const [instruction, setInstruction] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ref = useDialog(onClose, !busy);
  const layers = flatten(shot.layers);
  const selected = layers.find(layer => layer.id === selectedId) || layers[0];
  const motionKeys: MotionKey[] = ['x', 'y', 'scale', 'rotation', 'opacity', ...(selected.type === 'character' ? ['raised', 'look', 'leftHandX', 'leftHandY', 'rightHandX', 'rightHandY', 'headTilt', 'seated', 'stride', 'speech'] as MotionKey[] : [])];
  const change = (changes: Partial<VectorLayer>) => setShot(previous => ({ ...previous, layers: update(previous.layers, selected.id, changes) }));
  const setEndpoint = (key: MotionKey, value: number, end: boolean) => {
    const original = selected[key];
    if (typeof original === 'object' && 'keys' in original) {
      change({ [key]: { keys: original.keys.map((point, i) => i === (end ? original.keys.length - 1 : 0) ? { ...point, value } : point) } });
      return;
    }
    const fallback = motionDefault(key);
    change({ [key]: { ...(typeof original === 'object' ? original : {}), from: end ? endpoint(original, false, fallback) : value, to: end ? value : endpoint(original, true, fallback) } });
  };
  const revise = async () => {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/remotion/revise', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current: shot, instruction, text: beat.caption || beat.title, seconds: beat.duration_in_frames / fps, direction: shot.direction }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setShot(result.shot); setSelectedId(result.shot.layers[0].id);
    } catch (error: any) { setError(error.message); }
    finally { setBusy(false); }
  };
  return <div className="project-modal-overlay"><section className="vector-editor" ref={ref} role="dialog" aria-modal="true" aria-labelledby="vector-editor-title" tabIndex={-1}>
    <header><div><h2 id="vector-editor-title">Chỉnh hoạt hình</h2><p>{beat.title} · {(beat.duration_in_frames / fps).toFixed(2)} giây</p></div><button className="btn btn-ghost" disabled={busy} onClick={onClose}>Đóng</button></header>
    <div className="vector-editor-layout">
      <div className="vector-editor-preview"><Player component={Preview} inputProps={{ shot, duration: beat.duration_in_frames }} durationInFrames={beat.duration_in_frames} fps={fps} compositionWidth={1920} compositionHeight={1080} controls style={{ width: '100%', aspectRatio: '16/9' }} />
        <p>{shot.direction}</p>
        <label className="field-label" htmlFor="vector-instruction">Yêu cầu ChatGPT chỉnh cảnh</label>
        <textarea id="vector-instruction" className="input" rows={3} maxLength={4000} value={instruction} disabled={busy} onChange={event => setInstruction(event.target.value)} placeholder="Ví dụ: Cho Leo bước đến bàn, nhìn vào màn hình rồi mỉm cười." />
        <button className="btn btn-secondary" disabled={busy || !instruction.trim()} onClick={() => void revise()}>{busy ? 'Đang xử lý…' : 'Dựng lại cảnh với ChatGPT'}</button>
      </div>
      <fieldset className="vector-layer-controls" disabled={busy}>
        <legend>Bố cục và chuyển động</legend>
        <label>Lớp đang chỉnh<select className="input" value={selected.id} onChange={event => setSelectedId(event.target.value)}>{layers.map(layer => <option key={layer.id} value={layer.id}>{layer.label || layer.id} · {layer.type}</option>)}</select></label>
        <label>Màu nền<input className="input" value={shot.background} onChange={event => setShot({ ...shot, background: event.target.value })} /></label>
        {selected.type === 'text' && <label>Nội dung chữ<input className="input" maxLength={500} value={selected.text || ''} onChange={event => change({ text: event.target.value })} /></label>}
        {selected.type === 'character' && <>
          <label>Biểu cảm<select className="input" value={selected.emotion || 'confident'} onChange={event => change({ emotion: event.target.value as VectorLayer['emotion'] })}>{[['calm','Bình tĩnh'],['confident','Tự tin'],['pleased','Vui'],['annoyed','Khó chịu'],['surprised','Ngạc nhiên'],['talking','Nói chuyện']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><input type="checkbox" checked={!!selected.walking} onChange={event => change({ walking: event.target.checked })} /> Chuyển động bước chân</label>
          <label><input type="checkbox" checked={!!selected.talking} onChange={event => change({ talking: event.target.checked })} /> Chuyển động miệng</label>
        </>}
        <div className="vector-motion-heading"><span>Thuộc tính</span><span>Đầu cảnh</span><span>Cuối cảnh</span></div>
        {motionKeys.map(key => <div className="vector-motion-row" key={key}><span>{{ leftHandX: 'Tay trái X', leftHandY: 'Tay trái Y', rightHandX: 'Tay phải X', rightHandY: 'Tay phải Y', headTilt: 'Nghiêng đầu', seated: 'Ngồi', stride: 'Bước chân', speech: 'Nói', x: 'Ngang', y: 'Dọc', scale: 'Tỷ lệ', rotation: 'Góc xoay', opacity: 'Độ hiện', raised: 'Nâng tay', look: 'Hướng nhìn' }[key]}</span>{[false,true].map(end => <input key={String(end)} className="input" type="number" step={['scale','opacity','raised','look'].includes(key) ? .05 : 10} aria-label={`${key} ${end ? 'cuối' : 'đầu'} cảnh`} value={endpoint(selected[key], end, motionDefault(key))} onChange={event => { if (event.target.value !== '' && Number.isFinite(event.target.valueAsNumber)) setEndpoint(key, event.target.valueAsNumber, end); }} />)}</div>)}
        {motionKeys.map(key => {
          const track = selected[key];
          if (!track || typeof track !== 'object' || !('keys' in track)) return null;
          return <details key={key}><summary>{key} · {track.keys.length} mốc chuyển động (thời điểm 0–1 / giá trị)</summary>
            {track.keys.map((point, i) => <div className="vector-motion-row" key={i}>
              <input className="input" type="number" aria-label={`${key} mốc ${i + 1} thời điểm`} min={0} max={1} step={.01} value={point.at} onChange={event => {
                const at = event.target.valueAsNumber;
                if (Number.isFinite(at) && at >= 0 && at <= 1 && at > (track.keys[i - 1]?.at ?? -1) && at < (track.keys[i + 1]?.at ?? 2)) change({ [key]: { keys: track.keys.map((p, j) => j === i ? { ...p, at } : p) } });
              }} />
              <input className="input" type="number" aria-label={`${key} mốc ${i + 1} giá trị`} value={point.value} onChange={event => {
                const value = event.target.valueAsNumber;
                if (Number.isFinite(value)) change({ [key]: { keys: track.keys.map((p, j) => j === i ? { ...p, value } : p) } });
              }} />
              <select className="input" aria-label={`${key} mốc ${i + 1} chuyển tiếp`} value={point.ease || 'smooth'} onChange={event => change({ [key]: { keys: track.keys.map((p, j) => j === i ? { ...p, ease: event.target.value as 'smooth' | 'linear' | 'hold' } : p) } })}>
                <option value="smooth">Êm</option><option value="linear">Đều</option><option value="hold">Giữ</option>
              </select>
            </div>)}
          </details>;
        })}
      </fieldset>
    </div>
    {error && <p role="alert" className="project-notice">{error}</p>}
    <footer><button className="btn btn-secondary" disabled={busy} onClick={() => setShot(structuredClone(beat.remotion!))}>Khôi phục cảnh</button><button className="btn btn-primary" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { if (await onSave(shot)) onClose(); else setError('Không lưu được cảnh. Hãy kiểm tra dữ liệu rồi thử lại.'); } catch (error: any) { setError(error.message); } finally { setBusy(false); } }}>Lưu hoạt hình</button></footer>
  </section></div>;
}
