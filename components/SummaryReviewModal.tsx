"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  draftSummary: string;
  suggestedTitle: string;
  plantingIds: string[];
  zoneIds: string[];
  onApprove: (summary: string, title: string) => void;
  onDiscard: () => void;
  onClose: () => void;
}

// Simple focus trap: cycles Tab through focusable elements, closes on Escape.
function useFocusTrap(ref: React.RefObject<HTMLElement | null>, onEscape: () => void) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const all = () => Array.from(el.querySelectorAll<HTMLElement>(selector));
    const first = all()[0];
    first?.focus();

    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") { onEscape(); return; }
      if (e.key !== "Tab") return;
      const els = all();
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === els[0]) {
        e.preventDefault(); last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); els[0]?.focus();
      }
    }

    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [ref, onEscape]);
}

export function SummaryReviewModal({
  draftSummary,
  suggestedTitle,
  onApprove,
  onDiscard,
  onClose,
}: Props) {
  const [summary, setSummary] = useState(draftSummary);
  const [title, setTitle] = useState(suggestedTitle);
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, onClose);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal summary-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Review conversation summary"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="section-heading" style={{ fontSize: "1.1rem", marginBottom: "0.2rem" }}>
          Review summary
        </h2>
        <p className="small-note" style={{ marginBottom: "1rem" }}>
          Edit before saving. Approved summaries feed into future chats about these plants and zones.
        </p>

        <div className="journal-form-row" style={{ marginBottom: "0.6rem" }}>
          <label htmlFor="sum-title">Title</label>
          <input
            id="sum-title"
            type="text"
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="journal-form-row" style={{ marginBottom: "1rem" }}>
          <label htmlFor="sum-body">Summary</label>
          <textarea
            id="sum-body"
            rows={8}
            value={summary}
            maxLength={4000}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="primary-button"
            style={{ width: "auto", margin: 0, padding: "0.55rem 1.4rem" }}
            onClick={() => onApprove(summary, title)}
            disabled={!summary.trim()}
          >
            Approve and save
          </button>
          <button
            type="button"
            className="ghost-button"
            style={{ color: "var(--error)", borderColor: "var(--error)" }}
            onClick={onDiscard}
          >
            Discard
          </button>
          <button type="button" className="ghost-button" onClick={onClose}>
            Keep editing
          </button>
        </div>
      </div>
    </div>
  );
}
