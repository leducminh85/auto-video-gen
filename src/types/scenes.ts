export interface VisualBeat {
  id: string;
  sub_index: number;
  title: string;
  prompt: string;
  image_file: string;
  svg_data?: string;
  duration_in_seconds: number; // Strictly <= 5.0s
  duration_in_frames: number; // Strictly <= 150 frames @ 30fps
  start_frame_offset: number; // Relative to scene.start_frame
  caption?: string;
}

export interface SceneData {
  id: number;
  title: string;
  text: string;
  prompt: string;
  audio_file: string;
  image_file: string;
  beats?: VisualBeat[]; // Visual beats where each image is <= 5.0 seconds
  duration_in_seconds: number;
  duration_in_frames: number;
  start_frame: number;
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

