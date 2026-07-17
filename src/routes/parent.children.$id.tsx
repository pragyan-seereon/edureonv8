import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plane } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStudents, useAssignments, useSubmissions, useExams, useMarkEntries, useNotices, useLeaveRequests, leaveApi, type LeaveRequest } from "@/lib/store";

export const Route = createFileRoute("/parent/children/$id")({
  head: () => ({ meta: [{ title: "Child Profile — Edureon" }] }),
  component: ChildProfile,
});

function ChildProfile() {
  const { id } = useParams({ from: "/parent/children/$id" });
  const students = useStudents();
  const assignments = useAssignments();
  const subs = useSubmissions();
  const exams = useExams();
  const marks = useMarkEntries();
  const notices = useNotices();
  const leaves = useLeaveRequests();
  const child = students.find((s) => s.id === id);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ from: "", to: "", reason: "", type: "Sick" as LeaveRequest["type"] });

  if (!child) return <PageContainer><div className="text-sm text-muted-foreground">Not found. <Link to="/parent/children" className="underline">Back</Link></div></PageContainer>;
  const klass = `${child.class}-${child.section}`;
  const mySubs = subs.filter((s) => s.studentId === child.id);
  const myAssignments = assignments.filter((a) => a.klass === klass);
  const myMarks = marks.filter((m) => m.studentId === child.id && m.status === "Published");
  const upExams = exams.filter((e) => e.class === child.class);
  const myLeaves = leaves.filter((l) => l.studentId === child.id);
  const myNotices = notices.filter((n) => n.status === "Published" && (n.audience === "Parents" || n.audience === "All"));

  const submitLeave = () => {
    if (!form.from || !form.to || !form.reason) { toast.error("All fields required"); return; }
    leaveApi.add({ studentId: child.id, studentName: child.name, klass, from: form.from, to: form.to, reason: form.reason, type: form.type, raisedBy: "Parent" });
    toast.success("Leave request submitted");
    setOpen(false); setForm({ from: "", to: "", reason: "", type: "Sick" });
  };

  return (
    <PageContainer>
      <PageHeader eyebrow={child.admissionNo} title={child.name}
        description={`${klass} · Roll ${child.rollNo} · Attendance ${child.attendance}%`}
        actions={
          <>
            <Button variant="ghost" size="sm" asChild><Link to="/parent/children"><ArrowLeft className="h-4 w-4" />Back</Link></Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm" className="gradient-primary border-0"><Plane className="h-4 w-4" />Request Leave</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Leave request</DialogTitle><DialogDescription>For {child.name} · {klass}</DialogDescription></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>From</Label><Input type="date" value={form.from} onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label>To</Label><Input type="date" value={form.to} onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))} /></div>
                  </div>
                  <div className="space-y-1.5"><Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as LeaveRequest["type"] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{(["Sick","Casual","Planned","Emergency"] as const).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Reason</Label><Textarea rows={3} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} /></div>
                </div>
                <DialogFooter><Button onClick={submitLeave} className="gradient-primary border-0">Submit</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Assignments ({myAssignments.length})</TabsTrigger>
          <TabsTrigger value="results">Results ({myMarks.length})</TabsTrigger>
          <TabsTrigger value="exams">Exams ({upExams.length})</TabsTrigger>
          <TabsTrigger value="leaves">Leaves ({myLeaves.length})</TabsTrigger>
          <TabsTrigger value="notices">Notices</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><Card><CardContent className="p-4 text-sm space-y-2">
          <div className="flex justify-between border-b py-1.5"><span className="text-muted-foreground">Class</span><span>{klass}</span></div>
          <div className="flex justify-between border-b py-1.5"><span className="text-muted-foreground">Roll No</span><span>{child.rollNo}</span></div>
          <div className="flex justify-between border-b py-1.5"><span className="text-muted-foreground">Parent</span><span>{child.parent}</span></div>
          <div className="flex justify-between border-b py-1.5"><span className="text-muted-foreground">Phone</span><span>{child.phone}</span></div>
          <div className="flex justify-between border-b py-1.5"><span className="text-muted-foreground">Fee Status</span><Badge variant={child.feeStatus === "Paid" ? "default" : "outline"}>{child.feeStatus}</Badge></div>
        </CardContent></Card></TabsContent>
        <TabsContent value="assignments"><Card><CardContent className="p-0 divide-y">{myAssignments.map((a) => { const s = mySubs.find((x) => x.assignmentId === a.id); return (
          <div key={a.id} className="p-2.5 flex items-center gap-2"><span className="text-sm flex-1 truncate">{a.title}</span><Badge variant="outline" className="text-[10px]">{a.subject}</Badge><Badge variant={s?.status === "Graded" ? "default" : "secondary"} className="text-[10px]">{s?.status ?? "Pending"}</Badge>{s?.status === "Graded" && <Badge className="text-[10px]">{s.marks}/{a.maxMarks}</Badge>}</div>
        ); })}</CardContent></Card></TabsContent>
        <TabsContent value="results"><Card><CardContent className="p-0 divide-y">{myMarks.map((m) => (
          <div key={m.id} className="p-2.5 flex items-center gap-2"><span className="text-sm flex-1">{m.subject}</span><Badge variant="outline" className="text-[10px]">{m.klass}</Badge><span className="text-sm font-semibold">{m.obtained}/{m.max}</span></div>
        ))}</CardContent></Card></TabsContent>
        <TabsContent value="exams"><Card><CardContent className="p-0 divide-y">{upExams.map((e) => (
          <div key={e.id} className="p-2.5 flex items-center gap-2"><span className="text-sm flex-1">{e.name}</span><Badge variant="outline" className="text-[10px]">{e.from} → {e.to}</Badge><Badge className="text-[10px]">{e.status}</Badge></div>
        ))}</CardContent></Card></TabsContent>
        <TabsContent value="leaves"><Card><CardContent className="p-0 divide-y">{myLeaves.map((l) => (
          <div key={l.id} className="p-2.5"><div className="flex items-center gap-2"><span className="text-sm font-medium">{l.type}</span><Badge variant="outline" className="text-[10px]">{l.from} → {l.to}</Badge><Badge variant={l.status === "Approved" ? "default" : l.status === "Rejected" ? "destructive" : "secondary"} className="text-[10px] ml-auto">{l.status}</Badge></div><div className="text-[11px] text-muted-foreground mt-0.5">{l.reason}</div></div>
        ))}{myLeaves.length === 0 && <div className="text-sm text-muted-foreground text-center p-6">No leave requests.</div>}</CardContent></Card></TabsContent>
        <TabsContent value="notices"><Card><CardContent className="p-0 divide-y">{myNotices.map((n) => (
          <div key={n.id} className="p-2.5"><div className="flex items-center gap-2"><Badge variant="outline" className="text-[10px]">{n.category}</Badge><span className="text-sm font-medium flex-1">{n.title}</span><span className="text-[10px] text-muted-foreground">{new Date(n.publishedAt || n.createdAt).toLocaleDateString("en-IN")}</span></div><div className="text-[11px] mt-0.5">{n.body}</div></div>
        ))}</CardContent></Card></TabsContent>
      </Tabs>
    </PageContainer>
  );
}
