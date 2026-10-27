"use client";

import { motion } from "framer-motion";
import { NEWS_FILTERS, type NewsFilter } from "@/lib/news/types";
import { NEON } from "@/lib/tabs";
import { cn } from "@/lib/utils";

interface NewsFiltersProps {
  value: NewsFilter;
  onChange: (filter: NewsFilter) => void;
  counts: Record<NewsFilter, number>;
}

/** Filtros rápidos. No iPhone rolam na horizontal sem estourar a largura da página. */
export function NewsFilters({ value, onChange, counts }: NewsFiltersProps) {
  return (
    <div role="toolbar" aria-label="Filtrar notícias" className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {NEWS_FILTERS.map((f) => {
        const selected = f.id === value;
        return (
          <button
            key={f.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(f.id)}
            className={cn(
              "relative shrink-0 snap-start rounded-full border px-4 py-2 font-mono text-xs tracking-wider transition-colors",
              selected ? "border-transparent text-black" : "border-white/10 text-zinc-300 hover:border-white/25 hover:text-white",
            )}
          >
            {selected && (
              <motion.span
                layoutId="news-filter-pill"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
                className="absolute inset-0 rounded-full"
                style={{ background: NEON.pink, boxShadow: `0 0 18px ${NEON.pink}88` }}
              />
            )}
            <span className="relative z-10 uppercase">
              {f.label}
              <span className={cn("tnum ml-2", selected ? "text-black/60" : "text-zinc-500")}>{counts[f.id]}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
