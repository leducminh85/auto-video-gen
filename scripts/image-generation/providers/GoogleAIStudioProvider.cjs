const BaseImageProvider = require('./BaseImageProvider.cjs');
const { PROVIDERS, ERROR_CODES, createSuccessResult, createErrorResult } = require('../types.cjs');
const GoogleAIStudioBrowser = require('../browser/GoogleAIStudioBrowser.cjs');
const ImageGenerationQueue = require('../queue/ImageGenerationQueue.cjs');
const { AI_STUDIO_URLS, AI_STUDIO_SELECTORS } = require('../selectors/aiStudioSelectors.cjs');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Google AI Studio Image Provider
 * Interacts with Google AI Studio web interface via Playwright persistent worker.
 */
class GoogleAIStudioProvider extends BaseImageProvider {
  constructor() {
    super(PROVIDERS.GOOGLE_AI_STUDIO);
    this.browserWorker = GoogleAIStudioBrowser.getInstance();
    this.queue = new ImageGenerationQueue(3); // 3 parallel tab workers
  }

  /**
   * Health check: verifies session and access to AI Studio
   */
  async healthCheck() {
    try {
      const session = await this.browserWorker.checkSession();
      return session.sessionValid;
    } catch (_) {
      return false;
    }
  }

  /**
   * Format prompt for AI Studio
   */
  preparePrompt(prompt, options = {}) {
    const { diegeticLabel } = options;
    let clean = (prompt || '').trim();
    if (diegeticLabel && !clean.includes(diegeticLabel)) {
      clean += `. Include legible text: "${diegeticLabel}".`;
    }
    return clean;
  }

  /**
   * Public generate entry point - Enqueues task into the 3-tab worker queue
   */
  async generate(input) {
    const requestId = input.requestId || `ai_studio_${Date.now()}`;
    return this.queue.enqueue(
      () => this._executeGeneration({ ...input, requestId }),
      `Request ${requestId}`
    );
  }

  /**
   * Internal generation execution on an acquired tab from the 3-tab pool
   */
  async _executeGeneration({ prompt, diegeticLabel, outputPath, requestId, aspectRatio = '16:9' }) {
    console.log(`[AI Studio] Request queued: ${requestId}`);
    const fullPrompt = this.preparePrompt(prompt, { diegeticLabel, aspectRatio });

    let responseHandler = null;
    let tab = null;

    try {
      // 1. Acquire dedicated tab from the 3-tab pool
      tab = await this.browserWorker.acquireTab();
      const page = tab.page;
      console.log(`[AI Studio Tab ${tab.id}] Acquired for request: ${requestId}`);

      // 2. Chat reuse check: If tab is not initialized or chat is too long (> 15 turns), reset it
      if (!tab.isInitialized || tab.turnCount >= 15 || tab.hasError) {
        await this.browserWorker.resetTab(tab);
      } else {
        console.log(`[AI Studio Tab ${tab.id}] ⚡ Reusing existing chat session (turn ${tab.turnCount + 1}) without reloading!`);
      }

      // 3. Register Network Interceptor for GenerateContent RPC strictly on THIS tab
      let capturedBase64 = null;
      let isQuotaExceeded = false;

      responseHandler = async (res) => {
        const url = res.url();
        if (url.includes('MakerSuiteService/GenerateContent')) {
          if (res.status() === 429) {
            console.warn(`[AI Studio Tab ${tab.id}] Rate limit / Quota exceeded (HTTP 429)`);
            isQuotaExceeded = true;
            return;
          }
          try {
            const body = await res.text();
            if (body.includes('user has exceeded quota') || body.includes('quota for the day') || body.includes('out of free generations')) {
              isQuotaExceeded = true;
              return;
            }
            const match = body.match(/\["image\/(?:jpeg|png|webp)",\s*"([A-Za-z0-9+/=]{100,})"\]/);
            if (match && match[1]) {
              capturedBase64 = match[1];
              console.log(`[AI Studio Tab ${tab.id}] Intercepted generated image via GenerateContent RPC (${capturedBase64.length} chars)`);
            }
          } catch (_) {}
        }
      };
      page.on('response', responseHandler);

      // 4. Locate prompt textarea on this tab
      let inputLocator = null;
      for (const sel of AI_STUDIO_SELECTORS.promptInput) {
        const loc = page.locator(sel).first();
        if (await loc.isVisible().catch(() => false)) {
          inputLocator = loc;
          break;
        }
      }

      if (!inputLocator) {
        console.log(`[AI Studio Tab ${tab.id}] Input not found, resetting tab...`);
        await this.browserWorker.resetTab(tab);
        inputLocator = page.locator('textarea').first();
      }

      // 5. Input prompt into this tab
      await inputLocator.click();
      await inputLocator.fill(fullPrompt);
      console.log(`[AI Studio Tab ${tab.id}] Prompt entered: "${fullPrompt.substring(0, 60)}..."`);
      await page.waitForTimeout(300);

      // 6. Submit generation on this tab
      let submitted = false;
      for (const sel of AI_STUDIO_SELECTORS.runButton) {
        const runBtn = page.locator(sel).first();
        if (await runBtn.isVisible().catch(() => false)) {
          await runBtn.click();
          submitted = true;
          break;
        }
      }

      if (!submitted) {
        await page.keyboard.press('ControlOrMeta+Enter');
      }

      console.log(`[AI Studio Tab ${tab.id}] Submitted, awaiting generation...`);

      // 7. Await generation output on this tab
      const startTime = Date.now();
      const maxTimeoutMs = 90000;
      let rawImageBuffer = null;

      while (Date.now() - startTime < maxTimeoutMs) {
        if (isQuotaExceeded) {
          tab.hasError = true;
          return createErrorResult({
            provider: this.name,
            requestId,
            code: ERROR_CODES.GENERATION_FAILED,
            message: 'Google AI Studio daily quota exceeded: "You\'ve reached your quota for the day". Please wait for reset or use Flux Local.',
          });
        }

        if (capturedBase64) {
          rawImageBuffer = Buffer.from(capturedBase64, 'base64');
          console.log(`[AI Studio Tab ${tab.id}] Extracted pristine image (${rawImageBuffer.length} bytes)`);
          break;
        }

        // Check for UI error text
        const bodyContent = await page.textContent('body').catch(() => '');
        if (bodyContent.includes('user has exceeded quota') || bodyContent.includes('out of free generations') || bodyContent.includes('quota for the day')) {
          tab.hasError = true;
          return createErrorResult({
            provider: this.name,
            requestId,
            code: ERROR_CODES.GENERATION_FAILED,
            message: 'Google AI Studio daily quota exceeded: "You are out of free generations for the day".',
          });
        }

        if (AI_STUDIO_SELECTORS.safetyViolationText.test(bodyContent)) {
          if (/permission denied|internal error/i.test(bodyContent)) {
            tab.hasError = true;
            return createErrorResult({
              provider: this.name,
              requestId,
              code: ERROR_CODES.GENERATION_FAILED,
              message: 'Google AI Studio reported an internal or permission error',
            });
          }
          return createErrorResult({
            provider: this.name,
            requestId,
            code: ERROR_CODES.SAFETY_REJECTION,
            message: 'Prompt was flagged or rejected by Google AI Studio safety policies',
          });
        }

        // DOM Fallback
        const generatedImg = page.locator('img[alt*="Generated Image" i], img[src*="blob:https://aistudio.google.com"]').last();
        if (await generatedImg.isVisible().catch(() => false)) {
          try {
            const b64 = await generatedImg.evaluate(async (img) => {
              if (!img || !img.src) return null;
              if (img.src.startsWith('data:image')) return img.src.split(',')[1];
              try {
                const res = await fetch(img.src);
                const blob = await res.blob();
                return new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result.split(',')[1]);
                  reader.readAsDataURL(blob);
                });
              } catch (_) { return null; }
            });
            if (b64 && b64.length > 5000) {
              rawImageBuffer = Buffer.from(b64, 'base64');
              break;
            }
          } catch (_) {}
        }

        await page.waitForTimeout(800);
      }

      if (!rawImageBuffer || rawImageBuffer.length < 5000) {
        tab.hasError = true;
        return createErrorResult({
          provider: this.name,
          requestId,
          code: ERROR_CODES.TIMEOUT,
          message: `Timed out waiting for generated image on Tab ${tab.id}`,
        });
      }

      // 8. Process and write to outputPath (1920x1080)
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

      await sharp(rawImageBuffer)
        .resize(1920, 1080, { fit: 'cover', position: 'centre' })
        .png({ quality: 95 })
        .toFile(outputPath);

      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 5000) {
        tab.turnCount++;
        console.log(`[AI Studio Tab ${tab.id}] ✓ Successfully saved 1920x1080 image to: ${outputPath}`);
        return createSuccessResult({
          provider: this.name,
          requestId,
          imagePath: outputPath,
        });
      }

      return createErrorResult({
        provider: this.name,
        requestId,
        code: ERROR_CODES.GENERATION_FAILED,
        message: 'Saved image file is missing or invalid',
      });
    } catch (err) {
      if (tab) tab.hasError = true;
      console.error(`[AI Studio] Generation error:`, err.message);
      return createErrorResult({
        provider: this.name,
        requestId,
        code: ERROR_CODES.BROWSER_ERROR,
        message: err.message,
      });
    } finally {
      if (tab && tab.page && responseHandler) {
        try {
          tab.page.off('response', responseHandler);
        } catch (_) {}
      }
      if (tab) {
        this.browserWorker.releaseTab(tab);
      }
    }
  }
}

module.exports = GoogleAIStudioProvider;
