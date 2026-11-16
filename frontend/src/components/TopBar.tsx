import { Link } from "react-router-dom";

import { BrandMark } from "./BrandMark";

export function TopBar() {
  return (
    <header className="topbar">
      <BrandMark />
      <nav className="topbar-nav" aria-label="Product">
        <a href="#meetings">Meetings</a>
        <a href="#collaborate">Collaborate</a>
        <a href="#learn">Learn</a>
      </nav>
      <div className="topbar-actions">
        <Link className="btn btn-green" to="/register">
          Sign up Free
        </Link>
        <Link className="btn btn-charcoal" to="/login">
          Login
        </Link>
      </div>
    </header>
  );
}
