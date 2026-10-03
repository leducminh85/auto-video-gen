import React from 'react';
import { Img, Audio, staticFile, interpolate, useCurrentFrame } from 'remotion';
import { SceneData, VisualBeat } from '../types/scenes';

interface StickmanSceneProps {
  scene: SceneData;
  isDebug?: boolean;
}

export const StickmanScene: React.FC<StickmanSceneProps> = ({ scene, isDebug = false }) => {
  const frame = useCurrentFrame();
  const totalDuration = scene.duration_in_frames;

  // Global scene fade in/out
  const globalOpacity = interpolate(
    frame,
    [0, 8, totalDuration - 8, totalDuration],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Visual beats management (strictly <= 5.0 seconds = 150 frames per image)
  const beats: VisualBeat[] = (scene.beats && scene.beats.length > 0)
    ? scene.beats
    : [
        {
          id: `${scene.id}_default`,
          sub_index: 1,
          title: scene.title,
          prompt: scene.prompt,
          image_file: scene.image_file,
          duration_in_seconds: scene.duration_in_seconds,
          duration_in_frames: scene.duration_in_frames,
          start_frame_offset: 0,
          caption: scene.text,
        },
      ];

  // Find currently active visual beat based on current frame
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
  const beatDuration = activeBeat.duration_in_frames;

  // Beat transition animation: quick smooth fade & micro zoom (Ken Burns)
  const beatOpacity = interpolate(
    beatLocalFrame,
    [0, 6],
    [0.2, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const beatScale = interpolate(
    beatLocalFrame,
    [0, beatDuration],
    [1.0, 1.03],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Determine image source (svg_data data URL or staticFile)
  const getImageSource = (beat: VisualBeat) => {
    if (beat.svg_data) {
      if (beat.svg_data.startsWith('data:') || beat.svg_data.startsWith('http')) {
        return beat.svg_data;
      }
      return `data:image/svg+xml;utf8,${encodeURIComponent(beat.svg_data)}`;
    }
    const file = beat.image_file || scene.image_file;
    if (file.startsWith('data:') || file.startsWith('http') || file.startsWith('/')) {
      return file;
    }
    return staticFile(`images/${file}`);
  };

  const imageSrc = getImageSource(activeBeat);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#F9F6ED',
        overflow: 'hidden',
        fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
        opacity: globalOpacity,
      }}
    >
      {/* Background Stickman Visual Image with Zoom */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${beatScale})`,
          transformOrigin: 'center center',
          opacity: beatOpacity,
          transition: 'opacity 0.2s ease-out',
        }}
      >
        <Img
          src={imageSrc}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>

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
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
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
              {scene.title}
            </span>
          </div>

          {/* Visual Beat Indicator (Shows multiple images per scene) */}
          {beats.length > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                padding: '8px 14px',
                borderRadius: 14,
                border: '1.5px solid rgba(16, 185, 129, 0.4)',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                }}
              />
              <span
                style={{
                  color: '#E2E8F0',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Hình {activeBeatIndex + 1}/{beats.length}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Audio Playback synchronized */}

      {/* Audio Playback synchronized */}
      {scene.audio_file && (
        <Audio
          src={
            scene.audio_file.startsWith('http') ||
            scene.audio_file.startsWith('data:') ||
            scene.audio_file.startsWith('blob:')
              ? scene.audio_file
              : scene.audio_file.startsWith('/')
              ? scene.audio_file
              : staticFile(`audio/${scene.audio_file}`)
          }
          volume={1}
        />
      )}
    </div>
  );
};

