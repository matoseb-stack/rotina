"use client";

import { useState } from "react";
import { LOGO_DARK_BG, logoUrl } from "@/lib/market/logos";
import type { Market } from "@/lib/market/types";
import { cn } from "@/lib/utils";

interface StockLogoProps {
  symbol: string;
  name: string;
  brandColor: string;
  market?: Market;
  size?: number;
  className?: string;
}

/**
 * Logo da empresa ou ETF (ícones públicos indexados pelo ticker).
 * Se a imagem falhar, mostra um monograma na cor da marca.
 */
export function StockLogo({ symbol, name, brandColor, market = "b3", size = 36, className }: StockLogoProps) {
  const src = logoUrl(symbol, market);
  const [failed, setFailed] = useState(src === null);
  const style = { width: size, height: size };
  if (failed || !src) {
    return (
      <span
        className={cn("inline-flex shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white", className)}
        style={{ ...style, background: brandColor }}
        aria-hidden
      >
        {symbol.slice(0, 2)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG externo, também precisa funcionar no export estático.
    <img
      src={src}
      alt={`Logo ${name}`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-lg border border-line object-contain p-0.5", LOGO_DARK_BG.has(symbol) ? "bg-slate-800" : "bg-white", className)}
      style={style}
    />
  );
}
