"use client";

import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fmt } from "@/lib/format";
import { CATEGORY_COLORS, FOLHA_MERCADO_URL, type NewsItem } from "@/lib/news/types";
import { NEON } from "@/lib/tabs";
import { Icon } from "@/components/ui/Icon";
import { CategoryTag, ImpactMeter, SourceSeal } from "./NewsMeta";

interface NewsReaderModalProps {
  item: NewsItem | null;
  position: { index: number; total: number };
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Leitor imersivo. Desktop: modal central. iPhone: bottom sheet com alça de arrastar.
 * Esc fecha, ←/→ navega entre manchetes, o foco fica preso dentro do diálogo
 * e volta ao card de origem ao fechar.
 */
export function NewsReaderModal({ item, position, onClose, onPrev, onNext }: NewsReaderModalProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dragControls = useDragControls();
  const open = item !== null;

  useEffect(() => setMounted(true), []);

  // Trava o scroll da página (inclusive no Safari do iPhone) e devolve o foco ao fechar.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      html.style.overflow = prevOverflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
      else if (e.key === "Tab" && panelRef.current) {
        const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onPrev, onNext]);

  if (!mounted) return null;

  const folha = item?.source.kind === "folha";
  const accent = item ? CATEGORY_COLORS[item.category] : NEON.pink;

  return createPortal(
    <AnimatePresence>
      {item && (
        <motion.div
          key="reader"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} aria-hidden />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reader-title"
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#070708]/95 shadow-2xl sm:max-h-[85vh] sm:max-w-2xl sm:rounded-3xl"
            style={{ boxShadow: `0 0 0 1px ${accent}33, 0 30px 80px -20px ${accent}55` }}
          >
            {/* Alça para arrastar e fechar no iPhone. */}
            <div
              className="flex shrink-0 cursor-grab touch-none justify-center pt-3 pb-1 sm:hidden"
              onPointerDown={(e) => dragControls.start(e)}
              aria-hidden
            >
              <span className="h-1.5 w-12 rounded-full bg-white/20" />
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3 sm:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <CategoryTag category={item.category} />
                <ImpactMeter impact={item.impact} />
                <span className="tnum truncate font-mono text-[11px] text-zinc-500">
                  {position.index + 1}/{position.total}
                </span>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Fechar leitor"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain px-5 pt-6 pb-8 sm:px-7">
              <AnimatePresence mode="wait" initial={false}>
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                >
                  <p className="font-mono text-xs text-zinc-500 first-letter:uppercase">{fmt.fullDate(item.publishedAt)} · BRT</p>
                  <h2 id="reader-title" className="mt-3 text-2xl leading-tight font-semibold text-balance text-white sm:text-[1.9rem]">
                    {item.title}
                  </h2>
                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <SourceSeal source={item.source} />
                    {item.author && <span className="text-xs text-zinc-500">por {item.author}</span>}
                  </div>

                  {/* O resumo só aparece quando acrescenta algo: excerpt de uma frase já é o próprio resumo. */}
                  {item.excerpt.length > item.summary.length + 40 && (
                    <div className="mt-6 rounded-2xl border-l-2 bg-white/[0.03] p-4" style={{ borderColor: accent }}>
                      <p className="font-mono text-[10px] tracking-[0.25em] text-zinc-500">RESUMO EXECUTIVO</p>
                      <p className="mt-1.5 text-[15px] text-zinc-200">{item.summary}</p>
                    </div>
                  )}

                  <p className="mt-6 text-[17px] leading-relaxed text-zinc-300">{item.excerpt}</p>

                  <p className="mt-6 text-xs leading-relaxed text-zinc-500">
                    {folha
                      ? "Trecho publicado no feed RSS público da Folha de S.Paulo. A matéria completa e seus direitos pertencem ao veículo."
                      : "Manchete simulada para demonstração do painel. Não foi publicada por nenhum veículo."}
                  </p>

                  <a
                    href={folha ? item.url : FOLHA_MERCADO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold text-black transition-transform active:scale-[0.98] sm:w-auto sm:inline-flex"
                    style={{ background: NEON.pink, boxShadow: `0 0 24px ${NEON.pink}66` }}
                  >
                    {folha ? "Ler matéria completa na Folha" : "Abrir Folha · Mercado"}
                    <Icon name="external" className="size-4" />
                  </a>
                </motion.article>
              </AnimatePresence>
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-white/[0.06] px-3 py-2 pb-[max(var(--safe-bottom),0.5rem)] sm:px-5 sm:pb-2">
              <button
                type="button"
                onClick={onPrev}
                disabled={position.index === 0}
                className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10 disabled:opacity-30"
              >
                <Icon name="arrow-left" className="size-4" /> Anterior
              </button>
              <span className="hidden font-mono text-[10px] tracking-widest text-zinc-600 sm:inline">ESC · ← →</span>
              <button
                type="button"
                onClick={onNext}
                disabled={position.index >= position.total - 1}
                className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10 disabled:opacity-30"
              >
                Próxima <Icon name="arrow-right" className="size-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
