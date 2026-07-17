import type { UserRole } from "./auth";
import type { CustomRole, UserAssignment } from "./store";
import {
  LayoutDashboard, Users, GraduationCap, UserCog, CalendarDays, BookOpen,
  ClipboardList, IndianRupee, Bus, Building2, Library, MessageSquare,
  Settings, Shield, BarChart3, Bell, FileText, Briefcase, School,
  User as UserIcon, Boxes, Receipt, History, FolderArchive,
  KanbanSquare, Network, NotebookPen, Plane, CalendarCheck, Trophy,
  Megaphone, FileBox, IdCard, DoorOpen,
} from "lucide-react";
import { Wrench } from "lucide-react";

export type NavItem = { title: string; url: string; icon: React.ComponentType<{ className?: string }> };
export type NavGroup = { label: string; items: NavItem[] };

const adminGroups: NavGroup[] = [
  { label: "Overview", items: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Analytics", url: "/analytics", icon: BarChart3 },
    { title: "Notifications", url: "/notifications", icon: Bell },
    { title: "Audit Log", url: "/admin/audit", icon: History },
  ]},
  { label: "Academic", items: [
    { title: "Admissions", url: "/admin/admissions", icon: KanbanSquare },
    { title: "Students", url: "/students", icon: GraduationCap },
    { title: "Student Archive", url: "/admin/student-archive", icon: FolderArchive },
    { title: "Classes & Sections", url: "/classes", icon: School },
    { title: "Timetable", url: "/timetable", icon: CalendarDays },
    { title: "Assignments", url: "/assignments", icon: ClipboardList },
    { title: "Attendance", url: "/attendance", icon: FileText },
    { title: "Examinations", url: "/exams", icon: BookOpen },
    { title: "Notices", url: "/teacher/notices", icon: Megaphone },
  ]},
  { label: "HR & Staff", items: [
    { title: "Employees", url: "/employees", icon: UserCog },
    { title: "Payroll", url: "/payroll", icon: Briefcase },
    { title: "Roles & Permissions", url: "/roles", icon: Shield },
  ]},
  { label: "Operations", items: [
    { title: "Fees & Finance", url: "/fees", icon: IndianRupee },
    { title: "Fee Collection", url: "/admin/fee-collection", icon: Receipt },
    { title: "Expenses", url: "/admin/expenses", icon: Receipt },
    { title: "Infrastructure", url: "/admin/infrastructure", icon: Network },
    { title: "Assets", url: "/admin/assets", icon: Boxes },
    { title: "Classroom Maintenance", url: "/admin/maintenance", icon: Wrench },
    { title: "Transport", url: "/transport", icon: Bus },
    { title: "Hostel", url: "/hostel", icon: Building2 },
    { title: "Library", url: "/library", icon: Library },
    { title: "Documents", url: "/admin/dms", icon: FolderArchive },
    { title: "ID Cards", url: "/admin/id-cards", icon: IdCard },
    { title: "Gate Pass", url: "/admin/gate-pass", icon: DoorOpen },
    { title: "Communication", url: "/communication", icon: MessageSquare },
  ]},
  { label: "Account", items: [
    { title: "My Profile", url: "/profile", icon: UserIcon },
    { title: "Settings", url: "/settings", icon: Settings },
  ]},
];

// Super Admin keeps a lean, platform-focused sidebar. The full ERP modules
// are only revealed while impersonating a specific institute's admin.
const superGroups: NavGroup[] = [
  { label: "Platform", items: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Institutes", url: "/super/institutes", icon: School },
    { title: "Users & Roles", url: "/super/users", icon: UserCog },
    { title: "Subscriptions", url: "/super/billing", icon: IndianRupee },
    { title: "Analytics", url: "/analytics", icon: BarChart3 },
  ]},
  { label: "Operations", items: [
    { title: "Notifications", url: "/notifications", icon: Bell },
    { title: "Audit Log", url: "/admin/audit", icon: History },
    { title: "Communication", url: "/communication", icon: MessageSquare },
  ]},
  { label: "Account", items: [
    { title: "My Profile", url: "/profile", icon: UserIcon },
    { title: "Settings", url: "/settings", icon: Settings },
  ]},
];


const teacherGroups: NavGroup[] = [
  { label: "Teaching", items: [
    { title: "Dashboard", url: "/teacher/dashboard", icon: LayoutDashboard },
    { title: "My Classes", url: "/teacher/classes", icon: School },
    { title: "Students Directory", url: "/students", icon: GraduationCap },
    { title: "Take Attendance", url: "/teacher/attendance", icon: CalendarCheck },
    { title: "Assignments", url: "/assignments", icon: ClipboardList },
    { title: "Examinations", url: "/exams", icon: BookOpen },
    { title: "Lesson Plans", url: "/teacher/lesson-plans", icon: NotebookPen },
    { title: "Study Materials", url: "/teacher/materials", icon: FileBox },
    { title: "Notices", url: "/teacher/notices", icon: Megaphone },
    { title: "Timetable", url: "/timetable", icon: CalendarDays },
  ]},
  { label: "Campus", items: [
    { title: "Library", url: "/library", icon: Library },
    { title: "Maintenance", url: "/teacher/maintenance", icon: Wrench },
    { title: "Communication", url: "/communication", icon: MessageSquare },
    { title: "Documents", url: "/admin/dms", icon: FolderArchive },
    { title: "Analytics", url: "/analytics", icon: BarChart3 },
  ]},
  { label: "Personal", items: [
    { title: "Leave Application", url: "/teacher/leave", icon: Plane },
    { title: "Notifications", url: "/notifications", icon: Bell },
    { title: "My Profile", url: "/profile", icon: UserIcon },
    { title: "Settings", url: "/settings", icon: Settings },
  ]},
];

const studentGroups: NavGroup[] = [
  { label: "Learning", items: [
    { title: "Dashboard", url: "/student/dashboard", icon: LayoutDashboard },
    { title: "My Timetable", url: "/student/timetable", icon: CalendarDays },
    { title: "My Attendance", url: "/student/attendance", icon: CalendarCheck },
    { title: "Assignments", url: "/student/assignments", icon: ClipboardList },
    { title: "Examinations", url: "/student/exams", icon: BookOpen },
    { title: "Results", url: "/student/results", icon: Trophy },
    { title: "Study Materials", url: "/student/materials", icon: FileBox },
    { title: "Notices", url: "/student/notices", icon: Megaphone },
  ]},
  { label: "Campus", items: [
    { title: "Fees", url: "/student/fees", icon: IndianRupee },
    { title: "My Wallet", url: "/student/wallet", icon: IndianRupee },

    { title: "Library", url: "/student/library", icon: Library },
    { title: "Communication", url: "/communication", icon: MessageSquare },
    { title: "Notifications", url: "/notifications", icon: Bell },
    { title: "My Profile", url: "/profile", icon: UserIcon },
    { title: "Settings", url: "/settings", icon: Settings },
  ]},
];

const parentGroups: NavGroup[] = [
  { label: "Family", items: [
    { title: "Dashboard", url: "/parent/dashboard", icon: LayoutDashboard },
    { title: "My Children", url: "/parent/children", icon: Users },
    { title: "Notices", url: "/student/notices", icon: Megaphone },
    { title: "Notifications", url: "/notifications", icon: Bell },
  ]},
  { label: "Account", items: [
    { title: "My Profile", url: "/profile", icon: UserIcon },
    { title: "Settings", url: "/settings", icon: Settings },
  ]},
];

export function navForRole(role: UserRole, opts?: { impersonating?: boolean }): NavGroup[] {
  // A Super Admin impersonating an institute sees that institute's full ERP nav.
  if (role === "super_admin" && opts?.impersonating) return adminGroups;
  if (role === "super_admin") return superGroups;
  if (role === "teacher") return teacherGroups;
  if (role === "student") return studentGroups;
  if (role === "parent") return parentGroups;
  return adminGroups;
}

export function portalHomeForRole(role: UserRole): string {
  if (role === "super_admin") return "/super/institutes";
  if (role === "teacher") return "/teacher/dashboard";
  if (role === "student") return "/student/dashboard";
  if (role === "parent") return "/parent/dashboard";
  return "/";
}

export function portalLabelForRole(role: UserRole): string {
  if (role === "super_admin") return "Super Admin Portal";
  if (role === "teacher") return "Teacher Portal";
  if (role === "student") return "Student Portal";
  if (role === "parent") return "Parent Portal";
  return "Admin Portal";
}

/* ------------------------------------------------------------------ *
 * Permission-aware navigation for a user at a specific institute.
 * The role(s) a user holds at the active institute determine which
 * screens they see. Built-in staff roles map to a fixed set of
 * modules; custom roles use their enabled module permissions.
 * ------------------------------------------------------------------ */

// Maps a nav item URL to the RBAC module key it belongs to.
const URL_MODULE: Record<string, string> = {
  "/admin/admissions": "admissions",
  "/students": "students",
  "/admin/student-archive": "students",
  "/classes": "classes",
  "/timetable": "timetable",
  "/assignments": "assignments",
  "/attendance": "attendance",
  "/exams": "exams",
  "/teacher/notices": "communication",
  "/employees": "employees",
  "/payroll": "payroll",
  "/roles": "settings",
  "/fees": "fees",
  "/admin/fee-collection": "fees",
  "/admin/expenses": "fees",
  "/admin/infrastructure": "infrastructure",
  "/admin/assets": "assets",
  "/admin/maintenance": "maintenance",
  "/transport": "transport",
  "/hostel": "hostel",
  "/library": "library",
  "/admin/dms": "settings",
  "/admin/id-cards": "settings",
  "/admin/gate-pass": "settings",
  "/communication": "communication",
  "/analytics": "reports",
};

// URLs every signed-in user can always reach.
const ALWAYS_URLS = new Set(["/", "/notifications", "/admin/audit", "/profile", "/settings"]);

// Fixed module sets for built-in staff roles ("all" = full admin nav).
const ROLE_MODULES: Record<string, string[] | "all"> = {
  super_admin: "all",
  admin: "all",
  principal: "all",
  hr: ["employees", "payroll", "attendance", "communication", "reports", "maintenance"],
  accountant: ["fees", "payroll", "reports", "communication"],
};

function filterAdminNav(allowed: Set<string> | "all"): NavGroup[] {
  if (allowed === "all") return adminGroups;
  return adminGroups
    .map((g) => ({
      label: g.label,
      items: g.items.filter((it) => ALWAYS_URLS.has(it.url) || allowed.has(URL_MODULE[it.url] ?? "")),
    }))
    .filter((g) => g.items.length > 0);
}

export function navForUserAtInstitute(
  roles: Pick<UserAssignment, "role" | "customRoleId">[],
  customRoles: CustomRole[],
): NavGroup[] {
  if (roles.length === 0) return adminGroups;

  // A single dedicated-portal role gets its own portal.
  if (roles.length === 1 && !roles[0].customRoleId) {
    const r = roles[0].role;
    if (r === "teacher") return teacherGroups;
    if (r === "student") return studentGroups;
    if (r === "parent") return parentGroups;
    if (r === "super_admin") return adminGroups;
  }

  let all = false;
  const allowed = new Set<string>();
  for (const a of roles) {
    if (a.customRoleId) {
      const cr = customRoles.find((c) => c.id === a.customRoleId);
      Object.entries(cr?.perms ?? {}).forEach(([k, v]) => {
        if (v.enabled) allowed.add(k);
      });
      continue;
    }
    const keys = ROLE_MODULES[a.role];
    if (keys === "all") all = true;
    else (keys ?? []).forEach((k) => allowed.add(k));
  }
  return filterAdminNav(all ? "all" : allowed);
}
