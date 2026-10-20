import { useState, useEffect, useRef, useCallback } from "react";
import { ActiveStrategyTest } from "../types/strategyTest";
import { calculateLiveOptionPrice } from "./quantMath";
import { triggerTp1HitNotification } from "./browserNotifications";
import {
  saveTestHistoryToFirestore,
  getTestingLabHistoryFromFirestore,
  clearTestingLabHistoryInFirestore,
} from "../lib/firebaseService";

const STORAGE_KEY = "alpha_strategy_tests_v2";

export function useStrategyTestingLab(
  liveTickers: { symbol: string; price: number }[],
  onToast?: (message: string) => void,
  userId?: string
) {
  const userIdRef = useRef(userId);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const [tests, setTests] = useState<ActiveStrategyTest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Failed reading saved tests:", e);
    }
    return [];
  });

  // Sync with Firestore history when authenticated
  useEffect(() => {
    if (!userId) return;
    getTestingLabHistoryFromFirestore(userId)
      .then((history) => {
        if (history && history.length > 0) {
          setTests((prev) => {
            const active = prev.filter((t) => t.status === "OPEN" || t.status === "TP1_LOCKED");
            const existingIds = new Set(active.map((t) => t.id));
            const newHistory = history.filter((h) => !existingIds.has(h.id));
            return [...active, ...newHistory];
          });
        }
      })
      .catch((e) => {
        console.warn("Firestore history sync notice:", e);
      });
  }, [userId]);

  const onToastRef = useRef(onToast);
  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
    } catch (e) {
      console.error("Failed persisting tests:", e);
    }
  }, [tests]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    onToastRef.current?.(msg);
    setTimeout(() => setToastMessage(null), 4500);
  }, []);

  /**
   * CRITICAL BUG 3 FIX (PART 2): Duplicate Correlated Stacking Guard
   * Prevents opening more than 1 active test per asset + direction at the same time.
   */
  const checkDuplicateGuard = useCallback(
    (symbol: string, direction: string): boolean => {
      const normalizedDir = direction.includes("LONG") || direction.includes("CALL") || direction.includes("BULLISH")
        ? "BULLISH"
        : "BEARISH";

      const hasDuplicate = tests.some((t) => {
        if (t.symbol !== symbol) return false;
        if (t.status !== "OPEN" && t.status !== "TP1_LOCKED") return false;
        const testNormDir = t.direction.includes("LONG") || t.direction.includes("CALL") || t.direction.includes("BULLISH")
          ? "BULLISH"
          : "BEARISH";
        return testNormDir === normalizedDir;
      });

      if (hasDuplicate) {
        showToast(
          `⚠️ Duplicate Test Guard: Active ${normalizedDir} test already open for ${symbol}. Correlated duplicate stacking prevented to preserve risk limits.`
        );
        return true;
      }
      return false;
    },
    [tests, showToast]
  );

  /**
   * Deploy Directional Spot / Perp Test
   */
  const deployDirectionalTest = useCallback(
    (params: {
      symbol: string;
      name?: string;
      assetClass?: string;
      direction: "LONG" | "SHORT";
      entryPrice: number;
      stopLoss: number;
      tp1: number;
      tp2?: number;
      quantity?: number;
      riskDollars?: number;
    }) => {
      if (checkDuplicateGuard(params.symbol, params.direction)) return false;
      const fillPrice = params.entryPrice;
      const initialStopLoss = params.stopLoss;
      const initialRiskDistance = Math.max(
        Math.abs(fillPrice - initialStopLoss),
        fillPrice * 0.0015
      );
      const riskDollars = params.riskDollars || 100;
      const quantity =
        params.quantity ||
        Number((riskDollars / initialRiskDistance).toFixed(params.entryPrice < 5 ? 1 : 4));

      const newTest: ActiveStrategyTest = {
        id: `test-dir-${params.symbol}-${Date.now().toString(36)}`,
        symbol: params.symbol,
        name: params.name || params.symbol,
        asset_class: params.assetClass || "CRYPTO",
        strategy_type: "DIRECTIONAL_SCALP",
        direction: params.direction,
        contract_identifier: `${params.symbol} ${params.direction}`,
        entry_price: params.entryPrice,
        current_price: params.entryPrice,
        entry_spot_price: params.entryPrice,
        current_spot_price: params.entryPrice,
        entrySpotPrice: params.entryPrice,
        currentSpotPrice: params.entryPrice,
        stop_loss: params.stopLoss,
        initialStopLoss,
        initialRiskDistance,
        riskPerTradeDollars: riskDollars,
        tp1_price: params.tp1,
        tp2_price: params.tp2,
        quantity,
        opened_at: new Date().toISOString(),
        status: "OPEN",
        floating_pnl_dollars: 0,
        floating_r: 0,
        max_favorable_r: 0,
        max_adverse_r: 0,
      };

      setTests((prev) => [newTest, ...prev]);
      showToast(`⚡ Simulated ${params.symbol} ${params.direction} deployed at $${params.entryPrice.toLocaleString()}!`);
      return true;
    },
    [checkDuplicateGuard, showToast]
  );

  /**
   * Deploy Binary Options Test (1m / 3m / 5m Expiry)
   * CRITICAL: Binary options hold strictly until expiration; NEVER trigger early SL!
   */
  const deployBinaryTest = useCallback(
    (params: {
      symbol: string;
      action: "BUY CALL (HIGHER)" | "BUY PUT (LOWER)";
      strikePrice: number;
      currentPrice: number;
      expiryHorizon: "1m" | "3m" | "5m";
      riskDollars?: number;
      assetClass?: string;
    }) => {
      const isCall = params.action.includes("CALL");
      const dir = isCall ? "CALL" : "PUT";
      if (checkDuplicateGuard(params.symbol, dir)) return false;

      const durationSeconds = params.expiryHorizon === "1m" ? 60 : params.expiryHorizon === "3m" ? 180 : 300;
      const stakeDollars = params.riskDollars || 100;

      const newTest: ActiveStrategyTest = {
        id: `test-bin-${params.symbol}-${Date.now().toString(36)}`,
        symbol: params.symbol,
        name: params.symbol,
        asset_class: params.assetClass || "CRYPTO",
        strategy_type: "BINARY_OPTION",
        direction: dir,
        contract_identifier: `${params.symbol} ${params.expiryHorizon.toUpperCase()} ${dir}`,
        strike_price: params.strikePrice,
        entry_price: params.currentPrice,
        current_price: params.currentPrice,
        // Split tracking for spot and stake premium
        entry_spot_price: params.currentPrice,
        current_spot_price: params.currentPrice,
        entrySpotPrice: params.currentPrice,
        currentSpotPrice: params.currentPrice,
        entry_option_premium: stakeDollars,
        current_option_premium: stakeDollars,
        entryOptionPremium: stakeDollars,
        currentOptionPremium: stakeDollars,
        expiry_duration_seconds: durationSeconds,
        time_remaining_seconds: durationSeconds,
        stop_loss: 0, // Disabled: Binary options settle exclusively upon 00:00 expiration!
        tp1_price: params.strikePrice,
        quantity: 1,
        opened_at: new Date().toISOString(),
        status: "OPEN",
        floating_pnl_dollars: 0,
        floating_r: 0,
        max_favorable_r: 0,
        max_adverse_r: 0,
      };

      setTests((prev) => [newTest, ...prev]);
      showToast(`⏱️ Binary Sniper Test Deployed: ${newTest.contract_identifier} (Strike $${params.strikePrice.toLocaleString()})!`);
      return true;
    },
    [checkDuplicateGuard, showToast]
  );

  /**
   * Deploy 0DTE / Intraday Option Test
   * CRITICAL BUG 1 FIX: Store entrySpotPrice & entryOptionPremium separately!
   */
  const deployOptionTest = useCallback(
    (params: {
      symbol: string;
      contractIdentifier: string;
      optionType: "CALL" | "PUT";
      underlyingSpotPrice: number;
      entryOptionPremium: number;
      takeProfitPremium: number;
      stopLossPremium: number;
      delta?: number;
      gamma?: number;
      theta?: number;
      riskDollars?: number;
    }) => {
      if (checkDuplicateGuard(params.symbol, params.optionType)) return false;

      const spotAtFill = params.underlyingSpotPrice;
      const premAtFill = params.entryOptionPremium;

      const newTest: ActiveStrategyTest = {
        id: `test-opt-${params.symbol}-${Date.now().toString(36)}`,
        symbol: params.symbol,
        name: params.symbol,
        asset_class: "OPTIONS",
        strategy_type: "0DTE_OPTION",
        direction: params.optionType,
        contract_identifier: params.contractIdentifier,
        entry_price: premAtFill, // Option Premium fill
        current_price: premAtFill, // Current Option Premium
        // Split tracking for Spot price vs Option Premium
        entry_spot_price: spotAtFill, // Spot at fill (e.g. $81,333)
        current_spot_price: spotAtFill,
        entrySpotPrice: spotAtFill,
        currentSpotPrice: spotAtFill,
        entry_option_premium: premAtFill,
        current_option_premium: premAtFill,
        entryOptionPremium: premAtFill,
        currentOptionPremium: premAtFill,
        stop_loss: params.stopLossPremium, // Option SL premium (e.g. $1.85)
        tp1_price: params.takeProfitPremium, // Option TP premium (e.g. $3.40)
        option_delta: params.delta ?? (params.optionType === "CALL" ? 0.52 : -0.48),
        option_gamma: params.gamma ?? 0.0004,
        theta_decay_per_sec: params.theta ? Math.abs(params.theta) / 3600 : 0.0008,
        quantity: 1,
        opened_at: new Date().toISOString(),
        status: "OPEN",
        floating_pnl_dollars: 0,
        floating_r: 0,
        max_favorable_r: 0,
        max_adverse_r: 0,
      };

      setTests((prev) => [newTest, ...prev]);
      showToast(`⚡ 0DTE Option Test Deployed: ${params.contractIdentifier} at Premium $${params.entryOptionPremium.toFixed(2)} (Spot $${params.underlyingSpotPrice.toLocaleString()})!`);
      return true;
    },
    [checkDuplicateGuard, showToast]
  );

  /**
   * Lock Stop-Loss to Breakeven
   */
  const lockBreakEven = useCallback(
    (id: string) => {
      setTests((prev) =>
        prev.map((t) => {
          if (t.id === id && t.status === "OPEN") {
            showToast(`🛡️ Stop-loss locked at Break-Even ($${t.entry_price.toFixed(t.entry_price < 5 ? 4 : 2)}) for ${t.contract_identifier || t.symbol}`);
            return {
              ...t,
              status: "TP1_LOCKED",
              stop_loss: t.entry_price,
            };
          }
          return t;
        })
      );
    },
    [showToast]
  );

  /**
   * Manually Close a Test Position
   */
  const closeTest = useCallback(
    (id: string, reason = "MANUAL_CLOSE") => {
      setTests((prev) =>
        prev.map((t) => {
          if (t.id === id && (t.status === "OPEN" || t.status === "TP1_LOCKED")) {
            showToast(`Position closed: ${t.contract_identifier || t.symbol} (${t.floating_r >= 0 ? "+" : ""}${t.floating_r.toFixed(2)}R)`);
            const exitSpot = t.current_spot_price ?? t.currentSpotPrice ?? t.current_price;
            const exitPrem = t.current_option_premium ?? t.currentOptionPremium ?? t.current_price;
            const closed: ActiveStrategyTest = {
              ...t,
              status: "MANUAL_CLOSED",
              closed_at: new Date().toISOString(),
              realized_r: t.floating_r,
              realized_pnl_dollars: t.floating_pnl_dollars,
              close_reason: reason,
              exit_spot_price: exitSpot,
              exitSpotPrice: exitSpot,
              exit_option_premium: exitPrem,
              exitOptionPremium: exitPrem,
            };
            if (userIdRef.current) {
              saveTestHistoryToFirestore(userIdRef.current, closed).catch(() => {});
            }
            return closed;
          }
          return t;
        })
      );
    },
    [showToast]
  );

  /**
   * Clear Closed Tests History (Local and Firestore)
   */
  const clearHistory = useCallback(() => {
    setTests((prev) => prev.filter((t) => t.status === "OPEN" || t.status === "TP1_LOCKED"));
    if (userIdRef.current) {
      clearTestingLabHistoryInFirestore(userIdRef.current).catch(() => {});
    }
    showToast("Strategy testing history cleared.");
  }, [showToast]);

  // Second timer for Binary Options countdown & theta decay
  useEffect(() => {
    const timer = setInterval(() => {
      setTests((prev) => {
        const hasBinary = prev.some(
          (t) => t.strategy_type === "BINARY_OPTION" && (t.status === "OPEN" || t.status === "TP1_LOCKED")
        );
        if (!hasBinary) return prev;

        let changed = false;
        const next = prev.map((t) => {
          if (t.strategy_type === "BINARY_OPTION" && (t.status === "OPEN" || t.status === "TP1_LOCKED")) {
            changed = true;
            const remaining = Math.max(0, (t.time_remaining_seconds ?? 60) - 1);
            if (remaining === 0) {
              // Binary Option Settle at Expiration: ONLY graded upon 00:00 expiration!
              const isCall = t.direction === "CALL" || t.direction === "BULLISH";
              const strike = t.strike_price ?? t.entry_spot_price ?? t.entrySpotPrice ?? t.entry_price;
              const curSpot = t.current_spot_price ?? t.currentSpotPrice ?? t.current_price;
              const diff = curSpot - strike;
              const stake = t.entryOptionPremium ?? t.entry_option_premium ?? 100;

              // Check for ATM push tie (Math.abs(expirySpotPrice - strikePrice) <= 1e-8)
              if (Math.abs(diff) <= 1e-8 || (strike > 0 && Math.abs(diff) / strike <= 1e-6)) {
                const atmPush: ActiveStrategyTest = {
                  ...t,
                  time_remaining_seconds: 0,
                  status: "ATM_PUSH" as ActiveStrategyTest["status"],
                  closed_at: new Date().toISOString(),
                  realized_r: 0,
                  realized_pnl_dollars: 0,
                  floating_r: 0,
                  floating_pnl_dollars: 0,
                  exit_spot_price: curSpot,
                  exitSpotPrice: curSpot,
                  exit_option_premium: stake,
                  exitOptionPremium: stake,
                  close_reason: `ATM Push / Exact Tie at Expiry (Strike $${strike}) - Full Stake Refunded`,
                };
                if (userIdRef.current) {
                  saveTestHistoryToFirestore(userIdRef.current, atmPush).catch(() => {});
                }
                return atmPush;
              }

              const isWin = isCall ? diff > 0 : diff < 0;
              const realizedR = isWin ? 0.85 : -1.0;
              const realizedDollars = isWin ? Number((stake * 0.85).toFixed(2)) : -stake;

              const closedExpiry: ActiveStrategyTest = {
                ...t,
                time_remaining_seconds: 0,
                status: (isWin ? "CLOSED_EXPIRY_WIN" : "CLOSED_EXPIRY_LOSS") as ActiveStrategyTest["status"],
                closed_at: new Date().toISOString(),
                realized_r: realizedR,
                realized_pnl_dollars: realizedDollars,
                floating_r: realizedR,
                floating_pnl_dollars: realizedDollars,
                exit_spot_price: curSpot,
                exitSpotPrice: curSpot,
                exit_option_premium: isWin ? stake * 1.85 : 0,
                exitOptionPremium: isWin ? stake * 1.85 : 0,
                close_reason: isWin
                  ? `Settled ITM (${diff > 0 ? "Above" : "Below"} Strike $${strike.toLocaleString()})`
                  : `Settled OTM at Expiry (Strike $${strike.toLocaleString()})`,
              };
              if (userIdRef.current) {
                saveTestHistoryToFirestore(userIdRef.current, closedExpiry).catch(() => {});
              }
              return closedExpiry;
            }
            return {
              ...t,
              time_remaining_seconds: remaining,
            };
          }
          return t;
        });
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Tick-by-tick mark-to-market evaluation against authentic live prices
  useEffect(() => {
    if (!liveTickers || liveTickers.length === 0) return;
    const livePricesBySymbol: Record<string, number> = {};
    for (const t of liveTickers) {
      if (t.symbol && typeof t.price === "number" && t.price > 0) {
        livePricesBySymbol[t.symbol] = t.price;
      }
    }

    const eventsToFire: Array<() => void> = [];

    setTests((prev) => {
      const hasActive = prev.some((t) => t.status === "OPEN" || t.status === "TP1_LOCKED");
      if (!hasActive) return prev;

      let changed = false;
      const next = prev.map((t) => {
        if (t.status !== "OPEN" && t.status !== "TP1_LOCKED") return t;

        // Strict immutable symbol lookup
        const liveSpot =
          livePricesBySymbol[t.symbol] ??
          (t.symbol.endsWith("USDT") ? undefined : livePricesBySymbol[`${t.symbol}USDT`]);
        if (!liveSpot || liveSpot <= 0) return t;

        // Discard any corrupted tick spike > 15% from entry price (prevents cross-asset tick poisoning)
        const refPrice = t.entry_spot_price || t.entrySpotPrice || t.entry_price;
        if (refPrice > 0 && Math.abs(liveSpot - refPrice) / refPrice > 0.15) {
          return t;
        }

        const now = Date.now();
        const openedTime = new Date(t.opened_at).getTime();
        const elapsedSecs = Math.max(0, Math.floor((now - openedTime) / 1000));

        // 1. DIRECTIONAL SPOT / PERP STRATEGY
        if (t.strategy_type === "DIRECTIONAL_SCALP" || t.strategy_type === "DIRECTIONAL_SWING") {
          const isLong = t.direction === "LONG" || t.direction === "BULLISH";
          const curPrice = liveSpot;
          const entry = t.entry_price;
          // Normalized risk geometry: NEVER overwrite initialRiskDistance when Lock Break-Even is clicked!
          const initialRiskDist =
            t.initialRiskDistance ||
            Math.max(
              Math.abs(entry - (t.initialStopLoss || t.stop_loss)),
              entry * 0.0015
            );
          const priceDiff = isLong ? curPrice - entry : entry - curPrice;
          const rExcursion = priceDiff / initialRiskDist;
          const riskDollars = t.riskPerTradeDollars || 100;
          const pnlDollars = rExcursion * riskDollars;

          let newStatus: ActiveStrategyTest["status"] = t.status;
          let newSl = t.stop_loss;
          let realizedR = t.realized_r;
          let realizedDollars = t.realized_pnl_dollars;
          let closedAt = t.closed_at;
          let closeReason = t.close_reason;

          // Check TP1 target hit: Move stop to Breakeven & Lock Win!
          // Requires at least 3 seconds of live trade duration and real price movement
          const precision = entry < 1 ? 5 : entry < 10 ? 4 : 2;
          if (t.status === "OPEN" && elapsedSecs >= 3) {
            const hitTp1 = (isLong && curPrice >= t.tp1_price) || (!isLong && curPrice <= t.tp1_price);
            if (hitTp1) {
              newStatus = "TP1_LOCKED";
              newSl = entry; // Move Stop to Breakeven
              eventsToFire.push(() => {
                showToast(`🎯 [${t.symbol}] Hit TP1 target ($${t.tp1_price.toFixed(precision)})! Stop moved to Breakeven.`);
                triggerTp1HitNotification({
                  symbol: t.symbol,
                  currentPrice: curPrice,
                  entryPrice: entry,
                  rLocked: 0.75,
                });
              });
            }
          }

          // Check TP2 Runner hit (Requires at least 3 seconds of live trade duration)
          if (t.tp2_price && elapsedSecs >= 3) {
            const hitTp2 = (isLong && curPrice >= t.tp2_price) || (!isLong && curPrice <= t.tp2_price);
            if (hitTp2) {
              newStatus = "CLOSED_TP2";
              realizedR = 2.0;
              realizedDollars = 2.0 * riskDollars;
              closedAt = new Date().toISOString();
              closeReason = "TP2 Runner Target Achieved";
              eventsToFire.push(() => {
                showToast(`🏆 [${t.symbol}] TP2 Runner Hit (+2.00R)! Full position closed in profit.`);
              });
            }
          }

          // Check Stop-Loss (Requires at least 3 seconds of live trade duration)
          if (newStatus === "OPEN" && elapsedSecs >= 3) {
            const hitSl = (isLong && curPrice <= newSl) || (!isLong && curPrice >= newSl);
            if (hitSl) {
              newStatus = "CLOSED_SL";
              realizedR = -1.0;
              realizedDollars = -riskDollars;
              closedAt = new Date().toISOString();
              closeReason = "Stop-Loss Hit";
            }
          } else if (newStatus === "TP1_LOCKED" && elapsedSecs >= 3) {
            // If already locked TP1, price returning to entry closes at Breakeven with locked 70% TP1 profit!
            const hitBe = (isLong && curPrice <= newSl) || (!isLong && curPrice >= newSl);
            if (hitBe) {
              newStatus = "CLOSED_TP1";
              realizedR = 0.75; // Secure locked 70% profit!
              realizedDollars = 0.75 * riskDollars;
              closedAt = new Date().toISOString();
              closeReason = "Breakeven Stop Closed after TP1 Lock";
              eventsToFire.push(() => {
                showToast(`🛡️ [${t.symbol}] Breakeven stop triggered after locking TP1 (+0.75R profit secured).`);
              });
            }
          }

          const priceDiffFromLast = Math.abs(curPrice - t.current_spot_price);
          const statusChanged = newStatus !== t.status;
          const slChanged = newSl !== t.stop_loss;

          // If no meaningful price move and no status change, return original object reference
          if (priceDiffFromLast < 0.000001 && !statusChanged && !slChanged) {
            return t;
          }

          changed = true;
          const updatedTest: ActiveStrategyTest = {
            ...t,
            current_price: curPrice,
            current_spot_price: curPrice,
            currentSpotPrice: curPrice,
            entrySpotPrice: t.entrySpotPrice ?? t.entry_spot_price,
            stop_loss: newSl,
            status: newStatus,
            floating_r: Number(rExcursion.toFixed(2)),
            floating_pnl_dollars: Number(pnlDollars.toFixed(2)),
            max_favorable_r: Number(Math.max(t.max_favorable_r, rExcursion).toFixed(2)),
            max_adverse_r: Number(Math.max(t.max_adverse_r, -rExcursion).toFixed(2)),
            realized_r: realizedR,
            realized_pnl_dollars: realizedDollars,
            closed_at: closedAt,
            close_reason: closeReason,
            exit_spot_price: newStatus.startsWith("CLOSED") ? curPrice : undefined,
            exitSpotPrice: newStatus.startsWith("CLOSED") ? curPrice : undefined,
          };

          if (statusChanged && newStatus.startsWith("CLOSED") && userIdRef.current) {
            saveTestHistoryToFirestore(userIdRef.current, updatedTest).catch(() => {});
          }

          return updatedTest;
        }

        // 2. BINARY OPTION STRATEGY
        // CRITICAL ENGINE RULE: Binary options are strictly graded upon expiration (00:00).
        // They NEVER trigger early Stop-Loss or premature exit under any market tick!
        if (t.strategy_type === "BINARY_OPTION") {
          const isCall = t.direction === "CALL" || t.direction === "BULLISH";
          const strike = t.strike_price ?? t.entry_spot_price ?? t.entrySpotPrice ?? t.entry_price;
          const isCurrentlyWinning = isCall ? liveSpot > strike : liveSpot < strike;
          const floatingR = isCurrentlyWinning ? 0.85 : -0.75;
          const stake = t.entryOptionPremium ?? t.entry_option_premium ?? 100;
          const floatingDollars = Number((floatingR * stake).toFixed(2));

          const priceDiff = Math.abs(liveSpot - (t.current_spot_price ?? t.currentSpotPrice ?? 0));
          const floatingChanged = floatingR !== t.floating_r;

          if (priceDiff < 0.000001 && !floatingChanged) {
            return t;
          }

          changed = true;
          return {
            ...t,
            current_price: liveSpot,
            current_spot_price: liveSpot,
            currentSpotPrice: liveSpot,
            entrySpotPrice: t.entrySpotPrice ?? t.entry_spot_price ?? t.entry_price,
            entryOptionPremium: stake,
            currentOptionPremium: stake,
            current_option_premium: stake,
            // CRITICAL: NEVER set status to CLOSED_SL or alter status to premature exit!
            status: (t.status === "TP1_LOCKED" ? "TP1_LOCKED" : "OPEN") as ActiveStrategyTest["status"],
            floating_r: floatingR,
            floating_pnl_dollars: floatingDollars,
            max_favorable_r: Math.max(t.max_favorable_r, floatingR),
            max_adverse_r: Math.max(t.max_adverse_r, -floatingR),
          };
        }

        // 3. 0DTE / INTRADAY OPTION STRATEGY (CRITICAL BUG 1 FIX: OPTION PRICING VIA GREEKS)
        if (t.strategy_type === "0DTE_OPTION") {
          const isCall = t.direction === "CALL" || t.direction === "BULLISH";
          const entryPrem = t.entry_option_premium ?? t.entryOptionPremium ?? t.entry_price;
          const entrySpot = t.entry_spot_price ?? t.entrySpotPrice ?? liveSpot;

          const liveOptionPrice = calculateLiveOptionPrice({
            entryOptionPremium: entryPrem,
            entrySpotPrice: entrySpot,
            currentSpotPrice: liveSpot,
            isCall,
            optionDelta: t.option_delta,
            optionGamma: t.option_gamma,
            thetaDecayPerSec: t.theta_decay_per_sec,
            elapsedSeconds: elapsedSecs,
          });

          const optRiskUnit = Math.max(0.1, entryPrem - t.stop_loss);
          const optProfit = liveOptionPrice - entryPrem;
          const optR = optProfit / optRiskUnit;
          const optPnlDollars = (optProfit / entryPrem) * 100;

          let newStatus: ActiveStrategyTest["status"] = t.status;
          let realizedR = t.realized_r;
          let realizedDollars = t.realized_pnl_dollars;
          let closedAt = t.closed_at;
          let closeReason = t.close_reason;

          // Evaluate TP strictly against Option Premium (e.g. $3.40)
          if (liveOptionPrice >= t.tp1_price) {
            newStatus = "CLOSED_TP1";
            realizedR = Number(optR.toFixed(2));
            realizedDollars = Number(optPnlDollars.toFixed(2));
            closedAt = new Date().toISOString();
            closeReason = `Option TP Target Hit ($${liveOptionPrice.toFixed(2)})`;
            eventsToFire.push(() => {
              showToast(`🎯 Option TP Hit: ${t.contract_identifier} reached $${liveOptionPrice.toFixed(2)} (+${optR.toFixed(2)}R)!`);
            });
          } else if (liveOptionPrice <= t.stop_loss) {
            // Evaluate SL strictly against Option Premium (e.g. $1.85)
            newStatus = "CLOSED_SL";
            realizedR = -1.0;
            realizedDollars = -100;
            closedAt = new Date().toISOString();
            closeReason = `Option Stop-Loss Hit ($${liveOptionPrice.toFixed(2)})`;
          }

          const priceDiff = Math.abs(liveSpot - (t.current_spot_price ?? t.currentSpotPrice ?? 0));
          const optPriceDiff = Math.abs(liveOptionPrice - (t.current_option_premium ?? t.currentOptionPremium ?? 0));
          const statusChanged = newStatus !== t.status;

          if (priceDiff < 0.000001 && optPriceDiff < 0.01 && !statusChanged) {
            return t;
          }

          changed = true;
          return {
            ...t,
            current_price: liveOptionPrice, // Option Premium
            current_option_premium: liveOptionPrice,
            currentOptionPremium: liveOptionPrice,
            entryOptionPremium: entryPrem,
            entrySpotPrice: entrySpot,
            current_spot_price: liveSpot,
            currentSpotPrice: liveSpot,
            status: newStatus,
            floating_r: Number(optR.toFixed(2)),
            floating_pnl_dollars: Number(optPnlDollars.toFixed(2)),
            max_favorable_r: Number(Math.max(t.max_favorable_r, optR).toFixed(2)),
            max_adverse_r: Number(Math.max(t.max_adverse_r, -optR).toFixed(2)),
            realized_r: realizedR,
            realized_pnl_dollars: realizedDollars,
            closed_at: closedAt,
            close_reason: closeReason,
            exit_option_premium: newStatus.startsWith("CLOSED") ? liveOptionPrice : undefined,
            exitOptionPremium: newStatus.startsWith("CLOSED") ? liveOptionPrice : undefined,
            exit_spot_price: newStatus.startsWith("CLOSED") ? liveSpot : undefined,
            exitSpotPrice: newStatus.startsWith("CLOSED") ? liveSpot : undefined,
          };
        }

        return t;
      });

      return changed ? next : prev;
    });

    // Execute queued toasts / notifications outside of React updater
    for (const fn of eventsToFire) {
      fn();
    }
  }, [liveTickers]);

  const openTests = tests.filter((t) => t.status === "OPEN" || t.status === "TP1_LOCKED");
  const closedTests = tests.filter((t) => t.status !== "OPEN" && t.status !== "TP1_LOCKED");

  const totalFloatingR = Number(openTests.reduce((acc, t) => acc + t.floating_r, 0).toFixed(2));
  const totalFloatingPnl = Number(openTests.reduce((acc, t) => acc + t.floating_pnl_dollars, 0).toFixed(2));

  const totalClosedR = Number(closedTests.reduce((acc, t) => acc + (t.realized_r || 0), 0).toFixed(2));
  const winningClosed = closedTests.filter((t) => (t.realized_r || 0) > 0).length;
  const winRatePct = closedTests.length > 0 ? Math.round((winningClosed / closedTests.length) * 100) : 0;

  return {
    tests,
    openTests,
    closedTests,
    deployDirectionalTest,
    deployBinaryTest,
    deployOptionTest,
    closeTest,
    lockBreakEven,
    clearHistory,
    toastMessage,
    stats: {
      activeCount: openTests.length,
      closedCount: closedTests.length,
      totalFloatingR,
      totalFloatingPnl,
      totalClosedR,
      winRatePct,
    },
  };
}
