import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, Label, Stage} from '../components/Art';
import {easeOut, smoothCamera} from '../lib/motion';

export const Scene2_ChipMacro = () => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const drop = spring({frame: f, fps, config: {stiffness:120, damping:14}});
  const bend = smoothCamera(f,60,118,0,1);
  const retract = smoothCamera(f,62,110,0,-650);
  const spark = easeOut(f,120,124) * (1-easeOut(f,126,141));
  return <Stage>
    <rect width="1920" height="1080" fill="#0F5132"/>
    <g transform={`translate(960 540) scale(${smoothCamera(f,0,179,1,1.08)}) translate(-960 -540)`}>
      {Array.from({length: 13}, (_,i) => <g key={i} fill="none" stroke="#FFD700" strokeOpacity=".48" strokeWidth="4">
        <path d={`M-50 ${110+i*69}H${210+i*31}L${370+i*31} ${270+i*45}H660`}/>
        <path d={`M1260 ${245+i*42}H${1430+i*16}L${1560+i*18} ${70+i*73}H2000`}/>
        <circle cx={210+i*31} cy={110+i*69} r="8" fill="#0F5132"/>
      </g>)}
      {[180,1740].map(x => [180,900].map(y => <g key={`${x}-${y}`}><circle cx={x} cy={y} r="32" fill="#153D2B" stroke="#BFA965" strokeWidth="10"/><path d={`M${x-14} ${y}h28`} stroke="#97A28B" strokeWidth="6"/></g>))}
      <rect x="702" y="300" width="496" height="475" rx="20" fill="#0B3022" stroke="#A9B97A" strokeWidth="3" strokeDasharray="12 12"/>
      <g transform={`translate(0 ${-200*(1-drop)})`}>
        {Array.from({length: 12},(_,i)=><g key={i} fill="url(#silver)"><rect x={750+i*35} y="270" width="17" height="65" rx="3"/><rect x={750+i*35} y="746" width="17" height="65" rx="3"/><rect x="674" y={345+i*34} width="69" height="17" rx="3"/><rect x="1160" y={345+i*34} width="69" height="17" rx="3"/></g>)}
        <rect x="730" y="322" width="445" height="430" rx="22" fill="#10191D" stroke="#5B6967" strokeWidth="5" filter="url(#shadow)"/>
        <rect x="752" y="344" width="401" height="386" rx="14" fill="#172325"/>
        <path d="M778 370h74M778 370v74" stroke="#688078" strokeWidth="3" fill="none"/>
        <Label x={952} y={497} anchor="middle" size={26} fill="#71877D">CUSTOM SILICON</Label>
        <text x="952" y="582" textAnchor="middle" fontSize="77" fontWeight="900" fill="#C9D6CA" letterSpacing="-3">L / 500</text>
        <Label x={952} y={642} anchor="middle" size={15} fill="#71877D">ULTRA-LOW POWER · REV 01</Label>
        <circle cx="788" cy="692" r="9" fill="#B8C5B7"/>
        <g transform={`translate(0 ${retract})`} fill="url(#silver)" stroke="#CAD4D8" strokeWidth="2"><path d="M777-250L875-250 827 350 776 430 763 419 791 339Z"/><path d="M1075-250L1158-250 1123 420 1109 434 1084 347Z"/></g>
      </g>
      <path d={`M1490 730V${470-bend*85}Q1490 ${450-bend*85} ${1470-bend*235} ${450-bend*65}L${1430-bend*216} ${450-bend*65}`} fill="none" stroke="#713D24" strokeWidth="18" strokeLinecap="round"/>
      <path d={`M1490 730V${470-bend*85}Q1490 ${450-bend*85} ${1470-bend*235} ${450-bend*65}L${1430-bend*216} ${450-bend*65}`} fill="none" stroke="#E8A463" strokeWidth="10" strokeLinecap="round"/>
      <g transform={`translate(${smoothCamera(f,60,118,1700,1355)} ${smoothCamera(f,60,118,80,355)+smoothCamera(f,125,155,0,-650)}) rotate(28)`}><path d="M-14-600H14L8 0 0 40-8 0Z" fill="url(#silver)"/></g>
      <g transform="translate(1214 385)" opacity={spark} stroke="#FFF4A3" filter="url(#glow)">{Array.from({length:8},(_,i)=><path key={i} transform={`rotate(${i*45})`} d={`M0 -10V${-30-easeOut(f,120,140,0,50)}`} strokeWidth="4"/>)}<circle r="12" fill="white"/></g>
      <rect x="1338" y="793" width="94" height="64" rx="12" fill="#0A2D20" stroke="#86A287" strokeWidth="3"/>
      <circle cx="1385" cy="825" r="24" fill={C.green} opacity={.12+.88*easeOut(f,123,147)} filter={f>=123?'url(#glow)':undefined}/>
      <Label x={1385} y={909} anchor="middle" size={17} fill="#93C7A6">LINK ACTIVE</Label>
    </g>
  </Stage>;
};
