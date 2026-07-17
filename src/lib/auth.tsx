import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserAssignment } from "./store";

export type UserRole =
  | "super_admin" | "admin" | "principal" | "teacher"
  | "accountant" | "hr" | "parent" | "student";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  bio?: string;
  institute?: string;
  designation?: string;
  joinedAt?: string;
  /** The AppUser record id backing this session (for RBAC lookups). */
  appUserId?: string;
  /** Multi-institute / multi-role mapping for this user. */
  assignments?: UserAssignment[];
  /** Institute the user is currently working inside (multi-institute switcher). */
  activeInstituteId?: string;
  /** Set when a Super Admin is impersonating an institute's admin view. */
  impersonating?: { instituteId: string; instituteName: string } | null;
};

type AuthCtx = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (data: { name: string; email: string; password: string; institute?: string }) => Promise<User>;
  logout: () => void;
  updateProfile: (patch: Partial<User>) => void;
  forgotPassword: (email: string) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  switchRole: (role: UserRole) => void;
  switchInstitute: (instituteId: string) => void;
  startImpersonation: (institute: { id: string; name: string }) => void;
  stopImpersonation: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const STORAGE_KEY = "scholaris.auth.user";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const persist = (u: User | null) => {
    setUser(u);
    if (typeof window !== "undefined") {
      if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      else localStorage.removeItem(STORAGE_KEY);
    }
  };

  const value: AuthCtx = {
    user,
    ready,
    login: async (email, password) => {
      await sleep(350);
      const { appUsersApi, institutesApi, instituteIdsForUser } = await import("./store");
      const matched = appUsersApi.list().find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!matched) throw new Error("No account found for this email");
      if (matched.status !== "Active") throw new Error("Account is suspended");
      if (matched.password && matched.password !== password) throw new Error("Invalid password");
      const instituteIds = instituteIdsForUser(matched);
      // Only one institute → enter it directly. Multiple → let the user choose.
      const activeInstituteId = instituteIds.length === 1 ? instituteIds[0] : undefined;
      const activeRole = activeInstituteId
        ? (matched.assignments?.find((a) => a.instituteId === activeInstituteId)?.role as UserRole) ?? matched.role
        : matched.role;
      const inst = institutesApi.get(activeInstituteId ?? matched.instituteId);
      const u: User = {
        id: "u_" + Date.now().toString(36),
        appUserId: matched.id,
        name: matched.name,
        email: matched.email,
        role: activeRole,
        designation: roleLabel[activeRole as UserRole] ?? activeRole,
        phone: matched.phone,
        institute: inst?.name ?? "—",
        joinedAt: matched.createdAt,
        assignments: matched.assignments ?? [{ instituteId: matched.instituteId, role: matched.role }],
        activeInstituteId,
      };
      persist(u);
      return u;
    },

    signup: async ({ name, email, institute }) => {
      await sleep(500);
      const u: User = {
        id: "u_" + Date.now().toString(36),
        name, email,
        role: "admin",
        designation: "Administrator",
        institute: institute || "New Institute",
        phone: "",
        joinedAt: new Date().toISOString().slice(0, 10),
      };
      persist(u);
      return u;
    },
    logout: () => persist(null),
    updateProfile: (patch) => {
      if (!user) return;
      persist({ ...user, ...patch });
    },
    forgotPassword: async () => { await sleep(600); },
    changePassword: async () => { await sleep(450); },
    switchRole: (role) => {
      const base = user ?? {
        id: "u_" + Date.now().toString(36),
        name: "Demo User", email: "demo@scholaris.app",
        role, institute: "Mothers Public School — Unit-1", joinedAt: "2024-04-01",
      };
      const designation =
        role === "super_admin" ? "Platform Owner" :
        role === "principal" ? "Principal" :
        role === "teacher" ? "Senior Teacher" :
        role === "student" ? "Student" :
        role === "parent" ? "Parent" :
        role === "hr" ? "HR Manager" :
        role === "accountant" ? "Accountant" : "Administrator";
      persist({ ...base, role, designation });
    },
    switchInstitute: (instituteId) => {
      if (!user) return;
      const role = (user.assignments?.find((a) => a.instituteId === instituteId)?.role as UserRole) ?? user.role;
      persist({
        ...user,
        activeInstituteId: instituteId,
        role,
        designation: roleLabel[role as UserRole] ?? role,
      });
    },
    startImpersonation: (institute) => {
      if (!user) return;
      persist({
        ...user,
        impersonating: { instituteId: institute.id, instituteName: institute.name },
      });
    },
    stopImpersonation: () => {
      if (!user) return;
      persist({ ...user, impersonating: null });
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export const initials = (name: string) =>
  name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();

export const roleLabel: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Administrator",
  principal: "Principal",
  teacher: "Teacher",
  accountant: "Accountant",
  hr: "HR Manager",
  parent: "Parent",
  student: "Student",
};
