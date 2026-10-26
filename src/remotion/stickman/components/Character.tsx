import {easeOut} from '../lib/motion';
import {armPose, gaitFoot, solveLimb} from '../lib/rig';

export type Emotion = 'calm' | 'confident' | 'pleased' | 'annoyed' | 'surprised' | 'talking';
const ink = '#080810';
const cream = '#FFF1D6';

export const Face = ({emotion = 'confident', frame = 0, gaze = 0, glasses = false, talking = false}: {
  emotion?: Emotion; frame?: number; gaze?: number; glasses?: boolean; talking?: boolean;
}) => {
  const blinkPhase = frame % 203;
  const blink = easeOut(blinkPhase, 176, 181) - easeOut(blinkPhase, 183, 190);
  const open = emotion === 'surprised';
  const happy = emotion === 'pleased';
  const mouth = talking ? 5 + 11 * Math.sin(frame * .24) ** 2 : open ? 12 : 0;
  return <g stroke={cream} strokeLinecap="round" strokeLinejoin="round">
    <circle r="60" fill={ink} stroke="none"/>
    <path d="M5-59A60 60 0 0 1 56 19" fill="none" stroke="#FBC484" strokeWidth="3" opacity=".8"/>
    <g transform={`translate(${gaze*8} 3) scale(1 ${Math.max(.08, 1-blink)})`}>
      {happy ? <path d="M-33-4Q-24-20-15-4M10-4Q19-20 28-4" fill="none" strokeWidth="6"/> : open || glasses ? <g fill={cream} stroke="none"><ellipse cx="-21" cy="-7" rx="7" ry="10"/><ellipse cx="22" cy="-7" rx="7" ry="10"/></g> : <g fill={cream} strokeWidth="4">
        <path d={emotion==='annoyed'?'M-30-10L-13-5Q-16 7-23 1Z':'M-29-8L-13-6Q-16 6-23 1Z'}/>
        <path d={emotion==='annoyed'?'M13-6L30-6Q27 8 20 1Z':'M13-6L29-8Q26 6 20 1Z'}/>
      </g>}
    </g>
    {glasses && <g fill="none" stroke="#E6E7EC" strokeWidth="3.5"><circle cx="-21" cy="-5" r="16"/><circle cx="22" cy="-5" r="16"/><path d="M-5-5Q0-11 6-5M-37-5l-16 5M38-5l14-6"/></g>}
    {mouth ? <ellipse cx="3" cy="28" rx={open ? 12 : 11} ry={mouth} fill="none" strokeWidth="4.5"/> : <path d={happy?'M-21 23Q1 49 27 19':emotion==='annoyed'?'M-14 28L17 31':emotion==='calm'?'M-14 27H15':'M-17 27Q4 33 25 19'} fill="none" strokeWidth="4.5"/>}
  </g>;
};

// Same coordinates as the original rig, now with silhouette skin and sleeved arms.
export const Stickman = ({x, y, scale = 1, hero = false, walk = 0, walkAmplitude = walk === 0 ? 0 : 1, raised = 0, smile = 0, look = 0, surprised = false, frame = 0, emotion, phone = true, scarf = false, talking = false, leftHand, rightHand, seated = 0, headTilt = 0}: {
  leftHand?: {x: number; y: number}; rightHand?: {x: number; y: number}; seated?: number; headTilt?: number;
  x: number; y: number; scale?: number; hero?: boolean; walk?: number; walkAmplitude?: number; raised?: number; smile?: number; look?: number; surprised?: boolean; frame?: number; emotion?: Emotion; phone?: boolean; scarf?: boolean; talking?: boolean;
}) => {
  const stride = Math.sin(walk)*42*walkAmplitude;
  const requestedLeft = leftHand || {x: -42 - stride * .6, y: 325-raised*300};
  const requestedRight = rightHand || {x: 105 + stride * .6, y: 150-raised*230};
  const leftArm = armPose(-1, requestedLeft), rightArm = armPose(1, requestedRight);
  const lh = leftArm.end, rh = rightArm.end;
  const left = leftArm.path, right = rightArm.path;
  const leftFoot = walkAmplitude ? gaitFoot(walk * 42, .5) : {x: -31, y: 440};
  const rightFoot = walkAmplitude ? gaitFoot(walk * 42, 0) : {x: 37, y: 440};
  const leftLeg = solveLimb({x: -19, y: 250}, leftFoot, 105, 105, -1);
  const rightLeg = solveLimb({x: 20, y: 250}, rightFoot, 105, 105, -1);
  const feet = [leftLeg.end, rightLeg.end];
  const faceEmotion = emotion ?? (surprised?'surprised':hero?(smile>.4?'pleased':'confident'):'annoyed');
  return <g transform={`translate(${x} ${y}) scale(${scale})`} strokeLinecap="round" strokeLinejoin="round">
    <ellipse cy={454} rx="78" ry="12" fill="#090A12" opacity=".18"/>
    <g stroke={hero || scarf ? ink:'#302B3C'}>
      {seated > 0 ? <>
      <path d={`M-19 250Q${-25-stride+seated*105} ${340-seated*80} ${-31+stride+seated*125} 440M20 250Q${28+stride+seated*95} ${340-seated*80} ${37-stride+seated*105} 440`} fill="none" strokeWidth="20"/>
      <path d={`M${-31+stride+seated*125} 440h-13M${37-stride+seated*105} 440h14`} strokeWidth="22"/>
      </> : <>
        <path d={`${leftLeg.path}${rightLeg.path}`} fill="none" strokeWidth="20"/>
        {feet.map((foot, i) => <path key={i} d={`M${foot.x - 7} ${foot.y}h20`} strokeWidth="22"/>)}
      </>}
      {hero ? <>
        <path d="M-48 74Q-59 131-41 152H46Q57 116 46 74Q0 47-48 74Z" fill="#2761D4" strokeWidth="3"/>
        <path d="M-31 91Q0 77 31 91L42 255H-41Z" fill="url(#hoodie)" strokeWidth="3"/>
        <path d="M-6 106V161M9 106V158" stroke="#F5E6C9" strokeWidth="4"/>
        <path d="M-21 207H22L26 241H-26Z" fill="#2456AC" stroke="#193B81" strokeWidth="3"/>
        <path d="M-40 249H41" stroke="#5590F6" strokeWidth="6"/>
      </> : <path d="M0 73V261" strokeWidth="25"/>}
      <path d="M0 49V91" strokeWidth="18"/>
      {[left,right].map((d,i)=><g key={i}><path d={d} fill="none" stroke={hero||scarf?'#080810':'#302B3C'} strokeWidth={hero?33:19}/>{hero&&<path d={d} fill="none" stroke="#3177ED" strokeWidth="27"/>}</g>)}
      <ellipse cx={lh.x} cy={lh.y} rx="14" ry="17" fill={ink} stroke="none"/>
      <ellipse cx={rh.x} cy={rh.y} rx="14" ry="17" fill={ink} stroke="none"/>
    </g>
    {scarf && <g fill="#F1E3BD" stroke="#C7B991" strokeWidth="2"><rect x="-35" y="65" width="70" height="27" rx="13"/><path d="M5 89H23L31 218H9Z"/>{[0,1,2,3,4].map(i=><path key={i} d={`M${-22+i*11} 69v20`} />)}</g>}
    {phone && <g transform={`translate(${rh.x} ${rh.y}) rotate(12)`}><rect x="-15" y="-48" width="34" height="64" rx="5" fill="#0A111C" stroke="#A4AFBB" strokeWidth="2"/><rect x="-10" y="-41" width="24" height="42" rx="2" fill={hero?'#8CE0A2':'#D06C69'}/><circle cy="7" cx="2" r="3" fill="#CBD5E1"/></g>}
    <g transform={`translate(${look*7} 0) rotate(${look*9 + headTilt})`}>
      <Face emotion={faceEmotion} gaze={look} frame={frame} glasses={scarf} talking={talking}/>
    </g>
  </g>;
};
