import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tooltip?: string;
  active?: boolean;
  danger?: boolean;
  badge?: number | string | null;
  showLabel?: boolean;
  children: ReactNode;
};

export function IconButton({
  label,
  tooltip,
  active = false,
  danger = false,
  badge = null,
  showLabel = true,
  className = "",
  children,
  type = "button",
  ...rest
}: IconButtonProps) {
  const classes = [
    "mt-icon-btn",
    active ? "is-active" : "",
    danger ? "is-danger" : "",
    showLabel ? "" : "is-icon-only",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      aria-label={label}
      title={tooltip ?? label}
      data-tooltip={tooltip ?? label}
      {...rest}
    >
      <span className="mt-icon-btn-glyph" aria-hidden>
        {children}
        {badge != null && badge !== 0 && badge !== "0" ? (
          <span className="mt-icon-btn-badge">{badge}</span>
        ) : null}
      </span>
      {showLabel ? <span className="mt-icon-btn-label">{label}</span> : null}
    </button>
  );
}
