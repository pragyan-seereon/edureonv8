import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function KpiCard({
  label, value, delta, icon, tone = "default",
}: {
  label: string;
  value: string | number;
  delta?: number;
  icon?: ReactNode;
  tone?: "default" | "primary" | "success" | "warning" | "info";
}) {
  const positive = (delta ?? 0) >= 0;
  const toneClass = {
    default: "bg-muted text-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/10 text-info",
  }[tone];

  return (
    <Card className="relative overflow-hidden border-border/60 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="text-2xl md:text-3xl font-display font-semibold tracking-tight">{value}</div>
            {delta !== undefined && (
              <div className={cn("flex items-center gap-1 text-xs font-medium", positive ? "text-success" : "text-destructive")}>
                {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {Math.abs(delta)}% vs last month
              </div>
            )}
          </div>
          {icon && <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", toneClass)}>{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
