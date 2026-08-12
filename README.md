# Lawgic AI

**Know Your Rights, in Your Language.**

Access to legal information in India is gated by literacy, language, and cost.
Lawgic AI is a digital assistant that takes a citizen's problem in their own
words and returns three things: the rights that protect them, the concrete steps
they can take now, and the exact law it came from — then hands them off to free
legal aid.

> Verified, cited, urgency-aware legal navigation that turns a citizen's own
> words into a concrete next action and a legal-aid handoff — in their own
> language.

## What makes it different

- **Citation-first.** Every answer names the Act and Section behind it. A
  "Why this answer?" trace expands to show the retrieved clause and why it
  matched. If nothing matches with confidence, the assistant says so and routes
  to a human instead of guessing.
- **Urgency-aware.** Input is triaged into three tiers. A red-tier signal
  (danger in progress) interrupts the normal answer entirely and shows tappable
  emergency helplines with no probing follow-up questions. Disclosure by a minor
  routes to a simplified trusted-adult flow.
- **Action-oriented.** Every conversation ends in a real handoff to NALSA or the
  user's State Legal Services Authority, not in a wall of text.
- **Voice in, voice out.** Ask by speaking, and have the answer read back. Someone
  who cannot read can use this end to end.

## Scope of this version

Being direct about what is and is not built, because overclaiming is worse than
a narrow, honest demo.

**Built:** the full conversational loop — intake, classification, urgency triage,
cited answer cards with citation trace and visible confidence, emergency
helplines, and legal-aid handoff. English and Hindi. Voice input and read-aloud.
A read-only Know-Your-Rights library. Session-only history.

**Sample data, 6 categories, 12 laws, 10 Acts.** The corpus is hand-curated
across Consumer & Money, Housing & Property, Work & Wages, Family, Safety &
Crime, and Documents & Entitlements — two entries per category, each linking to
its official text on the Government of India's
[India Code](https://www.indiacode.nic.in/) portal. It is a demonstration set,
not a complete index of Indian law.

Beneficiary groups currently tagged: all citizens, women, children, senior
citizens, persons with disability, workers, tenants, and consumers. **Scheduled
Castes and Scheduled Tribes are named in the brief but are not covered by this
12-law set** — the SC/ST (Prevention of Atrocities) Act, 1989 and the Forest
Rights Act, 2006 are the obvious next entries. Saying so plainly is more useful
than implying coverage that is not there.

One entry is deliberately state-scoped (the Maharashtra Rent Control Act, 1999)
so that state-specific ranking is a real, demonstrable behaviour rather than an
untested code path.

**Roadmap, not built:** the KYR library as a fully searchable and filterable
index of central and state legislation, additional regional languages, legal
news, case studies, guided learning, document templates, live lawyer chat, and
production accessibility controls (font scaling, high-contrast themes).

## Privacy

There is no backend and no account system in this version. No user data leaves
the browser. The optional profile — state, age band, gender — is stored only in
`localStorage` and is used solely to match state-specific law and the nearest
legal aid office. Name, phone number, and date of birth are never requested.
Conversation history is held in memory for the session and is not persisted.

## Not legal advice

Lawgic AI provides general legal information. It is not a substitute for advice
from a qualified lawyer, and the content in this repository is illustrative
sample data. Always verify against the official source linked on each card.

## Tech

TanStack Start (file-based routing, SSR) · React 19 · TypeScript · Tailwind CSS v4
· shadcn/ui · Vitest · Web Speech API

The assistant's intelligence sits behind one seam — `engine.ask()` in
`src/lib/assistant/engine.ts` — which returns an async generator of typed
events. A deterministic keyword matcher over the curated corpus drives it today;
a retrieval-augmented backend can be swapped in without the UI changing.

## Local development

Requires Node.js 20 or newer.

```sh
git clone <this-repository-url>
cd lawgic-ai
npm install
npm run dev
```

The dev server prints a local URL, by default `http://localhost:8080`.

```sh
npm test           # unit tests: classifier, retriever, corpus, locale parity
npm run build      # production build
npm run lint       # eslint
npm run format     # prettier
```

## Emergency numbers

These are live, free, national numbers in India and are surfaced throughout the
app without requiring a login:

| Service | Number |
| --- | --- |
| Emergency (Police / Fire / Ambulance) | 112 |
| Women's Helpline | 181 |
| Childline | 1098 |
| Cyber Crime | 1930 |
| NALSA Legal Aid | 15100 |

## License

MIT — see [LICENSE](./LICENSE).
