export type UserRole = "student" | "teacher";
export type MeetingStatus = "scheduled" | "live" | "ended";

export type StudentProfile = {
  class_name: string;
  date_of_birth: string;
  city: string;
  school: string;
};

export type TeacherProfile = {
  qualification: string;
  experience_years: number;
  city: string;
};

export type User = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  student: StudentProfile | null;
  teacher: TeacherProfile | null;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
};

export type City = {
  id: string;
  name: string;
};

export type School = {
  id: string;
  name: string;
  city_id: string;
};

export type Meeting = {
  id: string;
  room_name: string;
  title: string;
  host_id: string;
  status: MeetingStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};

export type JoinMeetingResponse = {
  token: string;
  url: string;
  room_name: string;
  meeting: Meeting;
};
