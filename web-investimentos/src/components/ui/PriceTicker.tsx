"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface PriceTickerProps {
  value: number;
  format: (value: number) => string;
  className?: string;
  /** Para taxas: subir é ruim para quem já tem o título, então pisca vermelho. */
  invert?: boolean;
}

/**
 * Valor que "embaralha" a cada tick: o número novo entra deslizando de baixo
 * (alta) ou de cima (baixa) e pisca verde/vermelho. A `key` muda com o valor,
 * o que reinicia a animação CSS (transform/opacity, rodando na GPU).
 */
export function PriceTicker({ value, format, className, invert = false }: PriceTickerProps) {
  const [previous, setPrevious] = useState(value);
  const [direction, setDirection] = useState(0);
  // Padrão oficial do React para derivar estado da renderização anterior.
  if (value !== previous) {
    setDirection(value > previous ? 1 : -1);
    setPrevious(value);
  }
  const effective = invert ? -direction : direction;
  return (
    <span className={cn("tnum inline-flex overflow-hidden whitespace-nowrap", className)}>
      <span key={value} className={effective > 0 ? "tick-up" : effective < 0 ? "tick-down" : undefined}>
        {format(value)}
      </span>
    </span>
  );
}
