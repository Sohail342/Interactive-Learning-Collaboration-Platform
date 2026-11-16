import { apiRequest } from "./client";
import type { JoinMeetingResponse, Meeting } from "./types";

export function listMeetings(): Promise<Meeting[]> {
  return apiRequest<Meeting[]>("/meetings");
}

export function createMeeting(title: string): Promise<Meeting> {
  return apiRequest<Meeting>("/meetings", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function startMeeting(meetingId: string): Promise<Meeting> {
  return apiRequest<Meeting>(`/meetings/${meetingId}/start`, {
    method: "POST",
  });
}

export function joinMeeting(meetingId: string): Promise<JoinMeetingResponse> {
  return apiRequest<JoinMeetingResponse>(`/meetings/${meetingId}/join`, {
    method: "POST",
  });
}
