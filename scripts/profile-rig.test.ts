import {test} from 'node:test';
import assert from 'node:assert/strict';
import {profileFoot, profilePose} from '../src/remotion/stickman/lib/profileRig';

test('profile feet stay planted through complete strides and knees preserve bone length',()=>{
 for(let distance=0; distance<=280; distance+=.5) {
  const pose=profilePose(distance,true);
  for(const [leg,phase] of [[pose.leftLeg,.5],[pose.rightLeg,0]] as const) {
   const desired=profileFoot(distance,phase);
   assert.ok(Math.hypot(leg.end.x-desired.x,leg.end.y-desired.y)<1e-6);
   assert.ok(Math.abs(Math.hypot(leg.joint.x,leg.joint.y-(250+pose.bodyY))-95)<1e-6);
   assert.ok(Math.abs(Math.hypot(leg.end.x-leg.joint.x,leg.end.y-leg.joint.y)-95)<1e-6);
   const next=profileFoot(distance+.1,phase);
   if(desired.y===440 && next.y===440) assert.ok(Math.abs(distance+desired.x-distance-.1-next.x)<1e-6);
  }
 }
});
test('standing legs are nearly extended and resting hands finish near hips',()=>{
 const pose=profilePose(280,true);
 assert.ok(pose.bodyY<5);
 for(const arm of [pose.leftArm,pose.rightArm]) assert.ok(arm.end.y<275 && arm.end.y>255);
 for(const leg of [pose.leftLeg,pose.rightLeg]) {
  const upper={x:leg.joint.x,y:leg.joint.y-(250+pose.bodyY)};
  const lower={x:leg.end.x-leg.joint.x,y:leg.end.y-leg.joint.y};
  assert.ok((upper.x*lower.x+upper.y*lower.y)/(95*95)>.98);
 }
});
test('contact grip and lift targets stay within reach without shifting cup',()=>{
 const contact=profilePose(280,true,undefined,{x:150,y:182}).rightArm.end;
 assert.deepEqual(contact,{x:150,y:182});
 assert.equal(900+contact.x-20,1030);
 assert.equal(300+contact.y-12,470);
 const lift=profilePose(280,true,undefined,{x:110,y:125}).rightArm.end;
 assert.ok(Math.hypot(lift.x-110,lift.y-125)<1e-6);
});
