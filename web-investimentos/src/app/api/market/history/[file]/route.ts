import { NextResponse } from "next/server";
import { INDEX_SEED, STOCK_SEEDS } from "@/lib/market/seeds";
import { fetchRealHistory } from "@/lib/market/real/history";

// Histórico real por ativo (/api/market/history/PETR4.json) para o gráfico do modal.
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 300;

export function generateStaticParams() {
  return [INDEX_SEED, ...STOCK_SEEDS].map((s) => ({ file: `${s.symbol}.json` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  return NextResponse.json(await fetchRealHistory(file.replace(/\.json$/, "").toUpperCase()));
}
