import React, { useState } from "react";
import {
  Compass,
  ShieldCheck,
  Lock,
  Sparkles,
  ArrowRight,
  Activity,
  Zap,
  Cpu,
  BarChart3,
  AlertCircle,
  Users,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { BOOTSTRAP_ADMIN_EMAIL } from "../lib/firebase";

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, error } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication was canceled or encountered an issue.";
      setAuthError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between max-w-6xl mx-auto w-full pb-6 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-xl shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Compass className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <h1 className="font-black text-sm tracking-widest text-white uppercase leading-none">
              ALPHA TERMINAL
            </h1>
            <p className="text-[10px] font-mono text-emerald-400 font-bold mt-1">
              INSTITUTIONAL QUANT SUITE
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">Firebase Auth & Firestore Gatekeeper</span>
        </div>
      </header>

      {/* Main Center Content */}
      <main className="relative z-10 max-w-5xl mx-auto w-full my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Platform Overview */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Role-Based Access Control & Approver Gate</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
              Institutional Strategy Execution & Alpha Lab
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              High-frequency quantitative scanner monitoring 84 multi-asset instruments across Crypto, Forex, Commodities, and Indices with Ornstein-Uhlenbeck mean-reversion and Brownian Bridge regime detection.
            </p>
          </div>

          {/* Key Feature Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                <Activity className="w-4 h-4 shrink-0" />
                <span>84 Instruments</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Binance 24/7 stream + PAXG Gold + Twelve Data WebSocket feed.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
                <Zap className="w-4 h-4 shrink-0" />
                <span>Binary Sniper</span>
              </div>
              <p className="text-[11px] text-slate-400">
                1m / 3m / 5m micro-pullback triggers with strict peak-buy guards.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
                <Cpu className="w-4 h-4 shrink-0" />
                <span>Risk Supervisor</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Normalized R-multiples and automated break-even profit locking.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Box */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl space-y-6">
            {/* Top Badge */}
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400">
                  <Lock className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">
                  Trader Sign-In Portal
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Firebase Secure
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Authorize Terminal Access
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sign in with your corporate or trading Google account. Super Admin approval is required before live order execution and testing suites are enabled.
              </p>
            </div>

            {/* Error Message if Any */}
            {(authError || error) && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="text-[11px] leading-tight">
                  {authError || error}
                </span>
              </div>
            )}

            {/* Google Sign-In Action */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 group"
            >
              {/* Google G SVG */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#ffffff"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#ffffff"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#ffffff"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#ffffff"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoggingIn ? "Authenticating via Firebase..." : "Sign In with Google"}</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Super Admin Notice Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-left text-xs">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                <Users className="w-4 h-4" />
                <span>Super Admin Approver Policy</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The designated Super Administrator (<code className="text-cyan-300 font-mono">{BOOTSTRAP_ADMIN_EMAIL}</code>) automatically holds full administrator privileges to inspect user logs, approve or decline pending accounts, and manage trader seats.
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero-Trust Security & Firestore RBAC Rules Enforced</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500 gap-2">
        <span>Institutional Alpha Terminal v3.4 • TimescaleDB & Firebase Edition</span>
        <span>Super Admin: {BOOTSTRAP_ADMIN_EMAIL}</span>
      </footer>
    </div>
  );
};
