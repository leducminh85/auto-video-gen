import {Easing, interpolate, spring} from 'remotion';

export const smoothCamera = (frame: number, start: number, end: number, from: number, to: number) =>
  interpolate(frame, [start, end], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.25, 0.1, 0.25, 1)});

export const easeOut = (frame: number, start: number, end: number, from = 0, to = 1) =>
  interpolate(frame, [start, end], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});

export const popIn = (frame: number, fps: number, delay = 0, damping = 12) =>
  spring({frame: Math.max(0, frame - delay), fps, config: {damping, mass: 0.5, stiffness: 140}});

// Periodic motion is analytic and deterministic: no timers or Math.random().
export const getSteamPath = (frame: number, index: number) => {
  const phase = ((frame * 0.6 + index * 19) % 100) / 100;
  const progress = Easing.out(Easing.cubic)(phase);
  return {x: Math.sin(phase * Math.PI * 3 + index) * 10, y: -progress * 110,
    opacity: Math.sin(phase * Math.PI) * 0.45, scale: 0.5 + progress * 0.8};
};
