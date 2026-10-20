export type AssetClass = "CRYPTO" | "FOREX" | "COMMODITIES" | "STOCKS";

export type HorizonMode = "SCALP_5M_15M" | "SWING_1H_4H";

export type SignalDirection = "LONG" | "SHORT";

export type SignalStatus = "ACTIVE" | "TP1_HIT_BE_LOCKED" | "CLOSED_WIN" | "CLOSED_LOSS" | "TIME_STOP_SCRATCH";

export interface SignalRecord {
  id: string;
  created_at: string;
  symbol: string;
  asset_class: AssetClass;
  horizon_mode: HorizonMode;
  timeframe: string;
  direction: SignalDirection;
  win_probability: number;
  entry_price: number;
  stop_loss: number;
  tp1_price: number;
  tp2_price: number;
  current_price: number;
  status: SignalStatus;
  confidence_score?: number; // 0-100 institutional score
  action_recommendation?: "STRONG_BUY" | "BUY" | "STRONG_SELL" | "SELL" | "HOLD";
  action_instruction?: string; // Actionable execution directive
  ai_headline: string;
  ai_thesis: {
    thesis: string[];
    risk_warning: string;
    macro_sentiment: number;
    supervisor_model?: string;
  };
  mfe_r?: number;
  mae_r?: number;
  realized_r?: number;
  tp1_hit_at?: string;
  closed_at?: string;
  telemetry: {
    vwap_z: number;
    delta_z: number;
    hurst: number;
    rvol: number;
    vol_pct: number;
    session_liquid: boolean;
  };
}

export interface CandleBar {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AssetTicker {
  symbol: string;
  name: string;
  asset_class: AssetClass;
  price: number;
  change_24h: number;
  volume_24h: string;
  vwap_z: number;
  delta_z: number;
  hurst: number;
  trend: "BULLISH" | "BEARISH" | "CHOP";
  is_liquid: boolean;
}

export interface LeaderboardStats {
  rolling_30d_win_rate: number;
  total_r_captured: number;
  profit_factor: number;
  total_trades: number;
  expectancy_r: number;
  sharpe_ratio: number;
  max_drawdown_r: number;
  breakdown: Array<{
    asset_class: AssetClass;
    horizon_mode: HorizonMode;
    total_signals: number;
    win_rate: number;
    total_r: number;
    expectancy_r: number;
    profit_factor: number;
  }>;
}
