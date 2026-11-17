import { apiRequest } from "./client";
import type { CreateSudokuReportRequest, SudokuReport } from "./types";

export async function submitReport(
  body: CreateSudokuReportRequest,
): Promise<SudokuReport> {
  return apiRequest<SudokuReport>("/reports", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function listMyReports(): Promise<SudokuReport[]> {
  return apiRequest<SudokuReport[]>("/reports/me");
}

export async function listAllReports(): Promise<SudokuReport[]> {
  return apiRequest<SudokuReport[]>("/reports");
}

export async function getReport(reportId: string): Promise<SudokuReport> {
  return apiRequest<SudokuReport>(`/reports/${reportId}`);
}
