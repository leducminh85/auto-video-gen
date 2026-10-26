const assert=require('node:assert/strict');const {chromium}=require('playwright');const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});let generated=0,approved;
 let draft={id:'test-storyboard-123',revision:1,status:'draft',title:'Duyệt video ex-au1',scenes:[{title:'Đăng video',text:'Ba giây sau, một triệu lượt xem.',direction:'Leo đăng video, bộ đếm tăng và Leo phản ứng.',actions:['Nhấn đăng','Lượt xem tăng','Leo nhìn kết quả'],layout:{setting:'Studio',subject:'Leo',prop:'Laptop'},start:0,duration:6},{title:'Cuộc gọi',text:'YouTube gọi điện.',direction:'Leo nhìn sang rồi nhấc điện thoại.',actions:['Điện thoại rung','Leo nhấc máy'],layout:{setting:'Studio',subject:'Leo',prop:'Điện thoại'},start:6,duration:6}]};
 draft.sceneList={metadata:{title:draft.title,fps:30,theme:'Visual storytelling',characters:[{id:'leo',appearance:'White minimalist figure'}],locations:['Studio']},scenes:[]};
 draft.scenes.forEach(s=>{s.scene_spec={story:{sequence:'Khám phá',role:'evidence',intent:'Thấy kết quả của hành động đăng',evidence:'Bộ đếm thay đổi sau thao tác',before:'Video chưa đăng',after:'Video có người xem',focus:'Trạng thái video',framing:'insert',cut_reason:'Thấy bằng chứng',beats:s.actions.map((action,i)=>({at:i/s.actions.length,action}))},location:'Studio',camera_movement:'static',character_states:{leo:{pose:'hesitating',expression:'anxious'}},vfx:[],audio:{narration_subtitle:s.text,shadow_voice:'',sfx:[],music_mood:'quiet'},remotion_component_suggestion:'<StudioScene />'};});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.addInitScript(()=>localStorage.setItem('pending_storyboard_id','test-storyboard-123'));
 await page.route('**/api/**',route=>{
 const u=new URL(route.request().url()).pathname;
 if(u.endsWith('/stop')){draft={...draft,status:'failed',approvedRevision:draft.revision};return route.fulfill({json:draft});}
 if(u.startsWith('/api/storyboard/')){if(route.request().method()==='PUT')draft={...route.request().postDataJSON(),revision:draft.revision+1};return route.fulfill({json:draft});}
 if(u==='/api/generate-video'){generated++;approved=route.request().postDataJSON();draft={...draft,status:'failed',approvedRevision:draft.revision};return route.fulfill({contentType:'application/x-ndjson',body:JSON.stringify({type:'error',error:'Kiểm thử đã dừng trước render.'})+'\n'});}
 return route.fulfill({json:u==='/api/projects'?[]:{}});
 });
 await page.goto('http://localhost:5173/project/new');
 await page.getByRole('heading',{name:'Duyệt video ex-au1'}).waitFor();assert.equal(generated,0);
 await page.getByText('Chỉnh ý nghĩa và cỡ cảnh',{exact:true}).click();
 await page.getByLabel('Bằng chứng nhìn thấy').fill('Trạng thái chuyển sang đã đăng, lượt xem bắt đầu tăng.');
 await page.getByLabel('Cỡ cảnh').selectOption('close');
 await page.getByLabel('Chuyển động camera').fill('slow_push_in');
 await page.getByLabel('Diễn biến & bố cục').fill('Leo nhấn chuột, nhìn số tăng rồi mỉm cười.');
 await page.getByRole('button',{name:'Lưu chỉnh sửa'}).click();await page.getByText('Đã lưu storyboard.').waitFor();
 assert.equal(draft.scenes[0].scene_spec.story.framing,'close');assert.match(draft.scenes[0].scene_spec.story.evidence,/đã đăng/);
 assert.equal(draft.scenes[0].scene_spec.camera_movement,'slow_push_in');assert.equal(draft.scenes[0].direction,'Leo nhấn chuột, nhìn số tăng rồi mỉm cười.');
 await page.reload();await page.getByLabel('Diễn biến & bố cục').waitFor();assert.equal(await page.getByLabel('Diễn biến & bố cục').inputValue(),draft.scenes[0].direction);
 fs.mkdirSync('reports/storyboard-approval',{recursive:true});await page.screenshot({path:'reports/storyboard-approval/desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'reports/storyboard-approval/mobile.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.getByRole('button',{name:/Cuộc gọi/}).click();await page.getByLabel('Đạo cụ / dữ liệu',{exact:true}).fill('Điện thoại đang rung');
 await page.getByRole('button',{name:'Duyệt storyboard & dựng video'}).click();await page.getByText('Kiểm thử đã dừng trước render.').waitFor();
 assert.equal(generated,1);assert.equal(approved.storyboardId,draft.id);assert.equal(approved.revision,3);assert.equal(draft.scenes[1].layout.prop,'Điện thoại đang rung');assert.deepEqual(errors,[]);
 await page.getByRole('button',{name:'Tiếp tục dựng',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Duyệt storyboard & dựng video'}).count(),0);
 await page.reload();await page.getByRole('button',{name:'Tiếp tục dựng',exact:true}).click();
 await page.getByText('Kiểm thử đã dừng trước render.').waitFor();assert.equal(generated,2);assert.equal(approved.revision,3);
 draft={...draft,status:'building',approvedRevision:undefined};
 await page.reload();await page.getByRole('heading',{name:'Tác vụ chưa hoàn tất',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Chờ tác vụ kết thúc',exact:true}).isDisabled(),true);
 assert.equal(await page.getByRole('button',{name:'Duyệt storyboard & dựng video'}).count(),0);
 await page.getByRole('button',{name:'Dừng tác vụ bị treo',exact:true}).click();
 await page.getByRole('button',{name:'Tiếp tục dựng',exact:true}).waitFor();assert.equal(generated,2);
 console.log('Storyboard UI: edit, save, reload, mobile and explicit approval passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
