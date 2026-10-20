import React from "react";
import { AssetTicker } from "../types/signals";
import { Gauge, CheckCircle2, AlertOctagon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TelemetryDrawerProps {
  tickers: AssetTicker[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const TelemetryDrawer: React.FC<TelemetryDrawerProps> = ({
  tickers,
  selectedSymbol,
  onSelectSymbol,
}) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Gauge className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-white text-sm tracking-wide">
            Multi-Asset Microstructure & Fractal Telemetry Matrix
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Updated causally on every closed candle
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {tickers.map((ticker) => {
          const isSelected = selectedSymbol === ticker.symbol;
          const isBull = ticker.trend === "BULLISH";
          const isBear = ticker.trend === "BEARISH";

          // Squeeze check
          const isSqueezeRisk =
            (ticker.vwap_z > 2.5 && ticker.delta_z > 1.5 && ticker.hurst > 0.58) ||
            (ticker.vwap_z < -2.5 && ticker.delta_z < -1.5 && ticker.hurst > 0.58);

          return (
            <button
              key={ticker.symbol}
              onClick={() => onSelectSymbol(ticker.symbol)}
              className={`text-left p-3 rounded-xl border transition-all ${
                isSelected
                  ? "bg-slate-800 border-cyan-500 shadow-md ring-1 ring-cyan-500/50"
                  : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-white">
                  {ticker.symbol}
                </span>
                <span
                  className={`text-[10px] font-mono font-semibold ${
                    ticker.change_24h >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {ticker.change_24h >= 0 ? "+" : ""}
                  {ticker.change_24h}%
                </span>
              </div>

              <div className="mt-2 text-sm font-mono font-bold text-slate-200">
                ${ticker.price.toLocaleString()}
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-1 text-[10px] font-mono">
                <span className="text-slate-400">VWAP Z:</span>
                <span
                  className={`text-right font-semibold ${
                    ticker.vwap_z >= 1.5
                      ? "text-emerald-400"
                      : ticker.vwap_z <= -1.5
                      ? "text-rose-400"
                      : "text-slate-300"
                  }`}
                >
                  {ticker.vwap_z > 0 ? "+" : ""}
                  {ticker.vwap_z.toFixed(2)}
                </span>

                <span className="text-slate-400">Delta Z:</span>
                <span
                  className={`text-right font-semibold ${
                    ticker.delta_z >= 1.5
                      ? "text-emerald-400"
                      : ticker.delta_z <= -1.5
                      ? "text-rose-400"
                      : "text-slate-300"
                  }`}
                >
                  {ticker.delta_z > 0 ? "+" : ""}
                  {ticker.delta_z.toFixed(2)}
                </span>

                <span className="text-slate-400">Hurst H:</span>
                <span
                  className={`text-right font-semibold ${
                    ticker.hurst >= 0.60
                      ? "text-cyan-400"
                      : ticker.hurst < 0.45
                      ? "text-amber-400"
                      : "text-slate-400"
                  }`}
                >
                  {ticker.hurst.toFixed(2)}
                </span>

                <span className="text-slate-400">Regime:</span>
                <span className="text-right flex items-center justify-end gap-1">
                  {isBull ? (
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  ) : isBear ? (
                    <TrendingDown className="w-3 h-3 text-rose-400" />
                  ) : (
                    <Minus className="w-3 h-3 text-slate-400" />
                  )}
                  <span
                    className={
                      isBull
                        ? "text-emerald-400"
                        : isBear
                        ? "text-rose-400"
                        : "text-slate-400"
                    }
                  >
                    {ticker.trend}
                  </span>
                </span>
              </div>

              {isSqueezeRisk && (
                <div className="mt-2 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                  <AlertOctagon className="w-2.5 h-2.5" />
                  SQUEEZE LOCKOUT
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
