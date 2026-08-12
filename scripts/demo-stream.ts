/**
 * Streams the three rehearsal scenarios through the real engine, with real
 * timings, straight to the terminal.
 *
 * The point is to prove the whole answer pipeline works — classification,
 * triage, retrieval, citation, streaming, legal-aid handoff — before any UI
 * exists to hide behind. Run it with:
 *
 *   npm run demo
 */
import { ask } from "../src/lib/assistant/engine";
import type { Locale } from "../src/lib/i18n/config";
import { en as enDict } from "../src/lib/i18n/locales/en";
import { hi as hiDict } from "../src/lib/i18n/locales/hi";

// Headers come from the dictionaries, not hardcoded English. A Hindi answer
// under English headings is the exact failure this product is meant to avoid.
const DICTS = { en: enDict, hi: hiDict };

const SCENARIOS: { name: string; en: string; hi: string }[] = [
  {
    name: "Defective product refund",
    en: "I bought a phone last week and it stopped working. The shop refuses to refund me.",
    hi: "मैंने पिछले हफ़्ते एक फ़ोन खरीदा और वह बंद हो गया। दुकानदार पैसे लौटाने से मना कर रहा है।",
  },
  {
    name: "Unpaid wages",
    en: "My employer has not paid my wages for two months.",
    hi: "मेरे मालिक ने दो महीने से मेरी मज़दूरी नहीं दी है।",
  },
  {
    name: "Withheld rental deposit",
    en: "I moved out of my rented house but my landlord is keeping my security deposit.",
    hi: "मैंने किराये का मकान छोड़ दिया लेकिन मकान मालिक मेरी जमा राशि रोक रहा है।",
  },
];

const EDGE_CASES: { name: string; query: string }[] = [
  { name: "Red tier — threat to life", query: "my husband is threatening to kill me" },
  { name: "Minor disclosure", query: "i am 15 and my father hits me" },
  { name: "Informational, must NOT go red", query: "what is the punishment for assault" },
  { name: "Off-corpus, must admit it", query: "what is the capital of France" },
];

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const amber = (s: string) => `\x1b[33m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;

function tint(tier: string): string {
  if (tier === "red") return red(tier.toUpperCase());
  if (tier === "amber") return amber(tier.toUpperCase());
  return green(tier);
}

function write(text: string): void {
  process.stdout.write(text);
}

async function run(label: string, query: string, locale: Locale): Promise<void> {
  write(`\n${bold(label)} ${dim(`[${locale}]`)}\n`);
  write(`${dim("> ")}${query}\n\n`);

  const started = Date.now();

  for await (const event of ask(query, { locale })) {
    switch (event.type) {
      case "thinking":
        write(dim("  ... thinking"));
        break;

      case "triage": {
        const c = event.classification;
        write(
          `\r  ${dim("triage:")} intent=${cyan(String(c.intent ?? "none"))} ` +
            `confidence=${c.confidence} urgency=${tint(c.urgency)}` +
            `${c.isMinorDisclosure ? ` ${amber("MINOR")}` : ""}\n`,
        );
        break;
      }

      case "retrieving":
        write(`  ${dim("sources:")}\n`);
        for (const source of event.sources) {
          write(
            `    ${source.law.act}, ${source.law.section} ` +
              `${dim(`score=${source.score}${source.stateSpecific ? " state-specific" : ""}`)}\n`,
          );
          write(`      ${dim(`matched: ${source.matchedTerms.slice(0, 6).join(", ")}`)}\n`);
        }
        write("\n  ");
        break;

      case "token":
        write(event.text);
        break;

      case "card": {
        const card = event.card;
        const t = DICTS[locale];
        write("\n\n");
        if (card.lowConfidence) {
          write(`  ${amber(t.answer.confidence.low)}\n`);
          break;
        }

        write(`  ${bold(t.answer.rights)}\n`);
        for (const bullet of card.rights) {
          write(`    - ${bullet.text} ${dim(`[${bullet.sourceId}]`)}\n`);
        }
        write(`\n  ${bold(t.answer.steps)}\n`);
        for (const bullet of card.steps) {
          write(`    - ${bullet.text} ${dim(`[${bullet.sourceId}]`)}\n`);
        }
        write(`\n  ${bold(t.answer.source)}\n`);
        for (const detail of card.expandedDetail) {
          write(`    ${detail.act}, ${detail.section}\n`);
        }
        write(`\n  ${dim(card.disclaimer)}\n`);
        break;
      }

      case "helplines":
        write(
          `\n  ${event.reason === "red" ? red("URGENT") : amber("MINOR")} — helplines first:\n`,
        );
        for (const helpline of event.helplines) {
          write(`    ${bold(helpline.number)}  ${dim(helpline.labelKey)}\n`);
        }
        break;

      case "aid": {
        const t = DICTS[locale];
        write(`\n  ${bold(t.legalAid.title)}\n`);
        for (const office of event.offices) {
          write(`    ${locale === "hi" ? office.name_hi : office.name_en} — ${office.phone}\n`);
        }
        break;
      }

      case "done":
        write(`\n  ${dim(`(${Date.now() - started}ms)`)}\n`);
        break;
    }
  }
}

async function main(): Promise<void> {
  write(bold("\n=== Lawgic AI — engine stream demo ===\n"));
  write(dim("Real engine, real timings, no UI.\n"));

  write(bold("\n\n--- The three rehearsal scenarios, both languages ---\n"));
  for (const scenario of SCENARIOS) {
    for (const locale of ["en", "hi"] as const) {
      await run(scenario.name, locale === "hi" ? scenario.hi : scenario.en, locale);
    }
  }

  write(bold("\n\n--- Edge cases ---\n"));
  for (const edge of EDGE_CASES) {
    await run(edge.name, edge.query, "en");
  }

  write(bold("\n\n--- State-specific ranking (Maharashtra) ---\n"));
  await run(
    "Utility cut-off, state known",
    "my landlord cut off my water and electricity to force me out",
    "en",
  );

  write("\n");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
