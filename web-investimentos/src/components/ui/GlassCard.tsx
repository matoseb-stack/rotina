import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  accent?: string;
  className?: string;
}

export function GlassCard({ children, accent, className }: GlassCardProps) {
  return (
    <div className={cn("glass rounded-3xl p-5", className)} style={accent ? ({ "--accent": accent } as CSSProperties) : undefined}>
      {children}
    </div>
  );
}
