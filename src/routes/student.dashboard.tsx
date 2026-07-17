import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { KpiCard } from "@/components/kpi-card";
import { CalendarDays, BookOpen, Trophy, IndianRupee, Library, Bell, ArrowRight, ClipboardList, FileBox, Megaphone } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAssignments, useSubmissions, useExams, useMaterials, useNotices, useStudents, useMarkEntries, useAcademicCalendar } from "@/lib/store";
import { useMemo } from "react";

export const Route = createFileRoute("/student/dashboard")({
  head: () => ({ meta: [{ title: "Student · Dashboard — Edureon" }] }),
  component: StudentDashboard,
});

const STUDENT_ID = "STU1000";
const STUDENT_CLASS = "X-B";

function StudentDashboard() {
  const { user } = useAuth();
  const students = useStudents();
  const assignments = useAssignments();
  const subs = useSubmissions();
  const exams = useExams();
  const materials = useMaterials();
  const notices = useNotices();
  const marks = useMarkEntries();
  const cal = useAcademicCalendar();
  const me = students.find((s) => s.id === STUDENT_ID) ?? students[0];
  const klass = me ? `${me.class}-${me.section}` : STUDENT_CLASS;
  const name = user?.name?.split(" ")[0] ?? me?.name?.split(" ")[0] ?? "Student";

  const myAssignments = useMemo(() => assignments.filter((a) => a.klass === klass && a.status === "Published"), [assignments, klass]);
  const mySubs = useMemo(() => subs.filter((s) => s.studentId === STUDENT_ID), [subs]);
  const pending = myAssignments.filter((a) => { const s = mySubs.find((x) => x.assignmentId === a.id); return !s || s.status === "Pending" || s.status === "Returned"; }).length;
  const upExams = exams.filter((e) => (e.status === "Scheduled" || e.status === "In Progress") && e.class === me?.class).slice(0, 4);
  const mats = materials.filter((m) => m.klasses.includes(klass)).slice(0, 4);
  const myNotices = notices.filter((n) => n.status === "Published" && (n.audience === "Students" || n.audience === "All")).slice(0, 4);
  const myMarks = marks.filter((m) => m.studentId === STUDENT_ID && m.status === "Published").slice(0, 4);
  const events = cal.filter((c) => !c.archived).slice(0, 3);

  return (
    <PageContainer>
      <PageHeader eyebrow="Student Portal" title={`Hi ${name} 👋`}
        description={`Class ${klass} · ${me?.admissionNo ?? "ADM-2025-0014"}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Attendance" value={`${me?.attendance ?? 93}%`} icon={<CalendarDays className="h-5 w-5" />} tone="success" />
        <KpiCard label="Pending Assignments" value={pending} icon={<ClipboardList className="h-5 w-5" />} tone="warning" />
        <KpiCard label="Upcoming Exams" value={upExams.length} icon={<BookOpen className="h-5 w-5" />} tone="info" />
        <KpiCard label="Study Materials" value={mats.length} icon={<FileBox className="h-5 w-5" />} tone="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <div><CardTitle className="font-display text-base">Upcoming Assignments</CardTitle><CardDescription>{myAssignments.length} active</CardDescription></div>
            <Button variant="ghost" size="sm" asChild><Link to="/student/assignments">All<ArrowRight className="h-3.5 w-3.5" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {myAssignments.slice(0, 5).map((a) => {
              const s = mySubs.find((x) => x.assignmentId === a.id);
              return (
                <Link key={a.id} to="/student/assignments" className="flex items-center gap-3 p-2.5 border rounded-md hover:bg-muted/40">
                  <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{a.title}</div><div className="text-[11px] text-muted-foreground">{a.subject} · due {a.due}</div></div>
                  <Badge variant={s?.status === "Graded" ? "default" : s?.status === "Submitted" ? "secondary" : "outline"} className="text-[10px]">{s?.status ?? "Pending"}</Badge>
                </Link>
              );
            })}
            {myAssignments.length === 0 && <div className="text-xs text-muted-foreground p-4 text-center">No assignments.</div>}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="font-display text-base flex items-center gap-2"><IndianRupee className="h-4 w-4" />Fees</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Term 2 — paid</span><span className="font-semibold">₹78,000 / ₹1,18,000</span></div>
              <Progress value={66} className="h-2" />
            </div>
            <div className="text-xs text-muted-foreground">Balance ₹40,000 due 30 Nov 2025</div>
            <Button className="w-full gradient-primary border-0" asChild><Link to="/student/fees">Pay Now</Link></Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="border-border/60">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-base flex items-center gap-2"><Trophy className="h-4 w-4" />Latest Results</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/student/results">All<ArrowRight className="h-3.5 w-3.5" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {myMarks.map((m) => <div key={m.id} className="flex justify-between text-sm border-b py-1.5"><span>{m.subject}</span><span className="font-semibold">{m.obtained}/{m.max}</span></div>)}
            {myMarks.length === 0 && <div className="text-xs text-muted-foreground text-center p-4">No published results.</div>}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-base flex items-center gap-2"><FileBox className="h-4 w-4" />Study Materials</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/student/materials">All<ArrowRight className="h-3.5 w-3.5" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {mats.map((m) => <div key={m.id} className="p-2 border rounded-md text-sm"><div className="font-medium truncate">{m.title}</div><div className="text-[10px] text-muted-foreground">{m.subject} · {m.type}</div></div>)}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-base flex items-center gap-2"><CalendarDays className="h-4 w-4" />Calendar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {events.map((e) => <div key={e.id} className="p-2 border rounded-md text-sm"><div className="font-medium">{e.event}</div><div className="text-[10px] text-muted-foreground">{e.date} · {e.type}</div></div>)}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="font-display text-base flex items-center gap-2"><Megaphone className="h-4 w-4" />Notices</CardTitle>
          <Button variant="ghost" size="sm" asChild><Link to="/student/notices">All<ArrowRight className="h-3.5 w-3.5" /></Link></Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {myNotices.map((n) => (
            <div key={n.id} className="flex items-center gap-3 p-2.5 border rounded-md hover:bg-muted/40">
              <Badge variant="outline" className="text-[10px]">{n.category}</Badge>
              <div className="flex-1 text-sm">{n.title}</div>
              <div className="text-[10px] text-muted-foreground">{new Date(n.publishedAt || n.createdAt).toLocaleDateString("en-IN")}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-4 text-[10px] text-muted-foreground flex items-center gap-2"><Bell className="h-3 w-3" />Library, attendance and timetable available in the side menu.<Library className="h-3 w-3" /></div>
    </PageContainer>
  );
}
