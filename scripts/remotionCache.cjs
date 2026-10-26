const {validateShot} = require('./remotionSchema.cjs');

function restoreShot(input) {
  const shot = structuredClone(input);
  function compact(layers) {
    if (!Array.isArray(layers)) return layers;
    return layers.filter(layer => layer !== null).map(layer => {
      if (layer && Array.isArray(layer.children)) layer.children = compact(layer.children);
      return layer;
    });
  }
  if (shot) shot.layers = compact(shot.layers);
  return validateShot(shot);
}

module.exports = {restoreShot};
