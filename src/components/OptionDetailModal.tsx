import React, { useState } from "react";
import { OptionSetupRecord } from "../types/options";
import {
  X,
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Clock,
  Gauge,
  Activity,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Sliders,
  DollarSign,
  BarChart2,
} from "lucide-react";

interface OptionDetailModalProps {
  setup: OptionSetupRecord | null;
  onClose: () => void;
  onSimulateOrder?: (setup: OptionSetupRecord) => void;
}

export const OptionDetailModal: React.FC<OptionDetailModalProps> = ({
  setup,
  onClose,
  onSimulateOrder,
}) => {
  const [copied, setCopied] = useState(false);
  const [simulatedMovePct, setSimulatedMovePct] = useState<number>(0);
  const [simulatedIvChange, setSimulatedIvChange] = useState<number>(0);
  const [simulatedHoursElapsed, setSimulatedHoursElapsed] = useState<number>(0.5);

  if (!setup) return null;

  const isMomentumBuy = setup.strategy_classification === "DIRECTIONAL_MOMENTUM_BUY";
  const isThetaHarvest = setup.strategy_classification === "THETA_DECAY_HARVEST";

  const handleCopyOrder = () => {
    const text = `[ALPHA TERMINAL 0DTE ORDER]
Underlying: ${setup.symbol} @ $${setup.underlying_price.toFixed(2)}
Contract: ${setup.recommended_contract} (${setup.strike_selection})
Strategy: ${setup.strategy_classification}
Target Delta: ${setup.target_delta} | IV Rank: ${setup.iv_rank}% | GEX: ${setup.gex_state}
Bid/Ask: ${setup.bid_ask} (Mid: $${setup.mid_price.toFixed(2)})
Execution Rule: ${setup.max_holding_time}
Stop Loss: ${setup.stop_loss_guideline}
Take Profit: ${setup.profit_target}
WARNING: ${setup.gamma_risk_warning}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Simplified Greek simulation for payoff scenario
  const deltaImpact = (setup.underlying_price * (simulatedMovePct / 100)) * setup.greeks.delta;
  const gammaImpact = 0.5 * setup.greeks.gamma * Math.pow(setup.underlying_price * (simulatedMovePct / 100), 2);
  const vegaImpact = simulatedIvChange * setup.greeks.vega;
  const thetaImpact = simulatedHoursElapsed * setup.greeks.theta;
  const estimatedContractChange = deltaImpact + gammaImpact + vegaImpact + thetaImpact;
  const estimatedNewPrice = Math.max(0.01, setup.mid_price + estimatedContractChange);
  const estimatedPnlPct = ((estimatedNewPrice - setup.mid_price) / setup.mid_price) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[94vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950 flex items-start justify-between gap-4 sticky top-0 z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xl sm:text-2xl font-black text-white">
                {setup.contract_identifier || setup.symbol}
              </span>
              <span
                className={`text-xs uppercase font-black px-3 py-1 rounded-xl border flex items-center gap-1.5 shadow-sm ${
                  setup.action_decision === "BUY CALL (LONG VOL)"
                    ? "bg-emerald-500 text-slate-950 border-emerald-400"
                    : "bg-rose-600 text-white border-rose-400"
                }`}
              >
                {setup.action_decision || (isMomentumBuy ? "BUY CALL (LONG VOL)" : "BUY PUT (SHORT VOL)")}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                {setup.ai_confidence_badge || `Confluence ${setup.confluence_score}%`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Underlying: <strong className="text-white font-mono">${setup.underlying_price.toFixed(2)}</strong> • {setup.name} • {setup.time_horizon || setup.expiry_formatted}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Top Contract Badge */}
          <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Contract Identifier & Execution Zone
              </p>
              <h3 className="text-lg sm:text-xl font-mono font-black text-white mt-0.5">
                {setup.contract_identifier}
              </h3>
              <p className="text-xs text-cyan-400 font-medium">
                {setup.strike_selection} • Target Delta: <strong>{setup.target_delta}</strong> • Velocity: <strong>{setup.delta_velocity}</strong>
              </p>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Premium Entry Zone</p>
                <p className="text-2xl font-black font-mono text-amber-300">
                  {setup.entry_premium_zone || `$${setup.mid_price.toFixed(2)}`}
                </p>
                <p className="text-[10px] text-emerald-400 font-mono font-bold">
                  TP: {setup.take_profit_formatted || setup.profit_target}
                </p>
                <p className="text-[10px] text-rose-400 font-mono">
                  SL: {setup.stop_loss_formatted || setup.stop_loss_guideline}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Spread: {setup.bid_ask}
                </p>
              </div>
            </div>
          </div>

          {/* Explicit Extreme Gamma Warning Box */}
          <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                  <span>Critical Expiration Gamma Risk Protocol</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                    Mandatory Enforcement
                  </span>
                </h4>
                <p className="text-xs text-rose-200/90 leading-relaxed font-sans">
                  {setup.gamma_risk_warning}
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Options Telemetry Panel Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              1. Quantitative Options Telemetry Panel
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* IV Rank */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Implied Vol (IV) Rank</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-black font-mono text-white">{setup.iv_rank}%</span>
                  <span className={`text-[10px] font-bold ${setup.iv_rank > 65 ? "text-amber-400" : "text-emerald-400"}`}>
                    {setup.iv_rank > 65 ? "Rich Premium" : "Favorable IV"}
                  </span>
                </div>
                {/* Visual bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      setup.iv_rank > 70 ? "bg-amber-400" : setup.iv_rank > 40 ? "bg-cyan-400" : "bg-emerald-400"
                    }`}
                    style={{ width: `${setup.iv_rank}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-1.5">30D IV: {setup.iv_pct}%</p>
              </div>

              {/* IV vs RV Spread */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">IV vs RV Spread</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-black font-mono text-cyan-300">
                    +{setup.iv_rv_spread.toFixed(1)}%
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Spread</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  IV {setup.iv_pct}% vs Realized {setup.rv_pct}%
                </p>
                <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                  {setup.iv_rv_spread > 8 ? "Rich (Favor Premium Sell)" : "Cheap (Favor Momentum Buy)"}
                </p>
              </div>

              {/* GEX Gamma State */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Dealer GEX State</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span
                    className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                      setup.gex_state === "POSITIVE_GAMMA"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : setup.gex_state === "NEGATIVE_GAMMA"
                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {setup.gex_state.replace("_", " ")}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-mono mt-2 truncate" title={setup.gex_net_value}>
                  {setup.gex_net_value}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                  {setup.gex_description}
                </p>
              </div>

              {/* Theta Decay Risk */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Theta Decay Risk</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span
                    className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                      setup.theta_decay_risk === "EXTREME_EXPIRING"
                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        : setup.theta_decay_risk === "HIGH_BURNDOWN"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {setup.theta_decay_risk.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm font-black font-mono text-amber-400 mt-2">
                  {setup.theta_rate}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Est. time to session close: {setup.time_to_close_minutes}m
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Strategy Classification & Mechanics */}
          <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                2. Strategy Classification Mechanics
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                Flow: <strong className="text-slate-200">{setup.flow_sentiment}</strong>
              </span>
            </div>
            <p className="text-sm font-bold text-white">
              {setup.strategy_headline}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              {setup.strategy_mechanics}
            </p>

            {/* Thesis bullets */}
            <div className="pt-2 border-t border-slate-800/60">
              <p className="text-[11px] text-slate-400 font-semibold mb-1">Quantitative Confirmation Factors:</p>
              <ul className="space-y-1 text-xs text-slate-300 font-mono">
                {setup.ai_thesis.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 3: Risk & Execution Parameters */}
          <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              3. Institutional Risk & Execution Parameters
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-500 font-mono text-[10px] uppercase block">
                  Holding Time Limit (Time-Stop)
                </span>
                <span className="text-white font-bold block mt-1">
                  {setup.max_holding_time}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Enforces strict exit before final 0DTE volatility collapse.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-500 font-mono text-[10px] uppercase block">
                  Target Profit Objective
                </span>
                <span className="text-emerald-400 font-bold block mt-1 font-mono">
                  {setup.profit_target}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Take partials at first delta velocity expansion.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-500 font-mono text-[10px] uppercase block">
                  Disciplined Stop-Loss Rule
                </span>
                <span className="text-rose-400 font-bold block mt-1 font-mono">
                  {setup.stop_loss_guideline}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Zero room for hope trading on expiring contracts.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Greek Payoff & Scenario Engine */}
          <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Live Greek Scenario Simulator
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                Real-Time Delta & Gamma Sensitivity
              </span>
            </div>

            {/* Greek Pills */}
            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <p className="text-[10px] text-slate-500">DELTA</p>
                <p className="text-xs font-bold text-white">{setup.greeks.delta > 0 ? `+${setup.greeks.delta}` : setup.greeks.delta}</p>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <p className="text-[10px] text-slate-500">GAMMA</p>
                <p className="text-xs font-bold text-amber-400">{setup.greeks.gamma}</p>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <p className="text-[10px] text-slate-500">THETA</p>
                <p className="text-xs font-bold text-rose-400">{setup.greeks.theta}</p>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <p className="text-[10px] text-slate-500">VEGA</p>
                <p className="text-xs font-bold text-cyan-400">{setup.greeks.vega}</p>
              </div>
            </div>

            {/* Scenario Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Underlying Shift:</span>
                  <strong className="font-mono text-white">
                    {simulatedMovePct > 0 ? `+${simulatedMovePct.toFixed(1)}%` : `${simulatedMovePct.toFixed(1)}%`}
                  </strong>
                </div>
                <input
                  type="range"
                  min="-2.0"
                  max="2.0"
                  step="0.1"
                  value={simulatedMovePct}
                  onChange={(e) => setSimulatedMovePct(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>IV Change:</span>
                  <strong className="font-mono text-white">
                    {simulatedIvChange > 0 ? `+${simulatedIvChange}%` : `${simulatedIvChange}%`}
                  </strong>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  value={simulatedIvChange}
                  onChange={(e) => setSimulatedIvChange(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Time Passed:</span>
                  <strong className="font-mono text-white">{simulatedHoursElapsed} Hours</strong>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.1"
                  value={simulatedHoursElapsed}
                  onChange={(e) => setSimulatedHoursElapsed(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            {/* Estimated Scenario Result */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Simulated Contract Outcome</p>
                <p className="text-xs text-slate-300">
                  Entry: ${setup.mid_price.toFixed(2)} → <strong className="text-white font-mono">${estimatedNewPrice.toFixed(2)}</strong>
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-base font-black font-mono ${
                    estimatedPnlPct >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {estimatedPnlPct >= 0 ? `+${estimatedPnlPct.toFixed(1)}%` : `${estimatedPnlPct.toFixed(1)}%`}
                </span>
                <p className="text-[10px] text-slate-500">Projected PnL</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-10">
          <button
            onClick={handleCopyOrder}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? "Directives Copied to Clipboard!" : "Copy Order Directives"}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                if (onSimulateOrder) onSimulateOrder(setup);
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>Simulate Terminal Execution</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
