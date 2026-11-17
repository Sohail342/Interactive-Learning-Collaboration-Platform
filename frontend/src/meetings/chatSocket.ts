import { io, type Socket } from "socket.io-client";

import type { ChatMessage } from "../api/chat";

const socketUrl = import.meta.env.VITE_SOCKET_URL ?? "";

export type LiveChatMessage = ChatMessage & {
  meeting_id?: string;
};

type ChatJoinAck = {
  ok: boolean;
  error?: string;
  meeting_id?: string;
};

type ChatMsgAck = {
  ok: boolean;
  error?: string;
  message?: LiveChatMessage;
};

function getToken(): string | null {
  return localStorage.getItem("lp_access_token");
}

export function connectChatSocket(): Socket {
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

export function joinChatRoom(
  socket: Socket,
  meetingId: string,
): Promise<ChatJoinAck> {
  return new Promise((resolve) => {
    const doJoin = () => {
      socket.emit("chat_join", { meeting_id: meetingId }, (ack: ChatJoinAck) => {
        resolve(ack ?? { ok: false, error: "No response from server" });
      });
    };

    if (socket.connected) {
      doJoin();
      return;
    }

    const onError = () => {
      socket.off("connect", doJoin);
      resolve({ ok: false, error: "Could not connect to live chat" });
    };

    socket.once("connect", doJoin);
    socket.once("connect_error", onError);
  });
}

export function sendChatMessage(
  socket: Socket,
  meetingId: string,
  content: string,
): Promise<ChatMsgAck> {
  return new Promise((resolve) => {
    socket.emit(
      "chat_msg",
      { meeting_id: meetingId, content },
      (ack: ChatMsgAck) => {
        resolve(ack ?? { ok: false, error: "No response from server" });
      },
    );
  });
}

export function disconnectChatSocket(socket: Socket | null): void {
  if (!socket) {
    return;
  }
  socket.removeAllListeners();
  socket.disconnect();
}
