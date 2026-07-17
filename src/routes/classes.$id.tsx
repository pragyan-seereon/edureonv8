import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Pencil, Archive, Trash2, Users, BookOpen, CalendarDays, ClipboardList, FileText, Activity, FileBadge2 } from "lucide-react";
import { toast } from "sonner";
import { useMemo } from "react";
import {
  useSections, sectionsApi, useSubjects, useSubjectMappings,
  useStudents, activityApi,
} from "@/lib/store";

export const Route = createFileRoute("/classes/$id")({
  head: () => ({ meta: [{ title: "Class Detail — Edureon ERP" }] }),
  component: ClassDetail,
});

function ClassDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const sections = useSections();
  const subjects = useSubjects();
  const mappings = useSubjectMappings();
  const students = useStudents();
  const sec = sections.find((s) => s.id === id);
  const acts = useMemo(() => activityApi.for("section", id), [id]);

  if (!sec) {
    return (
      <PageContainer>
        <PageHeader title="Class not found" eyebrow="Academic" />
        <Button variant="outline" onClick={() => nav({ to: "/classes" })}><ArrowLeft className="h-4 w-4" />Back</Button>
      </PageContainer>
    );
  }
  const pct = Math.round((sec.students / sec.cap) * 100);
  const secMaps = mappings.filter((m) => m.sectionId === sec.id);
  const secStudents = students.filter((s) => s.class === sec.name).slice(0, 50);

  return (
    <PageContainer>
      <PageHeader
        eyebrow={`Class ${sec.class} · Room ${sec.room}`}
        title={`Section ${sec.name}`}
        description={`Class Teacher ${sec.teacher} · ${sec.students}/${sec.cap} students · ${secMaps.length} subjects mapped`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild><Link to="/classes"><ArrowLeft className="h-4 w-4" />Back</Link></Button>
            <Button variant="outline" size="sm" onClick={() => toast.info("Open Edit dialog from the Classes page → row menu")}><Pencil className="h-4 w-4" />Edit</Button>
            <Button variant="outline" size="sm" onClick={() => { sectionsApi.archive(sec.id, !sec.archived); toast.success(sec.archived ? "Restored" : "Archived"); }}><Archive className="h-4 w-4" />{sec.archived ? "Restore" : "Archive"}</Button>
            <Button variant="destructive" size="sm" onClick={() => { sectionsApi.remove(sec.id); toast.success("Deleted"); nav({ to: "/classes" }); }}><Trash2 className="h-4 w-4" />Delete</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="border-border/60"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Occupancy</div><div className="text-2xl font-semibold mt-1">{pct}%</div><Progress value={pct} className="h-1.5 mt-2" /></CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Subjects</div><div className="text-2xl font-semibold mt-1">{secMaps.length}</div></CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Avg attendance</div><div className="text-2xl font-semibold mt-1 text-success">92%</div></CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Term avg</div><div className="text-2xl font-semibold mt-1">76%</div></CardContent></Card>
      </div>

      <Tabs defaultValue="students">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="students"><Users className="h-3.5 w-3.5" />Students</TabsTrigger>
          <TabsTrigger value="subjects"><BookOpen className="h-3.5 w-3.5" />Subjects</TabsTrigger>
          <TabsTrigger value="timetable"><CalendarDays className="h-3.5 w-3.5" />Timetable</TabsTrigger>
          <TabsTrigger value="assignments"><ClipboardList className="h-3.5 w-3.5" />Assignments</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="docs"><FileText className="h-3.5 w-3.5" />Documents</TabsTrigger>
          <TabsTrigger value="activity"><Activity className="h-3.5 w-3.5" />Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Parent</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {secStudents.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No students mapped to {sec.name}</TableCell></TableRow>}
                {secStudents.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => nav({ to: "/students/$id", params: { id: s.id } })}>
                    <TableCell className="font-mono text-xs">{s.id}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.class}</TableCell>
                    <TableCell>{(s as { parent?: string }).parent ?? "—"}</TableCell>
                    <TableCell><Button size="sm" variant="ghost">Open →</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="subjects" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Teacher</TableHead><TableHead>Periods/wk</TableHead><TableHead>Room</TableHead><TableHead>Assessment</TableHead></TableRow></TableHeader>
              <TableBody>
                {secMaps.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No subjects mapped — go to Classes › Subject Mapping</TableCell></TableRow>}
                {secMaps.map((m) => {
                  const sub = subjects.find((s) => s.id === m.subjectId);
                  return (
                    <TableRow key={m.id} className="cursor-pointer" onClick={() => sub && nav({ to: "/subjects/$id", params: { id: sub.id } })}>
                      <TableCell className="font-medium">{sub?.name ?? m.subjectId}</TableCell>
                      <TableCell>{m.teacher}</TableCell>
                      <TableCell>{m.periods}</TableCell>
                      <TableCell>{m.room}</TableCell>
                      <TableCell><Badge variant="outline">{m.assessment}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="timetable" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-6 text-center">
            <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <CardTitle className="text-base mb-2">View live timetable</CardTitle>
            <CardDescription className="mb-4">Edit, swap, lock, clone and publish in the Timetable Engine.</CardDescription>
            <Button asChild className="gradient-primary border-0"><Link to="/timetable">Open Timetable →</Link></Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-6 text-sm">
            <div className="flex items-center justify-between mb-3"><div><CardTitle className="text-base">Active assignments</CardTitle><CardDescription>Assignments mapped to this section</CardDescription></div><Button asChild variant="outline" size="sm"><Link to="/assignments">Open Assignments →</Link></Button></div>
            <div className="text-muted-foreground">Assignments linkage flows from the Assignments module.</div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-6">
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => {
                const v = (i * 13 + sec.name.length) % 100;
                const tone = v > 85 ? "bg-success/70" : v > 70 ? "bg-warning/70" : "bg-destructive/70";
                return <div key={i} className={`h-8 rounded ${tone}`} title={`Day ${i + 1}: ${v}%`} />;
              })}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Daily attendance heatmap — last 35 school days</div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="exams" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead>Exam</TableHead><TableHead>Avg %</TableHead><TableHead>Top</TableHead><TableHead>Pass %</TableHead></TableRow></TableHeader>
              <TableBody>
                {["Unit Test 1","Mid Term","Unit Test 2","Pre-Board"].map((e, i) => (
                  <TableRow key={e}><TableCell className="font-medium">{e}</TableCell><TableCell>{72 + i * 2}%</TableCell><TableCell>{91 + i}%</TableCell><TableCell className="text-success">{93 + i}%</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid md:grid-cols-3 gap-3">
            {[{l:"Top performers",v:"7 students",t:"success"},{l:"At-risk",v:"3 students",t:"warning"},{l:"Subject leader",v:"Mathematics",t:"info"}].map((k) => (
              <Card key={k.l} className="border-border/60"><CardContent className="p-4"><div className="text-xs text-muted-foreground">{k.l}</div><div className="text-xl font-semibold mt-1">{k.v}</div></CardContent></Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-6 text-sm space-y-2">
            {["Section attendance register.pdf","Class photo 2025.jpg","Parent meeting minutes Q2.pdf"].map((d) => (
              <div key={d} className="flex items-center justify-between border rounded-md px-3 py-2"><div className="flex items-center gap-2"><FileBadge2 className="h-4 w-4 text-muted-foreground" /><span>{d}</span></div><Button size="sm" variant="ghost">Download</Button></div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-0 divide-y">
            {acts.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No activity yet</div>}
            {acts.map((a) => (
              <div key={a.id} className="p-3 text-sm flex items-center justify-between">
                <div><div className="font-medium">{a.action}</div><div className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString()} · {a.by}</div></div>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
