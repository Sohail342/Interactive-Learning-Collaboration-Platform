import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { ApiError } from "../api/client";
import { submitReport } from "../api/reports";
import type { SudokuReport } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { SudokuReportView } from "../components/SudokuReportView";
import {
  clearSelected,
  createEngine,
  formatCountdown,
  markAbandoned,
  markTimedOut,
  placeDigit,
  selectCell,
  type SudokuEngine,
} from "../sudoku/engine";
import {
  DEFAULT_DIFFICULTY,
  DEFAULT_TIME_LIMIT_SECONDS,
} from "../sudoku/puzzles";

export function SudokuGame() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [engine, setEngine] = useState<SudokuEngine>(() =>
    createEngine(DEFAULT_DIFFICULTY, DEFAULT_TIME_LIMIT_SECONDS),
  );
  const [elapsed, setElapsed] = useState(0);
  const [savedReport, setSavedReport] = useState<SudokuReport | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startedAtRef = useRef(Date.now());
  const submittedRef = useRef(false);

  const remaining = Math.max(0, engine.timeLimitSeconds - elapsed);

  const persistReport = useCallback(async (next: SudokuEngine) => {
    if (!next.stats.status || submittedRef.current) {
      return;
    }
    submittedRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const report = await submitReport({
        difficulty: next.difficulty,
        time_limit_seconds: next.timeLimitSeconds,
        completion_time_seconds: next.stats.completionTimeSeconds,
        correct_entries: next.stats.correctEntries,
        incorrect_entries: next.stats.incorrectEntries,
        mistakes_count: next.stats.mistakesCount,
        final_score: next.stats.finalScore,
        status: next.stats.status,
      });
      setSavedReport(report);
    } catch (err) {
      submittedRef.current = false;
      setSubmitError(
        err instanceof ApiError ? err.message : "Could not save performance report",
      );
    } finally {
      setSubmitting(false);
    }
  }, []);

  useEffect(() => {
    if (engine.finished) {
      return;
    }
    const timer = window.setInterval(() => {
      const nextElapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsed(nextElapsed);
      if (nextElapsed >= engine.timeLimitSeconds) {
        setEngine((current) => {
          if (current.finished) {
            return current;
          }
          const timedOut = markTimedOut(current, current.timeLimitSeconds);
          void persistReport(timedOut);
          return timedOut;
        });
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [engine.finished, engine.timeLimitSeconds, persistReport]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (engine.finished) {
        return;
      }
      if (event.key >= "1" && event.key <= "9") {
        setEngine((current) => {
          const next = placeDigit(current, Number(event.key), elapsed);
          if (next.finished && !current.finished) {
            void persistReport(next);
          }
          return next;
        });
      } else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
        setEngine((current) => clearSelected(current));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [elapsed, engine.finished, persistReport]);

  if (authLoading) {
    return (
      <div className="sudoku-page">
        <div className="room-loading">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "student") {
    return <Navigate to="/teacher" replace />;
  }

  function onDigit(digit: number) {
    setEngine((current) => {
      const next = placeDigit(current, digit, elapsed);
      if (next.finished && !current.finished) {
        void persistReport(next);
      }
      return next;
    });
  }

  function onQuit() {
    if (engine.finished) {
      navigate("/student");
      return;
    }
    const abandoned = markAbandoned(engine, elapsed);
    setEngine(abandoned);
    void persistReport(abandoned).finally(() => {
      navigate("/student");
    });
  }

  return (
    <div className="sudoku-page">
      <header className="sudoku-header">
        <div>
          <strong>Timed Sudoku</strong>
          <div className="muted">{engine.difficulty} · standalone practice</div>
        </div>
        <div className="sudoku-header-actions">
          <div
            className={
              remaining <= 30 && !engine.finished
                ? "sudoku-timer sudoku-timer-urgent"
                : "sudoku-timer"
            }
          >
            {formatCountdown(remaining)}
          </div>
          <button type="button" className="btn btn-charcoal" onClick={onQuit}>
            {engine.finished ? "Back to home" : "Quit game"}
          </button>
        </div>
      </header>

      <div className="sudoku-layout">
        <section className="sudoku-board-panel">
          <div className="sudoku-stats">
            <span>Correct {engine.stats.correctEntries}</span>
            <span>Incorrect {engine.stats.incorrectEntries}</span>
            <span>Mistakes {engine.stats.mistakesCount}</span>
          </div>

          <div className="sudoku-grid" role="grid" aria-label="Sudoku board">
            {engine.cells.map((cell, index) => {
              const row = Math.floor(index / 9);
              const col = index % 9;
              const expected = Number(engine.puzzle.solution[index]);
              const wrong = cell.value !== null && !cell.given && cell.value !== expected;
              const selected = engine.selectedIndex === index;
              const classes = [
                "sudoku-cell",
                cell.given ? "is-given" : "",
                selected ? "is-selected" : "",
                wrong ? "is-wrong" : "",
                col % 3 === 0 ? "box-left" : "",
                row % 3 === 0 ? "box-top" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  key={index}
                  type="button"
                  className={classes}
                  disabled={engine.finished || cell.given}
                  onClick={() => setEngine((current) => selectCell(current, index))}
                >
                  {cell.value ?? ""}
                </button>
              );
            })}
          </div>

          <div className="sudoku-pad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                type="button"
                className="btn btn-ghost"
                disabled={engine.finished}
                onClick={() => onDigit(digit)}
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-ghost"
              disabled={engine.finished}
              onClick={() => setEngine((current) => clearSelected(current))}
            >
              Clear
            </button>
          </div>
        </section>

        <aside className="sudoku-side">
          {engine.finished ? (
            <>
              <SudokuReportView
                report={
                  savedReport ?? {
                    id: "local",
                    student_id: user.id,
                    student_name: user.username,
                    meeting_id: null,
                    meeting_title: null,
                    difficulty: engine.difficulty,
                    time_limit_seconds: engine.timeLimitSeconds,
                    completion_time_seconds: engine.stats.completionTimeSeconds,
                    correct_entries: engine.stats.correctEntries,
                    incorrect_entries: engine.stats.incorrectEntries,
                    mistakes_count: engine.stats.mistakesCount,
                    final_score: engine.stats.finalScore,
                    status: engine.stats.status ?? "abandoned",
                    completed_at: new Date().toISOString(),
                  }
                }
              />
              {submitting ? <p className="muted">Saving report…</p> : null}
              {submitError ? <div className="error-banner">{submitError}</div> : null}
              {savedReport ? (
                <p className="muted">Report saved. You and your teachers can view it from home.</p>
              ) : null}
              <button type="button" className="btn btn-blue" onClick={() => navigate("/student")}>
                Back to student home
              </button>
            </>
          ) : (
            <div className="sudoku-help panel-surface">
              <h2>How to play</h2>
              <p className="lede">
                Fill every empty cell so each row, column, and 3×3 box contains 1–9. The countdown
                ends the game automatically.
              </p>
              <ul>
                <li>Select a cell, then tap a number or use keys 1–9.</li>
                <li>Wrong entries count as mistakes and lower your score.</li>
                <li>Finish before the timer for a completion bonus.</li>
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
