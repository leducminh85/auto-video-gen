import React from 'react';
export function DirectorSketch({location,action,camera,states,characters,vfx,subjectX}:{location:string;action:string;camera:string;states:Record<string,{pose:string;expression:string}>;characters:{id:string;appearance:string}[];vfx:string[];subjectX:number}) {
  const cue=`${location} ${action} ${vfx.join(' ')}`.toLowerCase();
  const stage=/stage|sân khấu|microphone|micro|đám đông|thuyết trình/.test(cue);
  const boundary=/chalk|phấn|comfort.zone|vùng an toàn|boundary/.test(cue);
  const door=/door|cửa|gym/.test(cue)&&!stage;
  const actors=Object.entries(states);
  return <svg viewBox="0 0 800 360" role="img" aria-label={`${location}: ${action}`}>
    <rect width="800" height="360" fill="#ded0b8"/><path d="M0 282H800" stroke="#9d896f" strokeWidth="3"/>
    <text x="30" y="34" fill="#403a31" fontSize="18">{location}</text>
    {stage&&<><path d="M50 282V310H750V282" fill="#9c7958"/><path d="M520 280V148L548 128" fill="none" stroke="#30343d" strokeWidth="6"/><rect x="534" y="114" width="40" height="16" rx="8" fill="#30343d"/></>}
    {door&&<><rect x="520" y="70" width="155" height="210" fill="#94aaa8" stroke="#515d5c" strokeWidth="7"/><path d="M640 164V200" stroke="#f5e6bf" strokeWidth="6"/></>}
    {boundary&&<ellipse cx={subjectX} cy="274" rx="145" ry="26" fill="none" stroke="#fffdf3" strokeWidth="5" strokeDasharray="12 8"/>}
    {actors.map(([id,state],i)=>{
      const appearance=characters.find(c=>c.id===id)?.appearance||'';
      const white=/white|trắng/i.test(appearance),shadow=/shadow|bóng|red|đỏ/i.test(id+' '+appearance);
      const fill=white?'#fffaf0':shadow?'#202127':'#344c63';
      const ink=white?'#373e44':'#fff7dd';
      const pose=state.pose.toLowerCase();
      const hesitant=/hesita|cúi|anxious|retreat|lùi|nervous|co lại/.test(pose+' '+state.expression);
      const open=/speaking|confident|open|raise|vươn|giơ|nói|tự tin/.test(pose+' '+state.expression);
      const x=actors.length===1?subjectX:subjectX+(i-(actors.length-1)/2)*145;
      return <g key={id} transform={`translate(${x} 0)`}>
        <g transform={`rotate(${hesitant?9:0} 0 165)`} stroke={shadow?'#a9433d':white?'#535b63':fill} strokeWidth="2">
          <circle cy="108" r="31" fill={fill}/><path d="M-18 143H18L22 209H-22Z" fill={fill}/>
          <path d={`M-14 155L-38 ${open?131:195}M14 155L47 ${open?132:194}M-10 205L-25 269M10 205L30 269`} stroke={fill} strokeWidth="12" strokeLinecap="round" fill="none"/>
          <circle cx="-10" cy="105" r="3" fill={ink} stroke="none"/><circle cx="10" cy="105" r="3" fill={ink} stroke="none"/>
          <path d={hesitant?'M-9 121Q0 115 9 121':'M-9 119Q0 127 9 119'} stroke={ink} fill="none"/>
        </g>
        <text y="311" textAnchor="middle" fill="#292e32" fontSize="16">{id}</text><text y="334" textAnchor="middle" fill="#454b51" fontSize="12">{state.pose.slice(0,28)}</text>
      </g>;
    })}
    {!actors.length&&<text x="400" y="175" textAnchor="middle" fill="#30343d" fontSize="22">{vfx.join(' · ').slice(0,60)||'Cảnh không có nhân vật'}</text>}
    <text x="770" y="34" textAnchor="end" fill="#454b51" fontSize="13">Camera: {camera.slice(0,36)}</text>
  </svg>;
}
