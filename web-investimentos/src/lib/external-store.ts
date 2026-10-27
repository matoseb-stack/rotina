type Listener = () => void;

/**
 * Store externo mínimo para useSyncExternalStore: guarda um snapshot imutável,
 * avisa os inscritos e liga/desliga o trabalho de fundo conforme há leitores.
 */
export function createExternalStore<T>(initial: T, onFirstSubscribe: () => void, onLastUnsubscribe: () => void) {
  let snapshot = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => snapshot,
    set(next: T) {
      snapshot = next;
      listeners.forEach((l) => l());
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      if (listeners.size === 1) queueMicrotask(onFirstSubscribe);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) onLastUnsubscribe();
      };
    },
  };
}
