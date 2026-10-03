const path = require('path');
const fs = require('fs');
const ImageGenerationManager = require('./ImageGenerationManager.cjs');

async function testManagerE2E() {
  console.log('=== TEST IMAGE GENERATION MANAGER END-TO-END ===');
  const manager = ImageGenerationManager.getInstance();

  const status = await manager.getStatus();
  console.log('Manager Status:', JSON.stringify(status, null, 2));

  const testOutputPath = path.resolve(process.cwd(), 'public/images/test_ai_studio_e2e.png');
  if (fs.existsSync(testOutputPath)) {
    try { fs.unlinkSync(testOutputPath); } catch (_) {}
  }

  const testPrompt = 'A minimal 2D stickman teacher holding a pointer at a blackboard with math equations, clean cartoon style';
  console.log(`Starting image generation with prompt: "${testPrompt}"`);

  const startTime = Date.now();
  const res = await manager.generateImage({
    prompt: testPrompt,
    outputPath: testOutputPath,
    requestId: 'test_e2e_' + Date.now(),
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Generation completed in ${durationSec}s:`, res);

  if (res.success && fs.existsSync(testOutputPath)) {
    const stat = fs.statSync(testOutputPath);
    console.log(`SUCCESS! File generated at ${testOutputPath} (size: ${stat.size} bytes)`);
  } else {
    console.error('FAILED! Image not generated.');
  }

  // Close browser cleanly
  const browserWorker = require('./browser/GoogleAIStudioBrowser.cjs').getInstance();
  await browserWorker.close();
  console.log('=== TEST FINISHED ===');
}

testManagerE2E().catch(err => {
  console.error('Test manager error:', err);
  process.exit(1);
});
