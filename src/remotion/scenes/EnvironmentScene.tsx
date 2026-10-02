import React from 'react';
import { SceneData } from '../../types/scenes';
import { colors } from '../utils/colors';
import { Slide } from '../motion/Slide';
import { BuildingFacade } from '../components/VisualObjects';
import { Person } from '../components/Person';

interface EnvironmentSceneProps {
  scene: SceneData;
}

export const EnvironmentScene: React.FC<EnvironmentSceneProps> = ({ scene }) => {
  const envName = (scene.environment || scene.subject || 'CỬA HÀNG').toUpperCase();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Banner */}
      <Slide startFrame={4} direction="down" distance={30} style={{ zIndex: 10, marginBottom: 40 }}>
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            padding: '12px 36px',
            borderRadius: 16,
            color: '#FFFFFF',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: colors.yellow, letterSpacing: 2, textTransform: 'uppercase' }}>
            {scene.title}
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, marginTop: 4, letterSpacing: -0.5 }}>
            {scene.main_text || envName}
          </div>
        </div>
      </Slide>

      {/* Main Environment Stage */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 60,
          width: '100%',
          maxWidth: 1200,
          position: 'relative',
          paddingBottom: 40,
        }}
      >
        {/* Person walking outside */}
        <Slide startFrame={10} direction="right" distance={50}>
          <Person pose="walking" size={300} shirtColor={colors.green} />
        </Slide>

        {/* Building Storefront */}
        <Slide startFrame={6} direction="up" distance={40}>
          <BuildingFacade
            width={480}
            height={320}
            label={envName.length > 16 ? envName.substring(0, 14) + '..' : envName}
            color="#FED7AA"
          />
        </Slide>
      </div>

      {/* Ground Sidewalk */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 50,
          background: '#CBD5E1',
          borderTop: `4px solid ${colors.border}`,
        }}
      />
    </div>
  );
};
