import { describe, expect, it } from "vitest";

import { CATEGORIES } from "@/data/categories";

import { classify, detectMinorDisclosure } from "./classify";
import { normalize } from "./normalize";
import { RED_SIGNALS, type RedFamily } from "./signals";

describe("normalisation", () => {
  it("folds nukta variants so both spellings of a word match", () => {
    // People type both of these for "broken". The corpus should only need one.
    expect(normalize("ख़राब")).toBe(normalize("खराब"));
    expect(normalize("ज़मा")).toBe(normalize("जमा"));
  });

  it("preserves Devanagari matras and viramas", () => {
    // Regression guard. These are Unicode MARKS, not letters; a punctuation
    // strip that only keeps \p{L} destroys every Hindi word silently.
    expect(normalize("बलात्कार")).toContain("्");
    expect(normalize("मज़दूरी")).toContain("ू");
    expect(normalize("भरण-पोषण")).toBe("भरण पोषण");
  });

  it("converts Devanagari digits to ASCII", () => {
    expect(normalize("मैं १५ साल")).toBe("मैं 15 साल");
  });

  it("strips punctuation and collapses whitespace", () => {
    expect(normalize("  Deposit,   NOT returned!!  ")).toBe("deposit not returned");
  });
});

// ─────────────────────────── The three demo scenarios ───────────────────────────

const SCENARIOS = [
  {
    name: "defective product refund",
    expected: "consumer",
    en: "I bought a phone last week and it stopped working. The shop refuses to refund me.",
    hi: "मैंने पिछले हफ़्ते एक फ़ोन खरीदा और वह बंद हो गया। दुकानदार पैसे लौटाने से मना कर रहा है।",
    romanized: "maine phone kharida wo band ho gaya dukandar paise wapas nahi kar raha",
  },
  {
    name: "unpaid wages",
    expected: "work",
    en: "My employer has not paid my wages for two months.",
    hi: "मेरे मालिक ने दो महीने से मेरी मज़दूरी नहीं दी है।",
    romanized: "malik ne do mahine se paisa nahi diya majdoori nahi mili",
  },
  {
    name: "withheld rental deposit",
    expected: "housing",
    en: "I moved out of my rented house but my landlord is keeping my security deposit.",
    hi: "मैंने किराये का मकान छोड़ दिया लेकिन मकान मालिक मेरी जमा राशि रोक रहा है।",
    romanized: "kirayedar tha makan khali kiya makan malik jama rashi lauta nahi raha",
  },
] as const;

describe("the three rehearsal scenarios", () => {
  it.each(SCENARIOS)("$name classifies correctly in English", ({ expected, en }) => {
    const result = classify(en);
    expect(result.intent).toBe(expected);
    expect(result.confidence).not.toBe("low");
    expect(result.urgency).toBe("green");
    expect(result.isMinorDisclosure).toBe(false);
  });

  it.each(SCENARIOS)("$name classifies correctly in Hindi", ({ expected, hi }) => {
    const result = classify(hi);
    expect(result.intent).toBe(expected);
    expect(result.confidence).not.toBe("low");
    expect(result.urgency).toBe("green");
  });

  it.each(SCENARIOS)("$name classifies correctly in Romanized Hindi", ({ expected, romanized }) => {
    // "paisa nahi diya" is how people actually type. If this breaks, a huge
    // share of real users get the low-confidence path.
    const result = classify(romanized);
    expect(result.intent).toBe(expected);
    expect(result.confidence).not.toBe("low");
  });
});

describe("category tile seeds", () => {
  // Tapping a tile must land in that tile's own category, or the icon-led
  // entry point for non-readers is quietly broken.
  it.each(CATEGORIES.map((c) => [c.id, c] as const))(
    "%s seed routes to itself in English",
    (id, category) => {
      expect(classify(category.seed_en).intent).toBe(id);
    },
  );

  it.each(CATEGORIES.map((c) => [c.id, c] as const))(
    "%s seed routes to itself in Hindi",
    (id, category) => {
      expect(classify(category.seed_hi).intent).toBe(id);
    },
  );
});

// ────────────────────────────── Urgency triage ──────────────────────────────

describe("red tier", () => {
  const FAMILY_EXAMPLES: Record<RedFamily, string[]> = {
    violence: [
      "my husband is beating me",
      "he hits me every day",
      "मेरा पति मुझे मार रहा है",
      "pati mujhe maar raha hai",
    ],
    threat: [
      "he is threatening to kill me",
      "my brother said he will kill me",
      "वह जान से मारने की धमकी दे रहा है",
      "jaan se marne ki dhamki de raha hai",
    ],
    selfHarm: [
      "i want to kill myself",
      "i see no reason to live",
      "मैं मरना चाहता हूं",
      "mar jana chahta hoon",
    ],
    childAbuse: [
      "my neighbour is touching my child",
      "someone is beating my child",
      "कोई मेरे बच्चे को मार रहा है",
      "bacche ko maar raha hai koi",
    ],
  };

  for (const [family, examples] of Object.entries(FAMILY_EXAMPLES) as [RedFamily, string[]][]) {
    it.each(examples)(`${family}: %s -> red`, (input) => {
      const result = classify(input);
      expect(result.urgency).toBe("red");
      expect(result.matchedSignals.some((s) => s.group === family)).toBe(true);
    });
  }

  it("covers every red family declared in the vocabulary", () => {
    const declared = new Set(RED_SIGNALS.map((s) => s.family));
    const tested = new Set(Object.keys(FAMILY_EXAMPLES));
    expect([...declared].sort()).toEqual([...tested].sort());
  });
});

describe("red tier does NOT fire on informational questions", () => {
  // The single most important false-positive guard in the build. A judge WILL
  // type something like this.
  const INFORMATIONAL = [
    "what is the punishment for assault",
    "what is the punishment for murder in India",
    "what are the laws about domestic violence in general",
    "is it legal to record a phone call",
    "what does the law say about theft",
    "explain the punishment for abetment of suicide",
    "मारपीट की सजा क्या है",
    "चोरी की सजा क्या होती है",
    "assault ki saza kya hai",
  ];

  it.each(INFORMATIONAL)("%s is not red", (input) => {
    expect(classify(input).urgency).not.toBe("red");
  });

  it("softens red to amber rather than green when the asker may be the victim", () => {
    // "is it illegal for my husband to hit me" is usually someone describing
    // their own life. Help must stay on screen.
    const result = classify("is it illegal for my husband to beat me");
    expect(result.urgency).toBe("amber");
  });

  it("ignores the informational framing when there is first-person distress", () => {
    const result = classify(
      "what is the punishment for assault, he is hitting me right now help me",
    );
    expect(result.urgency).toBe("red");
  });

  it("still identifies the relevant law when red is softened to amber", () => {
    // The amber path renders a real answer card, so a topic is required. A card
    // with no law attached would violate the no-citation-no-answer rule.
    for (const input of [
      "is it illegal for my husband to beat me",
      "what does the law say, my husband beats me",
    ]) {
      const result = classify(input);
      expect(result.urgency, input).toBe("amber");
      expect(result.intent, input).toBe("safety");
    }
  });

  it("never softens an explicit first-person self-harm statement", () => {
    // neverDowngrade. Asymmetric costs: a needless helpline is a mild
    // annoyance, a missed disclosure is not recoverable.
    const result = classify("what is the law, i want to kill myself");
    expect(result.urgency).toBe("red");
  });
});

describe("amber tier", () => {
  it.each([
    "my in laws keep harassing me about dowry",
    "someone is stalking me on my way home",
    "my landlord threw me out without notice",
    "मेरे ससुराल वाले दहेज के लिए परेशान कर रहे हैं",
    "gharelu hinsa ho rahi hai",
  ])("%s -> amber", (input) => {
    expect(classify(input).urgency).toBe("amber");
  });

  it("keeps ordinary legal questions green", () => {
    for (const input of [
      "my landlord is keeping my deposit",
      "how do I file an RTI application",
      "my wages have not been paid",
      "how do I get a disability certificate",
    ]) {
      expect(classify(input).urgency, input).toBe("green");
    }
  });
});

// ─────────────────────────── Confidence behaviour ───────────────────────────

describe("confidence", () => {
  it.each(["asdkjh qwe zxcvb", "aaaa bbbb cccc", "??? ...", "hello", "x"])(
    "gibberish or greeting %s returns low confidence",
    (input) => {
      expect(classify(input).confidence).toBe("low");
    },
  );

  it("returns a null intent rather than guessing when nothing matches", () => {
    const result = classify("asdkjh qwe zxcvb");
    expect(result.intent).toBeNull();
    expect(result.topicScore).toBe(0);
  });

  it("is high only when one category clearly wins", () => {
    const result = classify(
      "I bought a defective phone, the shopkeeper refuses a refund and I want compensation",
    );
    expect(result.intent).toBe("consumer");
    expect(result.confidence).toBe("high");
  });

  it("does not claim high confidence when two categories score close together", () => {
    // Genuinely ambiguous: wages (work) and deposit (housing) in one sentence.
    const result = classify(
      "my landlord kept my deposit and my employer has not paid my wages either",
    );
    expect(result.confidence).not.toBe("high");
  });

  it("stays green and low for an empty or whitespace input", () => {
    for (const input of ["", "   ", "\n"]) {
      const result = classify(input);
      expect(result.confidence).toBe("low");
      expect(result.intent).toBeNull();
      expect(result.urgency).toBe("green");
    }
  });
});

// ───────────────────────── Minor disclosure ─────────────────────────

describe("minor disclosure", () => {
  it.each([
    "i am 15 and my father hits me",
    "im 16 years old, can I work",
    "मैं 15 साल का हूं",
    "main 14 saal ka hoon",
    "i am a minor",
    "मैं नाबालिग हूं",
    "i am 17",
  ])("%s is detected as a minor", (input) => {
    expect(classify(input).isMinorDisclosure).toBe(true);
  });

  it.each([
    "i am 25 and my landlord kept my deposit",
    "my son is 15 and not being paid",
    "i am 45 years old",
    "my daughter is 12",
    "i have 15 documents",
  ])("%s is NOT treated as the asker being a minor", (input) => {
    expect(classify(input).isMinorDisclosure).toBe(false);
  });

  it("still classifies topic and urgency for a minor", () => {
    // The minor flow replaces the response, but the classification underneath
    // must still be correct so the routing decision is informed.
    const result = classify("i am 15 and my father is beating me");
    expect(result.isMinorDisclosure).toBe(true);
    expect(result.urgency).toBe("red");
  });

  it("reads Devanagari digits", () => {
    expect(detectMinorDisclosure(normalize("मैं १६ साल की हूं"))).toBe(true);
  });
});

// ───────────────────────── Explainability ─────────────────────────

describe("matched signals", () => {
  it("records the terms that fired, so the trace can show why", () => {
    const result = classify("my landlord is keeping my security deposit");
    const topics = result.matchedSignals.filter((s) => s.kind === "topic");
    expect(topics.length).toBeGreaterThan(0);
    for (const signal of topics) {
      expect(signal.group).toBe("housing");
      expect(signal.weight).toBeGreaterThan(0);
    }
  });

  it("labels urgency and framing signals distinctly from topic signals", () => {
    const result = classify("what is the punishment for assault");
    expect(result.matchedSignals.some((s) => s.kind === "informational")).toBe(true);
  });

  it("weights a specific multi-word phrase above a single short word", () => {
    const phrase = classify("paisa nahi diya");
    const single = classify("wages");
    expect(phrase.topicScore).toBeGreaterThan(single.topicScore);
  });
});

describe("classification summary", () => {
  it("reports behaviour across representative inputs", () => {
    const samples = [
      ...SCENARIOS.map((s) => s.en),
      ...SCENARIOS.map((s) => s.romanized),
      "what is the punishment for assault",
      "my husband is beating me",
      "i want to kill myself",
      "my in laws keep harassing me about dowry",
      "i am 15 and my father hits me",
      "asdkjh qwe zxcvb",
    ];

    const rows = samples.map((input) => {
      const r = classify(input);
      const clip = input.length > 46 ? `${input.slice(0, 43)}...` : input;
      return `  ${clip.padEnd(48)} ${String(r.intent ?? "-").padEnd(10)} ${r.confidence.padEnd(7)} ${r.urgency.padEnd(6)} ${r.isMinorDisclosure ? "minor" : ""}`;
    });

    console.log(
      [
        "",
        "  Classifier behaviour",
        `  ${"input".padEnd(48)} ${"intent".padEnd(10)} ${"conf".padEnd(7)} ${"urgency".padEnd(6)}`,
        "  " + "-".repeat(80),
        ...rows,
        "",
      ].join("\n"),
    );

    expect(rows).toHaveLength(samples.length);
  });
});
