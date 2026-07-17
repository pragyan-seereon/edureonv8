import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

export function ImpersonationBanner() {
  const { user, stopImpersonation } = useAuth();
  const router = useRouter();
  if (!(user?.role === "super_admin" && user?.impersonating)) return null;

  const exit = () => {
    const name = user.impersonating?.instituteName ?? "institute";
    stopImpersonation();
    toast.success(`Back to All Schools — exited ${name}`);
    router.navigate({ to: "/" });
  };

  return (
    <div className="flex items-center gap-3 border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs">
      <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-amber-700 dark:text-amber-400">Viewing school</span>{" "}
        <span className="text-foreground">{user.impersonating?.instituteName}</span>{" "}
        <span className="text-muted-foreground">— switch schools any time from the top bar.</span>
      </div>
      <Button size="sm" variant="outline" className="h-7 gap-1.5 border-amber-500/50 text-xs" onClick={exit}>
        <LogOut className="h-3.5 w-3.5" />Back to All Schools
      </Button>
    </div>
  );
}

