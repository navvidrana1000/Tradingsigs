import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
} from "firebase/firestore";
import {
  auth,
  db,
  googleAuthProvider,
  BOOTSTRAP_ADMIN_EMAIL,
  handleFirestoreError,
  OperationType,
} from "../lib/firebase";

export interface AppUserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: "admin" | "trader";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  firebaseUser: FirebaseUser | null;
  userProfile: AppUserProfile | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  // Administrative Operations
  allUsers: AppUserProfile[];
  pendingUsersCount: number;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  toggleAdminRole: (userId: string, currentRole: "admin" | "trader", email: string) => Promise<void>;
  deleteUserRecord: (userId: string) => Promise<void>;
  simulateNewTraderRegistration: (displayName: string, email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<AppUserProfile[]>([]);

  // Listen to Firebase Authentication state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserProfile(null);
        setAllUsers([]);
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const userPath = `users/${user.uid}`;

      try {
        const snap = await getDoc(userDocRef);
        const isBootstrap = user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

        if (!snap.exists()) {
          // First-time user registration
          const initialProfile: AppUserProfile = {
            id: user.uid,
            email: user.email || "",
            displayName: user.displayName || user.email?.split("@")[0] || "Trader",
            photoURL: user.photoURL || "",
            role: isBootstrap ? "admin" : "trader",
            status: isBootstrap ? "approved" : "pending",
            createdAt: new Date().toISOString(),
            approvedBy: isBootstrap ? "SYSTEM_BOOTSTRAP" : undefined,
            approvedAt: isBootstrap ? new Date().toISOString() : undefined,
          };

          try {
            await setDoc(userDocRef, initialProfile);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, userPath);
          }

          // If bootstrap admin, also ensure presence in admins collection
          if (isBootstrap) {
            const adminDocRef = doc(db, "admins", user.uid);
            try {
              await setDoc(adminDocRef, {
                userId: user.uid,
                email: user.email || "",
                assignedAt: new Date().toISOString(),
                assignedBy: "SYSTEM_BOOTSTRAP",
              });
            } catch (err) {
              console.warn("Bootstrap admin doc check:", err);
            }
          }

          setUserProfile(initialProfile);
        } else {
          const data = snap.data() as AppUserProfile;
          // Ensure bootstrap admin email is always recognized as approved admin
          if (isBootstrap && (data.role !== "admin" || data.status !== "approved")) {
            const upgraded: Partial<AppUserProfile> = {
              role: "admin",
              status: "approved",
              updatedAt: new Date().toISOString(),
            };
            try {
              await updateDoc(userDocRef, upgraded);
              const adminDocRef = doc(db, "admins", user.uid);
              await setDoc(adminDocRef, {
                userId: user.uid,
                email: user.email || "",
                assignedAt: new Date().toISOString(),
                assignedBy: "SYSTEM_BOOTSTRAP",
              });
            } catch {}
            setUserProfile({ ...data, ...upgraded });
          } else {
            setUserProfile(data);
          }
        }
      } catch (err) {
        console.error("Auth sync error:", err);
        setError(err instanceof Error ? err.message : "Failed to sync profile");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to the authenticated user's own profile in real-time
  useEffect(() => {
    if (!firebaseUser) return;

    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userPath = `users/${firebaseUser.uid}`;

    const unsubscribeDoc = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const profile = docSnap.data() as AppUserProfile;
          setUserProfile(profile);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, userPath);
      }
    );

    return () => unsubscribeDoc();
  }, [firebaseUser]);

  const isSuperAdmin = Boolean(
    firebaseUser?.email &&
      firebaseUser.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()
  );

  const isAdmin = Boolean(
    isSuperAdmin ||
      userProfile?.role === "admin"
  );

  const isApproved = Boolean(
    isSuperAdmin ||
      userProfile?.status === "approved" ||
      userProfile?.role === "admin"
  );
  const isPending = Boolean(firebaseUser && !isSuperAdmin && userProfile?.status === "pending");
  const isRejected = Boolean(firebaseUser && !isSuperAdmin && userProfile?.status === "rejected");

  // If user is Admin, attach real-time listener to the whole users collection for approvals
  useEffect(() => {
    if (!isAdmin || !firebaseUser) {
      setAllUsers([]);
      return;
    }

    const usersColRef = collection(db, "users");
    const usersPath = "users";

    const unsubscribeAll = onSnapshot(
      usersColRef,
      (snapshot) => {
        const list: AppUserProfile[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as AppUserProfile);
        });
        // Sort: pending first, then by createdAt desc
        list.sort((a, b) => {
          if (a.status === "pending" && b.status !== "pending") return -1;
          if (a.status !== "pending" && b.status === "pending") return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        setAllUsers(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, usersPath);
      }
    );

    return () => unsubscribeAll();
  }, [isAdmin, firebaseUser]);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      console.error("Google sign in failed:", err);
      setError(err instanceof Error ? err.message : "Sign in failed");
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setFirebaseUser(null);
      setUserProfile(null);
      setAllUsers([]);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  // Administrative Action: Approve user
  const approveUser = async (targetUserId: string) => {
    if (!isAdmin) throw new Error("Only administrators can approve user accounts.");
    const targetRef = doc(db, "users", targetUserId);
    const targetPath = `users/${targetUserId}`;

    try {
      await updateDoc(targetRef, {
        status: "approved",
        approvedBy: firebaseUser?.email || "Admin",
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, targetPath);
    }
  };

  // Administrative Action: Reject user
  const rejectUser = async (targetUserId: string) => {
    if (!isAdmin) throw new Error("Only administrators can reject user accounts.");
    const targetRef = doc(db, "users", targetUserId);
    const targetPath = `users/${targetUserId}`;

    try {
      await updateDoc(targetRef, {
        status: "rejected",
        approvedBy: firebaseUser?.email || "Admin",
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, targetPath);
    }
  };

  // Administrative Action: Toggle Admin role
  const toggleAdminRole = async (
    targetUserId: string,
    currentRole: "admin" | "trader",
    email: string
  ) => {
    if (!isAdmin) throw new Error("Only administrators can reassign roles.");
    const newRole: "admin" | "trader" = currentRole === "admin" ? "trader" : "admin";
    const userDocRef = doc(db, "users", targetUserId);
    const adminDocRef = doc(db, "admins", targetUserId);
    const targetPath = `users/${targetUserId}`;

    try {
      await updateDoc(userDocRef, {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });

      if (newRole === "admin") {
        await setDoc(adminDocRef, {
          userId: targetUserId,
          email,
          assignedAt: new Date().toISOString(),
          assignedBy: firebaseUser?.email || "Admin",
        });
      } else {
        await deleteDoc(adminDocRef);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, targetPath);
    }
  };

  // Administrative Action: Delete / Decommission User Record
  const deleteUserRecord = async (targetUserId: string) => {
    if (!isAdmin) throw new Error("Only administrators can delete user accounts.");
    if (targetUserId === firebaseUser?.uid) {
      throw new Error("Cannot delete your own active administrator account.");
    }
    const targetRef = doc(db, "users", targetUserId);
    const targetPath = `users/${targetUserId}`;
    try {
      await deleteDoc(targetRef);
      const adminDocRef = doc(db, "admins", targetUserId);
      await deleteDoc(adminDocRef).catch(() => {});
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, targetPath);
    }
  };

  // Administrative Demo Action: Simulate Incoming Trader Registration for Approval Testing
  const simulateNewTraderRegistration = async (displayName: string, email: string) => {
    if (!isAdmin) throw new Error("Only administrators can simulate registrations.");
    const id = `demo_trader_${Date.now().toString(36)}`;
    const userDocRef = doc(db, "users", id);
    const userPath = `users/${id}`;
    const initialProfile: AppUserProfile = {
      id,
      email: email.trim().toLowerCase(),
      displayName: displayName.trim(),
      role: "trader",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(userDocRef, initialProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, userPath);
    }
  };

  const pendingUsersCount = allUsers.filter((u) => u.status === "pending").length;

  return (
    <AuthContext.Provider
      value={{
        user: firebaseUser,
        firebaseUser,
        userProfile,
        isSuperAdmin,
        isAdmin,
        isApproved,
        isPending,
        isRejected,
        loading,
        error,
        signInWithGoogle,
        signOut,
        allUsers,
        pendingUsersCount,
        approveUser,
        rejectUser,
        toggleAdminRole,
        deleteUserRecord,
        simulateNewTraderRegistration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
