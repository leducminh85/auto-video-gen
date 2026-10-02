import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { springPresets } from '../utils/timing';

interface SlideProps {
  startFrame?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  useSpring?: boolean;
  duration?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Slide: React.FC<SlideProps> = ({
  startFrame = 0,
  direction = 'up',
  distance = 50,
  useSpring = true,
  duration = 14,
  children,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - startFrame);

  let progress: number;
  if (useSpring) {
    progress =
      frame >= startFrame
        ? spring({
            frame: adjustedFrame,
            fps,
            config: springPresets.gentle,
          })
        : 0;
  } else {
    progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  let translateX = 0;
  let translateY = 0;

  if (direction === 'up') {
    translateY = (1 - progress) * distance;
  } else if (direction === 'down') {
    translateY = (1 - progress) * -distance;
  } else if (direction === 'left') {
    translateX = (1 - progress) * distance;
  } else if (direction === 'right') {
    translateX = (1 - progress) * -distance;
  }

  const opacity = interpolate(progress, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        transform: `translate(${translateX}px, ${translateY}px)`,
        opacity,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
