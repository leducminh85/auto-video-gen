import type {profilePose} from '../lib/profileRig';

export function ProfileCharacter({pose, frame, headTilt = 0}: {pose: ReturnType<typeof profilePose>; frame: number; headTilt?: number}) {
  const {leftArm, rightArm, leftLeg, rightLeg, bodyY} = pose;
  const blink = frame % 203 >= 178 && frame % 203 < 184;
  const arm = (part: typeof leftArm, color: string) => <g>
    <path d={part.path} fill="none" stroke={color} strokeWidth="23"/>
    <circle cx={part.end.x} cy={part.end.y} r="10" fill="#23252A"/>
  </g>;
  const leg = (part: typeof leftLeg, color: string) => <g>
    <path d={part.path} fill="none" stroke={color} strokeWidth="21"/>
    <path d={`M${part.end.x-5} ${part.end.y}h23`} stroke={color} strokeWidth="16"/>
  </g>;
  return <g strokeLinecap="round" strokeLinejoin="round">
    <ellipse cy="451" rx="53" ry="7" fill="#27272A" opacity=".12"/>
    {leg(leftLeg, '#555B65')}
    {arm(leftArm, '#315B82')}
    {leg(rightLeg, '#252B35')}
    <g transform={`translate(0 ${bodyY})`}>
      <path d="M7 47V85" stroke="#23252A" strokeWidth="17"/>
      <path d="M-23 80Q6 68 31 84L28 247Q4 254-25 246L-28 110Z" fill="#447AA5"/>
      <path d="M-24 247H28" stroke="#28516F" strokeWidth="6"/>
      <g transform={`translate(9 0) rotate(${headTilt})`}>
        <path d="M45-21Q55-7 54 3L66 12Q67 17 53 19Q49 52 18 54C-43 56-55 13-42-24C-28-68 30-67 45-21Z" fill="#23252A"/>
        {blink ? <path d="M29-7h10" stroke="#FFF3DB" strokeWidth="3"/> : <ellipse cx="35" cy="-7" rx="3.5" ry="5" fill="#FFF3DB"/>}
        <path d="M38 29h12" stroke="#FFF3DB" strokeWidth="2.5"/>
      </g>
    </g>
    {arm(rightArm, '#447AA5')}
  </g>;
}
