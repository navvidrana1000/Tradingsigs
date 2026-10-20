import React, { useState } from "react";
import { ActiveStrategyTest } from "../types/strategyTest";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  X,
  ShieldCheck,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Timer,
} from "lucide-react";

interface ActiveStrategyTestsTrayProps {
  tests: ActiveStrategyTest[];
  onCloseTest: (id: string, reason: string) => void;
  onClearHistory?: () => void;
  onLockBreakEven: (id: string) => void;
}

export const ActiveStrategyTestsTray: React.FC<ActiveStrategyTestsTrayProps> = ({
  tests,
  onCloseTest,
  onClearHistory,
  onLockBreakEven,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [filter, setFilter] = useState<"ACTIVE" | "HISTORY">("ACTIVE");

  const openTests = tests.filter((t) => t.status === "OPEN" || t.status === "TP1_LOCKED");
  const closedTests = tests.filter(
    (t) => t.status !== "OPEN" && t.status !== "TP1_LOCKED"
  );

  const totalFloatingPnl = openTests.reduce((acc, t) => acc + t.floating_pnl_dollars, 0);
  const totalFloatingR = openTests.reduce((acc, t) => acc + t.floating_r, 0);
  const totalOpenRisk = openTests.reduce((acc, t) => acc + (t.risk_dollars || 0), 0);

  const totalClosedR = closedTests.reduce((acc, t) => acc + (t.realized_r || 0), 0);
  const winningClosed = closedTests.filter((t) => (t.realized_r || 0) > 0).length;
  const closedWinRate =
    closedTests.length > 0
      ? Math.round((winningClosed / closedTests.length) * 100)
      : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
      {/* Header bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
                ⚡ Real-Time Strategy Execution & Testing Lab
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Mark-to-Market Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Active strategy positions revalued tick-by-tick with authentic Unit Separation (Spot vs Option Premium)
            </p>
          </div>
        </div>

        {/* Telemetry quick stats */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center space-x-4 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
            <div>
              <span className="text-slate-500 text-[10px] block">Active Tests:</span>
              <span className="font-bold text-white">{openTests.length} open</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-500 text-[10px] block">Floating PnL:</span>
              <span
                className={`font-black ${
                  totalFloatingR >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {totalFloatingR >= 0 ? "+" : ""}
                {totalFloatingR.toFixed(2)}R (${totalFloatingPnl >= 0 ? "+" : ""}
                {totalFloatingPnl.toFixed(2)})
                {totalOpenRisk > 0 && (
                  <span className="ml-2 text-zinc-400">| Risk ${totalOpenRisk.toFixed(0)}</span>
                )}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-500 text-[10px] block">Test Win Rate:</span>
              <span className="font-bold text-cyan-400">
                {closedWinRate}% ({closedTests.length} completed)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilter("ACTIVE")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filter === "ACTIVE"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Active ({openTests.length})
            </button>
            <button
              onClick={() => setFilter("HISTORY")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filter === "HISTORY"
                  ? "bg-slate-800 text-cyan-400 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              History ({closedTests.length})
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isExpanded ? "Collapse Lab" : "Expand Lab"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isExpanded && (
        <div className="p-4 sm:p-5">
          {filter === "ACTIVE" && (
            <div>
              {openTests.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                  <div className="inline-flex p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-400 mb-2">
                    <Play className="w-5 h-5 text-emerald-400 ml-0.5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">
                    No Active Strategy Tests Running
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Click <strong>"Execute Simulated Trade"</strong> or <strong>"Simulate Binary Sniper Execution"</strong> in the Inspector Drawer to deploy an authentic paper trade!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {openTests.map((t) => {
                    const isCallOrLong =
                      t.direction === "LONG" ||
                      t.direction === "CALL" ||
                      t.direction === "BULLISH";
                    const isOption = t.strategy_type === "0DTE_OPTION";
                    const isBinary = t.strategy_type === "BINARY_OPTION";
                    const spotPrecision = t.current_spot_price < 5 ? 4 : 2;

                    return (
                      <div
                        key={t.id}
                        className="bg-slate-950 border border-slate-800/90 rounded-xl p-3.5 space-y-3 relative overflow-hidden shadow-lg group hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-black text-sm text-white">
                              {t.contract_identifier || t.symbol}
                            </span>
                            <span
                              className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${
                                isCallOrLong
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {t.direction}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                              {t.strategy_type.replace("DIRECTIONAL_", "").replace("_OPTION", "")}
                            </span>
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-xs font-black font-mono block ${
                                t.floating_r >= 0 ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {t.floating_r >= 0 ? "+" : ""}
                              {t.floating_r.toFixed(2)}R
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ${t.floating_pnl_dollars >= 0 ? "+" : ""}
                              {t.floating_pnl_dollars.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* CASE A: 0DTE OPTION CARD (Unit Separation: Option Premium vs Spot Price) */}
                        {isOption && (
                          <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/70 font-mono text-[10px]">
                            <div className="grid grid-cols-2 gap-2 pb-1.5 border-b border-slate-800/60">
                              <div>
                                <span className="text-slate-500 block">Fill Premium:</span>
                                <span className="text-slate-200 font-semibold">
                                  ${(t.entry_option_premium ?? t.entry_price).toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-cyan-400 block flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                                  Live Premium:
                                </span>
                                <span className="text-white font-black">
                                  ${(t.current_option_premium ?? t.current_price).toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-slate-400 pt-0.5">
                              <div>
                                <span>Spot: </span>
                                <strong className="text-slate-200">${t.current_spot_price.toLocaleString(undefined, { minimumFractionDigits: spotPrecision, maximumFractionDigits: spotPrecision })}</strong>
                              </div>
                              <div>
                                <span>TP: </span>
                                <strong className="text-emerald-400">${t.tp1_price.toFixed(2)}</strong>
                                <span className="text-slate-500"> | SL: </span>
                                <strong className="text-rose-400">${t.stop_loss.toFixed(2)}</strong>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* CASE B: BINARY OPTION CARD (Settles at 00:00 - No Early SL!) */}
                        {isBinary && (
                          <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-cyan-800/40 font-mono text-[10px]">
                            <div className="grid grid-cols-2 gap-2 pb-1.5 border-b border-slate-800/60">
                              <div>
                                <span className="text-slate-500 block">Strike Price:</span>
                                <span className="text-slate-200 font-semibold">
                                  ${(t.strike_price ?? t.entry_spot_price).toLocaleString(undefined, { minimumFractionDigits: spotPrecision, maximumFractionDigits: spotPrecision })}
                                </span>
                              </div>
                              <div>
                                <span className="text-cyan-400 block flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                                  Live Spot:
                                </span>
                                <span className="text-white font-black">
                                  ${t.current_spot_price.toLocaleString(undefined, { minimumFractionDigits: spotPrecision, maximumFractionDigits: spotPrecision })}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-amber-400 pt-0.5">
                              <span className="flex items-center gap-1 font-bold">
                                <Timer className="w-3 h-3 animate-pulse" />
                                Expiry in: {Math.floor((t.time_remaining_seconds ?? 60) / 60)}:
                                {String((t.time_remaining_seconds ?? 60) % 60).padStart(2, "0")}s
                              </span>
                              <span className="text-[9px] text-cyan-300">
                                Settles at 00:00 (Hold to Expiry)
                              </span>
                            </div>
                          </div>
                        )}

                        {/* CASE C: DIRECTIONAL SPOT / PERP CARD */}
                        {!isOption && !isBinary && (
                          <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono bg-slate-900/60 p-2 rounded-lg border border-slate-800/70">
                            <div>
                              <span className="text-slate-500 block">Fill Price:</span>
                              <span className="text-slate-200 font-semibold truncate block">
                                ${t.entry_price.toLocaleString(undefined, { minimumFractionDigits: spotPrecision, maximumFractionDigits: spotPrecision })}
                              </span>
                            </div>
                            <div>
                              <span className="text-cyan-400 block flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                                Live Price:
                              </span>
                              <span className="text-white font-black truncate block">
                                ${t.current_price.toLocaleString(undefined, { minimumFractionDigits: spotPrecision, maximumFractionDigits: spotPrecision })}
                              </span>
                            </div>
                            <div>
                              <span className="text-emerald-400 block">TP1 Target:</span>
                              <span className="text-emerald-300 font-semibold truncate block">
                                ${t.tp1_price.toLocaleString(undefined, { minimumFractionDigits: spotPrecision, maximumFractionDigits: spotPrecision })}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Status bar */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {new Date(t.opened_at).toLocaleTimeString()}
                          </span>
                          {t.status === "TP1_LOCKED" ? (
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Stop Locked @ Break-Even
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">
                              MFE: +{t.max_favorable_r.toFixed(2)}R
                            </span>
                          )}
                        </div>

                        {/* Order controls */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          {!isBinary && (
                            <button
                              onClick={() => onLockBreakEven(t.id)}
                              disabled={t.status === "TP1_LOCKED"}
                              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors disabled:opacity-40 cursor-pointer"
                            >
                              Lock Break-Even
                            </button>
                          )}
                          <button
                            onClick={() => onCloseTest(t.id, "MANUAL_CLOSE")}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 text-slate-300 border border-slate-700 transition-all cursor-pointer flex items-center gap-1 ml-auto"
                          >
                            <X className="w-3 h-3" />
                            <span>Close Position</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {filter === "HISTORY" && (
            <div>
              {closedTests.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No completed strategy tests in this session yet.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-bold text-slate-300">
                      Completed Strategy Tests: {closedTests.length}
                    </span>
                    {onClearHistory && (
                      <button
                        onClick={onClearHistory}
                        className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Clear History
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-800/60 font-mono text-xs max-h-60 overflow-y-auto">
                    {closedTests.map((t) => {
                      const isWin = (t.realized_r || 0) > 0;
                      const isOption = t.strategy_type === "0DTE_OPTION";
                      const isBinary = t.strategy_type === "BINARY_OPTION";

                      return (
                        <div
                          key={t.id}
                          className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-300"
                        >
                          <div className="flex items-center space-x-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isWin ? "bg-emerald-400" : "bg-rose-400"
                              }`}
                            />
                            <span className="font-bold text-white">
                              {t.contract_identifier || t.symbol}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ({t.direction})
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                isWin
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {t.status.replace("CLOSED_", "")}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 text-right">
                            {/* CRITICAL BUG 1 FIX: Display BOTH Option Premium & Spot Price */}
                            {isOption && (
                              <span className="text-[10px] text-slate-400">
                                Fill Prem: ${(t.entry_option_premium ?? t.entry_price).toFixed(2)} → Exit Prem: ${(t.exit_option_premium ?? t.current_price).toFixed(2)} | Spot: ${t.current_spot_price.toLocaleString()}
                              </span>
                            )}

                            {isBinary && (
                              <span className="text-[10px] text-slate-400">
                                Strike: ${(t.strike_price ?? t.entry_spot_price).toLocaleString()} → Expiry Spot: ${(t.exit_spot_price ?? t.current_spot_price).toLocaleString()}
                              </span>
                            )}

                            {!isOption && !isBinary && (
                              <span className="text-[10px] text-slate-400">
                                Fill: ${t.entry_price.toLocaleString()} → Exit: ${(t.exit_spot_price ?? t.current_price).toLocaleString()}
                              </span>
                            )}

                            <span
                              className={`font-black whitespace-nowrap ${
                                isWin ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {(t.realized_r || 0) >= 0 ? "+" : ""}
                              {(t.realized_r || 0).toFixed(2)}R ($
                              {(t.realized_pnl_dollars || 0) >= 0 ? "+" : ""}
                              {(t.realized_pnl_dollars || 0).toFixed(2)})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
