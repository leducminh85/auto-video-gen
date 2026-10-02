export const DEFAULT_FPS = 30;

export function secondsToFrames(seconds: number, fps: number = DEFAULT_FPS): number {
  return Math.round(seconds * fps);
}

export function framesToSeconds(frames: number, fps: number = DEFAULT_FPS): number {
  return frames / fps;
}

export const springPresets = {
  snappy: { damping: 18, mass: 0.8, stiffness: 140 },
  gentle: { damping: 22, mass: 1.0, stiffness: 100 },
  punch: { damping: 14, mass: 0.6, stiffness: 180 },
  smooth: { damping: 25, mass: 1.2, stiffness: 80 },
};

/**
 * Calculates local frame given a percentage of total duration
 */
export function getPercentFrame(totalFrames: number, percent: number): number {
  return Math.round(totalFrames * Math.min(1, Math.max(0, percent)));
}
