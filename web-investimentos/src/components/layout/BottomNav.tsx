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
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface/95 pb-[var(--safe-bottom)] backdrop-blur-md md:hidden"
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
            className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors", selected ? "text-accent" : "text-subtle")}
          >
            <Icon name={tab.icon} className="size-5" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
