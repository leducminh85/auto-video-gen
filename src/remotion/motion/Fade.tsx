import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface FadeProps {
  startFrame?: number;
  duration?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  type?: 'in' | 'out';
}

export const Fade: React.FC<FadeProps> = ({
  startFrame = 0,
  duration = 10,
  children,
  style = {},
  type = 'in',
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [startFrame, startFrame + duration],
    type === 'in' ? [0, 1] : [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return <div style={{ opacity, ...style }}>{children}</div>;
};
