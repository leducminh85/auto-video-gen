import {useCurrentFrame, useVideoConfig} from 'remotion';
import {C, Label, Phone, Stage, Steam} from '../components/Art';
import {easeOut, popIn, smoothCamera} from '../lib/motion';

export const Scene1_Desk = () => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const screen = easeOut(f, 40, 120);
  const charge = smoothCamera(f, 60, 180, 0, 1);
  const lift = smoothCamera(f, 180, 269, 0, 1);
  const zoom = smoothCamera(f,0,220,1.8,1) + lift * .2;
  const days = popIn(f, fps, 128, 10);
  return <Stage>
    <g transform={`translate(960 ${540 + easeOut(f, 0, 60, -30, 0)}) scale(${zoom}) translate(-960 -540)`}>
      <rect x="-300" y="-200" width="2520" height="1480" fill="url(#wood)"/>
      {Array.from({length: 18}, (_, i) => <g key={i} opacity=".45" fill="none" stroke="#5D4037">
        <path d={`M-200 ${i*76}Q500 ${i*76-25} 1100 ${i*76+7}T2200 ${i*76-5}`} strokeWidth="4"/>
        <path d={`M-200 ${i*76+20}Q900 ${i*76+60} 2200 ${i*76+25}`} strokeWidth="2"/>
      </g>)}
      <g opacity=".10" fill="#FFF4B3" transform="rotate(-28 1500 100)"><rect x="1300" y="-600" width="180" height="2000"/><rect x="1520" y="-600" width="180" height="2000"/></g>
      <g transform="translate(400 620) rotate(-12)" filter="url(#shadow)">
        <circle r="230" fill="#D4D4D0"/><circle r="218" fill="#FAFAF5"/><circle r="175" fill="none" stroke="#D9DDD8" strokeWidth="4"/>
        <path d="M-125 125V-42C-164-150-68-171 0-143C75-171 158-145 125-42V125Z" fill="#B56A31" stroke="#8E4723" strokeWidth="10"/>
        <path d="M-108 108V-48C-145-123-63-146 0-120C67-146 137-122 108-48V108Z" fill="#E5B570"/>
        {Array.from({length: 34}, (_, i) => <ellipse key={i} cx={((i*47)%185)-92} cy={((i*31)%185)-85} rx="3" ry="5" fill="#9E5E2C" opacity=".5"/>)}
        <rect x="-34" y="-12" width="73" height="53" rx="7" fill="#FFE29B" transform="rotate(14)"/>
      </g>
      <g transform="translate(1450 315)" filter="url(#shadow)"><ellipse cx="0" cy="10" rx="153" ry="146" fill="#D9DAD3"/><rect x="94" y="-45" width="90" height="90" rx="35" fill="none" stroke="#F8FAFC" strokeWidth="27"/><circle r="119" fill="#F5F3EB"/><circle r="98" fill="#241811"/><ellipse cx="-25" cy="-30" rx="55" ry="30" fill="#4D3422"/><path d="M-70 40Q-30 85 38 65" stroke="#AF8152" strokeWidth="4" fill="none" opacity=".55"/></g>
      <Steam frame={f} x={1445} y={285}/>
      <g transform="translate(1380 820) rotate(9)" stroke="#B5BEC5" strokeWidth="7" fill="none"><path d="M0 0h250M0 18h250"/><path d="M-15-4l-25 16 25 16"/></g>
      <g transform="translate(600 180) rotate(-15)"><rect width="170" height="115" rx="8" fill="#0F5132" stroke="#335E4C" strokeWidth="5"/>{[0,1,2,3].map(i=><path key={i} d={`M10 ${20+i*23}h140`} stroke="#C6A552" strokeWidth="3"/>)}<rect x="58" y="25" width="60" height="65" fill="#111827"/></g>
      <g transform={`translate(0 ${-lift*65}) rotate(${-lift*4} 960 540)`}>
        <Phone x={960} y={540} scale={1.22}>
          <g opacity={screen}>
            <rect x="-133" y="-228" width="266" height="455" rx="20" fill="#155C3C" opacity={.18+.15*Math.sin(f/17)**2}/>
            <Label x={0} y={-177} size={15} anchor="middle" fill="#8EBDA8">REBUILT. REIMAGINED.</Label>
            <path d="M8-133L-35-66H-5L-14-19 39-91H7Z" fill={C.green} filter="url(#glow)" opacity={easeOut(f,60,85)}/>
            <g opacity={easeOut(f, 70, 100)}><rect x="-84" y="7" width="158" height="64" rx="12" fill="none" stroke={C.green} strokeWidth="4"/><rect x="78" y="25" width="9" height="28" rx="3" fill={C.green}/><rect x="-76" y="15" width={142*charge} height="48" rx="6" fill={C.green} filter="url(#glow)"/></g>
            <Label x={0} y={112} size={18} anchor="middle" fill="#B3D7C4">BATTERY</Label>
            <g transform={`translate(0 170) scale(${days})`}><text textAnchor="middle" fill="#F0FFF4" fontSize="44" fontWeight="900" letterSpacing="-2">31 DAYS</text></g>
            <text x="0" y="208" textAnchor="middle" fill="#73B49A" fontSize="12" letterSpacing="2">ONE CHARGE. ONE MONTH.</text>
          </g>
        </Phone>
        <g transform={`translate(${smoothCamera(f,170,222,1220,1107)} ${smoothCamera(f,170,222,1290,805)}) rotate(-18)`} fill="#111827" stroke="#293243" strokeWidth="4">
          <path d="M0 330V40Q-35 0-27-58Q-18-87 0-65L38-7V-110Q40-141 62-127L68-37V-139Q80-159 96-136L102-34V-117Q122-139 135-110L139 6Q169-63 184-35Q200-5 165 92L151 330Z"/>
          <path d="M36 75q47 28 108-4M49 100l-3 111" fill="none"/>
        </g>
      </g>
      <g transform={`translate(${easeOut(f,0,75,755,580)} ${easeOut(f,0,75,480,1120)}) rotate(-30)`}>
        <path d="M-50 220V-20Q-15-65 25-20L65 220" fill="#111827" stroke="#293243" strokeWidth="5"/>
        <path d="M-12-15L-25-225 8-250 17-15M-25-225L-20-275" fill="none" stroke="url(#silver)" strokeWidth="9"/>
      </g>
      <rect x="-200" y="-100" width="2320" height="1280" fill="url(#warm)"/>
    </g>
  </Stage>;
};
