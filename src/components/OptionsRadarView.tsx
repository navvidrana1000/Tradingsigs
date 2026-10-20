import React, { useState, useMemo } from "react";
import { OptionSetupRecord, OptionStrategyType, GexState } from "../types/options";
import { OPTIONS_MARKET_OVERVIEW, INITIAL_OPTIONS_SETUPS, syncOptionWithLiveUnderlying, matchOptionUnderlying } from "../data/mockOptionsFeed";
import { AssetTicker } from "../types/signals";
import { OptionDetailModal } from "./OptionDetailModal";
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
  HelpCircle,
  ExternalLink,
} from "lucide-react";

interface OptionsRadarViewProps {
  tickers?: AssetTicker[];
  onSimulateTrade?: (contractDesc: string) => void;
}

export const OptionsRadarView: React.FC<OptionsRadarViewProps> = ({ tickers = [], onSimulateTrade }) => {
  const [selectedUnderlying, setSelectedUnderlying] = useState<string>("ALL");
  const [selectedStrategy, setSelectedStrategy] = useState<string>("ALL");
  const [selectedExpiry, setSelectedExpiry] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"confluence" | "iv_rank" | "theta">("confluence");
  const [activeSetupForModal, setActiveSetupForModal] = useState<OptionSetupRecord | null>(null);

  const syncedSetups = useMemo(() => {
    if (!tickers || tickers.length === 0) return INITIAL_OPTIONS_SETUPS;
    return INITIAL_OPTIONS_SETUPS.map((setup) => {
      const matched = tickers.find((t) => matchOptionUnderlying(setup.symbol, t.symbol));
      if (matched && matched.price) {
        return syncOptionWithLiveUnderlying(setup, matched.price);
      }
      return setup;
    });
  }, [tickers]);

  const filteredSetups = useMemo(() => {
    return syncedSetups.filter((setup) => {
      if (selectedUnderlying !== "ALL" && setup.symbol !== selectedUnderlying) {
        return false;
      }
      if (selectedStrategy === "MOMENTUM" && setup.strategy_classification !== "DIRECTIONAL_MOMENTUM_BUY") {
        return false;
      }
      if (selectedStrategy === "THETA" && setup.strategy_classification !== "THETA_DECAY_HARVEST") {
        return false;
      }
      if (selectedExpiry === "0DTE" && setup.expiration_type !== "0DTE") {
        return false;
      }
      if (selectedExpiry === "SHORT_TERM" && setup.expiration_type === "0DTE") {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "confluence") {
        return b.confluence_score - a.confluence_score;
      }
      if (sortBy === "iv_rank") {
        return b.iv_rank - a.iv_rank;
      }
      if (sortBy === "theta") {
        return Math.abs(b.greeks.theta) - Math.abs(a.greeks.theta);
      }
      return 0;
    });
  }, [syncedSetups, selectedUnderlying, selectedStrategy, selectedExpiry, sortBy]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Macro Options Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <Zap className="w-4 h-4 fill-amber-400" />
              <span>Institutional 0DTE & Short-Term Options Radar</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              High-Velocity Delta & Gamma Telemetry Engine
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Real-time dealer Gamma Exposure (GEX), Implied Volatility (IV) vs Realized Volatility spread analysis, and precise strike selection for same-day & short-duration options. Filtered strictly for institutional liquid contracts.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2 min-w-[240px] text-xs font-mono">
            <div className="flex justify-between items-center text-slate-400">
              <span>SPY 0DTE Implied Vol:</span>
              <span className="text-amber-400 font-bold">{OPTIONS_MARKET_OVERVIEW.spy_0dte_iv}%</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Aggregate Market GEX:</span>
              <span className="text-emerald-400 font-bold">Positive Gamma</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>SPY Zero-Gamma Level:</span>
              <span className="text-cyan-400 font-bold">${OPTIONS_MARKET_OVERVIEW.zero_gamma_level}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Theta Decay Velocity:</span>
              <span className="text-rose-400 font-bold animate-pulse">Peak Afternoon</span>
            </div>
          </div>
        </div>

        {/* 4 Telemetry Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Dealer Regime</span>
            <span className="text-sm font-bold text-emerald-400 block mt-0.5">Long Market Maker Gamma</span>
            <span className="text-[10px] text-slate-400">Upside damped by dealer pinning</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Max Delta Velocity</span>
            <span className="text-sm font-bold text-amber-400 block mt-0.5">25 Delta OTM Sweeps</span>
            <span className="text-[10px] text-slate-400">Optimal gamma-to-theta capture</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Time-Stop Protocol</span>
            <span className="text-sm font-bold text-cyan-400 block mt-0.5">45-Minute Max Hold</span>
            <span className="text-[10px] text-slate-400">Prevents end-of-day decay traps</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">VIX Term Structure</span>
            <span className="text-sm font-bold text-white block mt-0.5">{OPTIONS_MARKET_OVERVIEW.vix_current} (Contango)</span>
            <span className="text-[10px] text-slate-400">Normal premium term decay</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Controls & Filters */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Underlyings Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">Underlyings:</span>
            {["ALL", "SPY", "QQQ", "NVDA", "BTC"].map((sym) => (
              <button
                key={`opt-underlying-${sym}`}
                onClick={() => setSelectedUnderlying(sym)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedUnderlying === sym
                    ? "bg-slate-100 text-slate-950 shadow-sm"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {sym === "ALL" ? "All Liquid Assets" : sym}
              </button>
            ))}
          </div>

          {/* Strategy Classification Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">Classification:</span>
            <button
              onClick={() => setSelectedStrategy("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedStrategy === "ALL"
                  ? "bg-slate-100 text-slate-950"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              All Strategies
            </button>
            <button
              onClick={() => setSelectedStrategy("MOMENTUM")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedStrategy === "MOMENTUM"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-950 text-amber-400 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Directional Momentum</span>
            </button>
            <button
              onClick={() => setSelectedStrategy("THETA")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedStrategy === "THETA"
                  ? "bg-cyan-500 text-slate-950"
                  : "bg-slate-950 text-cyan-400 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Theta Harvest</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Line */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Expiration:</span>
            <button
              onClick={() => setSelectedExpiry("ALL")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedExpiry === "ALL" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              All Tenors
            </button>
            <button
              onClick={() => setSelectedExpiry("0DTE")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedExpiry === "0DTE" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "text-slate-400 hover:text-white"
              }`}
            >
              ⚡ 0DTE Only
            </button>
            <button
              onClick={() => setSelectedExpiry("SHORT_TERM")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedExpiry === "SHORT_TERM" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              1DTE / Weekly
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Sort Order:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="confluence">Highest Confluence Score</option>
              <option value="iv_rank">Highest IV Rank</option>
              <option value="theta">Highest Theta Decay Rate</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Active Options Setups List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            Active Short-Duration Options Opportunities ({filteredSetups.length} Verified)
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Auto-refreshed with real-time pricing & Greek sensitivity
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSetups.map((setup) => {
            const isMom = setup.strategy_classification === "DIRECTIONAL_MOMENTUM_BUY";
            return (
              <div
                key={setup.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg relative overflow-hidden group"
              >
                {/* Glow accent */}
                <div
                  className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 ${
                    isMom ? "bg-amber-500" : "bg-cyan-500"
                  }`}
                />

                <div className="space-y-4">
                  {/* Top line with symbol, contract & Strategy Classification Badge */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xl font-black text-white">{setup.symbol}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          ${setup.underlying_price.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {setup.expiration_type}
                        </span>
                      </div>
                      <h4 className="font-mono text-sm font-extrabold text-white mt-1">
                        {setup.recommended_contract}
                      </h4>
                      <p className="text-xs text-cyan-400 font-medium font-mono">
                        {setup.strike_selection} • Target: {setup.target_delta}
                      </p>
                    </div>

                    {/* 2. Strategy Classification Badge */}
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-xs uppercase font-extrabold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-sm ${
                          isMom
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                            : "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
                        }`}
                      >
                        {isMom ? <Zap className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {isMom ? "Directional Momentum Buy" : "Theta Decay Harvest"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Mid: <strong className="text-white">${setup.mid_price.toFixed(2)}</strong> ({setup.bid_ask})
                      </span>
                    </div>
                  </div>

                  {/* 1. Options Telemetry Panel Grid */}
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    {/* IV Rank */}
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800/40">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans">IV Rank</span>
                      <span className="font-bold text-white text-sm">{setup.iv_rank}%</span>
                      <span className={`text-[10px] block ${setup.iv_rank > 65 ? "text-amber-400" : "text-emerald-400"}`}>
                        {setup.iv_rank > 65 ? "Elevated IV" : "Optimal IV"}
                      </span>
                    </div>

                    {/* IV vs RV Spread */}
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800/40">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans">IV vs RV Spread</span>
                      <span className="font-bold text-cyan-300 text-sm">+{setup.iv_rv_spread.toFixed(1)}%</span>
                      <span className="text-[10px] text-slate-400 block">
                        {setup.iv_rv_spread > 8 ? "Rich (Sell Favored)" : "Tight Spread"}
                      </span>
                    </div>

                    {/* GEX State */}
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800/40">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans">GEX State</span>
                      <span
                        className={`text-[11px] font-bold block truncate ${
                          setup.gex_state === "POSITIVE_GAMMA"
                            ? "text-emerald-400"
                            : setup.gex_state === "NEGATIVE_GAMMA"
                            ? "text-rose-400"
                            : "text-amber-400"
                        }`}
                      >
                        {setup.gex_state.replace("_", " ")}
                      </span>
                      <span className="text-[9px] text-slate-500 truncate block">
                        {setup.gex_net_value.split(" ")[0]}
                      </span>
                    </div>

                    {/* Theta Decay Risk */}
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800/40">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans">Theta Risk</span>
                      <span
                        className={`text-[11px] font-bold block truncate ${
                          setup.theta_decay_risk === "EXTREME_EXPIRING"
                            ? "text-rose-400"
                            : "text-amber-400"
                        }`}
                      >
                        {setup.theta_decay_risk.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block truncate">
                        {setup.theta_rate}
                      </span>
                    </div>
                  </div>

                  {/* 3. Risk & Execution Parameters Box */}
                  <div className="space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-slate-400">Max Hold Time:</span>
                        <strong className="text-white">{setup.max_holding_time}</strong>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="text-slate-400">Target:</span>
                        <span className="text-emerald-400 font-bold">{setup.profit_target.split("(")[0]}</span>
                      </div>
                    </div>

                    {/* Explicit Gamma Risk Warning */}
                    <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-[11px] text-rose-200 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <span className="leading-snug">{setup.gamma_risk_warning}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer with Confluence & Actions */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-mono">Quant Confluence</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        {setup.confluence_score}% Institutional Score
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveSetupForModal(setup)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Options Chain & Greeks</span>
                    </button>
                    <button
                      onClick={() => {
                        if (onSimulateTrade) onSimulateTrade(setup.recommended_contract);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1 transition-all"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Simulate Order</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inspection Modal */}
      {activeSetupForModal && (
        <OptionDetailModal
          setup={activeSetupForModal}
          onClose={() => setActiveSetupForModal(null)}
          onSimulateOrder={(setup) => {
            if (onSimulateTrade) onSimulateTrade(setup.recommended_contract);
          }}
        />
      )}
    </div>
  );
};
