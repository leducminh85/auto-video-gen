import React from 'react';
import { SceneData } from '../../types/scenes';
import { colors } from '../utils/colors';
import { Slide } from '../motion/Slide';
import { ScaleIn } from '../motion/ScaleIn';
import { CreditCard, MoneyBill, PadlockIcon, ScaleBalanceIcon } from '../components/VisualObjects';

interface ObjectMetaphorSceneProps {
  scene: SceneData;
}

export const ObjectMetaphorScene: React.FC<ObjectMetaphorSceneProps> = ({ scene }) => {
  const text = `${scene.text || ''} ${scene.visual_description || ''} ${scene.main_text || ''}`.toLowerCase();

  const isCard = /thẻ|thuê bao|subscription|tự động|trừ tiền|recurring/i.test(text);
  const isLock = /khóa|rào cản|hủy|khó khăn|bẫy|not easy|padlock/i.test(text);
  const isScale = /cân bằng|đánh đổi|so sánh|lợi nhuận|chi phí/i.test(text);

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

      {/* Main Metaphor Visual */}
      <ScaleIn startFrame={8} initialScale={0.75}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 40,
            background: '#FFFFFF',
            padding: '40px 60px',
            borderRadius: 28,
            border: `3px solid ${colors.border}`,
            boxShadow: '0 20px 48px rgba(0,0,0,0.1)',
          }}
        >
          {isLock ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <PadlockIcon size={110} color={colors.redDark} />
              <div style={{ fontSize: 32, fontWeight: 900, color: colors.redDark, letterSpacing: 1 }}>
                RÀO CẢN BẢO VỆ
              </div>
            </div>
          ) : isScale ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <ScaleBalanceIcon size={120} />
              <div style={{ fontSize: 28, fontWeight: 900, color: colors.text }}>
                CÂN BẰNG LỢI ÍCH
              </div>
            </div>
          ) : isCard ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
              <CreditCard label="AUTO-RENEW CLUB" amount={scene.metric || '$49 / THÁNG'} theme="green" />
              <MoneyBill amount="+100%" category="LỢI NHUẬN RÒNG" width={220} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
              <CreditCard label={scene.subject || 'DÒNG TIỀN'} amount={scene.metric || 'DOANH THU'} theme="blue" />
              <MoneyBill amount={scene.metric || 'TỐI ƯU'} category="HIỆU QUẢ" width={220} />
            </div>
          )}
        </div>
      </ScaleIn>

      {/* Bottom Punchline */}
      <Slide startFrame={18} direction="up" distance={25}>
        <div
          style={{
            marginTop: 40,
            padding: '16px 44px',
            borderRadius: 30,
            background: colors.text,
            color: '#FFFFFF',
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: 1,
            textTransform: 'uppercase',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          {scene.main_text || 'BẢN CHẤT LỢI NHUẬN VẬN HÀNH'}
        </div>
      </Slide>
    </div>
  );
};
