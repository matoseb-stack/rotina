import { NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/news/aggregate";

// Central de notícias: Valor, Folha, InfoMoney, Investing.com, Estadão, Bloomberg,
// Reuters, CNBC, FT, WSJ, CoinDesk, Cointelegraph Brasil e CriptoFácil. Estático no
// build (GitHub Pages) e revalidado a cada 5 min no servidor (Vercel).
export const dynamic = "force-static";
export const revalidate = 300;

export async function GET() {
  return NextResponse.json(await fetchAllNews());
}
