"use client";

import { useEffect, useState, type ReactNode } from "react";

interface Props {
  title: string;
  /** Called with `true` when the chart is drawn in the large view */
  render: (expanded: boolean) => ReactNode;
}

export default function ExpandableChart({ title, render }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div className="card">
        <div className="card-h">
          <h3>{title}</h3>
          <button
            className="icon-btn"
            onClick={() => setOpen(true)}
            aria-label={`Expand ${title}`}
            title="Expand">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M9.5 1.5h5v5M6.5 14.5h-5v-5M14.5 1.5 9 7M1.5 14.5 7 9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="cwrap">{render(false)}</div>
      </div>

      {open && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-h">
              <h3>{title}</h3>
              <button
                className="icon-btn"
                onClick={() => setOpen(false)}
                aria-label="Close"
                title="Close (Esc)">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  aria-hidden="true">
                  <path
                    d="M3 3l10 10M13 3 3 13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="modal-body">{render(true)}</div>
          </div>
        </div>
      )}
    </>
  );
}
