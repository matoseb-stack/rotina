import { NextResponse } from "next/server";
import { fetchFolhaMercado } from "@/lib/news/folha";
import { buildMockFeed } from "@/lib/news/mock";
import type { NewsFeed } from "@/lib/news/types";

// Estático no build (GitHub Pages) e revalidado a cada 15 min no servidor (Vercel).
export const dynamic = "force-static";
export const revalidate = 900;

export async function GET() {
  let feed: NewsFeed;
  try {
    feed = { items: await fetchFolhaMercado(), source: "folha", fetchedAt: Date.now() };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "erro desconhecido";
    feed = buildMockFeed(Date.now(), `Feed da Folha indisponível (${reason}). Exibindo manchetes simuladas.`);
  }
  return NextResponse.json(feed);
}
