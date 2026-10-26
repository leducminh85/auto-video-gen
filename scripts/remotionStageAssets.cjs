const {MOTION_FIELDS}=require('./remotionSchema.cjs');
function staticSet(layer) {
 if(!layer||!['g','rect','circle','ellipse','line','path','polygon','polyline'].includes(layer.type))return false;
 if(layer.enter>0||layer.exit<1||layer.animate||layer.attachment)return false;
 if(MOTION_FIELDS.some(key=>layer[key]!==undefined&&typeof layer[key]!=='number'))return false;
 return !layer.children||layer.children.every(staticSet);
}
function extractSet(shot) {
 const layer=shot.layers.find(l=>l.id==='set');
 return layer&&staticSet(layer)?{background:shot.background,layer:structuredClone(layer)}:null;
}
function applySet(shot,set) {
 if(!set)return shot;
 return {...shot,background:set.background,layers:[structuredClone(set.layer),...shot.layers.filter(l=>l.id!=='set')]};
}
function summarizeSet(set) {
 const landmarks=[];
 function visit(l) {if(landmarks.length>=18)return;landmarks.push({id:l.id,type:l.type,x:l.x,y:l.y,scale:l.scale,attrs:l.attrs});l.children?.forEach(visit);}
 visit(set.layer);return {background:set.background,landmarks};
}
module.exports={extractSet,applySet,summarizeSet,staticSet};
