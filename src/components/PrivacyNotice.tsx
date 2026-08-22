"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The app's privacy disclosure, as a link that opens an overlay.
 *
 * A dialog rather than a route on purpose. The notice has to be reachable from
 * every screen for the same reason AiDisclaimer is (deep links land straight in
 * a conversation, so "it's on the explore page" is not good enough), and a
 * voice conversation is a bad thing to navigate away from mid-sentence — the
 * mic surface unmounts, the stream is released, and coming back restarts the
 * whole warmup. An overlay leaves the page underneath alive.
 *
 * Dismissal follows SettingsPanel exactly: backdrop click, the ✕, or Escape.
 *
 * The content below describes what the app ACTUALLY does today. If the data
 * flow changes, this changes with it — see the note above "Counting visits".
 */

/** Shown at the foot of the notice; bump when the substance changes. */
const LAST_UPDATED = "22 August 2026";

/**
 * Where to reach you about this notice. A privacy disclosure is not much use
 * without a contact route, so this has to stay a real, monitored address.
 *
 * It is rendered in full as both link text and `mailto:`, which means it is
 * public and scrapeable. Worth moving to a dedicated alias or a domain address
 * if the site ever takes real traffic.
 */
const CONTACT_EMAIL = "willmartin8442@gmail.com";

function Section({
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

function PrivacyDialog({ onClose }: { onClose: () => void }) {
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

  // This document is long enough to scroll. Without the lock, a flick past the
  // end of the panel scrolls the page behind it instead, and closing leaves the
  // reader somewhere they never chose to be.
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-notice-title"
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
          <h2
            id="privacy-notice-title"
            className="font-serif text-xl text-parchment"
          >
            Privacy
          </h2>
          <button
            onClick={onClose}
            aria-label="Close privacy notice"
            title="Close (Esc)"
            className="-m-2 rounded-full p-2 text-muted transition duration-150 hover:text-parchment active:scale-90"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6 pt-1 text-left">
          <p className="mt-4 rounded-lg border border-ink-700 bg-ink-800/60 p-3 text-[13px] leading-relaxed text-parchment">
            The short version: there are no accounts, and nothing you say or
            type is stored on this site — not on a server, not in a database,
            not in a log. Your words are sent to the AI services that produce a
            reply, and then they are gone.
          </p>

          <Section title="What this app is">
            <p>
              A place to talk with AI simulations of historical philosophers, or
              to listen to a written lecture. You can speak or type. There is no
              sign-up, no profile, and no way for anyone here to know who you
              are.
            </p>
          </Section>

          <Section title="When you speak">
            <p>
              Speech is turned into text by your own browser, using its built-in
              speech recognition. This is worth knowing:{" "}
              <span className="text-parchment">
                most browsers do that by sending your audio to their own
                servers
              </span>{" "}
              — Chrome and Edge to Google, Safari to Apple — under those
              companies&rsquo; privacy policies, not this one. It happens
              whenever a website uses the browser&rsquo;s speech feature.
            </p>
            <p>
              This site never receives your audio. It receives only the text
              your browser produced, and only once you stop speaking. The
              recording itself is never sent here, never saved, and never
              written to a file.
            </p>
            <p>
              Your microphone is only opened on a page with a voice control, and
              your browser will ask permission the first time. You can withdraw
              it at any point in your browser&rsquo;s site settings, and the app
              still works fully by typing.
            </p>
          </Section>

          <Section title="Where your words go">
            <p>
              Whether you speak or type, your message is sent to an AI model
              provider — by default{" "}
              <span className="text-parchment">Anthropic (Claude)</span> — which
              writes the philosopher&rsquo;s reply. It is sent through this
              site&rsquo;s server, which passes it on without saving a copy.
            </p>
            <p>
              If high-quality voice is switched on, the{" "}
              <span className="text-parchment">reply</span> is sent to{" "}
              <span className="text-parchment">ElevenLabs</span> to be spoken
              aloud. Only the philosopher&rsquo;s words go there — never yours.
              Without that service the app falls back to your browser&rsquo;s
              own voice, and nothing leaves your device at all.
            </p>
            <p>
              These providers handle your message under their own terms.
              Conversations sent through their APIs are not used to train their
              models, but they may retain them briefly for abuse monitoring.
            </p>
          </Section>

          <Section title="What is not kept">
            <p>
              No conversation, question, or lecture interruption is written to a
              database or a log file here. Nothing survives the request that
              produced it. When something goes wrong, the error report records
              the technical fault only — never what you said.
            </p>
            <p>
              Because nothing is stored and nothing identifies you, there is no
              history to hand over and no account to delete. Closing the tab
              ends it.
            </p>
          </Section>

          <Section title="What is stored on your device">
            <p>
              A few small preferences are kept in your own browser so the app
              behaves sensibly between visits: your answer level, whether voice
              output is on, whether the sources panel is showing, and which
              philosopher you last looked at. These never leave your device and
              are not used to track you.
            </p>
            <p>
              Clearing your browser&rsquo;s site data for this site removes all
              of them.
            </p>
          </Section>

          {/*
            Analytics section. Accurate for Vercel Web Analytics as installed in
            app/layout.tsx: cookieless, identity is a hash of the request with a
            salt that rotates daily, so nobody is followed across days or sites.
            If a tool with a persistent identifier is ever added, this paragraph
            stops being true and must be rewritten — and that tool needs consent
            before it loads, not a disclosure after the fact.
          */}
          <Section title="Counting visits">
            <p>
              Page visits are counted with Vercel Web Analytics, so it is
              possible to see roughly how many people used the site and which
              pages they reached. It sets no cookies and builds no profile: it
              identifies a visit with a scrambled code that is discarded and
              regenerated every day, so it cannot follow you between days or on
              to other sites.
            </p>
            <p>
              It records the page, a rough location by country, and the browser
              type. It never records what you said.
            </p>
          </Section>

          <Section title="Keeping the site up">
            <p>
              The site is hosted by Vercel, which records ordinary web-server
              information about requests, including IP addresses, as any web
              host does.
            </p>
            <p>
              Your IP address is also used momentarily to enforce rate limits,
              which stop one visitor from flooding the AI services and running
              up costs. It is held only as a counter for a few seconds or
              minutes and then expires. It is never tied to anything you said.
            </p>
          </Section>

          <Section title="Embedded video">
            <p>
              Some pages embed YouTube clips using its no-cookie service, which
              does not set tracking cookies unless you press play. If you do,
              YouTube&rsquo;s own privacy policy applies to that playback.
            </p>
          </Section>

          <Section title="Children">
            <p>
              This site is not aimed at children under 13, and since it asks for
              no personal details, it does not knowingly collect any from them.
            </p>
          </Section>

          <Section title="A reminder about the philosophers">
            <p>
              Every philosopher here is an AI simulation, not the real person
              and not a substitute for their writing. It can be wrong. Nothing
              said here is professional advice of any kind — medical,
              psychological, legal, or otherwise. If you are struggling, please
              speak to someone qualified.
            </p>
          </Section>

          <Section title="Changes and contact">
            <p>
              If what the app does with your words changes, this notice changes
              with it, and the date below will move.
            </p>
            <p>
              Questions about any of this can go to{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-parchment underline decoration-ink-600 underline-offset-2 transition hover:decoration-parchment"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>

          <p className="mt-6 border-t border-ink-700 pt-3 text-[11px] text-muted">
            Last updated {LAST_UPDATED}.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * The link itself. Inherits type styling from whatever it sits in, so it reads
 * as part of the disclaimer rather than as a control bolted underneath it.
 */
export default function PrivacyNotice({
  className = "",
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`underline decoration-ink-600 underline-offset-2 transition duration-150 hover:text-parchment hover:decoration-parchment ${className}`}
      >
        Privacy &amp; your data
      </button>
      {open && <PrivacyDialog onClose={() => setOpen(false)} />}
    </>
  );
}
