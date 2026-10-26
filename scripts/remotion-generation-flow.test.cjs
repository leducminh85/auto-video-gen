const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('approved generation skips visual review and resumes completed shots after render failure', async () => {
  const render = require('./remotionRender.cjs');
  const audio = require('./audioAlignment.cjs');
  const tts = require('./videoGenerator.cjs');
  const originals = {render: render.renderRemotion, align: audio.alignAudio, tts: tts.generateTTSAudio};
  const cwd = process.cwd();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'remotion-flow-'));
  let renders = 0, requests = 0;
  render.renderRemotion = async (project, directory, publicRoot, progress, options) => {
    renders++;
    assert.equal(options.animatic, undefined);
    options.assertRunning();
    if (renders <= 4) throw new Error('Temporary renderer failure');
    return project;
  };
  audio.alignAudio = async () => [];
  tts.generateTTSAudio = async () => 3;
  delete require.cache[require.resolve('./remotionGenerator.cjs')];
  const {generateVideo} = require('./remotionGenerator.cjs');
  const {ChatGPTBrowser} = require('./chatgptBrowser.cjs');
  const open = ChatGPTBrowser.prototype.open, request = ChatGPTBrowser.prototype.request;
  ChatGPTBrowser.prototype.open = async () => ({connected:true});
  ChatGPTBrowser.prototype.request = async prompt => {
    requests++;
    assert.ok(!prompt.includes('Inspect the ATTACHED'));
    return JSON.stringify({version:1,styleId:'STICKMAN_500IQ_V1',background:'#ffffff',layers:[
      {id:'set',type:'g',children:[{id:'set-floor',type:'rect',attrs:{width:1920,height:1080,fill:'#ffffff'}}]},
      {id:'protagonist',type:'character',x:500,y:300},
    ]});
  };
  try {
    const list = require('./fixtures/sceneList.cjs').sceneList();
    const storyboard = require('./remotionSceneList.cjs').toStoryboard(list,'one two three',3,true);
    const approvedPlan = {id:'test-approved-flow',run:'test-approved-flow',text:'one two three',storyboard,
      bible:storyboard.bible,outline:storyboard.outline,sceneList:storyboard.sceneList};
    process.chdir(root);
    await assert.rejects(generateVideo({approvedPlan}),/Temporary renderer failure/);
    const result = await generateVideo({approvedPlan});
    assert.equal(requests,1);
    assert.equal(renders,5);
    assert.equal(result.success,true);
    assert.equal(result.metadata.quality_review.status,'not_reviewed');
    assert.equal(result.metadata.quality_review.visual_review,null);
    assert.ok(!fs.existsSync(path.join(result.productionArtifacts,'visual-review')));
    assert.ok(!fs.existsSync(path.join(result.productionArtifacts,'review')));
  } finally {
    process.chdir(cwd);
    render.renderRemotion = originals.render;
    audio.alignAudio = originals.align;
    tts.generateTTSAudio = originals.tts;
    ChatGPTBrowser.prototype.open = open;
    ChatGPTBrowser.prototype.request = request;
    delete require.cache[require.resolve('./remotionGenerator.cjs')];
    fs.rmSync(root,{recursive:true,force:true});
  }
});
