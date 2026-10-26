export type Point = {x: number; y: number};

export function solveLimb(root: Point, target: Point, upper: number, lower: number, bend = 1) {
  const dx = target.x - root.x, dy = target.y - root.y;
  const raw = Math.hypot(dx, dy);
  const distance = Math.max(Math.abs(upper - lower) + .001, Math.min(upper + lower - .001, raw));
  const ux = raw > .0001 ? dx / raw : 0, uy = raw > .0001 ? dy / raw : 1;
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
  const height = Math.sqrt(Math.max(0, upper * upper - along * along));
  const joint = {x: root.x + ux * along - uy * height * bend, y: root.y + uy * along + ux * height * bend};
  const end = {x: root.x + ux * distance, y: root.y + uy * distance};
  return {joint, end, path: `M${root.x} ${root.y}L${joint.x} ${joint.y}L${end.x} ${end.y}`};
}

export const armPose = (side: number, target: Point) => solveLimb({x: side * 31, y: 108}, target, 110, 110, side);

// During stance, local foot travel exactly cancels root travel. Swing clears the floor.
export function gaitFoot(distance: number, offset: number): Point {
  const phase = ((distance / 200 + offset) % 1 + 1) % 1;
  if (phase < .5) return {x: 50 - phase * 200, y: 440};
  const t = (phase - .5) * 2;
  const s = t * t * (3 - 2 * t);
  return {x: -50 + 100 * s, y: 440 - 32 * Math.sin(Math.PI * t) ** 2};
}
