export type UserRole = "student" | "teacher";
export type MeetingStatus = "scheduled" | "live" | "ended";
export type GameStatus = "completed" | "abandoned" | "timed_out";
export type SudokuDifficulty = "easy" | "medium" | "hard";

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

export type CreateSudokuReportRequest = {
  difficulty: SudokuDifficulty;
  time_limit_seconds: number;
  completion_time_seconds: number;
  correct_entries: number;
  incorrect_entries: number;
  mistakes_count: number;
  final_score: number;
  status: GameStatus;
};

export type SudokuReport = {
  id: string;
  student_id: string;
  student_name: string;
  meeting_id: string | null;
  meeting_title: string | null;
  difficulty: SudokuDifficulty | string;
  time_limit_seconds: number;
  completion_time_seconds: number;
  correct_entries: number;
  incorrect_entries: number;
  mistakes_count: number;
  final_score: number | string;
  status: GameStatus;
  completed_at: string | null;
};
