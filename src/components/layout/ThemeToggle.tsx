import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "lawgic-theme";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/**
 * Dark/light mode toggle. Reads system preference on first load, persists the
 * user's choice in localStorage so it survives reloads.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // On mount: read stored preference or fall back to system
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const initial = stored === "dark" || stored === "light" ? stored : getSystemTheme();
      setTheme(initial);
      applyTheme(initial);
    } catch {
      // Private browsing — light is fine
    }
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      applyTheme(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Non-fatal
      }
      return next;
    });
  }, []);

  // Avoid hydration mismatch — render nothing until mounted
  if (!mounted) {
    return <div className="size-9" aria-hidden="true" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid size-9 place-items-center rounded-full ring-1 ring-border transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {isDark ? (
        <Sun className="size-[18px] text-foreground/80" strokeWidth={1.7} aria-hidden="true" />
      ) : (
        <Moon className="size-[18px] text-foreground/80" strokeWidth={1.7} aria-hidden="true" />
      )}
    </button>
  );
}
