import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Stage} from '../components/Art';
import {Kitchen, SeatedLeo} from '../components/Kitchen';
import {easeOut, popIn, smoothCamera} from '../lib/motion';

export const Scene5_Title = () => {
  const f=useCurrentFrame(); const {fps}=useVideoConfig();
  const sip=smoothCamera(f,0,32,0,1)-smoothCamera(f,88,115,0,.5);
  const dark=smoothCamera(f,120,152,0,1);
  const title=popIn(f,fps,142);
  return <Stage>
    <g opacity={1-dark}>
      <Kitchen frame={f}/>
      <SeatedLeo frame={f} x={850} y={440} scale={2.25} sip={sip}/>
      <rect x="0" y="949" width="1920" height="131" fill="#D6D1BA" stroke="#9B9D8B" strokeWidth="4"/>
      {Array.from({length:49},(_,i)=><path key={i} d={`M${i*40} 949v131`} stroke="#B9BDAA" strokeWidth="2"/>)}
      <path d="M0 990H1920M0 1030H1920" stroke="#B9BDAA" strokeWidth="2"/>
    </g>
    <rect width="1920" height="1080" fill="url(#dark)" opacity={dark}/>
    <g opacity={easeOut(f,142,160)*(1-easeOut(f,239,269))}>
      <g transform={`translate(960 480) scale(${.8+.2*title})`}>
        <text y="-35" textAnchor="middle" fill="#FFF3D9" fontSize="64" fontWeight="800" letterSpacing="7">WHAT IF YOU HAD</text>
        <text y="105" textAnchor="middle" fill="url(#title)" stroke="#FFE1A1" strokeWidth="1" fontWeight="900" fontSize="148" filter="url(#glow)">500 IQ?</text>
      </g>
    </g>
    <path d="M200 850Q590 850 755 610Q960 320 1165 610Q1330 850 1720 850" fill="none" stroke="#B2A477" strokeWidth="2" opacity={.12*dark}/>
  </Stage>;
};
