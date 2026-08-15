"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AiDisclaimer from "@/components/AiDisclaimer";
import Portrait from "@/components/Portrait";
import SafetyNotice from "@/components/SafetyNotice";
import {
  BRANCHES,
  INTENT_QUESTION,
  PERSUASION_QUESTION,
  TOPIC_GROUPS,
  TOPIC_LABELS,
  type BranchAnswer,
  type IntentChoice,
} from "@/lib/diagnostic";
import { GROUP_LABELS, cardHook } from "@/lib/diagnosticCopy";
import { disposeFreeText } from "@/lib/diagnosticSafety";
import { buildSubmission } from "@/lib/diagnosticSubmission";
import type { PhilosopherDisplay } from "@/lib/philosopherDisplay";
import { useSettings } from "@/lib/settings";
import { duelTopicSource, getDuelTopics } from "@/lib/starters";
import { oppositePole, type Approach, type DiagnosticTopic, type Pole } from "@/lib/types";

/**
 * The diagnostic router's six screens (docs/diagnostic_routing_design.md).
 *
 * Topic → three branch questions → what persuades you → what you want from
 * this → a shelf of eight. Every step is a pure function of clicks: the groups
 * arrive precomputed from the server component (see app/start/page.tsx), so
 * this flow makes no network call at all and cannot be broken by a model
 * outage. That is the design's hardest requirement on the feature, and the
 * cheapest way to satisfy it is not to have the dependency.
 *
 * The stage-3 rerank has a place to land when it is built: `buildSubmission`
 * already assembles the payload, including the free text that is cleared to
 * send, and `resolveShelf` in routing.ts will accept or discard what comes
 * back. Nothing here has to change shape for that.
 *
 * On free text, the rule from docs/diagnostic_safety_design.md §11 is
 * absolute: every path that moves it goes through `disposeFreeText()`, and the
 * conditions are never re-derived at a call site. This component calls it in
 * exactly one place — to decide whether to show the notice — and reads
 * everything else off the submission object.
 */

/** A shelf card: the display projection plus `blurb` as the hook's fallback. */
export interface ShelfCard extends PhilosopherDisplay {
  blurb: string;
}

/** The twenty precomputed groups, ten topics × two poles. */
export type ShelfGroups = Record<DiagnosticTopic, Record<Pole, ShelfCard[]>>;

const GOLD = "#c9a24b";

export default function DiagnosticFlow({ groups }: { groups: ShelfGroups }) {
  /**
   * The intro sits in front of screen 1 rather than on its own route: the
   * whole flow is one URL, and a visitor who arrives from the landing page
   * should be able to read what they are about to do and leave without ever
   * loading a second page.
   */
  const [started, setStarted] = useState(false);
  const [topic, setTopic] = useState<DiagnosticTopic | null>(null);
  const [answers, setAnswers] = useState<BranchAnswer[]>([]);
  const [approach, setApproach] = useState<Approach | null>(null);
  const [intent, setIntent] = useState<IntentChoice | null>(null);
  /** 0 = topic, 1…n = branch questions, n+1 = persuasion, n+2 = intent, n+3 = results. */
  const [screen, setScreen] = useState(0);

  const branch = topic ? BRANCHES[topic] : null;
  const questionCount = branch?.questions.length ?? 3;
  const totalScreens = 1 + questionCount + 2;
  const resultsScreen = totalScreens;

  const submission = useMemo(() => {
    if (!branch || !approach || !intent) return null;
    return buildSubmission(branch, answers, approach, intent);
  }, [branch, answers, approach, intent]);

  // Question 6 sets the default answer level — the design's answer to
  // `AnswerLevel` otherwise being a toggle users have to discover. Written
  // once the flow is complete, and only after storage has loaded, so it
  // patches the user's saved settings rather than racing them.
  const { settings, update, loaded } = useSettings();
  useEffect(() => {
    if (!loaded || !intent || screen !== resultsScreen) return;
    if (settings.answerLevel === intent.level) return;
    update({ answerLevel: intent.level });
  }, [loaded, intent, screen, resultsScreen, settings.answerLevel, update]);

  function chooseTopic(next: DiagnosticTopic) {
    setTopic(next);
    setAnswers([]);
    setScreen(1);
  }

  function answerQuestion(index: number, patch: Partial<BranchAnswer>) {
    setAnswers((prev) => {
      const next = [...prev];
      // -1 is "no click yet", which the Next button checks for.
      const previous: BranchAnswer = next[index] ?? { option: -1 };
      next[index] = { ...previous, ...patch };
      return next;
    });
  }

  function restart() {
    setStarted(false);
    setTopic(null);
    setAnswers([]);
    setApproach(null);
    setIntent(null);
    setScreen(0);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-6 pb-20 pt-10">
      <nav className="mb-10 flex items-center justify-between gap-4">
        {/* The same pill the /explore and /why-philosophy pages use, so every
            route out of the app's second level looks like one control. */}
        <Link
          href="/"
          className="inline-flex rounded-full border border-ink-700 bg-ink-950/70 px-4 py-2 text-sm text-muted transition duration-150 hover:border-parchment hover:text-parchment active:scale-95"
        >
          ← Home
        </Link>
        <span className="text-[12px] uppercase tracking-[0.2em] text-muted">
          {!started ? null : screen < resultsScreen ? (
            <>
              Step {screen + 1} of {totalScreens}
            </>
          ) : (
            <button
              type="button"
              onClick={restart}
              className="uppercase tracking-[0.2em] transition-colors hover:text-parchment"
            >
              Start again
            </button>
          )}
        </span>
      </nav>

      {!started && <IntroScreen onStart={() => setStarted(true)} />}

      {started && screen === 0 && <TopicScreen onChoose={chooseTopic} />}

      {branch &&
        screen >= 1 &&
        screen <= questionCount &&
        (() => {
          const index = screen - 1;
          const question = branch.questions[index];
          const answer = answers[index];
          // The one call to the matcher in this component. Everything else
          // that touches this text reads the submission object.
          const disposition = disposeFreeText(answer?.text);
          // Safety §11, ruling B: once any answer on this branch has flagged,
          // the "one line is plenty" invitation stops for the rest of the
          // branch. The box stays — withdrawing it would read as a punishment
          // for having said something.
          const branchFlagged = branch.questions.some((_, i) =>
            disposeFreeText(answers[i]?.text).showNotice,
          );

          return (
            <section>
              <p className="mb-6 text-[13px] uppercase tracking-[0.2em] text-muted">
                {TOPIC_LABELS[branch.topic]}
              </p>

              {question.scenario && (
                <p className="mb-5 rounded-xl border border-ink-800 bg-ink-900/40 p-5 leading-relaxed text-parchment/90">
                  {question.scenario}
                </p>
              )}

              <h1 className="font-serif text-[26px] leading-snug text-parchment">
                {question.prompt}
              </h1>

              <label className="mt-6 block">
                <span className="sr-only">Your answer, in your own words</span>
                <textarea
                  value={answer?.text ?? ""}
                  onChange={(e) => answerQuestion(index, { text: e.target.value })}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-ink-700 bg-ink-900/60 p-4 leading-relaxed text-parchment placeholder:text-muted/70 focus:border-ink-600"
                  placeholder="In your own words…"
                />
              </label>
              {!branchFlagged && (
                <p className="mt-2 text-xs italic text-muted">
                  One line is plenty. This is optional.
                </p>
              )}
              {disposition.showNotice && <SafetyNotice />}

              <p className="mb-3 mt-8 text-sm text-muted">Or pick the closest:</p>
              <ul className="space-y-3">
                {question.options.map((option, optionIndex) => {
                  const chosen = answer?.option === optionIndex;
                  return (
                    <li key={option.key}>
                      <button
                        type="button"
                        onClick={() => answerQuestion(index, { option: optionIndex })}
                        className="w-full rounded-xl border p-4 text-left leading-relaxed transition-colors"
                        style={{
                          borderColor: chosen ? GOLD : "#26262e",
                          background: chosen ? `${GOLD}18` : "transparent",
                          color: chosen ? "#e8e2d4" : "#c8c2b6",
                        }}
                        aria-pressed={chosen}
                      >
                        {option.text}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <Footer
                onBack={() => setScreen(screen - 1)}
                onNext={() => setScreen(screen + 1)}
                // An option click is required on every branch question; the
                // box is optional throughout (D13).
                nextDisabled={!answer || answer.option < 0}
                nextLabel={screen === questionCount ? "Nearly there" : "Next"}
              />
            </section>
          );
        })()}

      {branch && screen === questionCount + 1 && (
        <ChoiceScreen
          eyebrow="What persuades you"
          prompt={PERSUASION_QUESTION.prompt}
          options={PERSUASION_QUESTION.options.map((option) => ({
            key: option.key,
            text: option.text,
            chosen: approach === option.approach,
            onPick: () => setApproach(option.approach),
          }))}
          onBack={() => setScreen(screen - 1)}
          onNext={() => setScreen(screen + 1)}
          nextDisabled={!approach}
        />
      )}

      {branch && screen === questionCount + 2 && (
        <ChoiceScreen
          eyebrow="Last one"
          prompt={INTENT_QUESTION.prompt}
          options={INTENT_QUESTION.options.map((option) => ({
            key: option.key,
            text: option.text,
            chosen: intent?.key === option.key,
            onPick: () => setIntent(option),
          }))}
          onBack={() => setScreen(screen - 1)}
          onNext={() => setScreen(screen + 1)}
          nextDisabled={!intent}
          nextLabel="Show me"
        />
      )}

      {branch && submission && intent && screen === resultsScreen && (
        <Results
          groups={groups}
          topic={branch.topic}
          pole={submission.pole}
          mixed={submission.mixed}
          intent={intent}
        />
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------
 * The intro
 * ---------------------------------------------------------------------- */

/**
 * What the visitor sees before question 1.
 *
 * D11 — the diagnostic is *offered, not forced* — and this screen is where the
 * offer is actually made: it says what the thing is and lets someone turn back
 * before investing anything. That matters more here than usual, because the
 * flow is six screens and the design records that length as the live drop-off
 * risk.
 *
 * The question count is stated honestly for the same reason. A visitor
 * promised "three or four" who is still answering at screen five has been
 * misled by their own onboarding, which is a worse trade than the slightly
 * larger number costs at the door.
 */
function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <section className="flex min-h-[62vh] flex-col items-center justify-center text-center">
      <p className="mb-6 text-[12px] uppercase tracking-[0.3em] text-muted">
        Where to start
      </p>
      <p className="max-w-xl font-serif text-[22px] leading-relaxed text-parchment">
        This is a short, six-question quiz to direct you to philosophers who
        talk about topics that you find interesting. It costs nothing to
        complete.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-12 rounded-full border border-ink-600 bg-ink-800 px-8 py-3 text-parchment transition duration-150 hover:border-parchment hover:bg-ink-700 active:scale-95"
      >
        Take the Quiz
      </button>
    </section>
  );
}

/* -------------------------------------------------------------------------
 * Screen 1 — topic
 * ---------------------------------------------------------------------- */

function TopicScreen({ onChoose }: { onChoose: (topic: DiagnosticTopic) => void }) {
  return (
    <section>
      <h1 className="font-serif text-[30px] leading-snug text-parchment">
        Which of these is actually on your mind?
      </h1>
      <p className="mt-3 max-w-xl leading-relaxed text-muted">
        Pick one. Six short screens later you&rsquo;ll have eight philosophers
        worth your time — four who start near where you do, and four who
        won&rsquo;t.
      </p>

      <div className="mt-10 space-y-9">
        {TOPIC_GROUPS.map((group) => (
          <div key={group.heading}>
            <h2 className="mb-3 text-[12px] uppercase tracking-[0.25em] text-muted">
              {group.heading}
            </h2>
            <ul className="space-y-2">
              {group.choices.map((choice) => (
                <li key={choice.topic}>
                  <button
                    type="button"
                    onClick={() => onChoose(choice.topic)}
                    className="w-full rounded-xl border border-ink-800 p-4 text-left leading-relaxed text-parchment/90 transition-colors hover:border-ink-600 hover:bg-ink-900/50 hover:text-parchment"
                  >
                    {choice.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
 * Screens 5 and 6 — the two universal questions
 * ---------------------------------------------------------------------- */

function ChoiceScreen({
  eyebrow,
  prompt,
  options,
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
}: {
  eyebrow: string;
  prompt: string;
  options: { key: string; text: string; chosen: boolean; onPick: () => void }[];
  onBack: () => void;
  onNext: () => void;
  nextDisabled: boolean;
  nextLabel?: string;
}) {
  return (
    <section>
      <p className="mb-6 text-[13px] uppercase tracking-[0.2em] text-muted">
        {eyebrow}
      </p>
      <h1 className="font-serif text-[26px] leading-snug text-parchment">{prompt}</h1>

      <ul className="mt-8 space-y-3">
        {options.map((option) => (
          <li key={option.key}>
            <button
              type="button"
              onClick={option.onPick}
              className="w-full rounded-xl border p-4 text-left leading-relaxed transition-colors"
              style={{
                borderColor: option.chosen ? GOLD : "#26262e",
                background: option.chosen ? `${GOLD}18` : "transparent",
                color: option.chosen ? "#e8e2d4" : "#c8c2b6",
              }}
              aria-pressed={option.chosen}
            >
              {option.text}
            </button>
          </li>
        ))}
      </ul>

      <Footer
        onBack={onBack}
        onNext={onNext}
        nextDisabled={nextDisabled}
        nextLabel={nextLabel}
      />
    </section>
  );
}

function Footer({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "Next",
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="mt-10 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-muted transition-colors hover:text-parchment"
      >
        ← Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="rounded-full border border-ink-600 bg-ink-800 px-6 py-3 text-parchment transition duration-150 enabled:hover:border-parchment enabled:hover:bg-ink-700 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {nextLabel}
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * The results screen
 * ---------------------------------------------------------------------- */

function Results({
  groups,
  topic,
  pole,
  mixed,
  intent,
}: {
  groups: ShelfGroups;
  topic: DiagnosticTopic;
  pole: Pole;
  mixed: boolean;
  intent: IntentChoice;
}) {
  const home = groups[topic][pole];
  const challenge = groups[topic][oppositePole(pole)];

  const blocks = [
    {
      // D12: these two headers are fixed. Only the subtitle is authored.
      heading: "Start with these",
      subtitle: GROUP_LABELS[topic][pole].home,
      cards: home,
      role: "home" as const,
    },
    {
      heading: "Try a different angle",
      subtitle: GROUP_LABELS[topic][oppositePole(pole)].challenge,
      cards: challenge,
      role: "challenge" as const,
    },
  ];
  // Question 6 changes which group is read first, never who is on it — both
  // groups are always present, so emphasis shifts without a filter bubble.
  const ordered = intent.leadWith === "challenge" ? [blocks[1], blocks[0]] : blocks;

  const duels = useMemo(() => pickDuels(home, challenge), [home, challenge]);

  return (
    <section>
      <p className="mb-4 text-[13px] uppercase tracking-[0.2em] text-muted">
        {TOPIC_LABELS[topic]}
      </p>
      <h1 className="font-serif text-[28px] leading-snug text-parchment">
        Eight philosophers we think you&rsquo;ll find worth meeting.
      </h1>
      <p className="mt-3 leading-relaxed text-muted">
        {intent.note}
        {/* The design forbids turning an inference into a declaration about
            the user, so a split answer is reported as a property of the
            answers rather than as a claim about what they believe. */}
        {mixed && (
          <>
            {" "}
            Your answers didn&rsquo;t all pull the same way, so the two groups
            below are closer together than usual.
          </>
        )}
      </p>

      <div className="mt-10 space-y-12">
        {ordered.map((block) => (
          <div key={block.heading}>
            <h2 className="font-serif text-[22px] text-parchment">{block.heading}</h2>
            <p className="mt-2 max-w-2xl text-sm italic leading-relaxed text-muted">
              {block.subtitle}
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {block.cards.map((card) => (
                <li key={card.id}>
                  <Link
                    href={`/philosopher/${card.id}`}
                    className="flex h-full gap-4 rounded-xl border border-ink-800 p-4 transition-colors hover:border-ink-600 hover:bg-ink-900/50"
                  >
                    <div className="shrink-0">
                      <Portrait
                        initials={card.initials}
                        accent={card.accent}
                        size={56}
                        imageSrc={card.image}
                        crop={card.imageCrop}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-serif text-lg text-parchment">{card.name}</p>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-muted">
                        {card.dates}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-parchment/80">
                        {cardHook(topic, card.id) ?? card.blurb}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {duels.length > 0 && (
        <div className="mt-14">
          <h2 className="font-serif text-[22px] text-parchment">
            Or watch them argue
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Each of these puts someone from one group against someone from the
            other. The disagreement is the point.
          </p>
          <ul className="mt-6 space-y-3">
            {duels.map((duel) => (
              <li key={`${duel.a.id}|${duel.b.id}`}>
                <Link
                  href={`/duel?a=${duel.a.id}&b=${duel.b.id}`}
                  className="block rounded-xl border border-ink-800 p-4 transition-colors hover:border-ink-600 hover:bg-ink-900/50"
                >
                  <p className="text-[11px] uppercase tracking-[0.15em] text-muted">
                    {duel.a.name} vs {duel.b.name}
                  </p>
                  <p className="mt-1 leading-relaxed text-parchment/90">
                    {duel.question}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AiDisclaimer className="mx-0 mt-14" />
    </section>
  );
}

interface DuelSuggestion {
  a: ShelfCard;
  b: ShelfCard;
  question: string;
}

/**
 * D10 — duel content is selected, never generated.
 *
 * Four against four is sixteen cross-group pairs; a within-group pair is never
 * offered, because a duel is the two groups' disagreement made watchable. Of
 * the sixteen, prefer the hand-written `DUEL_TOPICS` entries over the ones
 * composed from `DEBATE_LENSES`, and give each philosopher at most one duel so
 * three suggestions show six different faces rather than one person three
 * times. A pair with no topics at all renders nothing — the generic
 * `FALLBACK_TOPICS` are deliberately not reachable from here.
 *
 * `duelTopicSource` is `hasCuratedTopics` with the distinction the gate
 * flattens; it takes the two ids so this module does not need the pair-key
 * helper, which starters.ts keeps private.
 */
function pickDuels(home: ShelfCard[], challenge: ShelfCard[]): DuelSuggestion[] {
  const pairs: { a: ShelfCard; b: ShelfCard; curated: boolean }[] = [];
  for (const a of home) {
    for (const b of challenge) {
      const source = duelTopicSource(a.id, b.id);
      if (source === "none") continue;
      pairs.push({ a, b, curated: source === "curated" });
    }
  }

  // Stable sort, so within the curated and composed tiers the shelf's own
  // order decides — the lead of each group meets the lead of the other first.
  const ordered = [...pairs].sort(
    (x, y) => Number(y.curated) - Number(x.curated),
  );

  const used = new Set<string>();
  const chosen: DuelSuggestion[] = [];
  for (const pair of ordered) {
    if (chosen.length === 3) break;
    if (used.has(pair.a.id) || used.has(pair.b.id)) continue;
    used.add(pair.a.id);
    used.add(pair.b.id);
    chosen.push({ a: pair.a, b: pair.b, question: getDuelTopics(pair.a.id, pair.b.id)[0] });
  }
  return chosen;
}
