const { validateShot, MOTION_FIELDS, BOOLEAN_FIELDS } = require('./remotionSchema.cjs');
const { normalizeShot } = require('./remotionNormalize.cjs');
const base = {version:1,styleId:'STICKMAN_500IQ_V1',background:'#ffffff',layers:[{id:'probe',type:'g'}]};
function inspectShot(raw, onWarning) {
  let data, normalizationError;
  try { data = normalizeShot(raw,onWarning); } catch(error) { data = raw; normalizationError=error; }
  const issues = [];
  const check = (path, task) => { try { task(); } catch(error) { issues.push({path,message:error.message}); } };
  if (!data || typeof data !== 'object' || !Array.isArray(data.layers) || !data.layers.length) return {data,issues:[{path:'',message:'Return a complete shot object with nonempty layers.'}]};
  check('/version',()=>validateShot({...base,version:data.version}));
  check('/styleId',()=>validateShot({...base,styleId:data.styleId}));
  check('/background',()=>validateShot({...base,background:data.background}));
  for (const key of ['x','y','scale','focusX','focusY']) if (data.camera?.[key] !== undefined) check(`/camera/${key}`,()=>validateShot({...base,camera:{[key]:data.camera[key]}}));
  let count=0;
  const ids = new Set();
  function visit(item,path,depth) {
    if (++count>250 || depth>8 || !item || typeof item !== 'object') { issues.push({path,message:'Invalid layer or layer/depth limit exceeded.'}); return; }
    const probe = value => validateShot({...base,layers:[{id:'probe',type:item.type,...value}]});
    check(`${path}/type`,()=>probe({}));
    check(`${path}/id`,()=>{probe({id:item.id});if(ids.has(item.id)) throw new Error('Duplicate layer ID');});
    ids.add(item.id);
    for(const key of [...MOTION_FIELDS,...BOOLEAN_FIELDS,'label','text','emotion','attachment']) if(item[key]!==undefined) check(`${path}/${key}`,()=>probe({[key]:item[key]}));
    for(const key of ['enter','exit']) if(item[key]!==undefined) check(`${path}/${key}`,()=>probe({[key]:item[key]}));
    if((item.exit??1)<(item.enter??0)) issues.push({path:`${path}/exit`,message:'exit must be at least enter.'});
    for(const [key,value] of Object.entries(item.attrs||{})) check(`${path}/attrs/${key}`,()=>probe({attrs:{[key]:value}}));
    for(const [key,value] of Object.entries(item.animate||{})) check(`${path}/animate/${key}`,()=>probe({animate:{[key]:value}}));
    if(item.children!==undefined) {
      if(!['g','character'].includes(item.type)||!Array.isArray(item.children)) issues.push({path:`${path}/children`,message:'Only g/character may have an array of children.'});
      else item.children.forEach((child,i)=>visit(child,`${path}/children/${i}`,depth+1));
    }
  }
  data.layers.forEach((item,i)=>visit(item,`/layers/${i}`,0));
  if(!issues.length) check('',()=>validateShot(data));
  if(!issues.length && normalizationError) issues.push({path:'',message:normalizationError.message});
  return {data,issues};
}
function applyRepairs(data, issues, response) {
  if(!Array.isArray(response?.repairs)) throw new Error('Expected repairs array.');
  const allowed = new Set(issues.map(issue=>issue.path));
  const result = structuredClone(data);
  for(const repair of response.repairs) {
    if(!allowed.has(repair.path) || !repair.path) throw new Error('Repair may change only reported fields.');
    const keys=repair.path.split('/').slice(1);
    if(keys.some(key=>['__proto__','prototype','constructor'].includes(key))) throw new Error('Invalid repair path.');
    let target=result;
    for(const key of keys.slice(0,-1)) { if(!target || typeof target !== 'object') throw new Error('Invalid repair target.'); target=target[key]; }
    if(!target || typeof target !== 'object') throw new Error('Invalid repair target.');
    if(repair.remove===true) delete target[keys.at(-1)];
    else target[keys.at(-1)]=repair.value;
  }
  return result;
}
module.exports={inspectShot,applyRepairs};
