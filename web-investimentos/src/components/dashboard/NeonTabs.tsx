"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { TABS, type TabId } from "@/lib/tabs";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

type Variant = "rail" | "bar" | "dock";

interface NeonTabsProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  /** rail = lateral (desktop), bar = topo (tablet), dock = barra inferior (iPhone). */
  variant: Variant;
  className?: string;
}

const LIFT = { type: "spring", stiffness: 420, damping: 17 } as const;
const PILL = { type: "spring", stiffness: 380, damping: 30 } as const;

/**
 * Abas neon com efeito shuffle:
 *  - a aba ativa sobe com mola (slideUp) e assume sua cor;
 *  - o destaque (layoutId) desliza até a nova aba trocando a cor de forma fluida;
 *  - ao trocar, uma onda percorre as abas em cascata pela distância;
 *  - o brilho pulsa e alterna limão → ciano → roxo (CSS .neon-pill).
 * Não se inscreve no mercado: nunca re-renderiza com os ticks.
 */
export function NeonTabs({ active, onChange, variant, className }: NeonTabsProps) {
  const activeIndex = TABS.findIndex((t) => t.id === active);

  return (
    <nav
      role="tablist"
      aria-label="Seções do painel"
      aria-orientation={variant === "rail" ? "vertical" : "horizontal"}
      className={cn(
        variant === "rail" && "flex flex-col gap-3",
        variant === "bar" && "grid grid-cols-4 gap-2",
        variant === "dock" &&
          "fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-1 border-t border-white/10 bg-black/80 px-2 pt-2 pb-[max(var(--safe-bottom),0.5rem)] backdrop-blur-xl",
        className,
      )}
    >
      {TABS.map((tab, i) => {
        const selected = tab.id === active;
        const distance = Math.abs(i - activeIndex);
        return (
          <motion.button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls="dashboard-panel"
            onClick={() => onChange(tab.id)}
            animate={{ y: selected && variant !== "dock" ? -4 : 0 }}
            whileTap={{ scale: 0.96 }}
            transition={LIFT}
            style={{ "--accent": tab.accent } as CSSProperties}
            className={cn(
              "group relative min-w-0 rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-white/40",
              variant === "rail" && "px-4 py-4",
              variant === "bar" && "px-3 py-3",
              variant === "dock" && "flex flex-col items-center rounded-xl px-1 py-2 text-center",
            )}
          >
            {variant !== "dock" && <span className="absolute inset-0 rounded-2xl border border-white/[0.06] bg-white/[0.025] transition-colors group-hover:bg-white/[0.05]" />}
            {selected && (
              <motion.span
                layoutId={`neon-pill-${variant}`}
                transition={PILL}
                className={cn("neon-pill absolute inset-0", variant === "dock" ? "rounded-xl" : "rounded-2xl")}
              />
            )}
            {selected && variant === "rail" && (
              <motion.span
                layoutId="neon-rail-bar"
                transition={PILL}
                className="absolute top-1/4 left-0 h-1/2 w-[3px] rounded-full"
                style={{ background: tab.accent, boxShadow: `0 0 12px ${tab.accent}` }}
              />
            )}

            {/* key = aba ativa: remonta e dispara a onda do shuffle em cascata. */}
            <motion.span
              key={active}
              initial={{ y: 0 }}
              animate={{ y: [0, -5, 0] }}
              transition={{ delay: distance * 0.07, duration: 0.5, ease: "easeOut" }}
              style={selected ? { color: tab.accent } : undefined}
              className={cn("relative z-10 flex min-w-0 text-zinc-400", variant === "dock" ? "flex-col items-center gap-1" : "items-center gap-3")}
            >
              {variant === "dock" ? (
                <Icon name={tab.icon} className="size-5 transition-colors duration-300" />
              ) : (
                <span className="font-mono text-[11px] tracking-widest transition-colors duration-300" style={{ color: selected ? tab.accent : "#5e6672" }}>
                  {tab.number}
                </span>
              )}
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate transition-colors duration-300",
                    variant === "dock" ? "text-[11px] font-medium" : "text-[15px]",
                    selected ? "font-semibold text-glow" : "font-medium text-zinc-300",
                  )}
                  style={selected ? { color: tab.accent } : undefined}
                >
                  {variant === "dock" ? tab.short : tab.label}
                </span>
                {variant === "rail" && (
                  <span className={cn("mt-0.5 block truncate text-xs", selected ? "text-zinc-300" : "text-zinc-500")}>{tab.subtitle}</span>
                )}
              </span>
            </motion.span>
          </motion.button>
        );
      })}
    </nav>
  );
}
