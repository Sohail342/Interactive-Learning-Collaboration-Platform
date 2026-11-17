import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Shell } from "../components/Shell";
import { resolveVoiceProvider } from "../voice/resolveVoiceProvider";
import type {
  PlaybackState,
  VoiceOption,
  VoicePlayback,
  VoiceProvider,
} from "../voice/types";

export function TextToSpeechPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const home = user?.role === "teacher" ? "/teacher" : "/student";

  const [provider, setProvider] = useState<VoiceProvider | null>(null);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voiceId, setVoiceId] = useState("");
  const [text, setText] = useState(
    "Welcome to the learning platform. Type something and press Play to hear it.",
  );
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playbackRef = useRef<VoicePlayback | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);
      setError(null);
      try {
        const nextProvider = await resolveVoiceProvider();
        const nextVoices = await nextProvider.listVoices();
        if (cancelled) {
          return;
        }
        setProvider(nextProvider);
        setVoices(nextVoices);
        setVoiceId(nextVoices[0]?.id ?? "");
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : "Could not load text-to-speech",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void boot();
    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
      playbackRef.current?.stop();
    };
  }, []);

  function clearPlayback() {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    playbackRef.current?.stop();
    playbackRef.current = null;
    setPlaybackState("idle");
  }

  async function onPlay() {
    if (!provider) {
      return;
    }
    const content = text.trim();
    if (!content) {
      setError("Enter some text to speak");
      return;
    }
    if (!voiceId) {
      setError("Select a voice");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (playbackState === "paused" && playbackRef.current) {
        await playbackRef.current.play();
        return;
      }

      clearPlayback();
      const playback = await provider.createPlayback(content, voiceId);
      playbackRef.current = playback;
      unsubscribeRef.current = playback.onStateChange(setPlaybackState);
      await playback.play();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not play speech",
      );
      clearPlayback();
    } finally {
      setBusy(false);
    }
  }

  function onPause() {
    playbackRef.current?.pause();
  }

  function onStop() {
    clearPlayback();
  }

  const providerLabel =
    provider?.id === "elevenlabs" ? "ElevenLabs" : "Browser";

  return (
    <Shell>
      <main className="dashboard-layout stack">
        <section className="hero-strip">
          <div>
            <h1>Text to speech</h1>
            <p>
              Convert written text into spoken audio. Uses the browser by default, or
              ElevenLabs when an API key is configured on the server.
            </p>
          </div>
          <div className="profile-chips">
            <span className="chip">{provider ? providerLabel : "…"}</span>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(home)}>
              Back
            </button>
          </div>
        </section>

        <section className="panel-surface tts-panel">
          {error ? <div className="error-banner">{error}</div> : null}
          {loading ? <p className="lede">Loading voices…</p> : null}

          <div className="field">
            <label htmlFor="tts-text">Text</label>
            <textarea
              id="tts-text"
              className="tts-textarea"
              rows={8}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                if (playbackState !== "idle") {
                  clearPlayback();
                }
              }}
              placeholder="Type or paste text to speak"
              maxLength={5000}
              disabled={loading}
            />
          </div>

          <div className="tts-controls">
            <div className="field tts-voice-field">
              <label htmlFor="tts-voice">Voice</label>
              <select
                id="tts-voice"
                value={voiceId}
                onChange={(event) => {
                  setVoiceId(event.target.value);
                  if (playbackState !== "idle") {
                    clearPlayback();
                  }
                }}
                disabled={loading || voices.length === 0}
              >
                {voices.length === 0 ? (
                  <option value="">No voices available</option>
                ) : (
                  voices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="tts-actions" role="group" aria-label="Playback controls">
              <button
                type="button"
                className="btn btn-blue"
                onClick={() => void onPlay()}
                disabled={loading || busy || !voiceId}
              >
                {playbackState === "paused" ? "Resume" : "Play"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onPause}
                disabled={playbackState !== "playing"}
              >
                Pause
              </button>
              <button
                type="button"
                className="btn btn-charcoal"
                onClick={onStop}
                disabled={playbackState === "idle"}
              >
                Stop
              </button>
            </div>
          </div>

          <p className="tts-status muted">
            Status:{" "}
            {playbackState === "playing"
              ? "Playing"
              : playbackState === "paused"
                ? "Paused"
                : "Ready"}
          </p>
        </section>
      </main>
    </Shell>
  );
}
