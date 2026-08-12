import { LAWS } from "@/data/laws";
import type { LawSource } from "@/data/types";

import { containsTerm, normalize, normalizeTerm, wordCount } from "./normalize";
import type { Intent, RankedSource, UserProfile } from "./types";

function termWeight(term: string): number {
  return 1 + 0.6 * (wordCount(term) - 1) + Math.min(term.length, 24) / 24;
}

/** Normalised keyword index, built once. Mirrors the classifier's weighting. */
const INDEX: { law: LawSource; terms: { term: string; weight: number }[] }[] = LAWS.map((law) => ({
  law,
  terms: law.keywords.map((keyword) => {
    const term = normalizeTerm(keyword);
    return { term, weight: termWeight(term) };
  }),
}));

/** Applied when the law's category is the one the classifier chose. */
const CATEGORY_BOOST = 2.5;

/**
 * Applied when a law is specific to the user's own state. Large on purpose: a
 * law written for your state is more useful than a general one, and this is what
 * makes setting a state visibly change the answer.
 */
const STATE_MATCH_BOOST = 3.5;

/**
 * A state-scoped law shown to someone whose state is unknown is informative but
 * may not apply to them, so it is ranked below central law rather than hidden.
 */
const UNKNOWN_STATE_PENALTY = 1.5;

/** How many sources a single answer card may cite. */
export const MAX_SOURCES = 3;

/**
 * Below this, a match is too thin to build an answer on. The composer downgrades
 * to the low-confidence card instead of dressing up a weak guess.
 */
export const MIN_ANSWER_SCORE = 2;

/**
 * A source must score at least this fraction of the top result to be cited
 * alongside it.
 *
 * Without this, incidental word collisions get quoted as if they were relevant:
 * the Hindi for "I left the rented house" ("छोड़ दिया") also appears in the
 * maintenance law's keywords for "abandoned", and "मालिक" means both landlord
 * and employer. A deposit question was citing maintenance and wage law at the
 * bottom of the card, which reads as padding and dilutes the real answer.
 */
export const RELATIVE_CUTOFF = 0.35;

export type RetrieveOptions = {
  intent?: Intent | null | undefined;
  profile?: UserProfile | undefined;
  limit?: number | undefined;
};

/**
 * Ranks the corpus against the user's words.
 *
 * A law scoped to a state OTHER than the user's is EXCLUDED, not merely
 * demoted. Citing the Maharashtra Rent Control Act to someone in Delhi would be
 * a confidently-presented wrong answer, which is worse than a general one.
 */
export function retrieve(query: string, options: RetrieveOptions = {}): RankedSource[] {
  const { intent = null, profile, limit = MAX_SOURCES } = options;
  const normalized = normalize(query);
  if (!normalized) return [];

  const userState = profile?.state;
  const ranked: RankedSource[] = [];

  for (const { law, terms } of INDEX) {
    const isStateLaw = law.stateScope !== "IN";

    if (isStateLaw && userState && law.stateScope !== userState) continue;

    const matchedTerms: string[] = [];
    let score = 0;
    for (const { term, weight } of terms) {
      if (containsTerm(normalized, term)) {
        score += weight;
        matchedTerms.push(term);
      }
    }

    // A category boost only counts for laws that already matched something. It
    // sharpens ranking; it cannot conjure a match out of nothing.
    if (score <= 0) continue;

    if (intent && law.category === intent) score += CATEGORY_BOOST;

    const stateSpecific = isStateLaw && userState === law.stateScope;
    if (stateSpecific) score += STATE_MATCH_BOOST;
    else if (isStateLaw) score -= UNKNOWN_STATE_PENALTY;

    if (score <= 0) continue;

    ranked.push({
      law,
      score: Number(score.toFixed(3)),
      matchedTerms,
      stateSpecific,
    });
  }

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Deterministic tie-break so the demo renders identically every run.
    return a.law.id.localeCompare(b.law.id);
  });

  const best = ranked[0]?.score ?? 0;
  const floor = best * RELATIVE_CUTOFF;

  return ranked.filter((source) => source.score >= floor).slice(0, limit);
}
