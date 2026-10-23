import React from 'react';
import { Sequence } from 'remotion';
import { SceneData } from '../types/scenes';
import { SceneRenderer } from './SceneRenderer';

interface MainVideoProps {
  scenes: SceneData[];
  isDebug?: boolean;
  animatic?: boolean;
}

export const MainVideo: React.FC<MainVideoProps> = ({ scenes, isDebug = false, animatic = false }) => {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#000000',
        width: 1920,
        height: 1080,
        position: 'relative',
      }}
    >
      {scenes.map((scene) => {
        return (
          <Sequence
            key={scene.id}
            from={scene.start_frame}
            durationInFrames={scene.duration_in_frames}
            name={`Scene ${scene.id} - ${scene.title}`}
          >
            <SceneRenderer scene={scene} isDebug={isDebug} animatic={animatic} />
          </Sequence>
        );
      })}
    </div>
  );
};
