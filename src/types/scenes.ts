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

export type ShotType =
  | 'wide'
  | 'medium'
  | 'close-up'
  | 'infographic'
  | 'diagram'
  | 'wide_angle'
  | 'medium_shot'
  | 'close_up'
  | 'isometric_view';

export type VisualMethod =
  // New: Hand-drawn Detailed Explainer methods (DALL-E 3 / Midjourney)
  | 'scenic_environment'       // Wide detailed shot of a location (street, cafe interior, factory)
  | 'character_interaction'    // Stickman interacting with realistic objects (espresso machine, clipboard)
  | 'diegetic_infographic'     // Charts/numbers integrated into the physical environment (chalkboard, wall)
  | 'object_close_up'          // Close-up on highly detailed realistic props (money, portafilter)
  | 'split_screen_comparison'  // Physical spaces side-by-side (busy cafe vs bankrupt cafe)
  // Legacy: Minimalist SVG methods (fallback)
  | 'character_action'
  | 'object_metaphor'
  | 'infographic'
  | 'comparison'
  | 'process'
  | 'numbers'
  | 'diagram'
  | 'typography'
  | 'environment';

export interface VisualBeatPlan {
  meaning: string;
  visualMethod: VisualMethod;
  shotType: ShotType;
  intent?: string;
  planningSource?: 'ai' | 'local';
  what_to_show?: string;
  how_to_show?: string;

  // New: Hand-drawn Detailed Explainer fields (for DALL-E 3 / Midjourney)
  environmentDetails?: string;   // Highly detailed description of background and setting
  stickmanAction?: string;       // What the stickman is doing/wearing (e.g., 'barista in brown apron')
  heroObjects?: string | string[]; // Detailed realistic objects in the scene
  diegeticText?: string;         // Short text appearing IN the world (on a sign, chalkboard). Max 3 words.
  imageGenerationPrompt?: string;// Full English prompt for DALL-E 3 / Midjourney image generation

  // Legacy: Minimalist SVG fields (backward compat & SVG fallback)
  subject?: string;
  action?: string;
  objects?: string[];
  environment?: string;
  composition?: string;
  keyText?: string;
  mustNotInclude?: string[];
  transitionIntent?: string;
}

export interface VideoStyleGuide {
  characterStyle: string;
  strokeWidth: number;
  palette: {
    background: string;
    card: string;
    outline: string;
    primary: string;
    secondary: string;
    accent: string;
    danger: string;
    muted: string;
  };
  typography: string;
  levelOfDetail: 'minimalist' | 'focused';
}

export interface ValidationResult {
  score: number; // 0 - 100
  issues: string[];
  regenerate: boolean;
}

export interface VisualBeat {
  id: string;
  sub_index: number;
  title: string;
  prompt: string;
  image_file: string;
  image_version?: number;
  svg_data?: string | null;
  duration_in_seconds: number;
  duration_in_frames: number;
  start_frame_offset: number; // Relative to scene.start_frame
  caption?: string;
  features?: ComicFeatures;
  visual_type?: VisualType;
  main_text?: string;
  sub_text?: string;
  motion?: MotionPreset;
  plan?: VisualBeatPlan;
  validation?: ValidationResult;
}

export interface SceneData {
  id: number;
  scene_id?: string;
  title: string;
  text: string;
  narration?: string;
  prompt: string;
  audio_file: string;
  audio_version?: number;
  image_file: string;
  image_version?: number;
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
  image_style_prompt?: string;
  audio_source?: 'tts' | 'import';
  imported_audio?: string;
  render_dirty?: boolean;
  style_guide?: VideoStyleGuide;
  quality_report?: {
    total_beats: number;
    avg_beat_duration_sec: number;
    validation_passed: boolean;
    issues: string[];
  };
}

export interface ProductionData {
  metadata: VideoMetadata;
  scenes: SceneData[];
}

export interface VoiceOption {
  id: string;
  name: string;
  region: 'Bắc' | 'Nam' | 'Trung' | 'AI Studio' | 'Toàn quốc' | 'US' | 'UK';
  gender: 'female' | 'male';
  tag: string;
  description: string;
}
