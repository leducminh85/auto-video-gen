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
    this.queue = new ImageGenerationQueue(1); // Single worker queue
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
   * Public generate entry point - Enqueues task sequentially
   */
  async generate(input) {
    const requestId = input.requestId || `ai_studio_${Date.now()}`;
    return this.queue.enqueue(
      () => this._executeGeneration({ ...input, requestId }),
      `Request ${requestId}`
    );
  }

  /**
   * Internal generation execution on the persistent page
   */
  async _executeGeneration({ prompt, diegeticLabel, outputPath, requestId, aspectRatio = '16:9' }) {
    console.log(`[AI Studio] Request queued: ${requestId}`);
    const fullPrompt = this.preparePrompt(prompt, { diegeticLabel, aspectRatio });

    let responseHandler = null;
    let page = null;

    try {
      page = await this.browserWorker.ensurePage();

      // 1. Verify session
      const session = await this.browserWorker.checkSession();
      if (!session.sessionValid) {
        console.warn(`[AI Studio] Session invalid: user authentication required`);
        return createErrorResult({
          provider: this.name,
          requestId,
          code: ERROR_CODES.AUTH_REQUIRED,
          message: 'Google AI Studio session expired or not logged in. Please sign in.',
          details: session.reason,
        });
      }

      // 2. Open fresh new prompt page
      console.log(`[AI Studio] Opening fresh prompt editor: ${AI_STUDIO_URLS.NEW_CHAT}`);
      await page.goto(AI_STUDIO_URLS.NEW_CHAT, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(1500);

      // 3. Ensure image model (Nano Banana 2 Lite) is selected
      try {
        const modelBtn = page.locator(AI_STUDIO_SELECTORS.modelSelectorButton.join(', ')).first();
        const modelText = await modelBtn.innerText().catch(() => '');
        if (!modelText.includes('Nano Banana') && !modelText.includes('image')) {
          console.log(`[AI Studio] Current model "${modelText.trim()}" is not image model. Switching...`);
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
            console.log(`[AI Studio] Successfully switched to Nano Banana 2 Lite`);
          }
        }
      } catch (err) {
        console.warn(`[AI Studio] Model check warning:`, err.message);
      }

      // 4. Configure Output format ("Images only") & Aspect ratio ("16:9")
      try {
        const imagesOnlyBtn = page.locator(AI_STUDIO_SELECTORS.imagesOnlyButton.join(', ')).first();
        if (await imagesOnlyBtn.isVisible().catch(() => false)) {
          await imagesOnlyBtn.click();
          await page.waitForTimeout(300);
        }

        if (aspectRatio === '16:9') {
          const aspectSelect = page.locator(AI_STUDIO_SELECTORS.aspectRatioSelect.join(', ')).first();
          if (await aspectSelect.isVisible().catch(() => false)) {
            const currentAspect = await aspectSelect.innerText().catch(() => '');
            if (!currentAspect.includes('16:9')) {
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
        }
      } catch (err) {
        console.warn(`[AI Studio] Settings configuration warning:`, err.message);
      }

      // 5. Setup Network Interceptor for GenerateContent RPC (Primary, high-fidelity source)
      let capturedBase64 = null;
      responseHandler = async (res) => {
        const url = res.url();
        if (url.includes('MakerSuiteService/GenerateContent')) {
          try {
            const body = await res.text();
            const match = body.match(/\["image\/(?:jpeg|png|webp)",\s*"([A-Za-z0-9+/=]{100,})"\]/);
            if (match && match[1]) {
              capturedBase64 = match[1];
              console.log(`[AI Studio] Intercepted generated image via GenerateContent RPC (${capturedBase64.length} chars)`);
            }
          } catch (_) {}
        }
      };
      page.on('response', responseHandler);

      // 6. Locate and fill prompt textarea
      console.log(`[AI Studio] Locating prompt input...`);
      let inputLocator = null;
      for (const sel of AI_STUDIO_SELECTORS.promptInput) {
        const loc = page.locator(sel).first();
        if (await loc.isVisible().catch(() => false)) {
          inputLocator = loc;
          break;
        }
      }

      if (!inputLocator) {
        console.error(`[AI Studio] Failed: Prompt textarea not found on page`);
        return createErrorResult({
          provider: this.name,
          requestId,
          code: ERROR_CODES.UI_UNRECOGNIZED,
          message: 'Could not find prompt input area in AI Studio UI',
        });
      }

      await inputLocator.click();
      await inputLocator.fill(fullPrompt);
      console.log(`[AI Studio] Prompt entered: "${fullPrompt.substring(0, 70)}..."`);
      await page.waitForTimeout(300);

      // 7. Submit generation
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

      console.log(`[AI Studio] Prompt submitted, awaiting generation (timeout: 90s)...`);

      // 8. Wait for generation to complete (via network intercept or DOM)
      const startTime = Date.now();
      const maxTimeoutMs = 90000;
      let rawImageBuffer = null;

      while (Date.now() - startTime < maxTimeoutMs) {
        // Priority 1: Network Intercept
        if (capturedBase64) {
          rawImageBuffer = Buffer.from(capturedBase64, 'base64');
          console.log(`[AI Studio] Extracted pristine image from RPC intercept (${rawImageBuffer.length} bytes)`);
          break;
        }

        // Check for safety violation or system error
        const bodyContent = await page.textContent('body').catch(() => '');
        if (AI_STUDIO_SELECTORS.safetyViolationText.test(bodyContent)) {
          if (/permission denied|internal error/i.test(bodyContent)) {
            console.error(`[AI Studio] Google AI Studio service error detected`);
            return createErrorResult({
              provider: this.name,
              requestId,
              code: ERROR_CODES.GENERATION_FAILED,
              message: 'Google AI Studio reported an internal or permission error',
            });
          }
          console.warn(`[AI Studio] Safety guidelines triggered`);
          return createErrorResult({
            provider: this.name,
            requestId,
            code: ERROR_CODES.SAFETY_REJECTION,
            message: 'Prompt was flagged or rejected by Google AI Studio safety policies',
          });
        }

        // Check DOM for rendered image fallback
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
              console.log(`[AI Studio] Extracted image from DOM blob (${rawImageBuffer.length} bytes)`);
              break;
            }
          } catch (_) {}
        }

        await page.waitForTimeout(1000);
      }

      // Final fallback: DOM element screenshot if buffer still null
      if (!rawImageBuffer) {
        const fallbackImg = page.locator('img[alt*="Generated Image" i], img[src*="blob:https://aistudio.google.com"]').last();
        if (await fallbackImg.isVisible().catch(() => false)) {
          try {
            rawImageBuffer = await fallbackImg.screenshot();
            console.log(`[AI Studio] Acquired image via element screenshot fallback (${rawImageBuffer.length} bytes)`);
          } catch (_) {}
        }
      }

      if (!rawImageBuffer || rawImageBuffer.length < 5000) {
        console.warn(`[AI Studio] Failed: Generation timed out or image not received after ${maxTimeoutMs / 1000}s`);
        return createErrorResult({
          provider: this.name,
          requestId,
          code: ERROR_CODES.TIMEOUT,
          message: 'Timed out waiting for generated image from Google AI Studio',
        });
      }

      // 9. Process image with Sharp and write to outputPath (1920x1080 PNG)
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

      await sharp(rawImageBuffer)
        .resize(1920, 1080, { fit: 'cover', position: 'centre' })
        .png({ quality: 95 })
        .toFile(outputPath);

      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 5000) {
        console.log(`[AI Studio] Successfully saved 1920x1080 image to: ${outputPath}`);
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
      console.error(`[AI Studio] Generation error:`, err.message);
      return createErrorResult({
        provider: this.name,
        requestId,
        code: ERROR_CODES.BROWSER_ERROR,
        message: err.message,
      });
    } finally {
      if (page && responseHandler) {
        try {
          page.off('response', responseHandler);
        } catch (_) {}
      }
    }
  }
}

module.exports = GoogleAIStudioProvider;
