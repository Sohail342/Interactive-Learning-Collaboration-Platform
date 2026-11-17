import "@livekit/components-styles";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { ConnectionState, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

import { ApiError } from "../api/client";
import { joinMeeting } from "../api/meetings";
import type { JoinMeetingResponse } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ChatDrawer } from "../components/ChatDrawer";
import { MeetingMedia } from "../components/MeetingMedia";
import { WhiteboardPanel } from "../components/WhiteboardPanel";
import {
  clearMediaPreferences,
  loadMediaPreferences,
  saveMediaPreferences,
  type MediaPreferences,
} from "../meetings/mediaPreferences";
import { useWhiteboardPresence } from "../meetings/useWhiteboardPresence";

const ACTIVE_MEETING_KEY = "lp_active_meeting";

function ConnectionBanner() {
  const state = useConnectionState();
  if (state === ConnectionState.Connected) {
    return null;
  }
  const label =
    state === ConnectionState.Connecting
      ? "Connecting…"
      : state === ConnectionState.Reconnecting
        ? "Reconnecting…"
        : "Connection interrupted";
  return <div className="room-banner">{label}</div>;
}

function MediaPreferenceSync({
  meetingId,
  onChange,
}: {
  meetingId: string;
  onChange: (prefs: MediaPreferences) => void;
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    const persist = () => {
      const prefs: MediaPreferences = {
        audio: localParticipant.isMicrophoneEnabled,
        video: localParticipant.isCameraEnabled,
      };
      saveMediaPreferences(meetingId, prefs);
      onChange(prefs);
    };

    persist();
    room.on(RoomEvent.TrackMuted, persist);
    room.on(RoomEvent.TrackUnmuted, persist);
    room.on(RoomEvent.LocalTrackPublished, persist);
    room.on(RoomEvent.LocalTrackUnpublished, persist);
    room.on(RoomEvent.TrackSubscriptionStatusChanged, persist);

    return () => {
      room.off(RoomEvent.TrackMuted, persist);
      room.off(RoomEvent.TrackUnmuted, persist);
      room.off(RoomEvent.LocalTrackPublished, persist);
      room.off(RoomEvent.LocalTrackUnpublished, persist);
      room.off(RoomEvent.TrackSubscriptionStatusChanged, persist);
    };
  }, [localParticipant, meetingId, onChange, room]);

  useEffect(() => {
    const prefs = loadMediaPreferences(meetingId);
    void localParticipant.setMicrophoneEnabled(prefs.audio);
    void localParticipant.setCameraEnabled(prefs.video);
  }, [localParticipant, meetingId]);

  return null;
}

function readRouteJoin(
  meetingId: string | undefined,
  state: unknown,
): JoinMeetingResponse | null {
  if (!meetingId || !state || typeof state !== "object") {
    return null;
  }
  const join = state as JoinMeetingResponse;
  if (!join.token || !join.url || !join.meeting || join.meeting.id !== meetingId) {
    return null;
  }
  return join;
}

export function MeetingRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const home = user?.role === "teacher" ? "/teacher" : "/student";

  const [join, setJoin] = useState<JoinMeetingResponse | null>(() =>
    readRouteJoin(id, location.state),
  );
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(() => !readRouteJoin(id, location.state));
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectKey, setConnectKey] = useState(0);
  const [mediaPrefs, setMediaPrefs] = useState<MediaPreferences>(() =>
    id ? loadMediaPreferences(id) : { audio: true, video: true },
  );
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [shareFocus, setShareFocus] = useState(false);
  const leavingRef = useRef(false);
  const hadMediaErrorRef = useRef(false);

  const isHost =
    !!user &&
    !!join &&
    user.role === "teacher" &&
    join.meeting.host_id === user.id;

  const meetingIdForPresence = join?.meeting.id ?? "";
  const { boardOpen, setHostBoardOpen } = useWhiteboardPresence(
    meetingIdForPresence,
    isHost,
  );

  useEffect(() => {
    if (id) {
      setMediaPrefs(loadMediaPreferences(id));
    }
  }, [id]);

  const leaveMeeting = useCallback(() => {
    leavingRef.current = true;
    setChatOpen(false);
    if (isHost && meetingIdForPresence) {
      void setHostBoardOpen(false);
    }
    if (id) {
      const active = sessionStorage.getItem(ACTIVE_MEETING_KEY);
      if (active === id) {
        sessionStorage.removeItem(ACTIVE_MEETING_KEY);
      }
      clearMediaPreferences(id);
    }
    navigate(home, { replace: true });
  }, [home, id, isHost, meetingIdForPresence, navigate, setHostBoardOpen]);

  const restoreSession = useCallback(async () => {
    if (!id) {
      setSessionError("Meeting not found");
      setLoadingSession(false);
      return;
    }

    const fromRoute = readRouteJoin(id, location.state);
    if (fromRoute) {
      sessionStorage.setItem(ACTIVE_MEETING_KEY, id);
      setMediaPrefs(loadMediaPreferences(id));
      setJoin(fromRoute);
      setSessionError(null);
      setLoadingSession(false);
      return;
    }

    setLoadingSession(true);
    setSessionError(null);
    try {
      const restored = await joinMeeting(id);
      sessionStorage.setItem(ACTIVE_MEETING_KEY, id);
      setMediaPrefs(loadMediaPreferences(id));
      setJoin(restored);
      navigate(location.pathname, { replace: true, state: restored });
    } catch (err) {
      sessionStorage.removeItem(ACTIVE_MEETING_KEY);
      setJoin(null);
      setSessionError(
        err instanceof ApiError ? err.message : "Could not restore the meeting session",
      );
    } finally {
      setLoadingSession(false);
    }
  }, [id, location.pathname, location.state, navigate]);

  useEffect(() => {
    if (authLoading || !user || !id) {
      return;
    }
    void restoreSession();
  }, [authLoading, user, id, restoreSession]);

  if (authLoading) {
    return (
      <div className="room-page">
        <div className="room-loading">Loading your account…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!id) {
    return <Navigate to={home} replace />;
  }

  if (loadingSession) {
    return (
      <div className="room-page">
        <header className="room-header room-header-slim">
          <div>
            <strong>Rejoining meeting</strong>
          </div>
          <button type="button" className="btn btn-charcoal" onClick={leaveMeeting}>
            Leave
          </button>
        </header>
        <div className="room-loading">Restoring your meeting session…</div>
      </div>
    );
  }

  if (sessionError || !join) {
    return (
      <div className="room-page">
        <header className="room-header room-header-slim">
          <div>
            <strong>Meeting unavailable</strong>
          </div>
          <button type="button" className="btn btn-charcoal" onClick={leaveMeeting}>
            Back
          </button>
        </header>
        <div className="room-error">
          <strong>You are no longer in this meeting</strong>
          <p>{sessionError ?? "The meeting session could not be restored."}</p>
          <div className="meeting-meta" style={{ marginTop: "1rem" }}>
            <button type="button" className="btn btn-blue" onClick={() => void restoreSession()}>
              Try again
            </button>
            <button type="button" className="btn btn-ghost" onClick={leaveMeeting}>
              Return to workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Whiteboard takes visual priority over screen-share focus layout.
  // Share can keep publishing in the video dock while the board is open.
  const pageClass = [
    "room-page",
    chatOpen ? "room-page-chat-open" : "",
    boardOpen ? "room-page-board-open" : "",
    shareFocus && !boardOpen ? "room-page-share-focus" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const statusLabel = boardOpen
    ? isHost
      ? "Whiteboard"
      : "Whiteboard live"
    : shareFocus
      ? "Screen share"
      : null;

  return (
    <div className={pageClass}>
      <div className="room-main">
        <header className="room-header room-header-slim">
          <div className="room-header-title">
            <strong>{join.meeting.title}</strong>
            {statusLabel ? <span className="room-status-pill">{statusLabel}</span> : null}
          </div>
          <div className="meeting-meta">
            {connectError ? (
              <button
                type="button"
                className="btn btn-blue"
                onClick={() => {
                  hadMediaErrorRef.current = false;
                  setConnectError(null);
                  setMediaPrefs(loadMediaPreferences(id));
                  setConnectKey((value) => value + 1);
                }}
              >
                Retry
              </button>
            ) : null}
          </div>
        </header>

        {connectError ? (
          <div className="room-error">
            <strong>Could not connect to media</strong>
            <p>{connectError}</p>
          </div>
        ) : null}

        <div className="room-workspace">
          <WhiteboardPanel
            meetingId={join.meeting.id}
            open={boardOpen}
            canEdit={isHost}
            onClose={() => {
              if (isHost) {
                void setHostBoardOpen(false);
              }
            }}
          />

          <div className="room-stage" data-lk-theme="default">
            <LiveKitRoom
              key={`${join.token}-${connectKey}`}
              token={join.token}
              serverUrl={join.url}
              connect
              audio={mediaPrefs.audio}
              video={mediaPrefs.video}
              onConnected={() => {
                hadMediaErrorRef.current = false;
                setConnectError(null);
              }}
              onError={(error) => {
                hadMediaErrorRef.current = true;
                setConnectError(error.message || "LiveKit connection failed");
              }}
              onDisconnected={() => {
                if (leavingRef.current) {
                  return;
                }
                if (!hadMediaErrorRef.current) {
                  setConnectError(
                    "Disconnected from media. Use Retry to rejoin audio/video.",
                  );
                  hadMediaErrorRef.current = true;
                }
              }}
              className="room-livekit"
            >
              <ConnectionBanner />
              <MediaPreferenceSync meetingId={id} onChange={setMediaPrefs} />
              <RoomAudioRenderer />
              <MeetingMedia
                allowScreenShare={isHost}
                allowWhiteboard={isHost}
                boardOpen={boardOpen}
                chatOpen={chatOpen}
                chatUnread={chatUnread}
                onToggleWhiteboard={() => {
                  const next = !boardOpen;
                  if (next) {
                    setChatOpen(false);
                  }
                  void setHostBoardOpen(next);
                }}
                onToggleChat={() => {
                  setChatOpen((value) => !value);
                }}
                onLeave={leaveMeeting}
                onShareFocusChange={setShareFocus}
              />
            </LiveKitRoom>
          </div>
        </div>
      </div>

      <ChatDrawer
        meetingId={join.meeting.id}
        currentUserId={user.id}
        open={chatOpen}
        onOpenChange={setChatOpen}
        showFab={false}
        onUnreadChange={setChatUnread}
      />
    </div>
  );
}
