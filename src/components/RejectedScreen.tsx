import React from "react";
import { XCircle, LogOut, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const RejectedScreen: React.FC = () => {
  const { firebaseUser, userProfile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-rose-400" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-white tracking-tight">
            Terminal Access Request Declined
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your access request for account{" "}
            <strong className="text-slate-200">{userProfile?.email || firebaseUser?.email}</strong> has
            been declined by an administrator.
          </p>
        </div>

        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left text-xs text-slate-400 space-y-2">
          <div className="flex items-center space-x-2 text-rose-400 font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>Policy Notice</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            If you believe this was made in error or require special access credentials for algorithmic testing, please request your risk supervisor to re-evaluate your application in the Admin Portal.
          </p>
        </div>

        <button
          onClick={() => signOut()}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out / Switch Account</span>
        </button>
      </div>
    </div>
  );
};
