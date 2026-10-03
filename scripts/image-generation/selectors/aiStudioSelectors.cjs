/**
 * Resilient Selectors & Locators for Google AI Studio
 * Uses accessible names, roles, aria-labels, and standard HTML elements
 * to withstand DOM updates.
 */

const AI_STUDIO_URLS = {
  HOME: 'https://aistudio.google.com',
  NEW_CHAT: 'https://aistudio.google.com/prompts/new_chat',
  SIGN_IN_CHECK: 'https://aistudio.google.com',
};

const AI_STUDIO_SELECTORS = {
  // Login / Auth checks
  loginButton: [
    'a[href*="accounts.google.com"]',
    'button:has-text("Sign in")',
    'button:has-text("Đăng nhập")',
    '[aria-label*="Sign in" i]',
    '[aria-label*="Đăng nhập" i]',
  ],
  authenticatedIndicators: [
    'button[aria-label*="Google Account" i]',
    'button[aria-label*="Tài khoản Google" i]',
    'button[aria-label*="account" i]',
    'button:has-text("Get API key")',
    'button:has-text("Create new prompt")',
    'a[href*="/prompts/new_chat"]',
    'textarea',
  ],

  // Prompt input candidates (order of preference)
  promptInput: [
    'textarea[placeholder*="Type" i]',
    'textarea[placeholder*="prompt" i]',
    'textarea[aria-label*="prompt" i]',
    'div[contenteditable="true"]',
    'textarea',
  ],

  // Run / Submit button candidates
  runButton: [
    'button:has-text("Run")',
    'button[aria-label*="Run" i]',
    'button:has-text("Send")',
    'button[aria-label*="Send" i]',
    'button[data-testid*="run" i]',
  ],

  // Progress / Generating state
  stopButton: [
    'button:has-text("Stop")',
    'button[aria-label*="Stop" i]',
    '[aria-label*="Cancel" i]',
  ],
  loadingIndicators: [
    'mat-progress-bar',
    'mat-spinner',
    '[role="progressbar"]',
    '.loading-indicator',
  ],

  // Output images
  generatedImages: [
    'img[src*="blob:"]',
    'img[src*="data:image"]',
    'img[src*="googleusercontent"]',
    'img:not([alt*="avatar" i]):not([aria-hidden="true"])',
  ],

  // Download button
  downloadButton: [
    'button[aria-label*="Download" i]',
    'button:has-text("Download")',
    'button:has-text("Tải xuống")',
    'a[download]',
    '[data-testid*="download" i]',
  ],

  // Model selection
  modelSelectorButton: [
    'button.model-selector-card',
    'ms-model-selector button',
    '[aria-label*="model" i]',
  ],
  modelImagesTab: [
    'button:has-text("Images")',
    '[role="tab"]:has-text("Images")',
  ],
  nanoBananaModelOption: [
    'text="Nano Banana 2 Lite"',
    ':has-text("gemini-3.1-flash-lite-image")',
  ],

  // Output format & Aspect Ratio
  imagesOnlyButton: [
    'button:has-text("Images only")',
    '[aria-label*="Images only" i]',
  ],
  aspectRatioSelect: [
    'mat-select[aria-label*="Aspect" i]',
    'mat-select:has-text("Auto")',
    'mat-select:has-text("16:9")',
  ],
  aspectRatioOption169: [
    'mat-option:has-text("16:9")',
    '[role="option"]:has-text("16:9")',
  ],

  // Safety / Error messages
  safetyViolationText: /safety policy|violate|cannot generate|harmful|blocked|restricted|content guidelines|permission denied|internal error/i,
};

module.exports = {
  AI_STUDIO_URLS,
  AI_STUDIO_SELECTORS,
};
