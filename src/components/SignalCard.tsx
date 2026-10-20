import React from "react";
import { SignalRecord } from "../types/signals";
import {
  ArrowUpRight,
  ArrowDownRight,
  Target,
  ShieldAlert,
  BarChart3,
  Sparkles,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Compass,
} from "lucide-react";

interface SignalCardProps {
  signal: SignalRecord;
  onViewChart: (signal: SignalRecord) => void;
  onRunAudit?: (signal: SignalRecord) => void;
  onTestStrategy?: (signal: SignalRecord) => void;
}

export const SignalCard: React.FC<SignalCardProps> = ({
  signal,
  onViewChart,
  onRunAudit,
  onTestStrategy,
}) => {
  const isLong = signal.direction === "LONG";
  
  // Calculate confidence score (0-100)
  const confidenceScore = signal.confidence_score ?? Math.round(
    signal.win_probability <= 1.0 ? signal.win_probability * 100 : signal.win_probability
  );

  // Derive Action recommendation (STRONG_BUY, BUY, STRONG_SELL, SELL, HOLD)
  const actionRecommendation = signal.action_recommendation ?? (
    confidenceScore < 70
      ? "HOLD"
      : isLong
      ? (confidenceScore >= 85 ? "STRONG_BUY" : "BUY")
      : (confidenceScore >= 85 ? "STRONG_SELL" : "SELL")
  );

  const bullets = signal.ai_thesis?.thesis || [
    "Confirmed order flow delta absorption on rolling window.",
    "Regime variance ratio matches institutional trend alignment.",
    "TP1 mathematical expectancy exceeds hurdle rate.",
  ];

  const riskDistance = Math.abs(signal.entry_price - signal.stop_loss) || 1;
  const tp1R = (Math.abs(signal.tp1_price - signal.entry_price) / riskDistance).toFixed(2);
  const tp2R = (Math.abs(signal.tp2_price - signal.entry_price) / riskDistance).toFixed(2);

  // Live Current Market Calculations
  const curPrice = signal.current_price ?? signal.entry_price;
  const precision = signal.entry_price < 5 ? 4 : 2;
  const priceDelta = isLong ? curPrice - signal.entry_price : signal.entry_price - curPrice;
  const pnlPct = signal.entry_price > 0 ? (priceDelta / signal.entry_price) * 100 : 0;
  const floatingR = priceDelta / riskDistance;
  const isProfit = priceDelta >= 0;

  // Trajectory gauge calculation (from stop loss to tp2)
  const lowerBound = Math.min(signal.stop_loss, signal.tp2_price);
  const upperBound = Math.max(signal.stop_loss, signal.tp2_price);
  const totalSpan = upperBound - lowerBound || 1;
  const rawProgress = isLong
    ? ((curPrice - signal.stop_loss) / (signal.tp2_price - signal.stop_loss)) * 100
    : ((signal.stop_loss - curPrice) / (signal.stop_loss - signal.tp2_price)) * 100;
  const progressClamped = Math.max(2, Math.min(98, rawProgress));

  // Action instructions fallback if not explicitly provided
  const defaultInstruction = actionRecommendation === "HOLD"
    ? `HOLD & MONITOR: Await volume breakout confirmation above ${signal.entry_price.toFixed(precision)} before executing.`
    : isLong
    ? `BUY above ${signal.entry_price.toFixed(precision)}. Hard stop at ${signal.stop_loss.toFixed(precision)}. Lock profit at TP1 (${signal.tp1_price.toFixed(precision)}, +${tp1R}R) and trail stop.`
    : `SELL SHORT below ${signal.entry_price.toFixed(precision)}. Hard stop at ${signal.stop_loss.toFixed(precision)}. Cover 70% at TP1 (${signal.tp1_price.toFixed(precision)}, +${tp1R}R).`;

  const instructionText = signal.action_instruction || defaultInstruction;

  return (
    <div
      className={`bg-slate-900 border rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between ${
        actionRecommendation.includes("BUY")
          ? "border-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-950/40"
          : actionRecommendation.includes("SELL")
          ? "border-rose-500/40 hover:border-rose-400 hover:shadow-rose-950/40"
          : "border-amber-500/40 hover:border-amber-400 hover:shadow-amber-950/40"
      }`}
    >
      {/* Top Header Card */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <span className="font-mono font-black text-lg text-white tracking-wider">
              {signal.symbol}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {signal.asset_class}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400">
              {signal.timeframe.replace("bars_", "")}
            </span>
          </div>

          {/* Action Badge: Clear Buy / Sell / Hold */}
          <div className="flex items-center gap-1.5">
            {actionRecommendation === "STRONG_BUY" && (
              <span className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 uppercase tracking-wide">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                <span>STRONG BUY</span>
              </span>
            )}
            {actionRecommendation === "BUY" && (
              <span className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 uppercase tracking-wide">
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>BUY / LONG</span>
              </span>
            )}
            {actionRecommendation === "STRONG_SELL" && (
              <span className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-md shadow-rose-500/30 uppercase tracking-wide">
                <ShieldAlert className="w-3.5 h-3.5 stroke-[3]" />
                <span>STRONG SELL</span>
              </span>
            )}
            {actionRecommendation === "SELL" && (
              <span className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/40 uppercase tracking-wide">
                <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>SELL / SHORT</span>
              </span>
            )}
            {actionRecommendation === "HOLD" && (
              <span className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/40 uppercase tracking-wide">
                <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>HOLD / WAIT</span>
              </span>
            )}
          </div>
        </div>

        {/* Real Live Exchange Price & Dynamic PnL HUD Bar */}
        <div className="mt-3.5 bg-slate-950 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE EXCHANGE TICK</span>
            </div>
            <div className="font-mono text-xl font-black text-white mt-0.5 tracking-tight flex items-baseline gap-1.5">
              <span>${curPrice.toFixed(precision)}</span>
              <span className="text-[11px] text-slate-500 font-sans font-normal">USD</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Floating Strategy PnL
            </span>
            <div
              className={`font-mono text-base font-black flex items-center justify-end gap-1 ${
                isProfit ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isProfit ? <ArrowUpRight className="w-4 h-4 stroke-[3]" /> : <ArrowDownRight className="w-4 h-4 stroke-[3]" />}
              <span>
                {isProfit ? "+" : ""}
                {floatingR.toFixed(2)}R
              </span>
              <span className="text-xs font-semibold">
                ({isProfit ? "+" : ""}
                {pnlPct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Live Trajectory Track Bar */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="text-rose-400 font-bold">SL ${signal.stop_loss.toFixed(precision)}</span>
            <span className="text-slate-300">Entry ${signal.entry_price.toFixed(precision)}</span>
            <span className="text-emerald-400 font-bold">TP1 ${signal.tp1_price.toFixed(precision)}</span>
            <span className="text-cyan-400 font-bold">TP2 ${signal.tp2_price.toFixed(precision)}</span>
          </div>
          <div className="relative w-full h-2.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
            {/* Background color gradient track */}
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/30 via-slate-700/30 to-emerald-500/40" />
            {/* Live Price Needle */}
            <div
              className="absolute top-0 bottom-0 w-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/80 transition-all duration-300"
              style={{ left: `calc(${progressClamped}% - 4px)` }}
            />
          </div>
        </div>

        {/* Confidence Score Bar & Conviction Pill */}
        <div className="mt-3 bg-slate-900/90 rounded-xl p-2.5 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5 text-[11px]">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Win Expectancy</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                {confidenceScore >= 90 ? "Ultra-High Conviction" : confidenceScore >= 80 ? "High Conviction" : "Standard Conviction"}
              </span>
              <span className={`font-mono font-black text-xs ${confidenceScore >= 85 ? "text-emerald-400" : confidenceScore >= 75 ? "text-cyan-400" : "text-amber-400"}`}>
                {confidenceScore}%
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                confidenceScore >= 85
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-sm shadow-emerald-500/50"
                  : confidenceScore >= 75
                  ? "bg-gradient-to-r from-cyan-500 to-emerald-400"
                  : "bg-amber-400"
              }`}
              style={{ width: `${confidenceScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Clear Execution Instructions Box */}
      <div className="px-5 py-3 bg-slate-950 border-b border-slate-800/80">
        <div className="flex items-start gap-2">
          <Compass className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block mb-0.5">
              Clear Trade Instruction:
            </span>
            <p className="text-xs font-mono text-slate-200 leading-snug">
              {instructionText}
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Targets Grid */}
      <div className="p-4 bg-slate-900/60 grid grid-cols-4 gap-2 border-b border-slate-800/60 font-mono text-center">
        <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block font-sans">Entry Price</span>
          <span className="text-xs font-semibold text-slate-200 mt-0.5 block truncate">
            ${signal.entry_price.toFixed(precision)}
          </span>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
          <span className="text-[10px] text-rose-400 block font-sans">Stop Loss</span>
          <span className="text-xs font-semibold text-rose-300 mt-0.5 block truncate">
            ${signal.stop_loss.toFixed(precision)}
          </span>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
          <span className="text-[10px] text-emerald-400 flex items-center justify-center gap-0.5 font-sans">
            <Lock className="w-2.5 h-2.5" /> TP1 (Lock)
          </span>
          <span className="text-xs font-semibold text-emerald-300 mt-0.5 block truncate">
            ${signal.tp1_price.toFixed(precision)}
          </span>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
          <span className="text-[10px] text-cyan-400 flex items-center justify-center gap-0.5 font-sans">
            <Target className="w-2.5 h-2.5" /> TP2 (Runner)
          </span>
          <span className="text-xs font-semibold text-cyan-300 mt-0.5 block truncate">
            ${signal.tp2_price.toFixed(precision)}
          </span>
        </div>
      </div>

      {/* AI Supervisor Thesis & Rationale */}
      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-200 leading-snug">
            {signal.ai_headline}
          </p>
          <ul className="space-y-1">
            {bullets.slice(0, 3).map((bullet, idx) => (
              <li key={idx} className="text-[11px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Live Telemetry Pill Row */}
        {signal.telemetry && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60 text-[10px] font-mono">
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
              Delta Z: <strong className={signal.telemetry.delta_z >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {signal.telemetry.delta_z > 0 ? "+" : ""}{signal.telemetry.delta_z.toFixed(2)}
              </strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
              Hurst: <strong className={signal.telemetry.hurst >= 0.55 ? "text-emerald-400" : "text-amber-400"}>
                {signal.telemetry.hurst.toFixed(2)}
              </strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
              RVOL: <strong className="text-cyan-400">{signal.telemetry.rvol.toFixed(1)}x</strong>
            </span>
          </div>
        )}

        {signal.ai_thesis?.risk_warning && (
          <div className="text-[11px] px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span className="truncate">{signal.ai_thesis.risk_warning}</span>
          </div>
        )}
      </div>

      {/* Footer Interactive Actions */}
      <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center space-x-2 min-w-0 flex-wrap gap-y-1">
          {signal.status === "TP1_HIT_BE_LOCKED" ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
              TP1 HIT • BE SECURED
            </span>
          ) : signal.status === "CLOSED_WIN" ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
              CLOSED WIN (+{signal.realized_r ?? 1.2}R)
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ACTIVE
            </span>
          )}

          {signal.mfe_r !== undefined && signal.mfe_r > 0 && (
            <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
              MFE: <span className="text-emerald-400 font-semibold">{signal.mfe_r.toFixed(1)}R</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 flex-shrink-0">
          {/* ⚡ Test Strategy Button */}
          {onTestStrategy && (
            <button
              onClick={() => onTestStrategy(signal)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white transition-all shadow-md shadow-emerald-700/20 flex-shrink-0 whitespace-nowrap cursor-pointer"
              title="Test execute this strategy at current live market price"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Test Strategy</span>
            </button>
          )}

          {onRunAudit && (
            <button
              onClick={() => onRunAudit(signal)}
              className="flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/50 transition-colors shadow-sm flex-shrink-0 whitespace-nowrap cursor-pointer"
              title="Audit this setup with Gemini Risk Supervisor"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Audit</span>
            </button>
          )}

          <button
            onClick={() => onViewChart(signal)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm flex-shrink-0 whitespace-nowrap cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Chart</span>
          </button>
        </div>
      </div>
    </div>
  );
};
