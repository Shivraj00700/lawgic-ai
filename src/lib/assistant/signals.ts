/**
 * Urgency signal vocabulary for LegalGuard triage.
 *
 * DESIGN RULE THAT MATTERS MOST: red-tier terms are phrased to require
 * first-person or in-progress language ("beating me", "will kill me") rather
 * than bare crime nouns ("assault", "murder"). This is what stops
 * "what is the punishment for assault" — a legitimate legal question — from
 * interrupting into an emergency screen. Bare offence nouns belong in the
 * corpus keywords, not here.
 *
 * All terms are lowercase and pre-normalised: no nukta, ASCII digits, no
 * punctuation. See `normalize.ts`.
 */

export type RedFamily = "violence" | "threat" | "selfHarm" | "childAbuse";

export type RedSignal = {
  term: string;
  family: RedFamily;
  weight: number;
  /**
   * When true, an informational framing ("what is the punishment for...")
   * cannot soften this signal.
   *
   * Reserved for unambiguous first-person self-harm. The costs are asymmetric:
   * showing a helpline to someone asking an academic question is a mild
   * annoyance, missing a real disclosure is not recoverable.
   */
  neverDowngrade?: boolean;
};

export const RED_SIGNALS: RedSignal[] = [
  // ── Violence in progress or ongoing, stated in the first person ──
  { term: "beating me", family: "violence", weight: 3 },
  { term: "beats me", family: "violence", weight: 3 },
  { term: "beat me", family: "violence", weight: 2 },
  { term: "hitting me", family: "violence", weight: 3 },
  { term: "hits me", family: "violence", weight: 3 },
  { term: "attacking me", family: "violence", weight: 3 },
  { term: "being beaten", family: "violence", weight: 3 },
  { term: "is hitting", family: "violence", weight: 2.5 },
  { term: "is beating", family: "violence", weight: 2.5 },
  { term: "not letting me leave", family: "violence", weight: 3 },
  { term: "wont let me leave", family: "violence", weight: 3 },
  { term: "locked me", family: "violence", weight: 2.5 },
  { term: "raped", family: "violence", weight: 3.5 },
  { term: "raping", family: "violence", weight: 3.5 },
  { term: "molested", family: "violence", weight: 3 },
  { term: "molesting", family: "violence", weight: 3 },
  { term: "मार रहा", family: "violence", weight: 3 },
  { term: "मार रही", family: "violence", weight: 3 },
  { term: "मारता है", family: "violence", weight: 3 },
  { term: "पीट रहा", family: "violence", weight: 3 },
  { term: "पीटता है", family: "violence", weight: 3 },
  { term: "मुझे मार", family: "violence", weight: 2.5 },
  { term: "बलात्कार", family: "violence", weight: 3.5 },
  { term: "यौन शोषण", family: "violence", weight: 3 },
  { term: "maar raha", family: "violence", weight: 3 },
  { term: "maar rahi", family: "violence", weight: 3 },
  { term: "marta hai", family: "violence", weight: 3 },
  { term: "peet raha", family: "violence", weight: 3 },
  { term: "mujhe maar", family: "violence", weight: 2.5 },
  { term: "balatkar", family: "violence", weight: 3.5 },

  // ── Threats to life or serious injury ──
  { term: "threatening to kill", family: "threat", weight: 3.5 },
  { term: "threatened to kill", family: "threat", weight: 3.5 },
  { term: "will kill me", family: "threat", weight: 3.5 },
  { term: "going to kill", family: "threat", weight: 3.5 },
  { term: "kill me", family: "threat", weight: 3 },
  { term: "threatening me", family: "threat", weight: 2.5 },
  { term: "threatening my", family: "threat", weight: 2.5 },
  { term: "burn me", family: "threat", weight: 3 },
  { term: "acid on me", family: "threat", weight: 3.5 },
  { term: "जान से मारने", family: "threat", weight: 3.5 },
  { term: "मार डालने", family: "threat", weight: 3.5 },
  { term: "जान लेने", family: "threat", weight: 3 },
  { term: "धमकी दे रहा", family: "threat", weight: 2.5 },
  { term: "धमका रहा", family: "threat", weight: 2.5 },
  { term: "जला देने", family: "threat", weight: 3 },
  { term: "jaan se marne", family: "threat", weight: 3.5 },
  { term: "maar dalne", family: "threat", weight: 3.5 },
  { term: "jaan lene", family: "threat", weight: 3 },
  { term: "dhamki de raha", family: "threat", weight: 2.5 },
  { term: "jala dene", family: "threat", weight: 3 },

  // ── Self-harm. First-person forms are never downgraded. ──
  { term: "kill myself", family: "selfHarm", weight: 4, neverDowngrade: true },
  { term: "end my life", family: "selfHarm", weight: 4, neverDowngrade: true },
  { term: "want to die", family: "selfHarm", weight: 4, neverDowngrade: true },
  { term: "harm myself", family: "selfHarm", weight: 4, neverDowngrade: true },
  { term: "hurt myself", family: "selfHarm", weight: 4, neverDowngrade: true },
  { term: "no reason to live", family: "selfHarm", weight: 4, neverDowngrade: true },
  { term: "जान दे दूं", family: "selfHarm", weight: 4, neverDowngrade: true },
  { term: "मरना चाहता", family: "selfHarm", weight: 4, neverDowngrade: true },
  { term: "मरना चाहती", family: "selfHarm", weight: 4, neverDowngrade: true },
  { term: "जीना नहीं चाहता", family: "selfHarm", weight: 4, neverDowngrade: true },
  { term: "mar jana chahta", family: "selfHarm", weight: 4, neverDowngrade: true },
  { term: "jaan de dun", family: "selfHarm", weight: 4, neverDowngrade: true },
  // Bare topic words stay red, but CAN be softened by an academic framing so
  // that "punishment for abetment of suicide" is not treated as a crisis.
  { term: "suicide", family: "selfHarm", weight: 3 },
  { term: "suicidal", family: "selfHarm", weight: 3 },
  { term: "आत्महत्या", family: "selfHarm", weight: 3 },
  { term: "खुदकुशी", family: "selfHarm", weight: 3 },
  { term: "atmahatya", family: "selfHarm", weight: 3 },
  { term: "khudkushi", family: "selfHarm", weight: 3 },

  // ── Harm to a child ──
  { term: "beating my child", family: "childAbuse", weight: 4 },
  { term: "hitting my child", family: "childAbuse", weight: 4 },
  { term: "touching my child", family: "childAbuse", weight: 4 },
  { term: "touched my daughter", family: "childAbuse", weight: 4 },
  { term: "touched my son", family: "childAbuse", weight: 4 },
  { term: "abusing my child", family: "childAbuse", weight: 4 },
  { term: "abusing my daughter", family: "childAbuse", weight: 4 },
  { term: "my child is in danger", family: "childAbuse", weight: 4 },
  { term: "bad touch", family: "childAbuse", weight: 3 },
  { term: "बच्चे को मार", family: "childAbuse", weight: 4 },
  { term: "बच्ची के साथ", family: "childAbuse", weight: 4 },
  { term: "छेड़छाड़", family: "childAbuse", weight: 3 },
  { term: "गलत तरीके से छू", family: "childAbuse", weight: 3.5 },
  { term: "bacche ko maar", family: "childAbuse", weight: 4 },
  { term: "chhedchhad", family: "childAbuse", weight: 3 },
];

/**
 * Serious, but not presenting as in progress. Produces an answer card WITH a
 * helpline alongside it, in a gentler tone — help is offered, not forced.
 */
export const AMBER_SIGNALS: { term: string; weight: number }[] = [
  { term: "domestic violence", weight: 3 },
  { term: "dowry", weight: 2.5 },
  { term: "dowry demand", weight: 3 },
  { term: "harassing me", weight: 2 },
  { term: "harassment", weight: 1.5 },
  { term: "stalking", weight: 2.5 },
  { term: "following me", weight: 2 },
  { term: "mental torture", weight: 2.5 },
  { term: "emotional abuse", weight: 2.5 },
  { term: "verbal abuse", weight: 2 },
  { term: "abusive", weight: 2 },
  { term: "threw me out", weight: 2.5 },
  { term: "kicked me out", weight: 2.5 },
  { term: "thrown out of my house", weight: 2.5 },
  { term: "afraid of my", weight: 2 },
  { term: "scared of my", weight: 2 },
  { term: "घरेलू हिंसा", weight: 3 },
  { term: "दहेज", weight: 2.5 },
  { term: "परेशान कर रहा", weight: 2 },
  { term: "मानसिक प्रताड़ना", weight: 2.5 },
  { term: "गाली देता", weight: 2 },
  { term: "घर से निकाल दिया", weight: 2.5 },
  { term: "पीछा कर रहा", weight: 2.5 },
  { term: "gharelu hinsa", weight: 3 },
  { term: "dahej", weight: 2.5 },
  { term: "pareshan kar raha", weight: 2 },
  { term: "gaali deta", weight: 2 },
  { term: "ghar se nikal diya", weight: 2.5 },
  { term: "peecha kar raha", weight: 2.5 },
];

/**
 * Markers that the user is asking ABOUT the law rather than reporting
 * something happening to them. Softens red to amber — never to green, because a
 * person asking "is it illegal for my husband to hit me" is very often the
 * person it is happening to.
 */
export const INFORMATIONAL_MARKERS: string[] = [
  "what is",
  "what are",
  "what happens",
  "what does the law",
  "what is the punishment",
  "punishment for",
  "penalty for",
  "sentence for",
  "is it legal",
  "is it illegal",
  "law about",
  "which law",
  "under which law",
  "meaning of",
  "define",
  "definition of",
  "tell me about",
  "explain",
  "in general",
  "for example",
  "abetment",
  "क्या होता है",
  "क्या है",
  "कानून क्या",
  "सजा क्या",
  "क्या सजा",
  "क्या कानूनी",
  "कौन सा कानून",
  "बताइए",
  "समझाइए",
  "परिभाषा",
  "kya hota hai",
  "kanoon kya",
  "saza kya",
  "kya saza",
  "kaun sa kanoon",
  "bataiye",
  "samjhaiye",
];

/**
 * First-person distress. Overrides the informational softener entirely — if
 * someone writes "help me", we do not second-guess the framing.
 */
export const IMMEDIACY_MARKERS: string[] = [
  "help me",
  "please help",
  "right now",
  "i am scared",
  "im scared",
  "i am afraid",
  "im afraid",
  "save me",
  "urgent",
  "emergency",
  "tonight",
  "i am in danger",
  "im in danger",
  "he is here",
  "she is here",
  "they are here",
  "बचाओ",
  "मदद करो",
  "अभी",
  "डर लग",
  "जान बचा",
  "तुरंत",
  "खतरे में",
  "bachao",
  "madad karo",
  "dar lag",
  "jaan bacha",
  "turant",
  "khatre mein",
];

/** Explicit statements of being under 18, independent of the age regex. */
export const MINOR_MARKERS: string[] = [
  "i am a minor",
  "im a minor",
  "i am minor",
  "under 18",
  "under eighteen",
  "still in school",
  "school student",
  "नाबालिग",
  "मैं छोटा हूं",
  "स्कूल में पढ़",
  "nabalig",
  "minor hoon",
  "school mein padh",
];

/**
 * Captures a self-reported age. Anchored to first-person openers so that
 * "my son is 15" describes a child without classifying the ASKER as a minor —
 * those need different handling.
 */
export const SELF_AGE_PATTERN =
  /(?:^|\s)(?:i am|im|i m|my age is|meri umar|umar|main|mai|mein|मैं|मेरी उमर|मेरी आयु)\s*(\d{1,2})\s*(?:years?|yrs?|year old|saal|साल|वर्ष|का|की|हूं|हूँ)?/u;
