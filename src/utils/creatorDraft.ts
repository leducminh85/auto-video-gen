export interface CreatorDraft {
  voice: string;
  speed: number;
  text: string;
  title: string;
  subtitle: string;
}

const DRAFT_KEY = 'wevic.creator-draft.v1';

export function readCreatorDraft(fallback: CreatorDraft): CreatorDraft {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return fallback;
    return {
      voice: typeof saved.voice === 'string' && saved.voice ? saved.voice : fallback.voice,
      speed: typeof saved.speed === 'number' && saved.speed >= 0.5 && saved.speed <= 2 ? saved.speed : fallback.speed,
      text: typeof saved.text === 'string' ? saved.text : fallback.text,
      title: typeof saved.title === 'string' ? saved.title : fallback.title,
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
