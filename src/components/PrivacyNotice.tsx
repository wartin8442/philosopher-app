"use client";

import { useState } from "react";
import NoticeDialog, {
  NoticeSection as Section,
} from "@/components/NoticeDialog";

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
 * Keep the notice in sync with the features and services the app uses.
 */

/** Shown at the foot of the notice; bump when the substance changes. */
const LAST_UPDATED = "26 November 2026";

/**
 * Where to reach you about this notice. A privacy disclosure is not much use
 * without a contact route, so this has to stay a real, monitored address.
 *
 * It is rendered in full as both link text and `mailto:`, which means it is
 * public and scrapeable. Worth moving to a dedicated alias or a domain address
 * if the site ever takes real traffic.
 */
const CONTACT_EMAIL = "willmartin8442@gmail.com";

function PrivacyDialog({ onClose }: { onClose: () => void }) {
  return (
    <NoticeDialog
      id="privacy-notice"
      title="Privacy"
      closeLabel="Close privacy notice"
      onClose={onClose}
    >
      <p className="mt-4 rounded-lg border border-ink-700 bg-ink-800/60 p-3 text-[13px] leading-relaxed text-parchment">
        You can use this app without an account. AI providers process the text
        you submit. The app keeps no saved chat history and uses cookieless
        analytics to measure visits and feature use.
      </p>

      <Section title="What this app is">
        <p>
          A place to talk with AI simulations of historical philosophers, listen
          to a lesson, or start a debate. The guided philosopher finder uses your
          selections in your browser to recommend philosophers.
        </p>
      </Section>

      <Section title="When you speak">
        <p>
          Your browser&rsquo;s built-in speech recognition turns your speech
          into text. Depending on the browser and device, this may involve
          sending your audio to a speech recognition service under that
          provider&rsquo;s privacy policy. This site receives text from the
          browser. It does not receive or save microphone audio.
        </p>
        <p>
          During a conversation, the app can send partial transcripts to its
          server while you are still speaking so it can look up sources early.
          This can happen before you send or cancel a message.
        </p>
        <p>
          You can revoke microphone access in your browser&rsquo;s site
          settings and use the text controls instead.
        </p>
      </Section>

      <Section title="Where your words go">
        <p>
          The app&rsquo;s server sends conversation messages, lesson questions,
          and debate topics and interjections to its AI model provider, by
          default <span className="text-parchment">Anthropic (Claude)</span>.
          Earlier turns may be included for context. If you turn on Show sources,
          the model provider also receives your question and the reply again to
          identify which sources the reply drew on.
        </p>
        <p>
          For voice playback, the app sends the text it will read aloud to{" "}
          <span className="text-parchment">ElevenLabs</span> when available.
          This can include lesson narration and AI replies that quote or repeat
          part of your input. The browser provides the fallback voice and may
          synthesize it on your device or through its own service.
        </p>
        <p>
          These providers may retain the text they receive under their own data
          policies and settings.
        </p>
      </Section>

      <Section title="Conversation history and temporary processing">
        <p>
          The in-app transcript stays in the current page while you use it. The
          app keeps no saved conversation history. To speed up source lookups,
          the server can cache a simplified copy of your question or partial
          transcript and its search results in memory. Entries can be reused for
          up to five minutes.
        </p>
        <p>
          The app logs technical errors, which can include error details
          returned by its service providers.
        </p>
      </Section>

      <Section title="What is stored on your device">
        <p>
          Your browser remembers your answer levels, voice setting, and sources
          panel preference between visits. It also remembers the last philosopher
          you visited in the current tab. The app includes your answer level
          when requesting an AI reply.
        </p>
        <p>
          Clearing your browser&rsquo;s site data for this site removes all of
          them.
        </p>
      </Section>

      {/* Keep this in sync with app/layout.tsx and lib/analytics.ts. */}
      <Section title="Visits and feature use">
        <p>
          Vercel Web Analytics measures site traffic. Pageview data includes
          the page URL, where you came from, approximate location, and browser
          or device information.
        </p>
        <p>
          When enabled, PostHog measures page views, page exits, and interactions
          such as clicks and form submissions. Events can include page and
          referrer URLs, timestamps, and browser or device details. PostHog also
          records which philosopher you messaged, the turn number and whether
          voice output was on, which philosophers you chose for a debate, and which
          lessons you started, finished, or asked a question in.
        </p>
        <p>
          PostHog masks on-page text in interaction events. Message text,
          lesson questions, and debate topics are excluded from feature events.
          Session replay is off.
        </p>
        <p>
          Both tools count visits without setting analytics cookies or saving
          a visitor ID in your browser. PostHog uses your IP address, browser
          information, and the site&rsquo;s hostname to generate a temporary
          visitor ID, then strips the IP address from the event. Its visitor ID
          changes daily, so it cannot recognize you on another day. Vercel
          discards its visitor identifier after 24 hours. Both services can keep
          usage statistics beyond that window.
        </p>
      </Section>

      <Section title="Hosting and rate limits">
        <p>
          Vercel hosts the site and processes request information, including
          IP addresses, to deliver it and operate its infrastructure.
        </p>
        <p>
          The app uses your IP address to count API requests and enforce
          one-minute rate limits. These counters are stored in server memory or
          in Upstash Redis when configured. The counters contain request counts
          and timing information.
        </p>
      </Section>

      <Section title="Embedded video">
        <p>
          Some pages load YouTube&rsquo;s privacy-enhanced player when you press
          play. YouTube handles playback data under its own privacy policy.
        </p>
      </Section>

      <Section title="Children">
        <p>
          This site is intended for people aged 13 and older.
        </p>
      </Section>

      <Section title="A reminder about the philosophers">
        <p>
          Every philosopher here is an AI simulation, not the real person and
          not a substitute for their writing. It can be wrong. Nothing said here
          is professional advice of any kind — medical, psychological, legal, or
          otherwise. If you are struggling, please speak to someone qualified.
        </p>
      </Section>

      <Section title="Changes and contact">
        <p>
          For questions or requests about your data, email{" "}
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
    </NoticeDialog>
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
