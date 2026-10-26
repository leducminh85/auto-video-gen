import {test} from 'node:test';
import assert from 'node:assert/strict';
import {armPose, gaitFoot} from '../src/remotion/stickman/lib/rig';

test('arms keep bone lengths and reachable hands even for invalid targets',()=>{
 for(const side of [-1,1]) for(const target of [{x:1000,y:-900},{x:side*31,y:108},{x:120,y:200},{x:-150,y:150}]) {
  const {joint,end}=armPose(side,target);
  assert.ok(Math.abs(Math.hypot(joint.x-side*31,joint.y-108)-110)<1e-6);
  assert.ok(Math.abs(Math.hypot(end.x-joint.x,end.y-joint.y)-110)<1e-6);
 }
});
test('stance foot stays fixed in world space and swing clears floor',()=>{
 for(const start of [0,200,-200]) {
  const world=start+gaitFoot(start,0).x;
  for(let d=start;d<start+100;d+=2) {
   assert.ok(Math.abs(d+gaitFoot(d,0).x-world)<1e-6);
   assert.equal(gaitFoot(d,0).y,440);
  }
 }
 assert.equal(gaitFoot(150,0).y,408);
 assert.ok(Math.abs(gaitFoot(199.999,0).x-gaitFoot(200,0).x)<.001);
});
