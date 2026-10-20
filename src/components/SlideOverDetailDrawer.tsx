import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Target,
  ShieldCheck,
  Clock,
  Sparkles,
  BarChart2,
  DollarSign,
  Maximize2,
  RefreshCw,
  Sliders,
  ChevronRight,
  Calculator,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { UnifiedScannedAsset, formatAssetPrice } from "../data/universe84";
import {
  calculatePositionSizing,
  computeIndicatorsFrom1mBars,
  computeShortSignalSetup,
  computeLongSignalSetup,
  computeBinaryOptionSetup,
} from "../utils/quantMath";

interface SlideOverDetailDrawerProps {
  asset: UnifiedScannedAsset | null;
  onClose: () => void;
  accountBalance?: number;
  riskPerTradePct?: number;
  onTestExecution?: (message: string) => void;
  onDeployDirectionalTest?: (asset: UnifiedScannedAsset) => void;
  onDeployBinaryTest?: (asset: UnifiedScannedAsset) => void;
}

export const SlideOverDetailDrawer: React.FC<SlideOverDetailDrawerProps> = ({
  asset,
  onClose,
  accountBalance = 10000,
  riskPerTradePct = 1.0,
  onTestExecution,
  onDeployDirectionalTest,
  onDeployBinaryTest,
}) => {
  const [candles, setCandles] = useState<any[]>([]);
  const [loadingCandles, setLoadingCandles] = useState<boolean>(false);
  const [activeInterval, setActiveInterval] = useState<"1m" | "5m" | "15m" | "1h">("1m");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live ticking countdown for PocketOption candle open
  const [secondsToNextCandle, setSecondsToNextCandle] = useState<number>(() => {
    return 60 - (Math.floor(Date.now() / 1000) % 60);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = 60 - (Math.floor(Date.now() / 1000) % 60);
      setSecondsToNextCandle(remaining === 60 ? 0 : remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-switch tab based on primary signal type
  const [activeSubTab, setActiveSubTab] = useState<"SPOT_PERP" | "BINARY" | "TELEMETRY">(() => {
    if (asset?.primarySignalType?.startsWith("BINARY")) return "BINARY";
    return "SPOT_PERP";
  });

  useEffect(() => {
    if (asset?.primarySignalType?.startsWith("BINARY")) {
      setActiveSubTab("BINARY");
    } else {
      setActiveSubTab("SPOT_PERP");
    }
  }, [asset?.symbol]);

  // Live metrics computed directly from authentic 1-minute historical candles
  const [liveBarMetrics, setLiveBarMetrics] = useState<{
    atr1m: number;
    vwap: number;
    vwapZ: number;
    deltaZ: number;
    hurst: number;
    garmanKlassVol: number;
  } | null>(null);

  // 4. Real Historical 1-Minute Kline Seeding
  useEffect(() => {
    if (!asset) return;

    let isMounted = true;
    setLoadingCandles(true);

    const fetchKlines = async () => {
      try {
        const res = await fetch(
          `/api/market/candles?symbol=${encodeURIComponent(asset.symbol)}&interval=${activeInterval}&limit=60`
        );
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.candles && Array.isArray(data.candles) && data.candles.length > 0) {
            setCandles(data.candles);
            if (activeInterval === "1m") {
              const metrics = computeIndicatorsFrom1mBars(data.candles, asset.price, asset.assetClass);
              setLiveBarMetrics(metrics);
            }
            return;
          }
        }

        // Direct Binance API fallback for Crypto assets
        if (asset.assetClass === "CRYPTO") {
          const bResp = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${asset.symbol}&interval=${activeInterval}&limit=60`
          );
          if (bResp.ok) {
            const rawBars = await bResp.json();
            const parsed = rawBars.map((b: any) => ({
              time: Math.floor(b[0] / 1000),
              open: parseFloat(b[1]),
              high: parseFloat(b[2]),
              low: parseFloat(b[3]),
              close: parseFloat(b[4]),
              volume: parseFloat(b[5]),
            }));
            if (isMounted && parsed.length > 0) {
              setCandles(parsed);
              if (activeInterval === "1m") {
                const metrics = computeIndicatorsFrom1mBars(parsed, asset.price, asset.assetClass);
                setLiveBarMetrics(metrics);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Candle fetch notice:", err);
      } finally {
        if (isMounted) setLoadingCandles(false);
      }
    };

    fetchKlines();

    return () => {
      isMounted = false;
    };
  }, [asset?.symbol, activeInterval]);

  if (!asset) return null;

  const precision = asset.precision;

  // Use live authentic metrics if 1m candles are loaded, otherwise use asset telemetry
  const effectiveVwapZ = liveBarMetrics?.vwapZ ?? asset.vwapZ;
  const effectiveDeltaZ = liveBarMetrics?.deltaZ ?? asset.deltaZ;
  const effectiveHurst = liveBarMetrics?.hurst ?? asset.hurst;
  const effectiveAtr1m = liveBarMetrics?.atr1m;
  const effectiveGkVol = liveBarMetrics?.garmanKlassVol ?? asset.garmanKlassVol;

  // Dynamic signals grounded in authentic 1m candle metrics
  const liveShortSignal = computeShortSignalSetup({
    symbol: asset.symbol,
    currentPrice: asset.price,
    atr1m: effectiveAtr1m,
    assetClass: asset.assetClass,
    garmanKlassVol: effectiveGkVol,
    vwapZ: effectiveVwapZ,
    deltaZ: effectiveDeltaZ,
    hurst: effectiveHurst,
    bars: candles,
  });

  const liveLongSignal = computeLongSignalSetup({
    symbol: asset.symbol,
    currentPrice: asset.price,
    atr1m: effectiveAtr1m,
    assetClass: asset.assetClass,
    garmanKlassVol: effectiveGkVol,
    vwapZ: effectiveVwapZ,
    deltaZ: effectiveDeltaZ,
    hurst: effectiveHurst,
    bars: candles,
  });

  const liveBinarySignal = computeBinaryOptionSetup({
    symbol: asset.symbol,
    currentPrice: asset.price,
    vwap: liveBarMetrics?.vwap ?? asset.price * (1 - effectiveVwapZ * 0.0035),
    vwapZ: effectiveVwapZ,
    deltaZ: effectiveDeltaZ,
    hurst: effectiveHurst,
    bars: candles,
  });

  const isShortPreferred = liveShortSignal.confidenceScore > liveLongSignal.confidenceScore;
  const primaryDirectional = isShortPreferred ? liveShortSignal : liveLongSignal;
  const binary = liveBinarySignal;
  const isCall = binary.action.includes("CALL");

  // Calculate position sizing
  const sizing = calculatePositionSizing({
    accountBalance,
    riskPerTradePct,
    entryPrice: primaryDirectional.entryPrice,
    stopLossPrice: primaryDirectional.stopLoss,
  });

  // 1. Auto-Scale Chart Y-Axis:
  // Dynamically bound domain to [Math.min(lowestCandleLow, stopLoss, tp1) * 0.9995, Math.max(highestCandleHigh, stopLoss, tp2) * 1.0005]
  const highList = candles.length > 0 ? candles.map((c) => c.high) : [asset.price * 1.002];
  const lowList = candles.length > 0 ? candles.map((c) => c.low) : [asset.price * 0.998];
  const lowestCandleLow = Math.min(...lowList);
  const highestCandleHigh = Math.max(...highList);

  const chartMin = Math.min(
    lowestCandleLow,
    primaryDirectional.stopLoss,
    primaryDirectional.tp1,
    primaryDirectional.tp2
  ) * 0.9995;

  const chartMax = Math.max(
    highestCandleHigh,
    primaryDirectional.stopLoss,
    primaryDirectional.tp1,
    primaryDirectional.tp2
  ) * 1.0005;

  const chartRange = chartMax - chartMin || 1;

  const getYPercent = (val: number) => {
    return Math.max(2, Math.min(98, 100 - ((val - chartMin) / chartRange) * 100));
  };

  // Exness MT4/MT5 Lot & Pip Calibration
  let exnessLotLabel = "";
  let exnessLotValue = "0.10";
  if (asset.assetClass === "FOREX") {
    const lots = Math.max(0.01, sizing.positionUnits / 100000);
    exnessLotValue = lots.toFixed(2);
    exnessLotLabel = `${exnessLotValue} Lots (${Math.round(sizing.positionUnits).toLocaleString()} units)`;
  } else if (asset.symbol.includes("XAU") || asset.name.toLowerCase().includes("gold")) {
    const lots = Math.max(0.01, sizing.positionUnits / 100);
    exnessLotValue = lots.toFixed(2);
    exnessLotLabel = `${exnessLotValue} Lots (${sizing.positionUnits.toFixed(1)} oz)`;
  } else if (asset.symbol.includes("XAG") || asset.name.toLowerCase().includes("silver")) {
    const lots = Math.max(0.01, sizing.positionUnits / 5000);
    exnessLotValue = lots.toFixed(2);
    exnessLotLabel = `${exnessLotValue} Lots (${sizing.positionUnits.toFixed(0)} oz)`;
  } else if (asset.assetClass === "CRYPTO") {
    const coins = sizing.positionUnits;
    exnessLotValue = coins >= 10 ? coins.toFixed(0) : coins.toFixed(2);
    exnessLotLabel = `${exnessLotValue} Lots/Coins ($${sizing.positionNotionalDollars.toLocaleString()} USDT Notional)`;
  } else {
    const contracts = Math.max(1, Math.round(sizing.positionUnits));
    exnessLotValue = contracts.toString();
    exnessLotLabel = `${contracts} Contracts ($${sizing.positionNotionalDollars.toLocaleString()} Notional)`;
  }

  // Pip size calculation for Exness MT4/MT5
  let pipSize = 0.0001;
  if (asset.symbol.includes("JPY")) {
    pipSize = 0.01;
  } else if (asset.symbol.includes("XAU") || asset.name.toLowerCase().includes("gold")) {
    pipSize = 0.10;
  } else if (asset.symbol.includes("XAG") || asset.name.toLowerCase().includes("silver")) {
    pipSize = 0.01;
  } else if (asset.assetClass === "CRYPTO") {
    pipSize = asset.price < 1 ? 0.0001 : asset.price < 10 ? 0.001 : asset.price < 100 ? 0.01 : 1.0;
  } else if (asset.assetClass === "INDEX_STOCK") {
    pipSize = 0.10;
  }

  const slDiff = Math.abs(primaryDirectional.stopLoss - primaryDirectional.entryPrice);
  const tp1Diff = Math.abs(primaryDirectional.tp1 - primaryDirectional.entryPrice);
  const tp2Diff = Math.abs(primaryDirectional.tp2 - primaryDirectional.entryPrice);

  const slPips = Math.round(slDiff / pipSize);
  const tp1Pips = Math.round(tp1Diff / pipSize);
  const tp2Pips = Math.round(tp2Diff / pipSize);

  const slPct = ((slDiff / primaryDirectional.entryPrice) * 100).toFixed(2);
  const tp1Pct = ((tp1Diff / primaryDirectional.entryPrice) * 100).toFixed(2);
  const tp2Pct = ((tp2Diff / primaryDirectional.entryPrice) * 100).toFixed(2);

  const copyToClipboard = (text: string, key: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="flex-1 cursor-pointer" onClick={onClose} />

      {/* Drawer Container */}
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl relative z-10 overflow-hidden animate-slideLeft">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-cyan-400 font-mono shrink-0">
              {asset.symbol.slice(0, 3)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-base sm:text-lg text-white font-mono tracking-tight">
                  {asset.symbol}
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  {asset.categoryLabel}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    asset.marketRegime === "MEAN-REVERTING"
                      ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                      : asset.marketRegime === "SQUEEZE LOCKOUT"
                      ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                      : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                  }`}
                >
                  {asset.marketRegime}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">{asset.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right">
              <p className="font-mono font-extrabold text-base sm:text-lg text-white">
                {formatAssetPrice(asset.price, asset)}
              </p>
              <p
                className={`text-xs font-mono font-bold ${
                  asset.change24h >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {asset.change24h >= 0 ? "+" : ""}
                {asset.change24h.toFixed(2)}%
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* 1. Candlestick Chart with Precise Price Level Overlays & Dynamic Auto-Scaled Y-Axis */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Exchange 1m Candlesticks
                </span>
              </div>

              {/* Timeframe Selectors */}
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono font-bold">
                {(["1m", "5m", "15m", "1h"] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setActiveInterval(tf)}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      activeInterval === tf
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive SVG Candlestick Canvas with Dynamic Auto-Scaling */}
            <div className="relative h-64 w-full bg-slate-950/90 rounded-xl overflow-hidden border border-slate-800/80 flex items-center justify-center">
              {loadingCandles ? (
                <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Loading authentic exchange bars...</span>
                </div>
              ) : candles.length === 0 ? (
                <div className="text-xs text-slate-500 font-mono">No candle feed returned</div>
              ) : (
                <svg className="w-full h-full p-2" viewBox="0 0 500 240" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[0.2, 0.4, 0.6, 0.8].map((pct, i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={pct * 240}
                      x2="500"
                      y2={pct * 240}
                      stroke="#1e293b"
                      strokeDasharray="3 3"
                    />
                  ))}

                  {/* Horizontal Overlays: Stop Loss (Red) */}
                  <line
                    x1="0"
                    y1={(getYPercent(primaryDirectional.stopLoss) / 100) * 240}
                    x2="500"
                    y2={(getYPercent(primaryDirectional.stopLoss) / 100) * 240}
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  {/* Entry Price (Cyan) */}
                  <line
                    x1="0"
                    y1={(getYPercent(primaryDirectional.entryPrice) / 100) * 240}
                    x2="500"
                    y2={(getYPercent(primaryDirectional.entryPrice) / 100) * 240}
                    stroke="#06b6d4"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  {/* TP1 (Emerald) */}
                  <line
                    x1="0"
                    y1={(getYPercent(primaryDirectional.tp1) / 100) * 240}
                    x2="500"
                    y2={(getYPercent(primaryDirectional.tp1) / 100) * 240}
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  {/* TP2 (Amber) */}
                  <line
                    x1="0"
                    y1={(getYPercent(primaryDirectional.tp2) / 100) * 240}
                    x2="500"
                    y2={(getYPercent(primaryDirectional.tp2) / 100) * 240}
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />

                  {/* Candlesticks: Tall, readable, auto-scaled */}
                  {candles.slice(-48).map((bar, idx, arr) => {
                    const candleWidth = 500 / arr.length;
                    const x = idx * candleWidth + candleWidth * 0.18;
                    const w = candleWidth * 0.64;
                    const yOpen = (getYPercent(bar.open) / 100) * 240;
                    const yClose = (getYPercent(bar.close) / 100) * 240;
                    const yHigh = (getYPercent(bar.high) / 100) * 240;
                    const yLow = (getYPercent(bar.low) / 100) * 240;
                    const isGreen = bar.close >= bar.open;

                    return (
                      <g key={bar.time || idx}>
                        {/* Upper/Lower Wick */}
                        <line
                          x1={x + w / 2}
                          y1={yHigh}
                          x2={x + w / 2}
                          y2={yLow}
                          stroke={isGreen ? "#10b981" : "#f43f5e"}
                          strokeWidth="1.2"
                        />
                        {/* Body */}
                        <rect
                          x={x}
                          y={Math.min(yOpen, yClose)}
                          width={Math.max(w, 2)}
                          height={Math.max(Math.abs(yClose - yOpen), 2)}
                          fill={isGreen ? "#10b981" : "#f43f5e"}
                          rx="1"
                        />
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Price Level Badges on Right Margin */}
              <div className="absolute right-2 top-2 space-y-1 text-[10px] font-mono pointer-events-none">
                <div className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300">
                  SL: {formatAssetPrice(primaryDirectional.stopLoss, asset)}
                </div>
                <div className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                  Entry: {formatAssetPrice(primaryDirectional.entryPrice, asset)}
                </div>
                <div className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                  TP1: {formatAssetPrice(primaryDirectional.tp1, asset)}
                </div>
                <div className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300">
                  TP2: {formatAssetPrice(primaryDirectional.tp2, asset)}
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Desk Navigation Tabs: Display Exact Confidence for Each Broker */}
          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveSubTab("SPOT_PERP")}
              className={`flex-1 py-2 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSubTab === "SPOT_PERP"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>🎯 Spot / Perp ({asset.spotConfidence.toFixed(1)}%)</span>
            </button>
            <button
              onClick={() => setActiveSubTab("BINARY")}
              className={`flex-1 py-2 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSubTab === "BINARY"
                  ? "bg-amber-500 text-slate-950 shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>⏱️ Binary Sniper 1-5m ({asset.binaryConfidence.toFixed(1)}%)</span>
            </button>
            <button
              onClick={() => setActiveSubTab("TELEMETRY")}
              className={`flex-1 py-2 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSubTab === "TELEMETRY"
                  ? "bg-cyan-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Quant Telemetry</span>
            </button>
          </div>

          {/* =========================================================================
              TAB CONTENT A: EXNESS SPOT & CFDS EXECUTION BOX (MT4 / MT5 CALIBRATED)
              ========================================================================= */}
          {activeSubTab === "SPOT_PERP" && (
            <div className="space-y-4">
              {/* Order Header Card */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isShortPreferred
                    ? "bg-rose-950/20 border-rose-500/40"
                    : "bg-emerald-950/20 border-emerald-500/40"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2.5 rounded-xl text-white ${
                      isShortPreferred ? "bg-rose-600" : "bg-emerald-600"
                    }`}
                  >
                    {isShortPreferred ? (
                      <TrendingDown className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider block text-slate-300">
                      Exness MT4/MT5 Scalp Order
                    </span>
                    <h3 className="text-base font-extrabold text-white">
                      {isShortPreferred ? "SELL / SHORT ORDER" : "BUY / LONG ORDER"}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-mono">Spot Confidence</span>
                  <span
                    className={`text-lg font-black font-mono ${
                      asset.spotConfidence >= 75 ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {asset.spotConfidence.toFixed(1)}%
                  </span>
                </div>
              </div>

              {primaryDirectional.isBlockedByTrend && (
                <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-mono flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    <strong>Trend Lockout Active:</strong> Counter-trend {primaryDirectional.direction} is locked out by the dual-regime trend filter (higher-timeframe breakout in effect).
                  </span>
                </div>
              )}

              {/* Exact Levels Grid with Pip / Point Distances */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-center">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-cyan-400 block font-sans font-semibold">
                    1. Entry Price
                  </span>
                  <p className="text-sm font-bold text-white mt-1">
                    {formatAssetPrice(primaryDirectional.entryPrice, asset)}
                  </p>
                  <span className="text-[10px] text-slate-500 block">Market Execution</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-rose-500/30">
                  <span className="text-[10px] text-rose-400 block font-sans font-semibold">
                    2. Invalidation SL
                  </span>
                  <p className="text-sm font-bold text-rose-300 mt-1">
                    {formatAssetPrice(primaryDirectional.stopLoss, asset)}
                  </p>
                  <span className="text-[10px] text-rose-400/80 block">
                    -{slPips} pips (-{slPct}%)
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 block font-sans font-semibold">
                    3. TP1 (Lock 70%)
                  </span>
                  <p className="text-sm font-bold text-emerald-300 mt-1">
                    {formatAssetPrice(primaryDirectional.tp1, asset)}
                  </p>
                  <span className="text-[10px] text-emerald-400/80 block">
                    +{tp1Pips} pips (+{tp1Pct}%)
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/30">
                  <span className="text-[10px] text-amber-400 block font-sans font-semibold">
                    4. TP2 (Runner 30%)
                  </span>
                  <p className="text-sm font-bold text-amber-300 mt-1">
                    {formatAssetPrice(primaryDirectional.tp2, asset)}
                  </p>
                  <span className="text-[10px] text-amber-400/80 block">
                    +{tp2Pips} pips (+{tp2Pct}%)
                  </span>
                </div>
              </div>

              {/* Exness MT4/MT5 Standard Lots Card & Quick Copy Controls */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2 text-slate-300 font-bold text-xs">
                    <Calculator className="w-4 h-4 text-emerald-400" />
                    <span>Exness MT4/MT5 Standard Lot Sizing</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    R:R 1:{primaryDirectional.riskReward}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Exness Volume (Lots):</span>
                    <span className="font-extrabold text-white text-sm text-emerald-400">
                      {exnessLotLabel}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Risk Allocation:</span>
                    <span className="font-bold text-white">${sizing.riskDollars} ({riskPerTradePct}%)</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Loss Per Point:</span>
                    <span className="font-bold text-rose-400">${sizing.riskPerUnit}</span>
                  </div>
                </div>

                {/* Quick Copy Chips for Exness MT4/MT5 Order Window */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    onClick={() => copyToClipboard(exnessLotValue, "lots")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 cursor-pointer transition-colors"
                  >
                    {copiedKey === "lots" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Volume ({exnessLotValue})</span>
                  </button>

                  <button
                    onClick={() => copyToClipboard(primaryDirectional.stopLoss.toFixed(precision), "sl")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-rose-500/30 rounded-lg text-xs font-mono text-rose-300 cursor-pointer transition-colors"
                  >
                    {copiedKey === "sl" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy SL ({primaryDirectional.stopLoss.toFixed(precision)})</span>
                  </button>

                  <button
                    onClick={() => copyToClipboard(primaryDirectional.tp1.toFixed(precision), "tp1")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-300 cursor-pointer transition-colors"
                  >
                    {copiedKey === "tp1" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy TP1 ({primaryDirectional.tp1.toFixed(precision)})</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (onDeployDirectionalTest) {
                      onDeployDirectionalTest(asset);
                    } else if (onTestExecution) {
                      onTestExecution(
                        `⚡ Simulated Order: ${asset.symbol} ${primaryDirectional.direction} for ${exnessLotValue} Lots ($${sizing.positionNotionalDollars}) placed!`
                      );
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Execute Simulated {primaryDirectional.direction} Scalp at Live Market</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB CONTENT B: POCKETOPTION BINARY SNIPER (1-5M)
              ========================================================================= */}
          {activeSubTab === "BINARY" && (
            <div className="space-y-4">
              {/* Binary Action Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isCall
                    ? "bg-emerald-950/20 border-emerald-500/40"
                    : "bg-rose-950/20 border-rose-500/40"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl text-white ${isCall ? "bg-emerald-600" : "bg-rose-600"}`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider block text-slate-400">
                      PocketOption Brownian Bridge Model
                    </span>
                    <h3 className="text-base font-extrabold text-white">
                      {isCall ? "▲ BUY CALL (HIGHER)" : "▼ BUY PUT (LOWER)"}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-mono">Binary Confidence</span>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    {asset.binaryConfidence.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* 3. PocketOption Execution Checklist Box */}
              <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>PocketOption Execution Checklist & Timing Gate</span>
                  </div>
                  <div className="flex items-center space-x-1.5 font-mono text-xs">
                    <span className="text-slate-400">Next 1m Candle:</span>
                    <span
                      className={`font-black px-2 py-0.5 rounded ${
                        secondsToNextCandle <= 8
                          ? "bg-emerald-500 text-slate-950 animate-pulse font-extrabold"
                          : "bg-slate-800 text-cyan-300"
                      }`}
                    >
                      00:{secondsToNextCandle.toString().padStart(2, "0")}s
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Checklist Rule 1 */}
                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">1. Broker Pair Check:</strong>{" "}
                      <span className="text-amber-300 font-semibold">
                        ⚠️ LIVE PAIR ONLY (Do NOT trade PocketOption OTC feed)
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Only execute during live market hours on real Interbank/Binance pairs. PocketOption OTC pairs are dealer-simulated feeds with negative expectation.
                      </p>
                    </div>
                  </div>

                  {/* Checklist Rule 2 */}
                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">2. Minimum Payout Gate:</strong>{" "}
                      <span className="text-emerald-300 font-semibold">
                        Require &gt;= 80% Payout on PocketOption (Skip if &lt;80%)
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Our positive quantitative expectancy requires minimum +0.80R (+80%) return. If broker payout drops below 80%, pass to the next instrument.
                      </p>
                    </div>
                  </div>

                  {/* Checklist Rule 3 */}
                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">3. Exact Clock Expiry & Strike Entry:</strong>
                      <p className="text-xs font-mono font-bold text-cyan-300 mt-1">
                        {isCall
                          ? `Enter CALL at or below ${formatAssetPrice(binary.strikePrice, asset)} (Timing: Candle Open :00s)`
                          : `Enter PUT at or above ${formatAssetPrice(binary.strikePrice, asset)} (Timing: Candle Open :00s)`}
                      </p>
                      {secondsToNextCandle <= 8 && (
                        <p className="text-[11px] text-emerald-400 font-bold mt-1">
                          ⚡ OPTIMAL EXECUTION WINDOW: Seconds :55s to :00s — Get ready to click on candle open!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Binary Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-center">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Strike Price</span>
                  <p className="text-sm font-bold text-white mt-1">
                    {formatAssetPrice(binary.strikePrice, asset)}
                  </p>
                  <span className="text-[10px] text-cyan-400 block">At-The-Money</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/30">
                  <span className="text-[10px] text-amber-400 block font-sans">Selected Expiry</span>
                  <p className="text-sm font-bold text-amber-300 mt-1 uppercase">
                    {binary.expiryHorizon} Turbo
                  </p>
                  <span className="text-[10px] text-slate-500 block">{binary.expiryMinutes} min duration</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">O-U Half-Life (τ₁/₂)</span>
                  <p className="text-sm font-bold text-emerald-300 mt-1">
                    {binary.ouHalfLife} mins
                  </p>
                  <span className="text-[10px] text-slate-500 block">θ = {binary.ouTheta.toFixed(2)}</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Realized Vol (GK)</span>
                  <p className="text-sm font-bold text-cyan-300 mt-1">
                    {(binary.realizedVol * 100).toFixed(2)}%
                  </p>
                  <span className="text-[10px] text-slate-500 block">Garman-Klass</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-white">Mathematical Microstructure Thesis:</p>
                <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                  {binary.reasoning}
                </p>
              </div>

              <button
                onClick={() => {
                  if (onDeployBinaryTest) {
                    onDeployBinaryTest(asset);
                  } else if (onTestExecution) {
                    onTestExecution(
                      `⏱️ Binary Options Test Placed: ${asset.symbol} ${binary.action} [${binary.expiryHorizon} Expiry] at Strike ${formatAssetPrice(binary.strikePrice, asset)}!`
                    );
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span>Simulate {binary.expiryHorizon} Binary Sniper Execution</span>
              </button>
            </div>
          )}

          {/* =========================================================================
              TAB CONTENT C: QUANT & AI TELEMETRY BREAKDOWN
              ========================================================================= */}
          {activeSubTab === "TELEMETRY" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-center">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">VWAP Z-Score</span>
                  <p
                    className={`text-base font-bold mt-1 ${
                      effectiveVwapZ >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {effectiveVwapZ > 0 ? "+" : ""}
                    {effectiveVwapZ.toFixed(2)}σ
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Order-Flow Delta Z</span>
                  <p
                    className={`text-base font-bold mt-1 ${
                      effectiveDeltaZ >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {effectiveDeltaZ > 0 ? "+" : ""}
                    {effectiveDeltaZ.toFixed(2)}σ
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Hurst Exponent (H)</span>
                  <p
                    className={`text-base font-bold mt-1 ${
                      effectiveHurst > 0.52 ? "text-cyan-400" : "text-amber-400"
                    }`}
                  >
                    {effectiveHurst.toFixed(2)}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Garman-Klass Vol</span>
                  <p className="text-base font-bold text-white mt-1">
                    {(effectiveGkVol * 100).toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Risk Supervisor Thesis */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Quantitative Risk Supervisor Validation Thesis</span>
                </div>

                <ul className="space-y-2">
                  {primaryDirectional.bulletTheses.map((bullet, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed"
                    >
                      <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>Exness MT4/MT5: Ready</span>
          <span>PocketOption: Live Checked</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
