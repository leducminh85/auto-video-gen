const { chromium } = require('playwright');
const path = require('node:path');
const { applyCookies } = require('./chatgptCookies.cjs');
const { connectionStatus } = require('./chatgptStatus.cjs');

class ChatGPTBrowser {
  async cancelRequest() {
    if (!this.busy) return;
    this.cancelError = Object.assign(new Error('Đã dừng chờ ChatGPT. Các cảnh đã đạt được giữ lại.'), {retryExhausted:true});
    await this.page?.close().catch(() => {});
  }
  composer() {
    return this.page.locator('#prompt-textarea:visible, [role="textbox"][contenteditable="true"][aria-label="Ask ChatGPT"]:visible, [role="textbox"][contenteditable="true"][aria-label="Hỏi ChatGPT"]:visible').first();
  }
  responses() {
    return this.page.locator('[data-message-author-role="assistant"]:visible, [data-markdown-text-style="assistant-message"]:visible');
  }
  async responseSnapshot() {
    return this.page.evaluate((baseline) => {
      const users = [...document.querySelectorAll('[data-message-author-role="user"]')];
      const user = users.at(-1);
      const selector = '[data-message-author-role="assistant"], [data-markdown-text-style="assistant-message"]';
      const nodes = [...document.querySelectorAll(selector)].filter(el =>
        !user || (user.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING));
      const node = nodes.filter(el => !el.closest('[hidden], [aria-hidden="true"]')).at(-1);
      const content = node?.querySelector('[data-markdown-text-style="assistant-message"], .markdown') || node;
      let text = (content?.innerText?.trim() || content?.textContent || '').trim();
      if (!user && baseline.includes(text)) text = '';
      const turns = [...document.querySelectorAll('[data-testid^="conversation-turn-"]')];
      const turn = node?.closest('[data-testid^="conversation-turn-"]') || turns.filter(el =>
        user && !el.contains(user) && (user.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)).at(-1);
      const completed = !!turn?.querySelector('[data-testid="copy-turn-action-button"], [data-testid="good-response-turn-action-button"], [data-testid="bad-response-turn-action-button"]');
      return { text, completed };
    }, this.responseBaseline || []);
  }
  async waitForResponse({ timeout = 240000, poll = 1500, blankGrace = 15000, idleGrace = 45000, stallGrace = 120000 } = {}) {
    const deadline = Date.now() + timeout;
    let last = '', stable = 0, blankSince = 0, reloads = 0, changedAt = Date.now(), reportedAt = 0;
    const fail = message => Object.assign(new Error(message), {code:'CHATGPT_NO_RESPONSE'});
    while (Date.now() < deadline) {
      await this.page.waitForTimeout(poll);
      const { text, completed } = await this.responseSnapshot();
      const stopping = await this.page.locator('[data-testid="stop-button"]:visible, [role="status"][aria-busy="true"]:visible').count() > 0
        || await this.page.getByRole('button', { name: /^(Stop|Stop generating|Stop response|Dừng|Dừng tạo|Dừng phản hồi)$/i }).first().isVisible().catch(() => false);
      if (text !== last) changedAt = Date.now();
      stable = text === last && !stopping ? stable + 1 : 0;
      last = text;
      if (stable >= 3 && text) return text;
      if (Date.now() - reportedAt >= 15000) {
        this.onTransportProgress?.(`Đang chờ ChatGPT · ${Math.floor((Date.now() - changedAt)/1000)} giây chưa có nội dung mới.`);
        reportedAt = Date.now();
      }
      if (Date.now() - changedAt >= stallGrace) throw fail('ChatGPT không có nội dung mới trong 120 giây.');
      if (!text && !stopping) {
        blankSince ||= Date.now();
        if (Date.now() - blankSince >= (completed ? blankGrace : idleGrace)) {
          if (reloads >= 2) throw fail('ChatGPT trả lời trống sau 2 lần tải lại.');
          if (!/^https:\/\/chatgpt\.com\/c\/[^/?#]+/.test(this.page.url())) throw fail('ChatGPT không bắt đầu trả lời.');
          this.onTransportProgress?.(`ChatGPT trả lời trống · tải lại cuộc hội thoại ${reloads+1}/2…`);
          await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
          reloads++;
          blankSince = 0;
          stable = 0;
        }
      } else blankSince = 0;
    }
    throw fail('Chưa đọc được câu trả lời ChatGPT trong thời gian cho phép.');
  }
  static getInstance() {
    if (!global.__wevicChatGPT) global.__wevicChatGPT = new ChatGPTBrowser();
    Object.setPrototypeOf(global.__wevicChatGPT, ChatGPTBrowser.prototype);
    return global.__wevicChatGPT;
  }
  async open() {
    if (!this.launching) this.launching = (async () => {
      this.context = await chromium.launchPersistentContext(path.resolve('data/chatgpt-profile'), { headless: false, viewport: { width: 1360, height: 900 } });
      this.context.on('close', () => { this.context = null; this.page = null; this.launching = null; this.cookieFingerprint = null; });
      await applyCookies(this);
      this.page = this.context.pages()[0] || await this.context.newPage();
      await this.page.goto('https://chatgpt.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
    })().catch(async error => {
      if (this.context) await this.context.close().catch(() => {});
      this.launching = null;
      if (/ProcessSingleton|profile.*in use|already in use/i.test(error.message)) throw new Error('Phiên ChatGPT đang mở ở tiến trình khác. Đóng cửa sổ ChatGPT đó rồi bấm Mở ChatGPT đăng nhập.');
      throw error;
    });
    await this.launching;
    const cookiesChanged = await applyCookies(this);
    if (!this.page || this.page.isClosed()) {
      this.page = await this.context.newPage();
      await this.page.goto('https://chatgpt.com', { waitUntil: 'domcontentloaded' });
    } else if (cookiesChanged) {
      await this.page.goto('https://chatgpt.com', { waitUntil: 'domcontentloaded' });
    }
    await this.page.bringToFront();
    return this.status();
  }
  async status() {
    if (!this.page || this.page.isClosed()) return { connected: false, message: 'Mở ChatGPT và đăng nhập để tạo hoạt hình.' };
    if (!this.busy && await applyCookies(this)) await this.page.goto('https://chatgpt.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const editor = this.composer();
    await editor.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    const title = await this.page.title().catch(() => '');
    const challenge = /just a moment|verify you are human|security verification/i.test(title)
      || await this.page.locator('iframe[src*="challenges.cloudflare.com"]').count() > 0
      || await this.page.getByText(/verify you are human|verifying your browser|xác minh bạn là con người|performing security verification/i).first().isVisible().catch(() => false);
    let authenticated = false, sessionChecked = false;
    try {
      const response = await this.context.request.get('https://chatgpt.com/api/auth/session', { timeout: 15000 });
      if (response.ok()) {
        const session = await response.json();
        sessionChecked = true;
        authenticated = !!session.user && !!session.accessToken;
      }
    } catch {}
    const composerVisible = await editor.isVisible().catch(() => false);
    const readerDiagnostics = await this.page.evaluate(() => ({
      alerts:[...document.querySelectorAll('[role="alert"], [data-sonner-toast]')].map(el=>el.textContent),
      inputs:[...document.querySelectorAll('input[type=file]')].map(el=>({id:el.id,accept:el.accept,files:el.files.length})),
      menus:[...document.querySelectorAll('[role="menuitem"]')].map(el=>el.textContent),
      userRoles:document.querySelectorAll('[data-message-author-role="user"]').length,
      assistantRoles:document.querySelectorAll('[data-message-author-role="assistant"]').length,
      turns:[...document.querySelectorAll('article, [data-testid^="conversation-turn"], [data-markdown-text-style]')].slice(-12).map(el=>({tag:el.tagName,testid:el.getAttribute('data-testid'),role:el.getAttribute('data-message-author-role'),style:el.getAttribute('data-markdown-text-style'),label:el.getAttribute('aria-label'),length:el.textContent?.length}))
    })).catch(()=>null);
    return { ...connectionStatus({ authenticated, sessionChecked, challenge, composerVisible }), busy: !!this.busy, readerDiagnostics: {...readerDiagnostics, uploadEvents:this.uploadEvents, extractedCharacters:(await this.responseSnapshot().catch(()=>({text:''}))).text.length} };
  }
  async attachImages(images, {timeout=45000}={}) {
    if(images.length) {
        const fs=require('node:fs');
        if(images.length>4||images.some(file=>!path.isAbsolute(file)||! /\.(png|jpe?g|webp)$/i.test(file)||!fs.existsSync(file)))throw new Error('Tệp kiểm tra hình ảnh không hợp lệ.');
        const form=this.composer().locator('xpath=ancestor::form[1]');
        const scope=await form.count()?form:this.page;
        let input=scope.locator('input[type="file"]:not([capture]):not([accept]), input[type="file"][accept=""]:not([capture])').first();
        if(!await input.count())input=scope.locator('input[type="file"][accept*="image"]:not([capture])').first();
        if(!await input.count())input=scope.locator('input[type="file"]:not([capture])').first();
        if(!await input.count())throw new Error('ChatGPT chưa có ô đính kèm ảnh để kiểm tra khung hình.');
        this.uploadEvents=[];
        const capture=async response=>{const u=new URL(response.url());if(/upload|file|attachment/i.test(u.pathname))this.uploadEvents.push({path:u.pathname,status:response.status(),detail:response.status()>=400?(await response.text().catch(()=>'' )).slice(0,300):undefined});};
        const uploadPage=this.page;
        uploadPage.on('response',capture);
        setTimeout(()=>uploadPage.off('response',capture),60000).unref();
        const add=scope.getByRole('button',{name:/^(Add files and more|Thêm tệp và hơn thế nữa)$/i}).first();
        let chosen=false;
        if(await add.isVisible().catch(()=>false)) {
          await add.click();
          const upload=this.page.getByRole('menuitem').filter({hasText:/Upload files|Add photos|Add files|Tải tệp|Thêm ảnh/i}).first();
          if(await upload.isVisible().catch(()=>false)) {
            const chooser=this.page.waitForEvent('filechooser',{timeout:10000});
            await upload.click();
            await (await chooser).setFiles(images);
            chosen=true;
          } else await this.page.keyboard.press('Escape');
        }
        if(!chosen)await input.setInputFiles(images);
        this.onTransportProgress?.('Đang chờ ảnh kiểm duyệt tải lên ChatGPT…');
        await this.page.waitForFunction((count) => {
          const editor=[...document.querySelectorAll('#prompt-textarea, [role="textbox"][contenteditable="true"]')].find(el=>el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0);
          const form=editor?.closest('form');
          if(!form)return false;
          const region=form.querySelector('[data-composer-attachments]') || form;
          const pictures=[...region.querySelectorAll('img')].filter(img=>img.complete&&img.naturalWidth>0&&img.getBoundingClientRect().width>20);
          const uploading=form.querySelector('[role="progressbar"], [aria-busy="true"]');
          return pictures.length>=count&&!uploading;
        },images.length,{timeout}).catch(error=>{throw new Error(`Ảnh kiểm duyệt chưa tải lên ChatGPT; chưa gửi prompt. ${error.name==='TimeoutError'?'Hết thời gian chờ ảnh.':error.message}`);});
      }
  }
  async request(prompt, {images=[]}={}) {
    const queuedAt = Date.now();
    while (this.busy) {
      if (Date.now() - queuedAt > 11 * 60 * 1000) throw new Error('Phiên ChatGPT không giải phóng sau 11 phút.');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    this.busy = true;
    this.cancelError = null;
    try {
      const state = await this.open();
      if (!state.connected) throw new Error(state.message);
      for (let attempt = 1; attempt <= 3; attempt++) {
      try {
      const page = this.page;
      await page.goto('https://chatgpt.com', { waitUntil: 'domcontentloaded' });
      this.responseBaseline = await this.responses().allTextContents();
      this.responseBaseline = this.responseBaseline.map(text=>text.trim());
      const composer = this.composer();
      await composer.waitFor({ state: 'visible', timeout: 30000 });
      await composer.fill(prompt);
      await this.attachImages(images);
      const send = page.getByRole('button', { name: /^(Send|Send message|Send prompt|Gửi|Gửi tin nhắn)$/i }).last();
      await send.waitFor({ state: 'visible', timeout: 15000 });
      await send.click({ timeout: images.length ? 90000 : 15000 });
      return await this.waitForResponse();
      } catch (error) {
        if (this.cancelError) throw this.cancelError;
        if (error.code !== 'CHATGPT_NO_RESPONSE') throw error;
        if (attempt === 3) throw Object.assign(new Error('ChatGPT không trả nội dung sau 3 lượt gửi. Các cảnh đã đạt được giữ lại; có thể tiếp tục bước này.'), {retryExhausted:true});
        this.onTransportProgress?.(`ChatGPT không trả nội dung · gửi lại yêu cầu hiện tại ${attempt+1}/3…`);
      }
      }
    } catch (error) { throw this.cancelError || error; }
    finally { this.busy = false; }
  }
}
function parseJSON(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const value = fenced ? fenced[1] : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  try { return JSON.parse(value); } catch { throw new Error('ChatGPT trả về JSON không đọc được. Hãy thử lại.'); }
}
module.exports = { ChatGPTBrowser, parseJSON };
