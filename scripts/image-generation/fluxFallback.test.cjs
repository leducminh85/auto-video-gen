const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Manager = require('./ImageGenerationManager.cjs');
const { PROVIDERS, ERROR_CODES } = require('./types.cjs');

test('quota switches to local Flux with the complete original request; other failures do not', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-fallback-'));
  try {
    const manager = new Manager();
    const request = { prompt: 'Full style, action and continuity.', diegeticLabel: '', outputPath: path.join(dir, 'image.png'), requestId: 'quota-test', preferredProvider: PROVIDERS.GOOGLE_AI_STUDIO };
    let localCalls = 0;
    let code = ERROR_CODES.QUOTA_EXCEEDED;
    manager.providers[PROVIDERS.GOOGLE_AI_STUDIO] = { generate: async () => ({ success: false, error: { code, message: 'out of limit' } }) };
    manager.providers[PROVIDERS.FLUX_LOCAL] = { generate: async input => {
      localCalls++;
      for (const key of ['prompt', 'diegeticLabel', 'outputPath', 'requestId']) assert.equal(input[key], request[key]);
      fs.writeFileSync(input.outputPath, Buffer.alloc(6000));
      return { success: true, provider: PROVIDERS.FLUX_LOCAL };
    } };
    assert.equal((await manager.generateImage(request)).provider, PROVIDERS.FLUX_LOCAL);
    assert.equal(localCalls, 1);
    code = ERROR_CODES.SAFETY_BLOCKED;
    assert.equal((await manager.generateImage(request)).success, false);
    assert.equal(localCalls, 1);
    code = ERROR_CODES.QUOTA_EXCEEDED;
    manager.providers[PROVIDERS.FLUX_LOCAL] = { generate: async () => ({ success: false, error: { code: ERROR_CODES.UNAVAILABLE } }) };
    assert.equal((await manager.generateImage(request)).error.code, ERROR_CODES.UNAVAILABLE);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
