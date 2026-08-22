"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  holdMicrophone,
  prewarmMicrophone,
  releaseMicrophoneSurface,
  retainMicrophoneSurface,
  unholdMicrophone,
  warmMicrophone,
} from "./micWarmup";

const ENDPOINT_SILENCE_MS = 1200;

/**
 * Voice input via the browser-native Web Speech API (free, no key).
 * Gracefully reports unsupported browsers so the UI can hide the mic button.
 *
 * Opening the capture device is slow enough to clip the user's first words, so
 * it is done ahead of the press wherever possible — see `micWarmup`, which owns
 * the shared stream. This hook only says when a surface is mounted, when it is
 * capturing, and when speech looks imminent.
 */
export function useSpeechRecognition(
  onFinalResult: (transcript: string) => void,
) {
  const [listening, setListening] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mountedRef = useRef(false);
  const startingRef = useRef(false);
  const startSeqRef = useRef(0);
  const finalTranscriptRef = useRef("");
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualStopRef = useRef(false);
  const onResultRef = useRef(onFinalResult);
  onResultRef.current = onFinalResult;

  const clearSubmitTimer = useCallback(() => {
    if (!submitTimerRef.current) return;
    clearTimeout(submitTimerRef.current);
    submitTimerRef.current = null;
  }, []);

  const submitFinalTranscript = useCallback(
    (stopRecognition = true) => {
      clearSubmitTimer();
      const text = finalTranscriptRef.current.trim();
      finalTranscriptRef.current = "";
      manualStopRef.current = false;
      setInterim("");
      if (stopRecognition) {
        try {
          recognitionRef.current?.stop();
        } catch {
          /* noop */
        }
      }
      setListening(false);
      if (text) onResultRef.current(text);
    },
    [clearSubmitTimer],
  );

  const scheduleSubmit = useCallback(() => {
    clearSubmitTimer();
    submitTimerRef.current = setTimeout(
      () => submitFinalTranscript(true),
      ENDPOINT_SILENCE_MS,
    );
  }, [clearSubmitTimer, submitFinalTranscript]);

  useEffect(() => {
    mountedRef.current = true;
    const Ctor =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // The recognizer drops anything said before it actually begins capturing
    // (mic acquisition + speech-service handshake happen after start()), so
    // the UI must not claim "listening" until audiostart fires — otherwise
    // users start talking early and lose their first words.
    recognition.onaudiostart = () => {
      startingRef.current = false;
      setPreparing(false);
      setListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      if (finalText.trim()) {
        finalTranscriptRef.current = [
          finalTranscriptRef.current,
          finalText.trim(),
        ]
          .filter(Boolean)
          .join(" ");
        if (manualStopRef.current) submitFinalTranscript(false);
      }
      setInterim(
        [finalTranscriptRef.current, interimText.trim()]
          .filter(Boolean)
          .join(" "),
      );
      // The recognizer finalizes chunks mid-speech, so a final result alone
      // doesn't mean the speaker stopped. Any result — interim included —
      // pushes back the silence endpoint; we submit only after a true lull.
      if (finalTranscriptRef.current.trim()) scheduleSubmit();
    };
    recognition.onerror = () => {
      startingRef.current = false;
      setPreparing(false);
      setListening(false);
      if (finalTranscriptRef.current.trim()) scheduleSubmit();
      else setInterim("");
    };
    recognition.onend = () => {
      startingRef.current = false;
      setPreparing(false);
      setListening(false);
      if (finalTranscriptRef.current.trim()) {
        if (manualStopRef.current) submitFinalTranscript(false);
        else scheduleSubmit();
      } else {
        manualStopRef.current = false;
        setInterim("");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      mountedRef.current = false;
      startingRef.current = false;
      startSeqRef.current += 1;
      clearSubmitTimer();
      try {
        recognition.abort();
      } catch {
        /* noop */
      }
    };
  }, [clearSubmitTimer, scheduleSubmit, submitFinalTranscript]);

  // Mounting a voice surface is itself the strongest hint that speech is
  // coming, so the device starts opening now rather than on the press. This is
  // the speculative path: it stays silent unless permission is already
  // granted, so a first-time visitor still meets the prompt at the press,
  // which is the only moment it makes sense to them.
  useEffect(() => {
    retainMicrophoneSurface();
    void prewarmMicrophone();
    return releaseMicrophoneSurface;
  }, []);

  // Pin the shared stream open for as long as this surface is capturing, so
  // the idle timer cannot reclaim the device mid-sentence. Tied to the state
  // rather than to the individual start/stop/cancel/error paths, all of which
  // would otherwise have to remember to balance it.
  const capturing = listening || preparing;
  useEffect(() => {
    if (!capturing) return;
    holdMicrophone();
    return unholdMicrophone;
  }, [capturing]);

  /** Hint that speech is imminent (hover, focus) — never prompts. */
  const prewarm = useCallback(() => {
    void prewarmMicrophone();
  }, []);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || listening || startingRef.current) return;

    clearSubmitTimer();
    manualStopRef.current = false;
    startingRef.current = true;
    setPreparing(true);
    const seq = startSeqRef.current + 1;
    startSeqRef.current = seq;

    void (async () => {
      // Resolves on the spot when the prewarm already got there, which is the
      // whole point — what is left of the wait is the recognizer's own
      // handshake. Still awaited, because a first-time visitor (or a browser
      // that hides the permission state) reaches the prompt right here.
      await warmMicrophone();
      if (seq !== startSeqRef.current || !mountedRef.current) return;
      try {
        recognition.start();
        // listening flips on in onaudiostart, once capture truly begins;
        // startingRef stays set until then to block double-starts.
      } catch {
        /* start() throws if already started; ignore */
        if (seq === startSeqRef.current) {
          startingRef.current = false;
          setPreparing(false);
        }
      }
    })();
  }, [clearSubmitTimer, listening]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (finalTranscriptRef.current.trim()) {
      submitFinalTranscript(true);
      return;
    }
    manualStopRef.current = true;
    startSeqRef.current += 1;
    startingRef.current = false;
    try {
      recognition.stop();
    } catch {
      /* noop */
    }
    setPreparing(false);
    setListening(false);
  }, [submitFinalTranscript]);

  /** Discard everything captured so far and stop listening — nothing is submitted. */
  const cancel = useCallback(() => {
    clearSubmitTimer();
    finalTranscriptRef.current = "";
    manualStopRef.current = false;
    startSeqRef.current += 1;
    startingRef.current = false;
    try {
      recognitionRef.current?.abort();
    } catch {
      /* noop */
    }
    setPreparing(false);
    setListening(false);
    setInterim("");
  }, [clearSubmitTimer]);

  return {
    listening,
    preparing,
    interim,
    supported,
    start,
    stop,
    cancel,
    prewarm,
  };
}
