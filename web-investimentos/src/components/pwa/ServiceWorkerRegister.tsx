"use client";

import { useEffect } from "react";
import { withBase } from "@/lib/base-path";

/** Registra o service worker só em produção (no dev ele atrapalharia o hot reload). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(withBase("/sw.js"), { scope: withBase("/") }).catch(() => {
      // Sem SW o app continua funcionando, só não fica disponível offline.
    });
  }, []);
  return null;
}
