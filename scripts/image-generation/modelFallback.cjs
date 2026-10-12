const { ERROR_CODES } = require('./types.cjs');

const IMAGE_MODELS = [
  { name: 'Nano Banana', id: 'gemini-2.5-flash-image', aliases: [] },
  { name: 'Nano Banana 2 Lite', id: 'gemini-3.1-flash-lite-image', aliases: ['Nano Banana Lite'] },
  { name: 'Nano Banana 2', id: 'gemini-3.1-flash-image', aliases: [] },
  { name: 'Nano Banana 2.1', id: 'gemini-nano-banana-2.1', aliases: [] },
];

function isQuotaError(text) {
  return /out of (?:free generations|limit)|quota[^\n]{0,100}(?:exceed|exhaust|reached|for (?:the )?day)|exceeded[^\n]{0,60}quota|rate[ _-]?limit|resource_exhausted|too many requests|reached[^\n]{0,80}(?:quota|limit)|limit[^\n]{0,40}(?:exceeded|reached)|hết (?:hạn mức|lượt)|vượt[^\n]{0,40}(?:hạn mức|giới hạn)/i.test(String(text || ''));
}

function selectedModel(text) {
  const value = String(text || '').toLowerCase();
  const id = value.match(/gemini-[a-z0-9.-]+/g) || [];
  const byId = IMAGE_MODELS.find(model => id.includes(model.id));
  if (byId) return byId;
  const name = value.match(/nano\s+banana(?:\s+(?:\d+(?:\.\d+)?(?:\s+lite)?|lite|pro))?/)?.[0].replace(/\s+/g, ' ');
  return IMAGE_MODELS.find(model => [model.name, ...model.aliases].some(alias => alias.toLowerCase() === name));
}

async function withModelFallback(attempt) {
  let result;
  const attempts = [];
  for (const model of IMAGE_MODELS) {
    for (let retry = 0; retry < 2; retry++) {
      result = await attempt(model);
      attempts.push({ model: model.name, code: result.error?.code || 'SUCCESS' });
      if (result.success) return { ...result, metadata: { ...result.metadata, model: model.id, modelName: model.name, attempts } };
      if (![ERROR_CODES.TIMEOUT, ERROR_CODES.SERVICE_ERROR].includes(result.error?.code)) break;
      if (retry === 0) console.warn(`[AI Studio] ${model.name}: ${result.error.message}. Retrying in a fresh chat.`);
    }
    if (![ERROR_CODES.QUOTA_EXCEEDED, ERROR_CODES.MODEL_UNAVAILABLE, ERROR_CODES.TIMEOUT, ERROR_CODES.SERVICE_ERROR].includes(result.error?.code)) return result;
  }
  return { ...result, error: { ...result.error, message: 'Không còn model tạo ảnh khả dụng trong danh sách dự phòng.', details: { attempts } } };
}

module.exports = { IMAGE_MODELS, isQuotaError, selectedModel, withModelFallback };
