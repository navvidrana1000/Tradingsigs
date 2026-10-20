import React, { useMemo } from "react";
import { INITIAL_OPTIONS_SETUPS, OPTIONS_MARKET_OVERVIEW, syncOptionWithLiveUnderlying, matchOptionUnderlying } from "../data/mockOptionsFeed";
import { OptionSetupRecord } from "../types/options";
import { AssetTicker } from "../types/signals";
import { Zap, Clock, ChevronRight, Gauge, AlertTriangle, ShieldCheck, Flame, TrendingUp, TrendingDown, Timer, Sparkles } from "lucide-react";

interface OptionsDashboardWidgetProps {
  tickers?: AssetTicker[];
  onOpenOptionsTab: () => void;
  onSelectOptionSetup: (setup: OptionSetupRecord) => void;
  onTestOptionExecution?: (setup: OptionSetupRecord) => void;
}

export const OptionsDashboardWidget: React.FC<OptionsDashboardWidgetProps> = ({
  tickers = [],
  onOpenOptionsTab,
  onSelectOptionSetup,
  onTestOptionExecution,
}) => {
  // Synchronize spotlight setups with real-time underlying tickers from Binance & NYSE/NASDAQ
  const liveSpotlightSetups = useMemo(() => {
    const rawSetups = INITIAL_OPTIONS_SETUPS.slice(0, 3);
    if (!tickers || tickers.length === 0) return rawSetups;

    return rawSetups.map((setup) => {
      const matched = tickers.find((t) => matchOptionUnderlying(setup.symbol, t.symbol));
      if (matched && matched.price) {
        return syncOptionWithLiveUnderlying(setup, matched.price);
      }
      return setup;
    });
  }, [tickers]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden space-y-4">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-3.5 border-b border-slate-800/80">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-400 shrink-0">
            <Zap className="w-5 h-5 fill-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-2 leading-tight">
                ⚡ Ultra-Short Options & 0DTE Radar (3-15 Min Timeline)
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="leading-none">Live Underlying Feeds</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              High-velocity delta & gamma setups • SPY, BTC, QQQ, NVDA • Live underlying streams with real pricing
            </p>
          </div>
        </div>

        <button
          onClick={onOpenOptionsTab}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white text-xs font-bold border border-slate-700 transition-all inline-flex items-center justify-center gap-1.5 self-start sm:self-center shrink-0 cursor-pointer shadow-sm"
        >
          <span className="leading-none">Open 3-15M Radar</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        </button>
      </div>

      {/* Live Options Telemetry Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs font-mono">
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">SPY 0DTE ATM IV</span>
          <span className="font-bold text-amber-400">{OPTIONS_MARKET_OVERVIEW.spy_0dte_iv}%</span>
        </div>
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Dealer Regime</span>
          <span className="font-bold text-emerald-400">Positive Gamma</span>
        </div>
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">SPY Zero-Gamma</span>
          <span className="font-bold text-cyan-400">${OPTIONS_MARKET_OVERVIEW.zero_gamma_level}</span>
        </div>
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Theta Burndown</span>
          <span className="font-bold text-rose-400 animate-pulse">Peak Velocity</span>
        </div>
      </div>

      {/* Spotlight Setup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {liveSpotlightSetups.map((setup) => {
          const isCall = setup.action_decision === "BUY CALL (LONG VOL)";
          return (
            <div
              key={`dashboard-opt-${setup.id}`}
              onClick={() => onSelectOptionSetup(setup)}
              className={`bg-slate-950/90 border rounded-xl p-3.5 flex flex-col justify-between transition-all cursor-pointer group hover:bg-slate-950 shadow-md ${
                isCall ? "border-emerald-500/30 hover:border-emerald-500/60" : "border-rose-500/30 hover:border-rose-500/60"
              }`}
            >
              <div className="space-y-2.5">
                {/* Top line with symbol, spot and Action Decision */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-base font-black text-white">{setup.symbol}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      ${setup.underlying_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    {setup.ai_confidence_score}% AI
                  </span>
                </div>

                {/* Bold Action Decision Badge */}
                <div>
                  <span
                    className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-lg border inline-flex items-center gap-1 shadow-sm ${
                      isCall
                        ? "bg-emerald-500 text-slate-950 border-emerald-400"
                        : "bg-rose-600 text-white border-rose-400"
                    }`}
                  >
                    {isCall ? <TrendingUp className="w-3 h-3 stroke-[2.5]" /> : <TrendingDown className="w-3 h-3 stroke-[2.5]" />}
                    {setup.action_decision}
                  </span>
                </div>

                {/* Contract Identifier */}
                <div className="font-mono">
                  <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    {setup.contract_identifier}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {setup.time_horizon}
                  </p>
                </div>

                {/* Execution Parameters: Entry Zone, TP, SL */}
                <div className="grid grid-cols-3 gap-1 text-[10px] font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block">Entry Zone:</span>
                    <span className="font-bold text-amber-300 truncate block">{setup.entry_premium_zone}</span>
                  </div>
                  <div>
                    <span className="text-emerald-400/90 block">TP (+35%):</span>
                    <span className="font-bold text-emerald-400 block">${setup.take_profit_price.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-rose-400/90 block">SL (-25%):</span>
                    <span className="font-bold text-rose-400 block">${setup.stop_loss_price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Quantitative Metrics: IV/RV, Delta Velocity, Theta Risk */}
                <div className="grid grid-cols-3 gap-1 text-[9px] font-mono bg-slate-900/40 px-2 py-1.5 rounded border border-slate-800/40 text-slate-400">
                  <div>
                    <span className="text-slate-500 block">IV/RV:</span>
                    <span className="text-cyan-300 font-bold">{setup.iv_rv_spread_ratio.split(" ")[0]}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Δ Velocity:</span>
                    <span className="text-amber-300 font-bold">{setup.delta_velocity.split(" ")[0]}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Theta Risk:</span>
                    <span className="text-rose-400 font-bold">{setup.theta_decay_risk_indicator}</span>
                  </div>
                </div>
              </div>

              {/* Action Prompt */}
              <div className="pt-2 mt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                {onTestOptionExecution ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTestOptionExecution(setup);
                    }}
                    className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Zap className="w-3 h-3 fill-amber-300" />
                    <span>Test Execution</span>
                  </button>
                ) : (
                  <span className="text-rose-400 font-sans font-medium text-[10px] truncate max-w-[160px]">
                    ⚠️ Extreme 0DTE Gamma
                  </span>
                )}
                <span className="text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                  Inspect Greeks <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
