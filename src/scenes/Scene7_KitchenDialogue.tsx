import {useCurrentFrame} from 'remotion';
import {Stage} from '../components/Art';
import {Kitchen, KitchenCompanion, SeatedLeo} from '../components/Kitchen';
import {easeOut, smoothCamera} from '../lib/motion';

const Table = () => <g><path d="M1180 770H1740L1810 823H1130Z" fill="#D7D2BD" stroke="#AAA98F" strokeWidth="3"/><path d="M1160 823v220m595-220v220" stroke="#71563E" strokeWidth="12"/>{Array.from({length:17},(_,i)=><path key={i} d={`M${1150+i*39} 823l38-53`} stroke="#B1B7A3" strokeWidth="2"/>)}<path d="M1150 800H1775" stroke="#B1B7A3" strokeWidth="2"/></g>;

export const Scene7_KitchenDialogue = () => {
  const f=useCurrentFrame();
  // Local 0–150 wide shot, 150–270 companion, 270–354 Leo, 354–420 repair note.
  const companion=f>=150&&f<270; const leo=f>=270&&f<354; const note=f>=354;
  const push=smoothCamera(f,0,140,1,1.08);
  return <Stage>
    {!note && <>
      <g filter={companion||leo?'url(#depth)':undefined} transform={companion||leo?undefined:`translate(960 540) scale(${push}) translate(-960 -540)`}>
        <Kitchen frame={f} leak/>
        {!companion&&<KitchenCompanion frame={f} x={520} y={416} scale={.95}/>}
        {!leo&&<SeatedLeo frame={f} x={1220} y={525} scale={.85} emotion="annoyed"/>}
        <Table/>
        {!companion&&!leo&&<g opacity={easeOut(f,20,48)}><rect x="608" y="446" width="300" height="53" rx="26" fill="#313747"/><text x="758" y="482" textAnchor="middle" fill="#FFF3D8" fontSize="26" fontWeight="800" letterSpacing="3">LEAK · TODAY</text><path d="M754 504L730 685" stroke="#E1E9E6" strokeWidth="2" strokeDasharray="5 9"/>{[0,1,2].map(i=><circle key={i} cx="730" cy="710" r={135+i*95+Math.sin(f/28)*8} fill="none" stroke="#D5E9EA" strokeWidth="2" opacity=".15"/>)}</g>}
      </g>
      {(companion||leo)&&<rect width="1920" height="1080" fill="#B3A48F" opacity=".15"/>}
      {companion&&<KitchenCompanion frame={f} x={790} y={425} scale={3.1} talking/>}
      {leo&&<SeatedLeo frame={f} x={1180} y={435} scale={3.1} emotion="annoyed" talking sip={.05}/>}
    </>}
    {note&&<g>
      <rect width="1920" height="1080" fill="#D9D4BC"/>
      <ellipse cx="300" cy="75" rx="480" ry="200" fill="#7B8990" stroke="#B9C3C0" strokeWidth="28"/>
      <g transform="translate(1560 220) rotate(14)"><rect x="-130" y="-70" width="260" height="140" rx="22" fill="#D9BC4D"/><rect x="-130" y="-70" width="260" height="35" rx="12" fill="#60946A"/></g>
      <g transform={`translate(960 590) rotate(-8) scale(${smoothCamera(f,354,419,.92,1.05)})`} filter="url(#shadow)">
        <rect x="-210" y="-285" width="420" height="570" fill="#FCF8E9"/>
        <path d="M-115-220v127q0 110 115 110T115-93v-127M-90-220v125q0 82 90 82t90-82v-125M-130-195h55M75-195h55" fill="none" stroke="#68716E" strokeWidth="7"/>
        {[60,92,124].map(y=><path key={y} d={`M-145 ${y}H145`} stroke="#A7A99B" strokeWidth="7"/>)}
        <g transform={`translate(0 210) scale(${easeOut(f,365,380)})`}><rect x="-178" y="-42" width="356" height="82" fill="none" stroke="#3E73AE" strokeWidth="6"/><text y="24" textAnchor="middle" fill="#3E73AE" fontSize="70" fontWeight="900" letterSpacing="3">TODAY</text></g>
      </g>
      <circle cx="1770" cy="915" r="110" fill="#6190B3"/><circle cx="1770" cy="915" r="48" fill="#D9D4BC"/>
    </g>}
  </Stage>;
};
