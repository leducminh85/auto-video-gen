import { Scissors } from 'lucide-react';
import { IconButton } from './IconButton';
import React, { useRef, useEffect, useState } from 'react';

interface Props {
  audio: { file: string; duration: number; name: string };
  scenes: { title: string; text: string }[];
  boundaries: string;
  onChange: (value: string) => void;
}

export function AudioTimingEditor({ audio, scenes, boundaries, onChange }: Props) {
  const [audioError, setAudioError] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const player = useRef<HTMLAudioElement>(null);
  useEffect(() => { if (scenes.length < 2 && boundaries) onChange(''); }, [scenes.length, boundaries, onChange]);
  const cuts = boundaries ? boundaries.split(',') : [];
  const manual = boundaries !== '';
  const totalWords = scenes.reduce((sum, scene) => sum + scene.text.split(/\s+/).length, 0);
  let words = 0;
  const estimates = scenes.slice(0, -1).map(scene => {
    words += scene.text.split(/\s+/).length;
    return (words / totalWords * audio.duration).toFixed(2);
  });
  const setCut = (index: number, value: string) => {
    const next = scenes.slice(0, -1).map((_, i) => cuts[i] ?? estimates[i]);
    next[index] = value;
    onChange(next.join(',') || ' ');
  };
  return <div className="audio-timing">
    <div className="audio-file-info"><strong>{audio.name}</strong><span>{audio.duration.toFixed(1)} giây</span></div>
    <audio ref={player} controls src={`/audio/${audio.file}`} onTimeUpdate={event => setAudioPosition(event.currentTarget.currentTime)} onSeeked={event => setAudioPosition(event.currentTarget.currentTime)} onError={() => setAudioError(true)} onCanPlay={() => setAudioError(false)} aria-label="Nghe audio đã nhập" />
    {audioError && <p className="editor-error" role="alert">Không nghe được tệp đã lưu. Hãy chọn lại audio ở trên.</p>}
    {scenes.length > 1 ? <>
      <label className="timing-toggle"><input type="checkbox" checked={manual} onChange={event => onChange(event.target.checked ? estimates.join(',') : '')} /> Tự đặt thời điểm chuyển cảnh</label>
      {manual ? <div className="audio-cut-list">
        <p className="editor-help">Nghe audio, dừng tại cuối câu rồi bấm “Lấy vị trí đang nghe”, hoặc nhập số giây.</p>
        {scenes.slice(0, -1).map((scene, index) => <div className="audio-cut-row" key={index}>
          <label htmlFor={`cut-${index}`}>Kết thúc cảnh {index + 1}<span>{scene.text}</span></label>
          <div className="editor-actions">
            <input id={`cut-${index}`} type="number" min="0.01" max={audio.duration} step="0.01" value={cuts[index]?.trim() ?? ''} placeholder={estimates[index]} onChange={event => setCut(index, event.target.value)} />
            <span>giây</span>
            <IconButton label={`Lấy vị trí đang nghe cho cảnh ${index + 1}`} disabled={audioError || audioPosition <= 0 || audioPosition >= audio.duration} onClick={() => setCut(index, (player.current?.currentTime || 0).toFixed(2))}><Scissors size={17} /></IconButton>
          </div>
        </div>)}
        {cuts.length !== scenes.length - 1 && <p role="alert">Số cảnh đã thay đổi. Hãy kiểm tra lại các mốc kết thúc.</p>}
      </div> : <p className="editor-help">Tự chia audio cho {scenes.length} cảnh theo độ dài lời thoại. Bật tùy chỉnh nếu bạn muốn chuyển ảnh đúng lúc kết thúc câu.</p>}
    </> : <p className="editor-help">Toàn bộ audio dùng cho một cảnh. Tách kịch bản bằng dòng trống nếu cần nhiều cảnh.</p>}
  </div>;
}
