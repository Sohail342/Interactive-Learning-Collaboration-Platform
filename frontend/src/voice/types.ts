export type VoiceOption = {
  id: string;
  name: string;
  locale?: string;
};

export type PlaybackState = "idle" | "playing" | "paused";

export type VoiceProviderId = "browser" | "elevenlabs";

export interface VoicePlayback {
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  getState(): PlaybackState;
  onStateChange(cb: (state: PlaybackState) => void): () => void;
}

export interface VoiceProvider {
  readonly id: VoiceProviderId;
  listVoices(): Promise<VoiceOption[]>;
  createPlayback(text: string, voiceId: string): Promise<VoicePlayback>;
}
