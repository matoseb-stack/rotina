"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMarketData } from "@/hooks/useMarketData";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { brtDay, buildBriefing, type BriefingPoint } from "@/lib/briefing";
import { fmt } from "@/lib/format";
import { marketStore } from "@/lib/market/store";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

const SEEN_KEY = "painel:resumo-visto";

interface MissedTodayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSeeNews: () => void;
}

/**
 * "O que você perdeu hoje": abre sozinho na primeira visita do dia (quando
 * cotações e notícias já chegaram) e pelo botão "Resumo" do cabeçalho.
 */
export function MissedTodayModal({ open, onOpenChange, onSeeNews }: MissedTodayModalProps) {
  const marketReady = useMarketData((s) => s.status === "ready");
  const { feed, status: newsStatus } = useNewsFeed();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Primeira abertura do dia (data de Brasília guardada no navegador).
  useEffect(() => {
    if (!marketReady || newsStatus === "loading") return;
    try {
      if (localStorage.getItem(SEEN_KEY) === brtDay()) return;
      localStorage.setItem(SEEN_KEY, brtDay());
    } catch {
      return; // sem storage, não abre sozinho a cada visita
    }
    onOpenChange(true);
  }, [marketReady, newsStatus, onOpenChange]);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && marketReady && <Body key="missed" feed={feed} onClose={() => onOpenChange(false)} onSeeNews={onSeeNews} />}
    </AnimatePresence>,
    document.body,
  );
}

const TONE = { up: "bg-up-soft text-up", down: "bg-down-soft text-down", neutral: "bg-accent-soft text-accent" } as const;
const ICON = { macro: "bolt", b3: "chart", us: "globe", crypto: "coin" } as const;

function Body({ feed, onClose, onSeeNews }: { feed: ReturnType<typeof useNewsFeed>["feed"]; onClose: () => void; onSeeNews: () => void }) {
  // Lido uma vez ao abrir: o resumo não muda enquanto a pessoa lê.
  const points = useMemo<BriefingPoint[]>(() => buildBriefing(marketStore.getSnapshot(), feed), [feed]);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="missed-title"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 36 }}
        className="relative w-full overflow-hidden rounded-t-2xl border border-line bg-surface pb-[var(--safe-bottom)] shadow-pop sm:max-w-xl sm:rounded-2xl"
      >
        <div className="flex items-start gap-3 border-b border-line px-5 pt-5 pb-4">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Icon name="sparkles" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="missed-title" className="text-lg font-semibold">O que você perdeu hoje</h2>
            <p className="text-xs text-muted first-letter:uppercase">{fmt.fullDate(Date.now()).replace(/ às.*$/, "")} · macro, B3, EUA e cripto</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="-mt-1 -mr-1 rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Fechar resumo">
            <Icon name="close" />
          </button>
        </div>

        <ol className="max-h-[60dvh] space-y-3 overflow-y-auto p-5">
          {points.map((p) => (
            <li key={p.id} className="flex gap-3">
              <span className={cn("mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md", TONE[p.tone])}>
                <Icon name={ICON[p.id]} className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{p.title}</p>
                <p className="text-sm text-muted">{p.text}</p>
                {p.headline && (
                  <a
                    href={p.headline.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-1.5 block rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs hover:border-line-strong"
                  >
                    <span className="flex items-center gap-1 text-subtle">
                      {p.headline.source} · {fmt.relative(p.headline.publishedAt, Date.now())}
                      <Icon name="external" className="size-3" />
                    </span>
                    <span className="mt-0.5 line-clamp-2 font-medium text-fg group-hover:text-accent">{p.headline.title}</span>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-muted hover:text-fg">
            Fechar
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSeeNews();
            }}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white dark:text-slate-900"
          >
            Ver todas as notícias
          </button>
        </div>
        <p className="px-5 pb-4 text-[11px] text-subtle">
          Resumo automático com cotações reais (Yahoo Finance, Coinbase, CoinGecko, Banco Central) e a manchete mais relevante de cada tema.
        </p>
      </motion.div>
    </motion.div>
  );
}
