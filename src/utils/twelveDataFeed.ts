/**
 * Twelve Data Live Pricing WebSocket Feed & Fallback Engine
 * Connects to wss://ws.twelvedata.com/v1/quotes/price?apikey=YOUR_KEY
 * Provides exponential backoff, heartbeat management, and seamless fallback.
 */

import { MASTER_UNIVERSE_84 } from "../data/universe84";

export interface TwelveDataPriceEvent {
  event: "price" | "heartbeat" | "status" | "subscribe-status";
  symbol?: string;
  price?: number;
  timestamp?: number;
  day_volume?: number;
  status?: string;
  message?: string;
}

export type PriceUpdateCallback = (symbol: string, price: number, dayVolume?: number) => void;

// Canonical Twelve Data symbols for our 54 non-crypto assets
export const TWELVE_DATA_SYMBOLS: string[] = [
  // Forex Major & Crosses
  "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD",
  "EUR/GBP", "EUR/JPY", "GBP/JPY", "AUD/JPY", "CAD/JPY", "CHF/JPY", "EUR/AUD",
  "GBP/AUD", "EUR/CAD", "GBP/CAD", "AUD/CAD", "EUR/CHF", "GBP/CHF", "AUD/NZD",
  "EUR/NZD", "GBP/NZD", "USD/SGD",
  // Commodities
  "XAG/USD", "WTI/USD", "BRENT/USD", "XPT/USD", "XPD/USD",
  // US & Global Indices & CFDs
  "SPX", "IXIC", "DJI", "RUT", "DAX", "FTSE", "CAC", "N225", "HSI", "AXJO",
  // Stocks
  "NVDA", "TSLA", "AAPL", "MSFT", "META", "AMZN", "AMD", "GOOGL", "NFLX", "COIN"
];

// Mapping from Twelve Data incoming symbol to our Master Universe symbol
const SYMBOL_NORMALIZER: Record<string, string> = {
  "SPX": "US500",
  "IXIC": "NAS100",
  "DJI": "US30",
  "RUT": "US2000",
  "DAX": "GER40",
  "FTSE": "UK100",
  "CAC": "FRA40",
  "N225": "JPN225",
  "HSI": "HK50",
  "AXJO": "AUS200",
};

export class TwelveDataWebSocketManager {
  private ws: WebSocket | null = null;
  private apiKey: string = "";
  private isDestroyed: boolean = false;
  private reconnectAttempt: number = 0;
  private reconnectTimer: any = null;
  private heartbeatInterval: any = null;
  private onPriceUpdate: PriceUpdateCallback;
  private onStatusChange?: (status: "CONNECTED" | "CONNECTING" | "DISCONNECTED" | "ERROR", details?: string) => void;

  constructor(
    onPriceUpdate: PriceUpdateCallback,
    onStatusChange?: (status: "CONNECTED" | "CONNECTING" | "DISCONNECTED" | "ERROR", details?: string) => void
  ) {
    this.onPriceUpdate = onPriceUpdate;
    this.onStatusChange = onStatusChange;
  }

  public setApiKey(key: string) {
    const trimmed = (key || "").trim();
    if (this.apiKey !== trimmed) {
      this.apiKey = trimmed;
      if (this.ws) {
        this.disconnect();
      }
      if (this.apiKey) {
        this.connect();
      }
    }
  }

  public connect() {
    if (!this.apiKey || this.isDestroyed) return;

    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.onStatusChange?.("CONNECTING");

    try {
      const url = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${encodeURIComponent(this.apiKey)}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempt = 0;
        this.onStatusChange?.("CONNECTED");

        // Subscribe to relevant symbols in chunks of 20 to avoid payload limits
        const chunkSize = 20;
        for (let i = 0; i < TWELVE_DATA_SYMBOLS.length; i += chunkSize) {
          const chunk = TWELVE_DATA_SYMBOLS.slice(i, i + chunkSize);
          const subscribeMsg = {
            action: "subscribe",
            params: {
              symbols: chunk.join(","),
            },
          };
          this.send(subscribeMsg);
        }

        // Heartbeat ping every 15 seconds
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.send({ action: "heartbeat" });
          }
        }, 15000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data: TwelveDataPriceEvent = JSON.parse(event.data);
          if (data.event === "price" && data.symbol && typeof data.price === "number") {
            const rawSymbol = data.symbol.toUpperCase();
            const normalizedSymbol = SYMBOL_NORMALIZER[rawSymbol] || rawSymbol;
            this.onPriceUpdate(normalizedSymbol, data.price, data.day_volume);
          } else if (data.event === "status" && data.status === "error") {
            console.warn("Twelve Data WebSocket error status:", data.message);
            this.onStatusChange?.("ERROR", data.message);
          }
        } catch (e) {
          // ignore parsing error
        }
      };

      this.ws.onerror = (e) => {
        console.warn("Twelve Data WebSocket error:", e);
        this.onStatusChange?.("ERROR", "WebSocket connection error");
      };

      this.ws.onclose = () => {
        this.cleanupSocket();
        this.onStatusChange?.("DISCONNECTED");
        this.scheduleReconnect();
      };
    } catch (err: any) {
      console.warn("Twelve Data connection initiation failed:", err);
      this.scheduleReconnect();
    }
  }

  private send(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private cleanupSocket() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }

  private scheduleReconnect() {
    if (this.isDestroyed || !this.apiKey) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    // Exponential backoff: 1s, 2s, 4s, 8s, up to 30s
    this.reconnectAttempt++;
    const delay = Math.min(30000, Math.pow(2, this.reconnectAttempt - 1) * 1000);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.cleanupSocket();
    this.onStatusChange?.("DISCONNECTED");
  }

  public destroy() {
    this.isDestroyed = true;
    this.disconnect();
  }
}
