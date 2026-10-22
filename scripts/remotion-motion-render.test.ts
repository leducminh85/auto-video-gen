import { test } from 'node:test';
import assert from 'node:assert/strict';
import { motionValue } from '../src/remotion/stickman/VectorShot';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { VectorShot } from '../src/remotion/stickman/VectorShot';
import type { RemotionShot } from '../src/types/remotion';
test('holds, interpolation and seeking preserve choreography', () => {
 const value = {keys:[{at:0,value:0,ease:'hold' as const},{at:.25,value:10,ease:'linear' as const},{at:.75,value:30},{at:1,value:30}]};
 assert.equal(motionValue(value,.2),0); assert.equal(motionValue(value,.25),10); assert.equal(motionValue(value,.5),20); assert.equal(motionValue(value,1),30);
 const shot: RemotionShot={version:1,styleId:'STICKMAN_500IQ_V1',direction:'motion test',background:'#D0C0A0',layers:[{id:'actor',type:'character',hero:true,x:value,rightHandX:120,rightHandY:200,children:[{id:'cup',type:'mug',attachment:'rightHand'}]}]};
 const render=(frame:number)=>renderToStaticMarkup(React.createElement(VectorShot,{shot,frame,duration:121}));
 const middle=render(60);render(100);assert.equal(render(60),middle); assert.match(middle,/translate\(120 200\)/);assert.notEqual(render(0),middle);
});
