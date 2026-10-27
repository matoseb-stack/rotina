"use client";

import { useState } from "react";
import { SOURCE_BY_ID, sourceIcon } from "@/lib/news/sources";
import { cn } from "@/lib/utils";

/** Selo do veículo: ícone oficial do site (favicon) ou, na falta, sigla na cor da marca. */
export function SourceSeal({ sourceId, size = 16, className }: { sourceId: string; size?: number; className?: string }) {
  const source = SOURCE_BY_ID.get(sourceId);
  const [failed, setFailed] = useState(!source);
  if (!source || failed) {
    return (
      <span
        aria-hidden
        className={cn("inline-flex shrink-0 items-center justify-center rounded-[4px] text-[8px] font-bold text-white", className)}
        style={{ width: size, height: size, background: source?.color ?? "#64748b" }}
      >
        {(source?.short ?? "?").slice(0, 2)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- favicon externo, também precisa funcionar no export estático.
    <img
      src={sourceIcon(source.domain)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-[4px] bg-white", className)}
      style={{ width: size, height: size }}
    />
  );
}
