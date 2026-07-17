import { createFileRoute, useParams, useNavigate, Link } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, CheckCircle2, XCircle, Send, FileText, Archive } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { examsApi, useExams, useMarkEntries, marksApi, useActivity, useQuestions, type MarkEntry } from "@/lib/store";

export const Route = createFileRoute("/exams/$id")({
  head: () => ({ meta: [{ title: "Exam — Edureon ERP" }] }),
  component: ExamDetail,
});

function gradeOf(pct: number) {
  if (pct >= 91) return "A1"; if (pct >= 81) return "A2"; if (pct >= 71) return "B1";
  if (pct >= 61) return "B2"; if (pct >= 51) return "C1"; if (pct >= 41) return "C2"; if (pct >= 33) return "D"; return "E";
}

function ExamDetail() {
  const { id } = useParams({ from: "/exams/$id" });
  const navigate = useNavigate();
  const exams = useExams();
  const allEntries = useMarkEntries();
  const activity = useActivity();
  const questions = useQuestions();
  const exam = exams.find((e) => e.id === id);
  const entries = useMemo(() => allEntries.filter((m) => m.examId === id), [allEntries, id]);
  const subjects = useMemo(() => Array.from(new Set(entries.map((e) => e.subject))), [entries]);
  const [activeSub, setActiveSub] = useState<string>(subjects[0] || "Math");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [modComment, setModComment] = useState("");

  if (!exam) return (
    <PageContainer><PageHeader title="Exam not found" eyebrow="Academic" /><Link to="/exams"><Button variant="outline"><ArrowLeft className="h-4 w-4" />Back</Button></Link></PageContainer>
  );

  const subjectEntries = entries.filter((e) => e.subject === activeSub);
  const draftCount = subjectEntries.filter((e) => e.status === "Draft").length;
  const submittedCount = subjectEntries.filter((e) => e.status === "Submitted").length;
  const moderatedCount = subjectEntries.filter((e) => e.status === "Moderated").length;
  const publishedCount = subjectEntries.filter((e) => e.status === "Published").length;

  const saveAllDrafts = () => {
    const patches = subjectEntries.map((e) => ({ id: e.id, obtained: drafts[e.id] != null ? Number(drafts[e.id]) : e.obtained }));
    marksApi.saveDraft(patches);
    setDrafts({});
    toast.success("All marks saved as draft");
  };

  const acts = activity.filter((a) => a.entity === "exam" && a.entityId === id);
  const totalsByStudent = useMemo(() => {
    const map = new Map<string, { name: string; total: number; max: number; subjects: number }>();
    entries.filter((e) => e.status === "Published").forEach((e) => {
      const cur = map.get(e.studentId) || { name: e.studentName, total: 0, max: 0, subjects: 0 };
      cur.total += (e.obtained || 0) + (e.grace || 0);
      cur.max += e.max;
      cur.subjects += 1;
      map.set(e.studentId, cur);
    });
    return Array.from(map.entries()).map(([sid, v]) => ({ sid, ...v, pct: v.max ? (v.total / v.max) * 100 : 0 })).sort((a, b) => b.pct - a.pct);
  }, [entries]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow={`Exam · ${exam.id}`}
        title={exam.name}
        description={`Class ${exam.class} · ${exam.from} – ${exam.to} · ${exam.subjects} subjects · ${exam.status}`}
        actions={<>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/exams" })}><ArrowLeft className="h-4 w-4" />Back</Button>
          <Button variant="outline" size="sm" onClick={() => { examsApi.advance(exam.id); toast.success("Status advanced"); }}>Advance Status</Button>
          <Button variant="outline" size="sm" onClick={() => { examsApi.archive(exam.id, true); toast.success("Archived"); }}><Archive className="h-4 w-4" />Archive</Button>
        </>}
      />

      <Tabs defaultValue="marks">
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="qb">Question Bank</TabsTrigger>
          <TabsTrigger value="marks">Marks Entry</TabsTrigger>
          <TabsTrigger value="mod">Moderation</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="cards">Report Cards</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-4">
          <Card className="border-border/60"><CardHeader><CardTitle className="text-base">Subject Schedule</CardTitle><CardDescription>{exam.from} – {exam.to}</CardDescription></CardHeader>
            <CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Duration</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{subjects.map((s, i) => (
                <TableRow key={s}><TableCell className="font-medium">{s}</TableCell><TableCell>{exam.from}</TableCell><TableCell>{["09:00","11:00","14:00","09:00","11:00"][i % 5]}</TableCell><TableCell>3h</TableCell><TableCell><Badge variant="outline">{publishedCount > 0 ? "Marks Published" : "Pending"}</Badge></TableCell></TableRow>
              ))}</TableBody></Table></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qb" className="mt-4"><Card className="border-border/60"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Question</TableHead><TableHead>Subject</TableHead><TableHead>Chapter</TableHead><TableHead>Diff</TableHead><TableHead>Marks</TableHead></TableRow></TableHeader>
          <TableBody>{questions.slice(0, 10).map((q) => (
            <TableRow key={q.id}><TableCell className="max-w-sm"><div className="text-sm line-clamp-2">{q.question}</div></TableCell><TableCell><Badge variant="secondary">{q.subject}</Badge></TableCell><TableCell>{q.chapter}</TableCell><TableCell><Badge>{q.diff}</Badge></TableCell><TableCell>{q.marks}</TableCell></TableRow>
          ))}</TableBody></Table></CardContent></Card></TabsContent>

        <TabsContent value="marks" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div><CardTitle className="text-base">Marks Entry · {activeSub}</CardTitle><CardDescription>{draftCount} draft · {submittedCount} pending moderation · {publishedCount} published</CardDescription></div>
              <div className="flex gap-2">
                <Select value={activeSub} onValueChange={setActiveSub}><SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger><SelectContent>{subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                <Button size="sm" variant="outline" onClick={() => { const sample = subjectEntries.slice(0, 3).map((e) => ({ studentId: e.studentId, subject: e.subject, obtained: Math.min(e.max, (e.obtained || 0) + 5) })); marksApi.bulkUploadCsv(id, sample); toast.success(`Bulk uploaded ${sample.length} rows`); }}><Upload className="h-4 w-4" />Bulk CSV</Button>
                <Button size="sm" variant="outline" onClick={saveAllDrafts}>Save Drafts</Button>
                <Button size="sm" onClick={() => { marksApi.submitForModeration(id, activeSub); toast.success("Submitted for moderation"); }}><Send className="h-4 w-4" />Submit for Moderation</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Obtained</TableHead><TableHead>Max</TableHead><TableHead>Grace</TableHead><TableHead>Absent</TableHead><TableHead>Remarks</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>{subjectEntries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.studentName}</TableCell>
                    <TableCell><Input className="h-7 w-16" disabled={e.absent || e.status === "Published"} value={drafts[e.id] ?? e.obtained ?? ""} onChange={(ev) => setDrafts((p) => ({ ...p, [e.id]: ev.target.value }))} /></TableCell>
                    <TableCell className="tabular-nums">{e.max}</TableCell>
                    <TableCell><Input className="h-7 w-14" defaultValue={e.grace ?? 0} onBlur={(ev) => { const g = Number(ev.target.value); if (!isNaN(g) && g !== (e.grace ?? 0)) { marksApi.setGrace(e.id, g); toast.success("Grace updated"); } }} /></TableCell>
                    <TableCell><Button size="sm" variant={e.absent ? "destructive" : "outline"} className="h-7" onClick={() => { marksApi.markAbsent(e.id); toast.success("Marked absent"); }}>{e.absent ? "Absent" : "Mark Absent"}</Button></TableCell>
                    <TableCell><Input className="h-7 w-32" placeholder="—" defaultValue={e.remarks} onBlur={(ev) => marksApi.saveDraft([{ id: e.id, remarks: ev.target.value }])} /></TableCell>
                    <TableCell><Badge variant={e.status === "Published" ? "default" : e.status === "Moderated" ? "secondary" : e.status === "Rejected" ? "destructive" : "outline"}>{e.status}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mod" className="mt-4">
          <Card className="border-border/60"><CardHeader><CardTitle className="text-base">Moderation — {activeSub}</CardTitle><CardDescription>{submittedCount} awaiting review · {moderatedCount} approved</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <Select value={activeSub} onValueChange={setActiveSub}><SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger><SelectContent>{subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              <Textarea rows={2} placeholder="Moderator comment…" value={modComment} onChange={(e) => setModComment(e.target.value)} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { marksApi.approveModeration(id, modComment || "Approved", activeSub); setModComment(""); toast.success("Moderation approved"); }}><CheckCircle2 className="h-4 w-4" />Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => { if (!modComment) return toast.error("Add comment"); marksApi.rejectModeration(id, modComment, activeSub); setModComment(""); toast.success("Sent back to teacher"); }}><XCircle className="h-4 w-4" />Reject</Button>
                <Button size="sm" className="ml-auto gradient-primary border-0" onClick={() => { marksApi.publish(id, activeSub); toast.success("Marks published — parents & students notified"); }}><Send className="h-4 w-4" />Publish Marks</Button>
              </div>
              <div className="border rounded-md divide-y">
                {subjectEntries.filter((e) => e.status === "Submitted").map((e) => (
                  <div key={e.id} className="p-2 text-sm flex justify-between"><span>{e.studentName}</span><span className="tabular-nums">{e.obtained}/{e.max}{e.grace ? ` (+${e.grace})` : ""}</span></div>
                ))}
                {subjectEntries.filter((e) => e.status === "Submitted").length === 0 && <div className="p-4 text-xs text-muted-foreground text-center">Nothing in moderation</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <Card className="border-border/60"><CardHeader><CardTitle className="text-base">Results — Class Rank</CardTitle></CardHeader>
            <CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Rank</TableHead><TableHead>Student</TableHead><TableHead>Total</TableHead><TableHead>%</TableHead><TableHead>Grade</TableHead></TableRow></TableHeader>
              <TableBody>{totalsByStudent.map((t, i) => (
                <TableRow key={t.sid}><TableCell>#{i + 1}</TableCell><TableCell className="font-medium">{t.name}</TableCell><TableCell className="tabular-nums">{t.total}/{t.max}</TableCell><TableCell>{t.pct.toFixed(1)}%</TableCell><TableCell><Badge>{gradeOf(t.pct)}</Badge></TableCell></TableRow>
              ))}{totalsByStudent.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">No marks published yet</TableCell></TableRow>}</TableBody></Table></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="mt-4 space-y-4">
          {totalsByStudent.slice(0, 3).map((t, i) => {
            const studentEntries = entries.filter((e) => e.studentId === t.sid && e.status === "Published");
            return (
              <Card key={t.sid} className="border-border/60">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div><CardTitle className="text-base">Report Card — {t.name}</CardTitle><CardDescription>{exam.name} · Class {exam.class} · Rank #{i + 1}</CardDescription></div>
                  <Button size="sm" variant="outline" onClick={() => toast.info("PDF export coming in next batch")}><FileText className="h-4 w-4" />Preview</Button>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2"><div className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">Scholastic</div>
                    <Table><TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Marks</TableHead><TableHead>Grade</TableHead><TableHead>Remarks</TableHead></TableRow></TableHeader>
                      <TableBody>{studentEntries.map((e) => {
                        const got = (e.obtained || 0) + (e.grace || 0);
                        const pct = (got / e.max) * 100;
                        return <TableRow key={e.id}><TableCell>{e.subject}</TableCell><TableCell>{got}/{e.max}</TableCell><TableCell><Badge>{gradeOf(pct)}</Badge></TableCell><TableCell className="text-xs">{e.remarks || "—"}</TableCell></TableRow>;
                      })}</TableBody></Table>
                    <div className="text-xs font-semibold mt-4 mb-2 uppercase tracking-wider text-muted-foreground">Co-scholastic</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">{[["Work Education","A"],["Art Education","A+"],["Health & PE","A"],["Discipline","A+"]].map(([k,v]) => <div key={k} className="flex justify-between p-2 rounded bg-muted/40"><span>{k}</span><Badge>{v}</Badge></div>)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">Summary</div>
                    <div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-semibold tabular-nums">{t.total}/{t.max}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Percentage</span><span className="font-semibold">{t.pct.toFixed(1)}%</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Overall Grade</span><Badge>{gradeOf(t.pct)}</Badge></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Rank</span><span className="font-semibold">#{i+1}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Attendance</span><span className="font-semibold">94%</span></div>
                    </div>
                    <div className="mt-3 p-3 rounded-md bg-muted/40 text-xs"><span className="font-semibold">Teacher Remarks: </span>Consistent performer, strong in conceptual subjects. Encouraged to participate in olympiads.</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {totalsByStudent.length === 0 && <Card className="border-border/60"><CardContent className="p-8 text-center text-sm text-muted-foreground">Publish marks first to generate report cards</CardContent></Card>}
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 grid md:grid-cols-3 gap-4">
          <Card className="border-border/60"><CardContent className="p-5"><div className="text-xs uppercase text-muted-foreground">Top Scorer</div><div className="text-base font-display font-semibold mt-1">{totalsByStudent[0]?.name || "—"}</div><div className="text-xs text-muted-foreground">{totalsByStudent[0] ? `${totalsByStudent[0].pct.toFixed(1)}%` : ""}</div></CardContent></Card>
          <Card className="border-border/60"><CardContent className="p-5"><div className="text-xs uppercase text-muted-foreground">Weak Students (&lt;40%)</div><div className="text-2xl font-display font-semibold mt-1">{totalsByStudent.filter((t) => t.pct < 40).length}</div></CardContent></Card>
          <Card className="border-border/60"><CardContent className="p-5"><div className="text-xs uppercase text-muted-foreground">Class Average</div><div className="text-2xl font-display font-semibold mt-1">{totalsByStudent.length ? (totalsByStudent.reduce((a, t) => a + t.pct, 0) / totalsByStudent.length).toFixed(1) : "0"}%</div></CardContent></Card>
          <Card className="border-border/60 md:col-span-3"><CardHeader><CardTitle className="text-base">Grade Distribution</CardTitle></CardHeader><CardContent>
            <div className="grid grid-cols-8 gap-2">{["A1","A2","B1","B2","C1","C2","D","E"].map((g) => { const n = totalsByStudent.filter((t) => gradeOf(t.pct) === g).length; const max = Math.max(1, ...["A1","A2","B1","B2","C1","C2","D","E"].map((gg) => totalsByStudent.filter((t) => gradeOf(t.pct) === gg).length)); return <div key={g} className="text-center"><div className="h-24 flex items-end"><div className="w-full rounded-t" style={{ height: `${(n/max)*100}%`, background: "var(--chart-1)" }} /></div><div className="text-xs mt-1">{g}</div><div className="text-[10px] text-muted-foreground">{n}</div></div>; })}</div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-0 divide-y">
            {acts.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">No activity yet</div>}
            {acts.map((a) => (<div key={a.id} className="p-3 text-sm flex justify-between"><span>{a.action}</span><span className="text-xs text-muted-foreground">{a.by} · {new Date(a.at).toLocaleString("en-IN")}</span></div>))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
