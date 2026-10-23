const STYLE = '2D vector explainer: round near-black heads, slim limbs, white eyes/mouth; Leo blue hoodie, companion cream scarf/glasses. Warm layered beige/wood interiors; data scenes navy with cream labels and restrained gold emphasis. Consistent proportions, soft local shadows, one focal subject, large short text readable on phones. Show cause→contact→result→reaction with pauses; continuous staging, actions unfold sequentially within one stable composition; cut only between narrative situations. No invented facts, decorative motion or floating props. Audio sets duration; word timing is approximate.';
const clip = (value, limit = 600) => typeof value === 'string' ? value.slice(0, limit) : value;
const lastValue = value => typeof value === 'object' && value ? value.keys?.at(-1)?.value ?? value.to ?? value : value;
function compactPrevious(value) {
  if (!value) return undefined;
  let data = value;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch { return clip(data, 1000); }
  }
  const shot = data.shot || data;
  return { state: clip(data.state, 1000), direction: clip(shot.direction), background: shot.background, camera: shot.camera,
    layers: shot.layers?.slice(0, 16).map(layer => ({ id:layer.id, type:layer.type, hero:layer.hero, scarf:layer.scarf, x:lastValue(layer.x), y:lastValue(layer.y), scale:lastValue(layer.scale), emotion:layer.emotion, text:clip(layer.text,100) })) };
}
function compactContext(input) {
  return { seconds:input.seconds, firstScene:input.firstScene, direction:clip(input.direction,1600), previous:compactPrevious(input.previous),
    bible: input.bible ? { premise:clip(input.bible.premise), cast:input.bible.cast?.slice(0,8).map(actor=>({id:actor.id,hero:actor.hero,scarf:actor.scarf,role:clip(actor.role,180)})), locations:input.bible.locations?.slice(0,6).map(place=>({id:place.id,description:clip(place.description,220)})), arc:clip(input.bible.arc) } : undefined,
    outline:input.outline?.slice(0,40).map(scene=>({title:clip(scene.title,120)})) };
}
function briefIssues(issues) { return (Array.isArray(issues) ? issues : []).slice(0,8).map(issue => clip(issue,450)); }
function compactBoard(board) { return { shots: board?.shots }; }
module.exports = { STYLE, compactContext, compactPrevious, briefIssues, compactBoard };
