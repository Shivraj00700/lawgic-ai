import { describe, expect, it, vi } from "vitest";

import { LAWS } from "@/data/laws";
import type { Locale } from "@/lib/i18n/config";

import { classify } from "./classify";
import { MAX_BULLETS_PER_SECTION, compose, leadInFor, tokenize } from "./compose";
import { ask, type AskEvent } from "./engine";
import { MAX_SOURCES, MIN_ANSWER_SCORE, retrieve } from "./retrieve";
import { AbortError, createJitter, delay } from "./stream";
import type { AnswerCard, UserProfile } from "./types";

const SCENARIOS = [
  {
    name: "defective product refund",
    intent: "consumer",
    en: "I bought a phone last week and it stopped working. The shop refuses to refund me.",
    hi: "मैंने पिछले हफ़्ते एक फ़ोन खरीदा और वह बंद हो गया। दुकानदार पैसे लौटाने से मना कर रहा है।",
  },
  {
    name: "unpaid wages",
    intent: "work",
    en: "My employer has not paid my wages for two months.",
    hi: "मेरे मालिक ने दो महीने से मेरी मज़दूरी नहीं दी है।",
  },
  {
    name: "withheld rental deposit",
    intent: "housing",
    en: "I moved out of my rented house but my landlord is keeping my security deposit.",
    hi: "मैंने किराये का मकान छोड़ दिया लेकिन मकान मालिक मेरी जमा राशि रोक रहा है।",
  },
] as const;

function answerFor(query: string, locale: Locale, profile?: UserProfile): AnswerCard {
  const classification = classify(query);
  const sources = retrieve(query, {
    intent: classification.intent,
    ...(profile ? { profile } : {}),
  });
  return compose({ classification, sources, locale });
}

async function drain(query: string, locale: Locale, profile?: UserProfile): Promise<AskEvent[]> {
  const events: AskEvent[] = [];
  for await (const event of ask(query, { locale, speed: 0, ...(profile ? { profile } : {}) })) {
    events.push(event);
  }
  return events;
}

// ───────────────────────────────── Retriever ─────────────────────────────────

describe("retrieve", () => {
  it("returns nothing for empty input rather than a default answer", () => {
    expect(retrieve("")).toEqual([]);
    expect(retrieve("   ")).toEqual([]);
  });

  it("returns nothing when no keyword matches", () => {
    expect(retrieve("asdkjh qwe zxcvb")).toEqual([]);
  });

  it.each(SCENARIOS)("$name finds a law in the right category", ({ intent, en }) => {
    const sources = retrieve(en, { intent });
    expect(sources.length).toBeGreaterThan(0);
    expect(sources[0]?.law.category).toBe(intent);
    expect(sources[0]?.score).toBeGreaterThanOrEqual(MIN_ANSWER_SCORE);
  });

  it.each(SCENARIOS)("$name works in Hindi too", ({ intent, hi }) => {
    const sources = retrieve(hi, { intent });
    expect(sources.length).toBeGreaterThan(0);
    expect(sources[0]?.law.category).toBe(intent);
  });

  it("never returns more than the source cap", () => {
    const sources = retrieve(
      "my landlord kept my deposit, my wages are unpaid, and I bought a defective phone",
    );
    expect(sources.length).toBeLessThanOrEqual(MAX_SOURCES);
  });

  it("sorts by descending score", () => {
    const sources = retrieve("my landlord is keeping my security deposit", { intent: "housing" });
    const scores = sources.map((s) => s.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it("records the terms that matched, for the citation trace", () => {
    const sources = retrieve("my landlord is keeping my security deposit", { intent: "housing" });
    expect(sources[0]?.matchedTerms.length).toBeGreaterThan(0);
  });

  it("is deterministic, so the demo renders identically every run", () => {
    const a = retrieve("my wages have not been paid", { intent: "work" });
    const b = retrieve("my wages have not been paid", { intent: "work" });
    expect(a.map((s) => s.law.id)).toEqual(b.map((s) => s.law.id));
  });

  describe("state scoping", () => {
    // A query squarely about the subject of the state-specific law.
    const WATER_QUERY = "my landlord cut off my water and electricity to force me out";
    // A query about a deposit, which central law covers.
    const DEPOSIT_QUERY = "my landlord is keeping my security deposit after I moved out";

    it("puts the state-specific law first when it is the better match", () => {
      const sources = retrieve(WATER_QUERY, { intent: "housing", profile: { state: "MH" } });
      expect(sources[0]?.law.id).toBe("mrca-1999-s24");
      expect(sources[0]?.stateSpecific).toBe(true);
    });

    it("boosts the same law's score once the state is known", () => {
      const withState = retrieve(WATER_QUERY, { intent: "housing", profile: { state: "MH" } });
      const without = retrieve(WATER_QUERY, { intent: "housing" });

      const scoreOf = (list: typeof withState) =>
        list.find((s) => s.law.id === "mrca-1999-s24")?.score ?? 0;

      expect(scoreOf(withState)).toBeGreaterThan(scoreOf(without));
    });

    it("does NOT let a state boost override plain relevance", () => {
      // The user asked about their deposit. Promoting a state law about utility
      // cut-offs just because it is local would answer a different question.
      const sources = retrieve(DEPOSIT_QUERY, { intent: "housing", profile: { state: "MH" } });
      expect(sources[0]?.law.id).toBe("mta-2021-s11");
    });

    it("EXCLUDES a law from another state rather than merely demoting it", () => {
      // Citing the Maharashtra Rent Control Act to someone in Delhi would be a
      // confidently-presented wrong answer.
      const sources = retrieve(WATER_QUERY, { intent: "housing", profile: { state: "DL" } });
      expect(sources.map((s) => s.law.id)).not.toContain("mrca-1999-s24");
    });

    it("marks nothing as state-specific when no state is set", () => {
      const sources = retrieve(WATER_QUERY, { intent: "housing" });
      expect(sources.every((s) => !s.stateSpecific)).toBe(true);
    });
  });

  it("drops incidental matches that score far below the best one", () => {
    // Hindi word collisions: "छोड़ दिया" (left) also means "abandoned" in the
    // maintenance law, and "मालिक" is both landlord and employer. Neither belongs
    // on a card about a rental deposit.
    const query = "मैंने किराये का मकान छोड़ दिया लेकिन मकान मालिक मेरी जमा राशि रोक रहा है";
    const sources = retrieve(query, { intent: "housing" });

    expect(sources[0]?.law.id).toBe("mta-2021-s11");
    expect(sources.map((s) => s.law.id)).not.toContain("bnss-2023-s144");
    expect(sources.map((s) => s.law.id)).not.toContain("pwa-1936-s5");
  });
});

// ───────────────────────────────── Composer ─────────────────────────────────

describe("compose", () => {
  it.each(["en", "hi"] as const)(
    "%s: every card has at least one source, or says it cannot answer",
    (locale) => {
      const queries = [
        ...SCENARIOS.map((s) => (locale === "hi" ? s.hi : s.en)),
        "asdkjh qwe zxcvb",
        "",
        "how do I file an RTI application",
        "my daughter was denied her share of ancestral property",
      ];

      for (const query of queries) {
        const card = answerFor(query, locale);
        if (card.lowConfidence) {
          // The honest path: nothing asserted.
          expect(card.rights, query).toEqual([]);
          expect(card.steps, query).toEqual([]);
        } else {
          expect(card.sources.length, query).toBeGreaterThan(0);
        }
      }
    },
  );

  it("NEVER emits rights or steps without a source behind them", () => {
    // The core integrity rule. Every bullet must name a law that is cited.
    const queries = [
      ...SCENARIOS.map((s) => s.en),
      ...SCENARIOS.map((s) => s.hi),
      "how do I file an RTI application",
      "the police refused to register my FIR",
    ];

    for (const query of queries) {
      for (const locale of ["en", "hi"] as const) {
        const card = answerFor(query, locale);
        const citedIds = new Set(card.sources.map((s) => s.law.id));
        for (const bullet of [...card.rights, ...card.steps]) {
          expect(citedIds.has(bullet.sourceId), `${query} -> ${bullet.sourceId}`).toBe(true);
        }
      }
    }
  });

  it("caps each section so the card stays readable on a phone", () => {
    const card = answerFor(
      "my landlord cut the water and kept my deposit after I moved out of my rented house",
      "en",
      { state: "MH" },
    );
    expect(card.rights.length).toBeLessThanOrEqual(MAX_BULLETS_PER_SECTION);
    expect(card.steps.length).toBeLessThanOrEqual(MAX_BULLETS_PER_SECTION);
    expect(card.rights.length).toBeLessThanOrEqual(5);
    expect(card.steps.length).toBeLessThanOrEqual(5);
  });

  it("represents more than one law when several matched, instead of one law filling the list", () => {
    const card = answerFor(
      "I bought a defective phone, the shop refuses a refund and I want compensation",
      "en",
    );
    const sourceIds = new Set(card.rights.map((b) => b.sourceId));
    expect(sourceIds.size).toBeGreaterThan(1);
  });

  it("downgrades to low confidence when the best match is too weak", () => {
    const classification = classify("something vague about a document");
    const sources = retrieve("something vague about a document", {
      intent: classification.intent,
    });
    const card = compose({ classification, sources, locale: "en" });

    if ((sources[0]?.score ?? 0) < MIN_ANSWER_SCORE) {
      expect(card.lowConfidence).toBe(true);
    }
  });

  it("returns the low-confidence card for gibberish", () => {
    const card = answerFor("asdkjh qwe zxcvb", "en");
    expect(card.lowConfidence).toBe(true);
    expect(card.confidence).toBe("low");
    expect(card.rights).toEqual([]);
  });

  it("always carries a disclaimer", () => {
    for (const locale of ["en", "hi"] as const) {
      for (const query of [SCENARIOS[0].en, "asdkjh qwe"]) {
        expect(answerFor(query, locale).disclaimer.length).toBeGreaterThan(0);
      }
    }
  });

  it("attaches the plain-language text of each cited law for 'explain more'", () => {
    const card = answerFor(SCENARIOS[1].en, "en");
    expect(card.expandedDetail.length).toBe(card.sources.length);
    for (const detail of card.expandedDetail) {
      expect(detail.act.length).toBeGreaterThan(0);
      expect(detail.section).toMatch(/^Section/);
      expect(detail.text.length).toBeGreaterThan(0);
    }
  });

  it("renders Hindi content in Hindi, not just Hindi labels around English text", () => {
    const card = answerFor(SCENARIOS[1].hi, "hi");
    expect(card.lowConfidence).toBe(false);
    for (const bullet of [...card.rights, ...card.steps]) {
      expect(/[\u0900-\u097F]/.test(bullet.text), bullet.text).toBe(true);
    }
    for (const detail of card.expandedDetail) {
      expect(/[\u0900-\u097F]/.test(detail.text)).toBe(true);
    }
  });

  it("names the Act in the streamed lead-in", () => {
    const card = answerFor(SCENARIOS[1].en, "en");
    const lead = leadInFor(card, "en");
    expect(lead).toContain(card.sources[0]!.law.act);
    expect(lead).not.toContain("{act}");
  });

  it("uses the honest message as the lead-in when confidence is low", () => {
    const card = answerFor("asdkjh qwe zxcvb", "en");
    expect(leadInFor(card, "en")).toContain("could not match");
  });

  it("tokenizes without losing any characters", () => {
    const text = "Based on the Payment of Wages Act, 1936, here is what applies.";
    expect(tokenize(text).join("")).toBe(text);
  });
});

// ────────────────────────────── Streaming engine ──────────────────────────────

describe("ask", () => {
  it.each(SCENARIOS)("$name emits events in the guaranteed order", async ({ en }) => {
    const types = (await drain(en, "en")).map((e) => e.type);
    expect(types).toEqual([
      "thinking",
      "triage",
      "retrieving",
      "token",
      ...types.filter((t) => t === "token").slice(1),
      "card",
      "aid",
      "done",
    ]);
  });

  it("emits thinking first and done last, always", async () => {
    for (const query of [SCENARIOS[0].en, "my husband is beating me", "asdkjh qwe", "i am 15"]) {
      const types = (await drain(query, "en")).map((e) => e.type);
      expect(types[0], query).toBe("thinking");
      expect(types.at(-1), query).toBe("done");
    }
  });

  it("streams at least one token before the card lands", async () => {
    const events = await drain(SCENARIOS[0].en, "en");
    const firstToken = events.findIndex((e) => e.type === "token");
    const cardAt = events.findIndex((e) => e.type === "card");
    expect(firstToken).toBeGreaterThan(-1);
    expect(firstToken).toBeLessThan(cardAt);
  });

  it("ends every ordinary answer with a legal aid handoff", async () => {
    for (const scenario of SCENARIOS) {
      const events = await drain(scenario.en, "en");
      const aid = events.find((e) => e.type === "aid");
      expect(aid, scenario.name).toBeDefined();
      if (aid?.type === "aid") expect(aid.offices.length).toBeGreaterThan(0);
    }
  });

  it("puts the user's state authority first in the handoff", async () => {
    const events = await drain(SCENARIOS[2].en, "en", { state: "MH" });
    const aid = events.find((e) => e.type === "aid");
    if (aid?.type === "aid") {
      expect(aid.offices[0]?.scope).toBe("MH");
    }
  });

  describe("red tier replaces the answer entirely", () => {
    const RED = "my husband is threatening to kill me";

    it("emits helplines and never a card, token, or retrieval", async () => {
      const events = await drain(RED, "en");
      const types = events.map((e) => e.type);

      expect(types).toContain("helplines");
      expect(types).not.toContain("card");
      expect(types).not.toContain("token");
      expect(types).not.toContain("retrieving");
    });

    it("offers emergency numbers, not the legal aid line, as the helplines", async () => {
      const events = await drain(RED, "en");
      const helplines = events.find((e) => e.type === "helplines");
      if (helplines?.type === "helplines") {
        expect(helplines.reason).toBe("red");
        expect(helplines.helplines[0]?.number).toBe("112");
        // 15100 is legal aid, not an emergency service.
        expect(helplines.helplines.map((h) => h.id)).not.toContain("nalsa");
      }
    });

    it("still reaches legal aid, without requiring anything from the user", async () => {
      const types = (await drain(RED, "en")).map((e) => e.type);
      expect(types).toEqual(["thinking", "triage", "helplines", "aid", "done"]);
    });
  });

  describe("minor disclosure", () => {
    const MINOR = "i am 15 and my father hits me";

    it("routes to Childline and skips the legal explanation", async () => {
      const events = await drain(MINOR, "en");
      const types = events.map((e) => e.type);
      expect(types).not.toContain("card");
      expect(types).not.toContain("token");

      const helplines = events.find((e) => e.type === "helplines");
      if (helplines?.type === "helplines") {
        expect(helplines.reason).toBe("minor");
        expect(helplines.helplines[0]?.number).toBe("1098");
      }
    });

    it("takes precedence over the red branch", async () => {
      // A minor in danger needs the child-specific route, not the adult one.
      const events = await drain(MINOR, "en");
      const helplines = events.find((e) => e.type === "helplines");
      if (helplines?.type === "helplines") expect(helplines.reason).toBe("minor");
    });
  });

  it("carries the classification on the triage event so the UI can branch early", async () => {
    const events = await drain("my in laws keep harassing me about dowry", "en");
    const triage = events.find((e) => e.type === "triage");
    expect(triage).toBeDefined();
    if (triage?.type === "triage") expect(triage.classification.urgency).toBe("amber");
  });

  it("produces a low-confidence card for an off-corpus question instead of inventing one", async () => {
    const events = await drain("what is the capital of France", "en");
    const card = events.find((e) => e.type === "card");
    expect(card).toBeDefined();
    if (card?.type === "card") {
      expect(card.card.lowConfidence).toBe(true);
      expect(card.card.rights).toEqual([]);
    }
  });
});

describe("cancellation", () => {
  it("stops emitting once aborted", async () => {
    const controller = new AbortController();
    const events: AskEvent[] = [];

    await expect(async () => {
      for await (const event of ask(SCENARIOS[0].en, {
        locale: "en",
        speed: 0,
        signal: controller.signal,
      })) {
        events.push(event);
        if (event.type === "retrieving") controller.abort();
      }
    }).rejects.toThrow(AbortError);

    expect(events.map((e) => e.type)).toEqual(["thinking", "triage", "retrieving"]);
  });

  it("rejects immediately when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(async () => {
      for await (const _event of ask("hello", { locale: "en", signal: controller.signal })) {
        void _event;
      }
    }).rejects.toThrow(AbortError);
  });

  it("leaves no dangling timers behind an aborted wait", async () => {
    vi.useFakeTimers();
    try {
      const controller = new AbortController();
      const pending = delay(5000, controller.signal);
      expect(vi.getTimerCount()).toBe(1);

      controller.abort();
      await expect(pending).rejects.toThrow(AbortError);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears its timer on normal completion too", async () => {
    vi.useFakeTimers();
    try {
      const pending = delay(100);
      await vi.advanceTimersByTimeAsync(100);
      await pending;
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("jitter", () => {
  it("is reproducible for a given seed", () => {
    const a = createJitter(42);
    const b = createJitter(42);
    expect([a(0, 100), a(0, 100), a(0, 100)]).toEqual([b(0, 100), b(0, 100), b(0, 100)]);
  });

  it("stays inside the requested range", () => {
    const jitter = createJitter(7);
    for (let i = 0; i < 200; i += 1) {
      const value = jitter(10, 20);
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(20);
    }
  });
});

// ───────────────────────────── Answer coverage ─────────────────────────────

describe("answer content coverage", () => {
  it("every law can produce a complete card in both languages", () => {
    // A law with empty rights or steps would silently render a blank section.
    for (const law of LAWS) {
      expect(law.rights_en.length, `${law.id} rights_en`).toBeGreaterThan(0);
      expect(law.rights_hi.length, `${law.id} rights_hi`).toBe(law.rights_en.length);
      expect(law.steps_en.length, `${law.id} steps_en`).toBeGreaterThan(0);
      expect(law.steps_hi.length, `${law.id} steps_hi`).toBe(law.steps_en.length);

      for (const text of [...law.rights_en, ...law.steps_en]) {
        expect(text.trim().length, law.id).toBeGreaterThan(0);
      }
      for (const text of [...law.rights_hi, ...law.steps_hi]) {
        expect(/[\u0900-\u097F]/.test(text), `${law.id}: "${text}"`).toBe(true);
      }
    }
  });

  it("reports the composed answer for each demo scenario", () => {
    const lines: string[] = ["", "  Composed answers"];

    for (const scenario of SCENARIOS) {
      for (const locale of ["en", "hi"] as const) {
        const query = locale === "hi" ? scenario.hi : scenario.en;
        const card = answerFor(query, locale);
        lines.push(
          "  " + "-".repeat(74),
          `  ${scenario.name} [${locale}]`,
          `    intent=${card.intent} confidence=${card.confidence} urgency=${card.urgency} lowConfidence=${card.lowConfidence}`,
          `    sources: ${card.sources.map((s) => `${s.law.act} ${s.law.section} (${s.score})`).join(" | ")}`,
          `    rights: ${card.rights.length}  steps: ${card.steps.length}`,
          `    lead-in: ${leadInFor(card, locale)}`,
        );
      }
    }

    lines.push("  " + "-".repeat(74), "");
    console.log(lines.join("\n"));
    expect(lines.length).toBeGreaterThan(0);
  });
});
