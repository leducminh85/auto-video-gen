import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, GripVertical, Image as ImageIcon, Minus, Plus, ScanLine, Music, RefreshCw, Trash2 } from 'lucide-react';
import type { SceneData, VisualBeat } from '../types/scenes';
import { reorderBeat, resizeBeatBoundary } from '../utils/beatEditing';
import { IconButton } from './IconButton';
import { AudioWaveform } from './AudioWaveform';

type Gesture = { kind: 'move' | 'resize'; id: string; boundary: number; base: SceneData; startX: number; startScroll: number; pointerId: number; clientX: number; moved: boolean };
interface Props {
  scene: SceneData;
  fps: number;
  busy: boolean;
  playhead: number;
  selectedId: string | null;
  onSelect: (beat: VisualBeat) => void;
  onSeek: (frame: number) => void;
  onCommit: (scene: SceneData) => Promise<boolean>;
  onRegenerate: (beat: VisualBeat) => void;
  onDelete: (beat: VisualBeat) => void;
}
const time = (frames: number, fps: number) => `${(frames / fps).toFixed(2)}s`;

export function SceneTimeline({ scene, fps, busy, playhead, selectedId, onSelect, onSeek, onCommit, onRegenerate, onDelete }: Props) {
  const [draft, setDraft] = useState(scene);
  const draftRef = useRef(scene);
  const [zoom, setZoom] = useState(80);
  const [viewportWidth, setViewportWidth] = useState(700);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [duration, setDuration] = useState('');
  const viewport = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const animation = useRef(0);
  const pending = useRef(false);
  const beats = draft.beats || [];
  const selected = beats.find(beat => beat.id === selectedId) || beats[0];
  const selectedIndex = beats.findIndex(beat => beat.id === selected?.id);
  const locked = busy || saving;
  const fitZoom = Math.max(1, (viewportWidth - 2) / (scene.duration_in_frames / fps));
  const effectiveZoom = Math.max(zoom, fitZoom);
  const scale = effectiveZoom / fps;
  const trackWidth = Math.max(1, scene.duration_in_frames * scale);
  const setScene = (next: SceneData) => { draftRef.current = next; setDraft(next); };

  useEffect(() => { setScene(scene); }, [scene]);
  useEffect(() => {
    const observer = new ResizeObserver(entries => setViewportWidth(entries[0].contentRect.width));
    if (viewport.current) observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const shortest = Math.min(...(scene.beats || []).map(beat => beat.duration_in_frames / fps));
    setZoom(Math.max(70, Math.min(300, 170 / Math.max(shortest, 0.01))));
    if (viewport.current) viewport.current.scrollLeft = 0;
  }, [scene.id, fps]);
  useEffect(() => { setDuration(selected ? (selected.duration_in_frames / fps).toFixed(2) : ''); }, [selected?.id, selected?.duration_in_frames, fps]);
  useEffect(() => () => cancelAnimationFrame(animation.current), []);

  const commit = async (next: SceneData) => {
    if (pending.current) return;
    if (JSON.stringify(next.beats) === JSON.stringify(scene.beats)) { setScene(scene); return; }
    pending.current = true; setSaving(true); setScene(next);
    try {
      if (await onCommit(next)) setAnnouncement('Đã lưu timeline.');
      else { setScene(scene); setAnnouncement('Không lưu được. Timeline đã trở về trước khi chỉnh.'); }
    } catch { setScene(scene); setAnnouncement('Không lưu được timeline. Hãy thử lại.'); }
    finally { pending.current = false; setSaving(false); }
  };
  const applyPointer = (clientX: number) => {
    const active = gesture.current;
    if (!active || !viewport.current) return;
    active.clientX = clientX;
    const delta = clientX - active.startX + viewport.current.scrollLeft - active.startScroll;
    if (Math.abs(delta) > 3) active.moved = true;
    if (!active.moved) return;
    if (active.kind === 'resize') {
      const boundary = active.base.beats![active.boundary];
      const frame = boundary.start_frame_offset + boundary.duration_in_frames + delta / scale;
      setScene(resizeBeatBoundary(active.base, active.boundary, frame, fps));
    } else {
      const baseBeats = active.base.beats!;
      const moving = baseBeats.find(beat => beat.id === active.id)!;
      const center = moving.start_frame_offset + moving.duration_in_frames / 2 + delta / scale;
      const target = baseBeats.filter(beat => beat.id !== active.id).filter(beat => center > beat.start_frame_offset + beat.duration_in_frames / 2).length;
      setScene(reorderBeat(active.base, active.id, target, fps));
    }
  };
  const start = (event: React.PointerEvent, beat: VisualBeat, kind: Gesture['kind'], boundary = -1) => {
    if (locked || pending.current || event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    (event.currentTarget as HTMLElement).focus({ preventScroll: true });
    onSelect(beat);
    gesture.current = { kind, id: beat.id, boundary, base: scene, startX: event.clientX, startScroll: viewport.current!.scrollLeft, pointerId: event.pointerId, clientX: event.clientX, moved: false };
    viewport.current!.setPointerCapture(event.pointerId);
    setDragging(true);
    const scroll = () => {
      const active = gesture.current, element = viewport.current;
      if (!active || !element) return;
      const box = element.getBoundingClientRect();
      const speed = active.clientX < box.left + 40 ? -12 : active.clientX > box.right - 40 ? 12 : 0;
      if (speed && active.moved) { element.scrollLeft += speed; applyPointer(active.clientX); }
      animation.current = requestAnimationFrame(scroll);
    };
    animation.current = requestAnimationFrame(scroll);
  };
  const finish = (cancelled = false) => {
    const active = gesture.current;
    if (!active) return;
    gesture.current = null; cancelAnimationFrame(animation.current); setDragging(false);
    if (viewport.current?.hasPointerCapture(active.pointerId)) viewport.current.releasePointerCapture(active.pointerId);
    if (cancelled) setScene(scene);
    else if (active.moved) void commit(draftRef.current);
  };
  const seek = (event: React.MouseEvent) => {
    const box = event.currentTarget.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(scene.duration_in_frames - 1, Math.round((event.clientX - box.left) / scale))));
  };
  const editDuration = () => {
    const frames = Math.round(Number(duration) * fps);
    if (!Number.isFinite(frames) || frames < 1 || beats.length < 2) { setDuration((selected.duration_in_frames / fps).toFixed(2)); return; }
    const boundary = selectedIndex < beats.length - 1 ? selectedIndex : selectedIndex - 1;
    const end = selectedIndex < beats.length - 1 ? selected.start_frame_offset + frames : scene.duration_in_frames - frames;
    void commit(resizeBeatBoundary(scene, boundary, end, fps));
  };
  const tickSeconds = effectiveZoom >= 150 ? 0.5 : effectiveZoom >= 60 ? 1 : effectiveZoom >= 25 ? 2 : 5;
  const tickFrames = Math.max(1, Math.round(tickSeconds * fps));
  const ticks = Array.from({ length: Math.ceil(scene.duration_in_frames / tickFrames) }, (_, i) => i * tickFrames);
  const currentFrame = Math.max(0, Math.min(scene.duration_in_frames - 1, playhead));
  const resizeHandle = (beat: VisualBeat, boundary: number, edge: 'left' | 'right') => {
    const previous = beats[boundary], next = beats[boundary + 1];
    const value = previous.start_frame_offset + previous.duration_in_frames;
    return <div role="slider" aria-label={`${edge === 'left' ? 'Đầu' : 'Cuối'} ảnh ${beat.sub_index}`} aria-valuemin={previous.start_frame_offset + 1} aria-valuemax={next.start_frame_offset + next.duration_in_frames - 1} aria-valuenow={value} aria-valuetext={time(value, fps)} aria-disabled={locked} tabIndex={locked ? -1 : 0}
      className={`clip-resize clip-resize-${edge}`} title="Kéo để chỉnh thời lượng · Phím ← →: 1 frame, Shift: 10 frame"
      onPointerDown={event => start(event, beat, 'resize', boundary)}
      onKeyDown={event => { if (locked || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return; event.preventDefault(); event.stopPropagation(); const valueNext = event.key === 'Home' ? previous.start_frame_offset + 1 : event.key === 'End' ? next.start_frame_offset + next.duration_in_frames - 1 : value + (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 10 : 1); void commit(resizeBeatBoundary(scene, boundary, valueNext, fps)); }}><span /></div>;
  };
  if (!selected) return null;
  return <div className="scene-timeline">
    <div className="timeline-tools">
      <p id="timeline-help">Kéo thân ảnh để đổi vị trí · Kéo mép để chỉnh thời gian</p>
      <div className="toolbar-actions">
        <IconButton label="Thu nhỏ timeline" disabled={dragging || effectiveZoom <= fitZoom + 0.01} onClick={() => setZoom(Math.max(fitZoom, effectiveZoom / 1.4))}><Minus size={17} /></IconButton>
        <IconButton label="Vừa khung timeline" disabled={dragging} onClick={() => setZoom(Math.max(1, (viewportWidth - 12) / (scene.duration_in_frames / fps)))}><ScanLine size={17} /></IconButton>
        <IconButton label="Phóng to timeline" disabled={dragging || effectiveZoom >= 2400} onClick={() => setZoom(Math.min(2400, effectiveZoom * 1.4))}><Plus size={17} /></IconButton>
      </div>
    </div>
    <div className="timeline-track-layout">
      <div className="track-labels" aria-hidden="true"><span /><span><Music size={16} /> Audio</span><span><ImageIcon size={16} /> Ảnh</span></div>
      <div className={`timeline-scroll ${dragging ? 'is-dragging' : ''}`} ref={viewport} tabIndex={0} aria-label="Timeline cảnh, cuộn ngang để xem các ảnh" aria-describedby="timeline-help"
        onPointerMove={event => applyPointer(event.clientX)} onPointerUp={() => finish()} onPointerCancel={() => finish(true)} onLostPointerCapture={() => { if (gesture.current) finish(true); }} onKeyDown={event => { if (event.key === 'Escape' && gesture.current) { event.preventDefault(); finish(true); } }}>
        <div className="timeline-canvas" style={{ width: trackWidth }}>
          <div className="timeline-ruler" onClick={seek}>{ticks.map(frame => <span key={frame} style={{ left: frame * scale }}>{(frame / fps).toFixed(tickSeconds < 1 ? 1 : 0)}s</span>)}<span className="timeline-end" style={{ left: trackWidth }}>{time(scene.duration_in_frames, fps)}</span></div>
          <div className="audio-track" onClick={seek}><AudioWaveform file={scene.audio_file} version={scene.audio_version} /><span className="audio-track-caption">Audio · {time(scene.duration_in_frames, fps)} · Giữ nguyên</span></div>
          <div className="image-track">
            {beats.map((beat, index) => {
              const width = beat.duration_in_frames * scale;
              const image = `/images/${beat.image_file}?v=${beat.image_version || ''}`;
              return <div key={beat.id} className={`timeline-clip ${selected.id === beat.id ? 'selected' : ''} ${dragging && gesture.current?.id === beat.id ? 'moving' : ''}`} style={{ width }} data-beat-id={beat.id} data-frames={beat.duration_in_frames}>
                <button className="clip-body" disabled={locked} aria-label={`Chọn ảnh ${index + 1}, ${time(beat.duration_in_frames, fps)}`} aria-pressed={selected.id === beat.id} onPointerDown={event => start(event, beat, 'move')}
                  onClick={() => { if (!dragging) onSelect(beat); }} onKeyDown={event => { if (event.altKey && ['ArrowLeft','ArrowRight'].includes(event.key)) { event.preventDefault(); const target = index + (event.key === 'ArrowLeft' ? -1 : 1); if (target >= 0 && target < beats.length) void commit(reorderBeat(scene, beat.id, target, fps)); } }}>
                  <span className="clip-caption"><GripVertical size={13} /><strong>Ảnh {index + 1}</strong><span>{time(beat.duration_in_frames, fps)}</span></span>
                  <span className="clip-filmstrip">{Array.from({ length: Math.min(30, Math.max(1, Math.floor(width / 180))) }, (_, i) => <img key={i} src={image} alt={i ? '' : `Nội dung ảnh ${index + 1}`} draggable={false} />)}</span>
                </button>
                {index > 0 && resizeHandle(beat, index - 1, 'left')}
                {index < beats.length - 1 && resizeHandle(beat, index, 'right')}
              </div>;
            })}
          </div>
          <div className="timeline-playhead" aria-hidden="true" style={{ left: currentFrame * scale }}><span /></div>
        </div>
      </div>
    </div>
    <div className="timeline-selection">
      <img className="selected-image-preview" src={`/images/${selected.image_file}?v=${selected.image_version || ''}`} alt={`Ảnh ${selectedIndex + 1} đang chọn`} />
      <div className="selection-details">
        <div className="selection-heading"><strong>Ảnh {selectedIndex + 1}</strong><span>{time(selected.start_frame_offset, fps)} → {time(selected.start_frame_offset + selected.duration_in_frames, fps)}</span></div>
        <p>{selected.caption || selected.title}</p>
        <div className="selection-controls">
          <label htmlFor="clip-duration">Thời lượng <span className="duration-input"><input id="clip-duration" type="number" step={1 / fps} min={1 / fps} value={duration} disabled={locked || beats.length < 2} onChange={event => setDuration(event.target.value)} onBlur={editDuration} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} /> giây</span></label>
          <div className="toolbar-actions">
            <IconButton label="Đưa ảnh sang trái" disabled={locked || selectedIndex === 0} onClick={() => void commit(reorderBeat(scene, selected.id, selectedIndex - 1, fps))}><ArrowLeft size={17} /></IconButton>
            <IconButton label="Đưa ảnh sang phải" disabled={locked || selectedIndex === beats.length - 1} onClick={() => void commit(reorderBeat(scene, selected.id, selectedIndex + 1, fps))}><ArrowRight size={17} /></IconButton>
            <IconButton label="Tạo lại ảnh" disabled={locked} onClick={() => onRegenerate(selected)}><RefreshCw size={17} /></IconButton>
            <IconButton label={`Xóa ảnh ${selectedIndex + 1}`} disabled={locked || beats.length < 2} onClick={() => onDelete(selected)}><Trash2 size={17} /></IconButton>
          </div>
        </div>
        <small>{beats.length < 2 ? 'Thêm ảnh để chia thời gian của cảnh này.' : 'Thời gian lấy từ ảnh liền kề; tổng thời lượng audio không đổi.'}</small>
      </div>
    </div>
    <div className="timeline-status" role="status">{dragging ? `${gesture.current?.kind === 'resize' ? 'Đang chỉnh thời gian' : 'Đang đổi vị trí'} · Thả để lưu, Esc để hủy` : saving ? 'Đang lưu timeline…' : announcement || `${scene.duration_in_frames} frame · ${fps} fps`}</div>
  </div>;
}
