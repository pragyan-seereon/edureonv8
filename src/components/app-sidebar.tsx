import { Link, useRouterState } from "@tanstack/react-router";
import { GraduationCap, ChevronRight } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth, initials } from "@/lib/auth";
import { navForRole, navForUserAtInstitute, portalLabelForRole } from "@/lib/portal-nav";
import { useCustomRoles, useInstitutes, rolesForUserAtInstitute } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => url === "/" ? pathname === "/" : pathname.startsWith(url);
  const { user } = useAuth();
  const customRoles = useCustomRoles();
  const institutes = useInstitutes();
  const impersonating = user?.role === "super_admin" && !!user?.impersonating;

  // Super admins (and their impersonation view) keep the platform / full-admin nav.
  // Everyone else sees only the screens their role(s) at the active institute allow.
  let groups = navForRole(user?.role ?? "admin", { impersonating });
  if (user && user.role !== "super_admin" && user.activeInstituteId && user.assignments) {
    const roles = rolesForUserAtInstitute(
      { assignments: user.assignments, role: user.role, instituteId: user.activeInstituteId },
      user.activeInstituteId,
    );
    groups = navForUserAtInstitute(roles, customRoles);
  }

  const activeInstName =
    institutes.find((i) => i.id === user?.activeInstituteId)?.name ?? user?.institute;
  const portalLabel = impersonating
    ? `${user?.impersonating?.instituteName ?? "Institute"} · Admin`
    : user && user.role !== "super_admin" && (user.assignments?.length ?? 0) > 1 && activeInstName
      ? activeInstName
      : portalLabelForRole(user?.role ?? "admin");

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5 px-2 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md gradient-primary shadow-sm shrink-0">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-display font-semibold text-sidebar-foreground truncate">Edureon ERP</span>
              <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">{portalLabel}</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-1">
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/50">

                {g.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link to={item.url} className="group/link">
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.title}</span>}
                          {!collapsed && active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-70" />}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <Link to="/profile" className="block">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 px-2 py-2 hover:bg-sidebar-accent rounded-md">
              <Avatar className="h-8 w-8 shrink-0">
                {user?.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback className="text-[10px] bg-sidebar-accent text-sidebar-accent-foreground font-semibold">
                  {user ? initials(user.name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-xs font-medium text-sidebar-foreground truncate">{user?.name ?? "Guest"}</span>
                <span className="text-[10px] text-sidebar-foreground/60 truncate">{user?.designation ?? "—"}</span>
              </div>
            </div>
          ) : (
            <Avatar className="h-8 w-8 mx-auto">
              {user?.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
              <AvatarFallback className="text-[10px] bg-sidebar-accent text-sidebar-accent-foreground font-semibold">
                {user ? initials(user.name) : "?"}
              </AvatarFallback>
            </Avatar>
          )}
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
