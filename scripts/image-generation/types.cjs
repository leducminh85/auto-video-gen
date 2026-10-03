/**
 * Image Generation Provider Types and Constants
 */

const PROVIDERS = {
  GOOGLE_AI_STUDIO: 'google_ai_studio',
  FLUX_LOCAL: 'flux_local',
};

const ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  TIMEOUT: 'TIMEOUT',
  GENERATION_FAILED: 'GENERATION_FAILED',
  SAFETY_REJECTION: 'SAFETY_REJECTION',
  BROWSER_ERROR: 'BROWSER_ERROR',
  UI_UNRECOGNIZED: 'UI_UNRECOGNIZED',
  UNAVAILABLE: 'UNAVAILABLE',
};

function createSuccessResult({ provider, requestId, imagePath, metadata = {} }) {
  return {
    success: true,
    provider,
    requestId: requestId || `req_${Date.now()}`,
    imagePath,
    error: null,
    metadata,
  };
}

function createErrorResult({ provider, requestId, code, message, details = null }) {
  return {
    success: false,
    provider,
    requestId: requestId || `req_${Date.now()}`,
    imagePath: null,
    error: {
      code: code || ERROR_CODES.GENERATION_FAILED,
      message: message || 'Unknown error occurred during image generation',
      details,
    },
  };
}

module.exports = {
  PROVIDERS,
  ERROR_CODES,
  createSuccessResult,
  createErrorResult,
};
