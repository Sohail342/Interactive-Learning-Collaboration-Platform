import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

import {
  connectWhiteboardSocket,
  disconnectWhiteboardSocket,
  joinWhiteboardRoom,
  publishBoardPresence,
  type WhiteboardPresencePayload,
} from "./whiteboardSocket";

export function useWhiteboardPresence(meetingId: string, isHost: boolean) {
  const [boardOpen, setBoardOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!meetingId) {
      setReady(false);
      setBoardOpen(false);
      return;
    }

    let cancelled = false;
    const socket = connectWhiteboardSocket();
    socketRef.current = socket;

    socket.on("wb_presence", (payload: WhiteboardPresencePayload) => {
      if (!payload || payload.meeting_id !== meetingId) {
        return;
      }
      setBoardOpen(Boolean(payload.open));
    });

    void joinWhiteboardRoom(socket, meetingId).then((ack) => {
      if (cancelled) {
        return;
      }
      if (ack.ok) {
        setBoardOpen(Boolean(ack.board_open));
      }
      setReady(true);
    });

    return () => {
      cancelled = true;
      disconnectWhiteboardSocket(socketRef.current);
      socketRef.current = null;
    };
  }, [meetingId]);

  async function setHostBoardOpen(open: boolean) {
    if (!isHost) {
      return;
    }
    setBoardOpen(open);
    const socket = socketRef.current;
    if (!socket) {
      return;
    }
    const ack = await publishBoardPresence(socket, meetingId, open);
    if (!ack.ok) {
      // Keep local optimistic state; host can retry by toggling again.
      return;
    }
    setBoardOpen(Boolean(ack.open));
  }

  return {
    boardOpen,
    presenceReady: ready,
    setHostBoardOpen,
  };
}
