"use client";

import { setTheme, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

/** Alternador claro/escuro em formato de switch segmentado. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  return (
    <div role="radiogroup" aria-label="Tema" className={cn("inline-flex rounded-lg border border-line bg-surface-2 p-0.5", className)}>
      {(["light", "dark"] as const).map((t) => {
        const active = theme === t;
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t === "light" ? "Tema claro" : "Tema escuro"}
            onClick={() => setTheme(t)}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-md transition-colors",
              active ? "bg-surface text-fg shadow-card-sm" : "text-subtle hover:text-fg",
            )}
          >
            <Icon name={t === "light" ? "sun" : "moon"} className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
