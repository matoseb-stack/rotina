import { NextResponse } from "next/server";
import { DETAIL_SEEDS } from "@/lib/market/seeds";
import { fetchCompanyNews } from "@/lib/news/companies";
import { fetchCryptoAssetNews } from "@/lib/news/crypto-assets";
import { fetchGlobalAssetNews } from "@/lib/news/global-assets";

// Um JSON por ativo (/api/asset-news/PETR4.json, /AAPL.json, /BTC.json): Folha para a
// B3, imprensa global (Reuters, Bloomberg, CNBC...) para os EUA e portais de cripto.
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 900;

const SEEDS = new Map(DETAIL_SEEDS.map((s) => [s.symbol, s]));

export function generateStaticParams() {
  return [...SEEDS.keys()].map((symbol) => ({ file: `${symbol}.json` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const symbol = file.replace(/\.json$/, "").toUpperCase();
  const seed = SEEDS.get(symbol);
  if (!seed) return NextResponse.json({ error: "Ativo desconhecido" }, { status: 404 });
  const feed =
    seed.market === "crypto"
      ? await fetchCryptoAssetNews(symbol)
      : seed.market === "us"
        ? await fetchGlobalAssetNews(symbol)
        : await fetchCompanyNews(symbol);
  return NextResponse.json(feed);
}
