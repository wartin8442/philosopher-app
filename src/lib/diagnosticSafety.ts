/**
 * Crisis-disclosure handling for the diagnostic router's optional free text.
 *
 * Design: docs/diagnostic_safety_design.md. Read it before changing the
 * patterns — the phrase list is the least important part of this file and the
 * reasoning around it is the load-bearing part.
 *
 * Why this is not in src/lib/security/: that directory handles injection and
 * abuse — a hostile user attacking the app. This handles a user in distress,
 * who is not an attacker and must never be treated as one. The two need
 * opposite responses (block vs. offer), so they are kept apart deliberately.
 *
 * Three properties make this design work, in order of importance:
 *
 *   1. It matches INTENT, never SUBJECT. The diagnostic's own questions ask
 *      about irreversible loss, mortality, and whether a life is worth living;
 *      Camus opens The Myth of Sisyphus by calling suicide the one serious
 *      philosophical problem. A keyword list containing "death", "suicide",
 *      "meaningless" would therefore fire on people engaging correctly, while
 *      missing "I can't do this anymore", which contains no risk vocabulary at
 *      all. Every pattern below anchors on the speaker's own situation.
 *   2. It is deterministic and runs client-side, before the text is sent
 *      anywhere. The routing design's governing rule is that the shelf must
 *      render with the model unavailable; if detection needed a model call, an
 *      outage would produce a diagnostic that still routes but stops noticing
 *      distress, which is the worst possible failure ordering.
 *   3. A hit never blocks. It shows an offer (see SafetyNotice) and stops the
 *      text propagating. The user finishes the quiz and gets the same shelf.
 *
 * This is a floor, not a classifier. It will miss things. Everything around it
 * is built so that missing something is not catastrophic.
 */

/** Which family of phrasing matched. Safe to count; never carries user text. */
export type DistressCategory = "intent" | "inability" | "harm";

export interface DistressCheck {
  flagged: boolean;
  /** Present only when flagged. For tests and aggregate counts. */
  category?: DistressCategory;
}

/**
 * Normalize before matching: lowercase, fold typographic apostrophes to ASCII
 * (phones insert these), and collapse whitespace so a line break inside a
 * phrase does not defeat a pattern.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * First-person present intent to die.
 *
 * Tense matters here and is deliberately inconsistent between patterns:
 *
 *   - Ordinary intensity idioms are excluded in the past ("I wanted to die of
 *     embarrassment", "I wanted to die when I saw the bill"), so those require
 *     the present "want/wanna/need".
 *   - Explicit self-harm language is NOT tense-filtered. "I tried to kill
 *     myself in 2009" is a disclosure worth answering, and the notice's
 *     conditional wording ("if any of this is about right now") lets the
 *     reader decide whether it applies to them — which is exactly the
 *     distinction a regex cannot draw and a person can.
 *
 * Note that bare "suicide" is absent by design: it is the philosophical term
 * (Camus), so it only counts inside a first-person construction.
 */
const INTENT: RegExp[] = [
  /\bi (?:want|wanna|need) (?:to )?(?:die|be dead)\b/,
  /\bi(?:'m| am) going to (?:kill myself|end (?:it all|it|my life)|die by suicide)\b/,
  /\bi (?:want|need|plan|intend) to (?:kill myself|end (?:it all|it|my life))\b/,
  /\b(?:killing|kill) myself\b/,
  /\b(?:end|ending) my (?:own )?life\b/,
  /\b(?:take|taking) my own life\b/,
  /\bi (?:don't|do not|dont) want to (?:be here|be alive|live|wake up|go on)\b/,
  /\bi(?:'ve| have)? ?(?:been )?think(?:ing)? about (?:suicide|killing myself|ending it)\b/,
  /\bi(?:'m| am) suicidal\b/,
  /\b(?:everyone|they'd all|you'd all|they would all)? ?be better off (?:without me|if i (?:was|were)n't here)\b/,
];

/**
 * Present-tense inability to continue. Each pattern requires an object that
 * means *living* — "there's no point" on its own is nihilism, which is the
 * what's-real branch's subject, not a crisis.
 */
const INABILITY: RegExp[] = [
  /\bi can'?t (?:go on|keep going|keep living|carry on)\b/,
  /\bi can'?t (?:do this|take (?:this|it)|keep doing this) any ?more\b/,
  /\bthere'?s no (?:point|reason) (?:in |to )?(?:going on|living|carrying on|being here)\b/,
  /\bno reason to (?:go on|live|carry on|be here)\b/,
  /\bnothing (?:left )?to live for\b/,
];

/**
 * Ongoing self-harm, and present-tense disclosures of being harmed by someone
 * else. The rules-branch and other-people questions can both reach these.
 */
const HARM: RegExp[] = [
  /\b(?:cutting|hurting|harming) myself\b/,
  /\bi (?:cut|hurt|harm) myself\b/,
  /\bi(?:'m| am) (?:being )?(?:abused|hit|beaten)\b/,
  /\bi(?:'m| am) not safe (?:at home|here|with)\b/,
  /\b(?:he|she|they) (?:hits|hurts|beats|abuses) me\b/,
  /\bmy (?:partner|husband|wife|boyfriend|girlfriend|dad|father|mum|mom|mother) (?:hits|hurts|beats|abuses) me\b/,
];

const FAMILIES: ReadonlyArray<readonly [DistressCategory, RegExp[]]> = [
  ["intent", INTENT],
  ["inability", INABILITY],
  ["harm", HARM],
];

/**
 * Check one free-text answer. Pure, synchronous, and safe to call on every
 * keystroke or on blur — there is no network and no model.
 */
export function checkForDistress(text: string | undefined | null): DistressCheck {
  if (!text) return { flagged: false };
  const normalized = normalize(text);
  if (!normalized) return { flagged: false };

  for (const [category, patterns] of FAMILIES) {
    for (const pattern of patterns) {
      if (pattern.test(normalized)) return { flagged: true, category };
    }
  }
  return { flagged: false };
}

/**
 * What the rest of the system is allowed to do with one free-text answer.
 *
 * This exists so the propagation rules live in one testable place rather than
 * being re-derived (and eventually got wrong) in the routing code, the
 * classifier call, and the results screen. The sharpest of them is
 * `seedConversation`: the results screen otherwise opens a philosopher
 * conversation seeded with what the user typed, and the personas are hardened
 * never to break character (see security/injection.ts). Seeding a simulated
 * Nietzsche with a suicide disclosure has to be structurally impossible, not
 * merely unlikely.
 *
 * Note what is NOT conditional: text is never persisted and never logged, flag
 * or no flag. Ephemerality is a property of the feature, not a crisis measure.
 */
export interface FreeTextDisposition {
  /** May the bounded rerank call include this text? */
  sendToModel: boolean;
  /** May a selected shelf card open a conversation seeded with it? */
  seedConversation: boolean;
  /** Should the offer notice be shown beside the box? */
  showNotice: boolean;
  /**
   * The only record permitted to leave the browser about this answer.
   * Deliberately not the text: test #8 needs click distributions, not prose.
   */
  analytics: {
    hadText: boolean;
    flagged: boolean;
    category?: DistressCategory;
  };
}

export function disposeFreeText(
  text: string | undefined | null,
): FreeTextDisposition {
  const hadText = Boolean(text && text.trim());
  const { flagged, category } = checkForDistress(text);
  return {
    sendToModel: hadText && !flagged,
    seedConversation: hadText && !flagged,
    showNotice: flagged,
    analytics: { hadText, flagged, ...(category ? { category } : {}) },
  };
}
