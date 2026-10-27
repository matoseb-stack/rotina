import { NextResponse } from "next/server";
import { fetchRealMarket } from "@/lib/market/real/market";

// Cotações reais (Yahoo Finance) + Selic/CDI/IPCA (Banco Central).
// Estático no build (GitHub Pages) e revalidado a cada 60 s no servidor (Vercel).
export const dynamic = "force-static";
export const revalidate = 60;

export async function GET() {
  return NextResponse.json(await fetchRealMarket());
}
