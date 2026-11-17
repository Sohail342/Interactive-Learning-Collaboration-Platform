import type { SudokuReport } from "../api/types";

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function formatScore(value: number | string): string {
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) {
    return String(value);
  }
  return num.toFixed(2);
}

function statusLabel(status: SudokuReport["status"]): string {
  if (status === "completed") {
    return "Completed";
  }
  if (status === "timed_out") {
    return "Timed out";
  }
  return "Abandoned";
}

type SudokuReportViewProps = {
  report: SudokuReport;
  compact?: boolean;
};

export function SudokuReportView({ report, compact = false }: SudokuReportViewProps) {
  return (
    <div className={compact ? "sudoku-report sudoku-report-compact" : "sudoku-report"}>
      <div className="sudoku-report-head">
        <div>
          <strong>Performance report</strong>
          <div className="muted">
            {report.difficulty} · {report.student_name}
          </div>
        </div>
        <span className={`status-pill ${report.status}`}>{statusLabel(report.status)}</span>
      </div>

      <dl className="sudoku-report-grid">
        <div>
          <dt>Total completion time</dt>
          <dd>{formatSeconds(report.completion_time_seconds)}</dd>
        </div>
        <div>
          <dt>Correct entries</dt>
          <dd>{report.correct_entries}</dd>
        </div>
        <div>
          <dt>Incorrect entries</dt>
          <dd>{report.incorrect_entries}</dd>
        </div>
        <div>
          <dt>Number of mistakes</dt>
          <dd>{report.mistakes_count}</dd>
        </div>
        <div>
          <dt>Final score</dt>
          <dd>{formatScore(report.final_score)}</dd>
        </div>
        <div>
          <dt>Game completion status</dt>
          <dd>{statusLabel(report.status)}</dd>
        </div>
      </dl>

      {report.completed_at ? (
        <p className="muted sudoku-report-footer">
          Recorded {new Date(report.completed_at).toLocaleString()}
        </p>
      ) : null}
    </div>
  );
}
