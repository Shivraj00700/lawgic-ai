/** The six areas of life the corpus is organised around. */
export const CATEGORY_IDS = [
  "consumer",
  "housing",
  "work",
  "family",
  "safety",
  "documents",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

/**
 * Beneficiary groups the Know-Your-Rights brief calls out. Used to tag which
 * laws carry specific protections for which people.
 */
export const BENEFICIARY_TAGS = [
  "allCitizens",
  "women",
  "children",
  "seniorCitizens",
  "personsWithDisability",
  "scheduledCastesTribes",
  "workers",
  "tenants",
  "consumers",
] as const;

export type BeneficiaryTag = (typeof BENEFICIARY_TAGS)[number];

/**
 * One verified law entry. `plain_*` is the simplified summary shown to users;
 * it is deliberately not a quotation of the statute.
 *
 * `stateScope` is "IN" for central legislation that applies everywhere, or a
 * state code when the entry is state-specific. The retriever ranks entries
 * matching the user's state above generic ones.
 */
export type LawSource = {
  id: string;
  act: string;
  section: string;
  title_en: string;
  title_hi: string;
  plain_en: string;
  plain_hi: string;
  /**
   * What the person is entitled to, as short standalone lines.
   *
   * These live on the LAW rather than on an intent so that every bullet the UI
   * renders can name the source it came from. A right with no citation behind it
   * is exactly what this product promises not to do.
   */
  rights_en: string[];
  rights_hi: string[];
  /** Concrete next actions. Imperative, and doable without a lawyer. */
  steps_en: string[];
  steps_hi: string[];
  category: CategoryId;
  beneficiaryTags: BeneficiaryTag[];
  stateScope: "IN" | StateCode;
  sourceUrl: string;
  /**
   * Lowercase match terms across English, Devanagari Hindi, and Romanized
   * Hindi. Romanized entries matter: people type "paisa nahi diya", not
   * "पैसा नहीं दिया".
   */
  keywords: string[];
};

/** Subset of Indian states and union territories used by this build. */
export const STATE_CODES = [
  "AP",
  "AS",
  "BR",
  "CG",
  "DL",
  "GA",
  "GJ",
  "HR",
  "HP",
  "JH",
  "JK",
  "KA",
  "KL",
  "MP",
  "MH",
  "MN",
  "ML",
  "MZ",
  "NL",
  "OD",
  "PB",
  "RJ",
  "SK",
  "TN",
  "TG",
  "TR",
  "UP",
  "UK",
  "WB",
] as const;

export type StateCode = (typeof STATE_CODES)[number];

export type Helpline = {
  id: string;
  number: string;
  /** Key into `t.helplines` for the display name. */
  labelKey: "police" | "women" | "child" | "cyber" | "nalsa";
  /** Surfaced in red-tier urgency responses. */
  showInEmergency: boolean;
};

export type LegalAidOffice = {
  id: string;
  /** "IN" for NALSA, otherwise the State Legal Services Authority. */
  scope: "IN" | StateCode;
  name_en: string;
  name_hi: string;
  phone: string;
  email?: string;
  website: string;
};
