import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, CheckCircle2, Plus, Trash2, Archive, Paperclip } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLessonPlans, useMaterials, lessonPlansApi, activityApi, type LessonPlan } from "@/lib/store";

export const Route = createFileRoute("/teacher/lesson-plans/$id")({
  head: () => ({ meta: [{ title: "Lesson Plan — Edureon" }] }),
  component: LessonPlanDetail,
});

function LessonPlanDetail() {
  const { id } = useParams({ from: "/teacher/lesson-plans/$id" });
  useLessonPlans();
  const materials = useMaterials();
  const plan = lessonPlansApi.get(id);
  const [logNote, setLogNote] = useState("");
  const [attachId, setAttachId] = useState("");

  if (!plan) {
    return <PageContainer><div className="text-sm text-muted-foreground">Plan not found. <Link to="/teacher/lesson-plans" className="underline">Back</Link></div></PageContainer>;
  }
  const logs = activityApi.for("lesson-plan", plan.id);
  const linked = materials.filter((m) => plan.materials.includes(m.id));
  const available = materials.filter((m) => !plan.materials.includes(m.id) && m.subject === plan.subject);

  return (
    <PageContainer>
      <PageHeader
        eyebrow={plan.id}
        title={plan.title}
        description={`${plan.klass} · ${plan.subject} · ${plan.chapter} · Week of ${plan.weekOf}`}
        actions={
          <>
            <Button variant="ghost" size="sm" asChild><Link to="/teacher/lesson-plans"><ArrowLeft className="h-4 w-4" />Back</Link></Button>
            {plan.status === "Draft" && <Button size="sm" onClick={() => { lessonPlansApi.submit(plan.id); toast.success("Submitted"); }}><Send className="h-4 w-4" />Submit</Button>}
            {plan.status === "Submitted" && <Button size="sm" onClick={() => { lessonPlansApi.approve(plan.id); toast.success("Approved"); }} className="gradient-primary border-0"><CheckCircle2 className="h-4 w-4" />Approve</Button>}
            <Button size="sm" variant="outline" onClick={() => { lessonPlansApi.archive(plan.id, !plan.archived); toast.success(plan.archived ? "Restored" : "Archived"); }}><Archive className="h-4 w-4" />{plan.archived ? "Restore" : "Archive"}</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <Card><CardContent className="p-3"><div className="text-[11px] text-muted-foreground uppercase">Status</div><div className="font-semibold">{plan.status}</div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="text-[11px] text-muted-foreground uppercase">Completion</div>
          <Select value={plan.completion} onValueChange={(v) => { lessonPlansApi.setCompletion(plan.id, v as LessonPlan["completion"]); toast.success("Updated"); }}>
            <SelectTrigger className="h-7 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Not Started">Not Started</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent>
          </Select>
        </CardContent></Card>
        <Card><CardContent className="p-3"><div className="text-[11px] text-muted-foreground uppercase">Periods</div><div className="font-semibold">{plan.periods}</div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="text-[11px] text-muted-foreground uppercase">Teacher</div><div className="font-semibold">{plan.teacher}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="mapping">Subject / Timetable</TabsTrigger>
          <TabsTrigger value="materials">Materials ({linked.length})</TabsTrigger>
          <TabsTrigger value="logs">Completion Logs ({plan.completionLogs.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><Card><CardContent className="p-4 space-y-3 text-sm">
          <div><div className="text-[11px] text-muted-foreground uppercase mb-1">Topic</div>{plan.topic}</div>
          <div><div className="text-[11px] text-muted-foreground uppercase mb-1">Method / Resources</div>{plan.method}</div>
        </CardContent></Card></TabsContent>

        <TabsContent value="mapping"><Card><CardContent className="p-4 space-y-2 text-sm">
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Subject</span><span>{plan.subject}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Class</span><span>{plan.klass}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Timetable periods</span><span>{plan.periods} per week</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Week starting</span><span>{plan.weekOf}</span></div>
        </CardContent></Card></TabsContent>

        <TabsContent value="materials"><Card><CardHeader className="pb-2"><CardTitle className="text-base">Linked Study Materials</CardTitle></CardHeader><CardContent className="space-y-2">
          {linked.map((m) => (
            <div key={m.id} className="flex items-center gap-2 p-2 border rounded-md">
              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex-1"><div className="text-sm font-medium">{m.title}</div><div className="text-[10px] text-muted-foreground">{m.type} · {m.subject}</div></div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { lessonPlansApi.detachMaterial(plan.id, m.id); toast.success("Detached"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Select value={attachId} onValueChange={setAttachId}>
              <SelectTrigger className="h-8"><SelectValue placeholder="Attach existing material…" /></SelectTrigger>
              <SelectContent>{available.map((m) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" disabled={!attachId} onClick={() => { lessonPlansApi.attachMaterial(plan.id, attachId); setAttachId(""); toast.success("Attached"); }}><Plus className="h-4 w-4" />Add</Button>
          </div>
        </CardContent></Card></TabsContent>

        <TabsContent value="logs"><Card><CardContent className="p-4 space-y-3">
          <div className="flex gap-2"><Input placeholder="Log a completion note…" value={logNote} onChange={(e) => setLogNote(e.target.value)} /><Button size="sm" onClick={() => { if (!logNote) return; lessonPlansApi.addLog(plan.id, logNote); setLogNote(""); toast.success("Logged"); }}>Add</Button></div>
          <div className="space-y-2">
            {plan.completionLogs.map((l) => (
              <div key={l.id} className="p-2 border rounded-md text-sm"><div className="flex gap-2 items-center text-[11px] text-muted-foreground"><span>{l.date}</span><span>·</span><span>{l.by}</span></div>{l.note}</div>
            ))}
            {plan.completionLogs.length === 0 && <div className="text-xs text-muted-foreground text-center p-4">No logs yet.</div>}
          </div>
        </CardContent></Card></TabsContent>

        <TabsContent value="activity"><Card><CardContent className="p-4 space-y-2">
          {logs.map((a) => <div key={a.id} className="flex justify-between text-xs border-b py-1.5"><span>{a.action}</span><span className="text-muted-foreground">{new Date(a.at).toLocaleString("en-IN")}</span></div>)}
          {logs.length === 0 && <div className="text-xs text-muted-foreground text-center p-4">No activity.</div>}
        </CardContent></Card></TabsContent>
      </Tabs>

      <Card className="mt-4"><CardContent className="p-4 text-sm"><Badge variant="secondary" className="mb-2">HOD action</Badge>
        <Textarea placeholder="Request changes (HOD)…" id="rc" rows={2} />
        <Button size="sm" variant="outline" className="mt-2" onClick={() => { const v = (document.getElementById("rc") as HTMLTextAreaElement).value; if (!v) return; lessonPlansApi.requestChanges(plan.id, v); toast.success("Changes requested"); }}>Request changes</Button>
      </CardContent></Card>
    </PageContainer>
  );
}
