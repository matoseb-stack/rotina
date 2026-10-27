import { CATEGORY_COLORS, type NewsCategory, type NewsImpact, type NewsSource } from "@/lib/news/types";
import { cn } from "@/lib/utils";

export function CategoryTag({ category, className }: { category: NewsCategory; className?: string }) {
  const color = CATEGORY_COLORS[category];
  return (
    <span
      className={cn("inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase", className)}
      style={{ color, borderColor: `${color}55`, background: `${color}14` }}
    >
      {category}
    </span>
  );
}

const IMPACT: Record<NewsImpact, { label: string; bars: number; color: string }> = {
  alto: { label: "Alto impacto", bars: 3, color: "#FF3B6B" },
  medio: { label: "Médio impacto", bars: 2, color: "#FF9F1C" },
  baixo: { label: "Baixo impacto", bars: 1, color: "#71717a" },
};

/** Indicador heurístico de impacto (palavras-chave), em barrinhas de sinal. */
export function ImpactMeter({ impact }: { impact: NewsImpact }) {
  const meta = IMPACT[impact];
  return (
    <span className="inline-flex items-center gap-1.5" title={meta.label}>
      <span className="flex items-end gap-[2px]" aria-hidden>
        {[1, 2, 3].map((n) => (
          <span key={n} className="w-[3px] rounded-sm" style={{ height: 4 + n * 3, background: n <= meta.bars ? meta.color : "rgba(255,255,255,0.12)" }} />
        ))}
      </span>
      <span className="sr-only">{meta.label}</span>
    </span>
  );
}

/** Selo da fonte. Manchetes simuladas nunca recebem o selo da Folha. */
export function SourceSeal({ source }: { source: NewsSource }) {
  const folha = source.kind === "folha";
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span
        className={cn(
          "shrink-0 rounded-[4px] px-1.5 py-[3px] font-mono text-[9px] font-bold tracking-[0.18em]",
          folha ? "bg-white text-black" : "border border-dashed border-amber-300/60 text-amber-300",
        )}
      >
        {folha ? "FOLHA" : "SIMULADO"}
      </span>
      <span className="truncate text-xs text-zinc-400">{folha ? source.name : "Conteúdo de demonstração"}</span>
    </span>
  );
}
