import {useCurrentFrame, useVideoConfig} from 'remotion';
import {C, Label, Phone, Signal, Stage, Stickman} from '../components/Art';
import {easeOut, popIn, smoothCamera} from '../lib/motion';

export const Scene3_Elevator = () => {
  const f = useCurrentFrame()*2; const {fps} = useVideoConfig();
  const shut = smoothCamera(f,0,60,0,1);
  const reveal = popIn(f,fps,73);
  return <Stage>
    <rect width="1920" height="1080" fill="#1F2937"/>
    <path d="M200 120H1720V840L1920 1080H0L200 840Z" fill="url(#metal)"/>
    <path d="M200 120L0 0H1920L1720 120M200 840H1720" fill="none" stroke="#94A3B8" strokeWidth="5"/>
    <rect x="490" y="150" width="940" height="690" fill="#0F172A"/>
    <rect x={20+470*shut} y="150" width="470" height="690" fill="url(#metal)" stroke="#82909F" strokeWidth="3"/>
    <rect x={1430-470*shut} y="150" width="470" height="690" fill="url(#metal)" stroke="#82909F" strokeWidth="3"/>
    <rect x="810" y="47" width="300" height="85" rx="12" fill="#0B1420" stroke="#7D8A9B" strokeWidth="3"/>
    <path d="M860 65v44m-15-16 15 16 15-16" fill="none" stroke={C.red} strokeWidth="6" filter="url(#glow)"/>
    <text x="982" y="109" textAnchor="middle" fill={C.red} fontSize="48" fontFamily="monospace" filter="url(#glow)">{f<45?'02':f<95?'01':f<145?'00':f<195?'-1':'-3'}</text>
    <path d="M160 710H1760" stroke="#101827" strokeWidth="24"/><path d="M160 704H1760" stroke="#C0CBD7" strokeWidth="9"/>
    <rect x="1540" y="350" width="100" height="270" rx="12" fill="#273344" stroke="#A0ADBC" strokeWidth="3"/>
    {[0,1,2,3].map(i=><circle key={i} cx="1590" cy={393+i*59} r="17" fill={i===3?'#EF4444':'#82909F'} stroke="#CBD5E1" strokeWidth="2"/>)}
    <Stickman x={620} y={423} scale={.94} look={-.4}/>
    <Stickman x={1325} y={420} scale={.94} look={.4}/>
    <Stickman x={960} y={381} scale={1.2} hero raised={easeOut(f,60,140,0,.28)} smile={0} frame={f} emotion="confident"/>
    <g transform={`translate(330 590) scale(${Math.max(0,reveal)})`}>
      <Phone scale={.95}>
        <Label x={0} y={-172} anchor="middle" size={15} fill="#94A3B8">EVERYONE ELSE</Label>
        <g fill={C.red} transform="translate(0 -60)"><path d="M-8-65H8L16-9 65 20V33L12 14 8 52 26 66V76L0 68-26 76V66L-8 52-12 14-65 33V20L-16-9Z"/><path d="M-62-67L65 75" stroke="#FFD4D4" strokeWidth="7"/></g>
        <g opacity={.55+.45*Math.sin(f/8)**2}><Label x={0} y={100} anchor="middle" size={24} fill={C.red}>NO SIGNAL</Label></g>
        <text y="142" textAnchor="middle" fill="#9CA3AF" fontSize="16">Searching for a network…</text>
      </Phone>
    </g>
    <g transform={`translate(1580 590) scale(${Math.max(0,popIn(f,fps,87))})`}>
      <Phone scale={1.04}>
        <Label x={0} y={-172} anchor="middle" size={15} fill="#9BD3B5">LEO'S PHONE</Label>
        <Signal frame={f} fps={fps} delay={97} x={-70} y={10}/>
        <Label x={0} y={100} anchor="middle" size={22} fill={C.green}>FULL SIGNAL</Label>
        <text y="142" textAnchor="middle" fill="#B7D9C6" fontSize="16">Same elevator. Different mind.</text>
      </Phone>
    </g>
  </Stage>;
};
