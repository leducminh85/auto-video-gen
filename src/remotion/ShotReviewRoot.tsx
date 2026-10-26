import {Composition, registerRoot, useCurrentFrame} from 'remotion';
import {VectorShot} from './stickman/VectorShot';
import type {RemotionShot} from '../types/remotion';
const blank:RemotionShot={version:1,styleId:'STICKMAN_500IQ_V1',direction:'Review',background:'#ffffff',layers:[]};
const Shot=({shot,duration}:{shot:RemotionShot;duration:number})=><VectorShot shot={shot} frame={useCurrentFrame()} duration={duration}/>;
registerRoot(()=><Composition id="ShotReview" component={Shot} width={1920} height={1080} fps={60} durationInFrames={60} defaultProps={{shot:blank,duration:60}} calculateMetadata={({props})=>({durationInFrames:props.duration})}/>);
