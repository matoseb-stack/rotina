import type { Market } from "./types";

/** Logos oficiais das criptomoedas (CDN de imagens da CoinGecko; o parâmetro de versão é necessário). */
const CRYPTO_LOGOS: Record<string, string> = {
  BTC: "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400",
  ETH: "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628",
  SOL: "https://coin-images.coingecko.com/coins/images/4128/large/solana.png?1718769756",
  BNB: "https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png?1696501970",
  XRP: "https://coin-images.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png?1696501442",
  ADA: "https://coin-images.coingecko.com/coins/images/975/large/cardano.png?1696502090",
  USDT: "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
  USDC: "https://coin-images.coingecko.com/coins/images/6319/large/USDC.png?1769615602",
};

/** Logos com desenho claro que precisam de fundo escuro. */
export const LOGO_DARK_BG = new Set(["XRP"]);

/**
 * Logos públicos indexados pelo ticker: brapi.dev para a B3, Financial
 * Modeling Prep para ações e ETFs dos EUA e CoinGecko para cripto.
 */
export function logoUrl(symbol: string, market: Market = "b3"): string | null {
  if (market === "crypto") return CRYPTO_LOGOS[symbol] ?? null;
  if (market === "us") return `https://financialmodelingprep.com/image-stock/${symbol}.png`;
  if (symbol === "IBOV") return null;
  return `https://icons.brapi.dev/icons/${symbol}.svg`;
}
