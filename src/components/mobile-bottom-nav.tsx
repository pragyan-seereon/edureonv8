import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { navForRole } from "@/lib/portal-nav";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  if (!user) return null;
  if (user.role !== "teacher" && user.role !== "student") return null;

  // Take first 5 items from first group
  const groups = navForRole(user.role);
  const items = groups[0].items.slice(0, 5);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border/60">
      <div className="grid grid-cols-5">
        {items.map((it) => {
          const active = pathname === it.url || pathname.startsWith(it.url + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.url}
              to={it.url}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 text-[10px] transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate max-w-[60px]">{it.title}</span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
