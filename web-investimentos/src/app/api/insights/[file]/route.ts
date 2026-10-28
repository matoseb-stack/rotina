import { NextResponse } from "next/server";
import { generateInsight } from "@/lib/insights/generate";
import { DETAIL_SEEDS } from "@/lib/market/seeds";

// Resumo "por que está subindo/caindo" (/api/insights/PETR4.json). Estático no
// build (GitHub Pages) e revalidado a cada 30 min no servidor (Vercel).
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 1800;

const SEEDS = new Map(DETAIL_SEEDS.map((s) => [s.symbol, s]));

export function generateStaticParams() {
  return [...SEEDS.keys()].map((symbol) => ({ file: `${symbol}.json` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const seed = SEEDS.get(file.replace(/\.json$/, "").toUpperCase());
  if (!seed) return NextResponse.json({ error: "Ativo desconhecido" }, { status: 404 });
  const insight = await generateInsight(seed);
  return NextResponse.json(insight ?? { symbol: seed.symbol, error: "Sem cotação para gerar o resumo." });
}
