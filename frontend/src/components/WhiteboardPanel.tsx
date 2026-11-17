import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useEffect, useRef, useState } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { Socket } from "socket.io-client";

import { ApiError } from "../api/client";
import { getWhiteboard } from "../api/whiteboard";
import {
  connectWhiteboardSocket,
  disconnectWhiteboardSocket,
  joinWhiteboardRoom,
  publishSceneUpdate,
  type WhiteboardRole,
  type WhiteboardScenePayload,
} from "../meetings/whiteboardSocket";
import { IconButton } from "./meeting/IconButton";
import { CloseIcon } from "./meeting/MeetingIcons";

type WhiteboardPanelProps = {
  meetingId: string;
  open: boolean;
  canEdit: boolean;
  onClose: () => void;
};

const EMPTY_APP_STATE: Record<string, unknown> = {
  viewBackgroundColor: "#ffffff",
};

export function WhiteboardPanel({
  meetingId,
  open,
  canEdit,
  onClose,
}: WhiteboardPanelProps) {
  const [role, setRole] = useState<WhiteboardRole>(canEdit ? "host" : "viewer");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [initialElements, setInitialElements] = useState<unknown[]>([]);
  const [initialAppState, setInitialAppState] =
    useState<Record<string, unknown>>(EMPTY_APP_STATE);
  const [sceneKey, setSceneKey] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const applyingRemoteRef = useRef(false);
  const publishTimerRef = useRef<number | null>(null);
  const editable = canEdit && role === "host";

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function boot() {
      setReady(false);
      setError(null);
      try {
        const snapshot = await getWhiteboard(meetingId);
        if (cancelled) {
          return;
        }
        setInitialElements(
          Array.isArray(snapshot.elements) ? snapshot.elements : [],
        );
        setInitialAppState(
          snapshot.app_state && typeof snapshot.app_state === "object"
            ? snapshot.app_state
            : EMPTY_APP_STATE,
        );
        setSceneKey((value) => value + 1);

        const socket = connectWhiteboardSocket();
        socketRef.current = socket;

        socket.on("scene_update", (payload: WhiteboardScenePayload) => {
          if (!payload || !Array.isArray(payload.elements)) {
            return;
          }
          const api = apiRef.current;
          if (!api) {
            setInitialElements(payload.elements);
            setInitialAppState(payload.appState ?? EMPTY_APP_STATE);
            setSceneKey((value) => value + 1);
            return;
          }
          applyingRemoteRef.current = true;
          api.updateScene({
            elements: payload.elements as never,
            appState: {
              ...(payload.appState ?? {}),
              collaborators: new Map(),
            } as never,
          });
          window.setTimeout(() => {
            applyingRemoteRef.current = false;
          }, 50);
        });

        const join = await joinWhiteboardRoom(socket, meetingId);
        if (cancelled) {
          return;
        }
        if (!join.ok) {
          setError(join.error || "Could not join whiteboard");
          return;
        }
        if (join.role === "host" || join.role === "viewer") {
          setRole(join.role);
        }
        if (Array.isArray(join.elements)) {
          setInitialElements(join.elements);
          setInitialAppState(join.appState ?? EMPTY_APP_STATE);
          setSceneKey((value) => value + 1);
        }
        setReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : "Could not load whiteboard",
          );
        }
      }
    }

    void boot();

    return () => {
      cancelled = true;
      if (publishTimerRef.current !== null) {
        window.clearTimeout(publishTimerRef.current);
        publishTimerRef.current = null;
      }
      disconnectWhiteboardSocket(socketRef.current);
      socketRef.current = null;
      apiRef.current = null;
    };
  }, [meetingId, open]);

  function schedulePublish(elements: readonly unknown[], appState: Record<string, unknown>) {
    if (!editable || applyingRemoteRef.current) {
      return;
    }
    const socket = socketRef.current;
    if (!socket) {
      return;
    }
    if (publishTimerRef.current !== null) {
      window.clearTimeout(publishTimerRef.current);
    }
    publishTimerRef.current = window.setTimeout(() => {
      void publishSceneUpdate(
        socket,
        meetingId,
        elements as unknown[],
        appState,
      ).then((ack) => {
        if (!ack.ok) {
          setError(ack.error || "Failed to sync whiteboard");
        }
      });
    }, 350);
  }

  if (!open) {
    return null;
  }

  return (
    <section className="wb-stage" aria-label="Class whiteboard">
      <div className="wb-stage-bar">
        <div>
          <strong>Whiteboard</strong>
          {!editable ? <span className="muted">View only</span> : null}
        </div>
        {editable ? (
          <IconButton
            label="Close whiteboard"
            showLabel={false}
            className="wb-close-btn"
            onClick={onClose}
          >
            <CloseIcon size={18} />
          </IconButton>
        ) : null}
      </div>

      {error ? <div className="wb-panel-error">{error}</div> : null}

      <div className="wb-canvas">
        {!ready ? (
          <div className="chat-empty">Loading whiteboard…</div>
        ) : (
          <Excalidraw
            key={`${meetingId}-${sceneKey}-${editable ? "edit" : "view"}`}
            excalidrawAPI={(api) => {
              apiRef.current = api;
            }}
            viewModeEnabled={!editable}
            zenModeEnabled={false}
            isCollaborating={!editable}
            theme="light"
            renderTopRightUI={() => null}
            UIOptions={{
              canvasActions: {
                loadScene: false,
                saveToActiveFile: false,
                export: false,
                toggleTheme: false,
                clearCanvas: false,
                saveAsImage: false,
                changeViewBackgroundColor: false,
              },
            }}
            initialData={{
              elements: initialElements as never,
              appState: {
                ...initialAppState,
                viewBackgroundColor:
                  (initialAppState.viewBackgroundColor as string) ?? "#ffffff",
                collaborators: new Map(),
              } as never,
              scrollToContent: true,
            }}
            onChange={(elements, appState) => {
              schedulePublish(elements as unknown[], {
                viewBackgroundColor: appState.viewBackgroundColor,
                currentItemStrokeColor: appState.currentItemStrokeColor,
                currentItemBackgroundColor: appState.currentItemBackgroundColor,
                currentItemFillStyle: appState.currentItemFillStyle,
                currentItemStrokeWidth: appState.currentItemStrokeWidth,
                currentItemStrokeStyle: appState.currentItemStrokeStyle,
                currentItemOpacity: appState.currentItemOpacity,
                currentItemFontFamily: appState.currentItemFontFamily,
                currentItemFontSize: appState.currentItemFontSize,
                currentItemTextAlign: appState.currentItemTextAlign,
                currentItemStartArrowhead: appState.currentItemStartArrowhead,
                currentItemEndArrowhead: appState.currentItemEndArrowhead,
                scrollX: appState.scrollX,
                scrollY: appState.scrollY,
                zoom: appState.zoom,
              });
            }}
          />
        )}
      </div>
    </section>
  );
}
