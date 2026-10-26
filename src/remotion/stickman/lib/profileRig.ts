import {solveLimb, type Point} from './rig';

const STEP = 70;
export function profileFoot(distance: number, offset: number): Point {
  const phase = ((distance / (STEP * 2) + offset) % 1 + 1) % 1;
  if (phase < .5) return {x: STEP / 2 - phase * STEP * 2, y: 440};
  const t = (phase - .5) * 2;
  return {x: -STEP / 2 + STEP * t * t * (3 - 2 * t), y: 440 - 24 * Math.sin(Math.PI * t) ** 2};
}

export function profilePose(distance: number, walking: boolean, leftTarget?: Point, rightTarget?: Point) {
  const leftFoot = walking ? profileFoot(distance, .5) : {x: -18, y: 440};
  const rightFoot = walking ? profileFoot(distance, 0) : {x: 18, y: 440};
  // The supporting leg determines pelvis height; the other knee bends to clear the floor.
  const supports = [leftFoot, rightFoot].filter(foot => foot.y >= 439.999);
  const hipY = Math.max(...supports.map(foot => 440 - Math.sqrt(190 ** 2 - foot.x ** 2))) + .4;
  const bodyY = hipY - 250;
  const swing = walking ? Math.sin(distance / 140 * Math.PI * 2) * 20 : 0;
  const leftArm = solveLimb({x: -10, y: 108 + bodyY}, leftTarget ?? {x: -12 + swing, y: 265 + bodyY}, 82, 78, 1);
  const rightArm = solveLimb({x: 14, y: 108 + bodyY}, rightTarget ?? {x: 15 - swing, y: 265 + bodyY}, 82, 78, 1);
  return {bodyY, leftArm, rightArm,
    leftLeg: solveLimb({x: 0, y: hipY}, leftFoot, 95, 95, -1),
    rightLeg: solveLimb({x: 0, y: hipY}, rightFoot, 95, 95, -1)};
}
