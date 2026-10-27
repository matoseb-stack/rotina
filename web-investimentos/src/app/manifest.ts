import type { MetadataRoute } from "next";
import { withBase } from "@/lib/base-path";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Painel de Investimentos",
    short_name: "Investimentos",
    description: "Cotações da B3, Tesouro Direto e notícias de mercado em tempo real.",
    start_url: withBase("/"),
    scope: withBase("/"),
    display: "standalone",
    orientation: "any",
    background_color: "#f8fafc",
    theme_color: "#f8fafc",
    lang: "pt-BR",
    categories: ["finance", "news"],
    icons: [
      { src: withBase("/icons/icon-192.png"), sizes: "192x192", type: "image/png" },
      { src: withBase("/icons/icon-512.png"), sizes: "512x512", type: "image/png" },
      { src: withBase("/icons/icon-maskable-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
