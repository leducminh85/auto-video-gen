import React, { useEffect, useState } from 'react';

export function AudioWaveform({ file, version }: { file: string; version?: number }) {
  const [peaks, setPeaks] = useState<number[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    let context: AudioContext | undefined;
    setStatus('loading'); setPeaks([]);
    (async () => {
      try {
        const response = await fetch(`/audio/${encodeURIComponent(file)}?v=${version || ''}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Audio unavailable');
        context = new AudioContext();
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        const samples = buffer.getChannelData(0);
        const count = Math.min(600, samples.length);
        const values = Array.from({ length: count }, (_, index) => {
          const from = Math.floor(index * samples.length / count);
          const to = Math.floor((index + 1) * samples.length / count);
          let peak = 0;
          for (let i = from; i < to; i++) peak = Math.max(peak, Math.abs(samples[i]));
          return peak;
        });
        const max = Math.max(...values, 0.001);
        if (active) { setPeaks(values.map(value => value / max)); setStatus('ready'); }
      } catch { if (active) setStatus('error'); }
      finally { if (context && context.state !== 'closed') void context.close(); }
    })();
    return () => { active = false; controller.abort(); };
  }, [file, version]);
  return <div className="audio-waveform" data-status={status}>
    {status === 'ready' ? <svg role="img" aria-label="Dạng sóng của audio cảnh" viewBox={`0 0 ${peaks.length * 3} 60`} preserveAspectRatio="none"><path d={peaks.map((peak, index) => `M${index * 3 + 1},${30 - Math.max(0.5, peak * 26)}v${Math.max(1, peak * 52)}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="1.5" /></svg> : <span>{status === 'loading' ? 'Đang đọc dạng sóng audio…' : 'Không đọc được dạng sóng. Bạn vẫn có thể chỉnh ảnh và nghe audio.'}</span>}
  </div>;
}
