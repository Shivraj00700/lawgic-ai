import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Scale,
  FileText,
  History,
  Siren,
  User,
  MessageSquarePlus,
  MessageSquare,
  Send,
  Mic,
  Banknote,
  Home,
  Briefcase,
  Users,
  ShieldAlert,
  FileBadge,
} from "lucide-react";
import { useState, type ComponentType } from "react";

import orb from "@/assets/orb.png";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { Wordmark } from "@/components/layout/Wordmark";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Lawgic AI — Know Your Rights" },
      {
        name: "description",
        content:
          "Describe your legal problem in your own words and get your rights, the steps to take, and the law it comes from — in English or Hindi.",
      },
      { property: "og:title", content: "Lawgic AI — Know Your Rights" },
      {
        property: "og:description",
        content:
          "Cited, urgency-aware legal guidance with a free legal aid handoff, in English and Hindi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Assistant,
});

type CategoryId = "consumer" | "housing" | "work" | "family" | "safety" | "documents";

const CATEGORIES: { id: CategoryId; icon: ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
  { id: "consumer", icon: Banknote },
  { id: "housing", icon: Home },
  { id: "work", icon: Briefcase },
  { id: "family", icon: Users },
  { id: "safety", icon: ShieldAlert },
  { id: "documents", icon: FileBadge },
];

type ScenarioId = "defectiveProduct" | "unpaidWages" | "deposit";

/** Seed text dropped into the composer when a scenario pill is tapped. */
const SCENARIO_SEEDS: Record<ScenarioId, Record<"en" | "hi", string>> = {
  defectiveProduct: {
    en: "I bought a phone last week and it stopped working. The shop refuses to refund me.",
    hi: "मैंने पिछले हफ़्ते एक फ़ोन खरीदा और वह बंद हो गया। दुकानदार पैसे लौटाने से मना कर रहा है।",
  },
  unpaidWages: {
    en: "My employer has not paid my wages for two months.",
    hi: "मेरे मालिक ने दो महीने से मेरी मज़दूरी नहीं दी है।",
  },
  deposit: {
    en: "I moved out of my rented house but my landlord is keeping my security deposit.",
    hi: "मैंने किराये का मकान छोड़ दिया लेकिन मकान मालिक मेरी जमा राशि रोक रहा है।",
  },
};

function Assistant() {
  const { t, locale } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [draft, setDraft] = useState("");

  // Sidebar destinations arrive in a later task; until the routes exist these
  // are marked aria-disabled rather than linking to a 404.
  const primaryNav = [
    { key: "rights", icon: BookOpen, label: t.nav.rights, ready: false },
    { key: "legalAid", icon: Scale, label: t.nav.legalAid, ready: false },
    { key: "history", icon: History, label: t.nav.history, ready: false },
    { key: "templates", icon: FileText, label: t.nav.templates, ready: false },
  ];

  return (
    <div className="page-gradient min-h-screen w-full p-4 sm:p-8 lg:p-12">
      <div className="mx-auto flex max-w-[1240px] overflow-hidden rounded-[28px] bg-card shadow-[0_30px_80px_-20px_oklch(0.4_0.08_285/0.45)]">
        {/* Sidebar */}
        <aside className="hidden w-[300px] shrink-0 flex-col gap-4 p-4 lg:flex">
          <div className="rounded-2xl bg-primary px-4 py-3.5 text-primary-foreground">
            <Link to="/" className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              <Wordmark tone="inverted" />
              <span className="mt-0.5 block text-xs font-normal opacity-75">{t.brand.tagline}</span>
            </Link>
          </div>

          <nav aria-label="Main" className="flex flex-col rounded-2xl bg-card p-1.5 ring-1 ring-border">
            <button
              type="button"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[15px] transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => {
                setDraft("");
                setSelectedCategory(null);
              }}
            >
              <MessageSquarePlus className="size-[18px] text-foreground/80" strokeWidth={1.7} aria-hidden="true" />
              {t.nav.newChat}
            </button>

            {primaryNav.map(({ key, icon: Icon, label, ready }) => (
              <span
                key={key}
                aria-disabled={!ready}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px]",
                  ready ? "cursor-pointer hover:bg-secondary" : "cursor-not-allowed text-muted-foreground",
                )}
              >
                <Icon className="size-[18px] opacity-70" strokeWidth={1.7} aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {!ready && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                    {t.nav.comingSoon}
                  </span>
                )}
              </span>
            ))}
          </nav>

          <nav aria-label="Account" className="mt-auto flex flex-col rounded-2xl bg-card p-1.5 ring-1 ring-border">
            <span
              aria-disabled="true"
              className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] text-muted-foreground"
            >
              <User className="size-[18px] opacity-70" strokeWidth={1.7} aria-hidden="true" />
              {t.nav.profile}
            </span>
            <a
              href="mailto:hello@lawgic.example?subject=Lawgic%20AI%20feedback"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <MessageSquare className="size-[18px] text-foreground/80" strokeWidth={1.7} aria-hidden="true" />
              {t.nav.feedback}
            </a>
            <a
              href="tel:112"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-medium text-urgency-red transition hover:bg-urgency-red-surface focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Siren className="size-[18px]" strokeWidth={1.9} aria-hidden="true" />
              {t.nav.sos}
            </a>
          </nav>
        </aside>

        {/* Main canvas */}
        <main className="canvas-gradient min-h-[860px] flex-1 rounded-[28px] p-5 sm:p-8">
          <header className="flex items-center justify-between gap-3">
            <Link
              to="/"
              className="lg:hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Wordmark className="text-base" />
            </Link>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <LanguageToggle />
              <button
                type="button"
                aria-disabled="true"
                aria-label={t.topbar.profileAria}
                className="flex cursor-not-allowed items-center gap-2.5 rounded-full bg-card py-1.5 pl-1.5 pr-4 shadow-[0_2px_10px_oklch(0.5_0.05_265/0.08)]"
              >
                <span className="grid size-9 place-items-center rounded-full bg-secondary">
                  <User className="size-[18px] text-foreground/70" strokeWidth={1.7} aria-hidden="true" />
                </span>
                <span className="hidden leading-tight sm:block">
                  <span className="block text-sm font-medium">{t.topbar.guest}</span>
                  <span className="block text-xs text-muted-foreground">{t.topbar.setState}</span>
                </span>
              </button>
            </div>
          </header>

          <section className="mt-12 text-center sm:mt-14">
            <img
              src={orb}
              alt=""
              width={512}
              height={512}
              className="mx-auto size-[104px] drop-shadow-[0_14px_30px_oklch(0.6_0.12_290/0.35)]"
            />
            <h1 className="mx-auto mt-6 max-w-[520px] text-[26px] font-medium leading-[1.28] tracking-tight text-foreground sm:text-[30px]">
              {t.chat.welcomeTitle}
            </h1>
            <p className="mx-auto mt-3 max-w-[460px] text-sm text-muted-foreground">
              {t.chat.welcomeSubtitle}
            </p>
          </section>

          {/* Category tiles — the six legal areas. Wired to the engine in a later task. */}
          <section className="mx-auto mt-9 max-w-[660px]">
            <h2 className="sr-only">{t.chat.categoriesLabel}</h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {CATEGORIES.map(({ id, icon: Icon }) => {
                const active = selectedCategory === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedCategory(active ? null : id)}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-2xl px-2 py-5 shadow-[0_2px_10px_oklch(0.5_0.05_265/0.07)] transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      active ? "bg-tile-active" : "bg-card",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 place-items-center rounded-full",
                        active ? "bg-primary text-primary-foreground" : "text-foreground/80",
                      )}
                    >
                      <Icon className="size-[18px]" strokeWidth={1.7} />
                    </span>
                    <span className="text-center text-[12px] leading-tight">{t.categories[id]}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Composer */}
          <div className="mx-auto mt-8 max-w-[660px] overflow-hidden rounded-3xl bg-card shadow-[0_4px_24px_oklch(0.5_0.05_265/0.1)]">
            <p className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 text-xs text-muted-foreground">
              <span>{t.disclaimer.short}</span>
              <span lang={locale} className="shrink-0">
                {locale === "hi" ? t.lang.hi : t.lang.en}
              </span>
            </p>

            <div className="flex items-center gap-3 px-5 py-5">
              <label htmlFor="composer" className="sr-only">
                {t.chat.welcomeTitle}
              </label>
              <input
                id="composer"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t.chat.placeholder}
                className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                aria-label={t.chat.mic}
                className="grid size-10 shrink-0 place-items-center rounded-full ring-1 ring-border transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Mic className="size-[18px] text-foreground/80" strokeWidth={1.7} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={t.chat.send}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Send className="size-[17px]" strokeWidth={1.7} aria-hidden="true" />
              </button>
            </div>

            {/* Scenario pills — tap to fill the composer for someone who cannot
                phrase a legal problem from a blank box. */}
            <div className="px-5 pb-5">
              <h2 className="mb-2 text-[11px] text-muted-foreground">{t.chat.scenariosLabel}</h2>
              <div className="flex flex-wrap items-center gap-2">
                {(Object.keys(SCENARIO_SEEDS) as ScenarioId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDraft(SCENARIO_SEEDS[id][locale])}
                    className="rounded-full px-3.5 py-2 text-xs ring-1 ring-border transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {t.scenarios[id]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
