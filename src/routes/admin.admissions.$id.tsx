import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ArrowRight, Phone, Mail, MessageSquare, Calendar, FileCheck2, Trash2, Archive, IndianRupee, GraduationCap, Send } from "lucide-react";
import { useInquiries, inquiriesApi, ADM_STAGES, activityApi, notesApi, useActivity, useNotes, studentsApi } from "@/lib/store";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/admissions/$id")({
  head: () => ({ meta: [{ title: "Inquiry Details — Admissions" }] }),
  component: InquiryDetailPage,
});

const stageColor: Record<string, string> = {
  Inquiry: "bg-muted text-muted-foreground",
  Lead: "bg-info/15 text-info",
  Counseling: "bg-chart-3/15 text-chart-3",
  "Admission Test": "bg-warning/15 text-warning",
  "Doc Verification": "bg-accent/15 text-accent-foreground",
  "Fee Payment": "bg-chart-5/15 text-chart-5",
  Enrolled: "bg-success/15 text-success",
};

function InquiryDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const inquiries = useInquiries();
  useActivity(); useNotes();
  const inq = inquiries.find((x) => x.id === id);

  const [commOpen, setCommOpen] = useState(false);
  const [comm, setComm] = useState<{ channel: "Email" | "SMS" | "WhatsApp" | "Call"; subject: string; body: string }>({ channel: "Email", subject: "", body: "" });
  const [fu, setFu] = useState({ due: "", note: "" });
  const [noteText, setNoteText] = useState("");

  if (!inq) {
    return (
      <PageContainer>
        <PageHeader title="Inquiry not found" description="It may have been deleted." />
        <Link to="/admin/admissions"><Button variant="outline"><ChevronLeft className="h-4 w-4" />Back to pipeline</Button></Link>
      </PageContainer>
    );
  }

  const activity = activityApi.for("inquiry", id);
  const notes = notesApi.for("inquiry", id);
  const stageIdx = ADM_STAGES.indexOf(inq.stage);
  const nextStage = ADM_STAGES[stageIdx + 1];
  const progress = Math.round(((stageIdx + 1) / ADM_STAGES.length) * 100);
  const docsOk = (inq.documents || []).filter((d) => d.ok).length;
  const docsTotal = (inq.documents || []).length;

  const enroll = () => {
    if (inq.stage !== "Enrolled") inquiriesApi.moveStage(id, "Enrolled");
    studentsApi.add({
      name: inq.name, admissionNo: `ADM-${new Date().getFullYear()}-${id.replace("ADM-", "")}`,
      class: inq.class, section: "A", rollNo: Math.floor(Math.random() * 60) + 1,
      gender: (inq.gender || "Male") as any, parent: inq.parent, phone: inq.phone,
      feeStatus: "Paid", attendance: 100, email: inq.email, address: inq.address, dob: inq.dob,
    } as any);
    toast.success(`${inq.name} enrolled as student`);
    setTimeout(() => navigate({ to: "/students" }), 400);
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<Link to="/admin/admissions" className="hover:text-primary inline-flex items-center"><ChevronLeft className="h-3.5 w-3.5" />Admissions Pipeline</Link>}
        title={inq.name}
        description={`${id} · Class ${inq.class} · Source: ${inq.source}${inq.counselor ? ` · Counselor: ${inq.counselor}` : ""}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => { inquiriesApi.archive(id, !inq.archived); toast.success(inq.archived ? "Restored" : "Archived"); }}>
              <Archive className="h-4 w-4" />{inq.archived ? "Restore" : "Archive"}
            </Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => { inquiriesApi.remove(id); navigate({ to: "/admin/admissions" }); }}>
              <Trash2 className="h-4 w-4" />Delete
            </Button>
            {nextStage && (
              <Button size="sm" className="gradient-primary border-0" onClick={() => { inquiriesApi.moveStage(id, nextStage); toast.success(`Moved to ${nextStage}`); }}>
                Move to {nextStage}<ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {(inq.stage === "Fee Payment" || inq.stage === "Enrolled") && <Button size="sm" onClick={enroll}><GraduationCap className="h-4 w-4" />Enroll as Student</Button>}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <Card className="lg:col-span-2 border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-5">
              <Avatar className="h-14 w-14"><AvatarFallback className="bg-primary/10 text-primary text-lg">{inq.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
              <div className="flex-1">
                <Badge className={stageColor[inq.stage]}>{inq.stage}</Badge>
                <div className="text-xs text-muted-foreground mt-1">Created {new Date(inq.createdAt).toLocaleDateString()} · Updated {new Date(inq.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Pipeline progress</span><span className="font-semibold">{progress}%</span></div>
              <Progress value={progress} className="h-2" />
              <div className="grid grid-cols-7 gap-1 mt-3">
                {ADM_STAGES.map((s, i) => (
                  <button key={s} onClick={() => { inquiriesApi.moveStage(id, s); toast.success(`Moved to ${s}`); }}
                    className={`text-[9px] py-1.5 rounded border ${i <= stageIdx ? "bg-primary text-primary-foreground border-primary" : "border-border/60 hover:bg-muted"}`}>
                    {s.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5 space-y-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={() => { setComm({ channel: "Email", subject: "", body: "" }); setCommOpen(true); }}><Mail className="h-3.5 w-3.5" />Email</Button>
              <Button size="sm" variant="outline" onClick={() => { setComm({ channel: "SMS", subject: "Update", body: "" }); setCommOpen(true); }}><MessageSquare className="h-3.5 w-3.5" />SMS</Button>
              <Button size="sm" variant="outline" onClick={() => toast.success(`Calling ${inq.phone}…`)}><Phone className="h-3.5 w-3.5" />Call</Button>
              <Button size="sm" variant="outline" onClick={() => { setComm({ channel: "WhatsApp", subject: "Update", body: "" }); setCommOpen(true); }}><MessageSquare className="h-3.5 w-3.5" />WhatsApp</Button>
            </div>
            <div className="pt-2 border-t">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Assign Counselor</div>
              <Select value={inq.counselor} onValueChange={(v) => { inquiriesApi.assignCounselor(id, v); toast.success(`Assigned to ${v}`); }}>
                <SelectTrigger className="h-8"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>{["Sneha K.", "Rohit M.", "Priya S.", "Vikram T."].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="student">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="student">Student</TabsTrigger>
          <TabsTrigger value="parent">Parent</TabsTrigger>
          <TabsTrigger value="counseling">Counseling</TabsTrigger>
          <TabsTrigger value="documents">Documents ({docsOk}/{docsTotal})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="comms">Comms ({inq.comms.length})</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="student" className="mt-4">
          <Card><CardContent className="p-5 grid md:grid-cols-2 gap-4">
            <Field label="Full name" value={inq.name} onSave={(v) => inquiriesApi.update(id, { name: v })} />
            <Field label="Applying for class" value={inq.class} onSave={(v) => inquiriesApi.update(id, { class: v })} />
            <Field label="Date of birth" value={inq.dob || ""} type="date" onSave={(v) => inquiriesApi.update(id, { dob: v })} />
            <Field label="Gender" value={inq.gender || "Male"} onSave={(v) => inquiriesApi.update(id, { gender: v as any })} />
            <Field label="Previous school" value={inq.prevSchool || ""} onSave={(v) => inquiriesApi.update(id, { prevSchool: v })} />
            <Field label="Address" value={inq.address || ""} onSave={(v) => inquiriesApi.update(id, { address: v })} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="parent" className="mt-4">
          <Card><CardContent className="p-5 grid md:grid-cols-2 gap-4">
            <Field label="Father / Guardian" value={inq.parent} onSave={(v) => inquiriesApi.update(id, { parent: v })} />
            <Field label="Mother" value={inq.motherName || ""} onSave={(v) => inquiriesApi.update(id, { motherName: v })} />
            <Field label="Phone" value={inq.phone} onSave={(v) => inquiriesApi.update(id, { phone: v })} />
            <Field label="Email" value={inq.email} onSave={(v) => inquiriesApi.update(id, { email: v })} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="counseling" className="mt-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Follow-ups</CardTitle></CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              <div className="grid md:grid-cols-3 gap-2">
                <Input type="date" value={fu.due} onChange={(e) => setFu({ ...fu, due: e.target.value })} />
                <Input className="md:col-span-2" placeholder="Note (e.g. discuss scholarship)" value={fu.note} onChange={(e) => setFu({ ...fu, note: e.target.value })} />
              </div>
              <Button size="sm" disabled={!fu.due || !fu.note} onClick={() => { inquiriesApi.addFollowUp(id, fu.due, fu.note); setFu({ due: "", note: "" }); toast.success("Follow-up added"); }}>
                <Calendar className="h-4 w-4" />Schedule
              </Button>
              <div className="divide-y border rounded-md mt-3">
                {inq.followUps.length === 0 && <div className="p-4 text-xs text-muted-foreground text-center">No follow-ups yet.</div>}
                {inq.followUps.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-3">
                    <Checkbox checked={f.done} onCheckedChange={() => inquiriesApi.toggleFollowUp(id, f.id)} />
                    <div className="flex-1">
                      <div className={`text-sm ${f.done ? "line-through text-muted-foreground" : ""}`}>{f.note}</div>
                      <div className="text-[11px] text-muted-foreground">Due {f.due}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Stage History</div>
                <div className="space-y-1.5">
                  {inq.history.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="text-[10px]">{h.stage}</Badge>
                      <span className="text-muted-foreground">{new Date(h.at).toLocaleString()} · by {h.by}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card><CardContent className="p-5 space-y-2">
            {(inq.documents || []).map((d) => (
              <div key={d.name} className="flex items-center gap-3 p-3 border rounded-md">
                <Checkbox checked={d.ok} onCheckedChange={() => inquiriesApi.toggleDoc(id, d.name)} />
                <FileCheck2 className={`h-4 w-4 ${d.ok ? "text-success" : "text-muted-foreground"}`} />
                <div className="flex-1 text-sm">{d.name}</div>
                <Badge variant={d.ok ? "default" : "outline"} className="text-[10px]">{d.ok ? "Verified" : "Pending"}</Badge>
                <Button size="sm" variant="ghost" onClick={() => toast.success(`${d.name} uploaded`)}>Upload</Button>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card><CardContent className="p-5 space-y-3">
            <div className="flex gap-2">
              <Textarea placeholder="Add a note…" rows={2} value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <Button onClick={() => { if (noteText.trim()) { notesApi.add("inquiry", id, noteText); setNoteText(""); toast.success("Note added"); } }}>Save</Button>
            </div>
            <div className="space-y-2">
              {notes.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">No notes yet.</div>}
              {notes.map((n) => (
                <div key={n.id} className="p-3 border rounded-md">
                  <div className="text-sm">{n.text}</div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                    <span>{n.by} · {new Date(n.at).toLocaleString()}</span>
                    <Button size="sm" variant="ghost" onClick={() => notesApi.remove(n.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="comms" className="mt-4">
          <Card><CardContent className="p-5 space-y-3">
            {commOpen && (
              <div className="p-3 border rounded-md space-y-2 bg-muted/30">
                <div className="grid grid-cols-3 gap-2">
                  <Select value={comm.channel} onValueChange={(v) => setComm({ ...comm, channel: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Email", "SMS", "WhatsApp", "Call"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input className="col-span-2" placeholder="Subject" value={comm.subject} onChange={(e) => setComm({ ...comm, subject: e.target.value })} />
                </div>
                <Textarea rows={3} placeholder="Message…" value={comm.body} onChange={(e) => setComm({ ...comm, body: e.target.value })} />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setCommOpen(false)}>Cancel</Button>
                  <Button size="sm" disabled={!comm.subject || !comm.body} onClick={() => { inquiriesApi.addComm(id, comm); setCommOpen(false); toast.success(`${comm.channel} sent`); }}>
                    <Send className="h-3.5 w-3.5" />Send
                  </Button>
                </div>
              </div>
            )}
            {!commOpen && <Button size="sm" variant="outline" onClick={() => setCommOpen(true)}><Send className="h-3.5 w-3.5" />New message</Button>}
            <div className="space-y-2">
              {inq.comms.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">No communication logged yet.</div>}
              {inq.comms.map((c) => (
                <div key={c.id} className="p-3 border rounded-md">
                  <div className="flex items-center gap-2"><Badge variant="outline" className="text-[10px]">{c.channel}</Badge><span className="text-sm font-medium">{c.subject}</span></div>
                  <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{c.body}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{c.by} · {new Date(c.at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="payment" className="mt-4">
          <Card><CardContent className="p-5 space-y-3">
            <div className="grid md:grid-cols-3 gap-3">
              <Stat icon={<IndianRupee className="h-4 w-4" />} label="Fee total" value={`₹${(inq.feeTotal || 0).toLocaleString("en-IN")}`} />
              <Stat icon={<IndianRupee className="h-4 w-4" />} label="Paid" value={`₹${(inq.feePaid || 0).toLocaleString("en-IN")}`} />
              <Stat icon={<IndianRupee className="h-4 w-4" />} label="Balance" value={`₹${((inq.feeTotal || 0) - (inq.feePaid || 0)).toLocaleString("en-IN")}`} />
            </div>
            <Progress value={Math.round(((inq.feePaid || 0) / (inq.feeTotal || 1)) * 100)} />
            <div className="flex gap-2">
              <Input type="number" placeholder="Amount" id="payamt" />
              <Button onClick={() => {
                const el = document.getElementById("payamt") as HTMLInputElement;
                const v = Number(el?.value || 0);
                if (v > 0) { inquiriesApi.update(id, { feePaid: (inq.feePaid || 0) + v }); el.value = ""; toast.success(`₹${v.toLocaleString("en-IN")} collected`); }
              }}><IndianRupee className="h-4 w-4" />Collect</Button>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="progress" className="mt-4">
          <Card><CardContent className="p-5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Activity Log</div>
            <div className="space-y-2">
              {activity.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">No activity yet.</div>}
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-xs">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5"></div>
                  <div className="flex-1">
                    <div className="text-sm">{a.action}</div>
                    <div className="text-[11px] text-muted-foreground">{a.by} · {new Date(a.at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function Field({ label, value, onSave, type = "text" }: { label: string; value: string; onSave: (v: string) => void; type?: string }) {
  const [v, setV] = useState(value);
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <Input type={type} value={v} onChange={(e) => setV(e.target.value)} />
        <Button size="sm" variant="outline" disabled={v === value} onClick={() => { onSave(v); toast.success(`${label} saved`); }}>Save</Button>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <div className="font-display text-lg font-semibold mt-0.5">{value}</div>
    </div>
  );
}
