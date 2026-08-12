/**
 * Text normalisation shared by the classifier and the retriever.
 *
 * Both MUST use this, or a keyword will match in one and silently miss in the
 * other. That class of bug is invisible until a demo question half-works.
 */

/** Devanagari combining nukta. Removing it collapses ख़ -> ख, ज़ -> ज, ड़ -> ड. */
const NUKTA = /\u093C/g;

/** Devanagari digits ० through ९, so "मैं १५ साल" parses like "मैं 15 साल". */
const DEVANAGARI_DIGITS = /[\u0966-\u096F]/g;

function asciifyDigits(input: string): string {
  return input.replace(DEVANAGARI_DIGITS, (d) => String(d.charCodeAt(0) - 0x0966));
}

/**
 * Lowercases, strips punctuation, folds Devanagari nukta variants, converts
 * Devanagari digits, and collapses whitespace.
 *
 * Nukta folding matters in practice: people type both "ख़राब" and "खराब" for
 * "broken", and both "ज़मा" and "जमा" for "deposit". Folding means the corpus
 * only has to spell each term one way.
 */
export function normalize(input: string): string {
  return (
    asciifyDigits(input)
      .toLowerCase()
      .normalize("NFC")
      .replace(NUKTA, "")
      // Keep letters, digits, COMBINING MARKS, and spaces; everything else becomes
      // a space so "deposit,not returned!" still tokenises.
      //
      // \p{M} is not optional. Devanagari vowel signs (ा ि ी ु) and the virama (्)
      // are Unicode marks, not letters — dropping them would silently mangle every
      // Hindi term into unmatchable rubble ("बलात्कार" -> "बलातकार").
      .replace(/[^\p{L}\p{N}\p{M}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Normalises a stored vocabulary term the same way user input is normalised.
 *
 * Every keyword and signal term is passed through this at module load, so the
 * source files can spell Hindi correctly and readably ("छेड़छाड़") while
 * matching still happens on the folded form ("छेडछाड").
 */
export function normalizeTerm(term: string): string {
  return normalize(term);
}

/**
 * Substring match on normalised text, with word-boundary safety for short
 * Latin terms.
 *
 * Without this, the keyword "pay" would match inside "paying", "repay", and
 * worse, "payment plan" — inflating scores on unrelated text. Devanagari has no
 * reliable word boundary in JS regex, and Hindi is agglutinative anyway, so
 * substring matching is the correct behaviour there.
 */
export function containsTerm(haystack: string, term: string): boolean {
  if (!term) return false;

  const isShortLatin = term.length <= 4 && /^[a-z0-9\s]+$/.test(term);
  if (!isShortLatin) return haystack.includes(term);

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, "u").test(haystack);
}

/** Rough word count, used to weight multi-word keywords as more specific. */
export function wordCount(term: string): number {
  return term.split(/\s+/).filter(Boolean).length;
}
