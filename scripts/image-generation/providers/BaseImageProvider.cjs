/**
 * Abstract Base Class for Image Providers
 */
class BaseImageProvider {
  constructor(name) {
    if (!name) throw new Error('Provider name is required');
    this.name = name;
  }

  /**
   * Check if this provider is ready and functional
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    throw new Error(`healthCheck() not implemented for ${this.name}`);
  }

  /**
   * Format or adapt prompt for this specific provider if necessary
   * Does NOT alter the core semantic prompt
   */
  preparePrompt(prompt, options = {}) {
    return prompt;
  }

  /**
   * Generate image
   * @param {Object} input - { prompt, diegeticLabel, outputPath, requestId, aspectRatio }
   * @returns {Promise<Object>} Standardized result object
   */
  async generate(input) {
    throw new Error(`generate() not implemented for ${this.name}`);
  }
}

module.exports = BaseImageProvider;
