import React from 'react';
import { SceneData } from '../../types/scenes';
import { colors } from '../utils/colors';
import { Slide } from '../motion/Slide';
import { Fade } from '../motion/Fade';

interface DiagramSceneProps {
  scene: SceneData;
}

export const DiagramScene: React.FC<DiagramSceneProps> = ({ scene }) => {
  const rawObjects = scene.objects && scene.objects.length > 0
    ? scene.objects
    : ['Đầu Vào', 'Quy Trình Xử Lý', 'Kết Quả'];

  const nodes = rawObjects.slice(0, 3).map((obj, i) => {
    return {
      step: `BƯỚC ${i + 1}`,
      title: obj.toUpperCase(),
      color: i === 0 ? colors.blue : i === 1 ? colors.yellowDark : colors.greenDark,
      bg: i === 0 ? colors.blueBg : i === 1 ? colors.yellowBg : colors.greenBg,
    };
  });

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
            marginBottom: 36,
          }}
        >
          {scene.title}
        </div>
      </Slide>

      {/* Connected Diagram Flow */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          width: '100%',
          maxWidth: 1200,
        }}
      >
        {nodes.map((node, index) => {
          const start = 8 + index * 10;
          return (
            <React.Fragment key={index}>
              <Slide startFrame={start} direction="up" distance={30}>
                <div
                  style={{
                    background: '#FFFFFF',
                    border: `3px solid ${colors.border}`,
                    borderRadius: 20,
                    padding: '32px 36px',
                    width: 260,
                    textAlign: 'center',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.06)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: node.color,
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {node.step}
                  </div>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 900,
                      color: colors.text,
                      marginTop: 10,
                      letterSpacing: -0.5,
                    }}
                  >
                    {node.title}
                  </div>
                </div>
              </Slide>

              {index < nodes.length - 1 && (
                <Fade startFrame={start + 5} duration={8}>
                  <div
                    style={{
                      fontSize: 40,
                      fontWeight: 900,
                      color: colors.blue,
                    }}
                  >
                    ➔
                  </div>
                </Fade>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Main explanation takeaway */}
      <Slide startFrame={32} direction="up" distance={20}>
        <div
          style={{
            marginTop: 48,
            padding: '16px 40px',
            borderRadius: 20,
            background: colors.blueBg,
            border: `2px solid ${colors.blue}`,
            color: colors.blueDark,
            fontSize: 22,
            fontWeight: 800,
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          {scene.main_text || scene.visual_description || 'MÔ HÌNH VẬN HÀNH BẢN CHẤT'}
        </div>
      </Slide>
    </div>
  );
};
