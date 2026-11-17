import { io, type Socket } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL ?? "";

export type WhiteboardRole = "host" | "viewer";

export type WhiteboardScenePayload = {
  meeting_id?: string;
  elements: unknown[];
  appState: Record<string, unknown>;
  from_user_id?: string;
};

export type WhiteboardPresencePayload = {
  meeting_id?: string;
  open: boolean;
  from_user_id?: string;
};

type WbJoinAck = {
  ok: boolean;
  error?: string;
  role?: WhiteboardRole;
  meeting_id?: string;
  board_open?: boolean;
  elements?: unknown[];
  appState?: Record<string, unknown>;
};

type SceneUpdateAck = {
  ok: boolean;
  error?: string;
};

type PresenceAck = {
  ok: boolean;
  error?: string;
  open?: boolean;
};

function getToken(): string | null {
  return localStorage.getItem("lp_access_token");
}

export function connectWhiteboardSocket(): Socket {
  if (!socketUrl) {
    throw new Error("VITE_SOCKET_URL is not set");
  }
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  return io(socketUrl, {
    autoConnect: true,
    transports: ["websocket", "polling"],
    auth: { token },
  });
}

function whenConnected(socket: Socket, run: () => void, onError: () => void): void {
  if (socket.connected) {
    run();
    return;
  }
  const fail = () => {
    socket.off("connect", run);
    onError();
  };
  socket.once("connect", run);
  socket.once("connect_error", fail);
}

export function joinWhiteboardRoom(
  socket: Socket,
  meetingId: string,
): Promise<WbJoinAck> {
  return new Promise((resolve) => {
    const doJoin = () => {
      socket.emit("wb_join", { meeting_id: meetingId }, (ack: WbJoinAck) => {
        resolve(ack ?? { ok: false, error: "No response from server" });
      });
    };
    whenConnected(socket, doJoin, () =>
      resolve({ ok: false, error: "Could not connect to whiteboard" }),
    );
  });
}

export function publishBoardPresence(
  socket: Socket,
  meetingId: string,
  open: boolean,
): Promise<PresenceAck> {
  return new Promise((resolve) => {
    socket.emit(
      "wb_presence",
      { meeting_id: meetingId, open },
      (ack: PresenceAck) => {
        resolve(ack ?? { ok: false, error: "No response from server" });
      },
    );
  });
}

export function publishSceneUpdate(
  socket: Socket,
  meetingId: string,
  elements: unknown[],
  appState: Record<string, unknown>,
): Promise<SceneUpdateAck> {
  return new Promise((resolve) => {
    socket.emit(
      "scene_update",
      { meeting_id: meetingId, elements, appState },
      (ack: SceneUpdateAck) => {
        resolve(ack ?? { ok: false, error: "No response from server" });
      },
    );
  });
}

export function disconnectWhiteboardSocket(socket: Socket | null): void {
  if (!socket) {
    return;
  }
  socket.removeAllListeners();
  socket.disconnect();
}
