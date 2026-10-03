const { PROVIDERS, ERROR_CODES, createErrorResult } = require('./types.cjs');
const GoogleAIStudioProvider = require('./providers/GoogleAIStudioProvider.cjs');
const FluxProvider = require('./providers/FluxProvider.cjs');
const GoogleAIStudioBrowser = require('./browser/GoogleAIStudioBrowser.cjs');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.resolve(process.cwd(), 'data/image-provider-config.json');

/**
 * Image Generation Manager
 * Coordinates Image Providers, applies priority rules, and manages graceful fallbacks.
 */
class ImageGenerationManager {
  constructor() {
    this.providers = {
      [PROVIDERS.GOOGLE_AI_STUDIO]: new GoogleAIStudioProvider(),
      [PROVIDERS.FLUX_LOCAL]: new FluxProvider(),
    };

    // Load persisted preference if available
    this.preferredProvider = this._loadPreferredProvider() || PROVIDERS.GOOGLE_AI_STUDIO;
  }

  static getInstance() {
    if (!ImageGenerationManager.instance) {
      ImageGenerationManager.instance = new ImageGenerationManager();
    }
    return ImageGenerationManager.instance;
  }

  _loadPreferredProvider() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        if (raw.preferredProvider && this.providers[raw.preferredProvider]) {
          return raw.preferredProvider;
        }
      }
    } catch (_) {}
    return PROVIDERS.GOOGLE_AI_STUDIO;
  }

  setPreferredProvider(providerName) {
    if (!this.providers[providerName]) {
      throw new Error(`Unknown provider: ${providerName}`);
    }
    this.preferredProvider = providerName;
    try {
      const dataDir = path.dirname(CONFIG_FILE);
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({ preferredProvider: providerName }, null, 2));
      console.log(`[ImageManager] Preferred provider set to: ${providerName}`);
    } catch (err) {
      console.warn(`[ImageManager] Failed to persist provider preference:`, err.message);
    }
  }

  getPreferredProvider() {
    return this.preferredProvider;
  }

  getProvider(name) {
    return this.providers[name];
  }

  /**
   * Comprehensive Status for UI & APIs
   */
  async getStatus() {
    let aiStudioSession = { sessionValid: false, currentUrl: '' };
    try {
      aiStudioSession = await GoogleAIStudioBrowser.getInstance().checkSession();
    } catch (_) {}

    const fluxAvailable = await this.providers[PROVIDERS.FLUX_LOCAL].healthCheck();

    return {
      preferredProvider: this.preferredProvider,
      availableProviders: [
        {
          id: PROVIDERS.GOOGLE_AI_STUDIO,
          label: 'Google AI Studio (Recommended)',
          connected: aiStudioSession.sessionValid,
          statusText: aiStudioSession.sessionValid ? 'Connected' : 'Login required',
        },
        {
          id: PROVIDERS.FLUX_LOCAL,
          label: 'Flux Local (Apple Silicon Metal M4)',
          connected: fluxAvailable,
          statusText: fluxAvailable ? 'Ready' : 'Not ready',
        },
      ],
      aiStudioSession,
      fluxAvailable,
    };
  }

  /**
   * Main image generation entry point with fallback routing
   * Priority: Google AI Studio -> Flux Local (or custom user preference)
   */
  async generateImage({ prompt, diegeticLabel, outputPath, requestId, preferredProvider = null, imageIndex = null, tabId = null }) {
    const activePref = preferredProvider || this.preferredProvider;
    const reqId = requestId || `img_${Date.now()}`;

    // Priority 1: Preferred Provider
    let primaryProviderName = activePref;
    let fallbackProviderName =
      activePref === PROVIDERS.GOOGLE_AI_STUDIO ? PROVIDERS.FLUX_LOCAL : PROVIDERS.GOOGLE_AI_STUDIO;

    const primaryProvider = this.providers[primaryProviderName];
    const fallbackProvider = this.providers[fallbackProviderName];

    console.log(`\n🎨 [ImageManager] Generation Request (${reqId})`);
    console.log(`   Primary Provider: ${primaryProviderName}`);
    console.log(`   Fallback Provider: ${fallbackProviderName}`);
    if (imageIndex !== null) console.log(`   Image Index: ${imageIndex} (Assigned Tab: ${(imageIndex % 2 === 0 ? 1 : 2)})`);

    // Attempt Primary Provider
    try {
      const primaryRes = await primaryProvider.generate({
        prompt,
        diegeticLabel,
        outputPath,
        requestId: reqId,
        imageIndex,
        tabId,
      });

      if (primaryRes.success && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 5000) {
        console.log(`   ✓ [ImageManager] Successfully generated via ${primaryProviderName}`);
        return primaryRes;
      }

      console.warn(`   ⚠️ [ImageManager] Primary provider (${primaryProviderName}) failed:`, primaryRes.error?.message);

      // Handle AUTH_REQUIRED
      if (primaryRes.error?.code === ERROR_CODES.AUTH_REQUIRED) {
        console.log(`   🔑 [ImageManager] Google AI Studio requires authentication. Triggering manual login browser...`);
        try {
          await GoogleAIStudioBrowser.getInstance().openForManualLogin();
        } catch (_) {}
      }

      // DEBUG MODE: Disable Flux fallback so user can debug Google AI Studio directly
      const isFluxDisabled = true;
      if (isFluxDisabled) {
        console.log(`   ⛔ [ImageManager] Flux Local đang bị TẮT (chế độ Debug Google AI Studio). Trả về kết quả trực tiếp của Google AI Studio.`);
        return primaryRes || createErrorResult({
          provider: primaryProviderName,
          requestId: reqId,
          code: ERROR_CODES.GENERATION_FAILED,
          message: 'Google AI Studio generation did not complete and Flux fallback is disabled.',
        });
      }
    } catch (primaryErr) {
      console.warn(`   ⚠️ [ImageManager] Primary provider exception:`, primaryErr.message);
      return createErrorResult({
        provider: primaryProviderName,
        requestId: reqId,
        code: ERROR_CODES.BROWSER_ERROR,
        message: primaryErr.message,
      });
    }

    // Step 2: Fallback to Secondary Provider (Disabled during debug)
    console.log(`   🔄 [ImageManager] Falling back to ${fallbackProviderName}...`);
    try {
      const fallbackRes = await fallbackProvider.generate({
        prompt,
        diegeticLabel,
        outputPath,
        requestId: reqId,
      });

      if (fallbackRes.success && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 5000) {
        console.log(`   ✓ [ImageManager] Fallback generation succeeded via ${fallbackProviderName}`);
        return fallbackRes;
      }

      console.error(`   ❌ [ImageManager] Both providers failed for request ${reqId}`);
      return fallbackRes;
    } catch (fallbackErr) {
      console.error(`   ❌ [ImageManager] Fallback provider exception:`, fallbackErr.message);
      return createErrorResult({
        provider: fallbackProviderName,
        requestId: reqId,
        code: ERROR_CODES.GENERATION_FAILED,
        message: `Both providers failed: ${fallbackErr.message}`,
      });
    }
  }
}

module.exports = ImageGenerationManager;
