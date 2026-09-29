import React from 'react';
import { Composition } from 'remotion';
import { MainVideo } from './MainVideo';
import scenesJson from '../data/scenes.json';
import { buildMultiBeatScenes } from '../utils/stickmanArtGenerator';

export const RemotionRoot: React.FC = () => {
  const metadata = scenesJson.metadata;
  const scenes = buildMultiBeatScenes(scenesJson.scenes as any);

  return (
    <>
      <Composition
        id="StickmanExplainerVideo"
        component={MainVideo as React.ComponentType<any>}
        durationInFrames={metadata.total_duration_in_frames}
        fps={metadata.fps}
        width={metadata.width}
        height={metadata.height}
        defaultProps={{
          scenes,
        }}
      />
    </>
  );
};

