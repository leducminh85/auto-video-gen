import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { SceneData } from '../../types/scenes';
import { colors } from '../utils/colors';
import { Slide } from '../motion/Slide';

interface ProcessSceneProps {
  scene: SceneData;
}

export const ProcessScene: React.FC<ProcessSceneProps> = ({ scene }) => {
  const frame = useCurrentFrame();

  const steps = (scene.objects && scene.objects.length >= 3)
    ? scene.objects.slice(0, 3)
    : ['GIAI ĐOẠN 1', 'GIAI ĐOẠN 2', 'KẾT QUẢ ĐẠT ĐƯỢC'];

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
      <Slide startFrame={4} direction="up" distance={20}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: colors.textSecondary,
            letterSpacing: 2.5,
            textTransform: 'uppercase',
            marginBottom: 44,
          }}
        >
          {scene.title}
        </div>
      </Slide>

      {/* Process Milestones Track */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 30,
          width: '100%',
          maxWidth: 1200,
        }}
      >
        {steps.map((st, i) => {
          const stepStart = 8 + i * 12;
          const isActive = frame >= stepStart;

          return (
            <React.Fragment key={i}>
              <Slide startFrame={stepStart} direction="up" distance={30}>
                <div
                  style={{
                    background: '#FFFFFF',
                    border: `3px solid ${isActive ? colors.blue : colors.borderSubtle}`,
                    borderRadius: 20,
                    padding: '30px 32px',
                    width: 250,
                    textAlign: 'center',
                    boxShadow: isActive ? '0 12px 32px rgba(37,99,235,0.12)' : 'none',
                    transform: isActive ? 'scale(1.03)' : 'scale(1.0)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: isActive ? colors.blue : '#E2E8F0',
                      color: isActive ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: 900,
                      fontSize: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px auto',
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: colors.text }}>
                    {st.toUpperCase()}
                  </div>
                </div>
              </Slide>

              {i < steps.length - 1 && (
                <div
                  style={{
                    height: 4,
                    width: 60,
                    background: frame >= stepStart + 6 ? colors.blue : '#E2E8F0',
                    transition: 'background 0.2s',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <Slide startFrame={34} direction="up" distance={20}>
        <div
          style={{
            marginTop: 44,
            padding: '16px 40px',
            borderRadius: 24,
            background: colors.greenBg,
            border: `2px solid ${colors.greenDark}`,
            color: colors.greenDark,
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          {scene.main_text || 'TIẾN TRÌNH RÕ RÀNG - KẾT QUẢ ĐO LƯỜNG ĐƯỢC'}
        </div>
      </Slide>
    </div>
  );
};
