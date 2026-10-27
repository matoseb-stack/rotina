import { NextResponse } from "next/server";
import { STOCK_SEEDS } from "@/lib/market/seeds";
import { fetchCompanyNews } from "@/lib/news/companies";

// Um JSON por ativo (/api/asset-news/PETR4.json), gerado no build e revalidado a cada 15 min.
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 900;

export function generateStaticParams() {
  return STOCK_SEEDS.map((s) => ({ file: `${s.symbol}.json` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const symbol = file.replace(/\.json$/, "").toUpperCase();
  return NextResponse.json(await fetchCompanyNews(symbol));
}
