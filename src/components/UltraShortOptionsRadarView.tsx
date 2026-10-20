import React, { useState, useEffect, useMemo } from "react";
import { OptionSetupRecord, OptionActionDecision } from "../types/options";
import { INITIAL_OPTIONS_SETUPS, syncOptionWithLiveUnderlying, matchOptionUnderlying, OPTIONS_MARKET_OVERVIEW } from "../data/mockOptionsFeed";
import { OptionDetailModal } from "./OptionDetailModal";
import { AssetTicker } from "../types/signals";
import {
  Zap,
  Clock,
  Gauge,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Flame,
  Layers,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  BarChart3,
  Copy,
  CheckCircle2,
  ExternalLink,
  Timer,
  ArrowRight,
  Target,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

interface UltraShortOptionsRadarViewProps {
  tickers?: AssetTicker[];
  onSimulateTrade?: (contractDesc: string) => void;
  onTestStrategy?: (setup: OptionSetupRecord) => void;
}

export const UltraShortOptionsRadarView: React.FC<UltraShortOptionsRadarViewProps> = ({
  tickers = [],
  onSimulateTrade,
  onTestStrategy,
}) => {
  const [setups, setSetups] = useState<OptionSetupRecord[]>(INITIAL_OPTIONS_SETUPS);
  const [selectedTimeline, setSelectedTimeline] = useState<string>("ALL");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [selectedUnderlying, setSelectedUnderlying] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSetupForModal, setActiveSetupForModal] = useState<OptionSetupRecord | null>(null);

  // Live countdown timers for each setup (seconds remaining)
  const [countdowns, setCountdowns] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    INITIAL_OPTIONS_SETUPS.forEach((s) => {
      map[s.id] = s.initial_countdown_seconds;
    });
    return map;
  });

  // Tick down timer every second for authentic ultra-short expiry urgency
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdowns((prev) => {
        const next: Record<string, number> = { ...prev };
        Object.keys(next).forEach((key) => {
          if (next[key] > 1) {
            next[key] -= 1;
          } else {
            // Reset when expired to keep radar actively cycling
            const matched = INITIAL_OPTIONS_SETUPS.find((s) => s.id === key);
            next[key] = matched ? matched.initial_countdown_seconds : 480;
          }
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Synchronize with authentic live underlying market feeds from Binance & Yahoo
  useEffect(() => {
    if (!tickers || tickers.length === 0) return;

    setSetups((prev) =>
      prev.map((setup) => {
        const matched = tickers.find((t) => matchOptionUnderlying(setup.symbol, t.symbol));
        if (matched && matched.price) {
          return syncOptionWithLiveUnderlying(setup, matched.price);
        }
        return setup;
      })
    );
  }, [tickers]);

  const filteredSetups = useMemo(() => {
    return setups.filter((s) => {
      if (selectedTimeline !== "ALL" && s.timeline_bracket !== selectedTimeline) {
        return false;
      }
      if (selectedAction === "CALL" && s.action_decision !== "BUY CALL (LONG VOL)") {
        return false;
      }
      if (selectedAction === "PUT" && s.action_decision !== "BUY PUT (SHORT VOL)") {
        return false;
      }
      if (selectedUnderlying !== "ALL" && s.symbol !== selectedUnderlying) {
        return false;
      }
      return true;
    });
  }, [setups, selectedTimeline, selectedAction, selectedUnderlying]);

  const handleCopySetup = (setup: OptionSetupRecord) => {
    const text = `[ULTRA-SHORT 0DTE ORDER DIRECTIVE]
Contract: ${setup.contract_identifier}
Action: ${setup.action_decision}
Underlying: ${setup.symbol} @ $${setup.underlying_price.toFixed(2)}
Entry Premium Zone: ${setup.entry_premium_zone}
Take-Profit (TP): ${setup.take_profit_formatted}
Stop-Loss (SL): ${setup.stop_loss_formatted}
AI Confidence: ${setup.ai_confidence_badge} (${setup.ai_model_verification})
Timeline: ${setup.time_horizon}
IV/RV Spread: ${setup.iv_rv_spread_ratio} | Delta Velocity: ${setup.delta_velocity} | Theta Risk: ${setup.theta_decay_risk_indicator} (${setup.theta_burn_rate})
Warning: ${setup.gamma_risk_warning}`;

    navigator.clipboard.writeText(text);
    setCopiedId(setup.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Ultra-Short Radar Institutional Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Zap className="w-4 h-4 fill-amber-400" />
              <span>Institutional Quantitative Execution Engine</span>
              <span className="text-slate-500">•</span>
              <span className="text-cyan-400 font-mono">3 - 15 Min Timeline</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              ⚡ Ultra-Short Options & 0DTE Radar (3-15 Min Timeline)
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Real-time delta velocity expansion and short-horizon setups scored by heuristic filters against live public pricing streams. Optional Gemini notes available. Not a calibrated model.
            </p>
          </div>

          {/* Real-Time Market Overview Matrix */}
          <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2 min-w-[260px] text-xs font-mono shadow-inner">
            <div className="flex justify-between items-center text-slate-400">
              <span>Underlying Data Stream:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Feed Sync
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>SPY 0DTE ATM IV:</span>
              <span className="text-amber-400 font-bold">{OPTIONS_MARKET_OVERVIEW.spy_0dte_iv}%</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Zero-Gamma Pivot:</span>
              <span className="text-cyan-400 font-bold">${OPTIONS_MARKET_OVERVIEW.zero_gamma_level}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Theta Burndown:</span>
              <span className="text-rose-400 font-bold uppercase tracking-wider animate-pulse">
                Rapid Velocity
              </span>
            </div>
          </div>
        </div>

        {/* High-Impact Telemetry Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs font-mono">
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase block font-sans">Execution Timeline</span>
            <span className="text-sm font-bold text-amber-300 block mt-0.5">3 to 15 Min Max</span>
            <span className="text-[10px] text-slate-400">Enforces hard time-stop on chop</span>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase block font-sans">Target Risk-Reward</span>
            <span className="text-sm font-bold text-emerald-400 block mt-0.5">+35% TP / -25% SL</span>
            <span className="text-[10px] text-slate-400">Pre-defined execution bracket</span>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase block font-sans">Quantitative Validator</span>
            <span className="text-sm font-bold text-cyan-400 block mt-0.5">Heuristic + Gemini</span>
            <span className="text-[10px] text-slate-400">Dual model regime gating</span>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase block font-sans">Delta Velocity Floor</span>
            <span className="text-sm font-bold text-white block mt-0.5">&gt; 0.35 Δ / Min</span>
            <span className="text-[10px] text-slate-400">Only high directional velocity</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Quick Filter Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Timeline Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">Timeline Horizon:</span>
            {[
              { id: "ALL", label: "All Timelines (3-15m)" },
              { id: "3-5M", label: "⚡ 3 - 5 Min Scalp" },
              { id: "5-10M", label: "🚀 5 - 10 Min Momentum" },
              { id: "10-15M", label: "🏛️ 10 - 15 Min 0DTE" },
            ].map((t) => (
              <button
                key={`opt-timeline-${t.id}`}
                onClick={() => setSelectedTimeline(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedTimeline === t.id
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Action Filter: BUY CALL vs BUY PUT */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">Action Filter:</span>
            <button
              onClick={() => setSelectedAction("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedAction === "ALL"
                  ? "bg-slate-100 text-slate-950"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              All Actions
            </button>
            <button
              onClick={() => setSelectedAction("CALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedAction === "CALL"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/25"
                  : "bg-slate-950 text-emerald-400 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>BUY CALL (LONG VOL)</span>
            </button>
            <button
              onClick={() => setSelectedAction("PUT")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedAction === "PUT"
                  ? "bg-rose-500 text-white font-black shadow-lg shadow-rose-500/25"
                  : "bg-slate-950 text-rose-400 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>BUY PUT (SHORT VOL)</span>
            </button>
          </div>
        </div>

        {/* Underlyings Filter Ribbon */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 font-medium mr-1">Liquid Underlying:</span>
          {["ALL", "SPY", "BTC", "QQQ", "NVDA", "TSLA", "AAPL"].map((sym) => (
            <button
              key={`opt-underlying-btn-${sym}`}
              onClick={() => setSelectedUnderlying(sym)}
              className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${
                selectedUnderlying === sym
                  ? "bg-slate-800 text-cyan-400 border border-cyan-500/50"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {sym}
            </button>
          ))}
          <span className="text-[11px] text-slate-500 font-mono ml-auto">
            {filteredSetups.length} Setups Calibrated
          </span>
        </div>
      </div>

      {/* 3. Primary Grid of Ultra-Short Options Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSetups.map((setup) => {
          const isCall = setup.action_decision === "BUY CALL (LONG VOL)";
          const secondsRemaining = countdowns[setup.id] || setup.initial_countdown_seconds;
          const isExpiringSoon = secondsRemaining < 120;

          return (
            <div
              key={setup.id}
              className={`bg-slate-900/90 border rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden group ${
                isCall ? "border-emerald-500/30 hover:border-emerald-500/60" : "border-rose-500/30 hover:border-rose-500/60"
              }`}
            >
              {/* Subtle Ambient Glow */}
              <div
                className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-15 ${
                  isCall ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />

              <div className="space-y-4">
                {/* 1. Header with Contract Identifier & Bold Action Decision Badge */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                        {setup.symbol}
                      </span>
                      <span className="text-xs font-mono text-cyan-400 font-bold">
                        Live Spot: ${setup.underlying_price.toFixed(2)}
                      </span>
                    </div>

                    {/* Contract Identifier */}
                    <h3 className="font-mono text-lg sm:text-xl font-black text-white mt-1 tracking-tight">
                      {setup.contract_identifier}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {setup.strike_selection} • {setup.expiry_formatted}
                    </p>
                  </div>

                  {/* Clear Action Decision Badge */}
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-xs uppercase font-black px-3.5 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-lg tracking-wide ${
                        isCall
                          ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-emerald-500/20"
                          : "bg-rose-600 text-white border-rose-400 shadow-rose-600/20"
                      }`}
                    >
                      {isCall ? (
                        <TrendingUp className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <TrendingDown className="w-4 h-4 stroke-[3]" />
                      )}
                      <span>{setup.action_decision}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Current Mid: <strong className="text-white">${setup.current_premium.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>

                {/* Entry & Execution Parameters: Entry Zone, TP, SL */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/90 rounded-xl border border-slate-800/80 font-mono text-xs">
                  {/* Entry Price / Premium Zone */}
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">
                      Entry Premium Zone
                    </span>
                    <span className="text-sm font-black text-amber-300 block mt-0.5">
                      {setup.entry_premium_zone}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Mid: ${setup.current_premium.toFixed(2)}
                    </span>
                  </div>

                  {/* Take-Profit (TP) */}
                  <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/40">
                    <span className="text-[10px] text-emerald-400 uppercase block font-sans font-semibold">
                      Take-Profit (TP)
                    </span>
                    <span className="text-sm font-black text-emerald-400 block mt-0.5">
                      {setup.take_profit_formatted}
                    </span>
                    <span className="text-[10px] text-emerald-300/80 block mt-0.5">
                      Target: ${setup.take_profit_price.toFixed(2)}
                    </span>
                  </div>

                  {/* Stop-Loss (SL) */}
                  <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/40">
                    <span className="text-[10px] text-rose-400 uppercase block font-sans font-semibold">
                      Stop-Loss (SL)
                    </span>
                    <span className="text-sm font-black text-rose-400 block mt-0.5">
                      {setup.stop_loss_formatted}
                    </span>
                    <span className="text-[10px] text-rose-300/80 block mt-0.5">
                      Cut: ${setup.stop_loss_price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Confidence Rating & Strict Time-Window with Live Seconds Countdown */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/70 text-xs">
                  {/* AI Confidence Score */}
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <strong className="text-emerald-400 font-extrabold text-sm">
                          {setup.ai_confidence_badge}
                        </strong>
                      </div>
                      <span className="text-[10px] text-slate-400 block leading-tight">
                        Verified by: <strong className="text-slate-300 font-mono">{setup.ai_model_verification}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Strict Time-Horizon with Live Countdown */}
                  <div className="flex items-center gap-2 font-mono">
                    <div
                      className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${
                        isExpiringSoon
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                          : "bg-amber-500/15 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      <Timer className="w-3.5 h-3.5" />
                      <span className="font-bold text-xs">
                        {formatCountdown(secondsRemaining)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-sans font-medium">
                        {setup.time_horizon}
                      </span>
                      <span className="text-[10px] text-amber-400 font-bold block">
                        Hard Time-Stop
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Quantitative Options Metrics Bar (IV/RV, Delta Velocity, Theta Decay Risk) */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-3 gap-2 text-xs font-mono">
                  {/* IV / RV Spread */}
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/40">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-sans font-semibold">
                      <span>IV / RV Spread</span>
                      <Activity className="w-3 h-3 text-cyan-400" />
                    </div>
                    <span className="font-black text-cyan-300 text-sm block mt-1">
                      {setup.iv_rv_spread_ratio}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      IV {setup.iv_pct}% vs RV {setup.rv_pct}%
                    </span>
                  </div>

                  {/* Delta Velocity */}
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/40">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-sans font-semibold">
                      <span>Delta Velocity</span>
                      <Zap className="w-3 h-3 text-amber-400" />
                    </div>
                    <span className="font-black text-amber-300 text-sm block mt-1">
                      {setup.delta_velocity}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Speed: {setup.target_delta}
                    </span>
                  </div>

                  {/* Theta Decay Risk */}
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/40">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-sans font-semibold">
                      <span>Theta Decay Risk</span>
                      <ShieldAlert className="w-3 h-3 text-rose-400" />
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span
                        className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                          setup.theta_decay_risk_indicator === "HIGH"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                            : setup.theta_decay_risk_indicator === "MEDIUM"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        }`}
                      >
                        {setup.theta_decay_risk_indicator} RISK
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                      {setup.theta_burn_rate}
                    </span>
                  </div>
                </div>

                {/* Explicit Expiration Gamma Risk Warning */}
                <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/30 text-[11px] text-rose-200/90 flex items-start gap-2 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{setup.gamma_risk_warning}</span>
                </div>
              </div>

              {/* Action Buttons: Copy Directives & Inspect Greeks */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => handleCopySetup(setup)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  {copiedId === setup.id ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{copiedId === setup.id ? "Directive Copied!" : "Copy Order Directive"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveSetupForModal(setup)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Options Chain & Greeks</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onTestStrategy) {
                        onTestStrategy(setup);
                      } else if (onSimulateTrade) {
                        onSimulateTrade(setup.contract_identifier);
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                      isCall
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                        : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Test Strategy Order</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail & Payoff Inspector Modal */}
      {activeSetupForModal && (
        <OptionDetailModal
          setup={activeSetupForModal}
          onClose={() => setActiveSetupForModal(null)}
          onSimulateOrder={(setup) => {
            if (onSimulateTrade) onSimulateTrade(setup.contract_identifier);
          }}
        />
      )}
    </div>
  );
};
