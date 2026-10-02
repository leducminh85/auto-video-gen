import React from 'react';
import { SceneData } from '../../types/scenes';
import { colors } from '../utils/colors';
import { Person, PersonPose } from '../components/Person';
import { Slide } from '../motion/Slide';
import { ScaleIn } from '../motion/ScaleIn';

interface CharacterSceneProps {
  scene: SceneData;
}

export const CharacterScene: React.FC<CharacterSceneProps> = ({ scene }) => {
  // Determine pose based on scene attributes
  let pose: PersonPose = 'thinking';
  const desc = `${scene.action || ''} ${scene.visual_description || ''} ${scene.main_text || ''}`.toLowerCase();

  if (/tiền|lợi nhuận|doanh thu|lãi|bill|cash|dollar/i.test(desc)) {
    pose = 'countingMoney';
  } else if (/sốc|vỡ trận|phá sản|thảm họa|bẫy|bỏ cuộc|nản/i.test(desc)) {
    pose = 'shocked';
  } else if (/chỉ|hướng|quy tắc|bí mật|con số|nhìn/i.test(desc)) {
    pose = 'pointing';
  } else if (/bước đi|tự do|rời bỏ|thoát/i.test(desc)) {
    pose = 'walking';
  } else if (/thành công|tăng trưởng|nhân đôi|đột phá/i.test(desc)) {
    pose = 'excited';
  }

  const mainTitle = scene.main_text || scene.title;
  const subText = scene.sub_text || scene.visual_description || scene.text.substring(0, 100);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 70,
        padding: '0 100px',
        boxSizing: 'border-box',
      }}
    >
      <ScaleIn startFrame={3} initialScale={0.85}>
        <Person pose={pose} size={360} />
      </ScaleIn>

      <Slide startFrame={8} direction="left" distance={40}>
        <div
          style={{
            maxWidth: 680,
            background: '#FFFFFF',
            padding: '40px 48px',
            borderRadius: 24,
            border: `3px solid ${colors.border}`,
            boxShadow: '0 16px 36px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: colors.blueDark,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            {scene.title}
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 900,
              color: colors.text,
              marginTop: 14,
              lineHeight: 1.2,
              letterSpacing: -0.5,
            }}
          >
            {mainTitle}
          </div>
          {subText && (
            <div
              style={{
                fontSize: 20,
                color: colors.textSecondary,
                marginTop: 16,
                lineHeight: 1.45,
                fontWeight: 600,
                borderTop: `2px solid ${colors.borderSubtle}`,
                paddingTop: 16,
              }}
            >
              {subText}
            </div>
          )}
        </div>
      </Slide>
    </div>
  );
};
