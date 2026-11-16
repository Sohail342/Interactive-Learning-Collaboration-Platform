export type MediaPreferences = {
  audio: boolean;
  video: boolean;
};

const DEFAULT_PREFS: MediaPreferences = {
  audio: true,
  video: true,
};

function storageKey(meetingId: string): string {
  return `lp_meeting_media_${meetingId}`;
}

export function loadMediaPreferences(meetingId: string): MediaPreferences {
  try {
    const raw = sessionStorage.getItem(storageKey(meetingId));
    if (!raw) {
      return { ...DEFAULT_PREFS };
    }
    const parsed = JSON.parse(raw) as Partial<MediaPreferences>;
    return {
      audio: typeof parsed.audio === "boolean" ? parsed.audio : DEFAULT_PREFS.audio,
      video: typeof parsed.video === "boolean" ? parsed.video : DEFAULT_PREFS.video,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveMediaPreferences(
  meetingId: string,
  prefs: MediaPreferences,
): void {
  sessionStorage.setItem(storageKey(meetingId), JSON.stringify(prefs));
}

export function clearMediaPreferences(meetingId: string): void {
  sessionStorage.removeItem(storageKey(meetingId));
}
