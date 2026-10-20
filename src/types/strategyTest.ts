export type StrategyType = "DIRECTIONAL_SCALP" | "DIRECTIONAL_SWING" | "0DTE_OPTION" | "BINARY_OPTION";

export interface ActiveStrategyTest {
  id: string;
  signal_id?: string;
  symbol: string;
  name: string;
  asset_class: string;
  strategy_type: StrategyType;
  direction: "LONG" | "SHORT" | "CALL" | "PUT" | "BULLISH" | "BEARISH";
  contract_identifier?: string;
  strike_price?: number;

  // Separate Spot vs Option Premium (CRITICAL BUG 1 FIX)
  entry_price: number; // Fill price (for directional: spot; for option: option premium)
  current_price: number; // Current valuation (for directional: spot; for option: current option price)
  entry_spot_price: number; // Underlying spot price at entry (e.g. $81,333.20)
  current_spot_price: number; // Live underlying spot price (e.g. $81,413.85)
  entry_option_premium?: number; // Option premium at fill (e.g. $277.31)
  current_option_premium?: number; // Live option premium (e.g. $345.20)
  exit_option_premium?: number;
  exit_spot_price?: number;

  // Explicit Split Tracking Properties
  entrySpotPrice?: number;
  entryOptionPremium?: number;
  currentSpotPrice?: number;
  currentOptionPremium?: number;
  exitSpotPrice?: number;
  exitOptionPremium?: number;

  // Option Greeks & Valuation parameters
  option_delta?: number;
  option_gamma?: number;
  theta_decay_per_sec?: number;
  
  // Binary Option Expiration parameters
  expiry_duration_seconds?: number; // e.g. 60, 180, 300
  time_remaining_seconds?: number;
  settled_at_expiry?: boolean;

  stop_loss: number;
  initialStopLoss?: number;
  initialRiskDistance?: number;
  riskPerTradeDollars?: number;
  tp1_price: number;
  tp2_price?: number;
  quantity: number;
  opened_at: string;
  closed_at?: string;
  status: "OPEN" | "TP1_LOCKED" | "CLOSED_TP1" | "CLOSED_TP2" | "CLOSED_SL" | "CLOSED_EXPIRY_WIN" | "CLOSED_EXPIRY_LOSS" | "ATM_PUSH" | "MANUAL_CLOSED";
  realized_pnl_dollars?: number;
  realized_r?: number;
  floating_pnl_dollars: number;
  floating_r: number;
  max_favorable_r: number;
  max_adverse_r: number;
  close_reason?: string;
}

export interface StrategyTestSummary {
  total_trades: number;
  win_rate_pct: number;
  total_r_harvested: number;
  total_pnl_dollars: number;
  active_trades_count: number;
}
