const BaseImageProvider = require('./BaseImageProvider.cjs');
const { PROVIDERS, ERROR_CODES, createSuccessResult, createErrorResult } = require('../types.cjs');
const GoogleAIStudioBrowser = require('../browser/GoogleAIStudioBrowser.cjs');
const ImageGenerationQueue = require('../queue/ImageGenerationQueue.cjs');
const { AI_STUDIO_URLS, AI_STUDIO_SELECTORS } = require('../selectors/aiStudioSelectors.cjs');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { IMAGE_MODELS, isQuotaError, withModelFallback } = require('../modelFallback.cjs');

async function readNewResponseImage(page, previousTurns) {
  const turns = page.locator('ms-chat-turn .model');
  if (await turns.count() <= previousTurns) return null;
  return turns.last().locator('img').evaluateAll(async images => {
    const img = images.find(image => image.naturalWidth >= 256 && image.naturalHeight >= 128 && /^(blob:|data:image\/|https:\/\/)/.test(image.src));
    if (!img) return null;
    try {
      const response = await fetch(img.src);
      if (!response.ok) return null;
      const blob = await response.blob();
      return await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch { return null; }
  });
}

/**
 * Google AI Studio Image Provider
 * Interacts with Google AI Studio web interface via Playwright persistent worker.
 */
class GoogleAIStudioProvider extends BaseImageProvider {
  constructor() {
    super(PROVIDERS.GOOGLE_AI_STUDIO);
    this.browserWorker = GoogleAIStudioBrowser.getInstance();
    this.queue = new ImageGenerationQueue(2); // 2 parallel tab workers (Tab 1: Even, Tab 2: Odd)
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
      clean += `. There is a clear, flat text that explicitly says "${diegeticLabel}" written neatly on a signboard, paper, screen, or chalkboard within the scene. The text must be bold, readable, and integrate naturally into the illustration.`;
    }
    return clean;
  }

  /**
   * Public generate entry point - Enqueues task into the 2-tab worker queue
   * Routes even index -> Tab 1, odd index -> Tab 2
   */
  async generate(input) {
    const requestId = input.requestId || `ai_studio_${Date.now()}`;
    let tabId = input.tabId;
    if (tabId == null && typeof input.imageIndex === 'number') {
      tabId = (input.imageIndex % 2 === 0) ? 1 : 2;
    }
    return this.queue.enqueue(
      () => withModelFallback(model => this._executeGeneration({ ...input, requestId, tabId, model }), { stopOnQuota: true }),
      `Request ${requestId} (Tab ${tabId || 'auto'})`
    );
  }

  /**
   * Internal generation execution on an acquired tab from the 2-tab pool
   */
  async _executeGeneration({ prompt, diegeticLabel, outputPath, requestId, aspectRatio = '16:9', imageIndex, tabId, model = IMAGE_MODELS[0] }) {
    const parityLabel = typeof imageIndex === 'number' ? (imageIndex % 2 === 0 ? 'EVEN' : 'ODD') : 'AUTO';
    console.log(`[AI Studio] Request queued: ${requestId} (Assigned Tab: ${tabId || 'auto'}, Parity: ${parityLabel}, Index: ${imageIndex ?? 'N/A'})`);
    const fullPrompt = this.preparePrompt(prompt, { diegeticLabel, aspectRatio });

    let responseHandler = null;
    let tab = null;

    try {
      // 1. Acquire dedicated tab from the 2-tab pool (Tab 1 for even, Tab 2 for odd)
      tab = await this.browserWorker.acquireTab(tabId);
      const page = tab.page;
      console.log(`[AI Studio Tab ${tab.id}] Acquired for request: ${requestId} [Index ${imageIndex ?? 'N/A'} - ${parityLabel}]`);

      // Previous generated images can otherwise become unintended editing references.
      await this.browserWorker.resetTab(tab, model);

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
            if (isQuotaError(body)) {
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
        await this.browserWorker.resetTab(tab, model);
        inputLocator = page.locator('textarea').first();
      }

      // 5. Input prompt into this tab
      await inputLocator.click();
      await inputLocator.fill(fullPrompt);
      console.log(`[AI Studio Tab ${tab.id}] Prompt entered: "${fullPrompt.substring(0, 60)}..."`);
      await page.waitForTimeout(300);

      // 6. Record existing images count on this tab to ensure strict prompt-to-image matching
      const previousTurns = await page.locator('ms-chat-turn .model').count();

      // 7. Submit generation on this tab
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

      // 8. Await generation output on this tab
      const startTime = Date.now();
      const maxTimeoutMs = 90000;
      let rawImageBuffer = null;
      let completedWithoutImageAt = null;

      while (Date.now() - startTime < maxTimeoutMs) {
        if (isQuotaExceeded) {
          tab.hasError = true;
          return createErrorResult({
            provider: this.name,
            requestId,
            code: ERROR_CODES.QUOTA_EXCEEDED,
            message: `${model.name} đã hết hạn mức tạo ảnh.`,
          });
        }

        if (capturedBase64) {
          rawImageBuffer = Buffer.from(capturedBase64, 'base64');
          console.log(`[AI Studio Tab ${tab.id}] Extracted pristine image (${rawImageBuffer.length} bytes)`);
          break;
        }

        const responseImage = await readNewResponseImage(page, previousTurns);
        if (responseImage) {
          rawImageBuffer = Buffer.from(responseImage, 'base64');
          break;
        }

        // Check for UI error text
        const quotaMessages = await page.locator(AI_STUDIO_SELECTORS.errorMessages.join(', ')).allTextContents();
        const modelTurns = page.locator('ms-chat-turn .model');
        const bodyContent = quotaMessages.join('\n') + (await modelTurns.count() > previousTurns ? await modelTurns.last().innerText() : '');
        if (quotaMessages.some(isQuotaError)) {
          tab.hasError = true;
          return createErrorResult({
            provider: this.name,
            requestId,
            code: ERROR_CODES.QUOTA_EXCEEDED,
            message: `${model.name} đã hết hạn mức tạo ảnh.`,
          });
        }

        const completed = await modelTurns.count() > previousTurns && await modelTurns.last().getByRole('button', { name: 'Good response', exact: true }).isVisible();
        completedWithoutImageAt = completed ? completedWithoutImageAt ?? Date.now() : null;
        if (completedWithoutImageAt && Date.now() - completedWithoutImageAt > 5000) {
          tab.hasError = true;
          return createErrorResult({ provider: this.name, requestId, code: ERROR_CODES.SERVICE_ERROR, message: 'Google AI Studio hoàn tất phản hồi nhưng không trả ảnh.' });
        }

        if (AI_STUDIO_SELECTORS.safetyViolationText.test(bodyContent)) {
          if (/permission denied|internal error/i.test(bodyContent)) {
            tab.hasError = true;
            return createErrorResult({
              provider: this.name,
              requestId,
              code: /internal error/i.test(bodyContent) ? ERROR_CODES.SERVICE_ERROR : ERROR_CODES.AUTH_REQUIRED,
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

        await page.waitForTimeout(500);
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
        .resize(1920, 1080, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
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
        code: err.code === ERROR_CODES.MODEL_UNAVAILABLE ? ERROR_CODES.MODEL_UNAVAILABLE : err.name === 'TimeoutError' ? ERROR_CODES.TIMEOUT : ERROR_CODES.BROWSER_ERROR,
        message: err.message,
      });
    } finally {
      if (tab && tab.page && responseHandler) {
        try {
          tab.page.off('response', responseHandler);
        } catch (_) {}
      }
      if (tab) {
        if (tab.hasError && !/accounts\.google\.com|signin/.test(tab.page.url())) await tab.page.goto('about:blank', { timeout: 10000 }).catch(() => {});
        this.browserWorker.releaseTab(tab);
      }
    }
  }
}

module.exports = GoogleAIStudioProvider;
