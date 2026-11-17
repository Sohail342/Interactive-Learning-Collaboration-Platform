import type {
  PlaybackState,
  VoiceOption,
  VoicePlayback,
  VoiceProvider,
} from "./types";

function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  const existing = window.speechSynthesis.getVoices();
  if (existing.length > 0) {
    return Promise.resolve(existing);
  }
  return new Promise((resolve) => {
    const handle = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handle);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", handle);
    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", handle);
      resolve(window.speechSynthesis.getVoices());
    }, 750);
  });
}

class BrowserVoicePlayback implements VoicePlayback {
  private state: PlaybackState = "idle";
  private listeners = new Set<(state: PlaybackState) => void>();
  private utterance: SpeechSynthesisUtterance | null = null;
  private readonly text: string;
  private readonly voiceId: string;

  constructor(text: string, voiceId: string) {
    this.text = text;
    this.voiceId = voiceId;
  }

  private setState(next: PlaybackState) {
    this.state = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }

  getState(): PlaybackState {
    return this.state;
  }

  onStateChange(cb: (state: PlaybackState) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  async play(): Promise<void> {
    if (this.state === "paused" && this.utterance) {
      window.speechSynthesis.resume();
      this.setState("playing");
      return;
    }

    window.speechSynthesis.cancel();
    const voices = await waitForVoices();
    const utterance = new SpeechSynthesisUtterance(this.text);
    const match = voices.find((voice) => voice.voiceURI === this.voiceId);
    if (match) {
      utterance.voice = match;
    }
    utterance.onstart = () => this.setState("playing");
    utterance.onend = () => {
      this.utterance = null;
      this.setState("idle");
    };
    utterance.onerror = () => {
      this.utterance = null;
      this.setState("idle");
    };
    this.utterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  pause(): void {
    if (this.state !== "playing") {
      return;
    }
    window.speechSynthesis.pause();
    this.setState("paused");
  }

  stop(): void {
    window.speechSynthesis.cancel();
    this.utterance = null;
    this.setState("idle");
  }
}

export class BrowserVoiceProvider implements VoiceProvider {
  readonly id = "browser" as const;

  async listVoices(): Promise<VoiceOption[]> {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return [];
    }
    const voices = await waitForVoices();
    return voices.map((voice) => ({
      id: voice.voiceURI,
      name: `${voice.name}${voice.lang ? ` (${voice.lang})` : ""}`,
      locale: voice.lang || undefined,
    }));
  }

  async createPlayback(text: string, voiceId: string): Promise<VoicePlayback> {
    return new BrowserVoicePlayback(text.trim(), voiceId);
  }
}
