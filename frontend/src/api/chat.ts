import { apiRequest } from "./client";

export type ChatMessage = {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  sent_at: string;
};

export async function listChatMessages(meetingId: string): Promise<ChatMessage[]> {
  return apiRequest<ChatMessage[]>(`/meetings/${meetingId}/chat`);
}
