import { createFileRoute, useParams, Link, useNavigate } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  assignmentsApi, submissionsApi, useAssignments, useSubmissions, useComments, commentsApi,
  useActivity, type SubStatus, type Submission,
} from "@/lib/store";
import { ArrowLeft, Copy, Archive, CheckCircle2, RotateCcw, Send, MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/assignments/$id")({
  head: () => ({ meta: [{ title: "Assignment — Edureon ERP" }] }),
  component: AssignmentDetail,
});

function AssignmentDetail() {
  const { id } = useParams({ from: "/assignments/$id" });
  const navigate = useNavigate();
  const assignments = useAssignments();
  const allSubs = useSubmissions();
  const comments = useComments();
  const activity = useActivity();
  const a = assignments.find((x) => x.id === id);
  const subs = useMemo(() => allSubs.filter((s) => s.assignmentId === id), [allSubs, id]);
  const [statusFilter, setStatusFilter] = useState<SubStatus | "All">("All");
  const [comment, setComment] = useState("");
  const [draftGrades, setDraftGrades] = useState<Record<string, string>>({});
  const [draftFb, setDraftFb] = useState<Record<string, string>>({});

  if (!a) return (
    <PageContainer>
      <PageHeader title="Assignment not found" eyebrow="Academic" />
      <Link to="/assignments"><Button variant="outline"><ArrowLeft className="h-4 w-4" />Back</Button></Link>
    </PageContainer>
  );

  const total = subs.length;
  const submitted = subs.filter((s) => s.status !== "Pending").length;
  const graded = subs.filter((s) => s.status === "Graded").length;
  const late = subs.filter((s) => s.late).length;
  const avg = subs.filter((s) => s.marks != null).reduce((acc, s) => acc + (s.marks || 0), 0) / Math.max(1, graded);

  const filtered = subs.filter((s) => statusFilter === "All" ? true : s.status === statusFilter);
  const acts = activity.filter((ac) => (ac.entity === "assignment" && ac.entityId === id) || (ac.entity === "submission" && ac.entityId.includes(id)));

  return (
    <PageContainer>
      <PageHeader
        eyebrow={`Assignment · ${a.id}`}
        title={a.title}
        description={`${a.subject} · Class ${a.klass} · ${a.teacher} · Due ${a.due} · ${a.maxMarks} marks`}
        actions={<>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/assignments" })}><ArrowLeft className="h-4 w-4" />Back</Button>
          <Button variant="outline" size="sm" onClick={() => { const nid = assignmentsApi.duplicate(a.id); if (nid) { toast.success("Duplicated"); navigate({ to: "/assignments/$id", params: { id: nid } }); } }}><Copy className="h-4 w-4" />Duplicate</Button>
          {a.status === "Draft" && <Button size="sm" className="gradient-primary border-0" onClick={() => { assignmentsApi.publish(a.id); toast.success("Published · students notified"); }}><Send className="h-4 w-4" />Publish</Button>}
          {a.status === "Published" && <Button size="sm" variant="outline" onClick={() => { assignmentsApi.close(a.id); toast.success("Closed"); }}>Close</Button>}
          {a.status === "Closed" && <Button size="sm" variant="outline" onClick={() => { assignmentsApi.reopen(a.id); toast.success("Reopened"); }}><RotateCcw className="h-4 w-4" />Reopen</Button>}
          <Button variant="outline" size="sm" onClick={() => { assignmentsApi.archive(a.id, !a.archived); toast.success(a.archived ? "Restored" : "Archived"); }}><Archive className="h-4 w-4" />{a.archived ? "Restore" : "Archive"}</Button>
        </>}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { l: "Status", v: a.status },
          { l: "Submitted", v: `${submitted}/${total}` },
          { l: "Graded", v: `${graded}/${total}` },
          { l: "Late", v: late.toString() },
          { l: "Avg Marks", v: graded ? avg.toFixed(1) : "—" },
        ].map((k) => (
          <Card key={k.l} className="border-border/60"><CardContent className="p-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.l}</div><div className="text-xl font-display font-semibold mt-1">{k.v}</div></CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="subs">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subs">Submissions ({submitted})</TabsTrigger>
          <TabsTrigger value="grading">Grading Queue ({subs.filter(s => s.status === "Submitted" || s.status === "Late" || s.status === "Resubmitted").length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="comments">Comments ({comments.filter(c => c.entity === "assignment" && c.entityId === id).length})</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid md:grid-cols-2 gap-4">
          <Card className="border-border/60"><CardHeader><CardTitle className="text-base">Instructions</CardTitle></CardHeader><CardContent><p className="text-sm whitespace-pre-wrap">{a.instructions}</p></CardContent></Card>
          <Card className="border-border/60"><CardHeader><CardTitle className="text-base">Attachments</CardTitle></CardHeader><CardContent>
            {a.attachments.length === 0 ? <p className="text-xs text-muted-foreground">No attachments</p> :
              <ul className="text-sm space-y-1">{a.attachments.map((f) => <li key={f} className="flex items-center gap-2"><Badge variant="outline">{f}</Badge></li>)}</ul>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="subs" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="flex-row justify-between items-center space-y-0">
              <CardDescription>Filter by status</CardDescription>
              <div className="flex gap-1">
                {(["All","Pending","Submitted","Late","Graded","Returned","Resubmitted"] as const).map((s) => (
                  <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} className="h-7 text-xs" onClick={() => setStatusFilter(s as SubStatus | "All")}>{s}</Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Status</TableHead><TableHead>Submitted</TableHead><TableHead>Marks</TableHead><TableHead>Resubs</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.studentName}</TableCell>
                      <TableCell><Badge variant={s.status === "Graded" ? "default" : s.status === "Pending" ? "outline" : s.status === "Late" ? "destructive" : "secondary"}>{s.status}</Badge>{s.late && <Badge variant="destructive" className="ml-1 text-[10px]">LATE</Badge>}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.submittedAt ? new Date(s.submittedAt).toLocaleString("en-IN") : "—"}</TableCell>
                      <TableCell className="tabular-nums">{s.marks != null ? `${s.marks}/${a.maxMarks}` : "—"}</TableCell>
                      <TableCell className="text-xs">{s.resubmissionCount || 0}</TableCell>
                      <TableCell>
                        {s.status === "Pending" ? <Button size="sm" variant="outline" onClick={() => { submissionsApi.submit(a.id, s.studentId, s.studentName, ["proxy-submission.pdf"]); toast.success("Submission simulated"); }}>Simulate Submit</Button>
                          : s.status === "Graded" ? <Button size="sm" variant="outline" onClick={() => { submissionsApi.reopenGrading(s.id); toast.success("Grading reopened"); }}><RotateCcw className="h-3.5 w-3.5" />Reopen</Button>
                          : <span className="text-xs text-muted-foreground">in grading queue</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grading" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="flex-row justify-between items-center space-y-0">
              <CardTitle className="text-base">Grading Queue</CardTitle>
              <Button size="sm" className="gradient-primary border-0" onClick={() => { submissionsApi.bulkPublishGrades(a.id); toast.success("All draft grades published"); }}><CheckCircle2 className="h-4 w-4" />Publish All Drafts</Button>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {subs.filter((s) => ["Submitted","Late","Resubmitted"].includes(s.status)).map((s) => {
                const draft = draftGrades[s.id] ?? (s.draftGrade != null ? String(s.draftGrade) : "");
                const fb = draftFb[s.id] ?? s.feedback ?? "";
                return (
                  <div key={s.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div><div className="text-sm font-medium">{s.studentName}{s.late && <Badge variant="destructive" className="ml-2 text-[10px]">LATE</Badge>}</div>
                        <div className="text-[11px] text-muted-foreground">{s.submittedAt ? new Date(s.submittedAt).toLocaleString("en-IN") : ""} · {s.files.join(", ") || "no files"}</div></div>
                      <div className="flex gap-2 items-center">
                        <Input className="h-8 w-20" placeholder={`/${a.maxMarks}`} value={draft} onChange={(e) => setDraftGrades((p) => ({ ...p, [s.id]: e.target.value }))} />
                        <Button size="sm" variant="outline" onClick={() => { const m = Number(draft); if (isNaN(m)) return toast.error("Invalid marks"); submissionsApi.saveDraftGrade(s.id, m, fb); toast.success("Draft saved"); }}>Save Draft</Button>
                        <Button size="sm" onClick={() => { const m = Number(draft); if (isNaN(m)) return toast.error("Invalid marks"); submissionsApi.publishGrade(s.id, m, fb); toast.success("Grade published"); }}>Publish</Button>
                        <Button size="sm" variant="outline" onClick={() => { submissionsApi.returnForRevision(s.id, fb || "Please revise"); toast.success("Returned"); }}>Return</Button>
                      </div>
                    </div>
                    <Textarea rows={2} placeholder="Teacher feedback…" value={fb} onChange={(e) => setDraftFb((p) => ({ ...p, [s.id]: e.target.value }))} />
                  </div>
                );
              })}
              {subs.filter((s) => ["Submitted","Late","Resubmitted"].includes(s.status)).length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Queue is empty</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 grid md:grid-cols-3 gap-4">
          <Card className="border-border/60"><CardContent className="p-5"><div className="text-xs text-muted-foreground uppercase">Submission rate</div><div className="text-2xl font-display font-semibold mt-1">{total ? Math.round((submitted/total)*100) : 0}%</div><Progress className="h-1.5 mt-2" value={total ? (submitted/total)*100 : 0} /></CardContent></Card>
          <Card className="border-border/60"><CardContent className="p-5"><div className="text-xs text-muted-foreground uppercase">Avg score</div><div className="text-2xl font-display font-semibold mt-1">{graded ? `${avg.toFixed(1)}/${a.maxMarks}` : "—"}</div></CardContent></Card>
          <Card className="border-border/60"><CardContent className="p-5"><div className="text-xs text-muted-foreground uppercase">Late submissions</div><div className="text-2xl font-display font-semibold mt-1">{late}</div></CardContent></Card>
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-4 space-y-3">
            <div className="flex gap-2"><Input placeholder="Add a comment for the class…" value={comment} onChange={(e) => setComment(e.target.value)} /><Button size="sm" onClick={() => { if (!comment.trim()) return; commentsApi.add("assignment", id, comment); setComment(""); toast.success("Comment posted"); }}><MessageSquare className="h-4 w-4" />Post</Button></div>
            <div className="space-y-2 divide-y">{comments.filter(c => c.entity === "assignment" && c.entityId === id).map((c) => (
              <div key={c.id} className="pt-2"><div className="text-xs text-muted-foreground">{c.by} · {new Date(c.at).toLocaleString("en-IN")}</div><div className="text-sm">{c.text}</div></div>
            ))}{comments.filter(c => c.entity === "assignment" && c.entityId === id).length === 0 && <p className="text-xs text-muted-foreground py-4">No comments yet.</p>}</div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-0 divide-y">
            {acts.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">No activity yet</div>}
            {acts.map((ac) => (
              <div key={ac.id} className="p-3 text-sm flex items-center justify-between"><span>{ac.action}</span><span className="text-xs text-muted-foreground">{ac.by} · {new Date(ac.at).toLocaleString("en-IN")}</span></div>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
