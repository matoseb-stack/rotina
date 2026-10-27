"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const LOGO_URL = (symbol: string) => `https://icons.brapi.dev/icons/${symbol}.svg`;

interface StockLogoProps {
  symbol: string;
  name: string;
  brandColor: string;
  size?: number;
  className?: string;
}

/**
 * Logo da empresa (ícones públicos da brapi.dev, indexados pelo ticker).
 * Se a imagem falhar, mostra um monograma na cor da marca.
 */
export function StockLogo({ symbol, name, brandColor, size = 36, className }: StockLogoProps) {
  const [failed, setFailed] = useState(symbol === "IBOV");
  const style = { width: size, height: size };
  if (failed) {
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
      src={LOGO_URL(symbol)}
      alt={`Logo ${name}`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-lg border border-line bg-white object-contain", className)}
      style={style}
    />
  );
}
