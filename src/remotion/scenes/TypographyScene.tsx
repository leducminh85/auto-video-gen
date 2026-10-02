import React from 'react';
import { SceneData } from '../../types/scenes';
import { colors } from '../utils/colors';
import { Slide } from '../motion/Slide';
import { Punch } from '../motion/Punch';
import { ScaleIn } from '../motion/ScaleIn';

interface TypographySceneProps {
  scene: SceneData;
}

export const TypographyScene: React.FC<TypographySceneProps> = ({ scene }) => {
  const mainPunch = scene.main_text || scene.title.toUpperCase();
  const subPunch = scene.sub_text || scene.visual_description || 'QUY TẮC CỐT LÕI ĐỂ THÀNH CÔNG';
  const stamp = (scene.features?.comicTitle || scene.subject || 'CHỦ ĐỘNG').toUpperCase();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 100px',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Top Pre-header */}
      <Slide startFrame={4} direction="up" distance={25}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: colors.textSecondary,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          {scene.title}
        </div>
      </Slide>

      {/* Main Punch Statement */}
      <Punch triggerFrame={10} maxScale={1.06}>
        <div
          style={{
            fontSize: 76,
            fontWeight: 900,
            lineHeight: 1.15,
            color: colors.text,
            textAlign: 'center',
            maxWidth: 1300,
            letterSpacing: -1.5,
          }}
        >
          {mainPunch}
        </div>
      </Punch>

      {/* Dynamic Sub-Punch Pill */}
      <Slide startFrame={18} direction="up" distance={30}>
        <div
          style={{
            marginTop: 40,
            padding: '18px 48px',
            borderRadius: 20,
            background: colors.greenBg,
            border: `3px solid ${colors.greenDark}`,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span style={{ fontSize: 32 }}>💡</span>
          <span
            style={{
              fontSize: 34,
              fontWeight: 900,
              color: colors.greenDark,
              letterSpacing: 0.5,
            }}
          >
            {subPunch}
          </span>
        </div>
      </Slide>

      {/* Rotated Stamp Badge */}
      <ScaleIn startFrame={24} initialScale={1.4} style={{ position: 'absolute', bottom: 50, right: 80 }}>
        <div
          style={{
            padding: '10px 32px',
            borderRadius: 12,
            border: `4px solid ${colors.redDark}`,
            color: colors.redDark,
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: 3,
            textTransform: 'uppercase',
            transform: 'rotate(-8deg)',
            background: 'rgba(239, 68, 68, 0.08)',
          }}
        >
          {stamp}
        </div>
      </ScaleIn>
    </div>
  );
};
