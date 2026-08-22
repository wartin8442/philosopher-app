"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AiDisclaimer from "@/components/AiDisclaimer";
import Portrait from "@/components/Portrait";
import MicButton from "@/components/MicButton";
import LevelSelectOverlay from "@/components/LevelSelectOverlay";
import ListeningOverlay from "@/components/ListeningOverlay";
import SettingsPanel from "@/components/SettingsPanel";
import VoiceVisualizer from "@/components/VoiceVisualizer";
import type { ContextualConversationPrompt } from "@/lib/contextualPrompts";
import type {
  PhilosopherDisplay,
  WorkFocus,
} from "@/lib/philosopherDisplay";
import { rememberLastPhilosopher } from "@/lib/lastPhilosopher";
import {
  Settings,
  completedLevelPromptVersions,
  effectiveAnswerLevel,
  needsAnswerLevelChoice,
  useSettings,
} from "@/lib/settings";
import { SpeechStream, useSpeech } from "@/lib/useSpeech";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { useStickToBottom } from "@/lib/useStickToBottom";
import { useWakeLock } from "@/lib/useWakeLock";
import { AnswerLevel, ChatMessage, SourceExcerpt } from "@/lib/types";

interface DisplayMessage extends ChatMessage {
  sources?: SourceExcerpt[];
}

export interface ConversationProps {
  /** Display-only projection; the full record never reaches the browser. */
  philosopher: PhilosopherDisplay;
  /** Resolved from `?work=` on the server. Dismissable from here. */
  initialWork: WorkFocus | null;
  /** Resolved from `?prompt=` on the server. */
  contextualPrompt: ContextualConversationPrompt | null;
  /**
   * This philosopher's conversation starters, keyed by answer level. The level
   * is client state (the settings panel changes it mid-conversation), so all
   * of them ship — but only for this one philosopher, which is a few hundred
   * bytes against the 30KB of `lib/starters.ts`.
   */
  starters: Record<AnswerLevel, string[]>;
}

// Latency numbers go to the browser console in dev builds only. Next.js
// inlines NODE_ENV at build time, so in production this whole flag is `false`
// and the logging code is dead.
const DEV = process.env.NODE_ENV === "development";

const PORTRAIT_SIZE = 192;
const VISUALIZER_SIZE = 340;
const MIN_VISUALIZER_SIZE = 128;

/**
 * The stage has to be measured before it is painted, or the portrait lands at
 * one size and is resized under the reader's eye. `useLayoutEffect` does that
 * — but React warns when it runs during a server render, so on the server it
 * falls back to the effect that never runs there anyway.
 */
const useMeasureEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function Conversation({
  philosopher,
  initialWork,
  contextualPrompt,
  starters,
}: ConversationProps) {
  const router = useRouter();

  // Work focus ("Explore this work" on the profile page): resolved from the
  // ?work= slug on the server, then held as dismissable state here — the X on
  // the pill drops back to a general conversation without leaving the page.
  const [focusedWork, setFocusedWork] = useState<WorkFocus | null>(initialWork);
  const clearWorkFocus = () => {
    setFocusedWork(null);
    // Strip ?work= so a reload or share of the URL matches what's on screen.
    router.replace(`/conversation/${philosopher.id}`, { scroll: false });
  };

  // Remember this philosopher so the landing page carousel re-centers on
  // them when the user navigates back out of the conversation.
  useEffect(() => {
    rememberLastPhilosopher(philosopher.id);
  }, [philosopher.id]);

  const { settings, update, loaded } = useSettings();
  const {
    stop: stopSpeaking,
    hold: holdSpeech,
    release: releaseSpeech,
    speaking,
    startSpeechStream,
    analyserRef,
  } = useSpeech();

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [thinking, setThinking] = useState(false);
  // True while the voice is frozen rather than abandoned. `speaking` stays
  // true through a pause — the reply is still in the air, it is just not
  // moving — so this is what tells the two apart on screen.
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  // Follow the growing transcript only while the user is already at the
  // bottom; scrolling up to reread detaches the auto-scroll.
  const {
    scrollRef,
    onScroll: onTranscriptScroll,
    pin: followTranscript,
  } = useStickToBottom<HTMLDivElement>([messages, thinking]);

  // Grow the composer with wrapped text until five lines are visible. Beyond
  // that point, keep the page layout stable and scroll inside the textarea.
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const styles = window.getComputedStyle(textarea);
    const borderHeight =
      Number.parseFloat(styles.borderTopWidth) +
      Number.parseFloat(styles.borderBottomWidth);
    const paddingHeight =
      Number.parseFloat(styles.paddingTop) +
      Number.parseFloat(styles.paddingBottom);
    const maxHeight =
      Number.parseFloat(styles.lineHeight) * 5 + paddingHeight + borderHeight;
    textarea.style.height = "auto";
    const contentHeight = textarea.scrollHeight + borderHeight;
    textarea.style.height = `${Math.min(contentHeight, maxHeight)}px`;
    textarea.style.overflowY =
      contentHeight > maxHeight ? "auto" : "hidden";
  }, [input]);

  // The aura ring scales down to whatever space is left between the header
  // and the chat panel, so it never overlaps neighboring UI on short windows.
  const stageRef = useRef<HTMLDivElement | null>(null);
  // Null until the stage has been measured. Opening at the full 340 and
  // letting the observer correct it downwards meant the portrait and its ring
  // were drawn once at the wrong size and then visibly snapped smaller a frame
  // later — the first thing you saw on arriving from a book cover.
  const [stageSize, setStageSize] = useState<number | null>(null);
  useMeasureEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = (width: number, height: number) =>
      Math.max(
        MIN_VISUALIZER_SIZE,
        Math.min(VISUALIZER_SIZE, Math.floor(width), Math.floor(height)),
      );
    // Measured synchronously here, before the browser paints, so the aura is
    // only ever drawn at the size it keeps.
    const first = el.getBoundingClientRect();
    setStageSize(fit(first.width, first.height));
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setStageSize(fit(width, height));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const portraitSize = Math.round(
    (stageSize ?? VISUALIZER_SIZE) * (PORTRAIT_SIZE / VISUALIZER_SIZE),
  );

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || thinking) return;
      setError(null);
      // A new turn is never inherited paused. Without this, muting or asking
      // again while frozen left the button showing "resume" over a voice that
      // was already talking.
      setPaused(false);
      const nextMessages: DisplayMessage[] = [
        ...messages,
        { role: "user", content: text.trim() },
      ];
      setMessages(nextMessages);
      setInput("");
      setThinking(true);
      // Sending a message signals the user wants to see the reply.
      followTranscript();
      // Started before the fetch (inside the user-gesture call stack) so the
      // browser lets the AudioContext play. Sentences are spoken as they
      // complete instead of waiting for the full reply.
      let voice: SpeechStream | null = null;
      const tStart = performance.now();

      // The reply accumulates here as LLM tokens land. With voice on, the
      // bubble reveals in step with the audio (each sentence appears when it
      // starts being spoken); muted, it grows as fast as tokens arrive.
      let fullReply = "";
      let sources: SourceExcerpt[] = [];
      let bubbleStarted = false;
      let revealedChars = 0;

      const showBubble = (content: string) => {
        if (!bubbleStarted) {
          bubbleStarted = true;
          setThinking(false);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content, sources },
          ]);
        } else {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            next[next.length - 1] = { ...last, content };
            return next;
          });
        }
      };

      try {
        if (settingsRef.current.voiceEnabled) {
          voice = startSpeechStream(philosopher.id, {
            onFirstAudio: () => {
              if (DEV)
                console.log(
                  `[latency] chat: first audio ${Math.round(performance.now() - tStart)}ms`,
                );
            },
            // The LLM streams far ahead of the speech, so the transcript is
            // paced by playback instead: sentences are trimmed raw slices of
            // the reply, so locate this one past the reveal point and show
            // everything up to its end.
            onSentenceStart: (sentence) => {
              const idx = fullReply.indexOf(sentence, revealedChars);
              revealedChars =
                idx >= 0
                  ? idx + sentence.length
                  : Math.min(fullReply.length, revealedChars + sentence.length);
              showBubble(fullReply.slice(0, revealedChars));
            },
          });
        }
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            philosopherId: philosopher.id,
            answerLevel: effectiveAnswerLevel(settingsRef.current, philosopher.id),
            workSlug: focusedWork?.slug,
            messages: nextMessages.map(({ role, content }) => ({ role, content })),
          }),
        });
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Request failed");
        }

        // The reply arrives as a stream of NDJSON events. Collect the text
        // and feed it to TTS; the bubble is painted by showBubble — paced by
        // playback when voice is on, immediately otherwise.
        let firstToken = true;

        const handleEvent = (event: {
          type: string;
          text?: string;
          sources?: SourceExcerpt[];
          error?: string;
        }) => {
          if (event.type === "sources") {
            sources = event.sources ?? [];
          } else if (event.type === "text") {
            if (firstToken) {
              firstToken = false;
              if (DEV)
                console.log(
                  `[latency] chat: first token ${Math.round(performance.now() - tStart)}ms`,
                );
            }
            fullReply += event.text ?? "";
            voice?.push(event.text ?? "");
            // Muted, or the voice was interrupted mid-reply: there is no
            // audio to pace against, so show text as it streams.
            if (!voice || voice.cancelled) {
              revealedChars = fullReply.length;
              showBubble(fullReply);
            }
          } else if (event.type === "error") {
            throw new Error(event.error || "The reply was interrupted.");
          }
        };

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
            if (line.trim()) handleEvent(JSON.parse(line));
          }
        }

        if (voice) {
          // Most audio has already played by now; this waits out the tail.
          await voice.end();
          // Playback finished (or was interrupted): settle the bubble on the
          // exact full reply in case the paced reveal fell short.
          if (fullReply) showBubble(fullReply);
        }
      } catch (err) {
        voice?.cancel();
        // Show whatever text made it through before the failure.
        if (fullReply) showBubble(fullReply);
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setThinking(false);
      }
    },
    [philosopher, messages, thinking, focusedWork, startSpeechStream, followTranscript],
  );

  const sendRef = useRef(send);
  sendRef.current = send;

  const {
    listening,
    preparing,
    interim,
    supported,
    start,
    stop,
    cancel,
    prewarm,
  } = useSpeechRecognition((transcript) => sendRef.current(transcript));

  // Nobody touches the screen for the length of a spoken exchange, so the
  // phone would dim and lock in the middle of one. Held from the moment the
  // mic opens until the reply has finished being spoken.
  //
  // `speaking` and not `speaking && !paused`: a held reply is the case that
  // most needs the lock, because a phone that sleeps on a suspended
  // AudioContext can tear it down, and then there is nothing left to resume.
  useWakeLock(listening || preparing || thinking || speaking);

  /**
   * Freeze the voice where it stands, and let it go again.
   *
   * `stopSpeaking` abandons the clips, so picking the voice back up would
   * mean synthesizing the sentence again and hearing it restart from its
   * first word. Suspending the audio clock instead holds the whole graph
   * mid-word and resumes from the same sample with nothing to fetch.
   *
   * The reply itself is untouched: `/api/chat` keeps streaming behind the
   * pause and its sentences keep being synthesized, scheduled against a clock
   * that is not running. They play in order once it is. The transcript stays
   * in step because the subtitle reveals are timed against that same clock —
   * see `Reveal` in `useSpeech`.
   */
  const togglePause = () => {
    if (paused) {
      setPaused(false);
      releaseSpeech();
    } else {
      setPaused(true);
      holdSpeech();
    }
  };

  /**
   * Throw the rest of the spoken reply away — what the single button here
   * always did. Every path that ends the voice goes through this rather than
   * `stopSpeaking` directly, because a pause that is ended rather than
   * resumed leaves the audio clock suspended: the *next* reply would be
   * scheduled against a clock that never advances, and would never be heard.
   */
  const endSpeaking = () => {
    stopSpeaking();
    if (paused) {
      setPaused(false);
      releaseSpeech();
    }
  };

  const startListeningRef = useRef<() => void>(() => {});
  startListeningRef.current = () => {
    endSpeaking();
    start();
  };

  // Prefetch retrieval while the user is still talking: each interim
  // transcript change restarts a short timer (debounce), and when the speech
  // pauses we warm the server-side retrieval cache for that partial sentence.
  // By the time the final transcript reaches /api/chat, its sources are
  // usually already cached. Fire-and-forget: failures just mean no prefetch.
  const lastPrefetchRef = useRef("");
  useEffect(() => {
    if (!interim || interim.trim().length < 10) return;
    const timer = setTimeout(() => {
      const query = interim.trim();
      if (query === lastPrefetchRef.current) return;
      lastPrefetchRef.current = query;
      fetch("/api/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ philosopherId: philosopher.id, query }),
      }).catch(() => {});
    }, 350);
    return () => clearTimeout(timer);
  }, [interim, philosopher.id]);

  const toggleMute = () => {
    const muting = settings.voiceEnabled;
    if (muting) endSpeaking();
    update({ voiceEnabled: !muting });
  };

  // Set this philosopher's level (first-visit overlay, or a settings-panel
  // change mid-conversation). Also moves the global fallback, so the choice
  // carries to surfaces without their own prompt (e.g. duel mode).
  const chooseLevel = (level: AnswerLevel, rest: Partial<Settings> = {}) =>
    update({
      ...rest,
      answerLevel: level,
      philosopherLevels: {
        ...settings.philosopherLevels,
        [philosopher.id]: level,
      },
      levelPromptVersions: completedLevelPromptVersions(
        settings,
        philosopher.id,
      ),
    });

  // First visit to this philosopher: no remembered level yet, so ask before
  // the conversation starts. Answered once, never shown again.
  const needsLevelChoice =
    loaded && needsAnswerLevelChoice(settings, philosopher.id);

  // While the mic is open, the full-screen ListeningOverlay owns the
  // transcription experience, so this line only covers the other states.
  const status =
    listening || preparing
      ? ""
      : thinking
        ? "Thinking…"
        : paused
          ? "Paused — resume when you are ready"
          : speaking
            ? ""
            : "Press the microphone and speak";

  return (
    <main className="flex h-dvh flex-col">
      {/* Full-bleed header: the border spans the page; content stays centered. */}
      <header className="border-b border-ink-800 px-4 pb-3 pt-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
        <Link
          href={
            contextualPrompt?.returnHref ??
            `/philosopher/${philosopher.id}`
          }
          aria-label={
            contextualPrompt
              ? "Back to the philosophy story"
              : `Back to ${philosopher.name}'s profile`
          }
          className="-m-2 shrink-0 rounded-full p-2 text-muted transition duration-150 hover:text-parchment active:scale-90"
        >
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-lg text-parchment">{philosopher.name}</h1>
          <p className="truncate text-xs" style={{ color: philosopher.accent }}>
            {philosopher.dates} · {philosopher.voiceNote}
          </p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          aria-label="Settings"
          className="shrink-0 rounded-full border border-ink-700 p-2 text-muted transition duration-150 hover:border-ink-600 hover:text-parchment active:scale-90"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        </div>
      </header>

      {/* Work-focus pill: small but noticeable notice that the conversation
          is centered on one work; the X returns to a general discussion. */}
      {focusedWork && (
        <div className="flex justify-center px-4 pt-3">
          <div
            className="flex max-w-full items-center gap-2 rounded-full border py-1.5 pl-4 pr-1.5 text-xs sm:text-sm"
            style={{
              borderColor: `${philosopher.accent}66`,
              background: `${philosopher.accent}1a`,
              color: philosopher.accent,
            }}
          >
            <span className="min-w-0 truncate">
              This conversation is focused on{" "}
              <em className="font-serif not-italic">{focusedWork.title}</em>
            </span>
            <button
              type="button"
              onClick={clearWorkFocus}
              aria-label="Remove work focus and move to a more general discussion"
              title="Move to a more general discussion"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition hover:bg-ink-900"
              style={{ color: philosopher.accent }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Stage: portrait + visualizer + voice controls fill the middle band */}
      <section className="relative mx-auto flex w-full min-h-0 max-w-3xl flex-1 flex-col items-center gap-3 px-4 pb-4 sm:gap-5 sm:px-6">
        {/* Measured area: the aura sizes itself to fit inside it. */}
        <div
          ref={stageRef}
          className="flex min-h-0 w-full flex-1 items-center justify-center"
        >
          {/* Held back for the one frame it takes to measure the stage, then
              faded up: arriving at the right size is worth more than arriving
              a frame earlier at the wrong one. */}
          <div
            className="relative flex shrink-0 items-center justify-center transition-opacity duration-200"
            style={{
              width: stageSize ?? 0,
              height: stageSize ?? 0,
              opacity: stageSize === null ? 0 : 1,
            }}
          >
            {stageSize !== null && (
              <>
                <VoiceVisualizer
                  size={stageSize}
                  innerRadius={portraitSize / 2 + 8}
                  accent={philosopher.accent}
                  active={speaking && !paused}
                  analyserRef={analyserRef}
                />
                {/* The portrait itself stays still; the ring does all the moving. */}
                <Portrait
                  initials={philosopher.initials}
                  accent={philosopher.accent}
                  imageSrc={philosopher.image}
                  crop={philosopher.imageCrop}
                  size={portraitSize}
                  // The face is the largest thing on the page and the reason
                  // the page exists; it should not be queued behind lazy
                  // images and fade in after everything else has settled.
                  priority
                />
              </>
            )}
          </div>
        </div>

        <p className="h-5 max-w-md truncate px-4 text-center text-sm italic text-muted">
          {status}
        </p>

        {/* The mic and mute stay centered on the stage; "stop speaking" is
            positioned out of flow beside them so its coming and going can't
            shove them sideways mid-reply. */}
        <div className="relative flex items-center gap-4">
          {supported && (
            <MicButton
              listening={listening}
              preparing={preparing}
              disabled={thinking}
              accent={philosopher.accent}
              size={76}
              onStart={() => startListeningRef.current?.()}
              onStop={stop}
              onPrewarm={prewarm}
            />
          )}
          {/* Mute: the philosopher still replies in text, but stays silent. */}
          <button
            type="button"
            onClick={toggleMute}
            aria-pressed={!settings.voiceEnabled}
            aria-label={settings.voiceEnabled ? "Mute voice" : "Unmute voice"}
            title={settings.voiceEnabled ? "Mute voice" : "Unmute voice"}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition duration-150 active:scale-90"
            style={{
              borderColor: settings.voiceEnabled ? "#33333d" : philosopher.accent,
              background: settings.voiceEnabled ? "#1c1c22" : `${philosopher.accent}22`,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={settings.voiceEnabled ? "#e8e2d4" : philosopher.accent}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              {settings.voiceEnabled ? (
                <>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </>
              ) : (
                <>
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </>
              )}
            </svg>
          </button>
          {/* Fades in rather than mounting, out of flow: appearing mid-reply
              used to shove the mic and mute buttons sideways every time the
              philosopher started talking. Both controls ride in one cluster
              so the pair moves as a unit.

              It hangs off the right of a row that is centered on the stage, so
              its whole width is borrowed from the margin — which is why the
              buttons are 44px (the smallest comfortable touch target) and the
              gaps tighten below `sm` rather than the cluster wrapping. On a
              360px phone that leaves it roughly 8px clear of the edge. */}
          <div
            aria-hidden={!speaking}
            className={`absolute left-full top-1/2 ml-2 flex -translate-y-1/2 items-center gap-1.5 transition duration-200 sm:ml-4 sm:gap-2 ${
              speaking
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-75 opacity-0"
            }`}
          >
            {/* Icons are drawn, not typed. This row used to be a literal
                U+23F9 character: desktop fonts render it as a flat glyph, but
                phones substitute their color emoji font for that codepoint,
                so the one control that only appears mid-reply was also the
                one that looked like it came from a different app. */}
            <button
              type="button"
              onClick={togglePause}
              aria-label={paused ? "Resume speaking" : "Pause speaking"}
              title={paused ? "Resume speaking" : "Pause speaking"}
              tabIndex={speaking ? 0 : -1}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink-700 text-muted transition duration-150 hover:border-ink-600 hover:text-parchment active:scale-90"
              // Lit while held, so a frozen voice does not read as a stalled
              // one: the aura has gone dark by this point and this is the only
              // thing on the stage still saying he is mid-reply.
              style={
                paused
                  ? {
                      borderColor: philosopher.accent,
                      background: `${philosopher.accent}22`,
                      color: philosopher.accent,
                    }
                  : undefined
              }
            >
              {paused ? (
                <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              )}
            </button>
            {/* Ends the spoken reply outright, as the single button here
                always did. */}
            <button
              type="button"
              onClick={endSpeaking}
              aria-label="Stop speaking"
              title="Stop speaking"
              tabIndex={speaking ? 0 : -1}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink-700 text-muted transition duration-150 hover:border-ink-600 hover:text-parchment active:scale-90"
            >
              <svg
                aria-hidden
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Keep the complete first-turn experience visible together: contextual
          prompt, level-specific starters, and typed input. The stage above
          yields space on shorter screens instead of making this panel scroll. */}
      <section data-chat-panel className="border-t border-ink-800 px-4 sm:px-6">
        {/* Tall enough for the whole first turn and no taller. Every pixel this
            panel reserves is a pixel the stage above does not have, and the
            stage is where the aura and the portrait have to fit between the
            header and this border.

            Both its bounds give way on a short window, because the aura has a
            floor of its own (`MIN_VISUALIZER_SIZE`) and something has to
            yield: a panel that insisted on its own size pushed the portrait up
            through the work-focus pill and into the header. 400px is what the
            page needs above this panel to hold the header, the pill, the
            smallest aura, the status line and the mic row. Past there this
            panel scrolls, which is the milder failure — and the prompts sit at
            its foot, so what scrolls out of sight is the space above them. */}
        <div className="mx-auto flex h-[38dvh] min-h-[min(296px,calc(100dvh_-_400px))] max-h-[min(430px,calc(100dvh_-_400px))] max-w-3xl flex-col pb-2 pt-2">
        <div
          ref={scrollRef}
          onScroll={onTranscriptScroll}
          className="flex flex-1 flex-col space-y-2 overflow-y-auto pb-2 pr-1"
        >
          {messages.length === 0 && !thinking && loaded && (
            // Sat at the foot of the panel rather than the head of it: the
            // prompts are the thing to reach for, so they belong by the box
            // they are answered in, not floating a long way above it.
            //
            // Waits for `loaded`, because the starters are chosen by the
            // remembered answer level and that level is read from
            // localStorage a beat after the first render: without the wait,
            // three intermediate starters were painted and then swapped for
            // three beginner ones of a different length, shifting the whole
            // block as they went.
            <div className="mt-auto">
              <p className="text-center text-sm text-muted">
                {focusedWork
                  ? `You are speaking with ${philosopher.name} about ${focusedWork.title}. Ask a question, or simply begin.`
                  : `You are speaking with ${philosopher.name}. Ask a question, or simply begin.`}
              </p>
              {contextualPrompt && (
                <button
                  type="button"
                  onClick={() => send(contextualPrompt.prompt)}
                  // Kept compact: it is an offer, not the conversation. A card
                  // set at reading size pushed the stage into the pill above
                  // it on any window shorter than a desktop's.
                  className="group mx-auto mt-2 block w-full max-w-2xl rounded-xl border px-4 py-2.5 text-left transition duration-150 hover:bg-ink-900 active:scale-[0.99] active:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:mt-3 sm:px-5 sm:py-3"
                  style={{
                    borderColor: `${philosopher.accent}88`,
                    background: `${philosopher.accent}14`,
                    outlineColor: philosopher.accent,
                  }}
                >
                  <span
                    className="block text-[10px] uppercase tracking-[0.28em]"
                    style={{ color: philosopher.accent }}
                  >
                    Suggested prompt · {contextualPrompt.sourceLabel}
                  </span>
                  <span className="mt-1.5 flex items-end justify-between gap-4">
                    <span className="font-serif text-sm leading-snug text-parchment sm:text-lg">
                      {contextualPrompt.prompt}
                    </span>
                    <span
                      aria-hidden
                      className="shrink-0 text-lg transition-transform group-hover:translate-x-1"
                      style={{ color: philosopher.accent }}
                    >
                      →
                    </span>
                  </span>
                </button>
              )}
              {/* Curated openers: tapping one sends it as the first message.
                  The first is the broad "Explain your philosophy." overview —
                  the safest opener for someone who knows nothing about this
                  thinker — so it is lit brighter than its siblings to read as
                  the default rather than one of three equal options. */}
              {/* Close under the suggested prompt: the two are one offer of
                  where to start, and a wide gap read as two separate things. */}
              <div className={`${contextualPrompt ? "mt-2" : "mt-3"} flex flex-wrap justify-center gap-2 px-2`}>
                {(starters[effectiveAnswerLevel(settings, philosopher.id)] ?? []).map((starter, i) => {
                  const lead = i === 0;
                  return (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => send(starter)}
                      className={`rounded-full border px-3 py-1.5 transition duration-150 hover:text-parchment hover:brightness-125 active:scale-95 ${
                        lead
                          ? "text-xs font-medium text-parchment sm:text-sm"
                          : "text-xs text-parchment/90"
                      }`}
                      style={{
                        borderColor: `${philosopher.accent}${lead ? "cc" : "55"}`,
                        background: `${philosopher.accent}${lead ? "2e" : "11"}`,
                        boxShadow: lead
                          ? `0 0 18px ${philosopher.accent}66, inset 0 0 12px ${philosopher.accent}22`
                          : undefined,
                      }}
                    >
                      {starter}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className="max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
                style={
                  m.role === "user"
                    ? { background: "#26262e", color: "#e8e2d4" }
                    : {
                        background: "#131317",
                        border: `1px solid ${philosopher.accent}44`,
                        color: "#e8e2d4",
                      }
                }
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {settings.showSources && m.sources && m.sources.length > 0 && (
                  <div className="mt-2 border-t border-ink-700 pt-2">
                    <p className="text-[11px] uppercase tracking-wider text-muted">
                      Grounding
                    </p>
                    <ul className="mt-1 space-y-1">
                      {m.sources.map((s, j) => (
                        <li key={j} className="text-xs text-muted">
                          <span className="text-parchment/80">{s.label}</span> — {s.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex justify-start">
              <div
                className="rounded-2xl px-3 py-2 text-muted"
                style={{ border: `1px solid ${philosopher.accent}33` }}
              >
                <span className="inline-flex gap-1 text-sm">
                  <span className="typing-dot inline-block">•</span>
                  <span className="typing-dot inline-block [animation-delay:160ms]">•</span>
                  <span className="typing-dot inline-block [animation-delay:320ms]">•</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="mb-2 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-1.5 text-sm text-red-300">
            {error}
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 pb-1"
        >
          <textarea
            ref={inputRef}
            rows={1}
            wrap="soft"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Type a question…"
            className="max-h-[122px] min-w-0 flex-1 resize-none overflow-x-hidden rounded-2xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-sm leading-5 text-parchment placeholder:text-muted focus:border-ink-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={thinking || !input.trim()}
            className="shrink-0 rounded-full border border-ink-600 bg-ink-800 px-5 py-2.5 text-sm text-parchment transition duration-150 hover:border-parchment active:scale-95 active:bg-ink-700 disabled:opacity-40 disabled:active:scale-100"
          >
            Send
          </button>
        </form>

        {/* The persona never breaks character to say what it is, so the
            interface has to. Sits under the composer, where it is visible on
            every turn without competing with the conversation. */}
        <AiDisclaimer variant="inline" name={philosopher.name} className="pb-2" />
        </div>
      </section>

      <ListeningOverlay
        active={listening || preparing}
        preparing={preparing}
        transcript={interim}
        accent={philosopher.accent}
        speakerLabel={`Speaking to ${philosopher.name}`}
        onDone={stop}
        onCancel={cancel}
      />

      {needsLevelChoice && (
        <LevelSelectOverlay
          title={`At what level should ${philosopher.name} speak?`}
          advancedPossessive={`${philosopher.name}'s`}
          accent={philosopher.accent}
          onSelect={chooseLevel}
          onBack={() =>
            router.push(
              contextualPrompt?.returnHref ??
                `/philosopher/${philosopher.id}`,
            )
          }
          backLabel={
            contextualPrompt
              ? "Back to the philosophy story"
              : `Back to ${philosopher.name}'s profile`
          }
        />
      )}

      {showSettings && loaded && (
        <SettingsPanel
          // The panel shows and edits the level this conversation actually
          // runs at (the per-philosopher choice), not just the global
          // fallback.
          settings={{
            ...settings,
            answerLevel: effectiveAnswerLevel(settings, philosopher.id),
          }}
          onChange={(patch) => {
            if (patch.answerLevel) {
              const { answerLevel, ...rest } = patch;
              chooseLevel(answerLevel, rest);
            } else {
              update(patch);
            }
          }}
          onClose={() => setShowSettings(false)}
          showSourcesToggle
        />
      )}
    </main>
  );
}
