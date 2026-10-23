import React, {useState} from 'react';
import './StoryboardReview.css';
export interface BoardScene {title:string;text:string;direction:string;actions:string[];layout:{setting?:string;subject?:string;prop?:string;subjectX?:number;propX?:number};start:number;duration:number}
export interface StoryboardDraft {id:string;revision:number;status:string;title:string;audio?:string;estimatedTiming?:boolean;scenes:BoardScene[]}
const time=(n:number)=>`${Math.floor(n/60)}:${(n%60).toFixed(1).padStart(4,'0')}`;
export function StoryboardReview({draft,error,onChange,onApprove,onClose,onBack}:{draft:StoryboardDraft;error:string|null;onChange:(d:StoryboardDraft)=>void;onApprove:(d:StoryboardDraft)=>void;onClose:()=>void;onBack:()=>void}) {
  const [selected,setSelected]=useState(0);
  const [dirty,setDirty]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const scene=draft.scenes[selected];
  const propText=(scene.layout?.prop||'').toLowerCase();
  const phone=/phone|điện thoại/.test(propText);
  const chart=/chart|data|biểu đồ|dữ liệu|thuật toán/.test(propText);
  const edit=(change:Partial<BoardScene>)=>{onChange({...draft,scenes:draft.scenes.map((s,i)=>i===selected?{...s,...change}:s)});setDirty(true);setMessage('');};
  async function save(approve=false,close=false) {
    setBusy(true);setMessage('');
    try {
      let saved=draft;
      if(dirty) {
        const r=await fetch(`/api/storyboard/${draft.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)});
        saved=await r.json();if(!r.ok)throw new Error((saved as any).error||'Không lưu được storyboard.');
        onChange(saved);setDirty(false);
      }
      if(close)onClose();else if(approve)onApprove(saved);else setMessage('Đã lưu storyboard.');
    }catch(e:any){setMessage(e.message);}finally{setBusy(false);}
  }
  return <section className="board-review">
    <header className="board-header"><div><p className="board-eyebrow">BƯỚC 2 · DUYỆT TRƯỚC KHI DỰNG</p><h1>{draft.title}</h1><p>{draft.scenes.length} cảnh · {time(draft.scenes.reduce((n,s)=>n+s.duration,0))} · Mỗi cảnh là một chuỗi hành động liên tục</p></div><button className="btn btn-secondary" onClick={()=>dirty?save(false,true):onClose()} disabled={busy}>{dirty?'Lưu & đóng':'Đóng'}</button></header>
    <div className="board-workspace">
      <nav className="board-scenes" aria-label="Danh sách cảnh">{draft.scenes.map((s,i)=><button key={i} aria-current={selected===i?'step':undefined} onClick={()=>setSelected(i)}><span className="board-number">{String(i+1).padStart(2,'0')}</span><span><strong>{s.title}</strong><small>{time(s.start)} — {time(s.start+s.duration)}</small></span></button>)}</nav>
      <main className="board-detail">
        <div className="board-scene-heading"><h2>Cảnh {selected+1}</h2><span>{scene.duration.toFixed(1)} giây {draft.estimatedTiming?'(ước tính)':''} · Một bố cục xuyên suốt</span></div>
        <div className="board-preview">
          <svg viewBox="0 0 800 360" role="img" aria-label={`Sơ đồ: ${scene.layout?.subject||'Chủ thể'} tương tác với ${scene.layout?.prop||'đạo cụ'} trong ${scene.layout?.setting||'bối cảnh'}`}>
            <rect width="800" height="360" fill="#ded0b8"/><path d="M0 300H800" stroke="#a18b6a" strokeWidth="3"/>
            <rect x="55" y="50" width="160" height="130" fill="#a4b6b1" stroke="#6b786f" strokeWidth="5"/><path d="M135 50V180M55 115H215" stroke="#6b786f" strokeWidth="4"/>
            <g transform={`translate(${(scene.layout?.subjectX??305)-305} 0)`}><circle cx="305" cy="105" r="40" fill="#171a20"/><circle cx="293" cy="101" r="4" fill="#fff5dc"/><circle cx="316" cy="101" r="4" fill="#fff5dc"/>
            <path d="M293 119Q305 128 318 119" fill="none" stroke="#fff5dc" strokeWidth="3"/>
            <path d="M305 147V234M305 167L363 204L420 204M305 171L274 215M305 234L278 299M305 234L334 299" fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round"/>
            <path d="M280 151H329L324 215H286Z" fill="#2d63b7"/>
            </g><g transform={`translate(${(scene.layout?.propX??514)-514} 0)`}><rect x={phone?475:414} y={phone?110:140} width={phone?78:200} height={phone?130:95} rx={phone?10:5} fill="#172139"/>{chart&&<path d="M432 210L470 195L510 198L555 165L590 155" fill="none" stroke="#e4bb67" strokeWidth="4"/>}<text x="514" y={phone?266:chart?130:191} textAnchor="middle" fill={phone||chart?'#222':'#f3e9cf'} fontSize="18">{(scene.layout?.prop||'Đạo cụ').slice(0,25)}</text>
            </g><path d="M397 240H650M420 244V300M632 244V300" stroke="#805e43" strokeWidth="12"/>
            <text x={scene.layout?.subjectX??305} y="337" textAnchor="middle" fill="#222" fontSize="17">{(scene.layout?.subject||'Chủ thể').slice(0,25)}</text>
            <text x="760" y="32" textAnchor="end" fill="#403a31" fontSize="17">{(scene.layout?.setting||'Bối cảnh').slice(0,35)}</text>
          </svg>
          <p>Sơ đồ ý tưởng để duyệt nội dung · Không phải khung hình video cuối</p>
        </div>
        <div className="board-narration"><h3>Lời đọc · {time(scene.start)} — {time(scene.start+scene.duration)}</h3><p>{scene.text}</p>{draft.audio&&<audio controls preload="metadata" key={`${draft.audio}-${selected}`} src={`/audio/${draft.audio}#t=${scene.start},${scene.start+scene.duration}`} aria-label={`Nghe audio cảnh ${selected+1}`} />}</div>
        <label>Tên cảnh<input value={scene.title} onChange={e=>edit({title:e.target.value})} maxLength={160}/></label>
        <div className="board-layout-fields">{([['setting','Bối cảnh'],['subject','Chủ thể'],['prop','Đạo cụ / dữ liệu']] as const).map(([key,label])=><label key={key}>{label}<input value={scene.layout?.[key]||''} maxLength={120} onChange={e=>edit({layout:{...scene.layout,[key]:e.target.value}})}/></label>)}</div>
        <div className="board-layout-fields">{([['subjectX','Vị trí chủ thể',305],['propX','Vị trí đạo cụ',514]] as const).map(([key,label,fallback])=><label key={key}>{label}<input type="range" min="100" max="700" value={scene.layout?.[key]??fallback} onChange={e=>edit({layout:{...scene.layout,[key]:Number(e.target.value)}})}/></label>)}</div>
        <label>Diễn biến & bố cục<textarea rows={6} value={scene.direction} onChange={e=>edit({direction:e.target.value})} maxLength={6000}/></label>
        <div className="board-actions"><h3>Chuỗi hành động trong cảnh</h3>{(scene.actions||[]).map((action,i)=><div className="board-action" key={i}><span>{i+1}</span><label className="board-action-label">Hành động {i+1}<textarea rows={2} value={action} maxLength={600} onChange={e=>edit({actions:scene.actions.map((a,j)=>j===i?e.target.value:a)})}/></label><button onClick={()=>edit({actions:scene.actions.filter((_,j)=>j!==i)})} aria-label={`Xóa hành động ${i+1}`}>×</button></div>)}<button className="btn btn-secondary" disabled={(scene.actions||[]).length>=6} onClick={()=>edit({actions:[...(scene.actions||[]),'Hành động mới']})}>Thêm hành động</button></div>
      </main>
    </div>
    <footer className="board-footer"><div><button className="btn btn-secondary" disabled={busy||dirty} onClick={onBack}>Quay lại thiết lập</button><div role="status">{message||error||(dirty?'Có thay đổi chưa lưu':'Bản nháp đã lưu. Video chỉ được dựng sau khi bạn duyệt.')}</div></div><div><button className="btn btn-secondary" disabled={busy} onClick={()=>save()}>Lưu chỉnh sửa</button><button className="btn btn-primary" disabled={busy} onClick={()=>save(true)}>{busy?'Đang lưu…':'Duyệt storyboard & dựng video'}</button></div></footer>
  </section>;
}
