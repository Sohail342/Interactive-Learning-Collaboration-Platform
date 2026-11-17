import { listTtsVoices, synthesizeTtsSpeech } from "../api/tts";
import type {
  PlaybackState,
  VoiceOption,
  VoicePlayback,
  VoiceProvider,
} from "./types";

class ElevenLabsVoicePlayback implements VoicePlayback {
  private state: PlaybackState = "idle";
  private listeners = new Set<(state: PlaybackState) => void>();
  private audio: HTMLAudioElement;
  private objectUrl: string;

  constructor(blob: Blob) {
    this.objectUrl = URL.createObjectURL(blob);
    this.audio = new Audio(this.objectUrl);
    this.audio.addEventListener("play", () => this.setState("playing"));
    this.audio.addEventListener("pause", () => {
      if (this.audio.ended || this.audio.currentTime === 0) {
        this.setState("idle");
        return;
      }
      this.setState("paused");
    });
    this.audio.addEventListener("ended", () => {
      this.audio.currentTime = 0;
      this.setState("idle");
    });
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
    await this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.setState("idle");
  }

  dispose(): void {
    this.stop();
    URL.revokeObjectURL(this.objectUrl);
  }
}

export class ElevenLabsVoiceProvider implements VoiceProvider {
  readonly id = "elevenlabs" as const;

  async listVoices(): Promise<VoiceOption[]> {
    const voices = await listTtsVoices();
    return voices.map((voice) => ({
      id: voice.id,
      name: voice.name,
    }));
  }

  async createPlayback(text: string, voiceId: string): Promise<VoicePlayback> {
    const blob = await synthesizeTtsSpeech(text.trim(), voiceId);
    return new ElevenLabsVoicePlayback(blob);
  }
}
