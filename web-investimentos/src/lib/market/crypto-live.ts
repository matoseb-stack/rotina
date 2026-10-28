/**
 * Preços de cripto ao vivo pelo WebSocket público da Coinbase (canal "ticker"),
 * direto do navegador: sem chave, sem servidor no meio. Reconecta sozinho com
 * espera crescente. Quem usa decide quando aplicar os ticks (o painel aplica
 * em lote a cada 1 s).
 */
export interface CryptoTick {
  price: number;
  open24h: number;
  high24h: number;
  low24h: number;
  time: number;
}

export type FeedStatus = "connecting" | "live" | "offline";

const URL = "wss://ws-feed.exchange.coinbase.com";

interface TickerMessage {
  type: string;
  product_id?: string;
  price?: string;
  open_24h?: string;
  high_24h?: string;
  low_24h?: string;
  time?: string;
}

export function startCoinbaseFeed(
  products: string[],
  onTick: (product: string, tick: CryptoTick) => void,
  onStatus: (status: FeedStatus) => void,
): () => void {
  let socket: WebSocket | null = null;
  let retry: ReturnType<typeof setTimeout> | null = null;
  let attempts = 0;
  let stopped = false;

  const connect = () => {
    if (stopped || typeof WebSocket === "undefined") return;
    onStatus("connecting");
    socket = new WebSocket(URL);
    socket.onopen = () => {
      attempts = 0;
      socket?.send(JSON.stringify({ type: "subscribe", product_ids: products, channels: ["ticker"] }));
    };
    socket.onmessage = (event) => {
      let msg: TickerMessage;
      try {
        msg = JSON.parse(String(event.data)) as TickerMessage;
      } catch {
        return;
      }
      if (msg.type === "subscriptions") onStatus("live");
      if (msg.type !== "ticker" || !msg.product_id || !msg.price) return;
      const price = Number(msg.price);
      if (!Number.isFinite(price)) return;
      onTick(msg.product_id, {
        price,
        open24h: Number(msg.open_24h) || price,
        high24h: Number(msg.high_24h) || price,
        low24h: Number(msg.low_24h) || price,
        time: msg.time ? Date.parse(msg.time) : Date.now(),
      });
    };
    socket.onclose = () => {
      socket = null;
      if (stopped) return;
      onStatus("offline");
      // 2 s, 4 s, 8 s... até 30 s.
      retry = setTimeout(connect, Math.min(30_000, 2_000 * 2 ** attempts++));
    };
    socket.onerror = () => socket?.close();
  };

  connect();
  return () => {
    stopped = true;
    if (retry) clearTimeout(retry);
    socket?.close();
    socket = null;
  };
}
