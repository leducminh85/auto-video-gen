import {Composition, registerRoot, useCurrentFrame} from 'remotion';
import {VectorShot} from '../../src/remotion/stickman/VectorShot';
import type {RemotionShot, VectorLayer, MotionValue} from '../../src/types/remotion';
const keys=(values:number[][]):MotionValue=>({keys:values.map(([at,value])=>({at,value}))});
const cup=(id:string):VectorLayer=>({id,type:'g',children:[
 {id:id+'body',type:'rect',attrs:{x:-32,y:-10,width:40,height:50,rx:6,fill:'#BD642C',stroke:'#452D24',strokeWidth:3}},
 {id:id+'handle',type:'path',attrs:{d:'M8 -2C34 -8 34 31 8 27',fill:'none',stroke:'#452D24',strokeWidth:7}}
]});
const shot:RemotionShot={version:1,styleId:'STICKMAN_500IQ_V1',direction:'Walk, stop, reach, grasp, lift, react',background:'#EEE7DA',layers:[
 {id:'floor',type:'path',attrs:{d:'M0 752H1920',stroke:'#BDB09A',strokeWidth:3}},
 {id:'table',type:'g',children:[
  {id:'top',type:'rect',attrs:{x:1000,y:510,width:360,height:24,rx:5,fill:'#705342'}},
  {id:'legs',type:'path',attrs:{d:'M1025 534V740M1335 534V740',stroke:'#705342',strokeWidth:18}}
 ]},
 {...cup('resting'),x:1030,y:470,exit:.6},
 {id:'actor',type:'character',hero:true,phone:false,facing:1,emotion:'calm',walking:true,
  x:keys([[0,620],[.38,900],[1,900]]),y:300,look:keys([[0,.7],[.4,.7],[.8,.2],[1,.2]]),
  headTilt:keys([[0,0],[.42,0],[.55,8],[.65,8],[.8,-5],[1,-5]]),
  rightHandX:keys([...Array.from({length:20},(_,i)=>{const t=i/19;const d=280*t*t*(3-2*t);return [t*.38,15-Math.sin(d/140*Math.PI*2)*20];}),[.4,15],[.56,150],[.6,150],[.8,110],[1,110]]),
  rightHandY:keys([[0,265],[.4,265],[.56,182],[.6,182],[.8,125],[1,125]]),
  children:[{...cup('held'),x:-20,y:-12,attachment:'rightHand',enter:.6}]
 }
]};
const Demo=()=> <VectorShot shot={shot} frame={useCurrentFrame()} duration={360}/>;
registerRoot(()=> <Composition id="MotionProof" component={Demo} durationInFrames={360} fps={60} width={1920} height={1080}/>);
