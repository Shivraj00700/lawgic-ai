import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  ShieldQuestion,
  Siren,
  PhoneCall,
  AudioLines,
  Languages,
  Sparkles,
} from "lucide-react";

import orb from "@/assets/orb.png";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { Wordmark } from "@/components/layout/Wordmark";
import { useT } from "@/lib/i18n/context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lawgic AI — Know Your Rights, in Your Language" },
      {
        name: "description",
        content:
          "Describe your legal problem in your own words. Lawgic AI returns the rights that protect you, the steps to take, and the exact law it came from — plus free legal aid. English and Hindi.",
      },
      { property: "og:title", content: "Lawgic AI — Know Your Rights, in Your Language" },
      {
        property: "og:description",
        content:
          "Cited, urgency-aware legal guidance with a free legal aid handoff. No login, no cost.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const t = useT();

  const features = [
    { icon: BadgeCheck, title: t.landing.features.citedTitle, body: t.landing.features.citedBody },
    {
      icon: ShieldQuestion,
      title: t.landing.features.honestTitle,
      body: t.landing.features.honestBody,
    },
    { icon: Siren, title: t.landing.features.urgencyTitle, body: t.landing.features.urgencyBody },
    { icon: PhoneCall, title: t.landing.features.actionTitle, body: t.landing.features.actionBody },
    { icon: AudioLines, title: t.landing.features.voiceTitle, body: t.landing.features.voiceBody },
    {
      icon: Languages,
      title: t.landing.features.languageTitle,
      body: t.landing.features.languageBody,
    },
  ];

  const steps = [
    { n: "01", title: t.landing.how.oneTitle, body: t.landing.how.oneBody },
    { n: "02", title: t.landing.how.twoTitle, body: t.landing.how.twoBody },
    { n: "03", title: t.landing.how.threeTitle, body: t.landing.how.threeBody },
  ];

  const faqs = [
    { q: t.landing.faq.qHallucination, a: t.landing.faq.aHallucination },
    { q: t.landing.faq.qChatgpt, a: t.landing.faq.aChatgpt },
    { q: t.landing.faq.qPrivacy, a: t.landing.faq.aPrivacy },
    { q: t.landing.faq.qCost, a: t.landing.faq.aCost },
  ];

  const navLinks = [
    { label: t.landing.navFeatures, href: "#features" },
    { label: t.landing.navHow, href: "#how" },
    { label: t.landing.navFaq, href: "#faq" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1140px] items-center justify-between gap-3 px-5">
          <a href="#top" className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <Wordmark />
          </a>
          <nav aria-label="Sections" className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm text-muted-foreground transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <a
              href="tel:112"
              className="flex items-center gap-1.5 rounded-full bg-urgency-red-surface px-3 py-2 text-xs font-medium text-urgency-red-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Siren className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{t.landing.sosLabel}</span>
              <span className="sm:hidden">112</span>
            </a>
            <Link
              to="/app"
              className="hidden rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:block"
            >
              {t.landing.heroCta}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="page-gradient">
        <div className="mx-auto max-w-[1140px] px-5 py-20 text-center sm:py-28">
          <img
            src={orb}
            alt=""
            width={512}
            height={512}
            className="mx-auto size-[120px] drop-shadow-[0_18px_40px_oklch(0.45_0.12_290/0.4)]"
          />
          <h1 className="mx-auto mt-8 max-w-[720px] text-4xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-6xl">
            {t.landing.heroTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-[580px] text-base text-foreground/75 sm:text-lg">
            {t.landing.heroBody}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {t.landing.heroCta} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href="#how"
              className="rounded-full bg-card px-7 py-3.5 text-sm font-medium shadow-[0_2px_12px_oklch(0.4_0.08_285/0.18)] transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {t.landing.heroSecondary}
            </a>
          </div>
          <p className="mt-5 text-xs text-foreground/65">{t.landing.heroFootnote}</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-[1140px] px-5 py-20 sm:py-24">
        <div className="max-w-[640px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" aria-hidden="true" /> {t.landing.featuresEyebrow}
          </span>
          <h2 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl">
            {t.landing.featuresTitle}
          </h2>
          <p className="mt-3 text-muted-foreground">{t.landing.featuresBody}</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-3xl bg-card p-7 ring-1 ring-border transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-24px_oklch(0.4_0.08_285/0.6)]"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-tile-active">
                <Icon className="size-5 text-foreground" strokeWidth={1.7} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-medium">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="canvas-gradient border-y border-border">
        <div className="mx-auto max-w-[1140px] px-5 py-20 sm:py-24">
          <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">{t.landing.howTitle}</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="border-t border-foreground/15 pt-6">
                <span className="text-sm text-muted-foreground">{s.n}</span>
                <h3 className="mt-3 text-xl font-medium">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-[860px] px-5 py-20 sm:py-24">
        <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">{t.landing.faqTitle}</h2>
        <div className="mt-10 divide-y divide-border border-y border-border">
          {faqs.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                {f.q}
                <span aria-hidden="true" className="text-muted-foreground transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="page-gradient">
        <div className="mx-auto max-w-[1140px] px-5 py-20 text-center sm:py-24">
          <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">{t.landing.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-[480px] text-foreground/70">{t.landing.ctaBody}</p>
          <Link
            to="/app"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {t.landing.heroCta} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1140px] px-5 py-8">
          <p className="rounded-2xl bg-secondary/60 px-4 py-3 text-center text-xs text-muted-foreground">
            {t.disclaimer.long}
          </p>
          <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
            <span>
              © {new Date().getFullYear()} {t.brand.name}. {t.landing.footerRights}
            </span>
            <nav aria-label="Footer" className="flex gap-6">
              <a href="#features" className="transition hover:text-foreground">
                {t.landing.navFeatures}
              </a>
              <a href="#how" className="transition hover:text-foreground">
                {t.landing.navHow}
              </a>
              <a href="#faq" className="transition hover:text-foreground">
                {t.landing.navFaq}
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
