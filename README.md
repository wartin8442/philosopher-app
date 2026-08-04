# Philosopher App

Talk with AI versions of five philosophers — Aquinas, Camus, Kierkegaard,
Nietzsche, and Sartre — grounded in their actual writings. Ask a question,
get a reply in their voice, and see the passages the answer is drawn from.
Works by text or by voice.

A further 18 philosophers, from Plato and Aristotle through Beauvoir,
Wittgenstein, and Foucault, are implemented but held back from the public
demo. See [Releasing a philosopher](#releasing-a-philosopher).

## What it does

- **Chat with a philosopher** on any topic — meaning, death, freedom, God,
  ethics — and get a response shaped by their real ideas, not a generic
  summary.
- **Talk out loud.** Voice mode lets you speak your question and hear the
  philosopher's reply read back.
- **Dueling philosophers.** Ask two philosophers to debate about a topic you choose

## Getting started

You'll need [Node.js](https://nodejs.org) installed.

1. Install dependencies:
   ```
   npm install
   ```
2. Copy the example environment file and add your API key:
   ```
   cp .env.example .env.local
   ```
   Open `.env.local` and paste in an Anthropic API key (get one at
   [console.anthropic.com](https://console.anthropic.com)). Voice replies are
   optional — without an ElevenLabs key, the app just uses your browser's
   built-in voice instead.
3. Start the app:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Releasing a philosopher

The demo roster is one array: `DEMO_ROSTER_IDS` in
[`src/lib/demoRoster.ts`](src/lib/demoRoster.ts). Everything that lists or
serves a philosopher derives from it — the carousel, the landing rail, the duel
picker, the profile and conversation pages, and the `/api/*` handlers — so
adding an id is all it takes to make that philosopher live. Anyone not on the
list 404s.

Adding a philosopher from scratch is a separate job; see
[`docs/ADDING_A_PHILOSOPHER.md`](docs/ADDING_A_PHILOSOPHER.md).

## Project status

This is an active work in progress. See [`docs/STATUS.md`](docs/STATUS.md)
for what's done and what's next.
