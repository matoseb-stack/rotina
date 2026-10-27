"use client";

import { motion } from "framer-motion";
import { forwardRef, type CSSProperties } from "react";
import { fmt } from "@/lib/format";
import { CATEGORY_COLORS, type NewsItem } from "@/lib/news/types";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { CategoryTag, ImpactMeter, SourceSeal } from "./NewsMeta";

interface NewsCardProps {
  item: NewsItem;
  now: number;
  fresh: boolean;
  onOpen: (id: string) => void;
}

/**
 * Card de manchete em estilo terminal. O card inteiro abre o leitor imersivo;
 * o link "Folha ↗" vai direto para a matéria oficial numa nova aba.
 */
export const NewsCard = forwardRef<HTMLLIElement, NewsCardProps>(function NewsCard({ item, now, fresh, onOpen }, ref) {
  const accent = CATEGORY_COLORS[item.category];
  return (
    <motion.li
      ref={ref}
      layout="position"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      style={{ "--accent": accent } as CSSProperties}
      className={cn("glass group relative overflow-hidden rounded-2xl", fresh && "animate-fresh")}
    >
      {/* Barra lateral na cor da categoria. */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: accent, boxShadow: `0 0 14px ${accent}` }} />

      <div className="flex flex-col gap-2.5 py-4 pr-4 pl-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <time dateTime={new Date(item.publishedAt).toISOString()} className="tnum font-mono text-xs text-zinc-200">
            {fmt.hour(item.publishedAt)}
          </time>
          <span className="font-mono text-[11px] text-zinc-500">{fmt.relative(item.publishedAt, now)}</span>
          <CategoryTag category={item.category} />
          <ImpactMeter impact={item.impact} />
          {fresh && (
            <span className="rounded bg-neon-pink px-1.5 py-[1px] font-mono text-[9px] font-bold tracking-widest text-black">NOVO</span>
          )}
        </div>

        <h3 className="text-[15px] leading-snug font-semibold text-zinc-50 sm:text-base">
          {/* O botão cobre o card inteiro (after:inset-0) sem aninhar elementos interativos. */}
          <button
            type="button"
            onClick={() => onOpen(item.id)}
            className="text-left outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-white/50"
          >
            <span className="line-clamp-3 transition-colors group-hover:text-white">{item.title}</span>
          </button>
        </h3>

        <p className="line-clamp-1 text-sm text-zinc-400">{item.summary}</p>

        <div className="mt-1 flex items-center justify-between gap-3">
          <SourceSeal source={item.source} />
          {item.source.kind === "folha" && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 font-mono text-[11px] text-zinc-300 transition-colors hover:border-neon-pink/60 hover:text-neon-pink"
              aria-label={`Abrir na Folha: ${item.title}`}
            >
              Folha <Icon name="external" className="size-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Glow sutil no hover (desktop). */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: `inset 0 0 0 1px ${accent}55, 0 0 30px -12px ${accent}` }}
      />
    </motion.li>
  );
});
