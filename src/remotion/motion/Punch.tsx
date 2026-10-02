import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { springPresets } from '../utils/timing';

interface PunchProps {
  triggerFrame?: number;
  maxScale?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Punch: React.FC<PunchProps> = ({
  triggerFrame = 0,
  maxScale = 1.15,
  children,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let scale = 1.0;
  if (frame >= triggerFrame) {
    const adjusted = frame - triggerFrame;
    const punchSpring = spring({
      frame: adjusted,
      fps,
      config: springPresets.punch,
    });
    scale = interpolate(punchSpring, [0, 0.4, 1], [1.0, maxScale, 1.0]);
  }

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
