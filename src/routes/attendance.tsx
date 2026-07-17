import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, Download, Send, Camera, Fingerprint, Lock, Unlock, Bell, Plus, AlertTriangle, GraduationCap, Briefcase } from "lucide-react";
import { useStudents, useEmployees, useLeaveRequests, useCorrectionRequests, leaveApi, correctionApi, attendanceApi, useActivity, type AttMark } from "@/lib/store";
import { attendanceTrend } from "@/lib/mock";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/attendance")({
  head: () => ({ meta: [{ title: "Attendance — Edureon ERP" }] }),
  component: AttendancePage,
});

const CLASS_OPTIONS = ["VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const SECTION_OPTIONS = ["A", "B", "C", "D"];
const SUBJECT_OPTIONS = ["Mathematics", "Science", "English", "Social Studies", "Hindi", "Computer Sci"];
const LEAVE_TYPES = ["Sick", "Casual", "Planned", "Emergency"] as const;

type StaffLeave = { id: string; staffId: string; staffName: string; dept: string; from: string; to: string; type: string; reason: string; status: "Pending" | "Approved" | "Rejected" };
type StaffCorrection = { id: string; staffId: string; staffName: string; date: string; currentMark: AttMark; requestedMark: AttMark; reason: string; status: "Pending" | "Approved" | "Rejected" };

// Deterministic mock attendance % for staff
function staffAttendancePct(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000;
  return 80 + (h % 20);
}

function AttendancePage() {
  const allStudents = useStudents();
  const employees = useEmployees();
  const leaves = useLeaveRequests();
  const corrections = useCorrectionRequests();
  const activity = useActivity();
  const date = new Date().toISOString().slice(0, 10);

  // ---- Student filters ----
  const [fClass, setFClass] = useState("X");
  const [fSection, setFSection] = useState("B");
  const [fSubject, setFSubject] = useState("Mathematics");
  const klass = `${fClass}-${fSection}`;

  const filteredStudents = useMemo(
    () => allStudents.filter((s) => s.class === fClass && s.section === fSection),
    [allStudents, fClass, fSection],
  );

  const [marks, setMarks] = useState<Record<string, AttMark>>(() =>
    Object.fromEntries(allStudents.map((s, i) => [s.id, i % 9 === 0 ? "A" : i % 13 === 0 ? "L" : "P"]))
  );
  const [locked, setLocked] = useState(false);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [overrideOpen, setOverrideOpen] = useState<{ studentId: string; current: AttMark } | null>(null);
  const [overrideMark, setOverrideMark] = useState<AttMark>("P");
  const [overrideReason, setOverrideReason] = useState("");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ studentId: allStudents[0]?.id || "", from: date, to: date, reason: "", type: "Sick" as (typeof LEAVE_TYPES)[number] });

  const present = filteredStudents.filter((s) => marks[s.id] === "P").length;
  const absent = filteredStudents.filter((s) => marks[s.id] === "A").length;
  const late = filteredStudents.filter((s) => marks[s.id] === "L").length;

  // ---- Staff state ----
  const [staffMarks, setStaffMarks] = useState<Record<string, AttMark>>(() =>
    Object.fromEntries(employees.map((e, i) => [e.id, e.status === "On Leave" ? "L" : i % 11 === 0 ? "A" : "P"]))
  );
  const [staffLeaves, setStaffLeaves] = useState<StaffLeave[]>([
    { id: "SLV-001", staffId: employees[1]?.id || "EMP2001", staffName: employees[1]?.name || "Staff", dept: employees[1]?.department || "Science", from: date, to: date, type: "Casual", reason: "Personal work", status: "Pending" },
    { id: "SLV-002", staffId: employees[3]?.id || "EMP2003", staffName: employees[3]?.name || "Staff", dept: employees[3]?.department || "English", from: date, to: date, type: "Sick", reason: "Fever", status: "Approved" },
  ]);
  const [staffCorrections, setStaffCorrections] = useState<StaffCorrection[]>([
    { id: "SCR-001", staffId: employees[2]?.id || "EMP2002", staffName: employees[2]?.name || "Staff", date, currentMark: "A", requestedMark: "P", reason: "Was on field duty — biometric missed", status: "Pending" },
  ]);
  const [staffLeaveOpen, setStaffLeaveOpen] = useState(false);
  const [staffLeaveForm, setStaffLeaveForm] = useState({ staffId: employees[0]?.id || "", from: date, to: date, reason: "", type: "Casual" });

  const staffPresent = employees.filter((e) => staffMarks[e.id] === "P").length;
  const staffAbsent = employees.filter((e) => staffMarks[e.id] === "A").length;
  const staffOnLeave = employees.filter((e) => staffMarks[e.id] === "L").length;

  const heat = Array.from({ length: 6 }).map((_, w) =>
    Array.from({ length: 7 }).map((_, d) => 70 + ((w * 13 + d * 7) % 30))
  );

  const auditLogs = useMemo(() => activity.filter((a) => a.entity === "attendance" || a.entity === "leave" || a.entity === "correction").slice(0, 30), [activity]);

  const submitAttendance = () => {
    if (locked) return toast.error("Attendance is locked");
    filteredStudents.forEach((s) => attendanceApi.mark(klass, date, s.id, s.name, marks[s.id], 1, remarks[s.id]));
    toast.success(`Saved · ${klass} · ${fSubject} · ${present}P / ${absent}A / ${late}L · Parents notified`);
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Academic" title="Attendance Intelligence"
        description="Separate workflows for student and staff attendance — class-wise marking, biometric, locks, leaves, corrections, and chronic-absentee alerts."
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Students Present" value={`${present}/${filteredStudents.length || 0}`} icon={<CheckCircle2 className="h-5 w-5" />} tone="success" />
        <KpiCard label="Staff Present" value={`${staffPresent}/${employees.length}`} icon={<CheckCircle2 className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Pending Leaves" value={(leaves.filter((l) => l.status === "Pending").length + staffLeaves.filter((l) => l.status === "Pending").length).toString()} icon={<Clock className="h-5 w-5" />} tone="warning" />
        <KpiCard label="Corrections" value={(corrections.filter((c) => c.status === "Pending").length + staffCorrections.filter((c) => c.status === "Pending").length).toString()} icon={<AlertTriangle className="h-5 w-5" />} tone="info" />
        <KpiCard label="Absentees" value={(absent + staffAbsent).toString()} icon={<XCircle className="h-5 w-5" />} tone="warning" />
      </div>

      <Tabs defaultValue="students">
        <TabsList className="mb-4">
          <TabsTrigger value="students"><GraduationCap className="h-4 w-4 mr-1.5" />Students</TabsTrigger>
          <TabsTrigger value="staff"><Briefcase className="h-4 w-4 mr-1.5" />Staff</TabsTrigger>
        </TabsList>

        {/* ============================== STUDENTS ============================== */}
        <TabsContent value="students" className="space-y-4">
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                <div><Label className="text-xs text-muted-foreground">Class</Label>
                  <Select value={fClass} onValueChange={setFClass}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CLASS_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                </div>
                <div><Label className="text-xs text-muted-foreground">Section</Label>
                  <Select value={fSection} onValueChange={setFSection}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SECTION_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                </div>
                <div><Label className="text-xs text-muted-foreground">Subject</Label>
                  <Select value={fSubject} onValueChange={setFSubject}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SUBJECT_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                </div>
                <div><Label className="text-xs text-muted-foreground">Date</Label>
                  <Input type="date" value={date} readOnly />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                    const csv = ["Student,RollNo,Mark,Remark", ...filteredStudents.map((s) => `"${s.name}",${s.rollNo},${marks[s.id]},"${remarks[s.id] || ""}"`)].join("\n");
                    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                    const a = document.createElement("a"); a.href = url; a.download = `attendance-${klass}-${date}.csv`; a.click();
                    toast.success("Exported");
                  }}><Download className="h-4 w-4" />Export</Button>
                  <Button size="sm" className="gradient-primary border-0 flex-1" onClick={submitAttendance}><Send className="h-4 w-4" />Submit</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="mark">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
              <TabsTrigger value="defaulters">Chronic Absentees</TabsTrigger>
              <TabsTrigger value="leaves">Leave Requests ({leaves.filter((l) => l.status === "Pending").length})</TabsTrigger>
              <TabsTrigger value="corrections">Corrections ({corrections.filter((c) => c.status === "Pending").length})</TabsTrigger>
              <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="mark" className="mt-4">
              <Card className="border-border/60">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">Class {klass} · {fSubject} · {new Date(date).toLocaleDateString("en-IN")}{locked && <Badge variant="destructive" className="ml-2"><Lock className="h-3 w-3 mr-1" />LOCKED</Badge>}</CardTitle>
                    <CardDescription>{present + absent + late} of {filteredStudents.length} marked · {present}P / {absent}A / {late}L</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={locked} onClick={() => { setMarks((p) => ({ ...p, ...Object.fromEntries(filteredStudents.map((s) => [s.id, "P"])) })); toast.success("All marked Present"); }}>Mark all Present</Button>
                    {locked ? (
                      <Button size="sm" variant="outline" onClick={() => { setLocked(false); attendanceApi.unlock(klass, date); toast.success("Unlocked"); }}><Unlock className="h-4 w-4" />Unlock</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => { setLocked(true); attendanceApi.lock(klass, date); toast.success("Attendance locked"); }}><Lock className="h-4 w-4" />Lock</Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredStudents.length === 0 && <div className="text-sm text-muted-foreground border border-dashed rounded p-6 text-center">No students in {klass}. Try another class/section.</div>}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {filteredStudents.map((s) => {
                      const m = marks[s.id];
                      return (
                        <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-md border border-border/60 hover:bg-muted/40">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">{s.rollNo}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{s.name}</div>
                            <div className="text-[11px] text-muted-foreground">{s.admissionNo}</div>
                          </div>
                          <div className="flex gap-1">
                            {(["P","A","L"] as AttMark[]).map((k) => (
                              <button key={k} disabled={locked} onClick={() => setMarks((p) => ({ ...p, [s.id]: k }))}
                                className={`h-7 w-7 text-xs font-semibold rounded ${m===k ? (k==="P"?"bg-success text-white":k==="A"?"bg-destructive text-white":"bg-warning text-white") : "bg-muted text-muted-foreground hover:bg-muted/70"} ${locked ? "opacity-50 cursor-not-allowed" : ""}`}>
                                {k}
                              </button>
                            ))}
                            {locked && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setOverrideOpen({ studentId: s.id, current: m }); setOverrideMark(m); }}>Override</Button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="defaulters" className="mt-4">
              <Card className="border-border/60"><CardHeader><CardTitle className="text-base">Chronic Absentees — Students</CardTitle><CardDescription>Students below 85% attendance</CardDescription></CardHeader><CardContent className="p-0">
                <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Attendance</TableHead><TableHead>Last Absent</TableHead><TableHead>Parent</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>{allStudents.filter((s) => s.attendance < 85).slice(0, 12).map((s) => (
                    <TableRow key={s.id}><TableCell className="font-medium">{s.name}</TableCell><TableCell>{s.class}-{s.section}</TableCell><TableCell><Badge variant={s.attendance < 80 ? "destructive" : "secondary"}>{s.attendance}%</Badge></TableCell><TableCell className="text-xs text-muted-foreground">Yesterday</TableCell><TableCell className="text-xs">{s.parent}</TableCell><TableCell><Button size="sm" variant="outline" onClick={() => toast.success("SMS + email sent to parent")}><Bell className="h-3.5 w-3.5" />Notify</Button></TableCell></TableRow>
                  ))}</TableBody></Table>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="leaves" className="mt-4">
              <Card className="border-border/60">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Student Leave Requests</CardTitle>
                  <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                    <DialogTrigger asChild><Button size="sm" className="gradient-primary border-0"><Plus className="h-4 w-4" />New Leave</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Raise Student Leave Request</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <Select value={leaveForm.studentId} onValueChange={(v) => setLeaveForm({ ...leaveForm, studentId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{allStudents.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · {s.class}-{s.section}</SelectItem>)}</SelectContent></Select>
                        <div className="grid grid-cols-2 gap-2"><Input type="date" value={leaveForm.from} onChange={(e) => setLeaveForm({ ...leaveForm, from: e.target.value })} /><Input type="date" value={leaveForm.to} onChange={(e) => setLeaveForm({ ...leaveForm, to: e.target.value })} /></div>
                        <Select value={leaveForm.type} onValueChange={(v) => setLeaveForm({ ...leaveForm, type: v as typeof leaveForm.type })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LEAVE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                        <Textarea placeholder="Reason" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
                      </div>
                      <DialogFooter><Button onClick={() => { const st = allStudents.find((s) => s.id === leaveForm.studentId); if (!st) return; leaveApi.add({ ...leaveForm, studentName: st.name, klass: `${st.class}-${st.section}`, raisedBy: "Teacher" }); setLeaveOpen(false); toast.success("Leave raised"); }}>Submit</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-0">
                  <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Student</TableHead><TableHead>Dates</TableHead><TableHead>Type</TableHead><TableHead>Reason</TableHead><TableHead>Raised By</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>{leaves.map((l) => (
                      <TableRow key={l.id}><TableCell className="font-mono text-xs">{l.id}</TableCell><TableCell className="font-medium">{l.studentName}<div className="text-xs text-muted-foreground">{l.klass}</div></TableCell><TableCell className="text-xs">{l.from} → {l.to}</TableCell><TableCell><Badge variant="outline">{l.type}</Badge></TableCell><TableCell className="text-xs max-w-xs truncate">{l.reason}</TableCell><TableCell className="text-xs">{l.raisedBy}</TableCell><TableCell><Badge variant={l.status === "Approved" ? "default" : l.status === "Rejected" ? "destructive" : "outline"}>{l.status}</Badge></TableCell><TableCell>{l.status === "Pending" && <div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => { leaveApi.approve(l.id); toast.success("Approved"); }}>Approve</Button><Button size="sm" variant="outline" onClick={() => { leaveApi.reject(l.id, "Insufficient justification"); toast.success("Rejected"); }}>Reject</Button></div>}</TableCell></TableRow>
                    ))}</TableBody></Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="corrections" className="mt-4">
              <Card className="border-border/60"><CardHeader><CardTitle className="text-base">Student Attendance Corrections</CardTitle></CardHeader><CardContent className="p-0">
                <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Student</TableHead><TableHead>Date</TableHead><TableHead>Current</TableHead><TableHead>Requested</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>{corrections.map((c) => (
                    <TableRow key={c.id}><TableCell className="font-mono text-xs">{c.id}</TableCell><TableCell className="font-medium">{c.studentName}<div className="text-xs text-muted-foreground">{c.klass}</div></TableCell><TableCell className="text-xs">{c.date}</TableCell><TableCell><Badge variant="destructive">{c.currentMark}</Badge></TableCell><TableCell><Badge>{c.requestedMark}</Badge></TableCell><TableCell className="text-xs max-w-xs truncate">{c.reason}</TableCell><TableCell><Badge variant={c.status === "Approved" ? "default" : c.status === "Rejected" ? "destructive" : "outline"}>{c.status}</Badge></TableCell><TableCell>{c.status === "Pending" && <div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => { correctionApi.approve(c.id); toast.success("Approved — record updated"); }}>Approve</Button><Button size="sm" variant="outline" onClick={() => { correctionApi.reject(c.id); toast.success("Rejected"); }}>Reject</Button></div>}</TableCell></TableRow>
                  ))}{corrections.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-6">No correction requests</TableCell></TableRow>}</TableBody></Table>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="heatmap" className="mt-4">
              <Card className="border-border/60"><CardHeader><CardTitle className="text-base">6-Week Attendance Heatmap · Class {klass}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-1" style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}>
                    <div />
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => <div key={d} className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">{d}</div>)}
                    {heat.map((row, w) => (
                      <div key={`w-${w}`} className="contents">
                        <div className="text-[10px] text-muted-foreground py-2">W{w+1}</div>
                        {row.map((v, d) => (
                          <div key={`${w}-${d}`} className="aspect-square rounded relative group cursor-pointer" style={{ background: `oklch(0.85 0.1 165 / ${(v - 60) / 40})` }} title={`${v}%`}>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium opacity-0 group-hover:opacity-100 text-foreground">{v}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="mt-4">
              <Card className="border-border/60"><CardHeader><CardTitle className="text-base">Weekly Trends</CardTitle></CardHeader><CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={attendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="day" fontSize={11} /><YAxis domain={[80, 100]} fontSize={11} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="students" stroke="var(--chart-1)" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="staff" stroke="var(--chart-3)" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="audit" className="mt-4">
              <Card className="border-border/60"><CardContent className="p-0 divide-y">
                {auditLogs.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">No audit entries yet — submit attendance, lock, or process a leave to start logging.</div>}
                {auditLogs.map((a) => (
                  <div key={a.id} className="p-3 text-sm flex items-center justify-between"><div><span className="font-mono text-xs text-muted-foreground mr-2">{a.entity}/{a.entityId}</span>{a.action}</div><span className="text-xs text-muted-foreground">{a.by} · {new Date(a.at).toLocaleString("en-IN")}</span></div>
                ))}
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ============================== STAFF ============================== */}
        <TabsContent value="staff" className="space-y-4">
          <Tabs defaultValue="mark">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="mark">Staff Attendance</TabsTrigger>
              <TabsTrigger value="defaulters">Chronic Absentees</TabsTrigger>
              <TabsTrigger value="leaves">Leave Requests ({staffLeaves.filter((l) => l.status === "Pending").length})</TabsTrigger>
              <TabsTrigger value="corrections">Corrections ({staffCorrections.filter((c) => c.status === "Pending").length})</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
            </TabsList>

            <TabsContent value="mark" className="mt-4">
              <Card className="border-border/60">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">Staff Attendance · {new Date(date).toLocaleDateString("en-IN")}</CardTitle>
                    <CardDescription>{staffPresent}P / {staffAbsent}A / {staffOnLeave}L of {employees.length} staff</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setStaffMarks(Object.fromEntries(employees.map((e) => [e.id, "P"]))); toast.success("All staff marked Present"); }}>Mark all Present</Button>
                    <Button size="sm" className="gradient-primary border-0" onClick={() => toast.success(`Staff attendance saved · ${staffPresent}P / ${staffAbsent}A / ${staffOnLeave}L`)}><Send className="h-4 w-4" />Submit</Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>ID</TableHead><TableHead>Role</TableHead><TableHead>Department</TableHead><TableHead className="text-right">Mark</TableHead></TableRow></TableHeader>
                    <TableBody>{employees.map((e) => {
                      const m = staffMarks[e.id];
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{e.name}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{e.id}</TableCell>
                          <TableCell className="text-xs">{e.role}</TableCell>
                          <TableCell className="text-xs">{e.department}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-end">
                              {(["P","A","L"] as AttMark[]).map((k) => (
                                <button key={k} onClick={() => setStaffMarks((p) => ({ ...p, [e.id]: k }))}
                                  className={`h-7 w-7 text-xs font-semibold rounded ${m===k ? (k==="P"?"bg-success text-white":k==="A"?"bg-destructive text-white":"bg-warning text-white") : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                                  {k}
                                </button>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}</TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="defaulters" className="mt-4">
              <Card className="border-border/60"><CardHeader><CardTitle className="text-base">Chronic Absentees — Staff</CardTitle><CardDescription>Staff below 90% attendance this term</CardDescription></CardHeader><CardContent className="p-0">
                <Table><TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Role</TableHead><TableHead>Department</TableHead><TableHead>Attendance</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>{employees.map((e) => ({ e, pct: staffAttendancePct(e.id) })).filter((x) => x.pct < 90).map(({ e, pct }) => (
                    <TableRow key={e.id}><TableCell className="font-medium">{e.name}</TableCell><TableCell className="text-xs">{e.role}</TableCell><TableCell className="text-xs">{e.department}</TableCell><TableCell><Badge variant={pct < 85 ? "destructive" : "secondary"}>{pct}%</Badge></TableCell><TableCell><Button size="sm" variant="outline" onClick={() => toast.success("HR notified")}><Bell className="h-3.5 w-3.5" />Notify HR</Button></TableCell></TableRow>
                  ))}</TableBody></Table>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="leaves" className="mt-4">
              <Card className="border-border/60">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Staff Leave Requests</CardTitle>
                  <Dialog open={staffLeaveOpen} onOpenChange={setStaffLeaveOpen}>
                    <DialogTrigger asChild><Button size="sm" className="gradient-primary border-0"><Plus className="h-4 w-4" />New Leave</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Raise Staff Leave Request</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <Select value={staffLeaveForm.staffId} onValueChange={(v) => setStaffLeaveForm({ ...staffLeaveForm, staffId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name} · {e.role}</SelectItem>)}</SelectContent></Select>
                        <div className="grid grid-cols-2 gap-2"><Input type="date" value={staffLeaveForm.from} onChange={(e) => setStaffLeaveForm({ ...staffLeaveForm, from: e.target.value })} /><Input type="date" value={staffLeaveForm.to} onChange={(e) => setStaffLeaveForm({ ...staffLeaveForm, to: e.target.value })} /></div>
                        <Select value={staffLeaveForm.type} onValueChange={(v) => setStaffLeaveForm({ ...staffLeaveForm, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Casual","Sick","Earned","Maternity","Duty"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                        <Textarea placeholder="Reason" value={staffLeaveForm.reason} onChange={(e) => setStaffLeaveForm({ ...staffLeaveForm, reason: e.target.value })} />
                      </div>
                      <DialogFooter><Button onClick={() => {
                        const st = employees.find((e) => e.id === staffLeaveForm.staffId); if (!st) return;
                        setStaffLeaves((p) => [{ id: `SLV-${String(p.length + 3).padStart(3, "0")}`, staffId: st.id, staffName: st.name, dept: st.department, from: staffLeaveForm.from, to: staffLeaveForm.to, type: staffLeaveForm.type, reason: staffLeaveForm.reason, status: "Pending" }, ...p]);
                        setStaffLeaveOpen(false); toast.success("Staff leave raised");
                      }}>Submit</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-0">
                  <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Staff</TableHead><TableHead>Dates</TableHead><TableHead>Type</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>{staffLeaves.map((l) => (
                      <TableRow key={l.id}><TableCell className="font-mono text-xs">{l.id}</TableCell><TableCell className="font-medium">{l.staffName}<div className="text-xs text-muted-foreground">{l.dept}</div></TableCell><TableCell className="text-xs">{l.from} → {l.to}</TableCell><TableCell><Badge variant="outline">{l.type}</Badge></TableCell><TableCell className="text-xs max-w-xs truncate">{l.reason}</TableCell><TableCell><Badge variant={l.status === "Approved" ? "default" : l.status === "Rejected" ? "destructive" : "outline"}>{l.status}</Badge></TableCell><TableCell>{l.status === "Pending" && <div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => { setStaffLeaves((p) => p.map((x) => x.id === l.id ? { ...x, status: "Approved" } : x)); toast.success("Approved"); }}>Approve</Button><Button size="sm" variant="outline" onClick={() => { setStaffLeaves((p) => p.map((x) => x.id === l.id ? { ...x, status: "Rejected" } : x)); toast.success("Rejected"); }}>Reject</Button></div>}</TableCell></TableRow>
                    ))}{staffLeaves.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">No staff leave requests</TableCell></TableRow>}</TableBody></Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="corrections" className="mt-4">
              <Card className="border-border/60"><CardHeader><CardTitle className="text-base">Staff Attendance Corrections</CardTitle></CardHeader><CardContent className="p-0">
                <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Staff</TableHead><TableHead>Date</TableHead><TableHead>Current</TableHead><TableHead>Requested</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>{staffCorrections.map((c) => (
                    <TableRow key={c.id}><TableCell className="font-mono text-xs">{c.id}</TableCell><TableCell className="font-medium">{c.staffName}</TableCell><TableCell className="text-xs">{c.date}</TableCell><TableCell><Badge variant="destructive">{c.currentMark}</Badge></TableCell><TableCell><Badge>{c.requestedMark}</Badge></TableCell><TableCell className="text-xs max-w-xs truncate">{c.reason}</TableCell><TableCell><Badge variant={c.status === "Approved" ? "default" : c.status === "Rejected" ? "destructive" : "outline"}>{c.status}</Badge></TableCell><TableCell>{c.status === "Pending" && <div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => { setStaffCorrections((p) => p.map((x) => x.id === c.id ? { ...x, status: "Approved" } : x)); setStaffMarks((p) => ({ ...p, [c.staffId]: c.requestedMark })); toast.success("Approved — record updated"); }}>Approve</Button><Button size="sm" variant="outline" onClick={() => { setStaffCorrections((p) => p.map((x) => x.id === c.id ? { ...x, status: "Rejected" } : x)); toast.success("Rejected"); }}>Reject</Button></div>}</TableCell></TableRow>
                  ))}{staffCorrections.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-6">No correction requests</TableCell></TableRow>}</TableBody></Table>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="devices" className="mt-4">
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: "ZKTeco K40 · Main Gate", icon: Fingerprint, status: "Online", scans: 2841 },
                  { name: "Face Cam · Block-A", icon: Camera, status: "Online", scans: 1204 },
                  { name: "ZKTeco F18 · Staff Room", icon: Fingerprint, status: "Offline", scans: 0 },
                ].map((d) => (
                  <Card key={d.name} className="border-border/60"><CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-md gradient-primary flex items-center justify-center"><d.icon className="h-5 w-5 text-primary-foreground" /></div>
                      <Badge variant={d.status === "Online" ? "secondary" : "destructive"}>{d.status}</Badge>
                    </div>
                    <div className="mt-3 text-sm font-semibold">{d.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">Scans today: {d.scans.toLocaleString()}</div>
                  </CardContent></Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      <Dialog open={!!overrideOpen} onOpenChange={(o) => !o && setOverrideOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Override Locked Attendance</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-sm">Current: <Badge>{overrideOpen?.current}</Badge></div>
            <Select value={overrideMark} onValueChange={(v) => setOverrideMark(v as AttMark)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["P","A","L"] as AttMark[]).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
            <Textarea placeholder="Reason (audit log)" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
          </div>
          <DialogFooter><Button onClick={() => { if (!overrideOpen || !overrideReason.trim()) return toast.error("Reason required"); setMarks((p) => ({ ...p, [overrideOpen.studentId]: overrideMark })); toast.success("Override applied · audit logged"); setOverrideOpen(null); setOverrideReason(""); }}>Apply Override</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
