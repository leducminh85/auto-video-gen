import React from 'react';
import { interpolate, Easing } from 'remotion';
import type { MotionValue, RemotionShot, VectorLayer } from '../../types/remotion';
import { Stage, Steam, Signal, Phone } from './components/Art';
import { Kitchen, TeaMug } from './components/Kitchen';
import { Stickman } from './components/Character';

export function motionValue(value: MotionValue | undefined, progress: number, fallback = 0): number {
  if (value === undefined) return fallback;
  if (typeof value === 'number') return value;
  if ('keys' in value) {
    const keys = value.keys;
    if (progress <= keys[0].at) return keys[0].value;
    const index = keys.findIndex(key => key.at > progress);
    if (index < 0) return keys[keys.length - 1].value;
    const a = keys[index - 1], b = keys[index];
    if (a.ease === 'hold') return a.value;
    const t = (progress - a.at) / (b.at - a.at);
    return a.value + (b.value - a.value) * (a.ease === 'linear' ? t : t * t * (3 - 2 * t));
  }
  return interpolate(progress, [value.start ?? 0, value.end ?? 1], [value.from, value.to], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.25, .1, .25, 1),
  });
}

function Layer({ layer, progress, frame }: { layer: VectorLayer; progress: number; frame: number }) {
  if (progress < (layer.enter ?? 0) || progress > (layer.exit ?? 1)) return null;
  const v = (value: MotionValue | undefined, fallback = 0) => motionValue(value, progress, fallback);
  let content: React.ReactNode;
  const stride = layer.stride === undefined ? layer.walking ? (v(layer.x) - motionValue(layer.x, 0)) / Math.max(.1, v(layer.scale, 1)) / 42 : 0 : v(layer.stride);
  const swing = Math.sin(stride) * 25;
  const left = { x: v(layer.leftHandX, -55 - swing), y: v(layer.leftHandY, 247 - v(layer.raised) * 300) };
  const right = { x: v(layer.rightHandX, (layer.phone ? 105 : 55) + swing), y: v(layer.rightHandY, (layer.phone ? 150 : 247) - v(layer.raised) * 230) };
  if (layer.type === 'character') content = <> <Stickman x={0} y={0} hero={layer.hero} scarf={layer.scarf} phone={layer.phone ?? false}
    frame={frame} emotion={layer.emotion} talking={layer.speech === undefined ? layer.talking : v(layer.speech) > .5} walk={stride}
    raised={v(layer.raised)} look={v(layer.look)} leftHand={left} rightHand={right} seated={v(layer.seated)} headTilt={v(layer.headTilt)} />
    {layer.children?.map(child => { const hand = child.attachment === 'leftHand' ? left : child.attachment === 'rightHand' ? right : { x: 0, y: 0 }; return <g key={child.id} transform={`translate(${hand.x} ${hand.y})`}><Layer layer={child} progress={progress} frame={frame} /></g>; })}
    </>;
  else if (layer.type === 'kitchen') content = <Kitchen frame={frame} leak={layer.leak} flow={v(layer.flow, 1)} />;
  else if (layer.type === 'mug') content = <TeaMug frame={frame} x={0} y={0} />;
  else if (layer.type === 'steam') content = <Steam frame={frame} x={0} y={0} />;
  else if (layer.type === 'signal') content = <Signal frame={frame} />;
  else if (layer.type === 'phone') content = <Phone />;
  else content = React.createElement(layer.type, { ...layer.attrs, ...Object.fromEntries(Object.entries(layer.animate || {}).map(([key, value]) => [key, v(value)])) }, layer.type === 'text' ? layer.text : layer.children?.map(child => <Layer key={child.id} layer={child} progress={progress} frame={frame} />));
  return <g transform={`translate(${v(layer.x)} ${v(layer.y)}) rotate(${v(layer.rotation)}) scale(${v(layer.scale, 1)})`} opacity={v(layer.opacity, 1)} style={layer.blur ? { filter: `blur(${Math.max(0, v(layer.blur))}px)` } : undefined}>{content}</g>;
}

export function VectorShot({ shot, frame, duration, fps = 60 }: { shot: RemotionShot; frame: number; duration: number; fps?: number }) {
  const progress = Math.max(0, Math.min(1, frame / Math.max(1, duration - 1)));
  const camera = shot.camera || {};
  return <Stage>
    <rect width={1920} height={1080} fill={shot.background} />
    <g transform={`translate(${960 + motionValue(camera.x, progress)} ${540 + motionValue(camera.y, progress)}) scale(${motionValue(camera.scale, progress, 1)}) translate(${-motionValue(camera.focusX, progress, 960)} ${-motionValue(camera.focusY, progress, 540)})`} fontFamily="Arial, Helvetica, sans-serif" strokeLinecap="round" strokeLinejoin="round">
      {shot.layers.map(layer => <Layer key={layer.id} layer={layer} progress={progress} frame={frame * 60 / fps} />)}
    </g>
    <rect width={1920} height={56} fill="#000" /><rect y={1024} width={1920} height={56} fill="#000" />
  </Stage>;
}
