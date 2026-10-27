import type { NextConfig } from "next";

/**
 * Dois modos de deploy:
 *  - padrão (Vercel / `npm start`): servidor Next, notícias revalidadas a cada 15 min;
 *  - STATIC_EXPORT=1 (GitHub Pages): HTML/JSON estáticos em ./out, servidos sob
 *    NEXT_PUBLIC_BASE_PATH (ex.: "/rotina/investimentos").
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath,
  ...(isStaticExport
    ? { output: "export", trailingSlash: true, images: { unoptimized: true } }
    : {
        async headers() {
          return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] }];
        },
      }),
};

export default nextConfig;
