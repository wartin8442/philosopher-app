"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ENDPOINT_SILENCE_MS = 1200;

/**
 * Voice input via the browser-native Web Speech API (free, no key).
 * Gracefully reports unsupported browsers so the UI can hide the mic button.
 */
export function useSpeechRecognition(
  onFinalResult: (transcript: string) => void,
) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const warmStreamRef = useRef<MediaStream | null>(null);
  const warmPromiseRef = useRef<Promise<void> | null>(null);
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
      setListening(false);
      if (finalTranscriptRef.current.trim()) scheduleSubmit();
      else setInterim("");
    };
    recognition.onend = () => {
      startingRef.current = false;
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
      warmStreamRef.current?.getTracks().forEach((track) => track.stop());
      warmStreamRef.current = null;
      try {
        recognition.abort();
      } catch {
        /* noop */
      }
    };
  }, [clearSubmitTimer, scheduleSubmit, submitFinalTranscript]);

  const warmMicrophone = useCallback(async () => {
    if (warmStreamRef.current || warmPromiseRef.current) {
      await warmPromiseRef.current;
      return;
    }
    if (typeof navigator === "undefined") return;
    const getUserMedia = navigator.mediaDevices?.getUserMedia;
    if (!getUserMedia) return;

    warmPromiseRef.current = getUserMedia
      .call(navigator.mediaDevices, { audio: true })
      .then((stream) => {
        if (!mountedRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        warmStreamRef.current = stream;
      })
      .catch(() => {
        /* denied or no mic; recognition.start() will surface the error */
      })
      .finally(() => {
        warmPromiseRef.current = null;
      });
    await warmPromiseRef.current;
  }, []);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || listening || startingRef.current) return;

    clearSubmitTimer();
    manualStopRef.current = false;
    startingRef.current = true;
    const seq = startSeqRef.current + 1;
    startSeqRef.current = seq;

    void (async () => {
      await warmMicrophone();
      if (seq !== startSeqRef.current || !mountedRef.current) return;
      try {
        recognition.start();
        setListening(true);
      } catch {
        /* start() throws if already started; ignore */
      } finally {
        if (seq === startSeqRef.current) startingRef.current = false;
      }
    })();
  }, [clearSubmitTimer, listening, warmMicrophone]);

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
    setListening(false);
  }, [submitFinalTranscript]);

  return { listening, interim, supported, start, stop };
}
