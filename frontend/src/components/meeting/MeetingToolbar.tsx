import {
  TrackToggle,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";
import { useEffect, useState } from "react";

import { DeviceMenu } from "./DeviceMenu";
import { IconButton } from "./IconButton";
import {
  CamIcon,
  CamOffIcon,
  ChatIcon,
  LeaveIcon,
  MicIcon,
  MicOffIcon,
  ShareIcon,
  WhiteboardIcon,
} from "./MeetingIcons";

type MeetingToolbarProps = {
  allowScreenShare: boolean;
  allowWhiteboard: boolean;
  boardOpen: boolean;
  chatOpen: boolean;
  chatUnread: number;
  onToggleWhiteboard: () => void;
  onToggleChat: () => void;
  onLeave: () => void;
};

function formatBadge(count: number): string | null {
  if (count <= 0) {
    return null;
  }
  return count > 99 ? "99+" : String(count);
}

export function MeetingToolbar({
  allowScreenShare,
  allowWhiteboard,
  boardOpen,
  chatOpen,
  chatUnread,
  onToggleWhiteboard,
  onToggleChat,
  onLeave,
}: MeetingToolbarProps) {
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } =
    useLocalParticipant();
  const [sharing, setSharing] = useState(
    () => localParticipant.isScreenShareEnabled,
  );

  useEffect(() => {
    const syncShare = () => {
      setSharing(localParticipant.isScreenShareEnabled);
    };
    syncShare();
    room.on(RoomEvent.LocalTrackPublished, syncShare);
    room.on(RoomEvent.LocalTrackUnpublished, syncShare);
    room.on(RoomEvent.TrackMuted, syncShare);
    room.on(RoomEvent.TrackUnmuted, syncShare);
    return () => {
      room.off(RoomEvent.LocalTrackPublished, syncShare);
      room.off(RoomEvent.LocalTrackUnpublished, syncShare);
      room.off(RoomEvent.TrackMuted, syncShare);
      room.off(RoomEvent.TrackUnmuted, syncShare);
    };
  }, [localParticipant, room]);

  return (
    <div className="meeting-toolbar" role="toolbar" aria-label="Meeting controls">
      <div className="meeting-toolbar-group">
        <div className="mt-device-cluster">
          <TrackToggle
            source={Track.Source.Microphone}
            showIcon={false}
            className={`mt-icon-btn ${isMicrophoneEnabled ? "" : "is-off"}`}
            aria-label={isMicrophoneEnabled ? "Mute" : "Unmute"}
            title={isMicrophoneEnabled ? "Mute" : "Unmute"}
          >
            <span className="mt-icon-btn-glyph" aria-hidden>
              {isMicrophoneEnabled ? <MicIcon /> : <MicOffIcon />}
            </span>
            <span className="mt-icon-btn-label">
              {isMicrophoneEnabled ? "Mute" : "Unmute"}
            </span>
          </TrackToggle>
          <DeviceMenu kind="audioinput" label="microphone" />
        </div>

        <div className="mt-device-cluster">
          <TrackToggle
            source={Track.Source.Camera}
            showIcon={false}
            className={`mt-icon-btn ${isCameraEnabled ? "" : "is-off"}`}
            aria-label={isCameraEnabled ? "Stop video" : "Start video"}
            title={isCameraEnabled ? "Stop video" : "Start video"}
          >
            <span className="mt-icon-btn-glyph" aria-hidden>
              {isCameraEnabled ? <CamIcon /> : <CamOffIcon />}
            </span>
            <span className="mt-icon-btn-label">
              {isCameraEnabled ? "Stop Video" : "Start Video"}
            </span>
          </TrackToggle>
          <DeviceMenu kind="videoinput" label="camera" />
        </div>

        {allowScreenShare ? (
          <TrackToggle
            source={Track.Source.ScreenShare}
            showIcon={false}
            className={`mt-icon-btn ${sharing ? "is-active" : ""}`}
            aria-label={sharing ? "Stop share" : "Share"}
            title={sharing ? "Stop share" : "Share screen"}
          >
            <span className="mt-icon-btn-glyph" aria-hidden>
              <ShareIcon />
            </span>
            <span className="mt-icon-btn-label">
              {sharing ? "Sharing" : "Share"}
            </span>
          </TrackToggle>
        ) : null}
      </div>

      <div className="meeting-toolbar-divider" aria-hidden />

      <div className="meeting-toolbar-group">
        {allowWhiteboard ? (
          <IconButton
            label="Whiteboard"
            tooltip={boardOpen ? "Close whiteboard" : "Open whiteboard"}
            active={boardOpen}
            onClick={onToggleWhiteboard}
          >
            <WhiteboardIcon />
          </IconButton>
        ) : null}

        <IconButton
          label="Chat"
          tooltip={chatOpen ? "Close chat" : "Open chat"}
          active={chatOpen}
          badge={formatBadge(chatUnread)}
          onClick={onToggleChat}
        >
          <ChatIcon />
        </IconButton>
      </div>

      <div className="meeting-toolbar-divider" aria-hidden />

      <div className="meeting-toolbar-group">
        <IconButton label="Leave" tooltip="Leave meeting" danger onClick={onLeave}>
          <LeaveIcon />
        </IconButton>
      </div>
    </div>
  );
}
