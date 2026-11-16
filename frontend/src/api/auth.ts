import { apiRequest } from "./client";
import type { TokenResponse, User } from "./types";

export type StudentRegisterPayload = {
  username: string;
  email: string;
  password: string;
  class_name: string;
  date_of_birth: string;
  city_id: string;
  school_id: string;
};

export type TeacherRegisterPayload = {
  username: string;
  email: string;
  password: string;
  qualification: string;
  city_id: string;
  experience_years: number;
};

export function login(email: string, password: string): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerStudent(
  payload: StudentRegisterPayload,
): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/auth/register/student", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerTeacher(
  payload: TeacherRegisterPayload,
): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/auth/register/teacher", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMe(): Promise<User> {
  return apiRequest<User>("/auth/me");
}
