import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useInstitutes, useCustomRoles, rolesForUserAtInstitute } from "@/lib/store";
import { roleLabel, type UserRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Building2, ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/select-institute")({
  head: () => ({ meta: [{ title: "Choose institute — Edureon ERP" }] }),
  component: SelectInstitutePage,
});

function SelectInstitutePage() {
  const { user, switchInstitute, logout } = useAuth();
  const institutes = useInstitutes();
  const customRoles = useCustomRoles();
  const router = useRouter();

  if (!user) return null;

  const instMap = Object.fromEntries(institutes.map((i) => [i.id, i]));
  const ids = Array.from(new Set((user.assignments ?? []).map((a) => a.instituteId)));

  const roleName = (a: { role: string; customRoleId?: string }) =>
    a.customRoleId
      ? customRoles.find((c) => c.id === a.customRoleId)?.name ?? a.role
      : roleLabel[a.role as UserRole] ?? a.role;

  const enter = (instituteId: string) => {
    switchInstitute(instituteId);
    toast.success(`Entered ${instMap[instituteId]?.name ?? "institute"}`);
    router.navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-11 w-11 rounded-lg gradient-primary flex items-center justify-center shadow-lg">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">Welcome, {user.name.split(" ")[0]}</div>
            <div className="text-sm text-muted-foreground">You have access to {ids.length} institutes — choose one to continue.</div>
          </div>
        </div>

        <div className="grid gap-3">
          {ids.map((id) => {
            const inst = instMap[id];
            const roles = rolesForUserAtInstitute({ assignments: user.assignments, role: user.role, instituteId: id }, id);
            return (
              <Card
                key={id}
                role="button"
                tabIndex={0}
                onClick={() => enter(id)}
                onKeyDown={(e) => { if (e.key === "Enter") enter(id); }}
                className="p-4 flex items-center gap-4 cursor-pointer border-border/60 hover:border-primary/50 hover:bg-muted/40 transition"
              >
                <div className="h-11 w-11 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{inst?.name ?? id}</div>
                  <div className="text-xs text-muted-foreground">{inst?.city ?? "—"}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {roles.map((r, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] capitalize">{roleName(r)}</Badge>
                    ))}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </Card>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { logout(); router.navigate({ to: "/login" }); }}>
            <LogOut className="h-4 w-4" />Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
