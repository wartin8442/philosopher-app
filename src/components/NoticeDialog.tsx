"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The overlay shell shared by the footer's disclosures (privacy, how AI was
 * used). Both sit under live conversations, so both open in place instead of
 * navigating — see PrivacyNotice for why that matters.
 *
 * Dismissal follows SettingsPanel exactly: backdrop click, the ✕, or Escape.
 */

export function NoticeSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <h3 className="mb-1.5 font-serif text-[15px] text-parchment">{title}</h3>
      <div className="space-y-2 text-[13px] leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}

export default function NoticeDialog({
  id,
  title,
  closeLabel,
  onClose,
  children,
}: {
  /** Prefix for the heading id the dialog is labelled by. */
  id: string;
  title: string;
  /** Accessible name for the ✕, e.g. "Close privacy notice". */
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Same double-rAF entrance as the app's other overlays: paint once closed so
  // the transition to open animates instead of snapping.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // These documents are long enough to scroll. Without the lock, a flick past
  // the end of the panel scrolls the page behind it instead, and closing leaves
  // the reader somewhere they never chose to be.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Move focus into the dialog on open and hand it back on close, so a keyboard
  // or screen-reader user is not left tabbing the page underneath.
  const panelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  const titleId = `${id}-title`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 transition-opacity duration-200"
      style={{ opacity: shown ? 1 : 0 }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="flex max-h-[85dvh] w-full max-w-lg flex-col rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl outline-none transition-transform duration-200 ease-out"
        style={{ transform: shown ? "scale(1)" : "scale(0.96)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header stays put while the body scrolls, so the ✕ never scrolls
            away from a reader partway down a long document. */}
        <div className="flex shrink-0 items-center justify-between border-b border-ink-700 px-6 py-4">
          <h2 id={titleId} className="font-serif text-xl text-parchment">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label={closeLabel}
            title="Close (Esc)"
            className="-m-2 rounded-full p-2 text-muted transition duration-150 hover:text-parchment active:scale-90"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6 pt-1 text-left">
          {children}
        </div>
      </div>
    </div>
  );
}
