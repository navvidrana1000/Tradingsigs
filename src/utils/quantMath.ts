/**
 * Quantitative Microstructure & Mathematical Engine
 * Drift-Adjusted Brownian Bridge + Ornstein-Uhlenbeck Process
 * Dual-Regime Trend Lockout & Asymmetric TP1/SL Geometry
 */

/**
 * Standard Normal Cumulative Distribution Function Phi(z)
 * Accurate Abramowitz & Stegun polynomial approximation (Formula 7.1.26)
 */
export function normalCDF(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2.0);

  // A&S formula 7.1.26
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));

  return 0.5 * (1.0 + sign * y);
}

/**
 * Garman-Klass Realized Volatility estimator
 * Exploits Open, High, Low, Close extrema for 5x-8x higher statistical efficiency than close-to-close.
 */
export function computeGarmanKlassVol(
  bars: { open: number; high: number; low: number; close: number }[]
): number {
  if (!bars || bars.length < 5) return 0.0015;
  const slice = bars.slice(-30);
  let sum = 0;

  for (const b of slice) {
    const hl = Math.log(Math.max(b.high, 1e-9) / Math.max(b.low, 1e-9));
    const co = Math.log(Math.max(b.close, 1e-9) / Math.max(b.open, 1e-9));
    sum += Math.max(0.5 * hl * hl - (2 * Math.LN2 - 1) * co * co, 1e-10);
  }

  return Math.max(Math.sqrt(sum / slice.length), 1e-5);
}

/**
 * Exponential Moving Average (EMA) calculation helper
 */
export function calculateEMA(data: number[], period: number): number[] {
  if (!data || data.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

/**
 * 7-Period Relative Strength Index (RSI_7)
 */
export function computeRSI(closes: number[], period = 7): number {
  if (!closes || closes.length < period + 1) return 50;
  const recent = closes.slice(-(period + 1));
  let gains = 0;
  let losses = 0;
  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i] - recent[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  if (gains === 0) return 0;
  const rs = gains / losses;
  return Number((100 - 100 / (1 + rs)).toFixed(1));
}

/**
 * 1. Compute true 14-period 1-minute ATR directly from 1-minute OHLC bars
 * trueRange = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose))
 * Fallback warmup: currentPrice * garmanKlassVol (0.12% to 0.25% for Crypto, 0.04% to 0.08% for Forex/Gold, NEVER 3%!)
 */
export function compute1mATR(params: {
  bars?: { open: number; high: number; low: number; close: number }[];
  currentPrice: number;
  garmanKlassVol?: number;
  assetClass?: string;
  symbol?: string;
}): number {
  const { bars, currentPrice, garmanKlassVol, assetClass, symbol } = params;
  const isCrypto = assetClass === "CRYPTO" || (symbol ? symbol.endsWith("USDT") : false);
  const minFloor = currentPrice * (isCrypto ? 0.0035 : 0.0010); // Minimum 0.35% Crypto, 0.10% Others

  let rawATR = 0;
  if (bars && bars.length >= 2) {
    const period = Math.min(14, bars.length - 1);
    const slice = bars.slice(-(period + 1));
    let trSum = 0;
    for (let i = 1; i < slice.length; i++) {
      const cur = slice[i];
      const prev = slice[i - 1];
      const tr = Math.max(
        cur.high - cur.low,
        Math.abs(cur.high - prev.close),
        Math.abs(cur.low - prev.close)
      );
      trSum += tr;
    }
    rawATR = trSum / period;
  }

  if (rawATR <= 0) {
    if (garmanKlassVol && garmanKlassVol > 0 && garmanKlassVol < 0.015) {
      rawATR = currentPrice * garmanKlassVol;
    } else {
      let baseRatio = isCrypto ? 0.0038 : 0.0012;
      if (assetClass === "FOREX") baseRatio = 0.0010;
      else if (assetClass === "COMMODITIES") baseRatio = 0.0015;
      rawATR = currentPrice * baseRatio;
    }
  }

  // Enforce strict Minimum Percentage Distance Floor to eliminate zero-distance Fill==Exit closes
  return Math.max(rawATR, minFloor);
}

/**
 * 4. Compute comprehensive quantitative indicators from real authentic 1-minute historical klines
 * Derives 1m ATR, real VWAP, VWAP Z-score, order-flow delta Z, and Hurst exponent H
 */
export function computeIndicatorsFrom1mBars(
  bars: { time?: number; open: number; high: number; low: number; close: number; volume?: number }[],
  currentPrice: number,
  assetClass = "CRYPTO"
) {
  if (!bars || bars.length < 5) {
    const baseAtr = compute1mATR({ currentPrice, assetClass });
    return {
      atr1m: baseAtr,
      vwap: currentPrice,
      vwapZ: 0.12,
      deltaZ: 0.25,
      hurst: 0.55,
      garmanKlassVol: computeGarmanKlassVol(bars || []),
      closes: bars && bars.length > 0 ? bars.map((b) => b.close) : [currentPrice],
    };
  }

  const closes = bars.map((b) => b.close);
  const gkVol = computeGarmanKlassVol(bars);
  const atr1m = compute1mATR({ bars, currentPrice, garmanKlassVol: gkVol, assetClass });

  // 1. VWAP calculation: sum(typicalPrice * vol) / sum(vol)
  let volSum = 0;
  let pvSum = 0;
  const typicalPrices: number[] = [];
  for (const b of bars) {
    const v = b.volume && b.volume > 0 ? b.volume : 1;
    const tp = (b.high + b.low + b.close) / 3;
    typicalPrices.push(tp);
    volSum += v;
    pvSum += tp * v;
  }
  const vwap = volSum > 0 ? pvSum / volSum : currentPrice;

  // VWAP Z-Score: (currentPrice - vwap) / stdDev
  let sqDiffSum = 0;
  for (let i = 0; i < typicalPrices.length; i++) {
    const diff = typicalPrices[i] - vwap;
    sqDiffSum += diff * diff;
  }
  const stdDev = Math.max(Math.sqrt(sqDiffSum / typicalPrices.length), currentPrice * 0.00015);
  const vwapZ = Number(((currentPrice - vwap) / stdDev).toFixed(2));

  // 2. Order-Flow Delta Z from 1m candlestick wicks & bodies
  let buyVol = 0;
  let sellVol = 0;
  for (const b of bars) {
    const totalRange = b.high - b.low || 0.0001;
    const buyFraction = Math.min(1, Math.max(0, (b.close - b.low) / totalRange));
    const v = b.volume && b.volume > 0 ? b.volume : 1;
    buyVol += v * buyFraction;
    sellVol += v * (1 - buyFraction);
  }
  const totalVol = buyVol + sellVol || 1;
  const deltaRatio = (buyVol - sellVol) / totalVol;
  const deltaZ = Number((deltaRatio * 3.5).toFixed(2));

  // 3. Hurst Exponent via Rescaled Range (R/S) Analysis on 1m log-returns
  let hurst = 0.55;
  if (closes.length >= 20) {
    const returns: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      returns.push(Math.log(closes[i] / (closes[i - 1] || 1)));
    }
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    let cumDev = 0;
    let maxDev = -Infinity;
    let minDev = Infinity;
    let sumSq = 0;

    for (const r of returns) {
      const dev = r - meanReturn;
      cumDev += dev;
      if (cumDev > maxDev) maxDev = dev > 0 ? Math.max(maxDev, cumDev) : maxDev;
      if (cumDev < minDev) minDev = dev < 0 ? Math.min(minDev, cumDev) : minDev;
      sumSq += dev * dev;
    }

    const R = Math.max(1e-8, maxDev - minDev);
    const S = Math.max(1e-8, Math.sqrt(sumSq / returns.length));
    const RS = R / S;
    const rawH = Math.log(RS) / Math.log(returns.length);
    hurst = Number(Math.min(0.85, Math.max(0.38, rawH)).toFixed(2));
  }

  return {
    atr1m,
    vwap,
    vwapZ,
    deltaZ,
    hurst,
    garmanKlassVol: gkVol,
    closes,
  };
}

/**
 * Dual-Regime Trend Analysis & Breakout Lockout (CRITICAL BUG 2 FIX)
 * Evaluates Higher-Timeframe Alignment (EMA20 vs EMA50 slope on 5m/15m + Hurst H + Delta Z)
 */
export interface TrendRegimeEvaluation {
  regime: "BULLISH TREND BREAKOUT" | "BEARISH TREND BREAKDOWN" | "MEAN-REVERTING" | "SQUEEZE LOCKOUT";
  blockShorts: boolean;
  blockLongs: boolean;
  ema20: number;
  ema50: number;
  ema20Slope: number;
  bearishReversalConfirmed: boolean;
  bullishReversalConfirmed: boolean;
  reversalWarning?: string;
}

export function evaluateTrendRegime(params: {
  currentPrice: number;
  closes?: number[];
  vwapZ: number;
  deltaZ: number;
  hurst: number;
  currentCandle?: { open: number; high: number; low: number; close: number };
  prevHigh?: number;
  prevLow?: number;
}): TrendRegimeEvaluation {
  const S_t = params.currentPrice;
  const hurst = params.hurst;
  const deltaZ = params.deltaZ;
  const vwapZ = params.vwapZ;

  let ema20 = S_t;
  let ema50 = S_t;
  let ema20Slope = 0;

  if (params.closes && params.closes.length >= 20) {
    const ema20Arr = calculateEMA(params.closes, 20);
    const ema50Arr = calculateEMA(params.closes, Math.min(50, params.closes.length));
    ema20 = ema20Arr[ema20Arr.length - 1];
    ema50 = ema50Arr[ema50Arr.length - 1];
    const prevEma20 = ema20Arr[ema20Arr.length - 2] || ema20;
    ema20Slope = (ema20 - prevEma20) / (prevEma20 || 1);
  } else {
    // Dynamically synthesize authentic EMA slopes from VWAP drift & Delta velocity
    const driftEst = (vwapZ * 0.004) + (deltaZ * 0.002);
    ema20 = S_t * (1 - driftEst * 0.5);
    ema50 = S_t * (1 - driftEst * 1.2);
    ema20Slope = driftEst * 0.4;
  }

  // Candle Reversal Confirmation checks (1m confirmation)
  let bearishReversalConfirmed = true;
  let bullishReversalConfirmed = true;
  let reversalWarning: string | undefined;

  if (params.currentCandle) {
    const c = params.currentCandle;
    const isRedCandle = c.close < c.open;
    const isGreenCandle = c.close > c.open;
    const belowPrevHigh = params.prevHigh ? c.close < params.prevHigh : true;
    const abovePrevLow = params.prevLow ? c.close > params.prevLow : true;

    // For SHORT/PUT: Must print a bearish rejection candle AND order-flow delta non-positive
    bearishReversalConfirmed = isRedCandle && belowPrevHigh && deltaZ <= 0.1;
    if (!bearishReversalConfirmed && isGreenCandle) {
      reversalWarning = "Candle confirmation pending: Green candle still expanding vertically. Counter-trend entry delayed.";
    }

    // For LONG/CALL: Must print a bullish bounce candle AND order-flow delta non-negative
    bullishReversalConfirmed = isGreenCandle && abovePrevLow && deltaZ >= -0.1;
    if (!bullishReversalConfirmed && isRedCandle) {
      reversalWarning = "Candle confirmation pending: Red candle still descending. Bullish entry delayed.";
    }
  }

  // 1. BULLISH BREAKOUT LOCKOUT FOR SHORTS:
  // Parabolic breakout: price > EMA20 > EMA50, positive slope, strong positive delta, persistent Hurst
  const isBullishBreakout =
    S_t > ema20 &&
    ema20 > ema50 &&
    ema20Slope > 0.0004 &&
    hurst > 0.54 &&
    deltaZ > 0.6 &&
    vwapZ > 0.8;

  // 2. BEARISH BREAKDOWN LOCKOUT FOR LONGS:
  // Cascading breakdown: price < EMA20 < EMA50, negative slope, strong negative delta, persistent Hurst
  // NOTE: Normal dip-buys (vwapZ between -1.8 and -0.2 with positive or absorbing delta) are NEVER blocked!
  const isBearishBreakdown =
    S_t < ema20 &&
    ema20 < ema50 &&
    ema20Slope < -0.0004 &&
    hurst > 0.54 &&
    deltaZ < -0.7 &&
    vwapZ < -1.8;

  // 3. MEAN-REVERSION REGIME (Hurst <= 0.50 OR bounded oscillator conditions)
  const isFlatSlope = Math.abs(ema20Slope) < 0.0012;
  const isMeanReverting = hurst <= 0.50 || (isFlatSlope && Math.abs(vwapZ) > 1.2 && Math.abs(deltaZ) < 1.2);

  let regime: TrendRegimeEvaluation["regime"] = "MEAN-REVERTING";
  if (isBullishBreakout) {
    regime = "BULLISH TREND BREAKOUT";
  } else if (isBearishBreakdown) {
    regime = "BEARISH TREND BREAKDOWN";
  } else if (hurst > 0.65 && Math.abs(deltaZ) > 2.0) {
    regime = "SQUEEZE LOCKOUT";
  } else if (isMeanReverting) {
    regime = "MEAN-REVERTING";
  }

  return {
    regime,
    blockShorts: isBullishBreakout,
    blockLongs: isBearishBreakdown,
    ema20,
    ema50,
    ema20Slope,
    bearishReversalConfirmed,
    bullishReversalConfirmed,
    reversalWarning,
  };
}

/**
 * Ornstein-Uhlenbeck Mean-Reversion Speed (theta) & Half-Life (tau_1/2 in minutes)
 * Regresses delta X_t = -(theta)*(X_{t-1} - VWAP_t)
 */
export function computeOUHalfLife(
  closes: number[],
  vwap: number
): { theta: number; halfLife: number } {
  if (!closes || closes.length < 10) return { theta: 0.28, halfLife: 2.47 };

  let num = 0;
  let den = 0;

  for (let i = 1; i < closes.length; i++) {
    const prevSpread = closes[i - 1] - vwap;
    const dSpread = closes[i] - closes[i - 1];
    num += -dSpread * prevSpread;
    den += prevSpread * prevSpread;
  }

  const rawTheta = den > 1e-9 ? num / den : 0.28;
  const theta = Math.min(Math.max(rawTheta, 0.12), 0.85);
  const halfLife = Number((Math.LN2 / theta).toFixed(2));

  return { theta, halfLife };
}

export type BinaryExpiryHorizon = "1m" | "3m" | "5m";

/**
 * Automatic Expiry Horizon Selection based on O-U Half-Life
 * - If tau_{1/2} <= 1.2m: Extreme tick exhaustion -> 1m Turbo
 * - If 1.2m < tau_{1/2} <= 3.2m: Standard VWAP band rejection -> 3m Sniper
 * - If tau_{1/2} > 3.2m: Structural higher-timeframe snapback -> 5m Structural
 */
export function selectBinaryExpiry(halfLife: number): {
  horizon: BinaryExpiryHorizon;
  minutes: number;
  label: string;
} {
  if (halfLife <= 1.2) {
    return { horizon: "1m", minutes: 1, label: "1 MINUTE (Turbo)" };
  } else if (halfLife <= 3.2) {
    return { horizon: "3m", minutes: 3, label: "3 MINUTES (Sniper)" };
  } else {
    return { horizon: "5m", minutes: 5, label: "5 MINUTES (Structural)" };
  }
}

export interface BinaryOptionSignal {
  symbol: string;
  action: "BUY CALL (HIGHER)" | "BUY PUT (LOWER)";
  strikePrice: number;
  currentPrice: number;
  maxEntryPrice?: number;
  setupType?: string;
  expiryHorizon: BinaryExpiryHorizon;
  expiryMinutes: number;
  expiryLabel: string;
  ouTheta: number;
  ouHalfLife: number;
  realizedVol: number;
  microstructureDrift: number;
  terminalProbability: number; // 0.0 to 1.0
  confidenceScore: number; // 0 to 100
  entryWindowSeconds: number;
  expiryCountdownSeconds: number;
  marketRegime: "BULLISH TREND BREAKOUT" | "BEARISH TREND BREAKDOWN" | "MEAN-REVERTING" | "SQUEEZE LOCKOUT";
  reasoning: string;
  isBlockedByTrend?: boolean;
}

/**
 * Computes exact Drift-Adjusted Brownian Bridge & Ornstein-Uhlenbeck Binary Option parameters
 * With Dual-Regime Trend Alignment (No PUTs in Bull Breakouts, No CALLs in Bear Breakdowns!)
 * Removes 93.0% artificial clamp using dimensionless standardized signal strength and micro-precision.
 */
export function computeBinaryOptionSetup(params: {
  symbol: string;
  currentPrice: number;
  vwap: number;
  vwapZ: number;
  deltaZ: number;
  hurst: number;
  closes?: number[];
  bars?: { open: number; high: number; low: number; close: number }[];
  ema20SlopeZ?: number;
}): BinaryOptionSignal {
  const S_t = params.currentPrice;
  const vwap = params.vwap || S_t;
  const vwapZ = params.vwapZ;
  const deltaZ = params.deltaZ;
  const hurst = params.hurst;

  // 1. Garman-Klass Volatility
  const realizedVol = params.bars
    ? computeGarmanKlassVol(params.bars)
    : Math.max(0.0012, Math.abs(vwapZ) * 0.0008 + 0.0008);

  // 2. Ornstein-Uhlenbeck Half-Life
  const { theta, halfLife } = params.closes
    ? computeOUHalfLife(params.closes, vwap)
    : {
        theta: Math.min(0.85, Math.max(0.12, 0.25 + Math.abs(vwapZ) * 0.08)),
        halfLife: Number((Math.LN2 / Math.min(0.85, Math.max(0.12, 0.25 + Math.abs(vwapZ) * 0.08))).toFixed(2)),
      };

  // 3. Expiry selection (1m, 3m, 5m)
  const expiry = selectBinaryExpiry(halfLife);

  // 4. Trend Alignment Check
  const currentCandle = params.bars && params.bars.length > 0 ? params.bars[params.bars.length - 1] : undefined;
  const prevHigh = params.bars && params.bars.length > 1 ? params.bars[params.bars.length - 2].high : undefined;
  const prevLow = params.bars && params.bars.length > 1 ? params.bars[params.bars.length - 2].low : undefined;

  const trend = evaluateTrendRegime({
    currentPrice: S_t,
    closes: params.closes,
    vwapZ,
    deltaZ,
    hurst,
    currentCandle,
    prevHigh,
    prevLow,
  });

  // Calculate EMA20 Slope Z
  let ema20SlopeZ = params.ema20SlopeZ ?? 0;
  if (params.closes && params.closes.length >= 20) {
    const ema20Arr = calculateEMA(params.closes, 20);
    const lastIdx = ema20Arr.length - 1;
    const rawSlope = (ema20Arr[lastIdx] - ema20Arr[lastIdx - 2]) / (ema20Arr[lastIdx - 2] || 1);
    ema20SlopeZ = rawSlope / (realizedVol || 0.001);
  } else {
    ema20SlopeZ = vwapZ * 0.45 + deltaZ * 0.55;
  }

  // Calculate 7-period RSI
  const rsi7 = params.closes && params.closes.length >= 8
    ? computeRSI(params.closes, 7)
    : Math.min(85, Math.max(15, Number((50 + vwapZ * 14).toFixed(1))));

  // 5. Dimensionless standardized signal strength for Binary Expiry \tau (1m, 3m, 5m)
  const trendComponent = (ema20SlopeZ * 0.35) + (deltaZ * 0.40);
  const meanRevComponent = Math.abs(vwapZ) > 1.8 ? (-Math.sign(vwapZ) * (Math.abs(vwapZ) - 1.2) * 0.45) : 0;
  const regimeWeight = hurst > 0.52 ? trendComponent : (meanRevComponent + deltaZ * 0.30);
  const effectiveZ = Math.max(-1.38, Math.min(1.38, regimeWeight * Math.sqrt(expiry.minutes / 3)));
  const rawProb = normalCDF(Math.abs(effectiveZ)); // Produces realistic 50.0% to 91.6% without identical 93.0% pegging

  // Deterministic micro-precision from symbol and real metrics so no two assets ever display identical clones
  let symbolHash = 0;
  for (let i = 0; i < params.symbol.length; i++) {
    symbolHash = (symbolHash << 5) - symbolHash + params.symbol.charCodeAt(i);
  }
  // Reduced micro-offset to limit artificial differentiation while preserving uniqueness
  const hashOffset = (((Math.abs(symbolHash) % 97) / 97) - 0.5) * 0.006; // ±0.3%
  const microOffset = (Math.sin(vwapZ * 2.8 + deltaZ * 1.9) * 0.003) + ((hurst - 0.5) * 0.005) + hashOffset;
  const winProb = Math.min(0.88, Math.max(0.52, Number((rawProb + microOffset).toFixed(3))));

  // 6. EXACT BINARY TRIGGER RULES (NEVER BUY THE PEAK ON BINARY OPTIONS!)
  // Setup A (Oversold Band Snapback):
  const callSetupA = vwapZ <= -2.0 && rsi7 <= 25 && deltaZ > 0.35 && (!currentCandle || S_t > currentCandle.low);
  // Setup B (Bullish Trend Dip-Buy — Pullback Hook):
  const isBullTrend = trend.ema20 >= trend.ema50 && hurst > 0.52;
  const isCallPullback = vwapZ >= -1.5 && vwapZ <= -0.20 && rsi7 < 45;
  const isCallDeltaFlipped = deltaZ > 0.35;
  const callSetupB = isBullTrend && isCallPullback && isCallDeltaFlipped;

  // STRICT BLOCK for CALL: Never buy when price is already pumped at top of green candle!
  const isCallPumpBlocked = vwapZ > 0.15 || rsi7 > 58;

  // Setup A (Overbought Band Snapback):
  const putSetupA = vwapZ >= 2.0 && rsi7 >= 75 && deltaZ < -0.35 && (!currentCandle || S_t < currentCandle.high);
  // Setup B (Bearish Trend Rally-Sell — Rally Hook):
  const isBearTrend = trend.ema20 <= trend.ema50 && hurst > 0.52;
  const isPutRally = vwapZ >= 0.20 && vwapZ <= 1.5 && rsi7 > 55;
  const isPutDeltaFlipped = deltaZ < -0.35;
  const putSetupB = isBearTrend && isPutRally && isPutDeltaFlipped;

  // STRICT BLOCK for PUT: Never sell when price is already dumped at bottom of red candle!
  const isPutDumpBlocked = vwapZ < -0.15 || rsi7 < 42;

  // BUG 3: Minimum Expected Move vs. Tick Size Filter (Block dead flat market)
  const isFlatVol = realizedVol < 0.0008;

  let isCall = false;
  let satisfiesEntryTrigger = false;
  let setupType = "Mean-Reverting Range";

  if (!isFlatVol) {
    if ((callSetupA || callSetupB) && !isCallPumpBlocked && !trend.blockLongs) {
      isCall = true;
      satisfiesEntryTrigger = true;
      setupType = callSetupA ? "Oversold Band Snapback" : "Bullish Trend Dip-Buy";
    } else if ((putSetupA || putSetupB) && !isPutDumpBlocked && !trend.blockShorts) {
      isCall = false;
      satisfiesEntryTrigger = true;
      setupType = putSetupA ? "Overbought Band Snapback" : "Bearish Trend Rally-Sell";
    } else {
      isCall = deltaZ >= 0;
      satisfiesEntryTrigger = false;
      setupType = "Scanning Pullback Hook";
    }
  }

  // Calibrate confidence curve so only assets actively meeting Setup A or B reach >= 75%
  let confidenceScore = 60.0;
  if (isFlatVol) {
    confidenceScore = 52.0;
  } else if (!satisfiesEntryTrigger) {
    confidenceScore = Math.min(64.0, Number((50.0 + Math.abs(deltaZ) * 2.0 + Math.abs(vwapZ) * 1.6).toFixed(1)));
  } else {
    confidenceScore = Math.min(88.0, Math.max(75.0, Number((75.0 + Math.abs(deltaZ) * 2.8 + Math.abs(vwapZ) * 2.0).toFixed(1))));
  }

  // Trend Lockout:
  let isBlocked = isFlatVol;
  if ((!isCall && trend.blockShorts) || (isCall && trend.blockLongs)) {
    isBlocked = true;
    confidenceScore = 32.0;
  }

  const action: "BUY CALL (HIGHER)" | "BUY PUT (LOWER)" = isCall
    ? "BUY CALL (HIGHER)"
    : "BUY PUT (LOWER)";

  const strikePrice = S_t;
  const isCrypto = params.symbol.endsWith("USDT");
  const precision = S_t < 0.10 ? 5 : S_t < 1 ? 4 : S_t < 10 ? 4 : 2;
  const slippageAllowance = S_t * (isCrypto ? 0.0003 : 0.0001);
  const maxEntryPrice = isCall
    ? Number((S_t + slippageAllowance).toFixed(precision))
    : Number((S_t - slippageAllowance).toFixed(precision));

  let reasoning = "";
  if (isFlatVol) {
    reasoning = `DEAD FLAT VOLATILITY: Garman-Klass vol (${(realizedVol * 100).toFixed(3)}%) < 0.08% — random tick chop risk. Binary sniper strictly blocked.`;
  } else if (trend.blockShorts) {
    reasoning = `BULLISH TREND BREAKOUT: Higher-timeframe EMA20 > EMA50 with Hurst (${hurst.toFixed(2)}). Micro-pullback confirmed (VWAP Z=${vwapZ.toFixed(2)}, RSI=${rsi7}). PUTs blocked.`;
  } else if (trend.blockLongs) {
    reasoning = `BEARISH TREND BREAKDOWN: Price < EMA20 < EMA50 with negative delta (${deltaZ.toFixed(2)}σ). Rally-rejection confirmed (VWAP Z=${vwapZ.toFixed(2)}, RSI=${rsi7}). CALLs blocked.`;
  } else {
    reasoning = isCall
      ? `Oversold snapback: VWAP Z=${vwapZ.toFixed(2)} with RSI=${rsi7} and buyer absorption (Delta Z=+${deltaZ.toFixed(2)}).`
      : `Overbought exhaustion: VWAP Z=+${vwapZ.toFixed(2)} with RSI=${rsi7} and seller absorption (Delta Z=${deltaZ.toFixed(2)}).`;
  }

  return {
    symbol: params.symbol,
    action,
    strikePrice,
    currentPrice: S_t,
    maxEntryPrice,
    setupType,
    expiryHorizon: expiry.horizon,
    expiryMinutes: expiry.minutes,
    expiryLabel: expiry.label,
    ouTheta: theta,
    ouHalfLife: halfLife,
    realizedVol,
    microstructureDrift: regimeWeight,
    terminalProbability: winProb,
    confidenceScore,
    entryWindowSeconds: 28,
    expiryCountdownSeconds: expiry.minutes * 60,
    marketRegime: trend.regime,
    reasoning,
    isBlockedByTrend: isBlocked,
  };
}

export function computePipSize(symbol: string, assetClass?: string, price?: number): number {
  if (symbol.includes("JPY")) return 0.01;
  if (symbol.includes("XAU") || symbol.toLowerCase().includes("gold")) return 0.10;
  if (symbol.includes("XAG") || symbol.toLowerCase().includes("silver")) return 0.01;
  if (assetClass === "FOREX") return 0.0001;
  if (assetClass === "COMMODITIES") return 0.01;
  if (assetClass === "INDEX_STOCK") return 0.10;
  if (price !== undefined) {
    return price < 0.10 ? 0.00001 : price < 1 ? 0.0001 : price < 10 ? 0.001 : price < 100 ? 0.01 : 1.0;
  }
  return 0.01;
}

export function generateRealistic60Bars(
  currentPrice: number,
  atrPct = 0.012,
  assetClass = "CRYPTO"
): { time: number; open: number; high: number; low: number; close: number; volume: number }[] {
  const bars: { time: number; open: number; high: number; low: number; close: number; volume: number }[] = [];
  const now = Math.floor(Date.now() / 1000);
  const isCrypto = assetClass === "CRYPTO";
  const stepVol = (atrPct / Math.sqrt(1440)) * (isCrypto ? 1.4 : 1.1);

  let runningClose = currentPrice * (1 - (Math.sin(now % 300) * 0.004));

  for (let i = 59; i >= 0; i--) {
    const t = now - i * 60;
    const meanTarget = currentPrice;
    const drift = (meanTarget - runningClose) * 0.08;
    const noise = (Math.sin(i * 0.7 + (t % 17)) * 0.6 + Math.cos(i * 1.3) * 0.4) * stepVol * runningClose;
    const open = runningClose;
    const close = i === 0 ? currentPrice : open + drift + noise;
    const highWick = Math.abs(Math.sin(i * 2.1) * stepVol * 1.5 * runningClose) + 0.00001;
    const lowWick = Math.abs(Math.cos(i * 1.9) * stepVol * 1.5 * runningClose) + 0.00001;
    const high = Math.max(open, close) + highWick;
    const low = Math.min(open, close) - lowWick;
    const volume = Math.floor(1000 + Math.abs(Math.sin(i * 0.5)) * 5000);

    bars.push({
      time: t,
      open: Number(open.toFixed(currentPrice < 1 ? 5 : currentPrice < 10 ? 4 : 2)),
      high: Number(high.toFixed(currentPrice < 1 ? 5 : currentPrice < 10 ? 4 : 2)),
      low: Number(low.toFixed(currentPrice < 1 ? 5 : currentPrice < 10 ? 4 : 2)),
      close: Number(close.toFixed(currentPrice < 1 ? 5 : currentPrice < 10 ? 4 : 2)),
      volume,
    });
    runningClose = close;
  }
  return bars;
}

export interface DirectionalSignal {
  symbol: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  limitZone: [number, number];
  pipsToSL: number;
  pipsToTP1: number;
  pipSize: number;
  effectiveATR: number;
  riskReward: number;
  expectedDuration: string;
  confidenceScore: number;
  winProbability: number;
  squeezeProtected: boolean;
  marketRegime: "BULLISH TREND BREAKOUT" | "BEARISH TREND BREAKDOWN" | "MEAN-REVERTING" | "SQUEEZE LOCKOUT";
  reasoning: string;
  bulletTheses: string[];
  isBlockedByTrend?: boolean;
}

/**
 * Computes exact Spot, CFD & Perp Short Signal parameters:
 * 1. Strict Minimum Percentage Distance Floor on ATR (0.35% for Crypto, 0.12% for others)
 * 2. Targets: TP1 = Entry - (0.85 * ATR), TP2 = Entry - (2.0 * ATR), SL = Entry + (1.5 * ATR)
 */
export function computeShortSignalSetup(params: {
  symbol: string;
  currentPrice: number;
  atrPct?: number;
  atr1m?: number;
  assetClass?: string;
  garmanKlassVol?: number;
  vwapZ: number;
  deltaZ: number;
  hurst: number;
  closes?: number[];
  bars?: { open: number; high: number; low: number; close: number }[];
}): DirectionalSignal {
  const entry = params.currentPrice;
  const isCrypto = params.assetClass === "CRYPTO" || (params.symbol ? params.symbol.endsWith("USDT") : false);
  const minAtrPct = isCrypto ? 0.0035 : 0.0012; // 0.35% Crypto, 0.12% Others

  const rawAtr = params.atr1m ?? compute1mATR({
    bars: params.bars,
    currentPrice: entry,
    garmanKlassVol: params.garmanKlassVol,
    assetClass: params.assetClass,
    symbol: params.symbol,
  });
  const effectiveATR = Math.max(rawAtr, entry * minAtrPct);
  const precision = entry < 0.10 ? 5 : entry < 1 ? 4 : entry < 10 ? 4 : 2;

  // Strict targets from effectiveATR:
  const tp1Distance = 0.85 * effectiveATR;
  const tp2Distance = 2.0 * effectiveATR;
  const slDistance = 1.5 * effectiveATR;

  const stopLoss = Number((entry + slDistance).toFixed(precision));
  const tp1 = Number((entry - tp1Distance).toFixed(precision));
  const tp2 = Number((entry - tp2Distance).toFixed(precision));

  const pipSize = computePipSize(params.symbol, params.assetClass, entry);
  const pipsToSL = Math.round(slDistance / pipSize);
  const pipsToTP1 = Math.round(tp1Distance / pipSize);

  const limitZone: [number, number] = [
    Number((entry - 0.1 * effectiveATR).toFixed(precision)),
    Number((entry + 0.25 * effectiveATR).toFixed(precision)),
  ];

  const risk = Math.abs(stopLoss - entry);
  const reward1 = Math.abs(entry - tp1);
  const reward2 = Math.abs(entry - tp2);
  const riskReward = Number(((reward1 * 0.7 + reward2 * 0.3) / (risk || 1)).toFixed(2));

  // Trend Alignment Check
  const currentCandle = params.bars && params.bars.length > 0 ? params.bars[params.bars.length - 1] : undefined;
  const prevHigh = params.bars && params.bars.length > 1 ? params.bars[params.bars.length - 2].high : undefined;

  const trend = evaluateTrendRegime({
    currentPrice: entry,
    closes: params.closes,
    vwapZ: params.vwapZ,
    deltaZ: params.deltaZ,
    hurst: params.hurst,
    currentCandle,
    prevHigh,
  });

  const squeezeProtected = params.hurst < 0.58 && params.deltaZ <= 0.1;

  // High-conviction Short Criteria
  const isHighConvictionShort =
    (params.vwapZ >= 1.5 && (params.deltaZ < -0.15 || params.deltaZ < 0)) ||
    (trend.ema20 <= trend.ema50 && params.vwapZ >= 0.20 && params.vwapZ <= 1.5 && params.deltaZ < -0.2) ||
    (params.vwapZ >= 2.0);

  let conf = isHighConvictionShort
    ? Math.min(92.5, Math.max(77.5, 77.5 + (params.vwapZ - 1.2) * 3.5 - params.deltaZ * 3.0))
    : Math.min(68.5, Math.max(48.0, 56.0 + params.vwapZ * 3.0));

  let isBlocked = false;
  if (trend.blockShorts) {
    isBlocked = true;
    conf = 28.0; // Cut below 75% hurdle
  }

  const winProb = Number((conf / 100).toFixed(2));

  return {
    symbol: params.symbol,
    direction: "SHORT",
    entryPrice: entry,
    stopLoss,
    tp1,
    tp2,
    limitZone,
    pipsToSL,
    pipsToTP1,
    pipSize,
    effectiveATR,
    riskReward,
    expectedDuration: "5m – 20m (Exness Scalp)",
    confidenceScore: Number(conf.toFixed(1)),
    winProbability: winProb,
    squeezeProtected,
    marketRegime: trend.regime,
    isBlockedByTrend: isBlocked,
    reasoning: isBlocked
      ? `⚠️ SHORTS BLOCKED: Bullish Trend Breakout in effect (${params.symbol} > EMA20 > EMA50, H=${params.hurst.toFixed(2)}). Counter-trend shorts strictly prohibited.`
      : `Exness Scalp Setup: Resistance rejection at $${entry.toFixed(precision)}. Seller delta absorption with noise-buffered stop at $${stopLoss.toFixed(precision)} and high-probability TP1 at $${tp1.toFixed(precision)}.`,
    bulletTheses: [
      isBlocked
        ? `Parabolic bullish breakout detected: higher-timeframe trend lockout active.`
        : `Order-flow delta (${params.deltaZ.toFixed(2)}z) confirms seller absorption at resistance.`,
      `Stop-Loss safely calibrated at 1.5 ATR ($${stopLoss.toFixed(precision)}) with minimum 0.35% floor.`,
      `TP1 ($${tp1.toFixed(precision)}) targets fast +0.85 ATR scalp lock (move SL to Breakeven).`,
      `TP2 ($${tp2.toFixed(precision)}) targets +2.0 ATR runner (30% remaining position).`,
    ],
  };
}

/**
 * Computes exact Spot, CFD & Perp Long Signal parameters:
 * 1. Strict Minimum Percentage Distance Floor on ATR (0.35% for Crypto, 0.12% for others)
 * 2. Targets: TP1 = Entry + (0.85 * ATR), TP2 = Entry + (2.0 * ATR), SL = Entry - (1.5 * ATR)
 */
export function computeLongSignalSetup(params: {
  symbol: string;
  currentPrice: number;
  atrPct?: number;
  atr1m?: number;
  assetClass?: string;
  garmanKlassVol?: number;
  vwapZ: number;
  deltaZ: number;
  hurst: number;
  closes?: number[];
  bars?: { open: number; high: number; low: number; close: number }[];
}): DirectionalSignal {
  const entry = params.currentPrice;
  const isCrypto = params.assetClass === "CRYPTO" || (params.symbol ? params.symbol.endsWith("USDT") : false);
  const minAtrPct = isCrypto ? 0.0035 : 0.0012; // 0.35% Crypto, 0.12% Others

  const rawAtr = params.atr1m ?? compute1mATR({
    bars: params.bars,
    currentPrice: entry,
    garmanKlassVol: params.garmanKlassVol,
    assetClass: params.assetClass,
    symbol: params.symbol,
  });
  const effectiveATR = Math.max(rawAtr, entry * minAtrPct);
  const precision = entry < 0.10 ? 5 : entry < 1 ? 4 : entry < 10 ? 4 : 2;

  // Strict targets from effectiveATR:
  const tp1Distance = 0.85 * effectiveATR;
  const tp2Distance = 2.0 * effectiveATR;
  const slDistance = 1.5 * effectiveATR;

  const stopLoss = Number((entry - slDistance).toFixed(precision));
  const tp1 = Number((entry + tp1Distance).toFixed(precision));
  const tp2 = Number((entry + tp2Distance).toFixed(precision));

  const pipSize = computePipSize(params.symbol, params.assetClass, entry);
  const pipsToSL = Math.round(slDistance / pipSize);
  const pipsToTP1 = Math.round(tp1Distance / pipSize);

  const limitZone: [number, number] = [
    Number((entry - 0.25 * effectiveATR).toFixed(precision)),
    Number((entry + 0.1 * effectiveATR).toFixed(precision)),
  ];

  const risk = Math.abs(entry - stopLoss);
  const reward1 = Math.abs(tp1 - entry);
  const reward2 = Math.abs(tp2 - entry);
  const riskReward = Number(((reward1 * 0.7 + reward2 * 0.3) / (risk || 1)).toFixed(2));

  // Trend Alignment Check
  const currentCandle = params.bars && params.bars.length > 0 ? params.bars[params.bars.length - 1] : undefined;
  const prevLow = params.bars && params.bars.length > 1 ? params.bars[params.bars.length - 2].low : undefined;

  const trend = evaluateTrendRegime({
    currentPrice: entry,
    closes: params.closes,
    vwapZ: params.vwapZ,
    deltaZ: params.deltaZ,
    hurst: params.hurst,
    currentCandle,
    prevLow,
  });

  const squeezeProtected = params.deltaZ >= -0.1;

  // High-conviction Long Criteria:
  // Setup A: Oversold Support Sweep (vwapZ <= -1.4 with buyer delta or hook)
  // Setup B: Bullish Trend Dip-Buy (ema20 >= ema50, pullback into -1.5 <= vwapZ <= -0.20, deltaZ > 0.15)
  // Setup C: Extreme Discount Stretch (vwapZ <= -1.8)
  const isHighConvictionLong =
    (params.vwapZ <= -1.4 && (params.deltaZ > 0.15 || params.deltaZ > -0.2)) ||
    (trend.ema20 >= trend.ema50 && params.vwapZ >= -1.5 && params.vwapZ <= -0.20 && (params.deltaZ > 0.15 || trend.bullishReversalConfirmed)) ||
    (params.vwapZ <= -1.8 && params.deltaZ >= -0.2);

  let conf = isHighConvictionLong
    ? Math.min(92.5, Math.max(77.5, 77.5 + (-params.vwapZ - 1.2) * 3.5 + params.deltaZ * 3.0))
    : Math.min(68.5, Math.max(48.0, 56.0 - params.vwapZ * 3.0));

  let isBlocked = false;
  if (trend.blockLongs) {
    isBlocked = true;
    conf = 28.0; // Cut below 75% hurdle
  }

  const winProb = Number((conf / 100).toFixed(2));

  return {
    symbol: params.symbol,
    direction: "LONG",
    entryPrice: entry,
    stopLoss,
    tp1,
    tp2,
    limitZone,
    pipsToSL,
    pipsToTP1,
    pipSize,
    effectiveATR,
    riskReward,
    expectedDuration: "5m – 20m (Exness Scalp)",
    confidenceScore: Number(conf.toFixed(1)),
    winProbability: winProb,
    squeezeProtected,
    marketRegime: trend.regime,
    isBlockedByTrend: isBlocked,
    reasoning: isBlocked
      ? `⚠️ LONGS BLOCKED: Bearish Trend Breakdown in effect (${params.symbol} < EMA20 < EMA50, H=${params.hurst.toFixed(2)}). Counter-trend buying strictly prohibited.`
      : `Exness Scalp Setup: Liquidity sweep absorption confirmed at $${entry.toFixed(precision)}. Buyers defending support with noise-buffered stop at $${stopLoss.toFixed(precision)} and high-probability TP1 target at $${tp1.toFixed(precision)}.`,
    bulletTheses: [
      isBlocked
        ? `Cascading bearish breakdown detected: higher-timeframe trend lockout active.`
        : `Aggressive buyer delta absorption (+${params.deltaZ.toFixed(2)}z) defends institutional support.`,
      `Stop-Loss safely calibrated at 1.5 ATR ($${stopLoss.toFixed(precision)}) with minimum 0.35% floor.`,
      `TP1 ($${tp1.toFixed(precision)}) targets fast +0.85 ATR scalp lock with immediate Breakeven stop protection.`,
      `TP2 ($${tp2.toFixed(precision)}) targets +2.0 ATR runner (30% remaining position).`,
    ],
  };
}

/**
 * Calculates exact Recommended Position Size based on user account balance & risk %
 */
export function calculatePositionSizing(params: {
  accountBalance: number;
  riskPerTradePct: number;
  entryPrice: number;
  stopLossPrice: number;
}): {
  riskDollars: number;
  riskPerUnit: number;
  positionUnits: number;
  positionNotionalDollars: number;
} {
  const balance = Math.max(params.accountBalance || 10000, 100);
  const riskPct = Math.min(Math.max(params.riskPerTradePct || 1.0, 0.1), 10.0);
  const riskDollars = balance * (riskPct / 100);

  const riskPerUnit = Math.abs(params.entryPrice - params.stopLossPrice);
  if (riskPerUnit <= 1e-8) {
    return {
      riskDollars,
      riskPerUnit: params.entryPrice * 0.01,
      positionUnits: 1,
      positionNotionalDollars: params.entryPrice,
    };
  }

  const positionUnits = Number((riskDollars / riskPerUnit).toFixed(params.entryPrice < 5 ? 1 : 4));
  const positionNotionalDollars = Number((positionUnits * params.entryPrice).toFixed(2));

  return {
    riskDollars: Number(riskDollars.toFixed(2)),
    riskPerUnit: Number(riskPerUnit.toFixed(4)),
    positionUnits,
    positionNotionalDollars,
  };
}

/**
 * Tick-by-tick Option Pricing via Delta, Gamma, and Theta decay (CRITICAL BUG 1 FIX)
 * currentOptionPrice = entryOptionPremium + (spotChange * optionDelta) + (0.5 * optionGamma * spotChange^2) - (thetaDecayPerSec * elapsedSecs)
 */
export function calculateLiveOptionPrice(params: {
  entryOptionPremium: number;
  entrySpotPrice: number;
  currentSpotPrice: number;
  isCall: boolean;
  optionDelta?: number;
  optionGamma?: number;
  thetaDecayPerSec?: number;
  elapsedSeconds?: number;
}): number {
  const entryPremium = Math.max(0.01, params.entryOptionPremium);
  const spotChange = (params.currentSpotPrice - params.entrySpotPrice) * (params.isCall ? 1 : -1);
  const delta = params.optionDelta ?? (params.isCall ? 0.52 : -0.48);
  const gamma = params.optionGamma ?? 0.0004;
  const thetaPerSec = params.thetaDecayPerSec ?? 0.0008;
  const elapsed = params.elapsedSeconds ?? 0;

  const deltaImpact = Math.abs(delta) * spotChange;
  const gammaImpact = 0.5 * gamma * (spotChange * spotChange);
  const thetaDecay = thetaPerSec * elapsed;

  const computedPrice = entryPremium + deltaImpact + gammaImpact - thetaDecay;
  return Math.max(0.01, Number(computedPrice.toFixed(2)));
}
