const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { AI_STUDIO_URLS, AI_STUDIO_SELECTORS } = require('../selectors/aiStudioSelectors.cjs');

/**
 * Singleton Browser Worker for Google AI Studio
 * Manages persistent context, session reuse, manual login flow, and tab lifecycle.
 */
class GoogleAIStudioBrowser {
  constructor() {
    this.profileDir = path.resolve(process.cwd(), 'data/google-ai-studio-profile');
    this.context = null;
    this.page = null;
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
        // Ping pages to check if browser is still responsive
        this.context.pages();
        return this.context;
      } catch (_) {
        this.context = null;
        this.page = null;
      }
    }

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
      headless: false, // Always visible for user verification & manual login
      viewport: null,  // Adaptive to window size
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
    });

    return this.context;
  }

  /**
   * Ensure a working page is open and ready
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

    // Set standard viewport & timeout
    this.page.setDefaultTimeout(60000);
    return this.page;
  }

  /**
   * Check whether the user is currently authenticated in Google AI Studio
   * @returns {Promise<{ sessionValid: boolean, currentUrl: string, reason?: string }>}
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

      // Check if redirected to Google Accounts login page
      if (finalUrl.includes('accounts.google.com') || finalUrl.includes('signin')) {
        console.log(`[AI Studio] Session check: Redirected to login page (${finalUrl})`);
        return { sessionValid: false, currentUrl: finalUrl, reason: 'REDIRECTED_TO_SIGNIN' };
      }

      // Check for Sign-in buttons on the page
      for (const selector of AI_STUDIO_SELECTORS.loginButton) {
        const isVisible = await page.locator(selector).first().isVisible().catch(() => false);
        if (isVisible) {
          console.log(`[AI Studio] Session check: Sign in button detected`);
          return { sessionValid: false, currentUrl: finalUrl, reason: 'SIGNIN_BUTTON_VISIBLE' };
        }
      }

      // Check for Authenticated indicators
      for (const selector of AI_STUDIO_SELECTORS.authenticatedIndicators) {
        const isPresent = await page.locator(selector).first().isVisible().catch(() => false);
        if (isPresent) {
          console.log(`[AI Studio] Session valid (detected ${selector})`);
          return { sessionValid: true, currentUrl: finalUrl };
        }
      }

      // If we are on aistudio.google.com and not redirected to accounts, assume valid
      if (finalUrl.includes('aistudio.google.com')) {
        console.log(`[AI Studio] Session valid: on domain ${finalUrl}`);
        return { sessionValid: true, currentUrl: finalUrl };
      }

      return { sessionValid: false, currentUrl: finalUrl, reason: 'UNKNOWN_STATE' };
    } catch (err) {
      console.warn(`[AI Studio] Error during session check:`, err.message);
      return { sessionValid: false, currentUrl: '', reason: err.message };
    }
  }

  /**
   * Launch browser window for user to manually log in
   * User logs in with their own Google account manually.
   */
  async openForManualLogin() {
    console.log(`[AI Studio] Opening browser for manual Google login...`);
    const page = await this.ensurePage();
    await page.goto(AI_STUDIO_URLS.HOME, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.bringToFront();

    // Check if already logged in
    const check = await this.checkSession();
    return check;
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
      console.log(`[AI Studio] Browser closed cleanly`);
    }
  }
}

module.exports = GoogleAIStudioBrowser;
