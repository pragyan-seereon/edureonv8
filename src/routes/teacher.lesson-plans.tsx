import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, NotebookPen, Send, CheckCircle2, Clock, FileEdit, Archive, ArchiveRestore } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useLessonPlans, useSubjects, useSections, lessonPlansApi, type LessonPlan } from "@/lib/store";

export const Route = createFileRoute("/teacher/lesson-plans")({
  head: () => ({ meta: [{ title: "Lesson Plans — Edureon" }] }),
  component: LessonPlansPage,
});

const statusColor: Record<LessonPlan["status"], string> = {
  Draft: "bg-muted text-muted-foreground border-border",
  Submitted: "bg-info/10 text-info border-info/20",
  Approved: "bg-success/10 text-success border-success/20",
  "Changes Requested": "bg-warning/15 text-warning border-warning/20",
};
const statusIcon = (s: LessonPlan["status"]) => {
  if (s === "Approved") return <CheckCircle2 className="h-3 w-3" />;
  if (s === "Submitted") return <Clock className="h-3 w-3" />;
  if (s === "Changes Requested") return <FileEdit className="h-3 w-3" />;
  return <NotebookPen className="h-3 w-3" />;
};

function LessonPlansPage() {
  const plans = useLessonPlans();
  const subjects = useSubjects();
  const sections = useSections();
  const [open, setOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [filter, setFilter] = useState<"all" | LessonPlan["status"]>("all");
  const [form, setForm] = useState({ title: "", subject: subjects[0]?.name || "Mathematics", klass: sections[0]?.name || "X-B", teacher: "A. Mehta", chapter: "", topic: "", method: "", weekOf: new Date().toISOString().slice(0,10), periods: 3 });

  const visible = useMemo(() => plans.filter((p) => (showArchived ? p.archived : !p.archived) && (filter === "all" || p.status === filter)), [plans, showArchived, filter]);

  const submit = (asDraft: boolean) => {
    if (!form.title || !form.chapter) { toast.error("Title and chapter required"); return; }
    lessonPlansApi.add({ ...form, materials: [], status: asDraft ? "Draft" : "Submitted", completion: "Not Started" });
    toast.success(asDraft ? "Saved as draft" : "Sent to HOD for approval");
    setOpen(false);
    setForm({ ...form, title: "", chapter: "", topic: "", method: "" });
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Teacher Portal"
        title="Lesson Plans"
        description="Plan, submit, track approvals and weekly completion of every lesson."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="gradient-primary border-0"><Plus className="h-4 w-4" />New Plan</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Create lesson plan</DialogTitle><DialogDescription>Draft or send straight to HOD for approval.</DialogDescription></DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5 md:col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Topic name learners will recognize" /></div>
                <div className="space-y-1.5"><Label>Section</Label>
                  <Select value={form.klass} onValueChange={(v) => setForm((f) => ({ ...f, klass: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{sections.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Subject</Label>
                  <Select value={form.subject} onValueChange={(v) => setForm((f) => ({ ...f, subject: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Chapter</Label><Input value={form.chapter} onChange={(e) => setForm((f) => ({ ...f, chapter: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Topic</Label><Input value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Week of (Mon)</Label><Input type="date" value={form.weekOf} onChange={(e) => setForm((f) => ({ ...f, weekOf: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Periods</Label><Input type="number" value={form.periods} onChange={(e) => setForm((f) => ({ ...f, periods: Number(e.target.value) }))} /></div>
                <div className="space-y-1.5 md:col-span-2"><Label>Teaching Method / Resources</Label><Textarea rows={3} value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => submit(true)}>Save Draft</Button>
                <Button className="gradient-primary border-0" onClick={() => submit(false)}><Send className="h-4 w-4" />Submit to HOD</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="border-border/60">
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <div><CardTitle className="font-display text-base">My Plans</CardTitle><CardDescription>{visible.length} entries</CardDescription></div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Changes Requested">Changes Requested</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => setShowArchived((v) => !v)}>{showArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}{showArchived ? "Active" : "Archived"}</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {visible.length === 0 && <div className="text-sm text-muted-foreground text-center p-6">No lesson plans found.</div>}
          {visible.map((p) => (
            <Link key={p.id} to="/teacher/lesson-plans/$id" params={{ id: p.id }} className="flex items-start gap-3 p-3 border rounded-md hover:bg-muted/30">
              <div className="h-9 w-9 rounded-md flex items-center justify-center bg-primary/10 text-primary shrink-0"><NotebookPen className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] text-muted-foreground">{p.id}</span>
                  <span className="text-sm font-medium">{p.title}</span>
                  <Badge variant="outline" className={`text-[10px] ml-auto ${statusColor[p.status]}`}>{statusIcon(p.status)}{p.status}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{p.completion}</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {p.klass} · {p.subject} · {p.chapter} · Week of {p.weekOf} · {p.periods} periods
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 italic line-clamp-1">{p.topic} · Method: {p.method}</div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
