const test = require('node:test');
const assert = require('node:assert/strict');
const { prepareShot } = require('./remotionNormalize.cjs');
const { validateShot } = require('./remotionSchema.cjs');
const { planShot } = require('./remotionPlanner.cjs');
const base = {version:1,styleId:'STICKMAN_500IQ_V1',background:'#ffffff'};
test('supports SVG caps/joins/rules/baselines and normalizes common AI output without a retry', async () => {
  let calls = 0;
  const result = await planShot({text:'test',seconds:2}, async () => {
    calls++;
    return {...base,background:'white',layers:[{id:'Đường 1',type:'line',attrs:{'stroke-linecap':'round',strokeLinejoin:'bevel',stroke:'black',strokeWidth:'4px',x1:'0',y1:'2',x2:'100',y2:'200',fillRule:'evenodd',unnecessaryHint:'ignore'}}]};
  });
  assert.equal(calls,1);
  assert.equal(result.layers[0].attrs.strokeLinecap,'round');
  assert.equal(result.layers[0].attrs.strokeWidth,4);
  assert.equal(result.layers[0].attrs.stroke,'#000000');
  assert.equal(result.layers[0].attrs.unnecessaryHint,undefined);
  assert.deepEqual(validateShot(result),result);
});
test('nested layers, missing/duplicate ids, boolean strings, and ordered keys normalize idempotently', () => {
  const result = prepareShot({...base,layers:[{type:'g',children:[{id:'a',type:'character',hero:'true',x:{keys:[{at:'1',value:'200'},{at:'0',value:'0'},{at:'1',value:'250',ease:'easeInOut'}]}},{id:'a',type:'text',attrs:{text:'Hello',dominantBaseline:'middle'},fontSize:'30'}]}]});
  const children=result.layers[0].children;
  assert.equal(children[0].hero,true);
  assert.equal(children[0].x.keys[1].value,250);
  assert.equal(children[1].text,'Hello');
  assert.equal(children[1].attrs.fontSize,30);
  assert.notEqual(children[0].id,children[1].id);
  assert.deepEqual(prepareShot(result),result);
});
test('normalization preserves security and structural validation', () => {
  for (const attrs of [{onLoad:'alert(1)'},{href:'https://example.com'},{style:{color:'red'}},{fill:'url(https://example.com)'},{fill:'#12345'}]) assert.throws(()=>prepareShot({...base,layers:[{type:'rect',attrs}]}));
  assert.throws(()=>prepareShot({...base,layers:[{type:'script',attrs:{}}]}));
  assert.throws(()=>prepareShot({...base,layers:[{type:'character',x:{keys:[{at:0,value:0},{at:2,value:100}]}}]}));
  assert.throws(()=>validateShot({...base,layers:[{id:'x',type:'path',attrs:{strokeLinecap:'invalid'}}]}));
});
test('unsupported safe attrs are diagnosed while valid geometry is preserved', () => {
  const warnings=[];
  const result=prepareShot({...base,layers:[{id:'shape',type:'rect',attrs:{width:'200',height:100,strokeLinecap:'invalid',vectorEffect:'non-scaling-stroke'}}]}, warning=>warnings.push(warning));
  assert.equal(result.layers[0].attrs.width,200);
  assert.equal(result.layers[0].attrs.height,100);
  assert.equal(warnings.length,2);
});
test('optional empty motion uses defaults and simple motion wrappers are accepted', () => {
  const result=prepareShot({...base,camera:{scale:null},layers:[{id:'actor',type:'character',x:['20','80'],y:{value:'300'},speech:true,headTilt:null,look:''}]});
  assert.deepEqual(result.layers[0].x,{from:20,to:80,start:0,end:1});
  assert.equal(result.layers[0].y,300);
  assert.equal(result.layers[0].speech,1);
  assert.equal(result.layers[0].headTilt,undefined);
  assert.equal(result.layers[0].look,undefined);
});
