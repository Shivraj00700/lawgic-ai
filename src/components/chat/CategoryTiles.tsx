import type { LucideIcon } from "lucide-react";

import { CATEGORIES } from "@/data/categories";
import type { CategoryId } from "@/data/types";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export type CategoryTilesProps = {
  selected: CategoryId | null;
  onSelect: (id: CategoryId | null) => void;
};

/**
 * The six legal-area tiles shown in the welcome state.
 * Tapping a tile fills the composer with the category's seed question.
 */
export function CategoryTiles({ selected, onSelect }: CategoryTilesProps) {
  const { t } = useI18n();

  return (
    <section className="mx-auto mt-9 max-w-[660px]">
      <h2 className="sr-only">{t.chat.categoriesLabel}</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {CATEGORIES.map(({ id, icon: Icon }) => {
          const active = selected === id;
          return (
            <TileButton
              key={id}
              id={id}
              icon={Icon}
              label={t.categories[id]}
              active={active}
              onPress={() => onSelect(active ? null : id)}
            />
          );
        })}
      </div>
    </section>
  );
}

function TileButton({
  id,
  icon: Icon,
  label,
  active,
  onPress,
}: {
  id: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <button
      key={id}
      type="button"
      aria-pressed={active}
      onClick={onPress}
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
        <Icon className="size-[18px]" strokeWidth={1.7} aria-hidden="true" />
      </span>
      <span className="text-center text-[12px] leading-tight">{label}</span>
    </button>
  );
}
