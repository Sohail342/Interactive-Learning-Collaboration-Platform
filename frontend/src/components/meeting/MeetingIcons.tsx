import type { ReactNode } from "react";

type IconProps = {
  size?: number;
  className?: string;
};

function Svg({
  size = 22,
  className,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MicOffIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M9 9.2V11a3 3 0 0 0 4.7 2.5M15 10.2V6.5a3 3 0 0 0-5.7-1.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.5 11.5a5.5 5.5 0 0 0 9.2 4M12 17v3.5M4.5 4.5l15 15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CamIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect
        x="3.5"
        y="7"
        width="12"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M15.5 10.5 20 8v8l-4.5-2.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CamOffIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M3.5 9.2V15a2 2 0 0 0 2 2h7.2M9 7h4.5a2 2 0 0 1 2 2v1.5L20 8v7.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 4.5l15 15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect
        x="3.5"
        y="4.5"
        width="17"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 20.5h8M12 16.5v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function WhiteboardIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect
        x="3.5"
        y="4.5"
        width="17"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7 15.5 10.2 9l2.3 4.2L15 10.5l2 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M5 6.8A2.8 2.8 0 0 1 7.8 4h8.4A2.8 2.8 0 0 1 19 6.8v6.4A2.8 2.8 0 0 1 16.2 16H10l-3.8 3.2V16H7.8A2.8 2.8 0 0 1 5 13.2V6.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 9h7M8.5 12h4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function LeaveIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M10 5H7.5A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19H10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M13 12h7M16.5 8.5 20 12l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function FilmstripCollapseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect
        x="4"
        y="5"
        width="16"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 9.5h16M9 5v14"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M14.5 12.5 17 15l2.5-2.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function FilmstripHideIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M4 8.5h10.5A1.5 1.5 0 0 1 16 10v6.5A1.5 1.5 0 0 1 14.5 18H4V8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8 5.5h9.5A1.5 1.5 0 0 1 19 7v7M5 5l14 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function FilmstripShowIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect
        x="3.5"
        y="6"
        width="17"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8.5 6v12M3.5 10h17M3.5 14h17"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </Svg>
  );
}

export function EnterFullscreenIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M9 4H4.5V8.5M15 4h4.5V8.5M9 20H4.5V15.5M15 20h4.5V15.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ExitFullscreenIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M4.5 9H9V4.5M15 4.5V9h4.5M4.5 15H9v4.5M15 19.5V15h4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ExpandPanelIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M8 16 4.5 12.5 8 9M16 9l3.5 3.5L16 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 12.5h15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}
