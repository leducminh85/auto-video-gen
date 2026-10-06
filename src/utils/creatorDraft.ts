export interface CreatorDraft {
  voice: string;
  speed: number;
  text: string;
  title: string;
  subtitle: string;
  imageStylePrompt: string;
  audioMode?: 'tts' | 'import';
  importedAudio?: { file: string; duration: number; name: string } | null;
  audioBoundaries?: string;
}

const DRAFT_KEY = 'wevic.creator-draft.v1';

export function readCreatorDraft(fallback: CreatorDraft): CreatorDraft {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return fallback;
    return {
      audioMode: saved.audioMode === 'import' ? 'import' : 'tts',
      importedAudio: saved.importedAudio && /^import_[\w-]+\.wav$/.test(saved.importedAudio.file) && Number.isFinite(saved.importedAudio.duration) && saved.importedAudio.duration > 0 && typeof saved.importedAudio.name === 'string' ? saved.importedAudio : null,
      audioBoundaries: typeof saved.audioBoundaries === 'string' ? saved.audioBoundaries : '',
      voice: typeof saved.voice === 'string' && saved.voice ? saved.voice : fallback.voice,
      speed: typeof saved.speed === 'number' && saved.speed >= 0.5 && saved.speed <= 2 ? saved.speed : fallback.speed,
      text: typeof saved.text === 'string' ? saved.text : fallback.text,
      title: typeof saved.title === 'string' ? saved.title : fallback.title,
      imageStylePrompt: typeof saved.imageStylePrompt === 'string' ? saved.imageStylePrompt : fallback.imageStylePrompt,
      subtitle: typeof saved.subtitle === 'string' ? saved.subtitle : fallback.subtitle,
    };
  } catch {
    return fallback;
  }
}

export function saveCreatorDraft(draft: CreatorDraft): boolean {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}
