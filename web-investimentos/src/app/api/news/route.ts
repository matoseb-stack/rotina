import { NextResponse } from "next/server";
import { fetchFolhaMercado } from "@/lib/news/folha";
import { buildMockFeed } from "@/lib/news/mock";
import type { NewsFeed } from "@/lib/news/types";

// Revalida o cache do servidor a cada 2 minutos: o RSS da Folha não precisa de mais que isso.
export const revalidate = 120;

export async function GET() {
  let feed: NewsFeed;
  try {
    feed = { items: await fetchFolhaMercado(), source: "folha", fetchedAt: Date.now() };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "erro desconhecido";
    feed = buildMockFeed(Date.now(), `Feed da Folha indisponível (${reason}). Exibindo manchetes simuladas.`);
  }
  return NextResponse.json(feed, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
