import React from 'react';
import { useCurrentFrame } from 'remotion';
import { colors } from '../utils/colors';

export type PersonPose =
  | 'idle'
  | 'thinking'
  | 'pointing'
  | 'shocked'
  | 'countingMoney'
  | 'excited'
  | 'walking';

interface PersonProps {
  pose?: PersonPose;
  size?: number;
  flip?: boolean;
  shirtColor?: string;
  style?: React.CSSProperties;
}

export const Person: React.FC<PersonProps> = ({
  pose = 'idle',
  size = 320,
  flip = false,
  shirtColor = colors.blue,
  style = {},
}) => {
  const frame = useCurrentFrame();

  const breath = Math.sin(frame * 0.04) * 1.0;
  const blink = frame % 110 > 105;

  return (
    <div
      style={{
        width: size,
        height: size * 1.4,
        position: 'relative',
        transform: `${flip ? 'scaleX(-1)' : 'none'} translateY(${breath}px)`,
        pointerEvents: 'none',
        display: 'inline-block',
        ...style,
      }}
    >
      <svg
        viewBox="0 0 200 280"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        {/* Ground shadow */}
        <ellipse cx="100" cy="270" rx="48" ry="9" fill="rgba(0,0,0,0.08)" />

        {/* Legs & Shoes */}
        {pose === 'walking' ? (
          <>
            <line x1="85" y1="180" x2="65" y2="255" stroke="#1E293B" strokeWidth="12" strokeLinecap="round" />
            <line x1="115" y1="180" x2="135" y2="255" stroke="#1E293B" strokeWidth="12" strokeLinecap="round" />
            <ellipse cx="60" cy="260" rx="14" ry="7" fill="#0F172A" />
            <ellipse cx="140" cy="260" rx="14" ry="7" fill="#0F172A" />
          </>
        ) : (
          <>
            <line x1="85" y1="180" x2="85" y2="255" stroke="#1E293B" strokeWidth="12" strokeLinecap="round" />
            <line x1="115" y1="180" x2="115" y2="255" stroke="#1E293B" strokeWidth="12" strokeLinecap="round" />
            <ellipse cx="80" cy="260" rx="14" ry="7" fill="#0F172A" />
            <ellipse cx="120" cy="260" rx="14" ry="7" fill="#0F172A" />
          </>
        )}

        {/* Torso & Shirt */}
        <rect
          x="70"
          y="100"
          width="60"
          height="85"
          rx="12"
          fill={shirtColor}
          stroke={colors.border}
          strokeWidth="3.5"
        />

        {/* Arms according to Pose */}
        {pose === 'idle' && (
          <g stroke={colors.border} strokeWidth="8" strokeLinecap="round">
            <line x1="72" y1="115" x2="60" y2="175" />
            <line x1="128" y1="115" x2="140" y2="175" />
          </g>
        )}

        {pose === 'thinking' && (
          <g stroke={colors.border} strokeWidth="8" strokeLinecap="round">
            <path d="M 72 115 L 55 155 L 85 155" fill="none" />
            <path d="M 128 115 L 140 140 L 115 88" fill="none" />
          </g>
        )}

        {pose === 'pointing' && (
          <g stroke={colors.border} strokeWidth="8" strokeLinecap="round">
            <line x1="72" y1="115" x2="60" y2="175" />
            <line x1="128" y1="115" x2="185" y2="105" />
          </g>
        )}

        {pose === 'shocked' && (
          <g stroke={colors.border} strokeWidth="8" strokeLinecap="round">
            <path d="M 72 115 L 45 85 L 75 60" fill="none" />
            <path d="M 128 115 L 155 85 L 125 60" fill="none" />
          </g>
        )}

        {pose === 'countingMoney' && (
          <g stroke={colors.border} strokeWidth="8" strokeLinecap="round">
            <path d="M 72 115 L 85 145 L 98 135" fill="none" />
            <path d="M 128 115 L 115 145 L 102 135" fill="none" />
            <rect x="90" y="125" width="20" height="12" rx="2" fill={colors.green} stroke={colors.border} strokeWidth="2" />
          </g>
        )}

        {pose === 'excited' && (
          <g stroke={colors.border} strokeWidth="8" strokeLinecap="round">
            <path d="M 72 115 L 45 75" fill="none" />
            <path d="M 128 115 L 155 75" fill="none" />
          </g>
        )}

        {pose === 'walking' && (
          <g stroke={colors.border} strokeWidth="8" strokeLinecap="round">
            <line x1="72" y1="115" x2="55" y2="165" />
            <line x1="128" y1="115" x2="145" y2="165" />
            {/* Briefcase */}
            <rect x="140" y="160" width="30" height="24" rx="4" fill="#0F172A" stroke={colors.border} strokeWidth="2" />
          </g>
        )}

        {/* Head & Neck */}
        <rect x="92" y="85" width="16" height="18" fill="#FCD34D" stroke={colors.border} strokeWidth="3" />
        <circle
          cx="100"
          cy="62"
          r="28"
          fill="#FDE68A"
          stroke={colors.border}
          strokeWidth="3.5"
        />

        {/* Hair */}
        <path
          d="M 74 62 Q 74 34 100 34 Q 126 34 126 62 Q 115 48 100 48 Q 85 48 74 62"
          fill="#1E293B"
          stroke={colors.border}
          strokeWidth="2"
        />

        {/* Eyes (with blink) */}
        {!blink ? (
          <g fill="#1E293B">
            <circle cx="92" cy="62" r="3" />
            <circle cx="108" cy="62" r="3" />
          </g>
        ) : (
          <g stroke="#1E293B" strokeWidth="2" strokeLinecap="round">
            <line x1="89" y1="62" x2="95" y2="62" />
            <line x1="105" y1="62" x2="111" y2="62" />
          </g>
        )}

        {/* Mouth */}
        {pose === 'shocked' ? (
          <ellipse cx="100" cy="74" rx="5" ry="6" fill="#1E293B" />
        ) : pose === 'excited' ? (
          <path d="M 92 72 Q 100 82 108 72 Z" fill="#1E293B" />
        ) : (
          <path d="M 94 73 Q 100 78 106 73" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
};
