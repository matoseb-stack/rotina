"use client";

import { TABS, type TabId } from "@/lib/tabs";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

/** Barra inferior no celular, respeitando a safe area do iPhone. */
export function BottomNav({ active, onChange }: { active: TabId; onChange: (tab: TabId) => void }) {
  return (
    <nav
      role="tablist"
      aria-label="Seções"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 pb-[var(--safe-bottom)] backdrop-blur-md md:hidden"
    >
      {TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls="painel"
            onClick={() => onChange(tab.id)}
            className={cn("flex min-w-0 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors sm:text-[11px]", selected ? "text-accent" : "text-subtle")}
          >
            <Icon name={tab.icon} className="size-5" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
