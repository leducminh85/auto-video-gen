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
}

export const SceneRenderer: React.FC<SceneRendererProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const totalDuration = scene.duration_in_frames;

  // Scene entrance & exit opacity
  const sceneOpacity = interpolate(
    frame,
    [0, 6, totalDuration - 6, totalDuration],
    [0.1, 1, 1, 0.1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Infer visual_type if missing
  const getResolvedVisualType = (): VisualType => {
    if (scene.visual_type) return scene.visual_type;

    // Check features from generator
    const fType = scene.features?.sceneType;
    if (fType) {
      if (['pie_chart', 'profit_glass_jump'].includes(fType)) return 'chart';
      if (['locked_door', 'beer_crate_price', 'beer_tap_hand', 'brewery_tank_machine'].includes(fType)) return 'object_metaphor';
      if (['crowd_wave'].includes(fType)) return 'numbers';
      if (['street_walk'].includes(fType)) return 'environment';
      if (['cooking', 'tech_code'].includes(fType)) return 'character';
    }

    const text = `${scene.title} ${scene.text}`.toLowerCase();
    if (/\d+%\s*|\d+\s*(?:triệu|tỷ|usd|đô|\$)/i.test(text)) return 'numbers';
    if (/so với|thay vì|lựa chọn|khác biệt|đổi lại|ngược lại/i.test(text)) return 'comparison';
    if (/bước|quy trình|chu kỳ|lộ trình|tiến trình/i.test(text)) return 'process';
    if (/mô hình|dòng tiền|sơ đồ|hệ thống|kết nối/i.test(text)) return 'diagram';
    if (/kết luận|tóm lại|chìa khóa|nguyên tắc|bài học/i.test(text)) return 'typography';
    if (/phòng gym|cửa hàng|văn phòng|trên phố|quán/i.test(text)) return 'environment';
    if (/thẻ|tiền|tài khoản|hợp đồng|máy móc/i.test(text)) return 'object_metaphor';

    return 'character';
  };

  const visualType = getResolvedVisualType();

  const renderComponentByVisualType = () => {
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
      case 'metaphor' as any:
        return <ObjectMetaphorScene scene={scene} />;
      case 'timeline':
      case 'process':
        return <ProcessScene scene={scene} />;
      default:
        return <CharacterScene scene={scene} />;
    }
  };

  const audioSrc = scene.audio_file
    ? scene.audio_file.startsWith('http') ||
      scene.audio_file.startsWith('data:') ||
      scene.audio_file.startsWith('blob:')
      ? scene.audio_file
      : scene.audio_file.startsWith('/')
      ? scene.audio_file
      : staticFile(`audio/${scene.audio_file}`)
    : null;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
        fontFamily: "'Be Vietnam Pro', system-ui, -apple-system, sans-serif",
        opacity: sceneOpacity,
      }}
    >
      {/* Dynamic Camera Animation */}
      <CameraContainer camera={scene.camera || 'static'} durationInFrames={totalDuration}>
        {renderComponentByVisualType()}
      </CameraContainer>

      {/* Top Header Badge Overlay */}
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
            {scene.title}
          </span>
        </div>

        {/* Visual Type Indicator */}
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

      {/* Synchronized Audio */}
      {audioSrc && <Audio src={audioSrc} volume={1} />}
    </div>
  );
};
