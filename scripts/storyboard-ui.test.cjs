const assert=require('node:assert/strict');const {chromium}=require('playwright');const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});let generated=0,approved;
 let draft={id:'test-storyboard-123',revision:1,status:'draft',title:'Duyệt video ex-au1',scenes:[{title:'Đăng video',text:'Ba giây sau, một triệu lượt xem.',direction:'Leo đăng video, bộ đếm tăng và Leo phản ứng.',actions:['Nhấn đăng','Lượt xem tăng','Leo nhìn kết quả'],layout:{setting:'Studio',subject:'Leo',prop:'Laptop'},start:0,duration:6.8},{title:'Cuộc gọi',text:'YouTube gọi điện.',direction:'Leo nhìn sang rồi nhấc điện thoại.',actions:['Điện thoại rung','Leo nhấc máy'],layout:{setting:'Studio',subject:'Leo',prop:'Điện thoại'},start:6.8,duration:6}]};
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.addInitScript(()=>localStorage.setItem('pending_storyboard_id','test-storyboard-123'));
 await page.route('**/api/**',route=>{
 const u=new URL(route.request().url()).pathname;
 if(u.startsWith('/api/storyboard/')){if(route.request().method()==='PUT')draft={...route.request().postDataJSON(),revision:draft.revision+1};return route.fulfill({json:draft});}
 if(u==='/api/generate-video'){generated++;approved=route.request().postDataJSON();return route.fulfill({contentType:'application/x-ndjson',body:JSON.stringify({type:'error',error:'Kiểm thử đã dừng trước render.'})+'\n'});}
 return route.fulfill({json:u==='/api/projects'?[]:{}});
 });
 await page.goto('http://localhost:5173/project/new');
 await page.getByRole('heading',{name:'Duyệt video ex-au1'}).waitFor();assert.equal(generated,0);
 await page.getByLabel('Diễn biến & bố cục').fill('Leo nhấn chuột, nhìn số tăng rồi mỉm cười.');
 await page.getByRole('button',{name:'Lưu chỉnh sửa'}).click();await page.getByText('Đã lưu storyboard.').waitFor();
 assert.equal(draft.scenes[0].direction,'Leo nhấn chuột, nhìn số tăng rồi mỉm cười.');
 await page.reload();await page.getByLabel('Diễn biến & bố cục').waitFor();assert.equal(await page.getByLabel('Diễn biến & bố cục').inputValue(),draft.scenes[0].direction);
 fs.mkdirSync('reports/storyboard-approval',{recursive:true});await page.screenshot({path:'reports/storyboard-approval/desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'reports/storyboard-approval/mobile.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.getByRole('button',{name:/Cuộc gọi/}).click();await page.getByLabel('Chủ thể',{exact:true}).fill('Leo áo xanh');
 await page.getByRole('button',{name:'Duyệt storyboard & dựng video'}).click();await page.getByText('Kiểm thử đã dừng trước render.').waitFor();
 assert.equal(generated,1);assert.equal(approved.storyboardId,draft.id);assert.equal(approved.revision,3);assert.equal(draft.scenes[1].layout.subject,'Leo áo xanh');assert.deepEqual(errors,[]);
 console.log('Storyboard UI: edit, save, reload, mobile and explicit approval passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
