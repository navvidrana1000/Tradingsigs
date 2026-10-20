export type OptionActionDecision = "BUY CALL (LONG VOL)" | "BUY PUT (SHORT VOL)";

export type OptionStrategyType = "DIRECTIONAL_MOMENTUM_BUY" | "THETA_DECAY_HARVEST";

export type GexState = "POSITIVE_GAMMA" | "NEGATIVE_GAMMA" | "GAMMA_FLIP_RISK";

export type ThetaRiskLevel = "HIGH" | "MEDIUM" | "LOW" | "EXTREME_EXPIRING" | "HIGH_BURNDOWN" | "MODERATE" | "STABLE";

export interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number; // e.g. -0.45 ($/share/day or hour)
  vega: number;
  rho?: number;
}

export interface OptionSetupRecord {
  id: string;
  symbol: "SPY" | "QQQ" | "NVDA" | "BTC" | "TSLA" | "AAPL" | string;
  name: string;
  underlying_price: number;
  strategy_classification: OptionStrategyType;
  expiration_type: "0DTE" | "15M" | "1DTE" | "WEEKLY";
  expiry_formatted: string;
  time_to_close_minutes: number;
  
  // 1. Exact Ultra-Short Card Layout & Structure Requirements
  contract_identifier: string; // e.g. "SPY 0DTE 585.0 CALL" or "BTC 15M 64000 PUT"
  action_decision: OptionActionDecision; // "BUY CALL (LONG VOL)" in emerald green or "BUY PUT (SHORT VOL)" in rose red
  
  // Entry & Execution Parameters
  entry_premium_zone: string; // e.g. "$2.45 – $2.55"
  entry_premium_min: number;
  entry_premium_max: number;
  current_premium: number;
  take_profit_price: number; // e.g. 3.40
  take_profit_pct: number; // e.g. 35
  take_profit_formatted: string; // e.g. "$3.40 (+35%)"
  stop_loss_price: number; // e.g. 1.85
  stop_loss_pct: number; // e.g. -25
  stop_loss_formatted: string; // e.g. "$1.85 (-25%)"
  
  // Confidence Rating & Time Window
  ai_confidence_score: number; // e.g. 84.2
  ai_confidence_badge: string; // e.g. "84.2% AI Confidence"
  ai_model_verification: string; // e.g. "LightGBM + Gemini Risk Supervisor"
  time_horizon: string; // e.g. "Valid for next: 5 to 10 Minutes max"
  timeline_bracket: "3-5M" | "5-10M" | "10-15M";
  initial_countdown_seconds: number;
  
  // 2. Quantitative Options Metrics Bar
  iv_rv_spread_ratio: string; // e.g. "1.34x (+12.4%)"
  delta_velocity: string; // e.g. "+0.42 Δ/min (High Speed)"
  delta_velocity_val: number;
  theta_decay_risk_indicator: "HIGH" | "MEDIUM" | "LOW";
  theta_burn_rate: string; // e.g. "-$0.38 / hr"
  
  // Contract specifics
  recommended_contract: string;
  option_type: "CALL" | "PUT" | "BEAR_CALL_SPREAD" | "BULL_PUT_SPREAD" | "IRON_CONDOR";
  strike_selection: string; // e.g. "25 Delta OTM ($592.00 Call)"
  strike_price: number;
  secondary_strike?: number; // for spreads
  target_delta: string; // e.g. "0.25 Delta"
  direction: "BULLISH" | "BEARISH" | "NEUTRAL_RANGE";
  bid_ask: string; // e.g. "$1.38 / $1.42"
  mid_price: number;
  
  // Quantitative telemetry
  iv_rank: number; // 0-100%
  iv_pct: number; // e.g. 28.4%
  rv_pct: number; // Realized volatility e.g. 17.2%
  iv_rv_spread: number; // e.g. +11.2% (Rich) or -2.4% (Cheap)
  gex_state: GexState;
  gex_net_value: string; // e.g. "+$1.85B (Long Market Maker Gamma)"
  gex_description: string;
  theta_decay_risk: ThetaRiskLevel;
  theta_rate: string; // e.g. "-$0.48 / hr"
  
  // Strategy Classification details
  strategy_headline: string;
  strategy_mechanics: string;
  
  // Risk & Execution Parameters
  max_holding_time: string; // e.g. "35 - 45 Minutes Max (Hard Time-Stop)"
  gamma_risk_warning: string; // Explicit warning on rapid acceleration / pin risk near expiration
  profit_target: string;
  stop_loss_guideline: string;
  confluence_score: number; // 0-100
  
  // Greeks
  greeks: OptionGreeks;
  
  // Flow Sentiment & Thesis
  flow_sentiment: "HEAVY_CALL_SWEEP" | "PUT_PURCHASE_FLOW" | "PREMIUM_SELLING_CHOP" | "DEALER_PIN_FLOW";
  ai_thesis: string[];
}

export interface OptionsMarketOverview {
  spy_0dte_iv: number;
  vix_current: number;
  market_gex_regime: GexState;
  net_gamma_dollars: string;
  zero_gamma_level: number;
  theta_burn_velocity: "RAPID" | "MODERATE" | "PEAK_AFTERNOON";
  dominant_flow: string;
}
