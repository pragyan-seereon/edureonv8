import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi-card";
import { Users, CalendarCheck, ClipboardList, Trophy, BookOpen, Megaphone, ArrowRight } from "lucide-react";
import { useStudents, useAssignments, useSubmissions, useExams, useMarkEntries, useNotices, useLeaveRequests } from "@/lib/store";
import { useMemo } from "react";

export const Route = createFileRoute("/parent/dashboard")({
  head: () => ({ meta: [{ title: "Parent · Dashboard — Edureon" }] }),
  component: ParentDashboard,
});

const CHILD_ID = "STU1000";

function ParentDashboard() {
  const students = useStudents();
  const assignments = useAssignments();
  const subs = useSubmissions();
  const exams = useExams();
  const marks = useMarkEntries();
  const notices = useNotices();
  const leaves = useLeaveRequests();
  const child = students.find((s) => s.id === CHILD_ID) ?? students[0];
  const klass = child ? `${child.class}-${child.section}` : "X-B";

  const childAssignments = useMemo(() => assignments.filter((a) => a.klass === klass && a.status === "Published"), [assignments, klass]);
  const childSubs = useMemo(() => subs.filter((s) => s.studentId === CHILD_ID), [subs]);
  const pending = childAssignments.filter((a) => !childSubs.find((s) => s.assignmentId === a.id) || childSubs.find((s) => s.assignmentId === a.id)?.status === "Pending").length;
  const upExams = exams.filter((e) => e.class === child?.class && (e.status === "Scheduled" || e.status === "In Progress"));
  const recentMarks = marks.filter((m) => m.studentId === CHILD_ID && m.status === "Published").slice(0, 4);
  const myNotices = notices.filter((n) => n.status === "Published" && (n.audience === "Parents" || n.audience === "All")).slice(0, 4);
  const myLeaves = leaves.filter((l) => l.studentId === CHILD_ID);
  const attAlert = (child?.attendance ?? 95) < 85;

  return (
    <PageContainer>
      <PageHeader eyebrow="Parent Portal" title={`${child?.name}'s overview`}
        description={`Class ${klass} · ${child?.admissionNo}`}
        actions={<Button size="sm" asChild><Link to="/parent/children/$id" params={{ id: CHILD_ID }}>Open profile<ArrowRight className="h-4 w-4" /></Link></Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Attendance" value={`${child?.attendance ?? 93}%`} icon={<CalendarCheck className="h-5 w-5" />} tone={attAlert ? "warning" : "success"} />
        <KpiCard label="Pending Assignments" value={pending} icon={<ClipboardList className="h-5 w-5" />} tone="warning" />
        <KpiCard label="Upcoming Exams" value={upExams.length} icon={<BookOpen className="h-5 w-5" />} tone="info" />
        <KpiCard label="Recent Grades" value={recentMarks.length} icon={<Trophy className="h-5 w-5" />} tone="primary" />
      </div>

      {attAlert && <div className="mb-4 p-3 rounded-md border border-warning/30 bg-warning/10 text-warning text-sm">⚠️ Attendance dropped below 85%. Please review with your child.</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4" />Recent grades</CardTitle></CardHeader><CardContent className="space-y-1">
          {recentMarks.map((m) => <div key={m.id} className="flex justify-between text-sm border-b py-1.5"><span>{m.subject}</span><span className="font-semibold">{m.obtained}/{m.max}</span></div>)}
          {recentMarks.length === 0 && <div className="text-xs text-muted-foreground text-center p-4">No grades yet.</div>}
        </CardContent></Card>

        <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ClipboardList className="h-4 w-4" />Assignment status</CardTitle></CardHeader><CardContent className="space-y-1">
          {childAssignments.slice(0, 5).map((a) => { const s = childSubs.find((x) => x.assignmentId === a.id); return (
            <div key={a.id} className="flex items-center justify-between text-sm border-b py-1.5"><span className="truncate">{a.title}</span><Badge variant={s?.status === "Graded" ? "default" : "outline"} className="text-[10px]">{s?.status ?? "Pending"}</Badge></div>
          ); })}
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4" />Notices</CardTitle></CardHeader><CardContent className="space-y-2">
          {myNotices.map((n) => <div key={n.id} className="flex items-center gap-2 p-2 border rounded-md"><Badge variant="outline" className="text-[10px]">{n.category}</Badge><span className="flex-1 text-sm truncate">{n.title}</span><span className="text-[10px] text-muted-foreground">{new Date(n.publishedAt || n.createdAt).toLocaleDateString("en-IN")}</span></div>)}
        </CardContent></Card>

        <Card><CardHeader className="pb-2 flex-row items-center justify-between space-y-0"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Leave requests</CardTitle><Button size="sm" asChild><Link to="/parent/children/$id" params={{ id: CHILD_ID }}>Manage</Link></Button></CardHeader><CardContent className="space-y-2">
          {myLeaves.map((l) => <div key={l.id} className="p-2 border rounded-md text-sm"><div className="flex items-center justify-between"><span className="font-medium">{l.type} · {l.from} → {l.to}</span><Badge variant={l.status === "Approved" ? "default" : l.status === "Rejected" ? "destructive" : "outline"} className="text-[10px]">{l.status}</Badge></div><div className="text-[11px] text-muted-foreground">{l.reason}</div></div>)}
          {myLeaves.length === 0 && <div className="text-xs text-muted-foreground text-center p-4">No leave requests.</div>}
        </CardContent></Card>
      </div>
    </PageContainer>
  );
}
