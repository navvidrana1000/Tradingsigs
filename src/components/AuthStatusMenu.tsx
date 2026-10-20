import React, { useState, useRef, useEffect } from "react";
import {
  User,
  LogOut,
  ShieldCheck,
  Shield,
  ChevronDown,
  Clock,
  Sparkles,
  LogIn,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AuthStatusMenuProps {
  onOpenAdminModal: () => void;
}

export const AuthStatusMenu: React.FC<AuthStatusMenuProps> = ({ onOpenAdminModal }) => {
  const {
    firebaseUser,
    userProfile,
    isSuperAdmin,
    isAdmin,
    signInWithGoogle,
    signOut,
    pendingUsersCount,
    loading,
  } = useAuth();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.warn("Sign in cancelled or failed:", err);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="h-8 w-24 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
    );
  }

  if (!firebaseUser) {
    return (
      <button
        onClick={handleSignIn}
        disabled={isSigningIn}
        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        title="Sign in with Google to access terminal credentials"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>{isSigningIn ? "Connecting..." : "Sign In"}</span>
      </button>
    );
  }

  const displayName = userProfile?.displayName || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Trader";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border text-xs transition-all cursor-pointer shadow-sm ${
          isAdmin
            ? "bg-slate-950 hover:bg-slate-900 border-cyan-500/40 text-slate-200"
            : "bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300"
        }`}
      >
        {firebaseUser.photoURL ? (
          <img
            src={firebaseUser.photoURL}
            alt={displayName}
            className="w-5 h-5 rounded-full object-cover border border-slate-700"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
            {displayName[0].toUpperCase()}
          </div>
        )}

        <span className="font-semibold text-xs text-white max-w-[100px] truncate hidden sm:inline">
          {displayName}
        </span>

        {isSuperAdmin ? (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
            Super Admin
          </span>
        ) : isAdmin ? (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
            Admin
          </span>
        ) : (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase">
            Trader
          </span>
        )}

        {isAdmin && pendingUsersCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] font-mono animate-bounce">
            {pendingUsersCount}
          </span>
        )}

        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-2 animate-fadeIn backdrop-blur-md">
          {/* User Info Header */}
          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
            <p className="text-xs font-bold text-white truncate">{displayName}</p>
            <p className="text-[11px] font-mono text-slate-400 truncate">{firebaseUser.email}</p>
            <div className="flex items-center gap-2 pt-1 text-[10px] font-mono">
              <span className="text-slate-500">Status:</span>
              <span className="text-emerald-400 font-bold uppercase">{userProfile?.status || "Approved"}</span>
              <span className="text-slate-500">•</span>
              <span className="text-cyan-400 font-bold uppercase">{userProfile?.role || (isAdmin ? "Admin" : "Trader")}</span>
            </div>
          </div>

          {/* Admin Management Action */}
          {isAdmin && (
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAdminModal();
              }}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-500/40 flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Admin Approval Portal</span>
              </div>
              {pendingUsersCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] font-mono">
                  {pendingUsersCount}
                </span>
              )}
            </button>
          )}

          {/* Sign Out Button */}
          <button
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
