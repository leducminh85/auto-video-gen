const path = require('path');
const fs = require('fs');
const ImageGenerationManager = require('./ImageGenerationManager.cjs');

async function test3TabsParallel() {
  console.log('========================================================');
  console.log('🚀 TEST: 3 PARALLEL TABS & CHAT REUSE (PROMPT-TO-IMAGE)');
  console.log('========================================================\n');

  const manager = ImageGenerationManager.getInstance();

  const prompts = [
    {
      id: 'req_1_chef',
      prompt: 'A 2D stickman chef cooking soup with a big pot, minimalist cartoon',
      outputPath: path.resolve(process.cwd(), 'public/images/test_parallel_tab1_chef.png'),
    },
    {
      id: 'req_2_astronaut',
      prompt: 'A 2D stickman astronaut floating in space with stars, minimalist cartoon',
      outputPath: path.resolve(process.cwd(), 'public/images/test_parallel_tab2_astronaut.png'),
    },
    {
      id: 'req_3_musician',
      prompt: 'A 2D stickman musician playing an acoustic guitar on stage, minimalist cartoon',
      outputPath: path.resolve(process.cwd(), 'public/images/test_parallel_tab3_musician.png'),
    },
  ];

  console.log('Step 1: Enqueueing 3 requests simultaneously to run in 3 parallel tabs...\n');
  const t0 = Date.now();

  const resultsBatch1 = await Promise.all(
    prompts.map(p =>
      manager.generateImage({
        prompt: p.prompt,
        outputPath: p.outputPath,
        requestId: p.id,
      })
    )
  );

  const duration1 = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n--- Batch 1 finished in ${duration1}s ---`);
  resultsBatch1.forEach((r, idx) => {
    console.log(`Result ${idx + 1} (${prompts[idx].id}):`, r.success ? '✓ SUCCESS' : `✗ ${r.error?.message}`);
  });

  // Step 2: Test Chat Reuse (Second generation on the same 3 tabs without reloading new_chat)
  console.log('\n========================================================');
  console.log('Step 2: Enqueueing 3 more requests to verify CHAT REUSE (Turn 2)...');
  console.log('========================================================\n');

  const reusePrompts = [
    {
      id: 'req_4_doctor',
      prompt: 'A 2D stickman doctor with a stethoscope, minimalist cartoon',
      outputPath: path.resolve(process.cwd(), 'public/images/test_parallel_tab1_doctor.png'),
    },
    {
      id: 'req_5_farmer',
      prompt: 'A 2D stickman farmer in a wheat field, minimalist cartoon',
      outputPath: path.resolve(process.cwd(), 'public/images/test_parallel_tab2_farmer.png'),
    },
    {
      id: 'req_6_detective',
      prompt: 'A 2D stickman detective with a magnifying glass, minimalist cartoon',
      outputPath: path.resolve(process.cwd(), 'public/images/test_parallel_tab3_detective.png'),
    },
  ];

  const t1 = Date.now();
  const resultsBatch2 = await Promise.all(
    reusePrompts.map(p =>
      manager.generateImage({
        prompt: p.prompt,
        outputPath: p.outputPath,
        requestId: p.id,
      })
    )
  );

  const duration2 = ((Date.now() - t1) / 1000).toFixed(1);
  console.log(`\n--- Batch 2 (Reuse) finished in ${duration2}s ---`);
  resultsBatch2.forEach((r, idx) => {
    console.log(`Result ${idx + 1} (${reusePrompts[idx].id}):`, r.success ? '✓ SUCCESS' : `✗ ${r.error?.message}`);
  });

  // Close browser cleanly
  const browserWorker = require('./browser/GoogleAIStudioBrowser.cjs').getInstance();
  await browserWorker.close();
  console.log('\nAll tests completed.');
}

test3TabsParallel().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
