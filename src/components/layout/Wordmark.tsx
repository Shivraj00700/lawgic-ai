import { Scale } from "lucide-react";

import { useT } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

/**
 * The Lawgic AI wordmark. `tone` picks the colour pairing so the same mark works
 * on the dark sidebar header and on light backgrounds.
 */
export function Wordmark({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "inverted";
}) {
  const t = useT();

  return (
    <span className={cn("flex items-center gap-2 text-lg font-semibold", className)}>
      <Scale
        className={cn(
          "size-5 shrink-0",
          tone === "inverted" ? "text-primary-foreground" : "text-foreground",
        )}
        strokeWidth={1.9}
        aria-hidden="true"
      />
      <span className="tracking-tight">{t.brand.name}</span>
    </span>
  );
}
