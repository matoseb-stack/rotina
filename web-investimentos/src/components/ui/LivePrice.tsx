"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface LivePriceProps {
  value: number;
  format: (value: number) => string;
  className?: string;
}

/**
 * Preço com realce discreto a cada tick: fundo verde/vermelho que some em 0,8 s.
 * A `key` muda com o valor e reinicia a animação CSS (sem JS por frame).
 */
export function LivePrice({ value, format, className }: LivePriceProps) {
  const [previous, setPrevious] = useState(value);
  const [direction, setDirection] = useState(0);
  // Padrão do React para derivar estado da renderização anterior.
  if (value !== previous) {
    setDirection(value > previous ? 1 : -1);
    setPrevious(value);
  }
  return (
    <span
      key={value}
      className={cn("tnum -mx-1 inline-block rounded px-1", direction > 0 && "tick-up", direction < 0 && "tick-down", className)}
    >
      {format(value)}
    </span>
  );
}

/** Ponto que pulsa a cada atualização (1 s), na cor do último movimento. */
export function TickDot({ tick, up, className }: { tick: number; up: boolean; className?: string }) {
  return (
    <span className={cn("relative inline-flex size-2", className)} aria-hidden>
      <span key={tick} className={cn("tick-dot absolute inset-0 rounded-full", up ? "bg-up" : "bg-down")} />
      <span className={cn("relative size-2 rounded-full", up ? "bg-up" : "bg-down")} />
    </span>
  );
}
