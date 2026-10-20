/**
 * Institutional Alpha Terminal - Firebase Service Layer
 * Secure persistence for User Settings, Twelve Data / Finnhub API keys,
 * Testing Lab Execution History, and Market Price Throttling Cache.
 */

import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "./firebase";
import { SupervisorConfig, DEFAULT_SUPERVISOR_CONFIG } from "../components/SettingsModal";
import { ActiveStrategyTest } from "../types/strategyTest";

export interface UserPersistedSettings {
  userId: string;
  twelveDataApiKey?: string;
  finnhubApiKey?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  riskPerTradeDollars?: number;
  risk_per_trade_pct?: number;
  account_balance?: number;
  auto_supervise_enabled?: boolean;
  minWinProb?: number;
  enforceDeltaAbsorption?: boolean;
  enforceHurstChopLockout?: boolean;
  enforceSqueezeGuard?: boolean;
  updatedAt: string;
}

/**
 * Persist user settings & API keys into Firestore: users/{uid}/settings/config
 */
export async function saveUserSettingsToFirestore(
  uid: string,
  config: Partial<SupervisorConfig>
): Promise<void> {
  const path = `users/${uid}/settings/config`;
  try {
    const docRef = doc(db, "users", uid, "settings", "config");
    const payload: UserPersistedSettings = {
      userId: uid,
      twelveDataApiKey: config.twelveDataApiKey || "",
      finnhubApiKey: config.finnhubApiKey || "",
      telegramBotToken: config.telegramBotToken || "",
      telegramChatId: config.telegramChatId || "",
      riskPerTradeDollars: config.riskPerTradeDollars ?? 100,
      risk_per_trade_pct: config.risk_per_trade_pct ?? 1.0,
      account_balance: config.account_balance ?? 10000,
      auto_supervise_enabled: config.auto_supervise_enabled ?? false,
      minWinProb: config.minWinProb ?? 0.72,
      enforceDeltaAbsorption: config.enforceDeltaAbsorption ?? true,
      enforceHurstChopLockout: config.enforceHurstChopLockout ?? true,
      enforceSqueezeGuard: config.enforceSqueezeGuard ?? true,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch user settings from Firestore
 */
export async function getUserSettingsFromFirestore(
  uid: string
): Promise<Partial<SupervisorConfig> | null> {
  const path = `users/${uid}/settings/config`;
  try {
    const docRef = doc(db, "users", uid, "settings", "config");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Partial<SupervisorConfig>;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Real-time listener for user settings in Firestore
 */
export function subscribeUserSettings(
  uid: string,
  onUpdate: (config: Partial<SupervisorConfig>) => void
): () => void {
  const path = `users/${uid}/settings/config`;
  const docRef = doc(db, "users", uid, "settings", "config");
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as Partial<SupervisorConfig>);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

/**
 * Save a closed Strategy Test to persistent Firestore history: users/{uid}/testingLabHistory/{testId}
 */
export async function saveTestHistoryToFirestore(
  uid: string,
  test: ActiveStrategyTest
): Promise<void> {
  const path = `users/${uid}/testingLabHistory/${test.id}`;
  try {
    const docRef = doc(db, "users", uid, "testingLabHistory", test.id);
    const payload = {
      id: test.id,
      userId: uid,
      symbol: test.symbol,
      name: test.name,
      asset_class: test.asset_class,
      strategy_type: test.strategy_type,
      direction: test.direction,
      entry_price: test.entry_price,
      current_price: test.current_price,
      status: test.status,
      realized_r: test.realized_r ?? 0,
      realized_pnl_dollars: test.realized_pnl_dollars ?? 0,
      opened_at: test.opened_at,
      closed_at: test.closed_at || new Date().toISOString(),
      close_reason: test.close_reason || "Trade Completed",
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load all testing lab history records from Firestore
 */
export async function getTestingLabHistoryFromFirestore(
  uid: string
): Promise<ActiveStrategyTest[]> {
  const path = `users/${uid}/testingLabHistory`;
  try {
    const colRef = collection(db, "users", uid, "testingLabHistory");
    const q = query(colRef, orderBy("opened_at", "desc"), limit(100));
    const snap = await getDocs(q);
    const list: ActiveStrategyTest[] = [];
    snap.forEach((d) => {
      list.push(d.data() as ActiveStrategyTest);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Real-time listener for testing lab history
 */
export function subscribeTestingLabHistory(
  uid: string,
  onUpdate: (tests: ActiveStrategyTest[]) => void
): () => void {
  const path = `users/${uid}/testingLabHistory`;
  const colRef = collection(db, "users", uid, "testingLabHistory");
  const q = query(colRef, orderBy("opened_at", "desc"), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      const list: ActiveStrategyTest[] = [];
      snap.forEach((d) => list.push(d.data() as ActiveStrategyTest));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

/**
 * Clear all testing lab history for a user
 */
export async function clearTestingLabHistoryInFirestore(uid: string): Promise<void> {
  const path = `users/${uid}/testingLabHistory`;
  try {
    const colRef = collection(db, "users", uid, "testingLabHistory");
    const snap = await getDocs(colRef);
    const batch = writeBatch(db);
    snap.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Cache market prices in Firestore for throttling protection
 */
export async function cacheMarketPricesToFirestore(
  prices: Record<string, number>
): Promise<void> {
  const path = "marketPrices/latest";
  try {
    const docRef = doc(db, "marketPrices", "latest");
    await setDoc(
      docRef,
      {
        timestamp: Date.now(),
        updatedAt: new Date().toISOString(),
        prices,
      },
      { merge: true }
    );
  } catch {
    // Non-blocking caching attempt
  }
}
