/**
 * Master Universe Definition: Exactly 84 Multi-Asset Instruments
 * 30 Crypto Pairs, 24 Forex Pairs, 10 Commodity Contracts, 20 Index & Stock CFDs
 */

export type AssetClassCategory = "CRYPTO" | "FOREX" | "COMMODITIES" | "INDEX_STOCK";

export interface MasterAssetDef {
  symbol: string;
  name: string;
  assetClass: AssetClassCategory;
  categoryLabel: string;
  basePrice: number;
  precision: number;
  atrPct: number;
  yfSymbol?: string;
  binanceSymbol?: string;
  contractUnit?: string;
}

export const MASTER_UNIVERSE_84: MasterAssetDef[] = [
  // ==========================================
  // 1. CRYPTO (30 Pairs)
  // ==========================================
  { symbol: "BTCUSDT", name: "Bitcoin Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 81980.0, precision: 2, atrPct: 0.016, binanceSymbol: "BTCUSDT" },
  { symbol: "ETHUSDT", name: "Ethereum Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 2840.5, precision: 2, atrPct: 0.022, binanceSymbol: "ETHUSDT" },
  { symbol: "SOLUSDT", name: "Solana Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 178.45, precision: 2, atrPct: 0.028, binanceSymbol: "SOLUSDT" },
  { symbol: "BNBUSDT", name: "BNB Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 624.1, precision: 2, atrPct: 0.019, binanceSymbol: "BNBUSDT" },
  { symbol: "XRPUSDT", name: "XRP Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 1.482, precision: 4, atrPct: 0.032, binanceSymbol: "XRPUSDT" },
  { symbol: "DOGEUSDT", name: "Dogecoin Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 0.2245, precision: 4, atrPct: 0.038, binanceSymbol: "DOGEUSDT" },
  { symbol: "ADAUSDT", name: "Cardano Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 0.742, precision: 4, atrPct: 0.031, binanceSymbol: "ADAUSDT" },
  { symbol: "AVAXUSDT", name: "Avalanche Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 32.85, precision: 2, atrPct: 0.034, binanceSymbol: "AVAXUSDT" },
  { symbol: "LINKUSDT", name: "Chainlink Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 16.42, precision: 2, atrPct: 0.026, binanceSymbol: "LINKUSDT" },
  { symbol: "SUIUSDT", name: "Sui Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 2.18, precision: 4, atrPct: 0.042, binanceSymbol: "SUIUSDT" },
  { symbol: "TONUSDT", name: "Toncoin Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 5.12, precision: 2, atrPct: 0.025, binanceSymbol: "TONUSDT" },
  { symbol: "DOTUSDT", name: "Polkadot Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 6.84, precision: 3, atrPct: 0.028, binanceSymbol: "DOTUSDT" },
  { symbol: "NEARUSDT", name: "NEAR Protocol", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 4.95, precision: 3, atrPct: 0.035, binanceSymbol: "NEARUSDT" },
  { symbol: "LTCUSDT", name: "Litecoin Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 94.2, precision: 2, atrPct: 0.021, binanceSymbol: "LTCUSDT" },
  { symbol: "BCHUSDT", name: "Bitcoin Cash Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 462.8, precision: 2, atrPct: 0.024, binanceSymbol: "BCHUSDT" },
  { symbol: "UNIUSDT", name: "Uniswap Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 9.35, precision: 3, atrPct: 0.029, binanceSymbol: "UNIUSDT" },
  { symbol: "APTUSDT", name: "Aptos Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 11.24, precision: 3, atrPct: 0.036, binanceSymbol: "APTUSDT" },
  { symbol: "ICPUSDT", name: "Internet Computer", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 10.65, precision: 2, atrPct: 0.032, binanceSymbol: "ICPUSDT" },
  { symbol: "ARBUSDT", name: "Arbitrum Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 0.785, precision: 4, atrPct: 0.039, binanceSymbol: "ARBUSDT" },
  { symbol: "OPUSDT", name: "Optimism Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 1.84, precision: 3, atrPct: 0.037, binanceSymbol: "OPUSDT" },
  { symbol: "INJUSDT", name: "Injective Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 24.3, precision: 2, atrPct: 0.036, binanceSymbol: "INJUSDT" },
  { symbol: "RENDERUSDT", name: "Render Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 6.45, precision: 3, atrPct: 0.041, binanceSymbol: "RENDERUSDT" },
  { symbol: "FETUSDT", name: "Artificial Superintelligence", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 1.34, precision: 4, atrPct: 0.043, binanceSymbol: "FETUSDT" },
  { symbol: "TIAUSDT", name: "Celestia Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 5.62, precision: 3, atrPct: 0.045, binanceSymbol: "TIAUSDT" },
  { symbol: "SEIUSDT", name: "Sei Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 0.442, precision: 4, atrPct: 0.044, binanceSymbol: "SEIUSDT" },
  { symbol: "WIFUSDT", name: "dogwifhat Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 2.38, precision: 4, atrPct: 0.052, binanceSymbol: "WIFUSDT" },
  { symbol: "PEPEUSDT", name: "Pepe Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 0.0000108, precision: 8, atrPct: 0.055, binanceSymbol: "PEPEUSDT" },
  { symbol: "AAVEUSDT", name: "Aave Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 182.5, precision: 2, atrPct: 0.029, binanceSymbol: "AAVEUSDT" },
  { symbol: "FILUSDT", name: "Filecoin Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 4.88, precision: 3, atrPct: 0.033, binanceSymbol: "FILUSDT" },
  { symbol: "ATOMUSDT", name: "Cosmos Perpetual", assetClass: "CRYPTO", categoryLabel: "Crypto", basePrice: 6.15, precision: 3, atrPct: 0.031, binanceSymbol: "ATOMUSDT" },

  // ==========================================
  // 2. FOREX (24 Pairs)
  // ==========================================
  { symbol: "EUR/USD", name: "Euro / US Dollar", assetClass: "FOREX", categoryLabel: "Forex Major", basePrice: 1.1215, precision: 4, atrPct: 0.0048, yfSymbol: "EURUSD=X" },
  { symbol: "GBP/USD", name: "British Pound / USD", assetClass: "FOREX", categoryLabel: "Forex Major", basePrice: 1.3325, precision: 4, atrPct: 0.0055, yfSymbol: "GBPUSD=X" },
  { symbol: "USD/JPY", name: "USD / Japanese Yen", assetClass: "FOREX", categoryLabel: "Forex Major", basePrice: 157.85, precision: 2, atrPct: 0.0062, yfSymbol: "USDJPY=X" },
  { symbol: "USD/CHF", name: "USD / Swiss Franc", assetClass: "FOREX", categoryLabel: "Forex Major", basePrice: 0.8625, precision: 4, atrPct: 0.0049, yfSymbol: "USDCHF=X" },
  { symbol: "AUD/USD", name: "Australian Dollar / USD", assetClass: "FOREX", categoryLabel: "Forex Major", basePrice: 0.6945, precision: 4, atrPct: 0.0068, yfSymbol: "AUDUSD=X" },
  { symbol: "USD/CAD", name: "USD / Canadian Dollar", assetClass: "FOREX", categoryLabel: "Forex Major", basePrice: 1.3815, precision: 4, atrPct: 0.0051, yfSymbol: "USDCAD=X" },
  { symbol: "NZD/USD", name: "NZ Dollar / US Dollar", assetClass: "FOREX", categoryLabel: "Forex Major", basePrice: 0.6125, precision: 4, atrPct: 0.0072, yfSymbol: "NZDUSD=X" },
  { symbol: "EUR/GBP", name: "Euro / British Pound", assetClass: "FOREX", categoryLabel: "Forex Cross", basePrice: 0.8415, precision: 4, atrPct: 0.0042, yfSymbol: "EURGBP=X" },
  { symbol: "EUR/JPY", name: "Euro / Japanese Yen", assetClass: "FOREX", categoryLabel: "Forex Cross", basePrice: 177.05, precision: 2, atrPct: 0.0071, yfSymbol: "EURJPY=X" },
  { symbol: "GBP/JPY", name: "British Pound / Yen", assetClass: "FOREX", categoryLabel: "Forex Cross", basePrice: 210.35, precision: 2, atrPct: 0.0085, yfSymbol: "GBPJPY=X" },
  { symbol: "AUD/JPY", name: "Australian Dollar / Yen", assetClass: "FOREX", categoryLabel: "Forex Cross", basePrice: 109.65, precision: 2, atrPct: 0.0082, yfSymbol: "AUDJPY=X" },
  { symbol: "CAD/JPY", name: "Canadian Dollar / Yen", assetClass: "FOREX", categoryLabel: "Forex Cross", basePrice: 114.25, precision: 2, atrPct: 0.0075, yfSymbol: "CADJPY=X" },
  { symbol: "CHF/JPY", name: "Swiss Franc / Yen", assetClass: "FOREX", categoryLabel: "Forex Cross", basePrice: 183.15, precision: 2, atrPct: 0.0068, yfSymbol: "CHFJPY=X" },
  { symbol: "EUR/AUD", name: "Euro / Australian Dollar", assetClass: "FOREX", categoryLabel: "Forex Cross", basePrice: 1.6150, precision: 4, atrPct: 0.0065, yfSymbol: "EURAUD=X" },
  { symbol: "GBP/AUD", name: "British Pound / AUD", assetClass: "FOREX", categoryLabel: "Forex Cross", basePrice: 1.9185, precision: 4, atrPct: 0.0074, yfSymbol: "GBPAUD=X" },
  { symbol: "EUR/CAD", name: "Euro / Canadian Dollar", assetClass: "FOREX", categoryLabel: "Forex Cross", basePrice: 1.5495, precision: 4, atrPct: 0.0053, yfSymbol: "EURCAD=X" },
  { symbol: "GBP/CAD", name: "British Pound / CAD", assetClass: "FOREX", categoryLabel: "Forex Cross", basePrice: 1.8410, precision: 4, atrPct: 0.0062, yfSymbol: "GBPCAD=X" },
  { symbol: "AUD/CAD", name: "Australian Dollar / CAD", assetClass: "FOREX", categoryLabel: "Forex Cross", basePrice: 0.9595, precision: 4, atrPct: 0.0058, yfSymbol: "AUDCAD=X" },
  { symbol: "EUR/CHF", name: "Euro / Swiss Franc", assetClass: "FOREX", categoryLabel: "Forex Cross", basePrice: 0.9675, precision: 4, atrPct: 0.0038, yfSymbol: "EURCHF=X" },
  { symbol: "GBP/CHF", name: "British Pound / CHF", assetClass: "FOREX", categoryLabel: "Forex Cross", basePrice: 1.1495, precision: 4, atrPct: 0.0049, yfSymbol: "GBPCHF=X" },
  { symbol: "AUD/NZD", name: "Australian / NZ Dollar", assetClass: "FOREX", categoryLabel: "Forex Cross", basePrice: 1.1340, precision: 4, atrPct: 0.0044, yfSymbol: "AUDNZD=X" },
  { symbol: "EUR/NZD", name: "Euro / NZ Dollar", assetClass: "FOREX", categoryLabel: "Forex Cross", basePrice: 1.8310, precision: 4, atrPct: 0.0069, yfSymbol: "EURNZD=X" },
  { symbol: "GBP/NZD", name: "British Pound / NZD", assetClass: "FOREX", categoryLabel: "Forex Cross", basePrice: 2.1755, precision: 4, atrPct: 0.0076, yfSymbol: "GBPNZD=X" },
  { symbol: "USD/SGD", name: "USD / Singapore Dollar", assetClass: "FOREX", categoryLabel: "Forex Minor", basePrice: 1.3140, precision: 4, atrPct: 0.0039, yfSymbol: "USDSGD=X" },

  // ==========================================
  // 3. COMMODITIES (10 Contracts)
  // ==========================================
  { symbol: "XAU/USD", name: "Gold Spot / USD", assetClass: "COMMODITIES", categoryLabel: "Precious Metals", basePrice: 4160.0, precision: 2, atrPct: 0.0095, yfSymbol: "GC=F" },
  { symbol: "XAG/USD", name: "Silver Spot / USD", assetClass: "COMMODITIES", categoryLabel: "Precious Metals", basePrice: 48.25, precision: 2, atrPct: 0.018, yfSymbol: "SI=F" },
  { symbol: "WTI/USD", name: "WTI Crude Oil", assetClass: "COMMODITIES", categoryLabel: "Energy", basePrice: 98.4, precision: 2, atrPct: 0.017, yfSymbol: "CL=F" },
  { symbol: "BRENT/USD", name: "Brent Crude Oil", assetClass: "COMMODITIES", categoryLabel: "Energy", basePrice: 102.8, precision: 2, atrPct: 0.016, yfSymbol: "BZ=F" },
  { symbol: "NATGAS/USD", name: "Natural Gas Spot", assetClass: "COMMODITIES", categoryLabel: "Energy", basePrice: 3.42, precision: 3, atrPct: 0.029, yfSymbol: "NG=F" },
  { symbol: "XPT/USD", name: "Platinum Spot", assetClass: "COMMODITIES", categoryLabel: "Precious Metals", basePrice: 1240.0, precision: 2, atrPct: 0.014, yfSymbol: "PL=F" },
  { symbol: "XPD/USD", name: "Palladium Spot", assetClass: "COMMODITIES", categoryLabel: "Precious Metals", basePrice: 1395.0, precision: 2, atrPct: 0.022, yfSymbol: "PA=F" },
  { symbol: "HG/USD", name: "High Grade Copper", assetClass: "COMMODITIES", categoryLabel: "Industrial Metals", basePrice: 4.88, precision: 3, atrPct: 0.015, yfSymbol: "HG=F" },
  { symbol: "CORN/USD", name: "US Corn Futures", assetClass: "COMMODITIES", categoryLabel: "Agriculture", basePrice: 432.5, precision: 2, atrPct: 0.013, yfSymbol: "ZC=F" },
  { symbol: "WHEAT/USD", name: "US Wheat Futures", assetClass: "COMMODITIES", categoryLabel: "Agriculture", basePrice: 568.0, precision: 2, atrPct: 0.016, yfSymbol: "ZW=F" },

  // ==========================================
  // 4. INDEX & STOCK CFDs (20 Contracts)
  // ==========================================
  { symbol: "US500", name: "S&P 500 Index CFD", assetClass: "INDEX_STOCK", categoryLabel: "Global Index", basePrice: 7710.0, precision: 2, atrPct: 0.0085, yfSymbol: "SPY" },
  { symbol: "NAS100", name: "Nasdaq 100 Index CFD", assetClass: "INDEX_STOCK", categoryLabel: "Global Index", basePrice: 24850.0, precision: 2, atrPct: 0.0125, yfSymbol: "QQQ" },
  { symbol: "US30", name: "Dow Jones 30 CFD", assetClass: "INDEX_STOCK", categoryLabel: "Global Index", basePrice: 48900.0, precision: 1, atrPct: 0.0078, yfSymbol: "DIA" },
  { symbol: "US2000", name: "Russell 2000 CFD", assetClass: "INDEX_STOCK", categoryLabel: "Global Index", basePrice: 2680.0, precision: 2, atrPct: 0.014, yfSymbol: "IWM" },
  { symbol: "GER40", name: "DAX 40 Index CFD", assetClass: "INDEX_STOCK", categoryLabel: "Global Index", basePrice: 21450.0, precision: 1, atrPct: 0.0092, yfSymbol: "^GDAXI" },
  { symbol: "UK100", name: "FTSE 100 Index CFD", assetClass: "INDEX_STOCK", categoryLabel: "Global Index", basePrice: 9180.0, precision: 1, atrPct: 0.0075, yfSymbol: "^FTSE" },
  { symbol: "FRA40", name: "CAC 40 Index CFD", assetClass: "INDEX_STOCK", categoryLabel: "Global Index", basePrice: 8420.0, precision: 1, atrPct: 0.0088, yfSymbol: "^FCHI" },
  { symbol: "JPN225", name: "Nikkei 225 CFD", assetClass: "INDEX_STOCK", categoryLabel: "Global Index", basePrice: 44300.0, precision: 0, atrPct: 0.011, yfSymbol: "^N225" },
  { symbol: "HK50", name: "Hang Seng Index CFD", assetClass: "INDEX_STOCK", categoryLabel: "Global Index", basePrice: 23600.0, precision: 0, atrPct: 0.0145, yfSymbol: "^HSI" },
  { symbol: "AUS200", name: "ASX 200 Index CFD", assetClass: "INDEX_STOCK", categoryLabel: "Global Index", basePrice: 8940.0, precision: 1, atrPct: 0.0079, yfSymbol: "^AXJO" },
  { symbol: "NVDA", name: "NVIDIA Corp CFD", assetClass: "INDEX_STOCK", categoryLabel: "Equities", basePrice: 218.2, precision: 2, atrPct: 0.026, yfSymbol: "NVDA" },
  { symbol: "TSLA", name: "Tesla Inc CFD", assetClass: "INDEX_STOCK", categoryLabel: "Equities", basePrice: 342.8, precision: 2, atrPct: 0.031, yfSymbol: "TSLA" },
  { symbol: "AAPL", name: "Apple Inc CFD", assetClass: "INDEX_STOCK", categoryLabel: "Equities", basePrice: 268.4, precision: 2, atrPct: 0.015, yfSymbol: "AAPL" },
  { symbol: "MSFT", name: "Microsoft Corp CFD", assetClass: "INDEX_STOCK", categoryLabel: "Equities", basePrice: 512.6, precision: 2, atrPct: 0.016, yfSymbol: "MSFT" },
  { symbol: "META", name: "Meta Platforms CFD", assetClass: "INDEX_STOCK", categoryLabel: "Equities", basePrice: 685.4, precision: 2, atrPct: 0.024, yfSymbol: "META" },
  { symbol: "AMZN", name: "Amazon.com Inc CFD", assetClass: "INDEX_STOCK", categoryLabel: "Equities", basePrice: 224.5, precision: 2, atrPct: 0.021, yfSymbol: "AMZN" },
  { symbol: "AMD", name: "Advanced Micro Devices", assetClass: "INDEX_STOCK", categoryLabel: "Equities", basePrice: 174.2, precision: 2, atrPct: 0.029, yfSymbol: "AMD" },
  { symbol: "GOOGL", name: "Alphabet Inc CFD", assetClass: "INDEX_STOCK", categoryLabel: "Equities", basePrice: 198.8, precision: 2, atrPct: 0.017, yfSymbol: "GOOGL" },
  { symbol: "NFLX", name: "Netflix Inc CFD", assetClass: "INDEX_STOCK", categoryLabel: "Equities", basePrice: 864.0, precision: 2, atrPct: 0.022, yfSymbol: "NFLX" },
  { symbol: "COIN", name: "Coinbase Global CFD", assetClass: "INDEX_STOCK", categoryLabel: "Equities", basePrice: 312.5, precision: 2, atrPct: 0.038, yfSymbol: "COIN" },
];

export interface CandleBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BinarySetupPayload {
  active: boolean;
  direction: "CALL" | "PUT";
  expiry: 1 | 3 | 5;
  confidence: number;
  strike: number;
  maxEntryPrice: number;
  halfLife: number;
  setupType: string;
}

export interface SpotSetupPayload {
  active: boolean;
  direction: "LONG" | "SHORT";
  confidence: number;
  entry: number;
  limitZone: [number, number];
  sl: number;
  tp1: number;
  tp2: number;
  rr: number;
  pipsToSL: number;
  pipsToTP1: number;
  pipSize: number;
  effectiveATR: number;
  reasoning: string;
}

export interface UnifiedScannedAsset {
  symbol: string;
  name: string;
  assetClass: AssetClassCategory;
  categoryLabel: string;
  price: number;
  change24h: number;
  precision: number;
  atrPct: number;
  vwapZ: number;
  deltaZ: number;
  hurst: number;
  garmanKlassVol: number;
  // 3 Independent Setup Payloads
  binarySetup: BinarySetupPayload;
  shortSetup: SpotSetupPayload;
  longSetup: SpotSetupPayload;
  candles60?: CandleBar[];
  // Computed Signal Payloads (Single Source of Truth)
  primarySignalType: "STRONG SHORT" | "STRONG LONG" | "BINARY PUT 3M" | "BINARY CALL 1M" | "BINARY CALL 3M" | "BINARY PUT 1M" | "BINARY 5M" | "NEUTRAL";
  overallConfidence: number; // 0 - 100
  spotConfidence: number; // Single source of truth for Spot/Perp Long/Short setup (e.g. 78.2)
  binaryConfidence: number; // Single source of truth for Binary Options 1m/3m/5m setup (e.g. 93.0)
  marketRegime: "BULLISH TREND BREAKOUT" | "BEARISH TREND BREAKDOWN" | "MEAN-REVERTING" | "TRENDING" | "SQUEEZE LOCKOUT";
  // Sub-desk evaluations (backwards compatible)
  shortSignal: ReturnType<typeof import("../utils/quantMath").computeShortSignalSetup>;
  longSignal: ReturnType<typeof import("../utils/quantMath").computeLongSignalSetup>;
  binarySignal: ReturnType<typeof import("../utils/quantMath").computeBinaryOptionSetup>;
  lastUpdated: number;
}

/**
 * High-precision Currency & Rate Formatting Helper:
 * - 5-6 decimals for < $0.10
 * - 4-5 decimals for < $10 and Forex
 * - 2 decimals for >= $100
 * Omits '$' on Forex Crosses (e.g. EUR/GBP -> 0.8427, USD/JPY -> 155.34).
 */
export function formatExactPrice(
  price: number,
  asset?: { symbol?: string; assetClass?: string; precision?: number }
): string {
  if (typeof price !== "number" || isNaN(price)) return "0.00";
  const abs = Math.abs(price);
  let dec = 2;
  if (abs < 0.10) dec = 5;
  else if (abs < 1.0) dec = 4;
  else if (abs < 10.0 || asset?.assetClass === "FOREX") dec = 4;
  else if (abs < 100.0) dec = 3;
  else dec = 2;
  if (asset?.precision !== undefined) {
    dec = Math.max(dec, asset.precision);
  }
  const formatted = price.toLocaleString(undefined, {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
  return asset?.assetClass === "FOREX" ? formatted : `$${formatted}`;
}

/**
 * Currency Formatting Helper (backwards compatible):
 * Omits '$' on Forex Crosses (e.g. EUR/GBP -> 0.8427, USD/JPY -> 155.34).
 * Retains '$' for USD-denominated Crypto, Commodities, and US Equities/Indices.
 */
export function formatAssetPrice(
  price: number,
  asset: { symbol: string; assetClass?: string; precision?: number }
): string {
  return formatExactPrice(price, asset);
}
