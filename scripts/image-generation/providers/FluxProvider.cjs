const BaseImageProvider = require('./BaseImageProvider.cjs');
const { PROVIDERS, ERROR_CODES, createSuccessResult, createErrorResult } = require('../types.cjs');
const { isLocalServerAlive, generateViaLocalServer, generateViaMflux } = require('../fluxEngine.cjs');
const fs = require('fs');

/**
 * Flux Local Image Provider (Apple Silicon Metal M4 via mflux / Draw Things)
 */
class FluxProvider extends BaseImageProvider {
  constructor() {
    super(PROVIDERS.FLUX_LOCAL);
  }

  /**
   * Health check for Flux local
   * Returns true if either local server (7860) or mflux CLI is available
   */
  async healthCheck() {
    const serverAlive = await isLocalServerAlive();
    if (serverAlive) return true;

    try {
      const { execSync } = require('child_process');
      execSync('which mflux-generate', { stdio: 'pipe' });
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Prepare prompt for Flux
   */
  preparePrompt(prompt, options = {}) {
    const { diegeticLabel } = options;
    let clean = (prompt || '').trim();
    if (clean.includes('whiteboard animation doodle') || clean.includes('Pure white background')) {
      if (diegeticLabel && !clean.includes(diegeticLabel)) {
        clean += ` The text "${diegeticLabel}" is written clearly and boldly.`;
      }
      return clean;
    }
    if (diegeticLabel) {
      return `${clean}. Hand-drawn stickman comic explainer style, minimalist line art, clean vector comic style, warm paper texture background. The exact text "${diegeticLabel}" is legibly written on a sign, label, or chalkboard.`;
    }
    return `${clean}. Hand-drawn stickman comic explainer style, minimalist line art, clean vector comic style, warm paper texture background.`;
  }

  /**
   * Generate image via Flux Local
   */
  async generate({ prompt, diegeticLabel, outputPath, requestId }) {
    if (process.env.ENABLE_FLUX !== 'true') {
      console.log(`   ⛔ [FluxProvider] Flux local đang bị TẮT để debug Google AI Studio.`);
      return createErrorResult({
        provider: this.name,
        requestId,
        code: ERROR_CODES.UNAVAILABLE,
        message: 'Flux local is disabled for Google AI Studio debugging.',
      });
    }

    const fullPrompt = this.preparePrompt(prompt, { diegeticLabel });

    // 1. Try Local Draw Things / SD WebUI Server on Mac M4 Metal (127.0.0.1:7860) if running
    try {
      const localRes = await generateViaLocalServer({ prompt: fullPrompt, outputPath });
      if (localRes.success && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 5000) {
        return createSuccessResult({
          provider: this.name,
          requestId,
          imagePath: outputPath,
          metadata: { method: 'local_flux_server' },
        });
      }
    } catch (err) {
      console.warn(`   ⚠️ [FluxProvider] Local server error:`, err.message);
    }

    // 2. Try Local Apple Silicon Metal mflux on Mac M4
    try {
      const mfluxRes = await generateViaMflux({ prompt: fullPrompt, outputPath });
      if (mfluxRes.success && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 5000) {
        return createSuccessResult({
          provider: this.name,
          requestId,
          imagePath: outputPath,
          metadata: { method: 'local_mflux' },
        });
      }
    } catch (err) {
      console.warn(`   ⚠️ [FluxProvider] mflux error:`, err.message);
      return createErrorResult({
        provider: this.name,
        requestId,
        code: ERROR_CODES.GENERATION_FAILED,
        message: err.message,
      });
    }

    return createErrorResult({
      provider: this.name,
      requestId,
      code: ERROR_CODES.UNAVAILABLE,
      message: 'Both Local Flux Server and mflux-generate were unavailable or failed.',
    });
  }
}

module.exports = FluxProvider;
