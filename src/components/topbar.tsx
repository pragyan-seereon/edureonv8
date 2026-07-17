import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Bell, Search, Moon, Sun, HelpCircle, CalendarRange } from "lucide-react";
import { useEffect, useState } from "react";
import { UserMenu } from "./user-menu";
import { ACADEMIC_SESSIONS, sessionApi, useAcademicSession } from "@/lib/store";
import { useInstitutes } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

export function Topbar() {
  const [dark, setDark] = useState(false);
  const session = useAcademicSession();
  const { user, switchInstitute, startImpersonation, stopImpersonation } = useAuth();
  const institutes = useInstitutes();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Institutes this user is assigned to (only shown when more than one).
  const myInstituteIds = Array.from(new Set((user?.assignments ?? []).map((a) => a.instituteId)));
  const myInstitutes = institutes.filter((i) => myInstituteIds.includes(i.id));
  const showSwitcher = user?.role !== "super_admin" && myInstitutes.length > 1 && !!user?.activeInstituteId;
  const isSuper = user?.role === "super_admin";
  const superValue = user?.impersonating?.instituteId ?? "__all__";

  return (
    <header className="sticky top-0 z-30 h-14 border-b bg-background/80 backdrop-blur-md flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground shrink-0" />
      <div className="hidden md:flex relative flex-1 max-w-md ml-2 min-w-0">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search students, employees, classes…" className="pl-9 h-9 bg-muted/40 border-border/60" />
        <kbd className="hidden lg:inline-flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-background border rounded">⌘K</kbd>
      </div>
      <div className="flex-1 md:hidden min-w-0" />
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {isSuper && (
          <Select
            value={superValue}
            onValueChange={(v) => {
              if (v === "__all__") {
                stopImpersonation();
                toast.success("Viewing global data — all schools");
              } else {
                const inst = institutes.find((i) => i.id === v);
                if (inst) {
                  startImpersonation({ id: inst.id, name: inst.name });
                  toast.success(`Switched to ${inst.name}`);
                }
              }
            }}
          >
            <SelectTrigger className="h-8 w-[170px] sm:w-[220px] gap-1.5 bg-muted/40 border-border/60 text-xs font-medium" aria-label="School switcher">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="All Schools" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="__all__" className="text-xs">All Schools (Global)</SelectItem>
              {institutes.map((i) => (
                <SelectItem key={i.id} value={i.id} className="text-xs">{i.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {showSwitcher && (
          <Select
            value={user!.activeInstituteId}
            onValueChange={(v) => {
              switchInstitute(v);
              toast.success(`Switched to ${myInstitutes.find((i) => i.id === v)?.name ?? "institute"}`);
            }}
          >
            <SelectTrigger className="h-8 w-[180px] gap-1.5 bg-muted/40 border-border/60 text-xs font-medium">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {myInstitutes.map((i) => (
                <SelectItem key={i.id} value={i.id} className="text-xs">{i.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={session}
          onValueChange={(v) => {
            sessionApi.set(v as typeof session);
            toast.success(`Switched to academic session ${v}`);
          }}
        >
          <SelectTrigger className="h-8 w-[150px] gap-1.5 bg-muted/40 border-border/60 text-xs font-medium">
            <CalendarRange className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACADEMIC_SESSIONS.map((s, i) => (
              <SelectItem key={s} value={s} className="text-xs">
                Session {s}{i === 0 ? " (Current)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setDark((d) => !d)} aria-label="Toggle theme">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Help">
          <HelpCircle className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-destructive" />
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}
