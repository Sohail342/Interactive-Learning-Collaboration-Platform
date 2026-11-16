import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { login } from "../api/auth";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { TopBar } from "../components/TopBar";

export function Login() {
  const { user, applySession } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const session = await login(email, password);
      applySession(session);
      navigate(session.user.role === "teacher" ? "/teacher" : "/student", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-page">
      <TopBar />
      <main className="auth-layout">
        <aside className="auth-aside">
          <div>
            <span className="feature-kicker">Welcome back</span>
            <h2>Pick up where your class left off</h2>
            <p>Sign in to host a live meeting or join the next session as a student.</p>
          </div>
          <ul className="auth-aside-points">
            <li>Secure JWT sign-in</li>
            <li>Role-aware workspaces</li>
            <li>LiveKit-ready meetings</li>
          </ul>
        </aside>

        <section className="panel-surface">
          <h1>Login</h1>
          <p className="lede">Use the email and password for your Learning Platform account.</p>
          {error ? <div className="error-banner">{error}</div> : null}
          <form className="form-grid" onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <button className="btn btn-charcoal btn-block" type="submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Login"}
            </button>
          </form>
          <p className="auth-footer">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
