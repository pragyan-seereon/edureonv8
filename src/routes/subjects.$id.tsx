import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Pencil, Archive, Trash2, Activity } from "lucide-react";
import { toast } from "sonner";
import { useMemo } from "react";
import { useSubjects, subjectsApi, useSections, useSubjectMappings, activityApi } from "@/lib/store";

export const Route = createFileRoute("/subjects/$id")({
  head: () => ({ meta: [{ title: "Subject Detail — Edureon ERP" }] }),
  component: SubjectDetail,
});

function SubjectDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const subjects = useSubjects();
  const sections = useSections();
  const mappings = useSubjectMappings();
  const sub = subjects.find((s) => s.id === id);
  const acts = useMemo(() => activityApi.for("subject", id), [id]);

  if (!sub) {
    return (
      <PageContainer>
        <PageHeader title="Subject not found" eyebrow="Academic" />
        <Button variant="outline" onClick={() => nav({ to: "/classes" })}><ArrowLeft className="h-4 w-4" />Back</Button>
      </PageContainer>
    );
  }

  const subMaps = mappings.filter((m) => m.subjectId === sub.id);
  const teacherSet = Array.from(new Set(subMaps.map((m) => m.teacher)));

  return (
    <PageContainer>
      <PageHeader
        eyebrow={`${sub.code} · ${sub.dept}`}
        title={sub.name}
        description={`${sub.type} subject · ${subMaps.length} class mappings · ${teacherSet.length} teachers`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild><Link to="/classes"><ArrowLeft className="h-4 w-4" />Back</Link></Button>
            <Button variant="outline" size="sm" onClick={() => toast.info("Edit from Classes › Subjects → row menu")}><Pencil className="h-4 w-4" />Edit</Button>
            <Button variant="outline" size="sm" onClick={() => { subjectsApi.archive(sub.id, !sub.archived); toast.success(sub.archived ? "Restored" : "Archived"); }}><Archive className="h-4 w-4" />{sub.archived ? "Restore" : "Archive"}</Button>
            <Button variant="destructive" size="sm" onClick={() => { subjectsApi.remove(sub.id); toast.success("Deleted"); nav({ to: "/classes" }); }}><Trash2 className="h-4 w-4" />Delete</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="border-border/60"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Type</div><div className="text-xl font-semibold mt-1">{sub.type}</div></CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Classes</div><div className="text-xl font-semibold mt-1">{subMaps.length}</div></CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Teachers</div><div className="text-xl font-semibold mt-1">{teacherSet.length}</div></CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Weekly periods</div><div className="text-xl font-semibold mt-1">{subMaps.reduce((a, b) => a + b.periods, 0)}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="classes">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="plans">Lesson Plans</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity"><Activity className="h-3.5 w-3.5" />Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Teacher</TableHead><TableHead>Periods/wk</TableHead><TableHead>Room</TableHead><TableHead>Assessment</TableHead></TableRow></TableHeader>
              <TableBody>
                {subMaps.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Not mapped to any section yet</TableCell></TableRow>}
                {subMaps.map((m) => {
                  const sec = sections.find((s) => s.id === m.sectionId);
                  return (
                    <TableRow key={m.id} className="cursor-pointer" onClick={() => sec && nav({ to: "/classes/$id", params: { id: sec.id } })}>
                      <TableCell><Badge variant="secondary">{sec?.name ?? m.sectionId}</Badge></TableCell>
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

        <TabsContent value="teachers" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-0 divide-y">
            {teacherSet.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No teachers assigned</div>}
            {teacherSet.map((t) => (
              <div key={t} className="p-3 text-sm flex items-center justify-between"><span className="font-medium">{t}</span><Badge variant="outline">{subMaps.filter((m) => m.teacher === t).length} sections</Badge></div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-6 text-sm flex items-center justify-between">
            <div><CardTitle className="text-base">Linked assignments</CardTitle><CardDescription>Assignments tagged with {sub.name}</CardDescription></div>
            <Button asChild variant="outline" size="sm"><Link to="/assignments">Open Assignments →</Link></Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="exams" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-6 text-sm flex items-center justify-between">
            <div><CardTitle className="text-base">Linked exams</CardTitle><CardDescription>Exam papers and results for {sub.name}</CardDescription></div>
            <Button asChild variant="outline" size="sm"><Link to="/exams">Open Exams →</Link></Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="plans" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-6 text-sm flex items-center justify-between">
            <div><CardTitle className="text-base">Lesson plans</CardTitle><CardDescription>Chapter-wise plans for {sub.name}</CardDescription></div>
            <Button asChild variant="outline" size="sm"><Link to="/teacher/lesson-plans">Open Lesson Plans →</Link></Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid md:grid-cols-3 gap-3">
            <Card className="border-border/60"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Avg score</div><div className="text-2xl font-semibold mt-1">{72 + (sub.id.charCodeAt(0) % 15)}%</div></CardContent></Card>
            <Card className="border-border/60"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Pass rate</div><div className="text-2xl font-semibold mt-1 text-success">94%</div></CardContent></Card>
            <Card className="border-border/60"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Weak chapters</div><div className="text-2xl font-semibold mt-1">3</div></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-0 divide-y">
            {acts.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No activity yet</div>}
            {acts.map((a) => (
              <div key={a.id} className="p-3 text-sm"><div className="font-medium">{a.action}</div><div className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString()} · {a.by}</div></div>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
