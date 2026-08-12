# Lawgic AI — notes for contributors and agents

## What this is

A digital assistant for legal awareness in India, integrated with a
Know-Your-Rights framework. The positioning that every decision traces back to:

> Verified, cited, urgency-aware legal navigation that turns a citizen's own
> words into a concrete next action and a legal-aid handoff — in their own
> language.

## Standing constraints

1. **Install nothing new without a reason.** All 46 shadcn/ui primitives are
   already in `src/components/ui/`. Check there before adding a dependency.
2. **No answer card without a citation.** Any response that cannot be matched to
   a real entry in `src/data/laws.ts` must visibly downgrade to low confidence
   and route the user to legal aid. This is the product's integrity claim.
3. **The disclaimer is not decoration.** All legal content here is hand-curated
   sample data. "General information, not legal advice" stays permanently
   visible in the composer and on the landing page.
4. **Accessibility is built into each change, never deferred.** Labels on
   icon-only buttons, focus-visible rings, `aria-live` on streaming regions,
   semantic heading order, and `prefers-reduced-motion` respected. The users
   this is for include non-literate citizens and people with disabilities.
5. **Never leave a dead button.** If something is unsupported or unbuilt, hide
   the control or mark it `aria-disabled` with a "Coming soon" badge.
6. **Keep `server: { entry: "server" }`** in the TanStack Start config.
   `src/server.ts` is the SSR error wrapper and nitro builds from it.
7. **Both locales must stay in sync.** `src/lib/i18n/locales/en.ts` is the
   source of truth for shape; `hi.ts` is typed against it so a missing key is a
   compile error. There is also a parity test.

## Architecture seam

`engine.ask(query, locale, profile, signal)` in `src/lib/assistant/engine.ts`
returns an async generator of typed events. A deterministic keyword matcher over
`src/data/laws.ts` drives it today; a real RAG backend can drive it later. The UI
must never know the difference — keep that boundary clean.
