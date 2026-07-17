import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi-card";
import { CalendarCheck, ClipboardList, BookOpen, Users, Bell, NotebookPen, ArrowRight, Megaphone, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAssignments, useSubmissions, useLessonPlans, useExams, useNotices, lessonPlansApi } from "@/lib/store";
import { useMemo } from "react";

export const Route = createFileRoute("/teacher/dashboard")({
  head: () => ({ meta: [{ title: "Teacher · Dashboard — Edureon" }] }),
  component: TeacherDashboard,
});

const TEACHER = "A. Mehta";

function TeacherDashboard() {
  const { user } = useAuth();
  const name = user?.name?.split(" ")[0] ?? "Teacher";
  const assignments = useAssignments();
  const subs = useSubmissions();
  useLessonPlans(); // reactivity
  const plans = lessonPlansApi.forTeacher(TEACHER);
  const exams = useExams();
  const notices = useNotices();

  const myAssignments = useMemo(() => assignments.filter((a) => a.teacher === TEACHER && a.status === "Published"), [assignments]);
  const pendingGrading = useMemo(
    () => subs.filter((s) => myAssignments.some((a) => a.id === s.assignmentId) && (s.status === "Submitted" || s.status === "Late")).length,
    [subs, myAssignments]
  );
  const draftPlans = plans.filter((p) => p.status === "Draft" || p.status === "Changes Requested");
  const upcomingExams = exams.filter((e) => e.status === "Scheduled" || e.status === "In Progress");
  const weakAlert = useMemo(() => {
    // simple weak-student heuristic: graded submissions with marks < 50%
    return subs.filter((s) => myAssignments.some((a) => a.id === s.assignmentId) && s.status === "Graded" && s.marks != null && s.marks < ((myAssignments.find((a) => a.id === s.assignmentId)?.maxMarks || 20) * 0.5)).slice(0, 4);
  }, [subs, myAssignments]);
  const recentNotices = notices.filter((n) => n.status === "Published" && (n.audience === "Teachers" || n.audience === "All" || n.audience === "Staff")).slice(0, 4);

  const todayPeriods = [
    { time: "08:00 – 08:45", subject: "Mathematics", section: "X-B", room: "F-11" },
    { time: "08:45 – 09:30", subject: "Mathematics", section: "IX-A", room: "G-02" },
    { time: "10:00 – 10:45", subject: "Mathematics", section: "X-A", room: "F-12" },
    { time: "11:30 – 12:15", subject: "Class Mentor", section: "X-B", room: "F-11" },
  ];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Teacher Portal"
        title={`Good morning, ${name}`}
        description={`${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · ${todayPeriods.length} periods today.`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild><Link to="/teacher/attendance"><CalendarCheck className="h-4 w-4" />Take Attendance</Link></Button>
            <Button size="sm" className="gradient-primary border-0" asChild><Link to="/assignments"><ClipboardList className="h-4 w-4" />Assignments</Link></Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="My Active Assignments" value={myAssignments.length} icon={<ClipboardList className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Pending Grading" value={pendingGrading} icon={<Users className="h-5 w-5" />} tone="warning" />
        <KpiCard label="Lesson Plans (Open)" value={draftPlans.length} icon={<NotebookPen className="h-5 w-5" />} tone="info" />
        <KpiCard label="Upcoming Exams" value={upcomingExams.length} icon={<BookOpen className="h-5 w-5" />} tone="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="font-display text-base">Today's Schedule</CardTitle>
              <CardDescription>{todayPeriods.length} sessions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild><Link to="/timetable">Full timetable<ArrowRight className="h-3.5 w-3.5" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayPeriods.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-md border hover:bg-muted/40">
                <div className="text-xs font-mono text-muted-foreground w-28 shrink-0">{p.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{p.subject}</div>
                  <div className="text-[11px] text-muted-foreground">Section {p.section} · Room {p.room}</div>
                </div>
                <Button variant="ghost" size="sm" className="h-7" asChild>
                  <Link to="/teacher/attendance">Mark<ArrowRight className="h-3.5 w-3.5" /></Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-base flex items-center gap-2"><NotebookPen className="h-4 w-4" />Pending Lesson Plans</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/teacher/lesson-plans">All<ArrowRight className="h-3.5 w-3.5" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {draftPlans.length === 0 && <div className="text-xs text-muted-foreground p-4 text-center">All caught up.</div>}
            {draftPlans.slice(0, 4).map((p) => (
              <Link key={p.id} to="/teacher/lesson-plans/$id" params={{ id: p.id }} className="block p-2.5 rounded-md border hover:bg-muted/40">
                <div className="text-sm font-medium truncate">{p.title}</div>
                <div className="text-[11px] text-muted-foreground">{p.klass} · {p.chapter} · <span className="font-mono">{p.status}</span></div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Weak-Student Alerts</CardTitle>
            <Badge variant="outline">{weakAlert.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {weakAlert.length === 0 && <div className="text-xs text-muted-foreground p-4 text-center">No alerts in recent gradings.</div>}
            {weakAlert.map((s) => {
              const a = myAssignments.find((x) => x.id === s.assignmentId);
              return (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-md border">
                  <div className="flex-1 text-sm">{s.studentName}</div>
                  <Badge variant="destructive" className="text-[10px]">{s.marks}/{a?.maxMarks}</Badge>
                  <div className="text-[10px] text-muted-foreground">{a?.subject}</div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-base flex items-center gap-2"><Megaphone className="h-4 w-4" />Notices</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/teacher/notices">All<ArrowRight className="h-3.5 w-3.5" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentNotices.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-2.5 rounded-md hover:bg-muted/40 border">
                <div className="h-8 w-8 rounded-md flex items-center justify-center bg-info/10 text-info shrink-0"><Bell className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{n.title}</div>
                  <div className="text-[11px] text-muted-foreground">{n.by} · {new Date(n.publishedAt || n.createdAt).toLocaleDateString("en-IN")}</div>
                </div>
                <Badge variant="outline" className="text-[10px]">{n.category}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
