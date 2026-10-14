import {Face, Emotion, Stickman} from './Character';
import {Steam} from './Art';

export const Kitchen = ({frame = 0, leak = false}: {frame?: number; leak?: boolean}) => <g>
  <rect width="1920" height="1080" fill="#C9BAA2"/>
  <path d="M0 780H1920V1080H0Z" fill="#987B5F"/>
  {Array.from({length:23},(_,i)=><path key={i} d={`M${i*95} 1080L${480+i*48} 780`} stroke="#765E4B" strokeWidth="2" opacity=".4"/>)}
  <path d="M0 203H1920M0 780H1920" stroke="#DFD1B8" strokeWidth="5"/>
  <rect x="83" y="300" width="220" height="480" fill="#302A25" stroke="#E3D6C2" strokeWidth="12"/>
  <rect x="1305" y="260" width="310" height="340" fill="#D0DAD6" stroke="#E8DDC9" strokeWidth="14"/>
  {[0,1,2,3].map(i=><g key={i}><rect x={1320+i*72} y={400-i%2*50} width="58" height={195+i%2*50} fill="#ADB9B5"/>{[0,1,2].map(j=><path key={j} d={`M${1330+i*72} ${435+j*45}h12m12 0h12`} stroke="#DCE3D9" strokeWidth="12"/>)}</g>)}
  <path d="M1458 260V600M1305 425H1615" stroke="#E8DDC9" strokeWidth="10"/>
  <path d="M1285 250h40v370h-65q40-180 25-370M1600 250h50q-25 190 20 370h-70Z" fill="#D9B766"/>
  <rect x="1685" y="375" width="165" height="405" rx="10" fill="#E0DECE" stroke="#B8B6AB" strokeWidth="4"/>
  <path d="M1685 520h165M1708 542v80M1708 420v58" stroke="#A7AA9F" strokeWidth="5"/>
  <rect x="420" y="270" width="390" height="170" fill="#849B89" stroke="#677B70" strokeWidth="4"/>
  {[515,610,705].map(x=><path key={x} d={`M${x} 270V440m-13-55v28`} stroke="#BDCBBA" strokeWidth="3"/>)}
  <path d="M937 250h60v140l60 60H872l65-60Z" fill="#E0DDCE"/>
  <rect x="390" y="450" width="820" height="170" fill="#E7E2CF"/>
  {Array.from({length:23},(_,i)=><path key={i} d={`M${390+i*37} 450V620`} stroke="#BEC5B7" strokeWidth="2"/>)}
  {[480,515,550,585].map(y=><path key={y} d={`M390 ${y}H1210`} stroke="#BEC5B7" strokeWidth="2"/>)}
  <path d="M360 610H1250V643H360Z" fill="#E8E3CE" stroke="#BDBBAA" strokeWidth="3"/>
  <rect x="380" y="643" width="850" height="220" fill="#849B89" stroke="#566C63" strokeWidth="4"/>
  <path d="M595 643V863M865 643V863M1075 643V863M380 710H595M865 710H1230" stroke="#5C7468" strokeWidth="4"/>
  <path d="M455 680h45M940 680h45M1120 680h45" stroke="#D4D9C9" strokeWidth="6"/>
  <ellipse cx="727" cy="621" rx="114" ry="20" fill="#71868C" stroke="#BBC9C7" strokeWidth="7"/>
  <path d="M710 600V552q0-43 38-43q37 0 37 40" stroke="#A9B9BA" strokeWidth="12" fill="none"/>
  <rect x="1110" y="566" width="70" height="44" rx="10" fill="#BFCAC1"/><path d="M1125 566q0-50 40-13" fill="none" stroke="#40524C" strokeWidth="7"/>
  {leak&&<g>
    <rect x="604" y="650" width="250" height="210" fill="#273339"/>
    <path d="M726 648v63q0 41 45 41q45 0 45-41v-38" fill="none" stroke="#D0D9D0" strokeWidth="14"/>
    <path d="M717 695h22" stroke="#4C605D" strokeWidth="7"/>
    <path d={`M726 ${716+Math.sin((frame%48)/48*Math.PI/2)*65}q-12 18 0 20q12-2 0-20`} fill="#C9F3FF" opacity={Math.sin((frame%48)/48*Math.PI)}/>
    <path d="M679 789h97l-12 65h-73Z" fill="#5387AB" stroke="#A3C1D1" strokeWidth="3"/><ellipse cx="727" cy="789" rx="49" ry="8" fill="#A6D2E5"/>
    <path d="M682 788q0-70 91 0" fill="none" stroke="#5387AB" strokeWidth="4"/>
  </g>}
  <path d="M1457 0V246" stroke="#5E5A4E" strokeWidth="4"/><path d="M1410 285l47-55 48 55Z" fill="#3F5B50"/>
  <circle cx="350" cy="315" r="30" fill="#E7DECD" stroke="#6C756C" strokeWidth="4"/><path d="M350 293v22l17 8" fill="none" stroke="#56615B" strokeWidth="3"/>
  <rect width="1920" height="1080" fill="url(#warm)"/>
</g>;

export const TeaMug = ({frame, x, y, tilt = 0, scale = 1}: {frame: number; x: number; y: number; tilt?: number; scale?: number}) =>
  <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${scale})`}>
    <path d="M34-26q53-7 46 36q-4 27-46 19" fill="none" stroke="#D9CBAA" strokeWidth="12"/>
    <path d="M-40-35H40V43Q0 61-40 43Z" fill="#CAB995" stroke="#F3E5C5" strokeWidth="4"/>
    <ellipse cy="-35" rx="40" ry="10" fill="#F4E8CB"/><ellipse cy="-35" rx="32" ry="6" fill="#714B2A"/>
    <rect x="-33" y="-7" width="66" height="37" rx="5" fill="#343533"/>
    <text y="17" textAnchor="middle" fill="#FFE2A1" fontSize="17" fontWeight="800">60.0°C</text>
    <Steam frame={frame} x={0} y={-45}/>
  </g>;

export const SeatedLeo = ({frame, x = 960, y = 420, scale = 1, sip = 0, emotion = 'pleased', talking = false}: {
  frame: number; x?: number; y?: number; scale?: number; sip?: number; emotion?: Emotion; talking?: boolean;
}) => {
  const handX=150-95*sip; const handY=240-200*sip;
  return <g transform={`translate(${x} ${y}) scale(${scale})`} strokeLinecap="round" strokeLinejoin="round">
    <path d="M-80 180H50V455M-80 310H99V455" fill="none" stroke="#76543C" strokeWidth="14"/>
    <path d="M-12 306L100 333 110 420M20 300L136 320 148 414" fill="none" stroke="#090910" strokeWidth="18"/>
    <path d="M-60 75Q-84 116-63 181L-38 173H40L62 88Q0 40-60 75Z" fill="#2B64D1" stroke="#1C3B78" strokeWidth="3"/>
    <path d="M-35 99Q1 87 32 99L56 300H-45Z" fill="url(#hoodie)" stroke="#080810" strokeWidth="3"/>
    <path d="M-3 112v60m17-60v60" stroke="#F3E6CA" strokeWidth="4"/>
    <path d="M-23 246H28L34 281H-29Z" fill="#2456AC" stroke="#1B3D83" strokeWidth="3"/>
    <path d="M0 47V99" stroke="#080810" strokeWidth="21"/>
    <path d="M-30 128L-50 271 37 251" stroke="#080810" strokeWidth="34" fill="none"/><path d="M-30 128L-50 271 37 251" stroke="#3075E9" strokeWidth="27" fill="none"/>
    <path d={`M32 127L100 213 ${handX} ${handY}`} stroke="#080810" strokeWidth="35" fill="none"/><path d={`M32 127L100 213 ${handX} ${handY}`} stroke="#3177ED" strokeWidth="28" fill="none"/>
    <path d={`M104 209L${handX+8} ${handY+8}`} stroke="#F5BF7A" opacity=".6" strokeWidth="3"/>
    <g transform={`rotate(${sip*12})`}><Face emotion={emotion} frame={frame} talking={talking}/></g>
    <TeaMug frame={frame} x={handX-4} y={handY+4} tilt={-sip*24} scale={.68}/>
    <ellipse cx={handX+31} cy={handY} rx="10" ry="16" fill="#080810"/>
  </g>;
};

export const KitchenCompanion = ({frame, x = 510, y = 410, scale = 1, talking = false}: {frame: number; x?: number; y?: number; scale?: number; talking?: boolean}) =>
  <Stickman x={x} y={y} scale={scale} scarf phone={false} frame={frame} emotion={talking?'surprised':'calm'} talking={talking} look={.7}/>;
