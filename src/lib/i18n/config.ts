/**
 * Pure i18n configuration and helpers — no React.
 *
 * Kept separate from `context.tsx` so non-UI modules (the speech layer, the
 * assistant engine) can read locale config without importing a React context.
 */

export const LOCALES = ["en", "hi"] as const;
export type Locale = (typeof LOCALES)[number];

/** BCP-47 tags for SpeechRecognition and SpeechSynthesis. */
export const SPEECH_TAGS: Record<Locale, string> = {
  en: "en-IN",
  hi: "hi-IN",
};

export const LOCALE_STORAGE_KEY = "lawgic.locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Fills `{placeholder}` tokens in a dictionary string.
 *
 * Unknown placeholders are left intact rather than replaced with "undefined",
 * so a missing value shows up as an obvious bug instead of leaking into the UI.
 */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
