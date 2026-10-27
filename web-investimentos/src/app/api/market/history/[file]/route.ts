import { NextResponse } from "next/server";
import { DETAIL_SEEDS, INDEX_SEED } from "@/lib/market/seeds";
import { fetchRealHistory } from "@/lib/market/real/history";

// Histórico real por ativo (/api/market/history/PETR4.json, /AAPL.json...) para o gráfico do modal.
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 300;

const SEEDS = new Map([INDEX_SEED, ...DETAIL_SEEDS].map((s) => [s.symbol, s]));

export function generateStaticParams() {
  return [...SEEDS.keys()].map((symbol) => ({ file: `${symbol}.json` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const seed = SEEDS.get(file.replace(/\.json$/, "").toUpperCase());
  if (!seed) return NextResponse.json({ error: "Ativo desconhecido" }, { status: 404 });
  return NextResponse.json(await fetchRealHistory(seed));
}
