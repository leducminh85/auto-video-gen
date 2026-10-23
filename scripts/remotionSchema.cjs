const TYPES = ['g', 'rect', 'circle', 'ellipse', 'path', 'line', 'text', 'character', 'steam', 'signal', 'phone', 'kitchen', 'mug'];
const ATTRS = ['x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'd', 'fill', 'stroke', 'strokeWidth', 'strokeDasharray', 'strokeDashoffset', 'opacity', 'fillOpacity', 'strokeOpacity', 'fontSize', 'fontWeight', 'textAnchor', 'letterSpacing', 'filter'];
const EMOTIONS = ['calm', 'confident', 'pleased', 'annoyed', 'surprised', 'talking'];
const ENUM_ATTRS = { strokeLinecap: ['butt','round','square'], strokeLinejoin: ['miter','round','bevel'], fillRule: ['nonzero','evenodd'], clipRule: ['nonzero','evenodd'], dominantBaseline: ['auto','alphabetic','middle','central','hanging','text-before-edge','text-after-edge'], alignmentBaseline: ['auto','baseline','middle','central','hanging','before-edge','after-edge','text-before-edge','text-after-edge'], textAnchor: ['start','middle','end'] };
ATTRS.push(...Object.keys(ENUM_ATTRS).filter(key => !ATTRS.includes(key)), 'strokeMiterlimit', 'pathLength');
const MOTION_FIELDS = ['x', 'y', 'scale', 'rotation', 'opacity', 'raised', 'look', 'leftHandX', 'leftHandY', 'rightHandX', 'rightHandY', 'headTilt', 'seated', 'stride', 'speech', 'blur', 'flow'];
const ANIMATE_ATTRS = ['x','y','x1','y1','x2','y2','cx','cy','r','rx','ry','width','height','strokeDashoffset','opacity'];
const BOOLEAN_FIELDS = ['hero','scarf','phone','talking','walking','leak'];
const DEFS = ['metal', 'silver', 'wood', 'screen', 'hoodie', 'title', 'warm', 'dark', 'vignette', 'shadow', 'glow', 'soft', 'depth', 'hazard'];
function fail(message) { throw new Error(`Thiết kế Remotion không hợp lệ: ${message}`); }
function number(value, min = -10000, max = 10000) {
  if (!Number.isFinite(value) || value < min || value > max) fail('giá trị số vượt giới hạn.');
  return value;
}
function motion(value) {
  if (typeof value === 'number') return number(value);
  if (!value || typeof value !== 'object') fail('chuyển động cần from/to.');
  if (Array.isArray(value.keys)) {
    if (value.keys.length < 2 || value.keys.length > 32) fail('keyframes require 2..32 keys');
    let previous = -1;
    return { keys: value.keys.map(key => {
      const at = number(key.at, 0, 1);
      if (at <= previous) fail('keyframes must be strictly ordered');
      previous = at;
      const ease = key.ease || 'smooth';
      if (!['linear', 'smooth', 'hold'].includes(ease)) fail('invalid easing');
      return { at, value: number(key.value), ease };
    }) };
  }
  const start = number(value.start ?? 0, 0, 1), end = number(value.end ?? 1, 0, 1);
  if (end <= start) fail('end phải lớn hơn start.');
  return { from: number(value.from), to: number(value.to), start, end };
}
function paint(value) {
  if (typeof value !== 'string' || !/^(#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})|none|url\(#[\w-]+\))$/i.test(value)) fail('màu hoặc hiệu ứng không được hỗ trợ.');
  if (value.startsWith('url(') && !DEFS.includes(value.slice(5, -1))) fail('hiệu ứng không tồn tại.');
  return value;
}
function validateShot(input) {
  if (!input || input.version !== 1 || input.styleId !== 'STICKMAN_500IQ_V1') fail('sai phiên bản hoặc phong cách.');
  let count = 0;
  const ids = new Set();
  function layer(item, depth = 0) {
    if (!item || ++count > 250 || depth > 8 || !TYPES.includes(item.type)) fail('loại hoặc số lớp không hợp lệ.');
    if (typeof item.id !== 'string' || !/^[\w-]{1,80}$/.test(item.id) || ids.has(item.id)) fail('ID lớp bị trùng hoặc không hợp lệ.');
    ids.add(item.id);
    const result = { id: item.id, type: item.type };
    for (const key of ['label', 'text']) if (item[key] !== undefined) {
      if (typeof item[key] !== 'string' || item[key].length > 500) fail('nội dung lớp quá dài.');
      result[key] = item[key];
    }
    for (const key of MOTION_FIELDS) if (item[key] !== undefined) result[key] = motion(item[key]);
    for (const key of ['enter', 'exit']) if (item[key] !== undefined) result[key] = number(item[key], 0, 1);
    if ((result.exit ?? 1) < (result.enter ?? 0)) fail('khoảng xuất hiện lớp không hợp lệ.');
    for (const key of BOOLEAN_FIELDS) if (item[key] !== undefined) {
      if (typeof item[key] !== 'boolean') fail(`${key} phải là boolean.`);
      result[key] = item[key];
    }
    if (item.emotion !== undefined) {
      if (!EMOTIONS.includes(item.emotion)) fail('biểu cảm không hợp lệ.');
      result.emotion = item.emotion;
    }
    result.attrs = {};
    for (const [key, value] of Object.entries(item.attrs || {})) {
      if (!ATTRS.includes(key)) fail(`thuộc tính ${key} không được hỗ trợ.`);
      if (ENUM_ATTRS[key]) {
        if (!ENUM_ATTRS[key].includes(value)) fail(`giá trị ${key} không hợp lệ.`);
        result.attrs[key] = value;
      } else if (['fill', 'stroke', 'filter'].includes(key)) result.attrs[key] = paint(value);
      else if (typeof value === 'number') result.attrs[key] = number(value);
      else if (['d', 'strokeDasharray', 'textAnchor', 'fontWeight'].includes(key) && typeof value === 'string' && value.length <= 12000 && !/[<>]/.test(value)) result.attrs[key] = value;
      else fail(`giá trị ${key} không hợp lệ.`);
    }
    if (item.attachment !== undefined) {
      if (!['leftHand', 'rightHand'].includes(item.attachment)) fail('invalid attachment');
      result.attachment = item.attachment;
    }
    if (item.animate !== undefined) {
      result.animate = {};
      for (const [key, value] of Object.entries(item.animate)) {
        if (!ANIMATE_ATTRS.includes(key)) fail('invalid animated attribute');
        result.animate[key] = motion(value);
      }
    }
    if (item.children !== undefined) {
      if (!['g', 'character'].includes(item.type) || !Array.isArray(item.children)) fail('chỉ nhóm g được có children.');
      result.children = item.children.map(child => layer(child, depth + 1));
    }
    return result;
  }
  if (!Array.isArray(input.layers) || !input.layers.length) fail('thiếu lớp hình ảnh.');
  const result = { version: 1, styleId: 'STICKMAN_500IQ_V1', direction: String(input.direction || '').slice(0, 4000), background: paint(input.background), layers: input.layers.map(item => layer(item)) };
  if (input.camera) result.camera = Object.fromEntries(['x', 'y', 'scale', 'focusX', 'focusY'].filter(key => input.camera[key] !== undefined).map(key => [key, motion(input.camera[key])]));
  return result;
}
module.exports = { validateShot, TYPES, ATTRS, EMOTIONS, DEFS, ENUM_ATTRS, MOTION_FIELDS, ANIMATE_ATTRS, BOOLEAN_FIELDS };
