import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError } from "../api/client";
import { joinMeeting, listMeetings } from "../api/meetings";
import { listMyReports } from "../api/reports";
import type { Meeting, SudokuReport } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Shell } from "../components/Shell";
import { SudokuReportView } from "../components/SudokuReportView";

function formatWhen(value: string | null): string {
  if (!value) {
    return "Waiting to start";
  }
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function StudentHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [reports, setReports] = useState<SudokuReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SudokuReport | null>(null);
  const [meetingIdInput, setMeetingIdInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([listMeetings(), listMyReports()])
      .then(([meetingRows, reportRows]) => {
        setMeetings(meetingRows);
        setReports(reportRows);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Could not load dashboard"),
      )
      .finally(() => setLoading(false));
  }, []);

  async function joinById(meetingId: string) {
    const id = meetingId.trim();
    if (!id) {
      setError("Enter a meeting ID");
      return;
    }
    setJoiningId(id);
    setError(null);
    try {
      const join = await joinMeeting(id);
      navigate(`/meetings/${join.meeting.id}/room`, { state: join });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not join meeting");
    } finally {
      setJoiningId(null);
    }
  }

  async function onJoinById(event: FormEvent) {
    event.preventDefault();
    await joinById(meetingIdInput);
  }

  return (
    <Shell>
      <main className="dashboard-layout stack">
        <section className="hero-strip">
          <div>
            <h1>Ready for class, {user?.username}?</h1>
            <p>
              Join meetings when class is live, or play timed Sudoku on its own page and review your
              reports here.
            </p>
          </div>
          <div className="profile-chips">
            <span className="chip">Student</span>
            {user?.student?.class_name ? (
              <span className="chip">Class {user.student.class_name}</span>
            ) : null}
            {user?.student?.school ? <span className="chip">{user.student.school}</span> : null}
            {user?.student?.city ? <span className="chip">{user.student.city}</span> : null}
          </div>
        </section>

        <section className="panel-surface">
          <div className="section-head">
            <div>
              <h2>Timed Sudoku</h2>
              <p className="lede">
                Standalone practice with a countdown. No meeting required — your score is saved as a
                report.
              </p>
            </div>
            <button type="button" className="btn btn-blue" onClick={() => navigate("/sudoku")}>
              Play Sudoku
            </button>
          </div>
        </section>

        <section className="panel-surface">
          <div className="section-head">
            <div>
              <h2>Join with meeting ID</h2>
              <p className="lede">Paste the ID your teacher shared if it is not in the list.</p>
            </div>
          </div>
          {error ? <div className="error-banner">{error}</div> : null}
          <form className="inline-create" onSubmit={(event) => void onJoinById(event)}>
            <div className="field">
              <label htmlFor="meeting_id">Meeting ID</label>
              <input
                id="meeting_id"
                value={meetingIdInput}
                onChange={(event) => setMeetingIdInput(event.target.value)}
                placeholder="e.g. 11111111-1111-4111-8111-111111111111"
                required
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <button
              className="btn btn-green"
              type="submit"
              disabled={joiningId !== null && joiningId === meetingIdInput.trim()}
            >
              {joiningId !== null && joiningId === meetingIdInput.trim()
                ? "Joining…"
                : "Join meeting"}
            </button>
          </form>
        </section>

        <section className="panel-surface">
          <div className="section-head">
            <div>
              <h2>Open meetings</h2>
              <p className="lede">You can join after the teacher starts the meeting.</p>
            </div>
            <span className="muted">{meetings.length} available</span>
          </div>
          {loading ? <p className="muted">Loading meetings…</p> : null}
          {!loading && meetings.length === 0 ? (
            <div className="empty-state">
              <strong>No open meetings</strong>
              <span className="muted">Enter a meeting ID above, or wait for your teacher.</span>
            </div>
          ) : null}
          <div className="meeting-list">
            {meetings.map((meeting) => {
              const canJoin = meeting.status === "live";
              return (
                <article key={meeting.id} className="meeting-item">
                  <div>
                    <h3>{meeting.title}</h3>
                    <div className="meeting-meta">
                      <span className={`status-pill ${meeting.status}`}>{meeting.status}</span>
                      <span className="muted">{meeting.room_name}</span>
                      <span className="muted">ID {meeting.id}</span>
                      <span className="muted">{formatWhen(meeting.started_at)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-green"
                    disabled={!canJoin || joiningId === meeting.id}
                    onClick={() => void joinById(meeting.id)}
                  >
                    {joiningId === meeting.id
                      ? "Joining…"
                      : canJoin
                        ? "Join meeting"
                        : "Waiting for teacher"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel-surface">
          <div className="section-head">
            <div>
              <h2>My game reports</h2>
              <p className="lede">Performance summaries from timed Sudoku attempts.</p>
            </div>
            <span className="muted">{reports.length} saved</span>
          </div>
          {!loading && reports.length === 0 ? (
            <div className="empty-state">
              <strong>No reports yet</strong>
              <span className="muted">
                Open Play Sudoku to generate your first report.
              </span>
            </div>
          ) : null}
          <div className="meeting-list">
            {reports.map((report) => (
              <article key={report.id} className="meeting-item">
                <div>
                  <h3>Sudoku · {report.difficulty}</h3>
                  <div className="meeting-meta">
                    <span className={`status-pill ${report.status}`}>{report.status}</span>
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
