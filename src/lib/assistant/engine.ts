import { EMERGENCY_HELPLINES, HELPLINES } from "@/data/helplines";
import { legalAidFor } from "@/data/legalAid";
import type { Helpline, LegalAidOffice } from "@/data/types";
import type { Locale } from "@/lib/i18n/config";

import { classify } from "./classify";
import { compose, leadInFor, tokenize } from "./compose";
import { retrieve } from "./retrieve";
import { AbortError, TIMING, createJitter, delay, throwIfAborted } from "./stream";
import type { AnswerCard, Classification, RankedSource, UserProfile } from "./types";

/**
 * Events emitted while answering. This is THE seam.
 *
 * A deterministic matcher over the local corpus drives it today. A retrieval
 * backend streaming over SSE could drive it tomorrow, emitting the same events
 * in the same order — the UI would not change. Keep this boundary clean.
 */
export type AskEvent =
  | { type: "thinking" }
  /** Emitted before any answer work, so the UI can branch on urgency early. */
  | { type: "triage"; classification: Classification }
  | { type: "retrieving"; sources: RankedSource[] }
  | { type: "token"; text: string }
  | { type: "card"; card: AnswerCard }
  /** Red tier and minor disclosure replace the card entirely. */
  | { type: "helplines"; helplines: Helpline[]; reason: "red" | "minor" }
  | { type: "aid"; offices: LegalAidOffice[] }
  | { type: "done" };

export type AskOptions = {
  locale: Locale;
  profile?: UserProfile | undefined;
  signal?: AbortSignal | undefined;
  /** Set 0 to run with no delays. Used by tests and the demo script. */
  speed?: number | undefined;
};

/**
 * Answers a question as a stream of events.
 *
 * Order is guaranteed:
 *   thinking -> triage -> [ helplines -> aid -> done ]                (red / minor)
 *                      -> [ retrieving -> token* -> card -> aid -> done ]
 *
 * The red-tier branch never emits `retrieving`, `token`, or `card`. That is the
 * product decision made structural: when someone is in danger, the legal
 * explanation gets out of the way instead of streaming politely alongside it.
 */
export async function* ask(
  query: string,
  options: AskOptions,
): AsyncGenerator<AskEvent, void, void> {
  const { locale, profile, signal, speed = 1 } = options;
  const jitter = createJitter(hashSeed(query));
  const pause = (min: number, max: number) =>
    speed === 0 ? Promise.resolve() : delay(jitter(min, max) * speed, signal);

  throwIfAborted(signal);

  yield { type: "thinking" };
  await pause(TIMING.thinkingMin, TIMING.thinkingMax);
  throwIfAborted(signal);

  const classification = classify(query);
  yield { type: "triage", classification };

  // ── Safety branches. No probing questions, no legal lecture. ──
  if (classification.isMinorDisclosure) {
    yield {
      type: "helplines",
      helplines: HELPLINES.filter((h) => h.id === "child"),
      reason: "minor",
    };
    await pause(TIMING.beforeAid, TIMING.beforeAid);
    yield { type: "aid", offices: legalAidFor(profile?.state) };
    yield { type: "done" };
    return;
  }

  if (classification.urgency === "red") {
    yield { type: "helplines", helplines: EMERGENCY_HELPLINES, reason: "red" };
    await pause(TIMING.beforeAid, TIMING.beforeAid);
    yield { type: "aid", offices: legalAidFor(profile?.state) };
    yield { type: "done" };
    return;
  }

  // ── Normal answer path ──
  const sources = retrieve(query, { intent: classification.intent, profile });
  yield { type: "retrieving", sources };
  await pause(TIMING.retrievingMin, TIMING.retrievingMax);
  throwIfAborted(signal);

  const card = compose({ classification, sources, locale });

  for (const chunk of tokenize(leadInFor(card, locale))) {
    throwIfAborted(signal);
    yield { type: "token", text: chunk };
    await pause(TIMING.tokenMin, TIMING.tokenMax);
  }

  await pause(TIMING.beforeCard, TIMING.beforeCard);
  throwIfAborted(signal);
  yield { type: "card", card };

  await pause(TIMING.beforeAid, TIMING.beforeAid);
  throwIfAborted(signal);
  yield { type: "aid", offices: legalAidFor(profile?.state) };

  yield { type: "done" };
}

/** Stable seed per question so jitter is reproducible across runs. */
function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 1;
}

export { AbortError };
