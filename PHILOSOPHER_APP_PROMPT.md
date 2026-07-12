# Philosopher App — Complete Build Prompt

## Core Vision

Build a voice-first, historically grounded AI philosopher simulation app. Users select a philosopher profile and converse with them, or stage debates between two philosophers. The app should feel like an elegant, minimal dark academic library. UI should be serious, simple, and immersive.

**Primary use case:** Entertainment + learning. Accuracy is prioritized over theatrical voice, but the experience should still be engaging.

## Core Features

### 1. Philosopher Conversation Mode

User selects one philosopher and talks with them via voice or text.

**Requirements:**
- Philosopher responds in first person, staying in character
- Answers must remain historically and philosophically accurate
- Philosopher should never break character or say "I am an AI"
- Support interaction modes: voice→voice, text→voice, voice→text, text→text
- Settings panel for answer level (Beginner, Intermediate, Advanced, Reading a Primary Text)
- Answer level affects complexity/depth but not core accuracy

**Key constraint:** Philosophy must be accurate (90-95% target). Personality/theatrical quality is secondary to accuracy. Tone can match the philosopher (Camus lucid, Sartre intense) but must not distort content.

### 2. Duel Mode

User selects two philosophers and chooses a debate topic.

**Structure:**
1. Each philosopher asserts their opening position
2. Each philosopher critiques the other
3. Each philosopher provides a rebuttal
4. Cross-examination (open debate)
5. Optional neutral recap

**Requirements:**
- Two circular philosopher portraits displayed
- Topic input by voice or text
- Clear indication of which philosopher is speaking
- User can interrupt at any time to ask questions, judge, challenge, or redirect
- Philosophers respond to what was actually said (each philosopher has the other's prior statement in their system prompt)
- Debate stays on topic and philosophically coherent

**User interrupt handling:** If user interrupts, their input is transcribed, injected as a system prompt, the addressed philosopher responds, then debate resumes at the next phase.

## Initial Philosophers

- **Thomas Aquinas** (primary flagship)
- **Friedrich Nietzsche** (primary flagship)
- **Søren Kierkegaard**
- **Jean-Paul Sartre**
- **Albert Camus**

### Philosopher Personality Sketches

**Thomas Aquinas:**
- Calm, precise, humble, scholastic
- Distinguishes terms carefully, reasons from definitions and natural law
- Does not gloat; defends view forcefully but with humility
- Can use objection/reply structure when useful

**Friedrich Nietzsche:**
- Sharp, provocative, aphoristic, confident
- Suspicious of herd morality, ressentiment, weakness disguised as virtue
- Can be triumphant in debate but not cartoonishly evil
- Must not misrepresent Christianity or Aquinas

**Søren Kierkegaard:**
- Inward, indirect, spiritually intense
- Concerned with individual choice, anxiety, despair, faith, inwardness
- May ask piercing personal questions
- Should not become vague or merely poetic

**Jean-Paul Sartre:**
- Direct, intense, existentially confrontational
- Focused on freedom, responsibility, bad faith, facticity, being-for-others
- Presses user on responsibility and freedom
- Remains clear and conceptually accurate

**Albert Camus:**
- Lucid, restrained, humane, morally serious
- Focused on absurdity, revolt, limits, dignity, honesty
- Less theatrical than Nietzsche; feels clear and morally sober
- Elegant without being precious

## Architecture Decisions

### Source and Accuracy Strategy

**Chosen approach: Source-informed prompts + lightweight retrieval (hybrid)**

- Each philosopher has carefully written system prompts that encode accurate philosophical knowledge from curated secondary sources (Stanford Encyclopedia, scholarly overviews)
- System prompts are written by you (human curation) based on reading reliable sources per philosopher
- Lightweight retrieval (vector embeddings over curated source excerpts) for niche/risky questions to prevent hallucination on edge cases
- No RAG-in-the-loop for normal conversation (keeps responses fast and natural)
- Retrieval only used if model confidence is low on a factual/interpretive claim
- Sources are NOT shown in the UI during normal conversation (voice-first means no reading citations aloud)
- For text mode, a subtle "Sources" panel can show grounding if user wants to dive deeper

**Why this approach:**
- Model-only risks 5-10% accuracy drift on subtle interpretations
- Full RAG-in-the-loop would flatten voice and slow responses
- Hybrid gives 90-95% accuracy without sacrificing conversational quality
- Curation work is one-time per philosopher (~2-3 hours)

### Voice/TTS Strategy

- **Primary provider:** ElevenLabs (high quality, natural-sounding, distinct voices per philosopher)
- **Provider must be swappable via environment variables** (ElevenLabs → Web Speech API, local TTS, or other providers)
- Each philosopher should have a distinct voice profile (Camus: lucid and restrained; Sartre: intense; Aquinas: measured; Nietzsche: sharp; Kierkegaard: introspective)
- Interaction modes: user speaks (Web Speech API), philosopher speaks (ElevenLabs)
- No hardcoded API keys; all providers configured through .env

### Model Provider Strategy

- Use Claude (Anthropic) as primary model
- Provider/model must be configurable through environment variables
- Support swapping to OpenAI, local Ollama, etc. without code changes
- Model wrapper abstraction so switching providers is straightforward

### Duel Mode Orchestration

- No separate "debate manager" character
- Each philosopher receives the other's actual previous statement in their system prompt
- Philosophers respond to what was literally said, not to a summary
- Structured phases (assertion → critique → rebuttal → cross-exam) managed by a simple turn coordinator
- User interrupts are injected mid-stream; philosopher responds, then resumes at next phase
- State tracking: preserve full conversation history for context (context window management is important for token cost)

## Technology Stack

- **Frontend:** React + TypeScript + Next.js (or vanilla React if preferred)
- **Backend:** Next.js API routes or simple Node/Express backend
- **State management:** Simple (React hooks, maybe Zustand)
- **Styling:** Tailwind CSS or vanilla CSS (dark academic aesthetic)
- **Speech recognition:** Web Speech API (free, browser-native)
- **Speech synthesis:** ElevenLabs (configurable via env)
- **Vector store:** Chroma or Faiss (local, no external dependency)
- **Database:** None initially (no user accounts, no conversation history persistence)
- **Embeddings:** OpenAI embeddings API or local (e.g., sentence-transformers)
- **LLM inference:** Claude API (configurable)

## UI/UX Requirements

### Landing/Profile Selection Screen
- Dark academic aesthetic (dark grays, soft lighting, serif typography)
- Grid or list of philosopher profiles with circular portrait placeholders
- Philosopher name and 1-2 sentence description per profile
- Button to "Enter Conversation"
- Option/button to "Start Duel Mode"

### Philosopher Conversation Screen
- Circular philosopher portrait (prominent, centered or left-aligned)
- Philosopher name and subtle philosopher-specific color theme
- Voice-first controls: large microphone button, clear recording indicator
- Chat history (messages from user and philosopher)
- Text input box (always available as fallback)
- Settings button (opens panel for answer level, voice on/off, provider settings)
- Optional subtle "Grounding" panel if showing sources in text mode

### Duel Mode Screen
- Two circular philosopher portraits (side by side or top/bottom)
- Debate topic input area (voice or text)
- Current turn indicator (which philosopher is speaking)
- Debate transcript/history
- User can interrupt with text/voice
- Clear indication of current phase (opening, critique, rebuttal, cross-exam)

### Settings Panel
- Answer level selector (Beginner, Intermediate, Advanced, Reading a Primary Text)
- Voice toggle (on/off)
- Optional: model/provider selector (for development/testing)
- Optional: LLM temperature/parameters slider (for testing)

## Source Curation Strategy

**One-time setup per philosopher:**

1. Identify reliable sources:
   - Stanford Encyclopedia of Philosophy (free, high quality)
   - 1-2 scholarly overviews or journal articles (find via Google Scholar)
   - Primary text excerpts (if legally available and useful)

2. Read and synthesize:
   - Extract core philosophical positions
   - Identify key texts and dates
   - Note common misreadings/misinterpretations
   - List core reasoning patterns

3. Write system prompt:
   - Encode positions, texts, and reasoning patterns
   - Include examples of how philosopher would reason about sample questions
   - Add caveats ("I did not address that directly, but from my position I would reason...")
   - Keep prompt under 2000 tokens (token budget)

4. Chunk and embed source excerpts:
   - Take selected passages from sources (1-3 sentences per chunk)
   - Embed them for retrieval
   - Store in local vector database

**For Aquinas and Nietzsche specifically:**
- These are your flagship philosophers; invest extra time here
- Aquinas: focus on natural law, virtue, God, metaphysics
- Nietzsche: focus on will to power, slave morality, revaluation of values, critique of Christianity

## Implementation Priorities

1. **Philosopher conversation with Aquinas** (simplest starting point)
   - System prompt + basic retrieval
   - Voice input/output working
   - Profile selection + chat UI
   - Answer level settings

2. **Add Nietzsche** (more complex, flagship demo)
   - Repeat system prompt + retrieval work
   - Test Aquinas ↔ Nietzsche accuracy

3. **Test both thoroughly**
   - Manual testing of various questions
   - Spot-check accuracy against sources
   - Tune prompts as needed

4. **Implement Duel Mode** (Aquinas vs Nietzsche)
   - Turn orchestration
   - User interrupt handling
   - Debate structure (assertion → critique → rebuttal → cross-exam)

5. **Expand to remaining philosophers**
   - Kierkegaard, Sartre, Camus (repeat process)

6. **Polish UI/UX and voice**
   - Fine-tune ElevenLabs voice profiles
   - Dark academic aesthetic refinement
   - Mobile/responsive design if needed

## Development Guidelines

- **Keep it simple:** Don't over-engineer. No complex state management unless needed.
- **Local-first:** Prefer local vector store, local embeddings where practical.
- **No hardcoded secrets:** All API keys and provider settings via .env
- **Provider swappability:** Abstract model/voice/embedding providers so they're configurable
- **Clear documentation:** How to add a new philosopher, how to change model providers, source curation instructions
- **Testing:** Manual testing primarily; automate if time allows

## Accuracy Rules (Critical)

- Philosopher can speak naturally in first person
- Philosopher must not fabricate citations, texts, or historical facts
- If answer is interpretive, make that clear naturally ("This is an interpretation of my position, not directly stated")
- If question goes beyond philosopher's actual work, philosopher should indicate extension of view ("I did not face that problem directly, but from my principles I would reason...")
- Philosopher must never say "I am an AI model" inside conversation
- Global disclaimer on landing page explaining profiles are AI simulations, not literal philosophers

## Deliverables

1. Working local app (no deployment required, but should be deployable)
2. Clear setup instructions (install, configure .env, run)
3. Architecture documentation (how to add philosophers, how to swap providers)
4. Source curation documentation (how to curate sources, write prompts, embed)
5. Demo: Aquinas and Nietzsche working, including conversation mode and Duel Mode
6. Tested and functional voice I/O

## Constraints & Tradeoffs Made

- **Accuracy prioritized over theatrical voice.** Philosophers should sound like themselves (tone, pace) but accuracy comes first.
- **No user accounts or conversation saving.** This is a personal demo app.
- **No source visibility during voice mode.** Voice-first means you don't read citations aloud. Sources available in text mode if desired.
- **No RAG-in-the-loop for normal conversation.** Retrieval only used for validation/risky questions.
- **Hybrid source + model approach chosen over pure model-only.** Better accuracy without excessive infrastructure.
- **Context window management important for Duel Mode.** Keep history, but watch token growth.

---

## Questions to Clarify Before Building

1. Do you want to start with a blank Next.js project or a simpler setup?
2. Should the app be desktop-only or mobile-responsive?
3. Do you want persistent settings (stored locally) or session-only?
4. For ElevenLabs voice profiles, do you want to test with generic voices first or commission custom clones?
5. Should retrieval be synchronous (blocking) or asynchronous (shown as loading)?

---

This prompt is self-contained and ready to hand to a fresh Claude session. All major architecture decisions are specified, tradeoffs are explicit, and implementation priorities are clear.
