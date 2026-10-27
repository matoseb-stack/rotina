import { NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/news/aggregate";

// Central de notícias: Valor, Folha, InfoMoney, Investing.com, Estadão, Bloomberg,
// Reuters, CNBC, FT e WSJ. Estático no build (GitHub Pages) e revalidado a cada
// 15 min no servidor (Vercel).
export const dynamic = "force-static";
export const revalidate = 900;

export async function GET() {
  return NextResponse.json(await fetchAllNews());
}
