import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Stage, Stickman} from '../components/Art';
import {easeOut, popIn, smoothCamera} from '../lib/motion';

const base=848;
const xFor=(iq:number)=>250+(iq-40)*13;
const height=(iq:number)=>570*Math.exp(-.5*((iq-100)/15)**2);
const line=Array.from({length:261},(_,i)=>{const iq=35+i*.5;return `${i?'L':'M'}${xFor(iq)} ${base-height(iq)}`;}).join(' ');
const people=Array.from({length:70},(_,i)=>{
  const iq=38+i*1.8; const count=Math.floor(height(iq)/30);
  return Array.from({length:count},(_,row)=>({x:xFor(iq), y:base-row*30-25, i, row}));
}).flat();

export const Scene6_IQScale = () => {
  const f=useCurrentFrame();const {fps}=useVideoConfig();
  // 19–24: distribution. 24–27: 140. 27–29: 160. 29–31: travel. 31–33: 500.
  const pan=smoothCamera(f,280,365,0,1100)+smoothCamera(f,475,555,0,330);
  const travel=smoothCamera(f,570,704,0,5900);
  const zoom=smoothCamera(f,280,365,1,1.28);
  const graphOpacity=1-easeOut(f,570,625);
  const heroIn=popIn(f,fps,716,16);
  return <Stage>
    <rect width="1920" height="1080" fill="url(#dark)"/>
    {Array.from({length:38},(_,i)=><circle key={i} cx={(i*137+69)%1920} cy={(i*79+83)%1080} r={i%3*.6+.5} fill="#D2D1D0" opacity=".16"/>)}
    <g transform={`translate(${-pan-travel} ${base*(1-zoom)}) scale(${zoom})`} opacity={graphOpacity}>
      <defs><symbol id="tiny-person" viewBox="0 0 14 29"><circle cx="7" cy="4" r="3.2"/><path d="M7 9v10M3 11v8M11 11v8M5 18v10M9 18v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></symbol></defs>
      {people.map(p=><use key={`${p.i}-${p.row}`} href="#tiny-person" x={p.x} y={p.y} width="13" height="27" fill="#AAB0BF" color="#AAB0BF" opacity={easeOut(f, p.i*.75+p.row*1.2, p.i*.75+p.row*1.2+24)*.7}/>)}
      <path d={line} fill="none" stroke="#EDE0BD" strokeWidth="3" pathLength="1000" strokeDasharray="1000" strokeDashoffset={smoothCamera(f,55,157,1000,0)}/>
      <rect x="175" y={base+8} width="1600" height="17" fill="#E6CB7E"/>
      {Array.from({length:121},(_,i)=><path key={i} d={`M${250+i*13} ${base+9}v${i%10===0?16:i%5===0?11:6}`} stroke="#6B644E" strokeWidth="1"/>)}
      {[100,140,160].map((iq,i)=>{
        const enter=easeOut(f,[95,292,485][i],[120,318,510][i]);
        const xx=xFor(iq); const yy=base-height(iq);
        return <g key={iq} opacity={enter}><path d={`M${xx} ${yy-48}V${base}`} stroke="#D7CDAF" strokeWidth="1.5" opacity=".6"/><text x={xx} y={yy-65} textAnchor="middle" fill="#FFF1CE" fontSize="35" fontWeight="800">{iq}</text><circle cx={xx} cy={yy} r="5" fill="#FCE6A4" filter="url(#glow)"/></g>;
      })}
    </g>
    <g opacity={easeOut(f,570,603)*(1-easeOut(f,707,735))}>
      <path d="M0 805H1920" stroke="#717A91" strokeWidth="2"/>
      {Array.from({length:25},(_,i)=>{const xx=((i*173-travel)%2200+2200)%2200-140; return <g key={i}><path d={`M${xx} 805v-12`} stroke="#9BA4B9" strokeWidth="3"/><path d={`M${xx} ${260+i%7*66}h${35+i%4*28}`} stroke="#7B89A3" strokeWidth="1" opacity=".2"/></g>;})}
    </g>
    <g transform={`translate(960 510) scale(${Math.max(.001,heroIn)})`} opacity={easeOut(f,704,727)}>
      <ellipse cx="0" cy="205" rx="145" ry="30" fill="#3979DB" opacity=".17" filter="url(#glow)"/>
      <text x="0" y="-60" textAnchor="middle" fill="url(#title)" fontSize="128" fontWeight="900" filter="url(#glow)">500</text>
      <Stickman x={0} y={10} scale={.43} hero phone={false} frame={f} emotion="confident"/>
    </g>
  </Stage>;
};
