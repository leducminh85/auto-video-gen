const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { ChatGPTBrowser } = require('./chatgptBrowser.cjs');

test('supports old and new ChatGPT composers and assistant responses', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const worker = new ChatGPTBrowser();
    worker.page = await browser.newPage();
    await worker.page.setContent('<div id="prompt-textarea" contenteditable="true"></div><div data-message-author-role="assistant">old response</div>');
    await worker.composer().fill('script');
    assert.equal(await worker.responses().last().innerText(), 'old response');
    await worker.page.setContent('<div id="prompt-textarea" hidden></div><div role="textbox" contenteditable="true" aria-label="Ask ChatGPT"></div><div data-markdown-text-style="assistant-message">new response</div><div data-markdown-text-style="assistant-message" hidden>stale response</div>');
    await worker.composer().fill('new script');
    assert.equal(await worker.composer().innerText(), 'new script');
    assert.equal(await worker.responses().count(), 1);
    assert.equal(await worker.responses().last().innerText(), 'new response');
  } finally { await browser.close(); }
});

test('render review attaches image bytes and rejects missing files without pasting paths',async()=>{
 const fs=require('node:fs'),os=require('node:os');const root=fs.mkdtempSync(require('node:path').join(os.tmpdir(),'review-image-'));
 const file=require('node:path').join(root,'frame.png');fs.writeFileSync(file,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jN1sAAAAASUVORK5CYII=','base64'));
 const browser=await chromium.launch({headless:true});
 try {
  const worker=new ChatGPTBrowser();worker.page=await browser.newPage();
  await worker.page.setContent('<form hidden><input type="file" accept="image/*"></form><form><input type="file" capture="environment" accept="image/*"><input id="upload" type="file" accept="image/*" multiple hidden><div id="prompt-textarea" contenteditable="true">Prompt</div></form>');
  await worker.page.locator('#upload').evaluate(el=>el.addEventListener('change',()=>{const img=document.createElement('img');img.width=40;img.height=40;img.src=URL.createObjectURL(el.files[0]);el.closest('form').append(img);}));
  await worker.attachImages([file]);
  assert.equal(await worker.page.locator('#upload').evaluate(el=>el.files[0].name),'frame.png');
  assert.equal(await worker.composer().innerText(),'Prompt');
  assert.equal(await worker.page.locator('input[capture]').evaluate(el=>el.files.length),0);
  await assert.rejects(worker.attachImages([file+'.missing']),/không hợp lệ/);
 }finally{await browser.close();fs.rmSync(root,{recursive:true,force:true});}
});

test('completed blank response reloads the same conversation without sending again', async () => {
 const browser=await chromium.launch({headless:true});
 try {
  const worker=new ChatGPTBrowser();worker.page=await browser.newPage();let loads=0;
  await worker.page.route('https://chatgpt.com/c/recovery-test',route=>{
   loads++;
   return route.fulfill({contentType:'text/html',body:`<div data-message-author-role="assistant">old result</div><div data-message-author-role="user">current request</div><article data-testid="conversation-turn-2"><div data-message-author-role="assistant">${loads>1?'<div class="markdown">{"passed":true,"issues":[]}</div>':''}</div><button data-testid="copy-turn-action-button">Copy</button></article>`});
  });
  await worker.page.goto('https://chatgpt.com/c/recovery-test');
  assert.equal(await worker.waitForResponse({timeout:3000,poll:10,blankGrace:10}),'{"passed":true,"issues":[]}');
  assert.equal(loads,2);
 }finally{await browser.close();}
});

test('blank response recovery is bounded and never reloads an active generation', async () => {
 const browser=await chromium.launch({headless:true});
 try {
  const worker=new ChatGPTBrowser();worker.page=await browser.newPage();let loads=0,streaming=false;
  await worker.page.route('https://chatgpt.com/c/blank-test',route=>{loads++;return route.fulfill({contentType:'text/html',body:`<div data-message-author-role="user">request</div><article data-testid="conversation-turn-2"><div data-message-author-role="assistant"></div><button data-testid="copy-turn-action-button">Copy</button></article>${streaming?'<button data-testid="stop-button">Stop</button>':''}`});});
  await worker.page.goto('https://chatgpt.com/c/blank-test');
  await assert.rejects(worker.waitForResponse({timeout:3000,poll:10,blankGrace:10}),/sau 2 lần tải lại/);
  assert.equal(loads,3);
  streaming=true;await worker.page.reload();const before=loads;
  await assert.rejects(worker.waitForResponse({timeout:120,poll:10,blankGrace:10}),/Chưa đọc được/);
  assert.equal(loads,before);
 }finally{await browser.close();}
});

test('response reader ignores previous turns and recovers mounted text missing layout', async () => {
 const browser=await chromium.launch({headless:true});
 try {
  const worker=new ChatGPTBrowser();worker.page=await browser.newPage();
  await worker.page.setContent('<div data-message-author-role="assistant">stale</div><div data-message-author-role="user">new</div><article data-testid="conversation-turn-2"><div data-message-author-role="assistant"><div class="markdown" style="display:none">{"passed":true}</div></div><button data-testid="copy-turn-action-button">Copy</button></article>');
  assert.deepEqual(await worker.responseSnapshot(),{text:'{"passed":true}',completed:true});
  await worker.page.setContent('<div data-message-author-role="assistant">stale</div><div data-message-author-role="user">new</div>');
  assert.deepEqual(await worker.responseSnapshot(),{text:'',completed:false});
 }finally{await browser.close();}
});

test('missing completion selectors still triggers bounded recovery and a stuck spinner times out',async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  const worker=new ChatGPTBrowser();worker.page=await browser.newPage();let loads=0,spinner=false;
  await worker.page.route('https://chatgpt.com/c/no-selector',route=>{loads++;return route.fulfill({contentType:'text/html',body:`<div>No recognized message elements</div>${spinner?'<button data-testid="stop-button">Stop</button>':''}`});});
  await worker.page.goto('https://chatgpt.com/c/no-selector');
  await assert.rejects(worker.waitForResponse({timeout:1000,poll:5,idleGrace:10,stallGrace:1000}),e=>e.code==='CHATGPT_NO_RESPONSE');
  assert.equal(loads,3);
  spinner=true;await worker.page.reload();const before=loads;
  await assert.rejects(worker.waitForResponse({timeout:1000,poll:5,stallGrace:30}),e=>e.code==='CHATGPT_NO_RESPONSE');
  assert.equal(loads,before);
 }finally{await browser.close();}
});

test('transport retries the exact prompt and attachments, releases lock and stops after three sends',async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  const worker=new ChatGPTBrowser();worker.page=await browser.newPage();worker.open=async()=>({connected:true});
  await worker.page.route('https://chatgpt.com/',route=>route.fulfill({contentType:'text/html',body:'<div id="prompt-textarea" contenteditable="true"></div><button aria-label="Send">Send</button>'}));
  const attachments=[],messages=[];worker.attachImages=async images=>attachments.push(images);worker.onTransportProgress=m=>messages.push(m);
  let attempts=0;
  worker.waitForResponse=async()=>{assert.equal(await worker.composer().innerText(),'unchanged prompt');if(++attempts<3)throw Object.assign(new Error('empty'),{code:'CHATGPT_NO_RESPONSE'});return '{"passed":true}';};
  assert.equal(await worker.request('unchanged prompt',{images:['/tmp/frame.png']}),'{"passed":true}');
  assert.equal(attempts,3);assert.deepEqual(attachments,Array(3).fill(['/tmp/frame.png']));assert.equal(worker.busy,false);assert.equal(messages.length,2);
  attempts=0;worker.waitForResponse=async()=>{attempts++;throw Object.assign(new Error('empty'),{code:'CHATGPT_NO_RESPONSE'});};
  await assert.rejects(worker.request('unchanged prompt'),e=>e.retryExhausted===true);assert.equal(attempts,3);assert.equal(worker.busy,false);
 }finally{await browser.close();}
});

test('reads current ChatGPT markup without author-role nodes and excludes pre-send content',async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  const worker=new ChatGPTBrowser();worker.page=await browser.newPage();
  worker.responseBaseline=['old answer'];
  await worker.page.setContent('<div data-markdown-text-style="assistant-message">old answer</div>');
  assert.equal((await worker.responseSnapshot()).text,'');
  await worker.page.setContent('<div>Prompt without author role</div><div data-markdown-text-style="assistant-message">{"repairs":[]}</div>');
  assert.equal(await worker.waitForResponse({timeout:1000,poll:5}),'{"repairs":[]}');
 }finally{await browser.close();}
});

test('upload uses the file chooser menu and waits for the attachment preview',async()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');const root=fs.mkdtempSync(path.join(os.tmpdir(),'chooser-test-'));const file=path.join(root,'frame.svg.png');
 fs.writeFileSync(file,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jN1sAAAAASUVORK5CYII=','base64'));
 const browser=await chromium.launch({headless:true});
 try {
 const worker=new ChatGPTBrowser();worker.page=await browser.newPage();
 await worker.page.setContent('<form><input id="file" type="file" hidden><button type="button" aria-label="Add files and more">+</button><button type="button" role="menuitem" hidden>Add photos & files</button><div id="prompt-textarea" contenteditable="true">Review</div><div data-composer-attachments></div></form>');
 await worker.page.evaluate(()=>{
  document.querySelector('[aria-label]').onclick=()=>document.querySelector('[role="menuitem"]').hidden=false;
  document.querySelector('[role="menuitem"]').onclick=()=>{window.usedChooser=true;document.querySelector('#file').click();};
  document.querySelector('#file').onchange=event=>{const image=document.createElement('img');image.width=40;image.height=40;image.src=URL.createObjectURL(event.target.files[0]);document.querySelector('[data-composer-attachments]').append(image);};
 });
 await worker.attachImages([file],{timeout:1000});assert.equal(await worker.page.evaluate(()=>window.usedChooser),true);
 await worker.page.evaluate(()=>{document.querySelector('#file').onchange=null;document.querySelector('[data-composer-attachments]').replaceChildren();});
 await assert.rejects(worker.attachImages([file],{timeout:50}),/chưa gửi prompt/);
 }finally{await browser.close();fs.rmSync(root,{recursive:true,force:true});}
});
