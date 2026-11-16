import { Link } from "react-router-dom";

export function BrandMark({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="brand">
      <span className="brand-mark" aria-hidden="true" />
      Learning Platform
    </Link>
  );
}
