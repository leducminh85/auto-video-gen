import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { SceneData } from '../../types/scenes';
import { colors } from '../utils/colors';
import { Slide } from '../motion/Slide';
import { Punch } from '../motion/Punch';
import { CountUp } from '../motion/CountUp';
import { MemberIcon } from '../components/VisualObjects';

interface NumberSceneProps {
  scene: SceneData;
}

export const NumberScene: React.FC<NumberSceneProps> = ({ scene }) => {
  const frame = useCurrentFrame();

  // Extract numerical target from metric or percentage
  const metricStr = scene.metric || scene.percentage || scene.main_text || '100%';
  const numMatch = metricStr.match(/\d+(?:[.,]\d+)?/);
  const targetNum = numMatch ? parseFloat(numMatch[0].replace(',', '.')) : 100;
  const isPercent = metricStr.includes('%') || (scene.percentage !== undefined && scene.percentage !== null);
  const isCurrency = metricStr.includes('$') || /usd|đ|tỷ|triệu/i.test(metricStr);

  const prefix = metricStr.includes('$') ? '$' : '';
  const suffix = isPercent ? '%' : metricStr.replace(/[0-9.,$]/g, '').trim();

  // Grid fade transition around frame 20
  const showGrid = scene.visual_type === 'icon_grid' || /hội viên|người|member|crowd/i.test(scene.text);
  const gridActiveCount = Math.round(targetNum <= 100 ? (targetNum / 100) * 40 : 12);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 80px',
        boxSizing: 'border-box',
      }}
    >
      {/* Category Header */}
      <Slide startFrame={4} direction="up" distance={20}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: colors.textSecondary,
            letterSpacing: 2.5,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          {scene.title}
        </div>
      </Slide>

      {/* Hero Number Counter */}
      <Punch triggerFrame={10} maxScale={1.08}>
        <div
          style={{
            fontSize: 100,
            fontWeight: 900,
            color: colors.redDark,
            letterSpacing: -2,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
          }}
        >
          <CountUp
            startFrame={8}
            durationFrames={25}
            from={0}
            to={targetNum}
            prefix={prefix}
            suffix={suffix ? ` ${suffix}` : ''}
          />
        </div>
      </Punch>

      <Slide startFrame={14} direction="up" distance={15}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: colors.text,
            marginTop: 16,
            textTransform: 'uppercase',
            letterSpacing: 1,
            textAlign: 'center',
          }}
        >
          {scene.main_text || scene.subject || 'THỰC TẾ ĐÁNG CHÚ Ý'}
        </div>
      </Slide>

      {/* Optional Member / Icon Grid */}
      {showGrid && (
        <Slide startFrame={18} direction="up" distance={25}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(20, 1fr)',
              gap: 8,
              marginTop: 32,
              padding: '20px 28px',
              background: '#FFFFFF',
              borderRadius: 20,
              border: `2px solid ${colors.border}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            }}
          >
            {Array.from({ length: 40 }).map((_, i) => {
              const isActive = i < gridActiveCount;
              const fadeProgress = interpolate(frame, [22, 38], [1, isActive ? 1 : 0.2], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return (
                <MemberIcon
                  key={i}
                  size={26}
                  color={isActive ? colors.blue : '#94A3B8'}
                  opacity={fadeProgress}
                />
              );
            })}
          </div>
        </Slide>
      )}

      {/* Bottom Takeaway Badge */}
      <Slide startFrame={24} direction="up" distance={20}>
        <div
          style={{
            marginTop: 30,
            padding: '12px 32px',
            borderRadius: 30,
            background: colors.redBg,
            border: `2px solid ${colors.red}`,
            color: colors.redDark,
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {scene.sub_text || scene.visual_description || 'CON SỐ BIẾT NÓI'}
        </div>
      </Slide>
    </div>
  );
};
