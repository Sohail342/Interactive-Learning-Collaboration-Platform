import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Socket } from "socket.io-client";

import { ApiError } from "../api/client";
import { listChatMessages, type ChatMessage } from "../api/chat";
import {
  connectChatSocket,
  disconnectChatSocket,
  joinChatRoom,
  sendChatMessage,
  type LiveChatMessage,
} from "../meetings/chatSocket";

type ChatDrawerProps = {
  meetingId: string;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showFab?: boolean;
  onUnreadChange?: (count: number) => void;
};

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function upsertMessage(
  messages: ChatMessage[],
  incoming: ChatMessage,
): { next: ChatMessage[]; added: boolean } {
  if (messages.some((item) => item.id === incoming.id)) {
    return { next: messages, added: false };
  }
  return { next: [...messages, incoming], added: true };
}

function formatBadgeCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}

export function ChatDrawer({
  meetingId,
  currentUserId,
  open,
  onOpenChange,
  showFab = true,
  onUnreadChange,
}: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [joined, setJoined] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const openRef = useRef(open);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const onUnreadChangeRef = useRef(onUnreadChange);

  useEffect(() => {
    onUnreadChangeRef.current = onUnreadChange;
  }, [onUnreadChange]);

  useEffect(() => {
    openRef.current = open;
    if (open) {
      setUnreadCount(0);
      onUnreadChangeRef.current?.(0);
    }
  }, [open]);

  useEffect(() => {
    onUnreadChangeRef.current?.(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);
      setJoined(false);
      setError(null);
      try {
        const history = await listChatMessages(meetingId);
        if (cancelled) {
          return;
        }
        seenIdsRef.current = new Set(history.map((item) => item.id));
        setMessages(history);

        const socket = connectChatSocket();
        socketRef.current = socket;

        socket.on("chat_msg", (payload: LiveChatMessage) => {
          if (!payload?.id) {
            return;
          }
          const incoming: ChatMessage = {
            id: payload.id,
            sender_id: payload.sender_id,
            sender_name: payload.sender_name,
            content: payload.content,
            sent_at: payload.sent_at,
          };

          setMessages((current) => {
            const result = upsertMessage(current, incoming);
            if (result.added) {
              seenIdsRef.current.add(incoming.id);
              if (
                !openRef.current &&
                incoming.sender_id !== currentUserId
              ) {
                setUnreadCount((count) => count + 1);
              }
            }
            return result.next;
          });
        });

        socket.on("connect_error", () => {
          if (!cancelled) {
            setError("Could not connect to live chat");
          }
        });

        const join = await joinChatRoom(socket, meetingId);
        if (cancelled) {
          return;
        }
        if (!join.ok) {
          setError(join.error || "Could not join chat");
          return;
        }
        setJoined(true);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : "Could not load chat",
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
      setJoined(false);
      disconnectChatSocket(socketRef.current);
      socketRef.current = null;
    };
  }, [meetingId, currentUserId]);

  useEffect(() => {
    if (!open || !listRef.current) {
      return;
    }
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    const socket = socketRef.current;
    if (!content || !socket || !joined || sending) {
      return;
    }

    setSending(true);
    setError(null);
    try {
      const ack = await sendChatMessage(socket, meetingId, content);
      if (!ack.ok) {
        setError(ack.error || "Failed to send message");
        return;
      }
      if (ack.message) {
        setMessages((current) => {
          const result = upsertMessage(current, {
            id: ack.message!.id,
            sender_id: ack.message!.sender_id,
            sender_name: ack.message!.sender_name,
            content: ack.message!.content,
            sent_at: ack.message!.sent_at,
          });
          if (result.added) {
            seenIdsRef.current.add(ack.message!.id);
          }
          return result.next;
        });
      }
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  const messageCount = messages.length;
  const badgeCount = unreadCount;

  return (
    <div className={open ? "chat-shell is-open" : "chat-shell"}>
      {open ? (
        <aside className="chat-panel" aria-label="Meeting chat">
          <div className="chat-panel-header">
            <div>
              <strong>In-meeting chat</strong>
              <div className="chat-panel-subtitle">
                {messageCount === 0
                  ? "No messages yet"
                  : `${messageCount} message${messageCount === 1 ? "" : "s"}`}
              </div>
            </div>
            <button
              type="button"
              className="chat-panel-close"
              onClick={() => onOpenChange(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className="chat-panel-body" ref={listRef}>
            {loading ? <div className="chat-empty">Loading messages…</div> : null}
            {!loading && messages.length === 0 ? (
              <div className="chat-empty">Say hello to everyone in the room.</div>
            ) : null}
            {messages.map((message) => {
              const mine = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={mine ? "chat-message chat-message-mine" : "chat-message"}
                >
                  <div className="chat-message-meta">
                    <span className="chat-message-author">
                      {mine ? "You" : message.sender_name}
                    </span>
                    <span className="chat-message-time">{formatTime(message.sent_at)}</span>
                  </div>
                  <p>{message.content}</p>
                </div>
              );
            })}
          </div>

          {error ? <div className="chat-panel-error">{error}</div> : null}

          <form
            className="chat-panel-form"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Send a message to everyone"
              maxLength={2000}
              disabled={!joined}
              aria-label="Chat message"
            />
            <button
              type="submit"
              className="btn btn-blue"
              disabled={sending || !joined || !draft.trim()}
            >
              Send
            </button>
          </form>
        </aside>
      ) : showFab ? (
        <button
          type="button"
          className="chat-fab"
          onClick={() => onOpenChange(true)}
          aria-label="Open chat"
          aria-expanded={false}
        >
          <span className="chat-fab-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <path
                d="M5 6.8A2.8 2.8 0 0 1 7.8 4h8.4A2.8 2.8 0 0 1 19 6.8v6.4A2.8 2.8 0 0 1 16.2 16H10l-3.8 3.2V16H7.8A2.8 2.8 0 0 1 5 13.2V6.8Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 9h7M8.5 12h4.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="chat-fab-label">Chat</span>
          {badgeCount > 0 ? (
            <span className="chat-fab-badge" aria-label={`${badgeCount} unread messages`}>
              {formatBadgeCount(badgeCount)}
            </span>
          ) : null}
        </button>
      ) : null}
    </div>
  );
}
