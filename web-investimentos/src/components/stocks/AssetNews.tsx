"use client";

import { useAssetNews } from "@/hooks/useAssetNews";
import { useNow } from "@/hooks/useNow";
import { fmt } from "@/lib/format";
import { companyMoreUrl } from "@/lib/news/company-sources";
import { Icon } from "@/components/ui/Icon";

/** Notícias da Folha de S.Paulo sobre o ativo selecionado. */
export function AssetNews({ symbol, name }: { symbol: string; name: string }) {
  const state = useAssetNews(symbol);
  const now = useNow();
  const moreUrl = state.status === "ready" ? state.feed.moreUrl : companyMoreUrl(symbol);
  const items = state.status === "ready" ? state.feed.items : [];

  return (
    <section aria-labelledby="asset-news-title" className="flex min-h-0 flex-col">
      <div className="flex items-baseline justify-between gap-2">
        <h3 id="asset-news-title" className="text-sm font-semibold">
          Notícias
        </h3>
        <span className="text-xs text-subtle">Folha de S.Paulo</span>
      </div>

      {state.status === "loading" && (
        <ul className="mt-3 space-y-3" aria-busy>
          {[0, 1, 2].map((i) => (
            <li key={i} className="space-y-2 rounded-lg border border-line p-3">
              <div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" />
              <div className="h-4 w-full animate-pulse rounded bg-surface-2" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
            </li>
          ))}
        </ul>
      )}

      {state.status !== "loading" && items.length === 0 && (
        <p className="mt-3 rounded-lg border border-dashed border-line p-4 text-sm text-muted">
          {state.status === "error"
            ? "Não foi possível carregar as notícias agora."
            : `Nenhuma notícia recente da Folha sobre ${name}.`}
        </p>
      )}

      {items.length > 0 && (
        <ul className="mt-3 divide-y divide-line overflow-y-auto rounded-lg border border-line">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-3 transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
              >
                {item.publishedAt && (
                  <time dateTime={new Date(item.publishedAt).toISOString()} className="tnum text-xs text-subtle">
                    {now - item.publishedAt < 86_400_000 ? fmt.relative(item.publishedAt, now) : fmt.fullDate(item.publishedAt)}
                  </time>
                )}
                <p className="mt-1 line-clamp-3 text-sm leading-snug font-medium group-hover:text-accent">{item.title}</p>
                {item.summary && <p className="mt-1 line-clamp-2 text-xs text-muted">{item.summary}</p>}
                <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-subtle">
                  Ler na Folha <Icon name="external" className="size-3" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <a
        href={moreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 self-start text-sm font-medium text-accent hover:underline"
      >
        Mais notícias sobre {name} na Folha <Icon name="external" className="size-3.5" />
      </a>
    </section>
  );
}
