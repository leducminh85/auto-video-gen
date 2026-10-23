const { chromium } = require('playwright');
const path = require('node:path');
const { applyCookies } = require('./chatgptCookies.cjs');
const { connectionStatus } = require('./chatgptStatus.cjs');

class ChatGPTBrowser {
  composer() {
    return this.page.locator('#prompt-textarea:visible, [role="textbox"][contenteditable="true"][aria-label="Ask ChatGPT"]:visible, [role="textbox"][contenteditable="true"][aria-label="Hỏi ChatGPT"]:visible').first();
  }
  responses() {
    return this.page.locator('[data-message-author-role="assistant"]:visible, [data-markdown-text-style="assistant-message"]:visible');
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
    return { ...connectionStatus({ authenticated, sessionChecked, challenge, composerVisible }), busy: !!this.busy };
  }
  async request(prompt) {
    const queuedAt = Date.now();
    while (this.busy) {
      if (Date.now() - queuedAt > 11 * 60 * 1000) throw new Error('Phiên ChatGPT không giải phóng sau 11 phút.');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    this.busy = true;
    try {
      const state = await this.open();
      if (!state.connected) throw new Error(state.message);
      const page = this.page;
      await page.goto('https://chatgpt.com', { waitUntil: 'domcontentloaded' });
      const composer = this.composer();
      await composer.waitFor({ state: 'visible', timeout: 30000 });
      await composer.fill(prompt);
      const previous = await this.responses().count();
      const send = page.getByRole('button', { name: /^(Send|Send message|Send prompt|Gửi|Gửi tin nhắn)$/i }).last();
      await send.waitFor({ state: 'visible', timeout: 15000 });
      await send.click({ timeout: 15000 });
      const deadline = Date.now() + 10 * 60 * 1000;
      let last = '', stable = 0;
      while (Date.now() < deadline) {
        await page.waitForTimeout(1500);
        const messages = this.responses();
        if (await messages.count() <= previous) continue;
        const text = await messages.last().innerText();
        const stopping = await page.locator('[data-testid="stop-button"]:visible, [role="status"][aria-busy="true"]:visible').count() > 0
          || await page.getByRole('button', { name: /^(Stop generating|Stop response|Dừng tạo|Dừng phản hồi)$/i }).isVisible().catch(() => false);
        stable = text === last && !stopping ? stable + 1 : 0;
        last = text;
        if (stable >= 3 && text.trim()) return text;
      }
      throw new Error('ChatGPT chưa trả lời sau 10 phút. Kiểm tra cửa sổ ChatGPT rồi thử lại.');
    } finally { this.busy = false; }
  }
}
function parseJSON(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const value = fenced ? fenced[1] : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  try { return JSON.parse(value); } catch { throw new Error('ChatGPT trả về JSON không đọc được. Hãy thử lại.'); }
}
module.exports = { ChatGPTBrowser, parseJSON };
