import { getTtsStatus } from "../api/tts";
import { BrowserVoiceProvider } from "./BrowserVoiceProvider";
import { ElevenLabsVoiceProvider } from "./ElevenLabsVoiceProvider";
import type { VoiceProvider } from "./types";

export async function resolveVoiceProvider(): Promise<VoiceProvider> {
  try {
    const status = await getTtsStatus();
    if (status.provider === "elevenlabs") {
      return new ElevenLabsVoiceProvider();
    }
  } catch {
    // Fall back to browser TTS when status cannot be loaded.
  }
  return new BrowserVoiceProvider();
}
