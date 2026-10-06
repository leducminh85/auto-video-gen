const path = require('node:path');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const ImageGenerationManager = require('./image-generation/ImageGenerationManager.cjs');

async function regenerateBeatImage({ sceneId, subIndex = 1, prompt, diegeticLabel = '', preferredProvider = null }) {
  if (!Number.isInteger(sceneId) || sceneId < 1 || typeof prompt !== 'string' || !prompt.trim() || prompt.length > 20000) {
    throw new Error('Cảnh hoặc mô tả ảnh không hợp lệ.');
  }
  const imageFile = `edit_${randomUUID()}.png`;
  const outputPath = path.resolve('public/images', imageFile);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  try {
    const result = await ImageGenerationManager.getInstance().generateImage({
      prompt: prompt.trim(), diegeticLabel, outputPath,
      requestId: `edit_${randomUUID()}`, preferredProvider,
      imageIndex: subIndex, tabId: subIndex % 2 === 0 ? 1 : 2,
    });
    if (!result.success || !fs.existsSync(outputPath) || fs.statSync(outputPath).size < 5000) {
      throw new Error(result.error?.message || 'Tạo ảnh không thành công.');
    }
    return { success: true, sceneId, subIndex, imageFile, timestamp: Date.now() };
  } catch (error) {
    fs.rmSync(outputPath, { force: true });
    throw error;
  }
}
module.exports = { regenerateBeatImage };
