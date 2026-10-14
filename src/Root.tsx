import {AbsoluteFill, Audio, Composition, Series, staticFile} from 'remotion';
import {Scene1_Desk} from './scenes/Scene1_Desk';
import {Scene2_ChipMacro} from './scenes/Scene2_ChipMacro';
import {Scene3_Elevator} from './scenes/Scene3_Elevator';
import {Scene4_Parking} from './scenes/Scene4_Parking';
import {Scene5_Title} from './scenes/Scene5_Title';
import {Scene6_IQScale} from './scenes/Scene6_IQScale';
import {Scene7_KitchenDialogue} from './scenes/Scene7_KitchenDialogue';

export const TIMELINE = [
  {name: '01 · The impossible battery', duration: 270, component: Scene1_Desk},
  {name: '02 · Precision engineering', duration: 180, component: Scene2_ChipMacro},
  {name: '03 · No signal. No problem.', duration: 120, component: Scene3_Elevator},
  {name: '04 · Three floors underground', duration: 300, component: Scene4_Parking},
  {name: '05 · What if?', duration: 270, component: Scene5_Title},
  {name: '06 · 100 → 140 → 160 → 500', duration: 840, component: Scene6_IQScale},
  {name: '07 · The kitchen conversation', duration: 420, component: Scene7_KitchenDialogue},
] as const;

export const IQ500 = () => <AbsoluteFill><Audio src={staticFile('audio/voiceover-40s.m4a')} trimAfter={2400}/><Series>{TIMELINE.map(({name, duration, component: Scene}) =>
  <Series.Sequence key={name} name={name} durationInFrames={duration}><Scene /></Series.Sequence>,
)}</Series><svg viewBox="0 0 1920 1080" style={{position:'absolute',width:'100%',height:'100%',pointerEvents:'none'}}><path d="M0 0H1920V56H0ZM0 1024H1920V1080H0Z" fill="#000"/></svg></AbsoluteFill>;

export const RemotionRoot = () => <Composition id="IQ500" component={IQ500}
  durationInFrames={2400} fps={60} width={1920} height={1080} />;
