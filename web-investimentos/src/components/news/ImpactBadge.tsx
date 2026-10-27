import type { NewsImpact } from "@/lib/news/types";
import { cn } from "@/lib/utils";

const STYLE: Record<NewsImpact, { label: string; className: string }> = {
  alto: { label: "Impacto alto", className: "bg-down-soft text-down" },
  medio: { label: "Impacto médio", className: "bg-warn-soft text-warn" },
  neutro: { label: "Neutro", className: "bg-surface-2 text-muted" },
};

/** Nível de impacto no mercado (heurística por palavras-chave da manchete). */
export function ImpactBadge({ impact, className }: { impact: NewsImpact; className?: string }) {
  const s = STYLE[impact];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium", s.className, className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}
