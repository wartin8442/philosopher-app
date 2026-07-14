"use client";

import { RefObject, useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Portrait from "@/components/Portrait";
import VoiceVisualizer from "@/components/VoiceVisualizer";
import MicButton from "@/components/MicButton";
import ListeningOverlay from "@/components/ListeningOverlay";
import SettingsPanel from "@/components/SettingsPanel";
import { PHILOSOPHERS, getPhilosopher } from "@/lib/philosophers";
import { getDuelTopics } from "@/lib/starters";
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

/**
 * POST one duel turn and deliver the LLM text chunks as they stream.
 * Throws on HTTP failure or an in-stream error event.
 */
async function streamDuelTurn(
  body: Record<string, unknown>,
  onText: (text: string) => void,
  signal?: AbortSignal,
) {
  const res = await fetch("/api/duel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Request failed");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as {
        type: string;
        text?: string;
        error?: string;
      };
      if (event.type === "text") onText(event.text ?? "");
      else if (event.type === "error")
        throw new Error(event.error || "The reply was interrupted.");
    }
  }
}

/**
 * A pre-started opening turn. The fetch begins the moment the user leaves
 * the setup screen and buffers LLM text here until Begin is pressed, so the
 * pause before Begin doubles as the first philosopher's thinking time.
 */
interface PrefetchedTurn {
  /** Guards against consuming a prefetch whose inputs no longer match. */
  key: string;
  chunks: string[];
  done: boolean;
  error: string | null;
  /** Wakes the consumer when a chunk lands or the stream settles. */
  notify: (() => void) | null;
  controller: AbortController;
}

function openingKey(
  aId: string,
  bId: string,
  topic: string,
  answerLevel: string,
) {
  return `${aId}|${bId}|${answerLevel}|${topic}`;
}

function prefetchOpening(
  aId: string,
  bId: string,
  topic: string,
  answerLevel: string,
): PrefetchedTurn {
  const state: PrefetchedTurn = {
    key: openingKey(aId, bId, topic, answerLevel),
    chunks: [],
    done: false,
    error: null,
    notify: null,
    controller: new AbortController(),
  };
  (async () => {
    try {
      await streamDuelTurn(
        {
          speakerId: aId,
          opponentId: bId,
          topic,
          phase: "opening",
          transcript: [],
          answerLevel,
        },
        (text) => {
          state.chunks.push(text);
          state.notify?.();
        },
        state.controller.signal,
      );
    } catch (err) {
      state.error = err instanceof Error ? err.message : "Something went wrong.";
    } finally {
      state.done = true;
      state.notify?.();
    }
  })();
  return state;
}

const PHASE_LABEL: Record<string, string> = Object.fromEntries(
  DUEL_PHASES.map((p) => [p.id, p.label]),
);

export default function DuelPage() {
  const { settings, update, loaded } = useSettings();
  const { stop: stopSpeaking, speaking, startSpeechStream, analyserRef } =
    useSpeech();

  const [aId, setAId] = useState<string>("aquinas");
  const [bId, setBId] = useState<string>("nietzsche");
  const [topic, setTopic] = useState("");
  const [started, setStarted] = useState(false);

  const [transcript, setTranscript] = useState<DuelTurn[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  // True once the current turn's text has started arriving (hides "thinking…").
  const [streamingTurn, setStreamingTurn] = useState(false);
  // Which philosopher's turn is actually underway (words showing / audio
  // playing). Distinct from nextStep: the step index advances before the
  // audio tail finishes, so nextStep points at the wrong speaker by then.
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const [interject, setInterject] = useState("");
  const pendingInterjection = useRef<string | null>(null);
  // Opening turn started at "Begin the debate" and consumed at "Begin".
  const openingPrefetch = useRef<PrefetchedTurn | null>(null);

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

    // The turn accumulates here as LLM tokens land. With voice on, the bubble
    // reveals in step with the audio (each sentence appears when it starts
    // being spoken); muted, it grows as fast as tokens arrive.
    let fullReply = "";
    let revealedChars = 0;

    const showTurn = (content: string) => {
      if (!turnAdded) {
        turnAdded = true;
        setStreamingTurn(true);
        if (step.speaker !== "moderator") setSpeakingId(step.speaker);
        setTranscript((prev) => [
          ...prev,
          { speaker: step.speaker, phase: step.phase, content },
        ]);
      } else {
        setTranscript((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], content };
          return next;
        });
      }
    };

    try {
      if (settingsRef.current.voiceEnabled) {
        voice = startSpeechStream(speakerId, {
          onFirstAudio: () => {
            if (DEV)
              console.log(
                `[latency] duel ${step.phase}: first audio ${Math.round(performance.now() - tStart)}ms`,
              );
          },
          // The LLM streams far ahead of the speech, so the transcript is
          // paced by playback instead: sentences are trimmed raw slices of
          // the turn, so locate this one past the reveal point and show
          // everything up to its end.
          onSentenceStart: (sentence) => {
            const idx = fullReply.indexOf(sentence, revealedChars);
            revealedChars =
              idx >= 0
                ? idx + sentence.length
                : Math.min(fullReply.length, revealedChars + sentence.length);
            showTurn(fullReply.slice(0, revealedChars));
          },
        });
      }
      // The turn streams in as text chunks. Collect them and feed the TTS;
      // the bubble is painted by showTurn — paced by playback when voice is
      // on, immediately otherwise.
      let firstToken = true;
      let fromPrefetch = false;
      const onText = (text: string) => {
        if (firstToken) {
          firstToken = false;
          if (DEV)
            console.log(
              `[latency] duel ${step.phase}: first token ${Math.round(performance.now() - tStart)}ms${fromPrefetch ? " (prefetched)" : ""}`,
            );
        }
        fullReply += text;
        voice?.push(text);
        // Muted, or the voice was interrupted mid-turn: there is no audio
        // to pace against, so show text as it streams.
        if (!voice || voice.cancelled) {
          revealedChars = fullReply.length;
          showTurn(fullReply);
        }
      };

      // The opening was prefetched while the user sat on the pre-debate
      // screen; drain that instead of refetching. A prefetch that already
      // errored, was made under different settings, or predates an
      // interjection is discarded in favor of a fresh request.
      const prefetch = openingPrefetch.current;
      openingPrefetch.current = null;
      const usePrefetch =
        prefetch !== null &&
        stepIndex === 0 &&
        !interjection &&
        !prefetch.error &&
        prefetch.key ===
          openingKey(aId, bId, topic, settingsRef.current.answerLevel);

      if (prefetch && usePrefetch) {
        fromPrefetch = true;
        let consumed = 0;
        while (true) {
          while (consumed < prefetch.chunks.length)
            onText(prefetch.chunks[consumed++]);
          if (prefetch.done) break;
          await new Promise<void>((resolve) => {
            prefetch.notify = resolve;
          });
          prefetch.notify = null;
        }
        // The stream died partway through; surface it like a live failure.
        if (prefetch.error) throw new Error(prefetch.error);
      } else {
        prefetch?.controller.abort();
        await streamDuelTurn(
          {
            speakerId,
            opponentId,
            topic,
            phase: step.phase,
            transcript,
            answerLevel: settingsRef.current.answerLevel,
            interjection: interjection ?? undefined,
          },
          onText,
        );
      }

      setStepIndex((i) => i + 1);
      if (voice) {
        // Most audio has already played by now; this waits out the tail.
        await voice.end();
        // Playback finished (or was interrupted): settle the bubble on the
        // exact full turn in case the paced reveal fell short.
        if (fullReply) showTurn(fullReply);
      }
    } catch (err) {
      voice?.cancel();
      // The transcript doubles as the API's debate context and this step will
      // be retried, so a half-finished turn must not stay in it.
      if (turnAdded) setTranscript((prev) => prev.slice(0, -1));
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSpeakingId(null);
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

  const { listening, preparing, interim, supported, start, stop, cancel } =
    useSpeechRecognition(
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
    // Spend the pause before the user presses Begin generating A's opening,
    // so the first turn starts instantly instead of "thinking".
    openingPrefetch.current?.controller.abort();
    openingPrefetch.current = prefetchOpening(
      aId,
      bId,
      topic,
      settingsRef.current.answerLevel,
    );
  }

  function reset() {
    stopSpeaking();
    setStarted(false);
    setTranscript([]);
    setStepIndex(0);
    pendingInterjection.current = null;
    openingPrefetch.current?.controller.abort();
    openingPrefetch.current = null;
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
          {/* Curated topics for this exact matchup; tapping fills the field
              so the user can tweak before beginning. */}
          {aId !== bId && (
            <div className="mt-3">
              <p className="mb-2 text-xs uppercase tracking-wider text-muted">
                Where {a.name} and {b.name} collide
              </p>
              <div className="flex flex-wrap gap-2">
                {getDuelTopics(aId, bId).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopic(t)}
                    className="rounded-full border px-3 py-1.5 text-left text-xs text-parchment/90 transition hover:text-parchment"
                    style={{
                      borderColor: topic === t ? "#c9a24b" : "#33333d",
                      background: topic === t ? "#c9a24b18" : "transparent",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
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
          <Contender
            p={a}
            thinking={!done && busy && !streamingTurn && nextStep?.speaker === aId}
            speaking={speakingId === aId}
            analyserRef={analyserRef}
          />
          <span className="font-serif text-2xl text-muted">vs</span>
          <Contender
            p={b}
            thinking={!done && busy && !streamingTurn && nextStep?.speaker === bId}
            speaking={speakingId === bId}
            analyserRef={analyserRef}
          />
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
          <div className="flex items-center gap-2">
            {supported && (
              <MicButton
                listening={listening}
                preparing={preparing}
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

      <ListeningOverlay
        active={listening || preparing}
        preparing={preparing}
        transcript={interim}
        accent="#c9a24b"
        speakerLabel="Interjecting in the debate"
        onDone={stop}
        onCancel={cancel}
      />

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

function Contender({
  p,
  thinking,
  speaking,
  analyserRef,
}: {
  p: ReturnType<typeof getPhilosopher>;
  /** Their turn is being generated but no words are out yet. */
  thinking: boolean;
  /** Their voice is playing right now — show the audio-reactive aura. */
  speaking: boolean;
  analyserRef: RefObject<AnalyserNode | null>;
}) {
  if (!p) return null;
  return (
    <div className="flex flex-col items-center">
      {/* The aura canvas is absolutely centered and larger than this box on
          purpose: the ring reaches past the portrait without growing the
          header layout. */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 56, height: 56 }}
      >
        <VoiceVisualizer
          size={116}
          innerRadius={32}
          accent={p.accent}
          active={speaking}
          analyserRef={analyserRef}
        />
        <Portrait
          initials={p.initials}
          accent={p.accent}
          imageSrc={p.image}
          crop={p.imageCrop}
          size={56}
          active={thinking}
        />
      </div>
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
