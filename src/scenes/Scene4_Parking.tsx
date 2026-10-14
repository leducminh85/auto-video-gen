import {useCurrentFrame, useVideoConfig} from 'remotion';
import {C, Label, Phone, Signal, Stage, Stickman} from '../components/Art';
import {easeOut, popIn, smoothCamera} from '../lib/motion';
import {Face} from '../components/Character';

export const Scene4_Parking = () => {
  const f = useCurrentFrame()*.8; const {fps} = useVideoConfig();
  const x = smoothCamera(f,0,239,210,1320);
  const gait = (f/60)*Math.PI*3.8;
  const walking = 1-easeOut(f,222,239);
  const bubble = popIn(f,fps,60);
  const bx = x + 280;
  const closeup = easeOut(f,65,78)*(1-easeOut(f,150,165));
  return <Stage>
    <rect width="1920" height="1080" fill="#1F2937"/>
    <path d="M0 0H1920L1450 390H470Z" fill="#17202D"/>
    <path d="M0 1080L470 670H1450L1920 1080Z" fill="#344052"/>
    <path d="M0 840H1920M150 1080L610 670M1770 1080L1320 670" stroke="#E5E7EB" strokeWidth="9" opacity=".45"/>
    <path d="M30 180H1890M240 65V250H1690V65" stroke="#566273" strokeWidth="15" fill="none"/>
    {[420,960,1500].map((lx,i)=><g key={lx}>
      <path d={`M${lx-105} ${160+i%2*50}L${lx-320} 820H${lx+320}L${lx+105} ${160+i%2*50}Z`} fill="#D9EAF4" opacity=".035"/>
      <rect x={lx-115} y={146+i%2*50} width="230" height="12" rx="6" fill="#DCF3F7" filter="url(#glow)"/>
    </g>)}
    {[120,1640].map(px=><g key={px}><path d={`M${px} 235h150v650h-150Z`} fill="url(#metal)"/><rect x={px} y="624" width="150" height="260" fill="url(#hazard)"/><text x={px+75} y="420" textAnchor="middle" fill="#E2E8F0" fontSize="23" letterSpacing="2">LEVEL</text><text x={px+75} y="510" textAnchor="middle" fill="#E2E8F0" fontSize="76" fontWeight="900">−3</text></g>)}
    {[390,1320].map((cx,i)=><g key={cx} transform={`translate(${cx} 650)`} opacity=".5"><path d="M-160 0l40-80h200l70 80 30 20v80h-360V20Z" fill={i?'#66788A':'#233849'} stroke="#91A2B7" strokeWidth="3"/><path d="M-100-15l25-48H50l30 48Z" fill="#111827"/><rect x="-150" y="27" width="50" height="15" rx="6" fill="#C5D5DA"/><rect x="150" y="27" width="50" height="15" rx="6" fill="#C5D5DA"/></g>)}
    {[520,910,1390].map((cx,i)=><Stickman key={cx} x={cx} y={480+i%2*40} scale={.68} raised={.75+.08*Math.sin(f/13+i)} look={easeOut(f,85+i*12,135+i*12,0,(x>cx?1:-1))} surprised={f>105+i*12}/>)}
    <Stickman x={x} y={500-Math.abs(Math.sin(gait))*9*walking} hero scale={1.03} walk={gait} walkAmplitude={walking} smile={0} frame={f} emotion="confident"/>
    <g opacity={easeOut(f,60,80)}><path d={`M${x+123} 670Q${x+180} 570 ${bx} 422`} fill="none" stroke={C.green} strokeWidth="3" strokeDasharray="8 10"/></g>
    <g transform={`translate(${bx} 270) scale(${bubble})`} opacity={1-closeup}>
      <circle r="169" fill="#0B1520" stroke={C.green} strokeWidth="4" filter="url(#shadow)"/>
      <circle r="154" fill="#EADACB"/>
      <defs><clipPath id="call-clip"><circle r="151"/></clipPath></defs>
      <g clipPath="url(#call-clip)">
        <path d="M-160 60H160V160H-160Z" fill="#D7C1B8"/><path d="M-120-170V50M90-170V50" stroke="#F7ECE2" strokeWidth="13"/>
        <path d="M-85 190V70Q0 13 85 70V190Z" fill="#B65D88"/>
        <path d="M-69 4Q-100-122 0-124Q110-122 70 18Z" fill="#3D2930"/>
        <circle cy="-26" r="58" fill="#080810" stroke="#352932" strokeWidth="5"/>
        <path d="M-62-50Q-60-134 5-100Q67-113 66-39Q16-50 4-84Q-17-43-62-50Z" fill="#3D2930"/>
        <g transform="translate(0 -26) scale(.85)"><Face emotion="pleased" frame={f} talking/></g>
        <path d={`M68 100Q113 72 105 ${20+Math.sin(f/10)*12}`} fill="none" stroke="#352932" strokeWidth="13" strokeLinecap="round"/>
      </g>
      <rect x="-116" y="106" width="232" height="51" rx="25" fill="#0B1520"/>
      <Signal x={-92} y={142} size={.31}/>
      <text x="-27" y="138" fill="#C9FADD" fontSize="16" fontWeight="700">SIS · CONNECTED</text>
      <circle cx="-119" cy="-113" r="12" fill={C.green} filter="url(#glow)"/>
    </g>
    <g opacity={closeup}>
      <rect width="1920" height="1080" fill="#0B1422" opacity=".4"/>
      <Phone x={960} y={540} scale={1.48} rotation={-5}>
        <rect x="-130" y="-224" width="260" height="455" rx="21" fill="#CFB18D"/>
        <Signal x={-115} y={-176} size={.3}/>
        <path d="M-66 115V60Q0 26 66 60V115Z" fill="#0A0A12"/>
        <g transform="translate(0 -13) scale(1.12)"><Face frame={f} emotion="pleased" talking/><path d="M-22-56q19-24 35 0" fill="#68C8BE"/></g>
        <rect x="61" y="-197" width="57" height="87" rx="8" fill="#467AC5" stroke="#F3E5C8" strokeWidth="2"/>
        <g transform="translate(89 -166) scale(.34)"><Face frame={f} emotion="confident"/></g>
        <text x="0" y="150" textAnchor="middle" fontSize="14" fill="#FFF8E7">SIS · CONNECTED</text>
        <circle cy="193" r="19" fill="#D95B55"/><path d="M-10 195q10-12 20 0" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round"/>
      </Phone>
    </g>
  </Stage>;
};
