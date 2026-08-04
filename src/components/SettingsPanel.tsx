"use client";

import { useEffect, useRef, useState } from "react";
import { ANSWER_LEVELS } from "@/lib/types";
import { Settings } from "@/lib/settings";

interface SettingsPanelProps {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
  showSourcesToggle?: boolean;
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer py-2">
      <span>
        <span className="block text-parchment">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors duration-200"
        style={{ backgroundColor: checked ? "#c9a24b" : "#33333d" }}
      >
        {/* The knob slides on transform, not `left`: animating `left` is a
            layout-driven animation and visibly stutters. */}
        <span
          className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-ink-950 transition-transform duration-200 ease-out"
          style={{ transform: `translateX(${checked ? 20 : 0}px)` }}
        />
      </button>
    </label>
  );
}

export default function SettingsPanel({
  settings,
  onChange,
  onClose,
  showSourcesToggle,
}: SettingsPanelProps) {
  // Same double-rAF entrance as the other overlays: paint once closed so the
  // transition to open can actually animate instead of snapping.
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

  // Escape closes, matching every other dismissable surface in the app.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity duration-200"
      style={{ opacity: shown ? 1 : 0 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-ink-700 bg-ink-900 p-6 shadow-2xl transition-transform duration-200 ease-out"
        style={{ transform: shown ? "scale(1)" : "scale(0.96)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl text-parchment">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            title="Close (Esc)"
            className="-m-2 rounded-full p-2 text-muted transition duration-150 hover:text-parchment active:scale-90"
          >
            ✕
          </button>
        </div>

        <div className="mb-5">
          <p className="mb-2 text-sm text-muted">Answer level</p>
          <div className="grid grid-cols-2 gap-2">
            {ANSWER_LEVELS.map((level) => {
              const active = settings.answerLevel === level.id;
              return (
                <button
                  key={level.id}
                  onClick={() => onChange({ answerLevel: level.id })}
                  title={level.hint}
                  className="rounded-lg border px-3 py-2 text-left text-sm transition duration-150 active:scale-95"
                  style={{
                    borderColor: active ? "#c9a24b" : "#33333d",
                    background: active ? "#c9a24b22" : "transparent",
                    color: active ? "#e8e2d4" : "#9a948a",
                  }}
                >
                  {level.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted">
            {ANSWER_LEVELS.find((l) => l.id === settings.answerLevel)?.hint}
          </p>
        </div>

        <div className="divide-y divide-ink-700 border-t border-ink-700">
          <Toggle
            label="Voice output"
            hint="Speak the philosopher's replies aloud."
            checked={settings.voiceEnabled}
            onChange={(v) => onChange({ voiceEnabled: v })}
          />
          {showSourcesToggle && (
            <Toggle
              label="Show sources"
              hint="Reveal a subtle grounding panel in text mode."
              checked={settings.showSources}
              onChange={(v) => onChange({ showSources: v })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
