import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import type { UserRole } from "../api/types";
import { useAuth } from "../auth/AuthContext";

export function RequireAuth({
  role,
  children,
}: {
  role?: UserRole;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-page">
        <main className="auth-layout">
          <section className="panel-surface">
            <p className="muted">Loading your workspace…</p>
          </section>
        </main>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} replace />;
  }

  return children;
}
