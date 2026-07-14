import Anthropic from "@anthropic-ai/sdk";
import { AnswerLevel, ChatMessage, Philosopher } from "../types";

/**
 * Model-provider abstraction. The provider and model are chosen entirely by
 * environment variables so you can swap Claude -> OpenAI -> local Ollama with
 * no code changes. No API keys are ever hardcoded.
 */

export interface LLMRequest {
  /**
   * Stable system prompt (persona + rules). Identical across a conversation's
   * turns, so the Anthropic provider marks it for prompt caching.
   */
  system: string;
  /**
   * Per-turn system additions (retrieved grounding, duel phase instructions).
   * Kept out of `system` because a cached prefix must match byte-for-byte:
   * anything that changes per turn must come after the cache marker.
   */
  systemSuffix?: string;
  messages: ChatMessage[];
  maxTokens?: number;
}

export interface LLMProvider {
  readonly name: string;
  /** One-shot completion: resolves once with the entire reply. */
  complete(req: LLMRequest): Promise<string>;
  /**
   * Streaming completion: yields text fragments as the model produces them,
   * so callers can render/speak the beginning of a reply while the rest is
   * still being generated.
   */
  stream(req: LLMRequest): AsyncIterable<string>;
}

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: "claude-opus-4-8",
  openai: "gpt-4o",
  ollama: "llama3.1",
};

/**
 * For providers that take the system prompt as one plain string, the stable
 * and per-turn parts are simply joined back together.
 */
function joinSystem(req: LLMRequest): string {
  return req.systemSuffix ? `${req.system}\n\n${req.systemSuffix}` : req.system;
}

function resolveModel(provider: string): string {
  return process.env.LLM_MODEL || DEFAULT_MODELS[provider] || "claude-opus-4-8";
}

// ---- Anthropic (Claude) — default provider ----------------------------------

class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";
  private client: Anthropic;
  private model: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it to .env.local or switch LLM_PROVIDER.",
      );
    }
    this.client = new Anthropic({ apiKey });
    this.model = resolveModel("anthropic");
  }

  /**
   * System prompt as content blocks. The stable block carries a
   * `cache_control` marker: Anthropic keeps its processed form warm for a few
   * minutes, so later turns skip re-processing the persona (faster first
   * token, ~10x cheaper for those tokens). The per-turn suffix (grounding /
   * duel instructions) comes after the marker so changing it never
   * invalidates the cached prefix. Caching only engages once the stable
   * prefix exceeds the model's minimum (~1024 tokens); below that the marker
   * is harmlessly ignored.
   */
  private systemBlocks(req: LLMRequest): Anthropic.TextBlockParam[] {
    const blocks: Anthropic.TextBlockParam[] = [
      { type: "text", text: req.system, cache_control: { type: "ephemeral" } },
    ];
    if (req.systemSuffix) {
      blocks.push({ type: "text", text: req.systemSuffix });
    }
    return blocks;
  }

  async complete(req: LLMRequest): Promise<string> {
    // Thinking is intentionally left off for low-latency, natural conversation
    // (the app is voice-first). Accuracy comes from the curated system prompt
    // plus optional retrieval, not from extended reasoning per turn.
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: req.maxTokens ?? 1024,
      system: this.systemBlocks(req),
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    });

    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
  }

  async *stream(req: LLMRequest): AsyncIterable<string> {
    const events = await this.client.messages.create({
      model: this.model,
      max_tokens: req.maxTokens ?? 1024,
      system: this.systemBlocks(req),
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    });

    for await (const event of events) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }
}

// ---- OpenAI-compatible (optional) -------------------------------------------

class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set for LLM_PROVIDER=openai.");
    }
    this.apiKey = apiKey;
    this.baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    this.model = resolveModel("openai");
  }

  async complete(req: LLMRequest): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: req.maxTokens ?? 1024,
        messages: [
          { role: "system", content: joinSystem(req) },
          ...req.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenAI provider error ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    return (data.choices?.[0]?.message?.content ?? "").trim();
  }

  async *stream(req: LLMRequest): AsyncIterable<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: req.maxTokens ?? 1024,
        stream: true,
        messages: [
          { role: "system", content: joinSystem(req) },
          ...req.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`OpenAI provider error ${res.status}: ${await res.text()}`);
    }

    // The body arrives as raw bytes in arbitrary-sized chunks; SSE messages are
    // newline-delimited `data: {json}` lines. Buffer until we have full lines.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // last element may be a partial line
      for (const line of lines) {
        const data = line.replace(/^data: /, "").trim();
        if (!data || data === "[DONE]") continue;
        const text = JSON.parse(data).choices?.[0]?.delta?.content;
        if (text) yield text;
      }
    }
  }
}

// ---- Ollama (optional, local) -----------------------------------------------

class OllamaProvider implements LLMProvider {
  readonly name = "ollama";
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    this.model = resolveModel("ollama");
  }

  async complete(req: LLMRequest): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        messages: [
          { role: "system", content: joinSystem(req) },
          ...req.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`Ollama provider error ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    return (data.message?.content ?? "").trim();
  }

  async *stream(req: LLMRequest): AsyncIterable<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        stream: true,
        messages: [
          { role: "system", content: joinSystem(req) },
          ...req.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`Ollama provider error ${res.status}: ${await res.text()}`);
    }

    // Ollama streams NDJSON: one complete JSON object per line, no SSE prefix.
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
        if (!line.trim()) continue;
        const parsed = JSON.parse(line);
        const text = parsed.message?.content;
        if (text) yield text;
        if (parsed.done) return;
      }
    }
  }
}

let cachedProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (cachedProvider) return cachedProvider;
  const provider = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();
  switch (provider) {
    case "openai":
      cachedProvider = new OpenAIProvider();
      break;
    case "ollama":
      cachedProvider = new OllamaProvider();
      break;
    case "anthropic":
    default:
      cachedProvider = new AnthropicProvider();
      break;
  }
  return cachedProvider;
}

// ---- Prompt composition -----------------------------------------------------

const ANSWER_LEVEL_INSTRUCTIONS: Record<AnswerLevel, string> = {
  beginner:
    "Answer level: BEGINNER. Use plain, welcoming language and concrete everyday examples. Define any technical term the moment you use it. Keep it short and vivid. Accuracy must not suffer for simplicity.",
  intermediate:
    "Answer level: INTERMEDIATE. Assume curiosity but not expertise. Introduce your key terms and briefly define them. Moderate depth.",
  advanced:
    "Answer level: ADVANCED. Assume a philosophically literate interlocutor. Use your technical vocabulary freely and engage the real difficulties and distinctions.",
  "primary-text":
    "Answer level: READING A PRIMARY TEXT. Speak in the dense, characteristic register of your own writing — as though the listener were reading a passage from your works. Rich, demanding, unhurried.",
};

/**
 * The shared preamble applied to every philosopher: the in-character and
 * accuracy rules from the app spec. Kept separate from each philosopher's
 * substance prompt so the rules stay consistent across profiles.
 */
function sharedPreamble(): string {
  return `You are role-playing a historical philosopher in a voice-first conversation app. Follow these rules strictly:

1. Stay fully in character and speak in the first person ("I"). Never say you are an AI, a model, a simulation, or a language model, and never break character.
2. Historical and philosophical accuracy comes first — above theatrical flourish. Match your subject's tone and pace, but never distort the content to sound more dramatic.
3. Do not fabricate citations, quotations, texts, dates, or historical facts. If you are unsure of an exact quote, paraphrase and say it is a paraphrase.
4. If a claim is your interpretation rather than something you stated directly, say so naturally ("this is how I would read my own position...").
5. If a question goes beyond what you actually addressed, extend from your principles and flag it ("I did not face this directly, but from my principles...").
6. This is a spoken conversation. Speak naturally and conversationally; do not use markdown, bullet lists, headings, or stage directions.
7. Be concise and to the point. Answer the question actually asked — usually in a few sentences, at most one short paragraph — and stop. Do not volunteer background, tangents, or extra layers of detail the listener did not ask for. (If the answer-level instruction below explicitly calls for a denser, longer register, it takes precedence over this length cap, though not over staying on point.)
8. Instead of elaborating automatically, end your answer by briefly inviting the listener to go deeper into something specific if they wish (for example, "shall I say more about X?" — vary the wording naturally). Skip the invitation when it would be unnatural, such as when you have just asked the listener a substantive question yourself. When they do ask for more, give the depth they asked for.`;
}

/**
 * Per-turn instruction for a conversation focused on one of the philosopher's
 * works ("Explore this work" on the profile page). Rides in `systemSuffix`
 * (like grounding) rather than the stable persona, because the user can drop
 * the focus mid-conversation — the cached prefix must not change when they do.
 *
 * Accuracy note: with no per-book retrieval corpus, the guard against
 * hallucinated specifics lives here — never assert exact chapter/section
 * locations or verbatim quotes unless certain.
 */
export function workFocusInstruction(workTitle: string): string {
  return `This conversation is focused on your work "${workTitle}". The listener has chosen to explore this work specifically — they may be reading it, considering reading it, or trying to understand its ideas.

- Center your answers on what you actually argue, depict, or develop in "${workTitle}". Draw on your broader thought when it illuminates the work, but bring the discussion back to the work itself.
- If the listener asks something unrelated, answer it — do not fight them — but when the thread is open, return naturally to the work.
- Be honest about the limits of your recall of the text: never assert exact chapter, section, or page locations, and never present a quotation as verbatim, unless you are certain. Paraphrase and say so instead ("the thought, as I recall putting it, was...").
- If the listener tells you where they are in the book, respect that: help them understand what they have read without leaning on what comes later, or warn them briefly before you do.
- If a broad or vague question comes ("what is this book about?"), answer as the author explaining the work's heart, not as a catalog of contents.`;
}

export interface BuildPromptOptions {
  philosopher: Philosopher;
  answerLevel: AnswerLevel;
  grounding?: string;
  /** Extra situational instructions (used by duel mode). */
  extra?: string;
}

export interface BuiltPrompt {
  /** Stable prefix (preamble + persona + answer level): cacheable. */
  system: string;
  /** Per-turn material (grounding, duel phase): after the cache marker. */
  systemSuffix?: string;
}

/**
 * Split so the parts that repeat every turn can be prompt-cached, while the
 * parts that change per turn ride after the cache marker without invalidating
 * it. Pass both fields straight through to the provider.
 */
export function buildSystemPrompt(opts: BuildPromptOptions): BuiltPrompt {
  const system = [
    sharedPreamble(),
    "",
    opts.philosopher.systemPrompt,
    "",
    ANSWER_LEVEL_INSTRUCTIONS[opts.answerLevel],
  ].join("\n");

  const suffixParts: string[] = [];
  if (opts.grounding) suffixParts.push(opts.grounding);
  if (opts.extra) suffixParts.push(opts.extra);

  return {
    system,
    systemSuffix: suffixParts.length ? suffixParts.join("\n\n") : undefined,
  };
}
