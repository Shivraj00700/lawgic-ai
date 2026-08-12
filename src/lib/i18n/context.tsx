import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { en, type Dictionary } from "./locales/en";
import { hi } from "./locales/hi";

export const LOCALES = ["en", "hi"] as const;
export type Locale = (typeof LOCALES)[number];

/** BCP-47 tags used for speech recognition and synthesis. */
export const SPEECH_TAGS: Record<Locale, string> = {
  en: "en-IN",
  hi: "hi-IN",
};

const DICTIONARIES: Record<Locale, Dictionary> = { en, hi };

const STORAGE_KEY = "lawgic.locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

type I18nValue = {
  locale: Locale;
  /** The active dictionary. Access keys directly: `t.nav.rights`. */
  t: Dictionary;
  setLocale: (locale: Locale) => void;
  /** True until the persisted locale has been read from storage on the client. */
  hydrated: boolean;
  /** False when the user has never made an explicit choice — drives the language gate. */
  hasChosen: boolean;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Always start at "en" so the server render and the first client render agree.
  // The persisted value is applied in an effect to avoid a hydration mismatch.
  const [locale, setLocaleState] = useState<Locale>("en");
  const [hydrated, setHydrated] = useState(false);
  const [hasChosen, setHasChosen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isLocale(stored)) {
        setLocaleState(stored);
        setHasChosen(true);
      }
    } catch {
      // Private browsing or blocked storage. English is a safe default.
    }
    setHydrated(true);
  }, []);

  // Keep <html lang> truthful for screen readers and speech synthesis.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setHasChosen(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-fatal: the choice just will not survive a reload.
    }
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ locale, t: DICTIONARIES[locale], setLocale, hydrated, hasChosen }),
    [locale, setLocale, hydrated, hasChosen],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/** Shorthand for the active dictionary: `const t = useT(); t.nav.rights`. */
export function useT(): Dictionary {
  return useI18n().t;
}

/**
 * Fills `{placeholder}` tokens in a dictionary string.
 * `interpolate(t.helplines.callAria, { name: "Police", number: "112" })`
 */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
