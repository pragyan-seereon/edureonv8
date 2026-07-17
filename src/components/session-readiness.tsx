import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, ClipboardList } from "lucide-react";
import {
  useClasses, useSubjects, useEmployees, useFeeStructures, useTimetable, useExams,
} from "@/lib/store";

type Check = { label: string; ok: boolean; hint: string };

export function SessionReadiness({ compact = false }: { compact?: boolean }) {
  const classes = useClasses();
  const subjects = useSubjects();
  const employees = useEmployees();
  const structures = useFeeStructures();
  const tt = useTimetable();
  const exams = useExams();

  const teachers = employees.filter((e: any) => (e.role || "").toLowerCase().includes("teacher"));
  const ttCount = Object.keys(tt).length;

  const checks: Check[] = [
    { label: "Working Hours Configured", ok: ttCount > 0, hint: "Working Hours Not Configured" },
    { label: "Classes & Sections Setup", ok: classes.length > 0, hint: "Classes Not Configured" },
    { label: "Subjects Assigned", ok: subjects.length > 0, hint: "Subjects Not Assigned" },
    { label: "Teachers Onboarded", ok: teachers.length > 0, hint: "Teachers Not Assigned" },
    { label: "Fee Structure Defined", ok: structures.length > 0, hint: "Fee Structure Missing" },
    { label: "Examination Setup", ok: exams.length > 0, hint: "Exam Setup Missing" },
    { label: "Timetable Published", ok: ttCount > 5, hint: "Timetable Not Published" },
  ];

  const passed = checks.filter((c) => c.ok).length;
  const pct = Math.round((passed / checks.length) * 100);
  const pending = checks.filter((c) => !c.ok);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />Session Readiness
          </CardTitle>
          <CardDescription>Mandatory setup for AY 2025-26</CardDescription>
        </div>
        <Badge variant={pct === 100 ? "default" : pct >= 70 ? "secondary" : "destructive"}>
          {pct}% ready
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={pct} className="h-2" />
        {pending.length > 0 && (
          <div className="rounded-md border border-warning/40 bg-warning/10 p-2.5 text-xs flex gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
            <span><strong>{pending.length}</strong> item{pending.length > 1 ? "s" : ""} pending: {pending.slice(0, 2).map((p) => p.hint).join(", ")}{pending.length > 2 ? "…" : ""}</span>
          </div>
        )}
        {!compact && (
          <div className="space-y-1.5 pt-1">
            {checks.map((c) => (
              <div key={c.label} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                <span className="flex items-center gap-2">
                  {c.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                  {c.label}
                </span>
                <span className={`text-[10px] uppercase tracking-wider ${c.ok ? "text-success" : "text-warning"}`}>
                  {c.ok ? "OK" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
