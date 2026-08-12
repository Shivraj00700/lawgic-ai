import { describe, expect, it } from "vitest";

import { interpolate } from "./context";
import { en } from "./locales/en";
import { hi } from "./locales/hi";

type Leaf = { path: string; value: string };

function flatten(value: unknown, prefix = ""): Leaf[] {
  if (typeof value === "string") return [{ path: prefix, value }];
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      flatten(child, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [];
}

const enLeaves = flatten(en);
const hiLeaves = flatten(hi);
const hiByPath = new Map(hiLeaves.map((leaf) => [leaf.path, leaf.value]));

/**
 * Key PARITY is already guaranteed at compile time, because `hi` is typed as
 * `Dictionary`. These tests cover what the type system cannot see: empty
 * strings, English text left sitting in the Hindi file, and broken placeholders.
 */
describe("locale files", () => {
  it("both flatten to the same set of keys", () => {
    expect(hiLeaves.length).toBe(enLeaves.length);
    for (const leaf of enLeaves) {
      expect(hiByPath.has(leaf.path), `hi is missing "${leaf.path}"`).toBe(true);
    }
  });

  it("has no empty strings in either locale", () => {
    for (const leaf of [...enLeaves, ...hiLeaves]) {
      expect(leaf.value.trim().length, `empty value at "${leaf.path}"`).toBeGreaterThan(0);
    }
  });

  it("has real Hindi wherever the English is prose", () => {
    // Values that are intentionally identical across locales: the brand name,
    // the language labels themselves, and numeric age bands.
    const SHARED = new Set([
      "brand.name",
      "lang.en",
      "lang.hi",
      "chat.assistantLabel",
      "profile.ageBands.18to25",
      "profile.ageBands.26to40",
      "profile.ageBands.41to60",
    ]);

    const untranslated: string[] = [];
    for (const leaf of enLeaves) {
      if (SHARED.has(leaf.path)) continue;
      const hiValue = hiByPath.get(leaf.path);
      if (hiValue === undefined) continue;

      if (!/[\u0900-\u097F]/.test(hiValue)) {
        untranslated.push(`${leaf.path} -> "${hiValue}"`);
      }
    }

    expect(untranslated, `Hindi values with no Devanagari:\n${untranslated.join("\n")}`).toEqual([]);
  });

  it("keeps the same placeholders in both locales", () => {
    const placeholders = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort();

    for (const leaf of enLeaves) {
      const hiValue = hiByPath.get(leaf.path);
      if (hiValue === undefined) continue;
      expect(placeholders(hiValue), `placeholder mismatch at "${leaf.path}"`).toEqual(
        placeholders(leaf.value),
      );
    }
  });

  it("leaves no unfilled placeholders after interpolation", () => {
    expect(interpolate(en.helplines.callAria, { name: "Police", number: "112" })).toBe(
      "Call Police at 112",
    );
    expect(interpolate(hi.topbar.stateSet, { state: "महाराष्ट्र" })).not.toContain("{");
  });

  it("keeps unknown placeholders intact rather than printing undefined", () => {
    expect(interpolate("Call {name} at {number}", { name: "Police" })).toBe("Call Police at {number}");
  });
});
