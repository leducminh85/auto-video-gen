const fs = require('node:fs');
const path = require('node:path');
let serial = 0;
const K = (...p) => ({ keys: p.map(([at,value,ease='smooth']) => ({at,value,ease})) });
const shape = (type,attrs,extra={}) => ({id:`art-${++serial}`,type,attrs,...(typeof attrs.strokeDashoffset === 'number' ? {animate:{strokeDashoffset:K([0,attrs.strokeDashoffset],[.7,0],[1,0])}} : {}),...extra});
const rect = (x,y,width,height,fill,extra={}) => shape('rect',{x,y,width,height,fill,...extra});
const line = (d,stroke,width=4,extra={}) => shape('path',{d,fill:'none',stroke,strokeWidth:width,...extra});
const circle = (cx,cy,r,fill,extra={}) => shape('circle',{cx,cy,r,fill,...extra});
const text = (value,x,y,size=40,fill='#FFE1A3',extra={}) => shape('text',{fontSize:size,fill,fontWeight:700,...extra},{x,y,text:value});
const group = (children,extra={}) => ({id:`group-${++serial}`,type:'g',children,...extra});
const person = (id,x,y,extra={}) => ({id,type:'character',x,y,phone:false,leftHandX:-55,leftHandY:245,rightHandX:55,rightHandY:245,...extra});
const hero = (x,y,extra={}) => person('leo',x,y,{hero:true,...extra});
const friend = (x,y,extra={}) => person('friend',x,y,{scarf:true,emotion:'calm',...extra});
const book = (extra={}) => group([shape('path',{d:'M-65-25Q-30-45 0-20Q35-45 65-25V35Q35 20 0 40Q-30 20-65 35Z',fill:'#F1E2BC',stroke:'#8C6243',strokeWidth:5}),line('M0-20V40','#A68C65',3),line('M-50-10L-12-5M12-5L50-10M-50 3L-12 8M12 8L50 3','#B2A082',2)],extra);
function park(night=false){return group([
 rect(0,0,1920,1080,night?'#253142':'#D6DCCB'),circle(1500,230,100,night?'#CDD4C8':'#F8EAC4'),
 ...[100,360,640,980,1240,1580].map((x,i)=>rect(x,370-(i%3)*70,160,420,night?'#354457':'#A9B9B0')),
 rect(0,710,1920,370,night?'#48544F':'#9FAF7D'),shape('path',{d:'M0 930Q800 640 1920 810V1080H0Z',fill:night?'#7D7B70':'#C9BCA0'}),
 line('M280 800Q335 590 300 230M315 520L160 370M314 450L470 310','#665443',40),
 ...[[160,280,140],[310,195,160],[480,270,150],[270,350,170]].map(([x,y,r])=>circle(x,y,r,night?'#3C5D53':'#718B5E')),
 ...[695,735,775].map(y=>rect(1040,y,550,23,night?'#806E55':'#9C744B')),
 line('M1070 710V945M1560 710V945M1030 810H1600','#454B44',16),
 line('M1710 800V260M1670 265H1750','#4C5856',12),rect(1678,270,65,95,night?'#FFE2A0':'#E8DFC2',{rx:8}),
 ...(night?[shape('path',{d:'M1680 365L1500 920H1910L1740 365Z',fill:'#FFE2A0',opacity:.07})]:[])
]);}
function room(){return group([rect(0,0,1920,1080,'#C8B99D'),rect(0,780,1920,300,'#8A7762'),rect(310,160,1280,560,'#264C43',{stroke:'#795D43',strokeWidth:22}),rect(305,720,1300,20,'#AC8C62'),...Array.from({length:12},(_,i)=>line(`M${i*190} 1080L${500+i*80} 780`,'#725D4B',2)),rect(80,200,140,370,'#DBE4DC',{stroke:'#EEE2C5',strokeWidth:12}),line('M150 200V570M80 385H220','#EEE2C5',10)]);}
function diagram(){return group([rect(0,0,1920,1080,'#111D2D'),...Array.from({length:12},(_,i)=>line(`M0 ${120+i*75}H1920`,'#233449',1)),...Array.from({length:20},(_,i)=>line(`M${i*100} 56V1024`,'#233449',1))]);}
function shot(direction,layers,camera){return {version:1,styleId:'STICKMAN_500IQ_V1',background:'#111D2D',direction,layers,...(camera?{camera}:{})};}
function buildShots(){
 const shots=[];
 shots.push([shot('Opening: move beyond the IQ distribution to reveal Leo. The gold number is the narrated hypothetical, not a factual measurement.',[
 diagram(),line('M180 800Q540 800 670 550Q810 160 940 550Q1070 800 1330 800','#D9D8CB',6),
 ...Array.from({length:13},(_,i)=>person(`crowd-${i}`,280+i*72,710-Math.sin(i/12*Math.PI)*170,{scale:.23,opacity:.45})),
 hero(1580,460,{scale:.8,look:-.5}),text('100',775,855,38),text('1000',1430,280,112),
 line('M1050 530H1400M1370 510L1400 530L1370 550','#E2B35A',5,{strokeDasharray:'400',strokeDashoffset:400})
 ],{scale:K([0,1],[.3,1],[1,1.12]),x:K([0,0],[1,-90])})]);
 shots.push([shot('Classroom: recurring Leo closes his book while five students continue studying. Establish the chalkboard for later mathematical payoff.',[
 room(),...Array.from({length:5},(_,i)=>group([line(`M${380+i*260} 740H${455+i*260}V880M${380+i*260} 740V880`,'#68513D',8),rect(350+i*260,755,160,14,'#AE895B'),line(`M${370+i*260} 770V900M${490+i*260} 770V900`,'#68513D',8)])),...Array.from({length:5},(_,i)=>person(`student-${i}`,410+i*260,600,{scale:.55,seated:1,look:-.3,children:[book({attachment:'rightHand',scale:.7})]})),
 hero(1400,370,{scale:1.1,emotion:'confident',rightHandX:K([0,95],[.4,110],[1,110]),rightHandY:K([0,180],[.4,120],[1,120]),children:[book({attachment:'rightHand',rotation:K([0,0],[.6,-70],[1,-70])})]}),
 text('?',800,420,150,'#A6BEB0')],{scale:1.05})]);
 shots.push([
 shot('Park establishing: Leo walks to the same tree later used in the ending. His hand touches the bark before the analysis appears.',[park(),hero(K([0,830],[.65,490],[1,490]),450,{scale:.9,walking:true,look:-1,leftHandX:K([0,-55],[.65,-55],[1,-180]),leftHandY:K([0,245],[.65,245],[1,140])}),friend(1530,550,{scale:.75,look:-1})]),
 shot('Botany insert: macro leaf and roots draw sequentially after contact. Keep the same tree colours; show a mechanism instead of a paragraph.',[
 diagram(),shape('path',{d:'M960 750Q590 480 980 210Q1320 470 960 750Z',fill:'#567B59',stroke:'#B7CA91',strokeWidth:8}),line('M960 750L980 250M968 560L790 410M970 480L1130 350M966 650L1130 520','#D7DDA6',7,{strokeDasharray:'1400',strokeDashoffset:1400}),
 ...[0,1,2,3].map((n)=>group([circle(710+n*170,875,32,'#D3BC7C'),line(`M${710+n*170} 875L960 750`,'#D3BC7C',3)],{opacity:K([0,0],[.25+n*.12,0],[.4+n*.12,1],[1,1])})),
 hero(1640,560,{scale:.65,look:-1})],{scale:K([0,1],[1,1.07])})]);
 shots.push([shot('Same park: companion approaches from the right; Leo anticipates the speech bubble before the companion starts talking.',[
 park(),hero(760,450,{scale:.95,look:1}),friend(K([0,1450],[.45,1190],[1,1190]),450,{scale:.95,walking:true,look:-1,speech:K([0,0,'hold'],[.65,1],[1,1]),rightHandX:K([0,55],[.6,55],[1,-90]),rightHandY:K([0,245],[.6,245],[1,150])}),
 group([shape('path',{d:'M1000 200H1400V330H1210L1160 380V330H1000Z',fill:'#F3E7CA',stroke:'#827B6B',strokeWidth:4}),text('...',1125,295,80,'#42494C')],{opacity:K([0,0],[.25,1],[1,1])})])]);
 shots.push([shot('Leo POV: a symbolic calendar and fading silhouette express the fictional prediction without inventing an actual date.',[
 {...park(),blur:9},friend(1130,400,{scale:1.3,look:-1,speech:1}),group([rect(330,220,470,520,'#E9DFC6',{rx:10}),rect(330,220,470,90,'#8C5950'),...Array.from({length:20},(_,i)=>rect(370+(i%5)*80,350+Math.floor(i/5)*80,45,35,'#ACA58F')),line('M400 675L720 365M400 365L720 675','#9F5B50',9)],{opacity:K([0,0],[.3,.9],[.8,.9],[1,0])}),
 group([circle(570,450,40,'#B18C56'),line('M520 390L620 510M620 390L520 510','#F0D49A',5)],{opacity:K([0,0],[.4,0],[.8,1],[1,1])})],{scale:1.12})]);
 shots.push([shot('Return to the established classroom. Leo crosses to the unsolved board while three researchers turn toward him.',[
 room(),...['a','b','c'].map((id,i)=>person(`researcher-${id}`,430+i*460,590,{scale:.65,look:K([0,0],[1,.8])})),hero(K([0,1520],[.7,1150],[1,1150]),370,{scale:1,walking:true,look:-1,leftHandX:K([0,-55],[.6,-55],[1,-200]),leftHandY:K([0,245],[.6,245],[1,80])}),
 text('x = ?',650,400,110,'#D5DCC1'),line('M500 525H1000','#B4CAB8',4,{strokeDasharray:'12 14'})])]);
 shots.push([shot('Chalk insert and payoff: one connected proof draws across the board, then the researchers react. Same room, same action continued.',[
 room(),group([text('x',470,360,110,'#E6E9D4'),line('M580 330H900M880 310L900 330L880 350','#E5C37C',7,{strokeDasharray:'380',strokeDashoffset:380}),text('✓',1040,400,180,'#E5C37C')],{opacity:K([0,0],[.4,1],[1,1])}),
 ...Array.from({length:3},(_,i)=>person(`researcher-${i}`,470+i*420,690,{scale:.6,emotion:'surprised',look:.8,headTilt:K([0,0],[.5,0],[.75,-9],[1,-9])})),hero(1160,430,{scale:.9,emotion:'pleased',look:-1,leftHandX:K([0,-200],[.6,-130],[1,-55]),leftHandY:K([0,-80],[.6,-70],[1,245]),children:[{...line('M0 0L12-5','#EFE8CC',7),attachment:'leftHand'}]})],{scale:1.1,y:40})]);
 shots.push([shot('Tonal turn: close on Leo as confidence settles into discomfort; hold the face rather than adding a title.',[
 {...park(true),blur:10},hero(970,440,{scale:2.6,emotion:'annoyed',look:K([0,.5],[.6,0],[1,0]),headTilt:K([0,0],[1,7])})],{scale:K([0,1],[1,1.08])})]);
 shots.push([shot('Subjective processing: signals travel through a small network around the head, accelerate, then crowd the frame. Each signal follows a meaningful connection.',[
 diagram(),hero(960,550,{scale:1.4,emotion:'annoyed'}),...Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;const x=960+Math.cos(a)*620,y=520+Math.sin(a)*350;return group([line(`M960 520L${x} ${y}`,'#607C89',3),circle(x,y,34,'#D9BD7B'),shape('circle',{r:8,fill:'#FFE7A4'},{x:K([0,x],[.25,960],[.3,x],[.5,960],[.55,x],[.7,960],[.75,x],[.85,960],[.9,x],[1,960]),y:K([0,y],[.25,520],[.3,y],[.5,520],[.55,y],[.7,520],[.75,y],[.85,520],[.9,y],[1,520])})]);})])]);
 shots.push([shot('Return to park conversation. Companion speaks slowly; the clock hands sweep while Leo waits. The same eye line carries the previous encounter.',[
 park(),friend(650,450,{scale:1,speech:1,look:1,rightHandX:K([0,55],[.5,140],[1,55]),rightHandY:K([0,245],[.5,150],[1,245])}),hero(1250,450,{scale:1,emotion:'annoyed',look:-1,headTilt:K([0,0],[1,10])}),
 group([circle(960,260,105,'#E7DFC9',{stroke:'#787C6E',strokeWidth:7}),line('M960 260H1005','#424C50',9)],{x:0}),
 group([line('M0 0V-75','#A97443',6)],{x:960,y:260,rotation:K([0,0,'linear'],[1,1440])}),text('5 ph\u00fat',400,250,48,'#514B40'),text('10 n\u0103m',1250,250,48,'#514B40')])]);
 shots.push([shot('Anticipation becomes emptiness: the same companion closeup speaks after a thought bubble is already complete. Background Leo no longer reacts.',[
 {...park(),blur:8},hero(1320,470,{scale:.75,emotion:'annoyed',look:-1}),friend(620,440,{scale:2,speech:K([0,0,'hold'],[.45,1],[1,1]),look:.7}),
 group([rect(1000,200,570,180,'#F0E7D1',{rx:16}),text('...',1190,325,100,'#4F5551')],{opacity:K([0,0],[.2,1],[1,1])})])]);
 shots.push([shot('The possible outcomes collapse onto the same known result. Use connected branches, then extinguish alternatives in order.',[
 diagram(),hero(280,470,{scale:.8,emotion:'annoyed',look:1}),...Array.from({length:3},(_,i)=>group([line(`M500 600L900 ${280+i*270}L1450 550`,'#C5AA70',5),circle(900,280+i*270,45,'#D6C394')],{opacity:K([0,1],[.3+i*.15,1],[.5+i*.15,.12],[1,.12])})),circle(1450,550,100,'#D6C394'),text('...',1400,570,62,'#40494D')])]);
 shots.push([shot('Return to the original tree and bench at dusk. Leo sits; the companion walks away on the established path. No unrelated new location.',[
 park(true),friend(K([0,850],[1,430]),470,{scale:.8,walking:true,look:-1}),hero(1280,510,{scale:.9,seated:1,emotion:'annoyed',headTilt:K([0,0],[1,14]),look:-.5})],{scale:1.12,x:-80})]);
 shots.push([shot('Final wide pullback. The same living world carries on around a motionless Leo; his unused book remains in his lap. Hold the quiet consequence.',[
 park(true),...Array.from({length:3},(_,i)=>person(`passer-${i}`,K([0,100+i*240],[1,460+i*240]),620,{scale:.45,walking:true,opacity:.6})),hero(1280,510,{scale:.9,seated:1,emotion:'annoyed',headTilt:14,look:-.6,rightHandX:20,rightHandY:250,children:[book({attachment:'rightHand',scale:.6})]})],{scale:K([0,1.25],[1,1]),x:K([0,-90],[1,0])})]);
 return shots;
}
async function main(){
 const source=path.resolve(process.argv[2] || 'public/projects/7589b3c4-e1ff-44ac-8b96-b201f6c6da1d/scenes.json');
 const project=JSON.parse(fs.readFileSync(source,'utf8'));
 if(project.scenes.length!==14)throw new Error('This authored storyboard targets the 14-scene IQ 1000 script.');
 const designs=buildShots();
 project.metadata.title += ' - b\u1ea3n d\u1ef1ng l\u1ea1i'; delete project.metadata.project_id;
 project.metadata.story_direction='Recurring Leo and companion; classroom -> park -> classroom payoff -> same park conversation -> lonely dusk. Existing narration and timing preserved.';
 project.scenes.forEach((scene,i)=>{let offset=0;scene.beats=designs[i].map((design,j)=>{const frames=j===designs[i].length-1?scene.duration_in_frames-offset:Math.round(scene.duration_in_frames/designs[i].length);const beat={id:`iq-rebuild-${i}-${j}`,sub_index:j+1,title:scene.title,caption:scene.text,prompt:design.direction,remotion:design,image_method:'remotion',image_file:'',start_frame_offset:offset,duration_in_frames:frames,duration_in_seconds:frames/60};offset+=frames;return beat;});});
 const root=path.resolve('data/iq-story-rebuild');fs.mkdirSync(root,{recursive:true});
 fs.writeFileSync(path.join(root,'draft.json'),JSON.stringify(project,null,2));
 let last=-1;await require('./remotionRender.cjs').renderRemotion(project,root,path.resolve('public'),p=>{if(p>=last+10){last=p;console.log(`Render ${p}%`);}});
 let saved;
 const resultFile=path.join(root,'result.json');
 if(fs.existsSync(resultFile)) {
  const {project_id}=JSON.parse(fs.readFileSync(resultFile,'utf8'));
  const store=require('./projectStore.cjs').createStore(path.resolve('public'));
  store.read(project_id);
  saved={...project,metadata:{...project.metadata,project_id,updated_at:new Date().toISOString()}};
  const target=path.resolve('public/projects',project_id);
  if(path.dirname(target)!==path.resolve('public/projects'))throw new Error('Invalid output project');
  fs.copyFileSync(path.join(root,'final-video.mp4'),path.join(target,'final-video.mp4'));
  require('./projectEditor.cjs').saveProject(saved,target);
 } else saved=require('./projectStore.cjs').createStore(path.resolve('public')).create(project,path.join(root,'final-video.mp4'));
 fs.writeFileSync(path.join(root,'result.json'),JSON.stringify({project_id:saved.metadata.project_id}));console.log('PROJECT',saved.metadata.project_id);
}
module.exports={buildShots};if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1});
