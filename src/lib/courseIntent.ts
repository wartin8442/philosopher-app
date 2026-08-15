/**
 * Reading a student's reply to "shall we move on, or do you have questions?".
 *
 * The lecture offers a button for this, but the microphone is right there and
 * saying "yes, go on" is the natural thing to do — so a short, plainly
 * affirmative reply advances the lesson instead of being sent to the model as
 * a question. Anything with real content in it is a question and goes to the
 * model, because misreading a question as consent skips past the very thing
 * the student stopped to ask about.
 *
 * The guards therefore run in one direction only: when in doubt, it is a
 * question.
 */

/** Beyond this, a reply is saying something, not just assenting. */
const MAX_WORDS = 9;

/** Anything here means the student is actually asking, whatever else they said. */
const INTERROGATIVE =
  /\?|\b(?:what|why|how|who|whom|whose|when|where|which|explain|elaborate|clarify|define|mean|means|meaning|difference|example|confus\w*|understand|unclear|lost|wait|question|but|though|however|repeat|again|back|say more|tell me)\b/i;

const AFFIRMATIVE =
  /\b(?:yes|yeah|yep|yup|ya|sure|ok|okay|alright|right|fine|please|continue|carry on|keep going|go on|go ahead|onward|proceed|move on|next|onto|ready|do|good|great|perfect|makes sense|understood|got it|sounds good|let'?s go)\b/i;

const NEGATIVE = /\b(?:no|nope|nah|none|nothing|neither|all good|i'?m good|that'?s all|that'?s it|done|finished)\b/i;

function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** True for a short reply that plainly means "carry on with the lecture". */
export function meansContinue(text: string): boolean {
  const reply = text.trim();
  if (!reply || words(reply) > MAX_WORDS) return false;
  if (INTERROGATIVE.test(reply)) return false;
  return AFFIRMATIVE.test(reply);
}

/**
 * True for a short reply that plainly means "no, I have no questions" — the
 * other way of accepting the last section's "Any questions?".
 */
export function meansNoQuestions(text: string): boolean {
  const reply = text.trim();
  if (!reply || words(reply) > MAX_WORDS) return false;
  if (INTERROGATIVE.test(reply)) return false;
  return NEGATIVE.test(reply);
}
