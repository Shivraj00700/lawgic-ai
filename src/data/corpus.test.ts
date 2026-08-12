import { describe, expect, it } from "vitest";

import { CATEGORIES, CATEGORY_BY_ID, isCategoryId } from "./categories";
import { EMERGENCY_HELPLINES, HELPLINES } from "./helplines";
import { LAWS, LAW_BY_ID } from "./laws";
import { NALSA, STATE_LEGAL_AID, STATE_NAMES, legalAidFor } from "./legalAid";
import { BENEFICIARY_TAGS, CATEGORY_IDS, STATE_CODES } from "./types";

const LAWS_PER_CATEGORY = 2;

describe("corpus integrity", () => {
  it("holds exactly two laws per category, and nothing else", () => {
    expect(LAWS).toHaveLength(CATEGORY_IDS.length * LAWS_PER_CATEGORY);

    for (const category of CATEGORY_IDS) {
      const inCategory = LAWS.filter((law) => law.category === category);
      expect(inCategory, `category "${category}"`).toHaveLength(LAWS_PER_CATEGORY);
    }
  });

  it("has no duplicate ids", () => {
    const ids = LAWS.map((law) => law.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("resolves every id through LAW_BY_ID", () => {
    for (const law of LAWS) {
      expect(LAW_BY_ID[law.id]).toBe(law);
    }
  });

  // Types guarantee these fields EXIST. They cannot catch an empty string, which
  // is the realistic failure when someone stubs an entry and forgets to fill it.
  it.each(LAWS.map((law) => [law.id, law] as const))(
    "%s has non-empty text in both English and Hindi",
    (_id, law) => {
      for (const field of [
        "title_en",
        "title_hi",
        "plain_en",
        "plain_hi",
        "act",
        "section",
      ] as const) {
        expect(law[field].trim().length, `${law.id}.${field}`).toBeGreaterThan(0);
      }
    },
  );

  it.each(LAWS.map((law) => [law.id, law] as const))(
    "%s has real Devanagari in its Hindi fields, not English fallback",
    (_id, law) => {
      const devanagari = /[\u0900-\u097F]/;
      expect(devanagari.test(law.title_hi), `${law.id}.title_hi`).toBe(true);
      expect(devanagari.test(law.plain_hi), `${law.id}.plain_hi`).toBe(true);
    },
  );

  it.each(LAWS.map((law) => [law.id, law] as const))(
    "%s carries a valid category, scope, and beneficiary tags",
    (_id, law) => {
      expect(CATEGORY_IDS).toContain(law.category);
      expect([...STATE_CODES, "IN"]).toContain(law.stateScope);
      expect(law.beneficiaryTags.length, `${law.id} beneficiaryTags`).toBeGreaterThan(0);
      for (const tag of law.beneficiaryTags) {
        expect(BENEFICIARY_TAGS).toContain(tag);
      }
    },
  );

  it.each(LAWS.map((law) => [law.id, law] as const))(
    "%s links to an official government source over https",
    (_id, law) => {
      const url = new URL(law.sourceUrl);
      expect(url.protocol).toBe("https:");
      // Every citation must resolve to a .gov.in / .nic.in domain. A card that
      // cites a blog is not a verified source.
      expect(url.hostname).toMatch(/\.(gov|nic)\.in$/);
    },
  );

  it.each(LAWS.map((law) => [law.id, law] as const))(
    "%s has enough keywords, including Romanized Hindi",
    (_id, law) => {
      // Thin keyword sets are how the classifier silently starts missing.
      expect(law.keywords.length, `${law.id} keywords`).toBeGreaterThanOrEqual(10);

      // Keywords are matched against lowercased input, so an uppercase keyword
      // would be dead weight.
      for (const keyword of law.keywords) {
        expect(keyword, `${law.id} keyword "${keyword}"`).toBe(keyword.toLowerCase());
        expect(keyword.trim().length).toBeGreaterThan(0);
      }

      const hasDevanagari = law.keywords.some((k) => /[\u0900-\u097F]/.test(k));
      const hasAscii = law.keywords.some((k) => /^[a-z0-9\s'-]+$/.test(k));
      expect(hasDevanagari, `${law.id} needs Devanagari keywords`).toBe(true);
      expect(hasAscii, `${law.id} needs Latin-script keywords`).toBe(true);
    },
  );

  it("has no duplicate keywords within a single law", () => {
    for (const law of LAWS) {
      expect(new Set(law.keywords).size, `${law.id}`).toBe(law.keywords.length);
    }
  });

  it("covers the beneficiary groups the brief names explicitly", () => {
    const covered = new Set(LAWS.flatMap((law) => law.beneficiaryTags));
    // Named in the Know-Your-Rights brief. Scheduled Castes/Tribes is knowingly
    // NOT covered by this 12-law demonstration set — see README scope section.
    for (const tag of ["women", "children", "seniorCitizens", "personsWithDisability"] as const) {
      expect(covered, `beneficiary "${tag}"`).toContain(tag);
    }
  });

  it("includes at least one state-scoped law so state ranking is exercisable", () => {
    expect(LAWS.some((law) => law.stateScope !== "IN")).toBe(true);
  });

  it("reports coverage", () => {
    const rows = CATEGORY_IDS.map((category) => {
      const inCategory = LAWS.filter((law) => law.category === category);
      return {
        category,
        laws: inCategory.length,
        keywords: inCategory.reduce((sum, law) => sum + law.keywords.length, 0),
        acts: new Set(inCategory.map((law) => law.act)).size,
      };
    });

    const width = Math.max(...rows.map((r) => r.category.length));
    const lines = [
      "",
      "  Corpus coverage",
      "  " + "-".repeat(width + 30),
      ...rows.map(
        (r) =>
          `  ${r.category.padEnd(width)}  ${String(r.laws).padStart(2)} laws  ` +
          `${String(r.acts).padStart(2)} acts  ${String(r.keywords).padStart(3)} keywords`,
      ),
      "  " + "-".repeat(width + 30),
      `  ${"total".padEnd(width)}  ${String(LAWS.length).padStart(2)} laws  ` +
        `${String(new Set(LAWS.map((l) => l.act)).size).padStart(2)} acts  ` +
        `${String(LAWS.reduce((s, l) => s + l.keywords.length, 0)).padStart(3)} keywords`,
      `  beneficiary groups covered: ${[...new Set(LAWS.flatMap((l) => l.beneficiaryTags))].sort().join(", ")}`,
      `  state-scoped entries: ${LAWS.filter((l) => l.stateScope !== "IN")
        .map((l) => `${l.id} (${l.stateScope})`)
        .join(", ")}`,
      "",
    ];

    console.log(lines.join("\n"));
    expect(rows.every((r) => r.laws === LAWS_PER_CATEGORY)).toBe(true);
  });
});

describe("categories", () => {
  it("defines exactly one entry per category id, with seeds in both languages", () => {
    expect(CATEGORIES).toHaveLength(CATEGORY_IDS.length);
    for (const id of CATEGORY_IDS) {
      const category = CATEGORY_BY_ID[id];
      expect(category, `category "${id}"`).toBeDefined();
      expect(category.seed_en.trim().length).toBeGreaterThan(0);
      expect(category.seed_hi.trim().length).toBeGreaterThan(0);
      expect(/[\u0900-\u097F]/.test(category.seed_hi)).toBe(true);
    }
  });

  it("guards against unknown category ids", () => {
    expect(isCategoryId("consumer")).toBe(true);
    expect(isCategoryId("tax")).toBe(false);
    expect(isCategoryId(undefined)).toBe(false);
  });
});

describe("helplines", () => {
  it("includes the five national numbers, digits only so tel: links work", () => {
    expect(HELPLINES.map((h) => h.number)).toEqual(["112", "181", "1098", "1930", "15100"]);
    for (const helpline of HELPLINES) {
      expect(helpline.number).toMatch(/^\d+$/);
    }
  });

  it("puts the general emergency number first for red-tier use", () => {
    expect(EMERGENCY_HELPLINES[0]?.number).toBe("112");
  });

  it("excludes the legal aid line from emergency numbers", () => {
    // 15100 is a legal aid helpline, not an emergency service. Listing it in a
    // red-tier response would waste the seconds that matter most.
    expect(EMERGENCY_HELPLINES.map((h) => h.id)).not.toContain("nalsa");
  });

  it("has no duplicate ids or numbers", () => {
    expect(new Set(HELPLINES.map((h) => h.id)).size).toBe(HELPLINES.length);
    expect(new Set(HELPLINES.map((h) => h.number)).size).toBe(HELPLINES.length);
  });
});

describe("legal aid", () => {
  it("names every state in both languages", () => {
    for (const code of STATE_CODES) {
      const name = STATE_NAMES[code];
      expect(name.en.trim().length, code).toBeGreaterThan(0);
      expect(/[\u0900-\u097F]/.test(name.hi), `${code} hi`).toBe(true);
    }
  });

  it("provides one authority per state, over https", () => {
    expect(STATE_LEGAL_AID).toHaveLength(STATE_CODES.length);
    for (const office of STATE_LEGAL_AID) {
      expect(new URL(office.website).protocol).toBe("https:");
      expect(office.phone).toMatch(/^\d+$/);
    }
  });

  it("falls back to NALSA alone when no state is known", () => {
    expect(legalAidFor()).toEqual([NALSA]);
  });

  it("puts the state authority before NALSA when a state is known", () => {
    const offices = legalAidFor("MH");
    expect(offices).toHaveLength(2);
    expect(offices[0]?.scope).toBe("MH");
    expect(offices[1]).toBe(NALSA);
  });
});
