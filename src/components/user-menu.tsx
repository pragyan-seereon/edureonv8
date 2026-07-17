import { useAuth, initials, roleLabel, type UserRole } from "@/lib/auth";
import { portalHomeForRole } from "@/lib/portal-nav";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger,
  DropdownMenuSubContent, DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useRouter, Link } from "@tanstack/react-router";
import { LogOut, User as UserIcon, Settings, Shield, Building2, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

const SWITCHABLE: { role: UserRole; label: string; desc: string }[] = [
  { role: "super_admin", label: "Super Admin Portal", desc: "Multi-tenant SaaS control" },
  { role: "principal", label: "Admin Portal", desc: "Principal / Administrator" },
  { role: "teacher", label: "Teacher Portal", desc: "Take attendance, grade exams" },
  { role: "student", label: "Student Portal", desc: "Timetable, results, fees" },
];

export function UserMenu() {
  const { user, logout, switchRole } = useAuth();
  const router = useRouter();
  if (!user) return null;

  const onLogout = () => {
    logout();
    toast.success("Signed out");
    router.navigate({ to: "/login" });
  };

  const onSwitch = (role: UserRole, label: string) => {
    switchRole(role);
    toast.success(`Switched to ${label}`);
    router.navigate({ to: portalHomeForRole(role) });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 px-1.5 gap-2">
          <Avatar className="h-7 w-7">
            {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
            <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start leading-tight">
            <span className="text-xs font-medium max-w-[120px] truncate">{user.name}</span>
            <span className="text-[10px] text-muted-foreground">{roleLabel[user.role]}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="pb-2">
          <div className="flex items-start gap-2.5">
            <Avatar className="h-9 w-9">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
              <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
              <Badge variant="secondary" className="mt-1 text-[9px] uppercase tracking-wider">{roleLabel[user.role]}</Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger><ArrowLeftRight className="h-4 w-4" />Switch Portal</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-64">
              {SWITCHABLE.map((s) => (
                <DropdownMenuItem key={s.role} onClick={() => onSwitch(s.role, s.label)} className="flex-col items-start gap-0.5 py-2">
                  <span className="text-sm font-medium">{s.label}</span>
                  <span className="text-[10px] text-muted-foreground">{s.desc}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/profile"><UserIcon className="h-4 w-4" />My Profile</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/account"><Settings className="h-4 w-4" />Account Settings</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/roles"><Shield className="h-4 w-4" />Roles & Permissions</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/settings"><Building2 className="h-4 w-4" />Institute Settings</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
