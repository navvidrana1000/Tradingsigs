/**
 * Basic unit tests for pure quant functions.
 * Run with: npx vitest or similar once installed.
 */
import { normalCDF, computeGarmanKlassVol, computeRSI, calculateEMA } from "../utils/quantMath";

function assertClose(actual: number, expected: number, tol = 1e-4) {
  if (Math.abs(actual - expected) > tol) {
    throw new Error(`Expected ~${expected}, got ${actual}`);
  }
}

// normalCDF sanity
assertClose(normalCDF(0), 0.5, 0.01);
assertClose(normalCDF(1.96), 0.975, 0.01);
assertClose(normalCDF(-1.96), 0.025, 0.01);

// Garman-Klass on flat bars
const flat = Array.from({ length: 10 }, () => ({ open: 100, high: 100.5, low: 99.5, close: 100 }));
const gk = computeGarmanKlassVol(flat);
if (gk <= 0 || gk > 0.05) throw new Error(`Unexpected GK vol: ${gk}`);

// RSI extremes
const rising = [100, 101, 102, 103, 104, 105, 106, 107];
const rsiUp = computeRSI(rising, 7);
if (rsiUp < 90) throw new Error(`Expected high RSI, got ${rsiUp}`);

const falling = [100, 99, 98, 97, 96, 95, 94, 93];
const rsiDown = computeRSI(falling, 7);
if (rsiDown > 10) throw new Error(`Expected low RSI, got ${rsiDown}`);

// EMA monotonic
const series = [10, 12, 11, 13, 14];
const ema = calculateEMA(series, 3);
if (ema.length !== series.length) throw new Error("EMA length mismatch");
if (ema[ema.length - 1] <= ema[0]) throw new Error("EMA should trend up");

console.log("quantMath unit tests passed");
