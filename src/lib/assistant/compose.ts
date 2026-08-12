import type { LawSource } from "@/data/types";
import type { Locale } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/locales/en";
import { hi } from "@/lib/i18n/locales/hi";
import type { Dictionary } from "@/lib/i18n/locales/en";

import { MIN_ANSWER_SCORE } from "./retrieve";
import type { AnswerCard, CardBullet, Classification, ExpandedDetail, RankedSource } from "./types";

const DICTIONARIES: Record<Locale, Dictionary> = { en, hi };

/**
 * Bullets shown per section before "explain more".
 *
 * Four rather than five: a person reading this on a phone, possibly with
 * someone shouting in the next room, is not helped by a longer list.
 */
export const MAX_BULLETS_PER_SECTION = 4;

function rightsOf(law: LawSource, locale: Locale): string[] {
  return locale === "hi" ? law.rights_hi : law.rights_en;
}

function stepsOf(law: LawSource, locale: Locale): string[] {
  return locale === "hi" ? law.steps_hi : law.steps_en;
}

function plainOf(law: LawSource, locale: Locale): string {
  return locale === "hi" ? law.plain_hi : law.plain_en;
}

/**
 * Interleaves bullets across sources so a second, lower-ranked law still gets
 * represented instead of the top law filling the whole list.
 */
function collect(
  sources: RankedSource[],
  pick: (law: LawSource) => string[],
  cap: number,
): CardBullet[] {
  const out: CardBullet[] = [];
  const lists = sources.map((source) => ({ id: source.law.id, items: pick(source.law) }));
  const longest = Math.max(0, ...lists.map((list) => list.items.length));

  for (let round = 0; round < longest && out.length < cap; round += 1) {
    for (const list of lists) {
      if (out.length >= cap) break;
      const text = list.items[round];
      if (text) out.push({ text, sourceId: list.id });
    }
  }

  return out;
}

export type ComposeInput = {
  classification: Classification;
  sources: RankedSource[];
  locale: Locale;
};

/**
 * Turns a classification plus retrieved sources into the card the UI renders.
 *
 * The one rule this function exists to enforce: an answer is only produced when
 * there is a real law behind it. Otherwise it returns the low-confidence card,
 * which says so plainly and hands off to legal aid.
 */
export function compose({ classification, sources, locale }: ComposeInput): AnswerCard {
  const t = DICTIONARIES[locale];
  const topScore = sources[0]?.score ?? 0;
  const lowConfidence = sources.length === 0 || topScore < MIN_ANSWER_SCORE;

  if (lowConfidence) {
    return {
      intent: classification.intent,
      confidence: "low",
      urgency: classification.urgency,
      rights: [],
      steps: [],
      // Sources are still carried through so a curious user can see what was
      // considered, but nothing is asserted on their basis.
      sources,
      expandedDetail: [],
      disclaimer: t.disclaimer.hedge,
      lowConfidence: true,
    };
  }

  const rights = collect(sources, (law) => rightsOf(law, locale), MAX_BULLETS_PER_SECTION);
  const steps = collect(sources, (law) => stepsOf(law, locale), MAX_BULLETS_PER_SECTION);

  const expandedDetail: ExpandedDetail[] = sources.map((source) => ({
    sourceId: source.law.id,
    act: source.law.act,
    section: source.law.section,
    text: plainOf(source.law, locale),
  }));

  return {
    intent: classification.intent,
    // The card can be no more confident than the classifier was.
    confidence: classification.confidence,
    urgency: classification.urgency,
    rights,
    steps,
    sources,
    expandedDetail,
    disclaimer: t.disclaimer.hedge,
    lowConfidence: false,
  };
}

/**
 * The short prose line streamed before the card lands, so the wait shows
 * progress instead of a spinner. Names the Act, because that is the point.
 */
export function leadInFor(card: AnswerCard, locale: Locale): string {
  const t = DICTIONARIES[locale];
  if (card.lowConfidence) return t.answer.lowConfidenceBody;

  const act = card.sources[0]?.law.act;
  if (!act) return t.answer.lowConfidenceBody;

  return t.answer.leadIn.replace("{act}", act);
}

/** Splits the lead-in into stream chunks, keeping spacing intact. */
export function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((chunk) => chunk.length > 0);
}
