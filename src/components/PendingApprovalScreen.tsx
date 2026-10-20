import React from "react";
import {
  ShieldAlert,
  Clock,
  LogOut,
  Sparkles,
  Lock,
  Compass,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const PendingApprovalScreen: React.FC = () => {
  const { firebaseUser, userProfile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Gate Card */}
      <div className="max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 text-center backdrop-blur-xl">
        {/* Brand Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shadow-xl shadow-amber-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
        </div>

        {/* Title and Subtitle */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Verification In Progress</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Account Awaiting Super Admin Approval
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Your Institutional Alpha Terminal account is registered. In accordance with compliance and risk supervision guardrails, new accounts require authorization from the Super Administrator (<strong className="text-cyan-300 font-mono">rnavvid1000@gmail.com</strong>) before live exchange feeds and execution tools can be unlocked.
          </p>
        </div>

        {/* Registered User Card */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-left space-y-3">
          <div className="flex items-center space-x-3">
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.displayName || "User"}
                className="w-11 h-11 rounded-full border border-slate-700 object-cover"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center">
                {(userProfile?.displayName || userProfile?.email || "T")[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">
                {userProfile?.displayName || "New Trader"}
              </p>
              <p className="text-xs font-mono text-slate-400 truncate">
                {userProfile?.email || firebaseUser?.email}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase">
              Pending
            </span>
          </div>

          <div className="border-t border-slate-800/80 pt-3 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Submitted:</span>
              <span className="font-mono text-slate-300">
                {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleString() : "Just now"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Security Clearance:</span>
              <span className="font-mono text-amber-400">Level 1 (Trader Review)</span>
            </div>
          </div>
        </div>

        {/* Live Listener Pulse Notice */}
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-3 text-left">
          <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
          <p className="text-[11px] leading-snug">
            <strong>Real-time channel active:</strong> You do not need to refresh this page. As soon as an administrator approves your account, the terminal will launch automatically.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => signOut()}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out / Switch Account</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          Administrator inboxes are notified of pending requests. Need expedited access? Contact your designated institutional supervisor.
        </p>
      </div>
    </div>
  );
};
