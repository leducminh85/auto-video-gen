import React from 'react';
import { SceneData } from '../../types/scenes';
import { colors } from '../utils/colors';
import { Slide } from '../motion/Slide';
import { ScaleIn } from '../motion/ScaleIn';

interface ComparisonSceneProps {
  scene: SceneData;
}

export const ComparisonScene: React.FC<ComparisonSceneProps> = ({ scene }) => {
  // Extract left and right labels from scene objects or split text
  const objects = scene.objects || [];
  const leftTitle = objects[0] ? objects[0].toUpperCase() : 'LỰA CHỌN A';
  const rightTitle = objects[1] ? objects[1].toUpperCase() : 'LỰA CHỌN B';

  const leftSubtitle = scene.main_text || 'Cách làm thông thường';
  const rightSubtitle = scene.sub_text || 'Cách tiếp cận tối ưu';

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
            marginBottom: 32,
          }}
        >
          {scene.title}
        </div>
      </Slide>

      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
          width: '100%',
          maxWidth: 1300,
          gap: 36,
          position: 'relative',
        }}
      >
        {/* Left Option */}
        <Slide startFrame={8} direction="up" distance={30} style={{ flex: 1 }}>
          <div
            style={{
              height: '100%',
              background: '#FFFFFF',
              borderRadius: 20,
              border: `3px solid ${colors.border}`,
              padding: '36px 40px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ borderBottom: `2px solid ${colors.borderSubtle}`, paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: colors.redDark, textTransform: 'uppercase' }}>
                {leftTitle}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: colors.textSecondary, marginTop: 4 }}>
                {leftSubtitle}
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', fontSize: 20, color: colors.textSecondary, lineHeight: 1.5 }}>
              {scene.visual_description?.split(/[;.]/)[0] || 'Tốn nhiều chi phí & rủi ro cao'}
            </div>
          </div>
        </Slide>

        {/* Center VS Badge */}
        <ScaleIn startFrame={14} initialScale={0.5} style={{ alignSelf: 'center', zIndex: 10 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: colors.text,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 900,
              border: '4px solid #FFFFFF',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            }}
          >
            VS
          </div>
        </ScaleIn>

        {/* Right Option */}
        <Slide startFrame={12} direction="up" distance={30} style={{ flex: 1 }}>
          <div
            style={{
              height: '100%',
              background: '#FFFFFF',
              borderRadius: 20,
              border: `3px solid ${colors.border}`,
              padding: '36px 40px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ borderBottom: `2px solid ${colors.borderSubtle}`, paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: colors.greenDark, textTransform: 'uppercase' }}>
                {rightTitle}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: colors.textSecondary, marginTop: 4 }}>
                {rightSubtitle}
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', fontSize: 20, color: colors.greenDark, fontWeight: 700, lineHeight: 1.5 }}>
              ✓ {scene.visual_description?.split(/[;.]/)[1] || 'Tối ưu hiệu quả & dòng tiền bền vững'}
            </div>
          </div>
        </Slide>
      </div>

      {/* Bottom Summary Pill */}
      <Slide startFrame={22} direction="up" distance={20}>
        <div
          style={{
            marginTop: 36,
            padding: '12px 36px',
            borderRadius: 30,
            background: colors.yellowBg,
            border: `2px solid ${colors.yellowDark}`,
            color: colors.yellowDark,
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {scene.action || 'SỰ KHÁC BIỆT TẠO NÊN KẾT QUẢ'}
        </div>
      </Slide>
    </div>
  );
};
