const { validateShot, ATTRS, ENUM_ATTRS, MOTION_FIELDS, ANIMATE_ATTRS, BOOLEAN_FIELDS } = require('./remotionSchema.cjs');
const colors = { black:'#000000', white:'#ffffff', red:'#ff0000', blue:'#0000ff', green:'#008000', yellow:'#ffff00', gray:'#808080', grey:'#808080', orange:'#ffa500', gold:'#ffd700', navy:'#000080', beige:'#f5f5dc', transparent:'#00000000' };
const numeric = value => typeof value === 'string' && /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?(?:px)?$/i.test(value.trim()) ? Number(value.trim().replace(/px$/i,'')) : value;
const alias = key => key.replace(/-([a-z])/g, (_,c)=>c.toUpperCase());
function paint(value) { return typeof value === 'string' ? colors[value.trim().toLowerCase()] || value.trim() : value; }
function normalizeMotion(value) {
  if (Array.isArray(value) && value.length === 2 && value.every(v=>Number.isFinite(numeric(v)))) return {from:numeric(value[0]),to:numeric(value[1])};
  if (value && typeof value === 'object' && Object.keys(value).length === 1 && 'value' in value) return numeric(value.value);
  if (!value || typeof value !== 'object') return numeric(value);
  if (Array.isArray(value.keys)) {
    const keys = value.keys.map(key => ({ ...key, at:numeric(key.at), value:numeric(key.value), ease:({easeInOut:'smooth',ease:'smooth',step:'hold'})[key.ease] || key.ease }));
    if (keys.some(key=>!Number.isFinite(key.at) || !Number.isFinite(key.value) || key.at<0 || key.at>1)) return {...value,keys};
    const unique = [...new Map(keys.map(key=>[key.at,key])).values()].sort((a,b)=>a.at-b.at);
    return unique.length === 1 ? unique[0].value : {keys:unique};
  }
  return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,numeric(v)]));
}
function normalizeShot(input, onWarning = () => {}) {
  if (!input || typeof input !== 'object') return input;
  const data = structuredClone(input);
  data.version ??= 1;
  data.styleId ??= 'STICKMAN_500IQ_V1';
  data.background = paint(data.background);
  let index = 0;
  const ids = new Set();
  function layer(item, depth = 0) {
    if (!item || typeof item !== 'object' || depth > 8 || ++index > 250) throw new Error('Thiết kế vượt giới hạn lớp vector.');
    let id = typeof item.id === 'string' ? item.id.replace(/[^\w-]/g,'-').slice(0,70) : '';
    if (!id || ids.has(id)) id = `layer-${index}`;
    while (ids.has(id)) id += '-copy';
    ids.add(id);
    const result = {...item,id,attrs:{}};
    const attrs = { ...item.attrs };
    for (const key of ATTRS) if (!MOTION_FIELDS.includes(key) && item[key] !== undefined && attrs[key] === undefined) attrs[key] = item[key];
    for (const [raw,value] of Object.entries(attrs)) {
      const key = alias(raw);
      if (/^on/i.test(key) || /href|style|dangerouslySetInnerHTML/i.test(key)) throw new Error('Thiết kế chứa thuộc tính thực thi hoặc tham chiếu ngoài.');
      if (!ATTRS.includes(key)) { onWarning(`Bỏ thuộc tính SVG không hỗ trợ: ${raw}`); continue; }
      if (['fill','stroke','filter'].includes(key)) result.attrs[key] = paint(value);
      else if (ENUM_ATTRS[key]) {
        if (ENUM_ATTRS[key].includes(value)) result.attrs[key] = value;
        else onWarning(`Bỏ giá trị không hỗ trợ của ${key}`);
      } else result.attrs[key] = ['d','textAnchor'].includes(key) ? value : numeric(value);
    }
    if (item.type === 'text' && result.text === undefined && item.attrs?.text !== undefined) result.text = String(item.attrs.text);
    for (const key of MOTION_FIELDS) if (item[key] !== undefined) {
      if (item[key] === null || item[key] === '') { delete result[key]; onWarning(`Dùng giá trị mặc định cho ${id}.${key}`); }
      else result[key] = key === 'speech' && typeof item[key] === 'boolean' ? Number(item[key]) : normalizeMotion(item[key]);
    }
    for (const key of ['enter','exit']) if (item[key] !== undefined) result[key] = numeric(item[key]);
    for (const key of BOOLEAN_FIELDS) if (item[key] === 'true' || item[key] === 'false') result[key] = item[key] === 'true';
    if (item.animate) result.animate = Object.fromEntries(Object.entries(item.animate).map(([key,v])=>[alias(key),normalizeMotion(v)]).filter(([key])=>{
      if (/^on/i.test(key) || /href/i.test(key)) throw new Error('Thiết kế chứa chuyển động không an toàn.');
      if (!ANIMATE_ATTRS.includes(key)) { onWarning(`Bỏ thuộc tính chuyển động không hỗ trợ: ${key}`); return false; }
      return true;
    }));
    if (Array.isArray(item.children)) result.children = item.children.map(child=>layer(child,depth+1));
    return result;
  }
  if (Array.isArray(data.layers)) data.layers = data.layers.map(item=>layer(item));
  if (data.camera) data.camera = Object.fromEntries(Object.entries(data.camera).filter(([,value])=>value!==null && value!=='').map(([key,value])=>[key,normalizeMotion(value)]));
  return data;
}
function prepareShot(input, onWarning) { return validateShot(normalizeShot(input,onWarning)); }
module.exports = { normalizeShot, prepareShot };
