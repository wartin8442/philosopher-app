"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Portrait from "@/components/Portrait";
import MicButton from "@/components/MicButton";
import SettingsPanel from "@/components/SettingsPanel";
import { PHILOSOPHERS, getPhilosopher } from "@/lib/philosophers";
import { useSettings } from "@/lib/settings";
import { SpeechStream, useSpeech } from "@/lib/useSpeech";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { useStickToBottom } from "@/lib/useStickToBottom";
import { DuelPhase, DuelTurn, DUEL_PHASES } from "@/lib/types";

interface Step {
  speaker: string; // philosopher id, or "moderator" for recap
  phase: DuelPhase;
}

/** Build the fixed debate structure for the chosen pair. */
function buildSteps(a: string, b: string): Step[] {
  return [
    { speaker: a, phase: "opening" },
    { speaker: b, phase: "opening" },
    { speaker: a, phase: "critique" },
    { speaker: b, phase: "critique" },
    { speaker: a, phase: "rebuttal" },
    { speaker: b, phase: "rebuttal" },
    { speaker: a, phase: "cross-exam" },
    { speaker: b, phase: "cross-exam" },
    { speaker: a, phase: "cross-exam" },
    { speaker: b, phase: "cross-exam" },
    { speaker: "moderator", phase: "recap" },
  ];
}

// Latency numbers go to the browser console in dev builds only. Next.js
// inlines NODE_ENV at build time, so in production this whole flag is `false`
// and the logging code is dead.
const DEV = process.env.NODE_ENV === "development";

const PHASE_LABEL: Record<string, string> = Object.fromEntries(
  DUEL_PHASES.map((p) => [p.id, p.label]),
);

export default function DuelPage() {
  const { settings, update, loaded } = useSettings();
  const { stop: stopSpeaking, speaking, startSpeechStream } = useSpeech();

  const [aId, setAId] = useState<string>("aquinas");
  const [bId, setBId] = useState<string>("nietzsche");
  const [topic, setTopic] = useState("");
  const [started, setStarted] = useState(false);

  const [transcript, setTranscript] = useState<DuelTurn[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  // True once the current turn's text has started arriving (hides "thinking…").
  const [streamingTurn, setStreamingTurn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const [interject, setInterject] = useState("");
  const pendingInterjection = useRef<string | null>(null);

  // Follow the growing transcript only while the user is already at the
  // bottom; scrolling up to reread detaches the auto-scroll.
  const {
    scrollRef,
    onScroll: onTranscriptScroll,
    pin: followTranscript,
  } = useStickToBottom<HTMLDivElement>([transcript, busy]);

  const a = getPhilosopher(aId)!;
  const b = getPhilosopher(bId)!;
  const steps = useMemo(() => buildSteps(aId, bId), [aId, bId]);
  const done = stepIndex >= steps.length;
  const nextStep = done ? null : steps[stepIndex];

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const runStep = useCallback(async () => {
    if (busy || done) return;
    const step = steps[stepIndex];
    setError(null);
    setBusy(true);
    // Pressing Continue signals the user wants to see the new turn.
    followTranscript();

    const speakerId = step.speaker === "moderator" ? aId : step.speaker;
    const opponentId = speakerId === aId ? bId : aId;
    const interjection = pendingInterjection.current;
    pendingInterjection.current = null;

    // Started before the fetch (inside the user-gesture call stack) so the
    // browser lets the AudioContext play. Sentences are spoken as they
    // complete instead of waiting for the full turn.
    let voice: SpeechStream | null = null;
    let turnAdded = false;
    const tStart = performance.now();
    try {
      if (settingsRef.current.voiceEnabled) {
        voice = startSpeechStream(speakerId, {
          onFirstAudio: () => {
            if (DEV)
              console.log(
                `[latency] duel ${step.phase}: first audio ${Math.round(performance.now() - tStart)}ms`,
              );
          },
        });
      }
      const res = await fetch("/api/duel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speakerId,
          opponentId,
          topic,
          phase: step.phase,
          transcript,
          answerLevel: settingsRef.current.answerLevel,
          interjection: interjection ?? undefined,
        }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }

      // The turn arrives as NDJSON events. Grow the last transcript bubble as
      // text fragments land; feed the same fragments to the voice stream.
      let fullReply = "";
      const handleEvent = (event: {
        type: string;
        text?: string;
        error?: string;
      }) => {
        if (event.type === "text") {
          voice?.push(event.text ?? "");
          if (!turnAdded) {
            turnAdded = true;
            setStreamingTurn(true);
            if (DEV)
              console.log(
                `[latency] duel ${step.phase}: first token ${Math.round(performance.now() - tStart)}ms`,
              );
            setTranscript((prev) => [
              ...prev,
              { speaker: step.speaker, phase: step.phase, content: "" },
            ]);
          }
          fullReply += event.text ?? "";
          setTranscript((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              ...next[next.length - 1],
              content: fullReply,
            };
            return next;
          });
        } else if (event.type === "error") {
          throw new Error(event.error || "The reply was interrupted.");
        }
      };

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.trim()) handleEvent(JSON.parse(line));
        }
      }

      setStepIndex((i) => i + 1);
      if (voice) {
        // Most audio has already played by now; this waits out the tail.
        await voice.end();
      }
    } catch (err) {
      voice?.cancel();
      // The transcript doubles as the API's debate context and this step will
      // be retried, so a half-finished turn must not stay in it.
      if (turnAdded) setTranscript((prev) => prev.slice(0, -1));
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setStreamingTurn(false);
      setBusy(false);
    }
  }, [busy, done, steps, stepIndex, aId, bId, topic, transcript, startSpeechStream, followTranscript]);

  const submitInterjection = useCallback(() => {
    const text = interject.trim();
    if (!text) return;
    pendingInterjection.current = text;
    setTranscript((prev) => [
      ...prev,
      { speaker: "user", phase: nextStep?.phase ?? "cross-exam", content: text },
    ]);
    setInterject("");
    stopSpeaking();
    followTranscript();
  }, [interject, nextStep, stopSpeaking, followTranscript]);

  const { listening, interim, supported, start, stop } = useSpeechRecognition(
    (t) => setInterject((prev) => (prev ? `${prev} ${t}` : t)),
  );

  function begin() {
    if (aId === bId) {
      setError("Choose two different philosophers.");
      return;
    }
    if (!topic.trim()) {
      setError("Enter a debate topic.");
      return;
    }
    setError(null);
    setTranscript([]);
    setStepIndex(0);
    setStarted(true);
  }

  function reset() {
    stopSpeaking();
    setStarted(false);
    setTranscript([]);
    setStepIndex(0);
    pendingInterjection.current = null;
  }

  // ---- Setup screen ---------------------------------------------------------
  if (!started) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <Link href="/" className="text-muted hover:text-parchment">
            ←
          </Link>
          <h1 className="font-serif text-3xl text-parchment">Stage a Duel</h1>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <PickerColumn
            title="First philosopher"
            selected={aId}
            onSelect={setAId}
            disabled={bId}
          />
          <PickerColumn
            title="Second philosopher"
            selected={bId}
            onSelect={setBId}
            disabled={aId}
          />
        </div>

        <div className="mt-8">
          <label className="mb-2 block text-sm text-muted">Debate topic</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Does morality require God? / Is life absurd?"
            className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-parchment placeholder:text-muted focus:border-ink-600 focus:outline-none"
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        <button
          onClick={begin}
          className="mt-8 w-full rounded-full border border-ink-600 bg-ink-800 py-4 text-lg text-parchment transition hover:border-parchment"
        >
          Begin the debate →
        </button>
      </main>
    );
  }

  // ---- Debate screen --------------------------------------------------------
  const currentPhaseLabel = done
    ? "Complete"
    : DUEL_PHASES.find((p) => p.id === nextStep?.phase)?.label;

  return (
    <main className="flex h-dvh flex-col">
      {/* Full-bleed header: the border spans the page; content stays centered. */}
      <header className="border-b border-ink-800 px-4 pb-3 pt-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <button onClick={reset} className="text-muted hover:text-parchment">
            ← New duel
          </button>
          <span className="text-xs uppercase tracking-widest text-muted">
            {done ? "Debate complete" : `Up next: ${currentPhaseLabel}`}
          </span>
          <button
            onClick={() => setShowSettings(true)}
            className="text-muted hover:text-parchment"
            aria-label="Settings"
          >
            ⚙
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-6">
          <Contender p={a} active={!done && nextStep?.speaker === aId && busy} />
          <span className="font-serif text-2xl text-muted">vs</span>
          <Contender p={b} active={!done && nextStep?.speaker === bId && busy} />
        </div>
        <p className="mt-2 text-center text-sm text-parchment/80">“{topic}”</p>
        </div>
      </header>

      <div
        ref={scrollRef}
        onScroll={onTranscriptScroll}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-5 sm:px-6">
        {transcript.length === 0 && (
          <p className="mt-8 text-center text-muted">
            Press <span className="text-parchment">Continue</span> to hear the
            opening statements.
          </p>
        )}
        {transcript.map((t, i) => (
          <TurnBubble key={i} turn={t} aId={aId} />
        ))}
        {busy && !streamingTurn && (
          <p className="text-center text-sm text-muted">
            {nextStep?.speaker === "moderator"
              ? "The moderator is summing up…"
              : `${getPhilosopher(nextStep?.speaker ?? "")?.name ?? ""} is thinking…`}
          </p>
        )}
        </div>
      </div>

      {error && (
        <div className="px-4 sm:px-6">
          <p className="mx-auto mb-2 max-w-3xl rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        </div>
      )}

      {/* Interjection */}
      {!done && (
        <div className="border-t border-ink-800 px-4 pb-4 pt-3 sm:px-6">
          <div className="mx-auto max-w-3xl">
          {interim && (
            <p className="mb-1 text-center text-xs italic text-muted">{interim}…</p>
          )}
          <div className="flex items-center gap-2">
            {supported && (
              <MicButton
                listening={listening}
                accent="#c9a24b"
                onStart={() => {
                  stopSpeaking();
                  start();
                }}
                onStop={stop}
              />
            )}
            <input
              value={interject}
              onChange={(e) => setInterject(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitInterjection()}
              placeholder="Interject — challenge, question, or redirect…"
              className="flex-1 rounded-full border border-ink-700 bg-ink-900 px-4 py-2.5 text-sm text-parchment placeholder:text-muted focus:border-ink-600 focus:outline-none"
            />
            <button
              onClick={submitInterjection}
              disabled={!interject.trim()}
              className="rounded-full border border-ink-700 px-3 py-2.5 text-sm text-muted hover:text-parchment disabled:opacity-40"
              title="Queue interjection for the next speaker"
            >
              Interject
            </button>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={runStep}
              disabled={busy}
              className="flex-1 rounded-full border border-ink-600 bg-ink-800 py-3 text-parchment transition hover:border-parchment disabled:opacity-40"
            >
              {stepIndex === 0 ? "Begin ▶" : busy ? "…" : "Continue ▶"}
            </button>
            {speaking && (
              <button
                onClick={stopSpeaking}
                className="rounded-full border border-ink-700 px-4 py-3 text-sm text-muted hover:text-parchment"
              >
                ⏹ Stop
              </button>
            )}
          </div>
          {pendingInterjection.current && (
            <p className="mt-2 text-center text-xs text-muted">
              Your interjection will be addressed by the next speaker.
            </p>
          )}
          </div>
        </div>
      )}

      {done && (
        <div className="border-t border-ink-800 px-4 pb-4 pt-4 text-center sm:px-6">
          <button
            onClick={reset}
            className="rounded-full border border-ink-600 bg-ink-800 px-6 py-3 text-parchment hover:border-parchment"
          >
            Stage another duel
          </button>
        </div>
      )}

      {showSettings && loaded && (
        <SettingsPanel
          settings={settings}
          onChange={update}
          onClose={() => setShowSettings(false)}
        />
      )}
    </main>
  );
}

function PickerColumn({
  title,
  selected,
  onSelect,
  disabled,
}: {
  title: string;
  selected: string;
  onSelect: (id: string) => void;
  disabled: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm text-muted">{title}</p>
      <div className="space-y-2">
        {PHILOSOPHERS.map((p) => {
          const isSelected = selected === p.id;
          const isDisabled = disabled === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              disabled={isDisabled}
              className="flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition disabled:opacity-30"
              style={{
                borderColor: isSelected ? p.accent : "#26262e",
                background: isSelected ? `${p.accent}18` : "transparent",
              }}
            >
              <Portrait initials={p.initials} accent={p.accent} imageSrc={p.image} crop={p.imageCrop} size={40} />
              <span className="text-parchment">{p.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Contender({ p, active }: { p: ReturnType<typeof getPhilosopher>; active: boolean }) {
  if (!p) return null;
  return (
    <div className="flex flex-col items-center">
      <Portrait initials={p.initials} accent={p.accent} imageSrc={p.image} crop={p.imageCrop} size={56} active={active} />
      <span className="mt-1 text-sm text-parchment">{p.name}</span>
    </div>
  );
}

function TurnBubble({ turn, aId }: { turn: DuelTurn; aId: string }) {
  if (turn.speaker === "user") {
    return (
      <div className="flex justify-center">
        <div className="max-w-[85%] rounded-xl border border-ink-700 bg-ink-800/60 px-4 py-2 text-center text-sm text-parchment/90">
          <span className="mr-2 text-xs uppercase tracking-wider text-muted">You</span>
          {turn.content}
        </div>
      </div>
    );
  }
  if (turn.speaker === "moderator") {
    return (
      <div className="mx-auto max-w-[90%] rounded-xl border border-ink-700 bg-ink-900/60 px-4 py-3 text-center">
        <p className="mb-1 text-xs uppercase tracking-widest text-muted">
          Neutral recap
        </p>
        <p className="text-sm leading-relaxed text-parchment/90">{turn.content}</p>
      </div>
    );
  }

  const p = getPhilosopher(turn.speaker);
  const isA = turn.speaker === aId;
  if (!p) return null;
  return (
    <div className={isA ? "flex justify-start" : "flex justify-end"}>
      <div className="max-w-[85%]">
        <div
          className={`mb-1 flex items-center gap-2 text-xs ${isA ? "" : "flex-row-reverse"}`}
          style={{ color: p.accent }}
        >
          <span>{p.name}</span>
          <span className="text-muted">· {PHASE_LABEL[turn.phase] ?? turn.phase}</span>
        </div>
        <div
          className="rounded-2xl px-4 py-3 text-[15px] leading-relaxed text-parchment"
          style={{ background: "#131317", border: `1px solid ${p.accent}44` }}
        >
          <p className="whitespace-pre-wrap">{turn.content}</p>
        </div>
      </div>
    </div>
  );
}
