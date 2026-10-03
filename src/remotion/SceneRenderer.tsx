import React from 'react';
import { Audio, staticFile, useCurrentFrame, interpolate } from 'remotion';
import { SceneData, VisualType } from '../types/scenes';
import { CameraContainer } from './components/CameraContainer';
import { CharacterScene } from './scenes/CharacterScene';
import { NumberScene } from './scenes/NumberScene';
import { DiagramScene } from './scenes/DiagramScene';
import { ChartScene } from './scenes/ChartScene';
import { ComparisonScene } from './scenes/ComparisonScene';
import { EnvironmentScene } from './scenes/EnvironmentScene';
import { ObjectMetaphorScene } from './scenes/ObjectMetaphorScene';
import { TypographyScene } from './scenes/TypographyScene';
import { ProcessScene } from './scenes/ProcessScene';

interface SceneRendererProps {
  scene: SceneData;
  isDebug?: boolean;
}

export const SceneRenderer: React.FC<SceneRendererProps> = ({ scene, isDebug = false }) => {
  const frame = useCurrentFrame();
  const totalDuration = scene.duration_in_frames;

  // Scene entrance & exit opacity
  const sceneOpacity = interpolate(
    frame,
    [0, 6, totalDuration - 6, totalDuration],
    [0.1, 1, 1, 0.1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Multi-Beat Tracking (Synchronized with speech beats)
  const beats = (scene.beats && scene.beats.length > 0)
    ? scene.beats
    : [
        {
          id: `scene_${scene.id}_beat_1`,
          sub_index: 1,
          title: scene.title,
          prompt: scene.prompt,
          image_file: scene.image_file,
          duration_in_seconds: scene.duration_in_seconds,
          duration_in_frames: scene.duration_in_frames,
          start_frame_offset: 0,
          caption: scene.text,
          visual_type: scene.visual_type,
        },
      ];

  let activeBeatIndex = 0;
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const beatEnd = b.start_frame_offset + b.duration_in_frames;
    if (frame >= b.start_frame_offset && (frame < beatEnd || i === beats.length - 1)) {
      activeBeatIndex = i;
      break;
    }
  }

  const activeBeat = beats[activeBeatIndex] || beats[0];
  const beatLocalFrame = Math.max(0, frame - activeBeat.start_frame_offset);
  const beatDuration = Math.max(1, activeBeat.duration_in_frames);

  // Micro-motion Ken-Burns zoom on active beat
  const beatScale = interpolate(
    beatLocalFrame,
    [0, beatDuration],
    [1.0, 1.03],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const beatOpacity = interpolate(
    beatLocalFrame,
    [0, 5],
    [0.3, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Resolve visual type from active beat or scene
  const getResolvedVisualType = (): VisualType => {
    if (activeBeat.visual_type) return activeBeat.visual_type;
    if (activeBeat.plan?.visualMethod) {
      const vm = activeBeat.plan.visualMethod;
      if (vm === 'character_action') return 'character';
      if (vm === 'object_metaphor') return 'object_metaphor';
      if (vm === 'numbers') return 'numbers';
      if (vm === 'comparison') return 'comparison';
      if (vm === 'process') return 'process';
      if (vm === 'diagram') return 'diagram';
      if (vm === 'infographic') return 'chart';
      if (vm === 'typography') return 'typography';
      if (vm === 'environment') return 'environment';
    }
    if (scene.visual_type) return scene.visual_type;
    return 'character';
  };

  const visualType = getResolvedVisualType();

  // Prioritize AI Generated image (FLUX.1 / DALL-E) over SVG fallback
  const renderBeatVisual = () => {
    if (activeBeat.image_file) {
      const baseImg = activeBeat.image_file.startsWith('http') || activeBeat.image_file.startsWith('/')
        ? activeBeat.image_file
        : staticFile(`images/${activeBeat.image_file}`);
      const cacheBust = activeBeat.image_version || scene.audio_version || `${scene.id}_${activeBeat.sub_index}`;
      const imgSrc = `${baseImg}?v=${cacheBust}`;

      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${beatScale})`,
            transformOrigin: 'center center',
            opacity: beatOpacity,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={imgSrc}
            alt={activeBeat.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      );
    }

    if (activeBeat.svg_data) {
      const svgSrc = activeBeat.svg_data.startsWith('data:')
        ? activeBeat.svg_data
        : `data:image/svg+xml;utf8,${encodeURIComponent(activeBeat.svg_data)}`;

      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${beatScale})`,
            transformOrigin: 'center center',
            opacity: beatOpacity,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={svgSrc}
            alt={activeBeat.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      );
    }

    // Programmatic Scene Component Fallback
    switch (visualType) {
      case 'character':
        return <CharacterScene scene={scene} />;
      case 'numbers':
      case 'icon_grid':
        return <NumberScene scene={scene} />;
      case 'diagram':
        return <DiagramScene scene={scene} />;
      case 'chart':
        return <ChartScene scene={scene} />;
      case 'comparison':
      case 'before_after':
        return <ComparisonScene scene={scene} />;
      case 'environment':
        return <EnvironmentScene scene={scene} />;
      case 'typography':
        return <TypographyScene scene={scene} />;
      case 'object':
      case 'object_metaphor':
        return <ObjectMetaphorScene scene={scene} />;
      case 'timeline':
      case 'process':
        return <ProcessScene scene={scene} />;
      default:
        return <CharacterScene scene={scene} />;
    }
  };

  const baseAudio = scene.audio_file
    ? scene.audio_file.startsWith('http') ||
      scene.audio_file.startsWith('data:') ||
      scene.audio_file.startsWith('blob:')
      ? scene.audio_file
      : scene.audio_file.startsWith('/')
      ? scene.audio_file
      : staticFile(`audio/${scene.audio_file}`)
    : null;
  const audioCacheBust = scene.audio_version || scene.start_frame || '';
  const audioSrc = baseAudio && audioCacheBust ? `${baseAudio}?v=${audioCacheBust}` : baseAudio;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#FDFBF7',
        overflow: 'hidden',
        fontFamily: "'Be Vietnam Pro', system-ui, -apple-system, sans-serif",
        opacity: sceneOpacity,
      }}
    >
      {/* Dynamic Camera Animation & Beat Content */}
      <CameraContainer camera={scene.camera || 'static'} durationInFrames={totalDuration}>
        {renderBeatVisual()}
      </CameraContainer>

      {/* Top Header Badge Overlay - ONLY SHOWN IN DEBUG MODE */}
      {isDebug && (
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 36,
            right: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '8px 18px',
              borderRadius: 14,
              border: '1.5px solid rgba(245, 158, 11, 0.4)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}
          >
            <span
              style={{
                backgroundColor: '#F59E0B',
                color: '#0F172A',
                fontWeight: 900,
                fontSize: 14,
                padding: '2px 8px',
                borderRadius: 6,
                letterSpacing: 0.5,
              }}
            >
              CẢNH {scene.id}
            </span>
            <span
              style={{
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: -0.2,
              }}
            >
              {scene.title} - Beat {activeBeatIndex + 1}/{beats.length}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '8px 16px',
              borderRadius: 14,
              border: '1.5px solid rgba(59, 130, 246, 0.4)',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#3B82F6',
              }}
            />
            <span
              style={{
                color: '#E2E8F0',
                fontSize: 13,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {visualType}
            </span>
          </div>
        </div>
      )}

      {/* Synchronized Audio */}
      {audioSrc && <Audio src={audioSrc} volume={1} />}
    </div>
  );
};
