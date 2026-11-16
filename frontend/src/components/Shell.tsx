import { useEffect, useState, type ReactNode } from "react";

import { getHealth } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { BrandMark } from "./BrandMark";

export function Shell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [health, setHealth] = useState<"loading" | "ok" | "bad">("loading");
  const home = user?.role === "teacher" ? "/teacher" : "/student";
  const initial = (user?.username?.[0] ?? "U").toUpperCase();

  useEffect(() => {
    getHealth()
      .then(() => setHealth("ok"))
      .catch(() => setHealth("bad"));
  }, []);

  return (
    <div className="app-page">
      <header className="topbar">
        <BrandMark to={home} />
        <nav className="topbar-nav" aria-label="Workspace">
          <span>{user?.role === "teacher" ? "Teacher workspace" : "Student workspace"}</span>
        </nav>
        <div className="topbar-actions">
          <div className="shell-meta">
            <span className={`health-dot ${health === "ok" ? "ok" : health === "bad" ? "bad" : ""}`} />
            <span className="user-pill">
              <span className="user-avatar" aria-hidden="true">
                {initial}
              </span>
              {user?.username}
            </span>
          </div>
          <button type="button" className="btn btn-charcoal" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
