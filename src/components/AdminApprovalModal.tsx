import React, { useState } from "react";
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  X,
  UserCheck,
  UserX,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  UserPlus,
  Trash2,
  Crown,
} from "lucide-react";
import { useAuth, AppUserProfile } from "../context/AuthContext";
import { BOOTSTRAP_ADMIN_EMAIL } from "../lib/firebase";

interface AdminApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowNotification?: (msg: string) => void;
}

export const AdminApprovalModal: React.FC<AdminApprovalModalProps> = ({
  isOpen,
  onClose,
  onShowNotification,
}) => {
  const {
    allUsers,
    approveUser,
    rejectUser,
    toggleAdminRole,
    deleteUserRecord,
    simulateNewTraderRegistration,
    userProfile,
    isSuperAdmin,
  } = useAuth();
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED" | "ADMIN">("PENDING");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  if (!isOpen) return null;

  const filteredUsers = allUsers.filter((u) => {
    const matchFilter =
      filter === "ALL"
        ? true
        : filter === "PENDING"
        ? u.status === "pending"
        : filter === "APPROVED"
        ? u.status === "approved"
        : filter === "REJECTED"
        ? u.status === "rejected"
        : u.role === "admin";

    const query = searchQuery.trim().toLowerCase();
    const matchSearch =
      query === "" ||
      u.email.toLowerCase().includes(query) ||
      (u.displayName && u.displayName.toLowerCase().includes(query));

    return matchFilter && matchSearch;
  });

  const pendingCount = allUsers.filter((u) => u.status === "pending").length;
  const approvedCount = allUsers.filter((u) => u.status === "approved").length;
  const rejectedCount = allUsers.filter((u) => u.status === "rejected").length;
  const adminCount = allUsers.filter((u) => u.role === "admin").length;

  const handleApprove = async (u: AppUserProfile) => {
    setProcessingId(u.id);
    try {
      await approveUser(u.id);
      if (onShowNotification) {
        onShowNotification(`✅ Approved access for ${u.displayName || u.email}. Account now has full terminal privileges.`);
      }
    } catch (err: unknown) {
      if (onShowNotification) {
        onShowNotification(`❌ Approval failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (u: AppUserProfile) => {
    setProcessingId(u.id);
    try {
      await rejectUser(u.id);
      if (onShowNotification) {
        onShowNotification(`⚠️ Access rejected for ${u.displayName || u.email}.`);
      }
    } catch (err: unknown) {
      if (onShowNotification) {
        onShowNotification(`❌ Rejection failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleAdmin = async (u: AppUserProfile) => {
    setProcessingId(u.id);
    try {
      await toggleAdminRole(u.id, u.role, u.email);
      const isNowAdmin = u.role !== "admin";
      if (onShowNotification) {
        onShowNotification(
          isNowAdmin
            ? `🛡️ Promoted ${u.displayName || u.email} to Administrator.`
            : `Demoted ${u.displayName || u.email} to Trader.`
        );
      }
    } catch (err: unknown) {
      if (onShowNotification) {
        onShowNotification(`❌ Role change failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (u: AppUserProfile) => {
    if (!deleteUserRecord) return;
    setProcessingId(u.id);
    try {
      await deleteUserRecord(u.id);
      if (onShowNotification) {
        onShowNotification(`🗑️ Deleted record for ${u.displayName || u.email}.`);
      }
    } catch (err: unknown) {
      if (onShowNotification) {
        onShowNotification(`❌ Deletion failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleSimulateApplicant = async () => {
    if (!simulateNewTraderRegistration) return;
    setIsSimulating(true);
    const randomNum = Math.floor(Math.random() * 900 + 100);
    const demoNames = ["Marcus Vance", "Elena Rostova", "Liam O'Connor", "Aria Chen", "Devon Park"];
    const name = demoNames[Math.floor(Math.random() * demoNames.length)];
    const email = `${name.toLowerCase().replace(/['\s]/g, ".")}.${randomNum}@quanthedge.io`;

    try {
      await simulateNewTraderRegistration(name, email);
      setFilter("PENDING");
      if (onShowNotification) {
        onShowNotification(`📥 New simulated application created for ${name} (${email}). You can now test approving or rejecting.`);
      }
    } catch (err: unknown) {
      if (onShowNotification) {
        onShowNotification(`❌ Simulation error: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-cyan-500 text-slate-950 shadow-lg shadow-amber-500/20">
              <Crown className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  Super Admin Approver & Access Portal
                </h3>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Root Approver: {BOOTSTRAP_ADMIN_EMAIL}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Super Admin authorization required for all new trader accounts. Authorize, decline, or promote seats.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-center">
            <button
              onClick={handleSimulateApplicant}
              disabled={isSimulating}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Generate a realistic pending trader application in Firestore to test approval flows"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isSimulating ? "Adding..." : "Simulate Applicant"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* KPI Counter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-slate-950/40 border-b border-slate-800/80">
          <button
            onClick={() => setFilter("PENDING")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filter === "PENDING"
                ? "bg-amber-500/10 border-amber-500/50 shadow-sm"
                : "bg-slate-950/60 border-slate-800 hover:bg-slate-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Pending Approvals</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black font-mono text-amber-400 mt-1">
              {pendingCount}
            </p>
          </button>

          <button
            onClick={() => setFilter("APPROVED")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filter === "APPROVED"
                ? "bg-emerald-500/10 border-emerald-500/50 shadow-sm"
                : "bg-slate-950/60 border-slate-800 hover:bg-slate-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Approved Traders</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {approvedCount}
            </p>
          </button>

          <button
            onClick={() => setFilter("ADMIN")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filter === "ADMIN"
                ? "bg-cyan-500/10 border-cyan-500/50 shadow-sm"
                : "bg-slate-950/60 border-slate-800 hover:bg-slate-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Administrators</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-black font-mono text-cyan-400 mt-1">
              {adminCount}
            </p>
          </button>

          <button
            onClick={() => setFilter("REJECTED")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filter === "REJECTED"
                ? "bg-rose-500/10 border-rose-500/50 shadow-sm"
                : "bg-slate-950/60 border-slate-800 hover:bg-slate-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Declined Requests</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-black font-mono text-rose-400 mt-1">
              {rejectedCount}
            </p>
          </button>
        </div>

        {/* Filter Bar & Search */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {(["PENDING", "APPROVED", "ADMIN", "REJECTED", "ALL"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filter === tab
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {tab === "PENDING" && pendingCount > 0 ? `Pending (${pendingCount})` : tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* User List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800 space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-400">
                No users found matching current filter ({filter})
              </p>
              {filter === "PENDING" && (
                <p className="text-[11px] text-emerald-400">
                  🎉 All incoming access requests have been processed!
                </p>
              )}
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelf = u.id === userProfile?.id;
              const isProcessing = processingId === u.id;
              const isSuperAdminUser = u.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

              return (
                <div
                  key={u.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isSuperAdminUser
                      ? "bg-slate-950/90 border-amber-500/30 shadow-md shadow-amber-500/5"
                      : u.status === "pending"
                      ? "bg-slate-950/90 border-amber-500/40 shadow-sm"
                      : u.status === "approved"
                      ? "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                      : "bg-slate-950/40 border-rose-500/30 opacity-75"
                  }`}
                >
                  {/* User Profile Info */}
                  <div className="flex items-center space-x-3.5 min-w-0">
                    {u.photoURL ? (
                      <img
                        src={u.photoURL}
                        alt={u.displayName || "User"}
                        className="w-10 h-10 rounded-full border border-slate-700 object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center shrink-0">
                        {(u.displayName || u.email || "U")[0].toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white truncate">
                          {u.displayName || "Anonymous Trader"}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            You
                          </span>
                        )}

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                            u.status === "approved"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : u.status === "pending"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse"
                              : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {u.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
                          {u.status === "pending" && <Clock className="w-3 h-3" />}
                          {u.status === "rejected" && <XCircle className="w-3 h-3" />}
                          <span>{u.status}</span>
                        </span>

                        {/* Role Badge */}
                        {isSuperAdminUser ? (
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm shadow-amber-500/20">
                            <Crown className="w-3 h-3 text-amber-400" />
                            <span>Super Admin</span>
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                              u.role === "admin"
                                ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                          >
                            {u.role}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-mono text-slate-400 truncate mt-0.5">
                        {u.email}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-1 flex-wrap">
                        <span>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                        {u.approvedBy && (
                          <span>
                            Verified by: <strong className="text-slate-400">{u.approvedBy}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isSuperAdminUser ? (
                      <span className="text-[10px] font-mono text-amber-400 font-bold px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        Root Approver
                      </span>
                    ) : (
                      <>
                        {/* Approve button */}
                        {u.status !== "approved" && (
                          <button
                            onClick={() => handleApprove(u)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        )}

                        {/* Reject button */}
                        {u.status !== "rejected" && !isSelf && (
                          <button
                            onClick={() => handleReject(u)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}

                        {/* Admin role toggle button */}
                        {!isSelf && (
                          <button
                            onClick={() => handleToggleAdmin(u)}
                            disabled={isProcessing}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 ${
                              u.role === "admin"
                                ? "bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border-cyan-500/40"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                            }`}
                            title={u.role === "admin" ? "Demote to standard Trader" : "Promote to Administrator"}
                          >
                            {u.role === "admin" ? "Revoke Admin" : "Make Admin"}
                          </button>
                        )}

                        {/* Delete account record */}
                        {!isSelf && (
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={isProcessing}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer disabled:opacity-50"
                            title="Delete account record from Firestore"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Role changes and approvals sync immediately across all connected instances via Firestore.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
