import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { springPresets } from '../utils/timing';

interface ScaleInProps {
  startFrame?: number;
  initialScale?: number;
  targetScale?: number;
  useSpring?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const ScaleIn: React.FC<ScaleInProps> = ({
  startFrame = 0,
  initialScale = 0.8,
  targetScale = 1.0,
  useSpring = true,
  children,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - startFrame);

  let scale = initialScale;
  let opacity = 0;

  if (frame >= startFrame) {
    if (useSpring) {
      const springVal = spring({
        frame: adjustedFrame,
        fps,
        config: springPresets.snappy,
      });
      scale = interpolate(springVal, [0, 1], [initialScale, targetScale]);
      opacity = interpolate(springVal, [0, 0.4], [0, 1], {
        extrapolateRight: 'clamp',
      });
    } else {
      scale = interpolate(adjustedFrame, [0, 12], [initialScale, targetScale], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      opacity = interpolate(adjustedFrame, [0, 6], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
  }

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        opacity,
        transformOrigin: 'center center',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
