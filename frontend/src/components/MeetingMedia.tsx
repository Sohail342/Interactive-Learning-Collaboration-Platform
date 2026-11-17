import {
  CarouselLayout,
  FocusLayout,
  FocusLayoutContainer,
  GridLayout,
  ParticipantTile,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useMemo, useState } from "react";

import { IconButton } from "./meeting/IconButton";
import {
  ExpandPanelIcon,
  FilmstripCollapseIcon,
  FilmstripHideIcon,
  FilmstripShowIcon,
} from "./meeting/MeetingIcons";
import { MeetingToolbar } from "./meeting/MeetingToolbar";

type FilmstripMode = "strip" | "collapsed" | "hidden";

type MeetingMediaProps = {
  allowScreenShare: boolean;
  allowWhiteboard: boolean;
  boardOpen: boolean;
  chatOpen: boolean;
  chatUnread: number;
  onToggleWhiteboard: () => void;
  onToggleChat: () => void;
  onLeave: () => void;
  onShareFocusChange?: (focused: boolean) => void;
};

export function MeetingMedia({
  allowScreenShare,
  allowWhiteboard,
  boardOpen,
  chatOpen,
  chatUnread,
  onToggleWhiteboard,
  onToggleChat,
  onLeave,
  onShareFocusChange,
}: MeetingMediaProps) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const cameraTracks = useMemo(
    () =>
      tracks.filter(
        (track) =>
          !track.publication ||
          track.publication.source === Track.Source.Camera,
      ),
    [tracks],
  );

  const screenShareTracks = useMemo(
    () =>
      tracks.filter(
        (track) => track.publication?.source === Track.Source.ScreenShare,
      ),
    [tracks],
  );

  const focusTrack = screenShareTracks[0];
  const hasScreenShare = !!focusTrack;
  const showShareStage = hasScreenShare && !boardOpen;
  // Don't play the local share back to the sharer — that nests the meeting
  // inside itself (hall of mirrors) when they share this tab/screen.
  const isLocalShare = Boolean(focusTrack?.participant.isLocal);
  const [filmstripMode, setFilmstripMode] = useState<FilmstripMode>("strip");

  useEffect(() => {
    if (hasScreenShare) {
      setFilmstripMode("strip");
    }
  }, [hasScreenShare, focusTrack?.publication?.trackSid]);

  useEffect(() => {
    onShareFocusChange?.(showShareStage);
    return () => {
      onShareFocusChange?.(false);
    };
  }, [showShareStage, onShareFocusChange]);

  const carouselTracks = useMemo(() => {
    if (!focusTrack) {
      return tracks;
    }
    return tracks.filter((track) => track !== focusTrack);
  }, [focusTrack, tracks]);

  return (
    <div
      className={
        showShareStage
          ? "lk-video-conference room-livekit share-expanded"
          : "lk-video-conference room-livekit"
      }
    >
      <div className="lk-video-conference-inner">
        {showShareStage ? (
          <div className={`share-focus-shell filmstrip-${filmstripMode}`}>
            <div className="share-focus-controls">
              {filmstripMode === "strip" ? (
                <>
                  <IconButton
                    label="Collapse filmstrip"
                    showLabel={false}
                    className="share-focus-icon"
                    onClick={() => setFilmstripMode("collapsed")}
                  >
                    <FilmstripCollapseIcon size={18} />
                  </IconButton>
                  <IconButton
                    label="Hide filmstrip"
                    showLabel={false}
                    className="share-focus-icon"
                    onClick={() => setFilmstripMode("hidden")}
                  >
                    <FilmstripHideIcon size={18} />
                  </IconButton>
                </>
              ) : filmstripMode === "collapsed" ? (
                <>
                  <IconButton
                    label="Expand filmstrip"
                    showLabel={false}
                    className="share-focus-icon"
                    onClick={() => setFilmstripMode("strip")}
                  >
                    <ExpandPanelIcon size={18} />
                  </IconButton>
                  <IconButton
                    label="Hide filmstrip"
                    showLabel={false}
                    className="share-focus-icon"
                    onClick={() => setFilmstripMode("hidden")}
                  >
                    <FilmstripHideIcon size={18} />
                  </IconButton>
                </>
              ) : (
                <IconButton
                  label="Show filmstrip"
                  showLabel={false}
                  className="share-focus-icon"
                  onClick={() => setFilmstripMode("strip")}
                >
                  <FilmstripShowIcon size={18} />
                </IconButton>
              )}
            </div>

            <FocusLayoutContainer className="share-focus-layout">
              {filmstripMode !== "hidden" ? (
                <div
                  className={
                    filmstripMode === "collapsed"
                      ? "share-filmstrip is-collapsed"
                      : "share-filmstrip"
                  }
                >
                  <CarouselLayout tracks={carouselTracks}>
                    <ParticipantTile />
                  </CarouselLayout>
                </div>
              ) : null}
              {isLocalShare ? (
                <div className="share-local-placeholder" role="status">
                  <strong>You are sharing your screen</strong>
                  <p>
                    Students see your shared content. Share a different window
                    or screen not this meeting tab, so it does not mirror
                    endlessly.
                  </p>
                </div>
              ) : (
                <FocusLayout trackRef={focusTrack} className="share-focus-main" />
              )}
            </FocusLayoutContainer>
          </div>
        ) : (
          <GridLayout
            tracks={boardOpen ? cameraTracks : tracks}
            className="room-grid-layout"
          >
            <ParticipantTile />
          </GridLayout>
        )}
      </div>

      <MeetingToolbar
        allowScreenShare={allowScreenShare}
        allowWhiteboard={allowWhiteboard}
        boardOpen={boardOpen}
        chatOpen={chatOpen}
        chatUnread={chatUnread}
        onToggleWhiteboard={onToggleWhiteboard}
        onToggleChat={onToggleChat}
        onLeave={onLeave}
      />
    </div>
  );
}
