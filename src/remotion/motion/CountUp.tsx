import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface CountUpProps {
  startFrame?: number;
  durationFrames?: number;
  from?: number;
  to: number;
  prefix?: string;
  suffix?: string;
  formatter?: (val: number) => string;
  style?: React.CSSProperties;
}

export const CountUp: React.FC<CountUpProps> = ({
  startFrame = 0,
  durationFrames = 18,
  from = 0,
  to,
  prefix = '',
  suffix = '',
  formatter,
  style = {},
}) => {
  const frame = useCurrentFrame();

  const currentVal = Math.round(
    interpolate(frame, [startFrame, startFrame + durationFrames], [from, to], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const formatted = formatter
    ? formatter(currentVal)
    : currentVal.toLocaleString('en-US');

  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', ...style }}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
