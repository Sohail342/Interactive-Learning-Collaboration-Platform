import { useMediaDeviceSelect } from "@livekit/components-react";
import { useEffect, useId, useRef, useState } from "react";

type DeviceMenuProps = {
  kind: "audioinput" | "videoinput";
  label: string;
};

export function DeviceMenu({ kind, label }: DeviceMenuProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({
    kind,
    requestPermissions: true,
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="mt-device-menu" ref={rootRef}>
      <button
        type="button"
        className={`mt-device-caret ${open ? "is-open" : ""}`}
        aria-label={`Select ${label} device`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        title={`Select ${label}`}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden>
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          id={menuId}
          className="mt-device-popover"
          role="listbox"
          aria-label={`${label} devices`}
        >
          {devices.length === 0 ? (
            <li className="mt-device-empty">No devices found</li>
          ) : (
            devices.map((device) => {
              const selected = device.deviceId === activeDeviceId;
              return (
                <li key={device.deviceId} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    className={`mt-device-option ${selected ? "is-selected" : ""}`}
                    onClick={() => {
                      void setActiveMediaDevice(device.deviceId);
                      setOpen(false);
                    }}
                  >
                    <span>{device.label || `${label} device`}</span>
                    {selected ? <span className="mt-device-check">✓</span> : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
