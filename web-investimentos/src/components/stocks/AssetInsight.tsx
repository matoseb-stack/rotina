"use client";

import { useAssetInsight } from "@/hooks/useAssetInsight";
import { useNow } from "@/hooks/useNow";
import { fmt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

const TONE = {
  alta: { label: "subindo", className: "bg-up-soft text-up", icon: "arrow-up" },
  queda: { label: "caindo", className: "bg-down-soft text-down", icon: "arrow-down" },
  estavel: { label: "estável", className: "bg-surface-2 text-muted", icon: "chart" },
} as const;

const CONFIDENCE = { alta: "Notícias explicam bem o movimento", media: "Explicação parcial", baixa: "Sem notícia clara: explicação pelos números" };

/**
 * "Por que está subindo/caindo hoje": resumo do Claude a partir da cotação,
 * do mercado, do setor e das manchetes, com links para as fontes citadas.
 */
export function AssetInsight({ symbol, crypto = false }: { symbol: string; crypto?: boolean }) {
  const state = useAssetInsight(symbol);
  const now = useNow();

  if (state.status === "loading") {
    return (
      <div className="space-y-2 rounded-xl border border-line p-4" aria-busy aria-label="Carregando resumo">
        <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-full animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-surface-2" />
      </div>
    );
  }
  if (state.status === "error") return null;

  const { insight } = state;
  const tone = TONE[insight.direction];
  const ai = insight.kind === "ai";

  return (
    <section aria-labelledby="insight-title" className="rounded-xl border border-line bg-surface-2/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold", tone.className)}>
          <Icon name={tone.icon} className="size-3" />
          {symbol} {tone.label}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent">
          <Icon name="sparkles" className="size-3.5" />
          {ai ? "Resumo por IA" : "Resumo automático"}
        </span>
      </div>
      <h3 id="insight-title" className="mt-2 text-sm leading-snug font-semibold">
        Por que {symbol} está {tone.label} {crypto ? "nas últimas 24 h" : "hoje"}?
      </h3>
      {ai && <p className="mt-1 text-sm font-medium">{insight.title}</p>}
      <p className="mt-1 text-sm text-muted">{insight.summary}</p>

      {insight.drivers.length > 0 && (
        <ul className="mt-3 space-y-2">
          {insight.drivers.map((d, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
              <div className="min-w-0">
                <p>{d.text}</p>
                {d.sources.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {d.sources.map((s) => (
                      <li key={s.url} className="min-w-0">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-accent hover:underline"
                          title={s.title}
                        >
                          <span className="truncate">
                            <span className="font-medium">{s.source ?? "Fonte"}</span> · {s.title}
                          </span>
                          <Icon name="external" className="size-3 shrink-0" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-subtle">
        {ai
          ? `Gerado por IA (Claude) ${fmt.relative(insight.generatedAt, now)}${insight.confidence ? ` · ${CONFIDENCE[insight.confidence]}` : ""}. Pode conter erros; confira as fontes. Não é recomendação de investimento.`
          : (insight.notice ?? "Texto automático com os números do dia.")}
      </p>
    </section>
  );
}
