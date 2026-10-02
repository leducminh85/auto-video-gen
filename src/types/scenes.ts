export type VisualType =
  | 'character'
  | 'environment'
  | 'object'
  | 'diagram'
  | 'numbers'
  | 'comparison'
  | 'chart'
  | 'timeline'
  | 'process'
  | 'typography'
  | 'object_metaphor'
  | 'icon_grid'
  | 'before_after';

export type MotionPreset =
  | 'fade'
  | 'slide'
  | 'scale'
  | 'draw'
  | 'count'
  | 'stagger'
  | 'move'
  | 'disappear'
  | 'highlight'
  | 'connect'
  | 'punch';

export type CameraPreset = 'static' | 'slow_push' | 'slow_pan' | 'punch_in';
export type TransitionType = 'cut' | 'fade' | 'push';

export interface SceneTiming {
  enter?: number; // e.g. 0.15 (15%)
  main?: number; // e.g. 0.40 (40%)
  transform?: number; // e.g. 0.70 (70%)
  result?: number; // e.g. 0.90 (90%)
}

export interface ComicFeatures {
  sceneType?: string;
  comicTitle?: string;
  percentage?: string | null;
  metric?: string | null;
  fromGemini?: boolean;
}

export interface VisualBeat {
  id: string;
  sub_index: number;
  title: string;
  prompt: string;
  image_file: string;
  svg_data?: string;
  duration_in_seconds: number;
  duration_in_frames: number;
  start_frame_offset: number; // Relative to scene.start_frame
  caption?: string;
  features?: ComicFeatures;
  visual_type?: VisualType;
  main_text?: string;
  sub_text?: string;
  motion?: MotionPreset;
}

export interface SceneData {
  id: number;
  scene_id?: string;
  title: string;
  text: string;
  narration?: string;
  prompt: string;
  audio_file: string;
  image_file: string;
  beats?: VisualBeat[];
  duration_in_seconds: number;
  duration_in_frames: number;
  start_frame: number;

  // New Storyboard & Visual Fields
  visual_type?: VisualType;
  visual_description?: string;
  subject?: string;
  environment?: string;
  objects?: string[];
  composition?: string;
  action?: string;
  main_text?: string;
  sub_text?: string;
  motion?: MotionPreset;
  camera?: CameraPreset;
  transition?: TransitionType;
  metric?: string | null;
  percentage?: string | null;
  timing?: SceneTiming;
  features?: ComicFeatures;
}

export interface VideoMetadata {
  title: string;
  subtitle: string;
  fps: number;
  width: number;
  height: number;
  total_scenes: number;
  total_duration_in_frames: number;
  total_duration_in_seconds: string;
  created_at: string;
  voice?: string;
  speed?: number;
  max_image_duration_sec?: number;
}

export interface ProductionData {
  metadata: VideoMetadata;
  scenes: SceneData[];
}

export interface VoiceOption {
  id: string;
  name: string;
  region: 'Bắc' | 'Nam' | 'Trung' | 'AI Studio';
  gender: 'female' | 'male';
  tag: string;
  description: string;
}
