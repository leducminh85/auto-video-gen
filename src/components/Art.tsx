import {ReactNode} from 'react';
import {popIn, getSteamPath} from '../lib/motion';
import styles from './Stage.module.css';

export const C = {ink: '#111827', blue: '#2563EB', green: '#22C55E', red: '#EF4444', gold: '#FFD700'};

export const Stage = ({children}: {children: ReactNode}) => <svg className={styles.stage} viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="metal"><stop stopColor="#94A3B8"/><stop offset=".48" stopColor="#4A5568"/><stop offset="1" stopColor="#2D3748"/></linearGradient>
    <linearGradient id="silver"><stop stopColor="#475569"/><stop offset=".4" stopColor="#F1F5F9"/><stop offset=".6" stopColor="#94A3B8"/><stop offset="1" stopColor="#334155"/></linearGradient>
    <linearGradient id="wood" x2="0.8" y2="1"><stop stopColor="#8C6650"/><stop offset="1" stopColor="#6D4C41"/></linearGradient>
    <linearGradient id="screen" x2="1" y2="1"><stop stopColor="#133E34"/><stop offset="1" stopColor="#050E13"/></linearGradient>
    <linearGradient id="hoodie" x2="1" y2="1"><stop stopColor="#60A5FA"/><stop offset=".4" stopColor="#2563EB"/><stop offset="1" stopColor="#163EA6"/></linearGradient>
    <linearGradient id="title" x2="0" y2="1"><stop stopColor="#FFF3A3"/><stop offset=".45" stopColor="#FFBB39"/><stop offset="1" stopColor="#F97316"/></linearGradient>
    <radialGradient id="warm" cx=".9" cy=".05" r="1"><stop stopColor="#FDE047" stopOpacity=".12"/><stop offset="1" stopColor="#FDE047" stopOpacity="0"/></radialGradient>
    <radialGradient id="dark"><stop stopColor="#22203D"/><stop offset="1" stopColor="#0B0F19"/></radialGradient>
    <radialGradient id="vignette"><stop offset=".45" stopColor="#000" stopOpacity="0"/><stop offset="1" stopColor="#000" stopOpacity=".35"/></radialGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="220%"><feDropShadow dx="0" dy="18" stdDeviation="18" floodOpacity=".35"/></filter>
    <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="9"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="soft" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="depth"><feGaussianBlur stdDeviation="3"/></filter>
    <pattern id="hazard" width="64" height="64" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="64" height="64" fill="#E9B93E"/><rect width="32" height="64" fill="#111827"/></pattern>
  </defs>
  {children}
  <rect width="1920" height="1080" fill="url(#vignette)" pointerEvents="none"/>
</svg>;

export const Label = ({x = 100, y = 100, children, fill = '#E2E8F0', size = 22, anchor = 'start'}:
  {x?: number; y?: number; children: ReactNode; fill?: string; size?: number; anchor?: 'start'|'middle'|'end'}) =>
  <text x={x} y={y} fill={fill} fontSize={size} letterSpacing="4" fontWeight="700" textAnchor={anchor}>{children}</text>;

export const Steam = ({frame, x, y}: {frame: number; x: number; y: number}) => <g transform={`translate(${x} ${y})`}>
  {Array.from({length: 6}, (_, i) => {const p = getSteamPath(frame, i); return <path key={i}
    d="M -7 0 C -27 -20 25 -29 2 -50" fill="none" stroke="#FFF8E7" strokeWidth="7" strokeLinecap="round"
    opacity={p.opacity} transform={`translate(${p.x} ${p.y}) scale(${p.scale})`} filter="url(#soft)"/>;})}
</g>;

export const Signal = ({frame = 100, fps = 60, delay = 0, x = 0, y = 0, size = 1}: {frame?: number; fps?: number; delay?: number; x?: number; y?: number; size?: number}) =>
  <g transform={`translate(${x} ${y}) scale(${size})`} fill={C.green} filter="url(#glow)">
    {[25, 42, 60, 80, 102].map((h, i) => <rect key={i} x={i * 30} y={-h * popIn(frame, fps, delay + i * 5)} width="20" height={Math.max(0, h * popIn(frame, fps, delay + i * 5))} rx="5"/>)}
  </g>;

export const Phone = ({children, x = 0, y = 0, scale = 1, rotation = 0}: {children?: ReactNode; x?: number; y?: number; scale?: number; rotation?: number}) =>
  <g transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}>
    <rect x="-154" y="-284" width="308" height="568" rx="43" fill="#64748B" filter="url(#shadow)"/>
    <rect x="-150" y="-280" width="300" height="560" rx="40" fill="#080D16" stroke="#CBD5E1" strokeOpacity=".4" strokeWidth="2"/>
    <rect x="-136" y="-263" width="272" height="526" rx="28" fill="url(#screen)"/>
    {children}
    <rect x="-44" y="-251" width="88" height="15" rx="8" fill="#020617"/>
    <rect x="-40" y="243" width="80" height="4" rx="2" fill="#94A3B8"/>
    <path d="M-146 -210V-130M154 -180V-80" stroke="#A8B4C4" strokeWidth="5"/>
  </g>;

export {Stickman} from './Character';
