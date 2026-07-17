import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ClipboardList, Upload, RotateCcw, CheckCircle2, MessageSquare } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useAssignments, useSubmissions, submissionsApi, type Assignment, type Submission } from "@/lib/store";

export const Route = createFileRoute("/student/assignments")({
  head: () => ({ meta: [{ title: "My Assignments — Edureon" }] }),
  component: StudentAssignments,
});

const STUDENT_ID = "STU1000";
const STUDENT_NAME = "Aarav Sharma";
const STUDENT_CLASS = "X-B";

function StudentAssignments() {
  const assignments = useAssignments();
  const subs = useSubmissions();
  const [open, setOpen] = useState<Assignment | null>(null);
  const [files, setFiles] = useState("submission.pdf");
  const [text, setText] = useState("");

  const mine = useMemo(() => assignments.filter((a) => a.klass === STUDENT_CLASS && a.status !== "Draft"), [assignments]);
  const subOf = (a: Assignment): Submission | undefined => subs.find((s) => s.assignmentId === a.id && s.studentId === STUDENT_ID);

  const submit = () => {
    if (!open) return;
    submissionsApi.submit(open.id, STUDENT_ID, STUDENT_NAME, [files], text);
    toast.success("Submission saved");
    setOpen(null); setText("");
  };

  const grouped = {
    pending: mine.filter((a) => { const s = subOf(a); return !s || s.status === "Pending" || s.status === "Returned"; }),
    submitted: mine.filter((a) => { const s = subOf(a); return s && (s.status === "Submitted" || s.status === "Late" || s.status === "Resubmitted"); }),
    graded: mine.filter((a) => { const s = subOf(a); return s && s.status === "Graded"; }),
  };
  const today = new Date().toISOString().slice(0, 10);
  const overdue = grouped.pending.filter((a) => a.due && a.due < today);

  return (
    <PageContainer>
      <PageHeader eyebrow="Student Portal" title="My Assignments" description={`Class ${STUDENT_CLASS} · ${mine.length} assignments`} />

      {/* Push-notification style cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-warning/20 text-warning flex items-center justify-center"><ClipboardList className="h-5 w-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">Pending Assignments</div>
              <div className="text-2xl font-display font-semibold">{grouped.pending.length}</div>
            </div>
            <Badge variant="outline">Action Required</Badge>
          </CardContent>
        </Card>
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-destructive/20 text-destructive flex items-center justify-center"><ClipboardList className="h-5 w-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">Overdue / Late</div>
              <div className="text-2xl font-display font-semibold text-destructive">{overdue.length}</div>
            </div>
            <Badge variant="destructive">Submit Now</Badge>
          </CardContent>
        </Card>
        <Card className="border-success/40 bg-success/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-success/20 text-success flex items-center justify-center"><CheckCircle2 className="h-5 w-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">Submitted</div>
              <div className="text-2xl font-display font-semibold text-success">{grouped.submitted.length + grouped.graded.length}</div>
            </div>
            <Badge className="bg-success/10 text-success border-success/20" variant="outline">On Track</Badge>
          </CardContent>
        </Card>
      </div>


      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({grouped.pending.length})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted ({grouped.submitted.length})</TabsTrigger>
          <TabsTrigger value="graded">Graded ({grouped.graded.length})</TabsTrigger>
        </TabsList>
        {(["pending","submitted","graded"] as const).map((k) => (
          <TabsContent key={k} value={k}>
            <Card><CardContent className="p-0 divide-y">
              {grouped[k].map((a) => {
                const s = subOf(a);
                return (
                  <div key={a.id} className="p-3 flex items-start gap-3">
                    <div className="h-9 w-9 rounded-md flex items-center justify-center bg-primary/10 text-primary shrink-0"><ClipboardList className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap"><span className="text-sm font-medium">{a.title}</span><Badge variant="outline" className="text-[10px]">{a.subject}</Badge><Badge variant="secondary" className="text-[10px]">Due {a.due}</Badge>{s?.status === "Graded" && <Badge className="text-[10px]">{s.marks}/{a.maxMarks}</Badge>}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">{a.instructions}</div>
                      {s?.feedback && <div className="text-[11px] mt-1 p-2 bg-muted/40 rounded flex gap-1"><MessageSquare className="h-3 w-3 mt-0.5" />{s.feedback}</div>}
                      {s?.resubmissionCount ? <div className="text-[10px] text-muted-foreground mt-0.5">{s.resubmissionCount} resubmission(s)</div> : null}
                      <div className="flex gap-2 mt-2">
                        {(!s || s.status === "Pending" || s.status === "Returned") && <Button size="sm" onClick={() => setOpen(a)}><Upload className="h-3.5 w-3.5" />Upload</Button>}
                        {s && (s.status === "Submitted" || s.status === "Late" || s.status === "Graded" || s.status === "Resubmitted") && <Button size="sm" variant="outline" onClick={() => setOpen(a)}><RotateCcw className="h-3.5 w-3.5" />Resubmit</Button>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {grouped[k].length === 0 && <div className="text-sm text-muted-foreground text-center p-6">Nothing here.</div>}
            </CardContent></Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{open?.title}</DialogTitle><DialogDescription>{open?.subject} · max {open?.maxMarks} marks · due {open?.due}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><label className="text-xs">File name / link</label><Input value={files} onChange={(e) => setFiles(e.target.value)} /></div>
            <div className="space-y-1.5"><label className="text-xs">Notes (optional)</label><Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={submit} className="gradient-primary border-0"><CheckCircle2 className="h-4 w-4" />Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
