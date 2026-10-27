import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { withBase } from "@/lib/base-path";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Painel de Investimentos",
  description: "Cotações da B3, Tesouro Direto e notícias de mercado em tempo real.",
  applicationName: "Painel de Investimentos",
  manifest: withBase("/manifest.webmanifest"),
  appleWebApp: { capable: true, title: "Investimentos", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: withBase("/icons/icon-192.png"), sizes: "192x192", type: "image/png" }],
    apple: [{ url: withBase("/icons/apple-touch-icon.png"), sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // O script de tema altera data-theme antes da hidratação.
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh font-sans">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
