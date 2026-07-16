"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Portrait from "@/components/Portrait";
import MicButton from "@/components/MicButton";
import LevelSelectOverlay from "@/components/LevelSelectOverlay";
import ListeningOverlay from "@/components/ListeningOverlay";
import SettingsPanel from "@/components/SettingsPanel";
import VoiceVisualizer from "@/components/VoiceVisualizer";
import { getPhilosopher } from "@/lib/philosophers";
import { getConversationStarters } from "@/lib/starters";
import { getWorkBySlug, workSlug } from "@/lib/profiles";
import { rememberLastPhilosopher } from "@/lib/lastPhilosopher";
import { Settings, effectiveAnswerLevel, useSettings } from "@/lib/settings";
import { SpeechStream, useSpeech } from "@/lib/useSpeech";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { useStickToBottom } from "@/lib/useStickToBottom";
import {
  AnswerLevel,
  ChatMessage,
  PhilosopherWork,
  SourceExcerpt,
} from "@/lib/types";

interface DisplayMessage extends ChatMessage {
  sources?: SourceExcerpt[];
}

// Latency numbers go to the browser console in dev builds only. Next.js
// inlines NODE_ENV at build time, so in production this whole flag is `false`
// and the logging code is dead.
const DEV = process.env.NODE_ENV === "development";

const PORTRAIT_SIZE = 192;
const VISUALIZER_SIZE = 340;

// useSearchParams (for ?work=) requires a Suspense boundary during prerender.
export default function ConversationPage() {
  return (
    <Suspense>
      <Conversation />
    </Suspense>
  );
}

function Conversation() {
  const params = useParams<{ id: string }>();
  const philosopher = getPhilosopher(params.id);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Work focus ("Explore this work" on the profile page): resolved once from
  // the ?work= slug, then held as dismissable state — the X on the pill drops
  // back to a general conversation without leaving the page. An unknown slug
  // resolves to undefined and the chat simply starts general.
  const [focusedWork, setFocusedWork] = useState<PhilosopherWork | null>(() => {
    const slug = searchParams.get("work");
    return (slug && getWorkBySlug(params.id, slug)) || null;
  });
  const clearWorkFocus = () => {
    setFocusedWork(null);
    // Strip ?work= so a reload or share of the URL matches what's on screen.
    router.replace(`/conversation/${params.id}`, { scroll: false });
  };

  // Remember this philosopher so the landing page carousel re-centers on
  // them when the user navigates back out of the conversation.
  useEffect(() => {
    if (philosopher) rememberLastPhilosopher(philosopher.id);
  }, [philosopher]);

  const { settings, update, loaded } = useSettings();
  const { stop: stopSpeaking, speaking, startSpeechStream, analyserRef } =
    useSpeech();

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  // Follow the growing transcript only while the user is already at the
  // bottom; scrolling up to reread detaches the auto-scroll.
  const {
    scrollRef,
    onScroll: onTranscriptScroll,
    pin: followTranscript,
  } = useStickToBottom<HTMLDivElement>([messages, thinking]);

  // The aura ring scales down to whatever space is left between the header
  // and the chat panel, so it never overlaps neighboring UI on short windows.
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState(VISUALIZER_SIZE);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setStageSize(
        Math.max(
          160,
          Math.min(VISUALIZER_SIZE, Math.floor(width), Math.floor(height)),
        ),
      );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const portraitSize = Math.round(
    stageSize * (PORTRAIT_SIZE / VISUALIZER_SIZE),
  );

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const send = useCallback(
    async (text: string) => {
      if (!philosopher || !text.trim() || thinking) return;
      setError(null);
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
            workSlug: focusedWork ? workSlug(focusedWork.title) : undefined,
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

  const { listening, preparing, interim, supported, start, stop, cancel } =
    useSpeechRecognition((transcript) => sendRef.current(transcript));

  const startListeningRef = useRef<() => void>(() => {});
  startListeningRef.current = () => {
    stopSpeaking();
    start();
  };

  // Prefetch retrieval while the user is still talking: each interim
  // transcript change restarts a short timer (debounce), and when the speech
  // pauses we warm the server-side retrieval cache for that partial sentence.
  // By the time the final transcript reaches /api/chat, its sources are
  // usually already cached. Fire-and-forget: failures just mean no prefetch.
  const lastPrefetchRef = useRef("");
  useEffect(() => {
    if (!philosopher || !interim || interim.trim().length < 10) return;
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
  }, [interim, philosopher]);

  const toggleMute = () => {
    const muting = settings.voiceEnabled;
    if (muting) stopSpeaking();
    update({ voiceEnabled: !muting });
  };

  if (!philosopher) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-muted">Unknown philosopher.</p>
        <Link href="/" className="mt-4 inline-block text-parchment underline">
          ← Back
        </Link>
      </main>
    );
  }

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
    });

  // First visit to this philosopher: no remembered level yet, so ask before
  // the conversation starts. Answered once, never shown again.
  const needsLevelChoice = loaded && !settings.philosopherLevels[philosopher.id];

  // While the mic is open, the full-screen ListeningOverlay owns the
  // transcription experience, so this line only covers the other states.
  const status =
    listening || preparing
      ? ""
      : thinking
        ? "Thinking…"
        : speaking
          ? ""
          : "Press the microphone and speak";

  return (
    <main className="flex h-dvh flex-col">
      {/* Full-bleed header: the border spans the page; content stays centered. */}
      <header className="border-b border-ink-800 px-4 pb-3 pt-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
        <Link
          href={`/philosopher/${philosopher.id}`}
          aria-label={`Back to ${philosopher.name}'s profile`}
          className="text-muted hover:text-parchment"
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
          className="rounded-full border border-ink-700 p-2 text-muted hover:text-parchment"
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
      <section className="relative mx-auto flex w-full min-h-0 max-w-3xl flex-1 flex-col items-center gap-5 px-4 pb-4 sm:px-6">
        {/* Measured area: the aura sizes itself to fit inside it. */}
        <div
          ref={stageRef}
          className="flex min-h-0 w-full flex-1 items-center justify-center"
        >
          <div
            className="relative flex shrink-0 items-center justify-center"
            style={{ width: stageSize, height: stageSize }}
          >
            <VoiceVisualizer
              size={stageSize}
              innerRadius={portraitSize / 2 + 8}
              accent={philosopher.accent}
              active={speaking}
              analyserRef={analyserRef}
            />
            {/* The portrait itself stays still; the ring does all the moving. */}
            <Portrait
              initials={philosopher.initials}
              accent={philosopher.accent}
              imageSrc={philosopher.image}
              crop={philosopher.imageCrop}
              size={portraitSize}
            />
          </div>
        </div>

        <p className="h-5 max-w-md truncate px-4 text-center text-sm italic text-muted">
          {status}
        </p>

        <div className="flex items-center gap-4">
          {supported && (
            <MicButton
              listening={listening}
              preparing={preparing}
              disabled={thinking}
              accent={philosopher.accent}
              size={76}
              onStart={() => startListeningRef.current?.()}
              onStop={stop}
            />
          )}
          {/* Mute: the philosopher still replies in text, but stays silent. */}
          <button
            type="button"
            onClick={toggleMute}
            aria-pressed={!settings.voiceEnabled}
            aria-label={settings.voiceEnabled ? "Mute voice" : "Unmute voice"}
            title={settings.voiceEnabled ? "Mute voice" : "Unmute voice"}
            className="flex h-12 w-12 items-center justify-center rounded-full border transition"
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
          {speaking && (
            <button
              onClick={stopSpeaking}
              aria-label="Stop speaking"
              title="Stop speaking"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-ink-700 text-muted transition hover:text-parchment"
            >
              ⏹
            </button>
          )}
        </div>
      </section>

      {/* Chat: transcript + typed input in the bottom quarter of the screen */}
      <section className="border-t border-ink-800 px-4 sm:px-6">
        <div className="mx-auto flex h-[25dvh] min-h-[170px] max-w-3xl flex-col pb-2 pt-2">
        <div
          ref={scrollRef}
          onScroll={onTranscriptScroll}
          className="flex-1 space-y-2 overflow-y-auto pb-2 pr-1"
        >
          {messages.length === 0 && !thinking && (
            <div className="pt-3">
              <p className="text-center text-sm text-muted">
                {focusedWork
                  ? `You are speaking with ${philosopher.name} about ${focusedWork.title}. Ask a question, or simply begin.`
                  : `You are speaking with ${philosopher.name}. Ask a question, or simply begin.`}
              </p>
              {/* Curated openers: tapping one sends it as the first message. */}
              <div className="mt-3 flex flex-wrap justify-center gap-2 px-2">
                {getConversationStarters(
                  philosopher.id,
                  effectiveAnswerLevel(settings, philosopher.id),
                ).map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => send(starter)}
                    className="rounded-full border px-3 py-1.5 text-xs text-parchment/90 transition hover:text-parchment"
                    style={{
                      borderColor: `${philosopher.accent}55`,
                      background: `${philosopher.accent}11`,
                    }}
                  >
                    {starter}
                  </button>
                ))}
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
                  <span className="animate-bounce">•</span>
                  <span className="animate-bounce [animation-delay:120ms]">•</span>
                  <span className="animate-bounce [animation-delay:240ms]">•</span>
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
          className="flex items-center gap-2 pb-1"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a question…"
            className="flex-1 rounded-full border border-ink-700 bg-ink-900 px-4 py-2.5 text-sm text-parchment placeholder:text-muted focus:border-ink-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={thinking || !input.trim()}
            className="rounded-full border border-ink-600 bg-ink-800 px-5 py-2.5 text-sm text-parchment transition hover:border-parchment disabled:opacity-40"
          >
            Send
          </button>
        </form>
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
          onBack={() => router.push(`/philosopher/${philosopher.id}`)}
          backLabel={`Back to ${philosopher.name}'s profile`}
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
