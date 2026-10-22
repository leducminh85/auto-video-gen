import type { VisualBeat } from '../types/scenes';
import { VectorShot } from '../remotion/stickman/VectorShot';

export function BeatThumbnail({ beat, className, alt = '' }: { beat: VisualBeat; className?: string; alt?: string }) {
  if (beat.remotion) return <div className={`vector-thumbnail ${className || ''}`} role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={!alt || undefined}><VectorShot shot={beat.remotion} frame={Math.floor(beat.duration_in_frames * .45)} duration={beat.duration_in_frames} /></div>;
  return <img className={className} src={`/images/${beat.image_file}?v=${beat.image_version || ''}`} alt={alt} draggable={false} />;
}
