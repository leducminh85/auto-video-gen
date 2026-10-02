import React from 'react';
import { colors } from '../utils/colors';

export interface CreditCardProps {
  label?: string;
  amount?: string;
  theme?: 'green' | 'blue' | 'red' | 'dark';
  width?: number;
  height?: number;
}

export const CreditCard: React.FC<CreditCardProps> = ({
  label = 'SUBSCRIPTION CLUB',
  amount = '$49 / MO',
  theme = 'green',
  width = 360,
  height = 210,
}) => {
  const bgColors = {
    green: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    blue: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    red: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
    dark: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
  };

  return (
    <div
      style={{
        width,
        height,
        background: bgColors[theme],
        borderRadius: 20,
        border: `3px solid ${colors.border}`,
        boxShadow: '0 16px 36px rgba(0,0,0,0.18)',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Gloss reflection overlay */}
      <div
        style={{
          position: 'absolute',
          top: -60,
          left: -40,
          width: 200,
          height: 300,
          background: 'rgba(255,255,255,0.12)',
          transform: 'rotate(25deg)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.9 }}>
          {label}
        </div>
        {/* Chip icon */}
        <div
          style={{
            width: 36,
            height: 28,
            borderRadius: 6,
            background: '#FDE047',
            border: '2px solid #CA8A04',
          }}
        />
      </div>

      <div>
        <div style={{ fontSize: 13, opacity: 0.75, letterSpacing: 2 }}>RECURRING AUTO-PAY</div>
        <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -0.5, marginTop: 4 }}>
          {amount}
        </div>
      </div>
    </div>
  );
};

export interface MoneyBillProps {
  amount?: string;
  category?: string;
  width?: number;
}

export const MoneyBill: React.FC<MoneyBillProps> = ({
  amount = '$100',
  category = 'EXPENSE',
  width = 240,
}) => {
  return (
    <div
      style={{
        width,
        height: 120,
        background: '#ECFDF5',
        border: `3px solid ${colors.border}`,
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: colors.textSecondary, textTransform: 'uppercase' }}>
        {category}
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: colors.greenDark, letterSpacing: -1 }}>
        {amount}
      </div>
    </div>
  );
};

export const MemberIcon: React.FC<{ size?: number; color?: string; opacity?: number }> = ({
  size = 40,
  color = colors.blue,
  opacity = 1,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    stroke={colors.border}
    strokeWidth="1.5"
    style={{ opacity, overflow: 'visible', transition: 'opacity 0.3s ease' }}
  >
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" fill={color} />
  </svg>
);

export const PadlockIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 70,
  color = colors.yellowDark,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colors.border} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill={color} />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    <circle cx="12" cy="16" r="1.5" fill="#1E293B" />
  </svg>
);

export const ScaleBalanceIcon: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colors.border} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="3" x2="12" y2="21" strokeWidth="2.5" />
    <line x1="4" y1="7" x2="20" y2="7" strokeWidth="2.5" />
    <polygon points="4,7 1,14 7,14" fill={colors.redBg} stroke={colors.border} />
    <polygon points="20,7 17,14 23,14" fill={colors.greenBg} stroke={colors.border} />
    <line x1="8" y1="21" x2="16" y2="21" strokeWidth="3" />
  </svg>
);

export const FlowArrow: React.FC<{ label?: string; direction?: 'right' | 'down' }> = ({
  label = '',
  direction = 'right',
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    {label && (
      <span style={{ fontSize: 13, fontWeight: 800, color: colors.textSecondary, textTransform: 'uppercase' }}>
        {label}
      </span>
    )}
    <div style={{ fontSize: 32, fontWeight: 900, color: colors.blue }}>
      {direction === 'right' ? '➔' : '⬇'}
    </div>
  </div>
);

export const BuildingFacade: React.FC<{ width?: number; height?: number; label?: string; color?: string }> = ({
  width = 380,
  height = 260,
  label = 'STORE',
  color = '#FED7AA',
}) => (
  <div
    style={{
      width,
      height,
      background: color,
      border: `4px solid ${colors.border}`,
      borderRadius: 16,
      position: 'relative',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
      boxSizing: 'border-box',
    }}
  >
    <div
      style={{
        background: '#1E293B',
        color: '#FFFFFF',
        padding: '8px 16px',
        borderRadius: 8,
        fontWeight: 900,
        fontSize: 22,
        textAlign: 'center',
        letterSpacing: 2,
      }}
    >
      {label}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: 120 }}>
      {/* Window */}
      <div style={{ width: 80, height: 80, background: '#E0F2FE', border: `3px solid ${colors.border}`, borderRadius: 8 }} />
      {/* Door */}
      <div style={{ width: 70, height: 110, background: '#94A3B8', border: `3px solid ${colors.border}`, borderTopLeftRadius: 8, borderTopRightRadius: 8 }} />
      {/* Window */}
      <div style={{ width: 80, height: 80, background: '#E0F2FE', border: `3px solid ${colors.border}`, borderRadius: 8 }} />
    </div>
  </div>
);
