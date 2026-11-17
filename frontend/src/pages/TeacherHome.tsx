import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError } from "../api/client";
import { createMeeting, joinMeeting, listMeetings, startMeeting } from "../api/meetings";
import { listAllReports } from "../api/reports";
import type { Meeting, SudokuReport } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Shell } from "../components/Shell";
import { SudokuReportView } from "../components/SudokuReportView";

function formatWhen(value: string | null): string {
  if (!value) {
    return "Not started";
  }
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function TeacherHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [reports, setReports] = useState<SudokuReport[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<SudokuReport | null>(null);

  async function refreshMeetings() {
    const rows = await listMeetings();
    setMeetings(rows);
  }

  useEffect(() => {
    void Promise.all([listMeetings(), listAllReports()])
      .then(([meetingRows, reportRows]) => {
        setMeetings(meetingRows);
        setReports(reportRows);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Could not load dashboard"),
      )
      .finally(() => setLoading(false));
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await createMeeting(title.trim());
      setTitle("");
      await refreshMeetings();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create meeting");
    } finally {
      setCreating(false);
    }
  }

  async function enterMeeting(meeting: Meeting, shouldStart: boolean) {
    setBusyId(meeting.id);
    setError(null);
    try {
      if (shouldStart) {
        await startMeeting(meeting.id);
      }
      const join = await joinMeeting(meeting.id);
      navigate(`/meetings/${join.meeting.id}/room`, { state: join });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not enter meeting");
      await refreshMeetings().catch(() => undefined);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Shell>
      <main className="dashboard-layout stack">
        <section className="hero-strip">
          <div>
            <h1>Good to see you, {user?.username}</h1>
            <p>
              Create and run meetings for class. Sudoku is a separate practice activity — review
              student performance reports below.
            </p>
          </div>
          <div className="profile-chips">
            <span className="chip">Teacher</span>
            {user?.teacher?.qualification ? (
              <span className="chip">{user.teacher.qualification}</span>
            ) : null}
            {user?.teacher?.city ? <span className="chip">{user.teacher.city}</span> : null}
          </div>
        </section>

        <section className="panel-surface">
          <div className="section-head">
            <div>
              <h2>Create a meeting</h2>
              <p className="lede">It stays scheduled until you start it.</p>
            </div>
          </div>
          {error ? <div className="error-banner">{error}</div> : null}
          <form className="inline-create" onSubmit={onCreate}>
            <div className="field">
              <label htmlFor="meeting_title">Meeting title</label>
              <input
                id="meeting_title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                minLength={1}
                maxLength={255}
                placeholder="Period 3 Science"
              />
            </div>
            <button className="btn btn-blue" type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create meeting"}
            </button>
          </form>
        </section>

        <section className="panel-surface">
          <div className="section-head">
            <div>
              <h2>Your meetings</h2>
              <p className="lede">Start a scheduled room, or rejoin one that is already live.</p>
            </div>
            <span className="muted">{meetings.length} total</span>
          </div>
          {loading ? <p className="muted">Loading meetings…</p> : null}
          {!loading && meetings.length === 0 ? (
            <div className="empty-state">
              <strong>No meetings yet</strong>
              <span className="muted">Create your first room to invite the class.</span>
            </div>
          ) : null}
          <div className="meeting-list">
            {meetings.map((meeting) => {
              const isBusy = busyId === meeting.id;
              const canEnter = meeting.status === "scheduled" || meeting.status === "live";
              return (
                <article key={meeting.id} className="meeting-item">
                  <div>
                    <h3>{meeting.title}</h3>
                    <div className="meeting-meta">
                      <span className={`status-pill ${meeting.status}`}>{meeting.status}</span>
                      <span className="muted">{meeting.room_name}</span>
                      <span className="muted">ID {meeting.id}</span>
                      <span className="muted">
                        {formatWhen(meeting.started_at ?? meeting.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="meeting-meta">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => void navigator.clipboard.writeText(meeting.id)}
                    >
                      Copy ID
                    </button>
                    {canEnter ? (
                      <button
                        type="button"
                        className="btn btn-blue"
                        disabled={isBusy}
                        onClick={() =>
                          void enterMeeting(meeting, meeting.status === "scheduled")
                        }
                      >
                        {isBusy
                          ? meeting.status === "scheduled"
                            ? "Starting…"
                            : "Joining…"
                          : meeting.status === "scheduled"
                            ? "Start & join"
                            : "Join meeting"}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel-surface">
          <div className="section-head">
            <div>
              <h2>Student game reports</h2>
              <p className="lede">Timed Sudoku results from students (separate from meetings).</p>
            </div>
            <span className="muted">{reports.length} saved</span>
          </div>
          {!loading && reports.length === 0 ? (
            <div className="empty-state">
              <strong>No reports yet</strong>
              <span className="muted">Students have not finished a Sudoku game yet.</span>
            </div>
          ) : null}
          <div className="meeting-list">
            {reports.map((report) => (
              <article key={report.id} className="meeting-item">
                <div>
                  <h3>{report.student_name}</h3>
                  <div className="meeting-meta">
                    <span className={`status-pill ${report.status}`}>{report.status}</span>
                    <span className="muted">{report.difficulty}</span>
                    <span className="muted">Score {Number(report.final_score).toFixed(2)}</span>
                    <span className="muted">{formatWhen(report.completed_at)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setSelectedReport(report)}
                >
                  View report
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>

      {selectedReport ? (
        <div className="report-modal-backdrop" onClick={() => setSelectedReport(null)}>
          <div
            className="report-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Sudoku performance report"
            onClick={(event) => event.stopPropagation()}
          >
            <SudokuReportView report={selectedReport} />
            <button
              type="button"
              className="btn btn-charcoal"
              onClick={() => setSelectedReport(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
