import { apiRequest } from "./client";

export type WhiteboardScene = {
  meeting_id: string;
  elements: unknown[];
  app_state: Record<string, unknown>;
  last_modified_by: string | null;
  updated_at: string | null;
};

export async function getWhiteboard(meetingId: string): Promise<WhiteboardScene> {
  return apiRequest<WhiteboardScene>(`/meetings/${meetingId}/whiteboard`);
}
