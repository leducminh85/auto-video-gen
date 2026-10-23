import { Composition, registerRoot } from 'remotion';
import { MainVideo } from './MainVideo';
import type { SceneData } from '../types/scenes';

const Root = () => <Composition<any, { scenes: SceneData[]; animatic?: boolean }> id="VectorStudio" component={MainVideo} width={1920} height={1080} fps={60} durationInFrames={60}
  defaultProps={{ scenes: [] as SceneData[] }} calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, props.scenes.reduce((total, scene) => total + scene.duration_in_frames, 0)) })} />;
registerRoot(Root);
