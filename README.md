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

---

## Future Architecture

This section documents the complete target architecture Lawgic AI is growing
toward. Everything below builds on the existing seam-based design — extending
it, never replacing what works.

### High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
│                                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Landing  │  │  Chat / Ask  │  │  KYR Library │  │  User Dashboard   │  │
│  │  Page    │  │  Interface   │  │  (Search +   │  │  (History, Saved  │  │
│  │          │  │              │  │   Filter)    │  │   Cards, Profile) │  │
│  └──────────┘  └──────┬───────┘  └──────┬───────┘  └───────┬───────────┘  │
│                        │                 │                   │              │
│  ┌─────────────────────┴─────────────────┴───────────────────┴──────────┐  │
│  │                      Shared UI Layer                                  │  │
│  │  shadcn/ui · Tailwind v4 · i18n Context · Theme Context · A11y       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌─────────────────────────────────┴────────────────────────────────────┐  │
│  │                   engine.ask() — The Seam                            │  │
│  │  Same AskEvent protocol. Client never knows what drives it.          │  │
│  └──────────────────────────────────┬───────────────────────────────────┘  │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │ SSE / WebSocket
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (Nitro / Edge)                         │
│                                                                             │
│  ┌──────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │  Auth    │  │  Rate      │  │  Telemetry │  │  Feature Flags         │ │
│  │  (JWT)   │  │  Limiter   │  │  Collector │  │  (Regional rollout)    │ │
│  └──────────┘  └────────────┘  └────────────┘  └────────────────────────┘ │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                    ┌──────────────────┬┴──────────────────┐
                    ▼                  ▼                    ▼
┌──────────────────────┐  ┌──────────────────┐  ┌────────────────────────────┐
│   RAG Pipeline       │  │  Corpus Service  │  │   Handoff & Scheduling     │
│                      │  │                  │  │                            │
│  Embedding Model     │  │  Law CRUD        │  │  NALSA / SLSA Routing      │
│  Vector Store        │  │  Verification    │  │  Appointment Booking       │
│  Reranker            │  │  Changelog       │  │  Live Chat Queue           │
│  Citation Linker     │  │  Contributor     │  │  Document Generator        │
│                      │  │  Review Pipeline │  │  (RTI drafts, complaints)  │
└──────────┬───────────┘  └────────┬─────────┘  └────────────┬───────────────┘
           │                       │                          │
           └───────────────────────┼──────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                          │
│                                                                             │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  PostgreSQL    │  │  Vector DB      │  │  Object Storage (S3)        │  │
│  │  (Users,       │  │  (Embeddings,   │  │  (Document templates,       │  │
│  │   Sessions,    │  │   Chunks,       │  │   generated PDFs,           │  │
│  │   Audit Log)   │  │   Metadata)     │  │   audio TTS cache)          │  │
│  └────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase 1 — Corpus Expansion & KYR Library (Q3 2026)

**Goal:** Go from 12 laws to 200+ verified entries. Make the corpus browsable.

| Component | Work |
| --- | --- |
| **Corpus pipeline** | Contributor portal with review workflow. Each law entry goes through: draft → legal review → Hindi translation → QA → publish. Version history on every field. |
| **KYR Library route** | `/library` — searchable, filterable by category, state, beneficiary group. Server-side rendered for SEO. Paginated with infinite scroll. |
| **Full-text + faceted search** | Index corpus with a lightweight search engine (MeiliSearch or Typesense). Autocomplete. Devanagari tokenizer for Hindi queries. |
| **State-specific coverage** | Expand `STATE_CODES` to cover all 28 states + 8 UTs. Each state gets at least its Rent Control, Land Revenue, and Police Acts. |
| **Beneficiary expansion** | Add SC/ST (PoA) Act 1989, Forest Rights Act 2006, LGBTQ+ protections (Navtej Singh Johar), transgender rights (NALSA v. Union). |
| **Category additions** | Education & Scholarships, Land & Agriculture, Digital & Privacy, Environment. |

### Phase 2 — RAG Backend & Intelligent Retrieval (Q4 2026)

**Goal:** Replace keyword matching with semantic retrieval. Same `AskEvent` protocol — UI does not change.

```
User Query
    │
    ▼
┌─────────────────┐     ┌────────────────────┐     ┌──────────────────┐
│  Normalizer     │────▶│  Embedding Model   │────▶│  Vector Search   │
│  (transliterate,│     │  (multilingual,    │     │  (top-k + MMR    │
│   expand abbrev)│     │   e5-large or      │     │   diversification│
│                 │     │   IndicBERT)       │     │   + state boost) │
└─────────────────┘     └────────────────────┘     └────────┬─────────┘
                                                            │
                                                            ▼
┌──────────────────┐     ┌────────────────────┐     ┌──────────────────┐
│  Citation        │◀────│  Reranker          │◀────│  Candidate       │
│  Linker          │     │  (cross-encoder,   │     │  Laws (top 10)   │
│  (section-level  │     │   BGE-reranker or  │     │                  │
│   grounding)     │     │   Cohere)          │     │                  │
└────────┬─────────┘     └────────────────────┘     └──────────────────┘
         │
         ▼
┌──────────────────┐
│  LLM Composer    │
│  (GPT-4o / Llama │
│   with structured│
│   output: rights,│
│   steps, sources)│
└────────┬─────────┘
         │
         ▼
   AskEvent stream (same protocol as today)
```

**Key constraints:**
- The LLM never generates claims without a retrieved source backing them. If retrieval returns nothing above threshold → low-confidence card → legal aid handoff. This is not negotiable.
- Embeddings are multilingual from day one. IndicBERT or a fine-tuned e5 model that handles English, Hindi, Marathi, Tamil, Bengali, Telugu.
- The vector store stores pre-chunked sections from the official gazette text, linked back to `LawSource.id`.

### Phase 3 — Multi-Language & Voice (Q1 2027)

**Goal:** 8 Indian languages. Full voice flow for non-literate users.

| Language Tier | Languages | Method |
| --- | --- | --- |
| Tier 1 (launch) | English, Hindi | Already built |
| Tier 2 | Marathi, Bengali, Tamil, Telugu | Professional translation + community review |
| Tier 3 | Kannada, Gujarati, Odia, Malayalam | Machine translation + professional QA |

**Voice architecture:**

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Mic Input   │────▶│  ASR (Whisper /  │────▶│  engine.ask()    │
│  (Web Speech │     │  Bhashini STT)   │     │  (processes      │
│   or Bhashini)│    │                  │     │   transcription)  │
└──────────────┘     └──────────────────┘     └────────┬─────────┘
                                                       │
                                                       ▼
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Speaker     │◀────│  TTS (Bhashini / │◀────│  Answer Card     │
│  Output      │     │  ElevenLabs)     │     │  (plain text     │
│              │     │                  │     │   extracted)      │
└──────────────┘     └──────────────────┘     └──────────────────┘
```

**Bhashini integration:** India's national language AI platform provides free STT/TTS APIs for all 22 scheduled languages. This is the primary voice provider — no vendor lock-in on something the government provides as a public good.

### Phase 4 — User Accounts & Persistence (Q1 2027)

**Goal:** Optional accounts. Session history. Saved answers. User profile enrichment.

**Auth strategy:**
- Phone OTP via SMS gateway (most accessible auth for the target user base)
- Optional email login for legal professionals
- Guest mode remains fully functional — accounts add convenience, never gate access

**Data model additions:**

```
users
├── id (UUID)
├── phone_hash (bcrypt)
├── locale_preference
├── state
├── profile (age_band, gender, beneficiary_tags)
├── created_at
└── last_seen_at

sessions
├── id (UUID)
├── user_id (nullable for guests)
├── messages[] (JSONB)
├── classification_log[] (for audit/improvement)
├── created_at
└── archived_at

saved_cards
├── id
├── user_id
├── answer_card (JSONB)
├── note (user annotation)
└── saved_at
```

**Privacy principles (unchanged):**
- Minimal data. No names collected unless user volunteers.
- All PII encrypted at rest.
- User can export or delete all their data (DPDPA 2023 compliance).
- Analytics are aggregated, never tied to individual sessions.

### Phase 5 — Document Generation & Legal Aid Handoff (Q2 2027)

**Goal:** Turn answers into action. Generate complaint drafts, RTI applications, and connect users directly to legal services.

**Document templates:**
- RTI application (Right to Information Act, 2005)
- Consumer complaint (to District Consumer Forum)
- Police complaint / FIR summary
- Maintenance petition draft
- Workplace grievance letter
- Rent dispute notice

**Generation pipeline:**
```
Answer Card (with sources + user context)
    │
    ▼
Template Engine (Handlebars / structured LLM output)
    │
    ▼
PDF Generator (react-pdf or puppeteer)
    │
    ▼
Download / WhatsApp share / Email
```

**Legal aid handoff improvements:**
- Real-time availability status of NALSA/SLSA helplines
- Appointment scheduling integration (where APIs exist)
- WhatsApp bot bridge for users without smartphones/browsers
- Referral tracking — did the user actually connect with legal aid?

### Phase 6 — Analytics, Feedback & Model Improvement (Q2 2027)

**Goal:** Learn what users actually need. Improve retrieval. Identify corpus gaps.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Feedback Loop                                    │
│                                                                        │
│  User rates answer (👍/👎)                                             │
│       │                                                                │
│       ▼                                                                │
│  Was the source correct?  ──No──▶  Flag for legal review               │
│       │                                                                │
│      Yes                                                               │
│       │                                                                │
│       ▼                                                                │
│  Was it helpful?  ──No──▶  Log intent + query for corpus gap analysis  │
│       │                                                                │
│      Yes                                                               │
│       │                                                                │
│       ▼                                                                │
│  Reinforce retrieval signal (boost keyword/embedding match)            │
└────────────────────────────────────────────────────────────────────────┘
```

**Dashboards:**
- Most-asked intents (which categories need more corpus entries?)
- Unanswered queries (low-confidence cards — what are people asking that we can't answer?)
- Geographic distribution (which states need priority coverage?)
- Language usage (which locales are active — where should translation effort go?)
- Urgency distribution (how often are red-tier signals triggered?)

### Phase 7 — Platform & Scale (Q3 2027+)

**Goal:** Lawgic AI as infrastructure that others can build on.

| Capability | Description |
| --- | --- |
| **Embeddable widget** | `<lawgic-chat>` web component. NGOs, legal aid websites, and government portals can embed the assistant on their own sites. |
| **WhatsApp / Telegram bot** | The same engine, same citation guarantee, accessible via messaging apps without installing anything. |
| **API for partners** | REST + WebSocket API exposing `engine.ask()` for integration into existing legal tech platforms. Rate-limited, keyed, with usage analytics. |
| **Offline-first PWA** | Service worker caches the corpus and UI. Full answers from cached data without network. Sync when back online. Critical for rural areas with intermittent connectivity. |
| **Community contributions** | Open contributor portal where law students and practitioners can submit new entries, translations, and corrections through a moderated pipeline. |

### Infrastructure & Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Production Stack                                 │
│                                                                         │
│  CDN (Vercel Edge / Cloudflare)                                         │
│       │                                                                 │
│       ├── Static assets (CSS, JS, images)                               │
│       ├── SSR pages (Nitro on Edge Functions)                           │
│       └── API routes (Nitro server functions)                           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Compute                                                         │   │
│  │  ├── Vercel Serverless Functions (API, SSR)                      │   │
│  │  ├── Vercel Edge Functions (auth, rate limiting, geo-routing)    │   │
│  │  └── GPU Workers (embedding generation, TTS — Railway / Modal)  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Data                                                            │   │
│  │  ├── PostgreSQL (Neon / Supabase — user data, sessions, audit)   │   │
│  │  ├── Vector DB (Qdrant / Pinecone — embeddings, semantic search) │   │
│  │  ├── Redis (Upstash — rate limiting, session cache, feature flags)│  │
│  │  └── S3-compatible (R2 — PDFs, audio cache, document templates)  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Observability                                                   │   │
│  │  ├── Sentry (error tracking, performance monitoring)             │   │
│  │  ├── PostHog (product analytics, feature flags, session replay)  │   │
│  │  └── Grafana Cloud (infrastructure metrics, alerting)            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Security & Compliance

| Concern | Approach |
| --- | --- |
| **Data Protection** | DPDPA 2023 compliant. Minimal collection. Encrypted at rest (AES-256). User consent tracked per purpose. Right to erasure implemented. |
| **Auth** | OTP-based (no passwords to leak). JWT with short expiry + refresh tokens. CSRF protection already in `start.ts`. |
| **Content integrity** | Every answer is grounded in a verified source. LLM hallucination guard: structured output schema rejects any claim without a `sourceId`. |
| **Rate limiting** | Per-IP and per-user token bucket. Aggressive limits on auth endpoints. |
| **Audit trail** | Every classification, retrieval, and answer event is logged with timestamp and session ID. No PII in logs. |
| **Accessibility** | WCAG 2.1 AA target. Focus management, screen reader support, `prefers-reduced-motion`, high-contrast mode, font scaling. Tested with NVDA + VoiceOver. |

### Architectural Principles (Non-Negotiable)

1. **The seam stays clean.** `engine.ask()` is the only boundary between UI and intelligence. Whether it's keyword matching, RAG, or a fine-tuned model behind it — the UI emits `AskEvent` and nothing else changes.

2. **No claim without citation.** If the system cannot ground an answer in a verified law entry, it says so. Low-confidence → legal aid handoff. This is the product's integrity, not a feature to be traded off for UX smoothness.

3. **Accessibility is architecture, not polish.** Every component, every route, every interaction is accessible by default. This product is built for people who navigate the legal system with the least resources — disability, illiteracy, poverty. If it doesn't work for them, it doesn't work.

4. **Offline-capable by design.** The corpus is small enough to cache locally. The app must function in a village with 2G connectivity. Progressive enhancement, not graceful degradation.

5. **Privacy as a constraint, not a feature.** Minimal data collection. No tracking without consent. No dark patterns. The user's legal problem is sensitive — treat it that way.

6. **Language is not an afterthought.** i18n is baked into the type system (missing key = compile error). New locales are added without touching component code. Voice I/O treats oral languages as first-class.

7. **The disclaimer is permanent.** "General information, not legal advice" is not a liability CYA — it's honest communication with people who might otherwise trust a computer over a lawyer. It stays visible everywhere, always.

---

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
