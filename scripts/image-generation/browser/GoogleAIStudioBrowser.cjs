const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const { AI_STUDIO_URLS, AI_STUDIO_SELECTORS } = require('../selectors/aiStudioSelectors.cjs');

/**
 * Singleton Browser Worker for Google AI Studio
 * Manages persistent context, session reuse, manual login flow, and multi-tab pool.
 */
class GoogleAIStudioBrowser extends EventEmitter {
  constructor() {
    super();
    this.profileDir = path.resolve(process.cwd(), 'data/google-ai-studio-profile');
    this.context = null;
    this.page = null;
    this.tabPool = [];
    this.maxTabs = 3;
    this.isInitializing = false;
  }

  static getInstance() {
    if (!global.__googleAIStudioBrowserInstance) {
      global.__googleAIStudioBrowserInstance = new GoogleAIStudioBrowser();
    }
    return global.__googleAIStudioBrowserInstance;
  }

  /**
   * Ensure directory exists and launch persistent browser context
   */
  async ensureContext(options = {}) {
    if (this.context) {
      try {
        this.context.pages();
        return this.context;
      } catch (_) {
        this.context = null;
        this.page = null;
        this.tabPool = [];
      }
    }

    if (this._launchingPromise) {
      return this._launchingPromise;
    }

    this._launchingPromise = (async () => {
      if (!fs.existsSync(this.profileDir)) {
        fs.mkdirSync(this.profileDir, { recursive: true });
      }

      // Clean up stale Chromium lock files before launching
      try {
        const lockFiles = ['SingletonLock', 'SingletonSocket', 'SingletonCookie'];
        for (const lf of lockFiles) {
          const fullP = path.join(this.profileDir, lf);
          if (fs.existsSync(fullP)) {
            try { fs.unlinkSync(fullP); } catch (_) {}
          }
        }
      } catch (_) {}

      console.log(`[AI Studio] Initializing persistent browser profile: ${this.profileDir}`);

      const launchArgs = [
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
        '--start-maximized',
      ];

      const contextOptions = {
        headless: false,
        viewport: null,
        args: launchArgs,
        ignoreDefaultArgs: ['--enable-automation'],
        ...options,
      };

      try {
        this.context = await chromium.launchPersistentContext(this.profileDir, contextOptions);
        console.log(`[AI Studio] Browser persistent worker started successfully`);
      } catch (err) {
        console.error(`[AI Studio] Error launching persistent browser:`, err.message);
        throw err;
      }

      this.context.on('close', () => {
        console.log(`[AI Studio] Browser context closed`);
        this.context = null;
        this.page = null;
        this.tabPool = [];
      });

      return this.context;
    })();

    try {
      return await this._launchingPromise;
    } finally {
      this._launchingPromise = null;
    }
  }

  /**
   * Ensure a working page is open and ready (legacy single tab accessor)
   */
  async ensurePage() {
    const context = await this.ensureContext();
    const pages = context.pages();

    if (this.page && !this.page.isClosed()) {
      return this.page;
    }

    if (pages.length > 0 && !pages[0].isClosed()) {
      this.page = pages[0];
    } else {
      this.page = await context.newPage();
    }

    this.page.setDefaultTimeout(60000);
    return this.page;
  }

  /**
   * Initialize or retrieve the pool of 3 concurrent browser tabs
   * @param {number} poolSize - Number of parallel tabs (default 3)
   */
  async ensureTabPool(poolSize = 3) {
    if (this._ensuringPoolPromise) {
      return this._ensuringPoolPromise;
    }

    this._ensuringPoolPromise = (async () => {
      const context = await this.ensureContext();
      this.maxTabs = poolSize;

      // Prune closed tabs
      this.tabPool = this.tabPool.filter(t => t.page && !t.page.isClosed());

      const existingPages = context.pages().filter(p => !p.isClosed());

      // Map existing pages to tab pool
      for (let i = 0; i < existingPages.length && this.tabPool.length < poolSize; i++) {
        const p = existingPages[i];
        if (!this.tabPool.some(t => t.page === p)) {
          this.tabPool.push({
            id: this.tabPool.length + 1,
            page: p,
            isBusy: false,
            turnCount: 0,
            isInitialized: false,
          });
        }
      }

      // Open new pages up to poolSize
      while (this.tabPool.length < poolSize) {
        const newP = await context.newPage();
        newP.setDefaultTimeout(60000);
        this.tabPool.push({
          id: this.tabPool.length + 1,
          page: newP,
          isBusy: false,
          turnCount: 0,
          isInitialized: false,
        });
      }

      return this.tabPool;
    })();

    try {
      return await this._ensuringPoolPromise;
    } finally {
      this._ensuringPoolPromise = null;
    }
  }

  /**
   * Acquire an available tab from the pool (blocks if all are busy)
   * @returns {Promise<{ id: number, page: import('playwright').Page, isBusy: boolean, turnCount: number, isInitialized: boolean }>}
   */
  async acquireTab() {
    await this.ensureTabPool(this.maxTabs);

    const availableTab = this.tabPool.find(t => !t.isBusy && !t.page.isClosed());
    if (availableTab) {
      availableTab.isBusy = true;
      return availableTab;
    }

    // Wait until a tab is released
    return new Promise((resolve) => {
      const onReleased = () => {
        const tab = this.tabPool.find(t => !t.isBusy && !t.page.isClosed());
        if (tab) {
          this.off('tab_released', onReleased);
          tab.isBusy = true;
          resolve(tab);
        }
      };
      this.on('tab_released', onReleased);
    });
  }

  /**
   * Release a tab back to the pool
   */
  releaseTab(tab) {
    if (tab) {
      tab.isBusy = false;
      this.emit('tab_released', tab);
    }
  }

  /**
   * Reset a tab to a fresh chat with verified image model and 16:9 ratio
   */
  async resetTab(tab) {
    console.log(`[AI Studio Tab ${tab.id}] Resetting to fresh chat session...`);
    const page = tab.page;
    await page.goto(AI_STUDIO_URLS.NEW_CHAT, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(1500);

    // Ensure model is Nano Banana 2 Lite
    try {
      const modelBtn = page.locator(AI_STUDIO_SELECTORS.modelSelectorButton.join(', ')).first();
      const modelText = await modelBtn.innerText().catch(() => '');
      if (!modelText.includes('Nano Banana') && !modelText.includes('image')) {
        console.log(`[AI Studio Tab ${tab.id}] Switching to Nano Banana 2 Lite...`);
        await modelBtn.click();
        await page.waitForTimeout(800);
        const imgTab = page.locator(AI_STUDIO_SELECTORS.modelImagesTab.join(', ')).first();
        if (await imgTab.isVisible().catch(() => false)) {
          await imgTab.click();
          await page.waitForTimeout(500);
        }
        const nanoModel = page.locator(AI_STUDIO_SELECTORS.nanoBananaModelOption.join(', ')).first();
        if (await nanoModel.isVisible().catch(() => false)) {
          await nanoModel.click();
          await page.waitForTimeout(800);
        }
      }
    } catch (_) {}

    // Ensure Images only
    try {
      const imagesOnlyBtn = page.locator(AI_STUDIO_SELECTORS.imagesOnlyButton.join(', ')).first();
      if (await imagesOnlyBtn.isVisible().catch(() => false)) {
        await imagesOnlyBtn.click();
        await page.waitForTimeout(300);
      }
    } catch (_) {}

    // Ensure 16:9 Aspect Ratio
    try {
      const aspectSelect = page.locator(AI_STUDIO_SELECTORS.aspectRatioSelect.join(', ')).first();
      if (await aspectSelect.isVisible().catch(() => false)) {
        const cur = await aspectSelect.innerText().catch(() => '');
        if (!cur.includes('16:9')) {
          await aspectSelect.click();
          await page.waitForTimeout(400);
          const opt169 = page.locator(AI_STUDIO_SELECTORS.aspectRatioOption169.join(', ')).first();
          if (await opt169.isVisible().catch(() => false)) {
            await opt169.click();
            await page.waitForTimeout(300);
          } else {
            await page.keyboard.press('Escape');
          }
        }
      }
    } catch (_) {}

    tab.isInitialized = true;
    tab.turnCount = 0;
    tab.hasError = false;
    console.log(`[AI Studio Tab ${tab.id}] Ready for image generation.`);
  }

  /**
   * Check whether the user is currently authenticated in Google AI Studio
   */
  async checkSession() {
    try {
      const page = await this.ensurePage();
      const currentUrl = page.url();

      if (!currentUrl.includes('aistudio.google.com')) {
        console.log(`[AI Studio] Navigating to ${AI_STUDIO_URLS.HOME} to verify session...`);
        await page.goto(AI_STUDIO_URLS.HOME, { waitUntil: 'domcontentloaded', timeout: 30000 });
      }

      await page.waitForLoadState('domcontentloaded');
      const finalUrl = page.url();

      if (finalUrl.includes('accounts.google.com') || finalUrl.includes('signin')) {
        return { sessionValid: false, currentUrl: finalUrl, reason: 'REDIRECTED_TO_SIGNIN' };
      }

      for (const selector of AI_STUDIO_SELECTORS.loginButton) {
        if (await page.locator(selector).first().isVisible().catch(() => false)) {
          return { sessionValid: false, currentUrl: finalUrl, reason: 'SIGNIN_BUTTON_VISIBLE' };
        }
      }

      for (const selector of AI_STUDIO_SELECTORS.authenticatedIndicators) {
        if (await page.locator(selector).first().isVisible().catch(() => false)) {
          return { sessionValid: true, currentUrl: finalUrl };
        }
      }

      if (finalUrl.includes('aistudio.google.com')) {
        return { sessionValid: true, currentUrl: finalUrl };
      }

      return { sessionValid: false, currentUrl: finalUrl, reason: 'UNKNOWN_STATE' };
    } catch (err) {
      return { sessionValid: false, currentUrl: '', reason: err.message };
    }
  }

  /**
   * Launch browser window for user to manually log in
   */
  async openForManualLogin() {
    console.log(`[AI Studio] Opening browser for manual Google login...`);
    const page = await this.ensurePage();
    await page.goto(AI_STUDIO_URLS.HOME, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.bringToFront();
    return this.checkSession();
  }

  /**
   * Close context and cleanup
   */
  async close() {
    if (this.context) {
      try {
        await this.context.close();
      } catch (_) {}
      this.context = null;
      this.page = null;
      this.tabPool = [];
      console.log(`[AI Studio] Browser closed cleanly`);
    }
  }
}

module.exports = GoogleAIStudioBrowser;

