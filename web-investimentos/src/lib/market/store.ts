import { MarketSimulator } from "./simulator";
import type { MarketSnapshot } from "./types";

type Listener = () => void;

/**
 * Store externo (fora do React) consumido via useSyncExternalStore.
 * - O loop de 1 s só roda enquanto há componentes inscritos.
 * - Pausa quando a aba do navegador fica oculta (economiza bateria no iPhone).
 * - Cada tick gera um snapshot imutável: seletores devolvem referências
 *   estáveis entre ticks e só os componentes inscritos re-renderizam.
 */
export function createMarketStore(intervalMs = 1_000) {
  const simulator = new MarketSimulator();
  const serverSnapshot = MarketSimulator.initialSnapshot();
  let snapshot = serverSnapshot;
  const listeners = new Set<Listener>();
  let timer: ReturnType<typeof setInterval> | null = null;

  const emit = () => listeners.forEach((l) => l());
  const tick = () => {
    snapshot = simulator.step(Date.now());
    emit();
  };
  const start = () => {
    if (timer || document.visibilityState === "hidden") return;
    tick();
    timer = setInterval(tick, intervalMs);
  };
  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };
  const onVisibility = () => (document.visibilityState === "hidden" ? stop() : start());

  return {
    subscribe(listener: Listener) {
      listeners.add(listener);
      if (listeners.size === 1) {
        document.addEventListener("visibilitychange", onVisibility);
        // Agenda o primeiro tick fora do commit do React.
        queueMicrotask(start);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          stop();
          document.removeEventListener("visibilitychange", onVisibility);
        }
      };
    },
    getSnapshot: (): MarketSnapshot => snapshot,
    getServerSnapshot: (): MarketSnapshot => serverSnapshot,
  };
}

export const marketStore = createMarketStore();
