/**
 * Audio preview utility for Voice options at the selected playback speed.
 * Uses genuine pre-rendered Vietnamese TTS voices with pitch-preserved HTML5 playbackRate,
 * with online Google TTS audio fallback.
 */

import { VoiceOption } from '../types/scenes';

export const SAMPLE_PHRASES: Record<string, string> = {
  'vi-VN-Standard-A':
    'Chào mừng bạn đến với Stickman Video Studio. Đây là giọng đọc Nữ Miền Bắc truyền cảm và rõ ràng.',
  'vi-VN-Standard-B':
    'Xin kính chào quý vị, đây là giọng đọc Nam Miền Bắc trầm ấm, phong thái chuyên nghiệp.',
  'vi-VN-Standard-C':
    'Dạ xin chào mọi người, đây là giọng Nữ Miền Nam tươi trẻ, tự nhiên và năng động.',
  'vi-VN-Standard-D':
    'Kính chào quý khán giả, đây là giọng Nam Miền Nam chững chạc, uy tín cho video giải thích.',
  'vi-VN-Studio-AI':
    'Hệ thống tổng hợp giọng đọc AI thông minh, tự động đồng bộ nhịp độ và tối ưu chuyển cảnh.',
};

class AudioPreviewManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentVoiceId: string | null = null;

  public playVoicePreview(
    voice: VoiceOption,
    speed: number,
    onEnded?: () => void,
    onError?: () => void
  ): { stop: () => void } {
    this.stop();

    // Map each voice to its authentic high-fidelity Vietnamese preview file
    const audioUrl = `/audio/preview_voice_${voice.id}.mp3`;
    const audio = new Audio(audioUrl);
    this.currentAudio = audio;
    this.currentVoiceId = voice.id;

    // Apply speed without pitch distortion (standard in modern HTML5 Audio)
    audio.playbackRate = Math.max(0.5, Math.min(2.0, speed));

    audio.onended = () => {
      this.currentAudio = null;
      this.currentVoiceId = null;
      if (onEnded) onEnded();
    };

    audio.onerror = () => {
      // Fallback: try online Google TTS stream
      console.warn(`Local preview failed for ${voice.id}, attempting fallback stream...`);
      const sampleText = SAMPLE_PHRASES[voice.id] || 'Xin chào, đây là giọng đọc tiếng Việt.';
      const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        sampleText
      )}&tl=vi&client=tw-ob`;
      
      const fallbackAudio = new Audio(fallbackUrl);
      this.currentAudio = fallbackAudio;
      fallbackAudio.playbackRate = Math.max(0.5, Math.min(2.0, speed));
      fallbackAudio.onended = () => {
        this.currentAudio = null;
        this.currentVoiceId = null;
        if (onEnded) onEnded();
      };
      fallbackAudio.onerror = () => {
        this.currentAudio = null;
        this.currentVoiceId = null;
        if (onError) onError();
        if (onEnded) onEnded();
      };
      fallbackAudio.play().catch(() => {
        this.currentAudio = null;
        this.currentVoiceId = null;
        if (onEnded) onEnded();
      });
    };

    audio.play().catch((err) => {
      console.warn('Audio play prevented or error:', err);
      this.currentAudio = null;
      this.currentVoiceId = null;
      if (onEnded) onEnded();
    });

    return {
      stop: () => {
        this.stop();
        if (onEnded) onEnded();
      },
    };
  }

  public stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {
        // ignore
      }
      this.currentAudio = null;
      this.currentVoiceId = null;
    }
  }

  public isPlaying(voiceId?: string): boolean {
    if (!this.currentAudio || this.currentAudio.paused) return false;
    if (voiceId) return this.currentVoiceId === voiceId;
    return true;
  }
}

export const audioPreviewManager = new AudioPreviewManager();
