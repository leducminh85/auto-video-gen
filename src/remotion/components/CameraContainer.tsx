import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CameraPreset } from '../../types/scenes';

interface CameraContainerProps {
  camera?: CameraPreset;
  durationInFrames: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const CameraContainer: React.FC<CameraContainerProps> = ({
  camera = 'static',
  durationInFrames,
  children,
  style = {},
}) => {
  const frame = useCurrentFrame();

  let scale = 1.0;
  let translateX = 0;
  let translateY = 0;

  if (camera === 'slow_push') {
    scale = interpolate(frame, [0, durationInFrames], [1.0, 1.02], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (camera === 'slow_pan') {
    translateX = interpolate(frame, [0, durationInFrames], [0, -12], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (camera === 'punch_in') {
    scale = interpolate(frame, [0, 8, 16], [1.0, 1.03, 1.015], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
        transformOrigin: 'center center',
        transition: 'transform 0.05s linear',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
