import type { Market } from "./types";

/**
 * Logos públicos indexados pelo ticker: brapi.dev para a B3 e
 * Financial Modeling Prep para ações e ETFs dos EUA.
 */
export function logoUrl(symbol: string, market: Market = "b3"): string | null {
  if (market === "us") return `https://financialmodelingprep.com/image-stock/${symbol}.png`;
  if (symbol === "IBOV") return null;
  return `https://icons.brapi.dev/icons/${symbol}.svg`;
}
