import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import sharp from 'sharp';
import type {RemotionShot} from '../src/types/remotion';
import {VectorShot} from '../src/remotion/stickman/VectorShot';
import {buildShots} from './rebuild-iq-story.cjs';
async function main(){
 const shots=buildShots().flat(); const tiles=[];
 for(let i=0;i<shots.length;i++){
  const svg=renderToStaticMarkup(<VectorShot shot={shots[i] as RemotionShot} frame={60} duration={121}/>).replace('<svg ','<svg width="1920" height="1080" ');
  const input=await sharp(Buffer.from(svg)).resize(480,270).png().toBuffer();tiles.push({input,left:(i%4)*480,top:Math.floor(i/4)*270});
 }
 await sharp({create:{width:1920,height:Math.ceil(shots.length/4)*270,channels:3,background:'#101010'}}).composite(tiles).jpeg().toFile('data/reference-study/iq-storyboard.jpg');
}
main().catch(e=>{console.error(e);process.exitCode=1});
