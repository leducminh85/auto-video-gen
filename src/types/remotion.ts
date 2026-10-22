export type MotionValue = number | { keys: { at: number; value: number; ease?: 'linear' | 'smooth' | 'hold' }[] } | { from: number; to: number; start?: number; end?: number };
export interface VectorLayer {
  id: string;
  type: 'g' | 'rect' | 'circle' | 'ellipse' | 'path' | 'line' | 'text' | 'character' | 'steam' | 'signal' | 'phone' | 'kitchen' | 'mug';
  label?: string;
  text?: string;
  attrs?: Record<string, string | number>;
  x?: MotionValue;
  y?: MotionValue;
  scale?: MotionValue;
  rotation?: MotionValue;
  opacity?: MotionValue;
  enter?: number;
  exit?: number;
  hero?: boolean;
  scarf?: boolean;
  phone?: boolean;
  talking?: boolean;
  walking?: boolean;
  leak?: boolean;
  emotion?: 'calm' | 'confident' | 'pleased' | 'annoyed' | 'surprised' | 'talking';
  raised?: MotionValue;
  look?: MotionValue;
  leftHandX?: MotionValue;
  leftHandY?: MotionValue;
  rightHandX?: MotionValue;
  rightHandY?: MotionValue;
  headTilt?: MotionValue;
  seated?: MotionValue;
  stride?: MotionValue;
  speech?: MotionValue;
  blur?: MotionValue;
  flow?: MotionValue;
  animate?: Record<string, MotionValue>;
  attachment?: 'leftHand' | 'rightHand';
  children?: VectorLayer[];
}
export interface RemotionShot {
  version: 1;
  styleId: 'STICKMAN_500IQ_V1';
  direction: string;
  background: string;
  camera?: { x?: MotionValue; y?: MotionValue; scale?: MotionValue; focusX?: MotionValue; focusY?: MotionValue };
  layers: VectorLayer[];
}
