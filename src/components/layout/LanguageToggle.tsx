import { LOCALES, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = { en: "English", hi: "हिंदी" };
const SHORT: Record<Locale, string> = { en: "EN", hi: "हिं" };

/**
 * Two-state language switch. A segmented control rather than a dropdown so the
 * choice costs one tap and both options are always legible — the users who most
 * need Hindi are the least likely to hunt through a menu for it.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t.lang.switchAria}
      className={cn(
        "flex shrink-0 items-center gap-0.5 rounded-full bg-card p-1 shadow-[0_2px_10px_oklch(0.5_0.05_265/0.08)]",
        className,
      )}
    >
      {LOCALES.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            lang={code}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="hidden sm:inline">{LABELS[code]}</span>
            <span className="sm:hidden">{SHORT[code]}</span>
          </button>
        );
      })}
    </div>
  );
}
