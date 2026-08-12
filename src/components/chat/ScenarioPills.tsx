import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/config";

type ScenarioId = "defectiveProduct" | "unpaidWages" | "deposit";

/** Seed text dropped into the composer when a scenario pill is tapped. */
const SCENARIO_SEEDS: Record<ScenarioId, Record<Locale, string>> = {
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

const SCENARIO_IDS: ScenarioId[] = ["defectiveProduct", "unpaidWages", "deposit"];

export type ScenarioPillsProps = {
  onSelect: (text: string) => void;
};

/**
 * Three example queries for users who cannot phrase a legal problem from scratch.
 * Tapping a pill submits it directly as a query (not just fills the input).
 */
export function ScenarioPills({ onSelect }: ScenarioPillsProps) {
  const { t, locale } = useI18n();

  return (
    <div className="px-5 pb-5">
      <h2 className="mb-2 text-[11px] text-muted-foreground">{t.chat.scenariosLabel}</h2>
      <div className="flex flex-wrap items-center gap-2">
        {SCENARIO_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(SCENARIO_SEEDS[id][locale])}
            className="rounded-full px-3.5 py-2 text-xs ring-1 ring-border transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {t.scenarios[id]}
          </button>
        ))}
      </div>
    </div>
  );
}
