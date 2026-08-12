import { LAWS } from "@/data/laws";
import { CATEGORY_IDS } from "@/data/types";

import { containsTerm, normalize, normalizeTerm, wordCount } from "./normalize";
import {
  AMBER_SIGNALS,
  IMMEDIACY_MARKERS,
  INFORMATIONAL_MARKERS,
  MINOR_MARKERS,
  RED_SIGNALS,
  SELF_AGE_PATTERN,
} from "./signals";
import type { Classification, Intent, MatchedSignal, UrgencyTier } from "./types";

/**
 * How specific a term is. Multi-word phrases and longer terms are stronger
 * evidence than single short words: "paisa nahi diya" should outweigh "pay".
 */
function termWeight(term: string): number {
  return 1 + 0.6 * (wordCount(term) - 1) + Math.min(term.length, 24) / 24;
}

/** Corpus keywords, normalised and pre-weighted once at module load. */
const TOPIC_TERMS: { term: string; category: Intent; weight: number }[] = LAWS.flatMap((law) =>
  law.keywords.map((keyword) => {
    const term = normalizeTerm(keyword);
    return { term, category: law.category, weight: termWeight(term) };
  }),
);

const RED_TERMS = RED_SIGNALS.map((signal) => ({ ...signal, term: normalizeTerm(signal.term) }));
const AMBER_TERMS = AMBER_SIGNALS.map((signal) => ({
  ...signal,
  term: normalizeTerm(signal.term),
}));
const INFORMATIONAL_TERMS = INFORMATIONAL_MARKERS.map(normalizeTerm);
const IMMEDIACY_TERMS = IMMEDIACY_MARKERS.map(normalizeTerm);
const MINOR_TERMS = MINOR_MARKERS.map(normalizeTerm);

/**
 * Confidence thresholds.
 *
 * "High" requires two things: a strong winner AND a runner-up that is not
 * itself a plausible answer. "My landlord kept my deposit and my employer has
 * not paid my wages" scores strongly in housing, but work is clearly in play
 * too — that is two questions, not one confident answer, so it reports medium.
 */
const HIGH_SCORE = 4;
const MEDIUM_SCORE = 1.6;

/** Below this, the input is too short to classify meaningfully. */
const MIN_LENGTH = 3;

function emptyScores(): Record<Intent, number> {
  return CATEGORY_IDS.reduce(
    (acc, id) => {
      acc[id] = 0;
      return acc;
    },
    {} as Record<Intent, number>,
  );
}

/**
 * Scores the input against the corpus and the urgency vocabulary.
 *
 * Intent and urgency are scored INDEPENDENTLY on purpose. "My husband is
 * beating me and threw me out" is both a housing question and a red-tier
 * safety event; collapsing the two would force a choice that loses information.
 */
export function classify(text: string): Classification {
  const normalized = normalize(text);
  const matchedSignals: MatchedSignal[] = [];
  const topicScores = emptyScores();

  if (normalized.length < MIN_LENGTH) {
    return {
      intent: null,
      confidence: "low",
      topicScore: 0,
      urgency: "green",
      isMinorDisclosure: false,
      matchedSignals: [],
      topicScores,
    };
  }

  // ── Topic ──
  for (const { term, category, weight } of TOPIC_TERMS) {
    if (containsTerm(normalized, term)) {
      topicScores[category] += weight;
      matchedSignals.push({ term, kind: "topic", weight, group: category });
    }
  }

  const ranked = CATEGORY_IDS.map((id) => ({ id, score: topicScores[id] })).sort(
    (a, b) => b.score - a.score,
  );
  const top = ranked[0] ?? { id: CATEGORY_IDS[0], score: 0 };
  const runnerUp = ranked[1]?.score ?? 0;

  const intent: Intent | null = top.score > 0 ? top.id : null;

  let confidence: Classification["confidence"] = "low";
  if (top.score >= HIGH_SCORE && runnerUp < MEDIUM_SCORE) {
    confidence = "high";
  } else if (top.score >= MEDIUM_SCORE) {
    confidence = "medium";
  }

  // ── Urgency, scored independently of topic ──
  let redScore = 0;
  let neverDowngrade = false;
  for (const signal of RED_TERMS) {
    if (containsTerm(normalized, signal.term)) {
      redScore += signal.weight;
      if (signal.neverDowngrade) neverDowngrade = true;
      matchedSignals.push({
        term: signal.term,
        kind: "urgency",
        weight: signal.weight,
        group: signal.family,
      });
    }
  }

  let amberScore = 0;
  for (const signal of AMBER_TERMS) {
    if (containsTerm(normalized, signal.term)) {
      amberScore += signal.weight;
      matchedSignals.push({
        term: signal.term,
        kind: "urgency",
        weight: signal.weight,
        group: "concern",
      });
    }
  }

  const informational = INFORMATIONAL_TERMS.filter((term) => containsTerm(normalized, term));
  const immediate = IMMEDIACY_TERMS.filter((term) => containsTerm(normalized, term));

  for (const term of informational) {
    matchedSignals.push({ term, kind: "informational", weight: 0, group: "framing" });
  }
  for (const term of immediate) {
    matchedSignals.push({ term, kind: "urgency", weight: 1, group: "immediacy" });
  }

  const softened = informational.length > 0 && immediate.length === 0 && !neverDowngrade;

  let urgency: UrgencyTier = "green";
  if (redScore > 0) {
    // An academic framing softens red to amber — never to green. Someone asking
    // "is it illegal for my husband to hit me" is very often describing
    // themselves, so help stays on screen either way.
    urgency = softened ? "amber" : "red";
  } else if (amberScore > 0 || immediate.length > 0) {
    urgency = "amber";
  }

  return {
    intent,
    confidence,
    topicScore: Number(top.score.toFixed(3)),
    urgency,
    isMinorDisclosure: detectMinorDisclosure(normalized),
    matchedSignals,
    topicScores,
  };
}

/**
 * Detects that the person asking is under 18.
 *
 * Anchored to first-person openers so "my son is 15" is understood as being
 * about a child without treating the asker as one — those two situations need
 * different responses.
 */
export function detectMinorDisclosure(normalizedText: string): boolean {
  if (MINOR_TERMS.some((term) => containsTerm(normalizedText, term))) return true;

  const match = SELF_AGE_PATTERN.exec(normalizedText);
  if (!match?.[1]) return false;

  const age = Number.parseInt(match[1], 10);
  return Number.isFinite(age) && age > 0 && age < 18;
}

/** Exposed for the coverage report in tests. */
export const TOPIC_TERM_COUNT = TOPIC_TERMS.length;
