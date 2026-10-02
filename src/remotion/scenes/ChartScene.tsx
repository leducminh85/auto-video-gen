import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { SceneData } from '../../types/scenes';
import { colors } from '../utils/colors';
import { Slide } from '../motion/Slide';
import { ScaleIn } from '../motion/ScaleIn';
import { CountUp } from '../motion/CountUp';

interface ChartSceneProps {
  scene: SceneData;
}

export const ChartScene: React.FC<ChartSceneProps> = ({ scene }) => {
  const frame = useCurrentFrame();

  // Extract percentage or default to 70%
  const percentMatch = (scene.percentage || scene.metric || scene.main_text || '70%').match(/\d+(?:[.,]\d+)?/);
  const mainVal = percentMatch ? Math.min(100, Math.max(5, parseFloat(percentMatch[0].replace(',', '.')))) : 70;
  const remVal = 100 - mainVal;

  const chartAnimation = interpolate(frame, [8, 30], [0, mainVal], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 80,
        padding: '0 100px',
        boxSizing: 'border-box',
      }}
    >
      {/* Left: Dynamic Circular Pie / Donut Chart */}
      <ScaleIn startFrame={5} initialScale={0.8}>
        <div style={{ position: 'relative', width: 340, height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="340" height="340" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
            {/* Background ring */}
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="transparent"
              stroke="#E2E8F0"
              strokeWidth="4"
            />
            {/* Highlighted portion */}
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="transparent"
              stroke={colors.redDark}
              strokeWidth="4.5"
              strokeDasharray={`${chartAnimation} ${100 - chartAnimation}`}
              strokeLinecap="round"
            />
          </svg>

          {/* Center value */}
          <div
            style={{
              position: 'absolute',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 64, fontWeight: 900, color: colors.redDark, lineHeight: 1 }}>
              <CountUp startFrame={8} durationFrames={22} from={0} to={mainVal} suffix="%" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: colors.textSecondary, letterSpacing: 1, marginTop: 4 }}>
              TỶ TRỌNG
            </div>
          </div>
        </div>
      </ScaleIn>

      {/* Right: Key Breakdown Info */}
      <div style={{ maxWidth: 600 }}>
        <Slide startFrame={8} direction="left" distance={30}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: colors.yellowDark,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            {scene.title}
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: colors.text,
              marginTop: 10,
              lineHeight: 1.15,
              letterSpacing: -0.5,
            }}
          >
            {scene.main_text || `${mainVal}% PHẦN LỚN`}
          </div>
        </Slide>

        {/* Legend bars */}
        <Slide startFrame={18} direction="up" distance={25}>
          <div
            style={{
              marginTop: 32,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              background: '#FFFFFF',
              borderRadius: 20,
              border: `2px solid ${colors.border}`,
              padding: '24px 30px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, background: colors.redDark }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>
                  {scene.main_text || 'Nhóm Trọng Yếu'}
                </span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 900, color: colors.redDark }}>{mainVal}%</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, background: '#94A3B8' }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: colors.textSecondary }}>Phần Còn Lại</span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 900, color: colors.textSecondary }}>{remVal}%</span>
            </div>
          </div>
        </Slide>
      </div>
    </div>
  );
};
