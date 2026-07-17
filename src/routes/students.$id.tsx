import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  ChevronLeft, ArrowUpRight, ArrowRightLeft, UserX, Bus, Building2, IdCard, Printer,
  FileText, Trash2, Phone, Mail, Pencil, Download, Eye, AlertTriangle,
  Wallet, Utensils, MapPin, Users, GraduationCap, HeartPulse,
} from "lucide-react";
import {
  useStudents, studentsApi, activityApi, notesApi, useActivity, useNotes, useFeeTxns,
  useFeeStructures, usePaidMonths, computeStudentDues, useExams, useMarkEntries,
  useAssignments, useSubmissions,
} from "@/lib/store";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { StudentDialog } from "@/components/student-dialog";
import { TransferDialog, SuspendDialog, printCertificate } from "@/components/student-actions";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

export const Route = createFileRoute("/students/$id")({
  head: () => ({ meta: [{ title: "Student Profile — Edureon" }] }),
  component: StudentDetailPage,
});

/* ---------- deterministic helpers (demo data derived from the student) ---------- */
function seedFrom(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function StudentDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const students = useStudents();
  const txns = useFeeTxns();
  const structures = useFeeStructures();
  const paid = usePaidMonths();
  const exams = useExams();
  const allMarks = useMarkEntries();
  const assignments = useAssignments();
  const submissions = useSubmissions();
  useActivity(); useNotes();
  const s = students.find((x) => x.id === id);
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  if (!s) return (
    <PageContainer>
      <PageHeader title="Student not found" />
      <Link to="/students"><Button variant="outline"><ChevronLeft className="h-4 w-4" />Back</Button></Link>
    </PageContainer>
  );

  const seed = seedFrom(s.id);
  const activity = activityApi.for("student", id);
  const notes = notesApi.for("student", id);

  const promote = () => {
    const order = ["VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    const i = order.indexOf(s.class);
    if (i >= 0 && i < order.length - 1) {
      if (!confirm(`Promote ${s.name} from Class ${s.class} to ${order[i + 1]}?`)) return;
      studentsApi.update(id, { class: order[i + 1] });
      activityApi.log("student", id, `Promoted to ${order[i + 1]}`);
      toast.success(`Promoted to ${order[i + 1]}`);
    } else toast.info("Already in highest class");
  };
  const issueCertificate = () => {
    printCertificate("Bonafide Certificate", [
      ["Student Name", s.name],
      ["Admission No.", s.admissionNo],
      ["Class / Section", `${s.class} - ${s.section}`],
      ["Father / Guardian", s.parent],
      ["Date of Birth", s.dob || "—"],
      ["Academic Session", s.session || "2025-2026"],
    ], `This is to certify that <b>${s.name}</b> is a bona-fide student of this institution studying in Class <b>${s.class}-${s.section}</b> during the academic session <b>${s.session || "2025-2026"}</b>. This certificate is issued on the request of the student/guardian for official purposes.`);
    activityApi.log("student", id, "Issued: Bonafide Certificate");
    toast.success("Certificate generated");
  };
  const print = (kind: string) => { toast.success(`${kind} sent to printer`); activityApi.log("student", id, `Printed: ${kind}`); };

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<Link to="/students" className="hover:text-primary inline-flex items-center"><ChevronLeft className="h-3.5 w-3.5" />Students</Link>}
        title={s.name}
        description={`${s.admissionNo} · Class ${s.class}-${s.section} · Roll #${s.rollNo}`}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" />Edit</Button>
            <Button size="sm" variant="outline" onClick={() => print("Profile")}><Printer className="h-4 w-4" />Print</Button>
            <Button size="sm" variant="outline" onClick={() => print("ID Card")}><IdCard className="h-4 w-4" />ID Card</Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => { studentsApi.remove(id); navigate({ to: "/students" }); }}><Trash2 className="h-4 w-4" />Delete</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <Card className="lg:col-span-2 border-border/60">
          <CardContent className="p-5 flex items-center gap-5">
            <Avatar className="h-20 w-20"><AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-2xl">{s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge>{s.feeStatus}</Badge>
                <Badge variant="outline">{s.gender}</Badge>
                <Badge variant="outline">Attendance {s.attendance}%</Badge>
                {s.transportRequired && s.transportRequired !== "No" && <Badge variant="outline"><Bus className="h-3 w-3 mr-1" />Transport</Badge>}
                {s.hostelRequired && s.hostelRequired !== "No" && <Badge variant="outline"><Building2 className="h-3 w-3 mr-1" />Hostel</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{s.phone}</div>
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{s.email || s.parent.toLowerCase().replace(/\s+/g, ".") + "@gmail.com"}</div>
                <div className="text-muted-foreground">Parent: <span className="text-foreground">{s.parent}</span></div>
                <div className="text-muted-foreground">DOB: <span className="text-foreground">{s.dob || "—"}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Quick actions</div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={promote}><ArrowUpRight className="h-3.5 w-3.5" />Promote</Button>
              <Button size="sm" variant="outline" onClick={() => setTransferOpen(true)}><ArrowRightLeft className="h-3.5 w-3.5" />Transfer</Button>
              <Button size="sm" variant="outline" className={s.suspended ? "text-destructive border-destructive/40" : ""} onClick={() => setSuspendOpen(true)}><UserX className="h-3.5 w-3.5" />{s.suspended ? "Suspended" : "Suspend"}</Button>
              <Button size="sm" variant="outline" onClick={issueCertificate}><FileText className="h-3.5 w-3.5" />Certificate</Button>
            </div>
            {s.suspended && (
              <div className="text-[11px] text-destructive mt-1">Suspended until {s.suspendUntil} · {s.suspendReason}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          {[
            ["overview", "Overview"], ["documents", "Documents"], ["attendance", "Attendance"],
            ["assignments", "Assignments"], ["results", "Results"], ["fees", "Fees"],
            ["transport", "Transport"], ["hostel", "Hostel"], ["activity", "Activity"],
          ].map(([t, label]) => (
            <TabsTrigger key={t} value={t}>{label}</TabsTrigger>
          ))}
        </TabsList>

        {/* 1. OVERVIEW */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            <Stat label="Attendance" value={`${s.attendance}%`} />
            <Stat label="Avg Score" value={`${72 + (seed % 18)}%`} />
            <Stat label="Class Rank" value={`#${(seed % 30) + 1}`} />
            <Stat label="Fee Status" value={s.feeStatus} />
          </div>

          <SectionCard icon={<IdCard className="h-4 w-4" />} title="Personal Information">
            <DetailGrid rows={[
              ["Full name", s.name], ["Admission no", s.admissionNo], ["Date of birth", s.dob],
              ["Gender", s.gender], ["Blood group", s.blood], ["Nationality", s.nationality],
              ["Religion", s.religion], ["Category", s.category], ["Mother tongue", s.motherTongue],
              ["Aadhar", s.aadhar], ["Birth certificate no", s.birthCertificateNo], ["Session", s.session],
            ]} />
          </SectionCard>

          <SectionCard icon={<GraduationCap className="h-4 w-4" />} title="Academic Details">
            <DetailGrid rows={[
              ["Class", s.class], ["Section", s.section], ["Roll no", String(s.rollNo)],
              ["Board", s.board], ["Previous school", s.previousSchool], ["Previous class", s.previousClass],
              ["Last percentage", s.lastPercent],
            ]} />
          </SectionCard>

          <SectionCard icon={<Users className="h-4 w-4" />} title="Guardian / Family">
            <DetailGrid rows={[
              ["Father / Guardian", s.parent], ["Mother", s.motherName], ["Occupation", s.parentOccupation],
              ["Annual income", s.parentIncome], ["Phone", s.phone], ["Email", s.email],
              ["Emergency contact", s.emergencyContact],
            ]} />
          </SectionCard>

          <SectionCard icon={<MapPin className="h-4 w-4" />} title="Address Details">
            <DetailGrid rows={[
              ["Address", s.address], ["City", s.city], ["State", s.state], ["PIN", s.pin],
            ]} />
          </SectionCard>

          <SectionCard icon={<HeartPulse className="h-4 w-4" />} title="Services">
            <DetailGrid rows={[
              ["Transport", s.transportRequired || "Not opted"], ["Hostel", s.hostelRequired || "Not opted"],
              ["Medical notes", s.medicalNotes],
            ]} />
          </SectionCard>
        </TabsContent>

        {/* 2. DOCUMENTS */}
        <TabsContent value="documents" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="font-display text-base">Document Records</CardTitle><CardDescription>Documents submitted during the admission process.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {(s.documents && s.documents.length ? s.documents : ["Aadhar Card", "Birth Certificate", "Transfer Certificate", "Previous Marksheet", "Passport Photograph", "Address Proof"]).map((d: any, i: number) => {
                const name = typeof d === "string" ? d : d.name;
                const verified = (seed + i) % 3 !== 0;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-md">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm">{name}</div>
                      <div className="text-[11px] text-muted-foreground">Uploaded during admission · {name.toLowerCase().replace(/\s+/g, "_")}.pdf</div>
                    </div>
                    <Badge variant={verified ? "default" : "outline"} className={verified ? "" : "text-warning border-warning/30"}>{verified ? "Verified" : "Pending"}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => toast.success(`Viewing ${name}`)}><Eye className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => toast.success(`Downloading ${name}`)}><Download className="h-4 w-4" /></Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. ATTENDANCE */}
        <TabsContent value="attendance" className="mt-4">
          <AttendanceTab attendance={s.attendance} seed={seed} />
        </TabsContent>

        {/* 4. ASSIGNMENTS */}
        <TabsContent value="assignments" className="mt-4">
          <AssignmentsTab studentId={id} klass={`${s.class}-${s.section}`} seed={seed} assignments={assignments} submissions={submissions} />
        </TabsContent>

        {/* 5. RESULTS */}
        <TabsContent value="results" className="mt-4">
          <ResultsTab studentId={id} klass={s.class} seed={seed} exams={exams} allMarks={allMarks} onPrint={() => print("Report Card")} />
        </TabsContent>

        {/* 6. FEES */}
        <TabsContent value="fees" className="mt-4">
          <FeesTab student={s} txns={txns} structures={structures} paid={paid} />
        </TabsContent>

        {/* 7. TRANSPORT */}
        <TabsContent value="transport" className="mt-4">
          <TransportTab student={s} seed={seed} />
        </TabsContent>

        {/* 8. HOSTEL */}
        <TabsContent value="hostel" className="mt-4">
          <HostelTab student={s} seed={seed} />
        </TabsContent>

        {/* 9. ACTIVITY */}
        <TabsContent value="activity" className="mt-4">
          <Card><CardContent className="p-5 space-y-3">
            <div className="flex gap-2">
              <Textarea placeholder="Add a note…" rows={2} value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <Button onClick={() => { if (noteText.trim()) { notesApi.add("student", id, noteText); setNoteText(""); } }}>Save</Button>
            </div>
            {notes.map((n) => (
              <div key={n.id} className="p-3 border rounded-md text-sm">
                {n.text}<div className="text-[11px] text-muted-foreground mt-1">{n.by} · {new Date(n.at).toLocaleString()}</div>
              </div>
            ))}
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground pt-3 border-t">Activity / Audit log</div>
            {activity.length === 0 && <div className="text-xs text-muted-foreground">No activity yet.</div>}
            {activity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 text-xs">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5"></div>
                <div className="flex-1"><div className="text-sm">{a.action}</div><div className="text-[11px] text-muted-foreground">{a.by} · {new Date(a.at).toLocaleString()}</div></div>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <StudentDialog open={editOpen} onOpenChange={setEditOpen} student={s} />
      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} student={s} />
      <SuspendDialog open={suspendOpen} onOpenChange={setSuspendOpen} student={s} />
    </PageContainer>
  );
}

/* ====================== ATTENDANCE TAB ====================== */
function AttendanceTab({ attendance, seed }: { attendance: number; seed: number }) {
  const [range, setRange] = useState<"week" | "month">("month");
  const days = range === "week" ? 7 : 30;

  const records = useMemo(() => {
    const out: { date: string; mark: "P" | "A" | "L" | "H"; remark: string }[] = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dow = d.getDay();
      let mark: "P" | "A" | "L" | "H" = "P";
      if (dow === 0) mark = "H";
      else if ((i * 7 + seed) % 13 === 0) mark = "A";
      else if ((i * 5 + seed) % 17 === 0) mark = "L";
      out.push({
        date: d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" }),
        mark,
        remark: mark === "A" ? "Unexcused absence" : mark === "L" ? "Approved leave" : mark === "H" ? "Holiday" : "—",
      });
    }
    return out;
  }, [days, seed]);

  const present = records.filter((r) => r.mark === "P").length;
  const absent = records.filter((r) => r.mark === "A").length;
  const leave = records.filter((r) => r.mark === "L").length;
  const considered = present + absent + leave;
  const pct = considered ? Math.round((present / considered) * 100) : 0;
  const trend = MONTHS.map((m, i) => ({ month: m, pct: 80 + ((seed + i * 7) % 18) }));
  const markColor: Record<string, string> = { P: "bg-success/15 text-success", A: "bg-destructive/15 text-destructive", L: "bg-warning/15 text-warning", H: "bg-muted text-muted-foreground" };

  return (
    <div className="space-y-4">
      {pct < 75 && (
        <div className="flex items-start gap-3 p-4 rounded-md bg-warning/10 border border-warning/30">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div><div className="font-medium text-sm">Attendance below 75% threshold</div>
            <div className="text-xs text-muted-foreground">Sustained low attendance may affect exam eligibility.</div></div>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Present" value={String(present)} />
        <Stat label="Absent" value={String(absent)} />
        <Stat label="On Leave" value={String(leave)} />
        <Stat label="Overall %" value={`${attendance}%`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <div><CardTitle className="font-display text-base">Daily Attendance</CardTitle><CardDescription>Filter by week or month.</CardDescription></div>
            <Select value={range} onValueChange={(v) => setRange(v as any)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="week">This Week</SelectItem><SelectItem value="month">This Month</SelectItem></SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Remark</TableHead></TableRow></TableHeader>
              <TableBody>{records.map((r, i) => (
                <TableRow key={i}><TableCell>{r.date}</TableCell><TableCell><Badge className={markColor[r.mark]} variant="outline">{({ P: "Present", A: "Absent", L: "Leave", H: "Holiday" } as any)[r.mark]}</Badge></TableCell><TableCell className="text-muted-foreground">{r.remark}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="font-display text-base">Monthly Trend</CardTitle><CardDescription>Attendance % over months</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis domain={[60, 100]} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="pct" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ====================== ASSIGNMENTS TAB ====================== */
function AssignmentsTab({ studentId, klass, seed, assignments, submissions }: { studentId: string; klass: string; seed: number; assignments: any[]; submissions: any[] }) {
  const [subject, setSubject] = useState("all");
  const [range, setRange] = useState<"all" | "week" | "month">("all");

  const rows = useMemo(() => {
    const cutoff = range === "all" ? 0 : Date.now() - (range === "week" ? 7 : 30) * 86400000;
    return assignments
      .filter((a) => a.status !== "Draft")
      .map((a, i) => {
        const sub = submissions.find((x) => x.assignmentId === a.id && x.studentId === studentId);
        const score = sub?.marks ?? (((seed + i) % 5) === 0 ? undefined : a.maxMarks - ((seed + i * 3) % (a.maxMarks / 2 || 1) | 0));
        const status = sub?.status ?? ((seed + i) % 4 === 0 ? "Pending" : "Graded");
        return { id: a.id, title: a.title, subject: a.subject, due: a.due, maxMarks: a.maxMarks, score, status, ts: new Date(a.due).getTime() };
      })
      .filter((r) => subject === "all" || r.subject === subject)
      .filter((r) => range === "all" || r.ts >= cutoff || true); // keep visible; due dates are demo
  }, [assignments, submissions, studentId, subject, range, seed]);

  const subjects = Array.from(new Set(assignments.map((a) => a.subject)));
  const graded = rows.filter((r) => typeof r.score === "number");
  const avg = graded.length ? Math.round(graded.reduce((a, r) => a + (r.score! / r.maxMarks) * 100, 0) / graded.length) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Assignments" value={String(rows.length)} />
        <Stat label="Submitted" value={String(rows.filter((r) => r.status !== "Pending").length)} />
        <Stat label="Pending" value={String(rows.filter((r) => r.status === "Pending").length)} />
        <Stat label="Avg Score" value={`${avg}%`} />
      </div>
      <Card className="border-border/60">
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <div><CardTitle className="font-display text-base">Assignment Scores</CardTitle><CardDescription>By subject · {klass}</CardDescription></div>
          <div className="flex gap-2">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All subjects</SelectItem>{subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={range} onValueChange={(v) => setRange(v as any)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All time</SelectItem><SelectItem value="week">This week</SelectItem><SelectItem value="month">This month</SelectItem></SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Subject</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead>Score</TableHead></TableRow></TableHeader>
            <TableBody>{rows.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No assignments.</TableCell></TableRow> : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.title}</TableCell><TableCell>{r.subject}</TableCell><TableCell>{r.due}</TableCell>
                <TableCell><Badge variant={r.status === "Pending" ? "outline" : "default"}>{r.status}</Badge></TableCell>
                <TableCell>{typeof r.score === "number" ? `${r.score}/${r.maxMarks}` : "—"}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ====================== RESULTS TAB ====================== */
function ResultsTab({ studentId, klass, seed, exams, allMarks, onPrint }: { studentId: string; klass: string; seed: number; exams: any[]; allMarks: any[]; onPrint: () => void }) {
  const examTypes = exams.length ? exams : [{ id: "EX", name: "Term 2" }];
  const [examId, setExamId] = useState(examTypes[0]?.id);
  const subjects = ["Math", "Science", "English", "Social", "Hindi", "CS"];

  const rows = useMemo(() => {
    const real = allMarks.filter((m) => m.studentId === studentId && m.examId === examId);
    return subjects.map((subj, i) => {
      const r = real.find((m) => m.subject === subj);
      const obtained = r?.obtained ?? 55 + ((seed + i * 13 + seedFrom(examId)) % 43);
      const max = r?.max ?? 100;
      const pct = Math.round((obtained / max) * 100);
      const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : pct >= 40 ? "D" : "E";
      return { subject: subj, obtained, max, pct, grade };
    });
  }, [allMarks, studentId, examId, seed]);

  const total = rows.reduce((a, r) => a + r.obtained, 0);
  const totalMax = rows.reduce((a, r) => a + r.max, 0);
  const pct = totalMax ? Math.round((total / totalMax) * 100) : 0;
  const overallGrade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : "D";
  const chart = rows.map((r) => ({ subject: r.subject, pct: r.pct }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={examId} onValueChange={setExamId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Exam type" /></SelectTrigger>
          <SelectContent>{examTypes.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}{e.class ? ` (Class ${e.class})` : ""}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" onClick={onPrint}><Printer className="h-4 w-4" />Generate Report Card</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total Marks" value={`${total}/${totalMax}`} />
        <Stat label="Percentage" value={`${pct}%`} />
        <Stat label="Overall Grade" value={overallGrade} />
        <Stat label="Result" value={pct >= 33 ? "Pass" : "Fail"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-2"><CardTitle className="font-display text-base">Subject-wise Results</CardTitle><CardDescription>{examTypes.find((e: any) => e.id === examId)?.name}</CardDescription></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Marks</TableHead><TableHead>%</TableHead><TableHead>Grade</TableHead></TableRow></TableHeader>
              <TableBody>{rows.map((r) => (
                <TableRow key={r.subject}><TableCell>{r.subject}</TableCell><TableCell>{r.obtained}/{r.max}</TableCell><TableCell>{r.pct}%</TableCell><TableCell><Badge>{r.grade}</Badge></TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="font-display text-base">Performance</CardTitle><CardDescription>Per-subject %</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="subject" fontSize={10} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 100]} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="pct" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ====================== FEES TAB ====================== */
function FeesTab({ student, txns, structures, paid }: { student: any; txns: any[]; structures: any[]; paid: Record<string, boolean> }) {
  const dues = computeStudentDues(student.class, student.id, structures, paid, 6);
  const myTxns = txns.filter((t) => t.studentId === student.id);
  const totalPaid = myTxns.filter((t) => t.status === "Success").reduce((a, t) => a + t.amount, 0);
  const totalAnnual = dues.lines.reduce((a, l) => a + l.monthly, 0) || totalPaid + dues.totalDue;

  return (
    <div className="space-y-4">
      {dues.totalDue > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-md bg-destructive/10 border border-destructive/30">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div><div className="font-medium text-sm">Fee pending alert</div>
            <div className="text-xs text-muted-foreground">₹{dues.totalDue.toLocaleString("en-IN")} outstanding{dues.totalLate > 0 ? ` (incl. ₹${dues.totalLate.toLocaleString("en-IN")} late fee)` : ""}. A reminder can be sent to the student.</div></div>
          <Button size="sm" variant="outline" onClick={() => toast.success("Reminder sent to student")}>Send reminder</Button>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total Fee" value={`₹${totalAnnual.toLocaleString("en-IN")}`} />
        <Stat label="Paid" value={`₹${totalPaid.toLocaleString("en-IN")}`} />
        <Stat label="Late Fee" value={`₹${dues.totalLate.toLocaleString("en-IN")}`} />
        <Stat label="Pending" value={`₹${dues.totalDue.toLocaleString("en-IN")}`} />
      </div>

      {dues.lines.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="font-display text-base"><Wallet className="h-4 w-4 inline mr-2" />Fee Schedule</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Amount</TableHead><TableHead>Late Fee</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{dues.lines.map((l) => (
                <TableRow key={l.ym}><TableCell>{l.label}</TableCell><TableCell>₹{l.monthly.toLocaleString("en-IN")}</TableCell><TableCell>{l.lateFee ? `₹${l.lateFee.toLocaleString("en-IN")}` : "—"}</TableCell><TableCell><Badge variant={l.paid ? "default" : "outline"} className={l.paid ? "" : "text-warning border-warning/30"}>{l.paid ? "Paid" : "Due"}</Badge></TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="font-display text-base">Payment History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Receipt</TableHead><TableHead>Head</TableHead><TableHead>Amount</TableHead><TableHead>Mode</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>{myTxns.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No transactions.</TableCell></TableRow> : myTxns.map((t) => (
              <TableRow key={t.id}><TableCell className="font-mono text-xs">{t.id}</TableCell><TableCell>{t.head}</TableCell><TableCell>₹{t.amount.toLocaleString("en-IN")}</TableCell><TableCell>{t.mode}</TableCell><TableCell><Badge variant={t.status === "Success" ? "default" : "outline"}>{t.status}</Badge></TableCell><TableCell>{t.date}</TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ====================== TRANSPORT TAB ====================== */
function TransportTab({ student, seed }: { student: any; seed: number }) {
  const opted = student.transportRequired && student.transportRequired !== "No" && student.transportRequired !== "Not assigned";
  if (!opted) return <EmptyTab icon={<Bus className="h-8 w-8" />} title="No transport opted" desc="This student has not opted for school transport. Assign one from the quick actions." />;

  const route = `Route ${(seed % 9) + 1} — ${["North Sector", "City Center", "Lake View", "Green Park", "Old Town"][seed % 5]}`;
  const vehicle = `BUS-${10 + (seed % 40)}`;
  const stop = `${["Maple", "Oak", "Pine", "Cedar"][seed % 4]} Stop`;
  const records = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    const boarded = (seed + i) % 7 !== 0;
    return { date: d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" }), morning: boarded, evening: boarded && (seed + i) % 5 !== 0 };
  });

  return (
    <div className="space-y-4">
      <SectionCard icon={<Bus className="h-4 w-4" />} title="Route & Vehicle Details">
        <DetailGrid rows={[
          ["Route", route], ["Vehicle no", vehicle], ["Boarding stop", stop],
          ["Driver", ["R. Singh", "M. Khan", "S. Das"][seed % 3]], ["Driver contact", `+91 9${(seed % 900000000) + 100000000}`],
          ["Pickup time", "07:15 AM"], ["Drop time", "03:45 PM"],
        ]} />
      </SectionCard>
      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="font-display text-base">Transport Attendance</CardTitle><CardDescription>Whether the student boarded the bus.</CardDescription></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Morning</TableHead><TableHead>Evening</TableHead></TableRow></TableHeader>
            <TableBody>{records.map((r, i) => (
              <TableRow key={i}><TableCell>{r.date}</TableCell>
                <TableCell><Badge variant="outline" className={r.morning ? "text-success border-success/30" : "text-muted-foreground"}>{r.morning ? "Boarded" : "Not boarded"}</Badge></TableCell>
                <TableCell><Badge variant="outline" className={r.evening ? "text-success border-success/30" : "text-muted-foreground"}>{r.evening ? "Boarded" : "Not boarded"}</Badge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="font-display text-base">Route History</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[`Assigned to ${route} on ${vehicle}`, `Boarding stop set to ${stop}`, "Opted in for transport during admission"].map((t, i) => (
            <div key={i} className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1.5" /><div className="flex-1">{t}<div className="text-[11px] text-muted-foreground">Academic session {student.session || "2025-26"}</div></div></div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ====================== HOSTEL TAB ====================== */
function HostelTab({ student, seed }: { student: any; seed: number }) {
  const opted = student.hostelRequired && student.hostelRequired !== "No" && student.hostelRequired !== "Not assigned";
  if (!opted) return <EmptyTab icon={<Building2 className="h-8 w-8" />} title="No hostel allocated" desc="This student is a day scholar. Allocate a room from the quick actions or the Hostel module." />;

  const block = `Block ${String.fromCharCode(65 + (seed % 4))}`;
  const room = `${(seed % 3) + 1}0${(seed % 8) + 1}`;
  const meals = ["Breakfast", "Lunch", "Snacks", "Dinner"];
  const fooding = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return { date: d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" }), taken: meals.filter((_, mi) => (seed + i + mi) % 4 !== 0) };
  });

  return (
    <div className="space-y-4">
      <SectionCard icon={<Building2 className="h-4 w-4" />} title="Hostel & Room Details">
        <DetailGrid rows={[
          ["Block", block], ["Room no", room], ["Bed", `B${(seed % 4) + 1}`],
          ["Type", ["AC", "Non-AC"][seed % 2]], ["Occupancy", `${(seed % 3) + 2}-seater`],
          ["Warden", ["Mrs. Rao", "Mr. Verma", "Ms. Pillai"][seed % 3]], ["Mess plan", "Full board (4 meals)"],
        ]} />
      </SectionCard>
      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="font-display text-base"><Utensils className="h-4 w-4 inline mr-2" />Fooding History</CardTitle><CardDescription>Meals availed in the mess.</CardDescription></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead>{meals.map((m) => <TableHead key={m}>{m}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{fooding.map((f, i) => (
              <TableRow key={i}><TableCell>{f.date}</TableCell>
                {meals.map((m) => <TableCell key={m}>{f.taken.includes(m) ? <Badge variant="outline" className="text-success border-success/30">✓</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>)}
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ====================== shared bits ====================== */
function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2"><CardTitle className="font-display text-base flex items-center gap-2">{icon}{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function DetailGrid({ rows }: { rows: [string, string | undefined | null][] }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
      {rows.map(([label, value]) => (
        <div key={label} className="text-sm">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-0.5">{value || <span className="text-muted-foreground">—</span>}</div>
        </div>
      ))}
    </div>
  );
}

function EmptyTab({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="border-border/60"><CardContent className="p-10 flex flex-col items-center text-center gap-2 text-muted-foreground">
      {icon}<div className="font-medium text-foreground">{title}</div><div className="text-sm max-w-md">{desc}</div>
    </CardContent></Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="p-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="font-display text-2xl font-semibold mt-1">{value}</div></CardContent></Card>
  );
}
