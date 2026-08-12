import type { CategoryId, StateCode } from "@/data/types";

/**
 * Urgency triage tiers.
 *
 * `amber` is the plan's "orange" tier — named amber here to match the
 * `--urgency-amber` design tokens so the code and the CSS agree.
 *
 *  red   — danger appears to be in progress. The legal answer is REPLACED by
 *          helplines. No probing follow-up questions.
 *  amber — serious, but not in progress. Answer card renders with a helpline
 *          alongside it and a gentler tone.
 *  green — ordinary legal question. Standard flow.
 */
export type UrgencyTier = "red" | "amber" | "green";

/** How much the assistant trusts its own match. Surfaced in the UI, always. */
export type Confidence = "high" | "medium" | "low";

/** The topic the question was routed to. Mirrors the six corpus categories. */
export type Intent = CategoryId;

export type SignalKind = "topic" | "urgency" | "minor" | "informational";

/**
 * A single term that fired during classification. Kept so the citation trace
 * can honestly show *why* a match happened instead of asserting it did.
 */
export type MatchedSignal = {
  term: string;
  kind: SignalKind;
  weight: number;
  /** For urgency signals: which family fired. For topic signals: the category. */
  group: string;
};

export type Classification = {
  /** `null` when nothing in the corpus matched — never guessed. */
  intent: Intent | null;
  confidence: Confidence;
  /** Raw score of the winning topic. Exposed for tests and debugging. */
  topicScore: number;
  urgency: UrgencyTier;
  isMinorDisclosure: boolean;
  matchedSignals: MatchedSignal[];
  /** Per-category scores, so the retriever can consider runners-up. */
  topicScores: Record<Intent, number>;
};

/**
 * Everything the user has optionally told us. Never required, never gates the
 * chat, and stored only on the user's own device.
 */
export type UserProfile = {
  state?: StateCode;
  ageBand?: "under18" | "18to25" | "26to40" | "41to60" | "over60";
  gender?: "female" | "male" | "other";
};
