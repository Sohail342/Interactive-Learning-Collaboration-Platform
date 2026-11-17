import { ApiError, apiRequest } from "./client";

const apiUrl = import.meta.env.VITE_API_URL ?? "";

export type TtsStatus = {
  provider: "browser" | "elevenlabs";
};

export type TtsVoice = {
  id: string;
  name: string;
};

export async function getTtsStatus(): Promise<TtsStatus> {
  return apiRequest<TtsStatus>("/tts/status");
}

export async function listTtsVoices(): Promise<TtsVoice[]> {
  return apiRequest<TtsVoice[]>("/tts/voices");
}

export async function synthesizeTtsSpeech(
  text: string,
  voiceId: string,
): Promise<Blob> {
  if (!apiUrl) {
    throw new ApiError(0, "VITE_API_URL is not set");
  }
  const token = localStorage.getItem("lp_access_token");
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(`${apiUrl}/tts/speak`, {
    method: "POST",
    headers,
    body: JSON.stringify({ text, voice_id: voiceId }),
  });
  if (!response.ok) {
    let message = response.statusText || "Request failed";
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === "string") {
        message = body.detail;
      }
    } catch {
      // ignore
    }
    throw new ApiError(response.status, message);
  }
  return response.blob();
}
