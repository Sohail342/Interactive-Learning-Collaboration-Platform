import { useEffect, useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL ?? "";
const livekitUrl = import.meta.env.VITE_LIVEKIT_URL ?? "";

type HealthState =
  | { status: "loading" }
  | { status: "ok"; body: string }
  | { status: "error"; body: string };

export function App() {
  const [health, setHealth] = useState<HealthState>({ status: "loading" });

  useEffect(() => {
    if (!apiUrl) {
      setHealth({ status: "error", body: "VITE_API_URL is not set" });
      return;
    }

    const controller = new AbortController();
    fetch(`${apiUrl}/health`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.text();
        if (!response.ok) {
          setHealth({ status: "error", body });
          return;
        }
        setHealth({ status: "ok", body });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        const message = error instanceof Error ? error.message : "Request failed";
        setHealth({ status: "error", body: message });
      });

    return () => controller.abort();
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 640, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Learning & Collaboration Platform</h1>
      <p>API: {apiUrl || "(not set)"}</p>
      <p>LiveKit: {livekitUrl || "(not set)"}</p>
      <h2>Backend health</h2>
      {health.status === "loading" ? <p>Checking {apiUrl}/health…</p> : null}
      {health.status === "ok" ? <pre>{health.body}</pre> : null}
      {health.status === "error" ? <pre>{health.body}</pre> : null}
    </main>
  );
}
