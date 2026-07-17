import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, UserX, ShieldCheck, FileText } from "lucide-react";
import { studentsApi, activityApi } from "@/lib/store";
import type { Student } from "@/lib/mock";
import { toast } from "sonner";

const SECTIONS = ["A", "B", "C", "D"];
const STREAMS = ["Science", "Commerce", "Humanities", "General"];

/* -------- printable document window (Transfer / Bonafide certificates) -------- */
export function printCertificate(title: string, bodyRows: [string, string][], paragraph: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  const rows = bodyRows
    .map(([k, v]) => `<tr><td class="k">${k}</td><td>${v || "—"}</td></tr>`)
    .join("");
  const ack = Array.from({ length: 12 }).map(() => Math.floor(Math.random() * 10)).join("");
  w.document.write(`<!doctype html><html><head><title>${title}</title>
    <style>
      body{font-family: ui-serif, Georgia, "Times New Roman", serif; color:#111; padding:40px; max-width:820px; margin:auto;}
      .head{text-align:center; border-bottom:3px double #111; padding-bottom:14px; margin-bottom:20px;}
      .head h1{font-family: ui-sans-serif, system-ui; font-size:22px; margin:0;}
      .head .sub{color:#555; font-size:12px; letter-spacing:2px; text-transform:uppercase;}
      h2{font-family: ui-sans-serif, system-ui; text-align:center; font-size:16px; text-decoration:underline; margin:24px 0;}
      table{width:100%; border-collapse:collapse; margin:12px 0 20px;}
      td{border:1px solid #ccc; padding:8px 10px; font-size:13px;}
      td.k{width:38%; background:#f4f4f5; font-weight:600;}
      p{font-size:13px; line-height:1.8;}
      .sigs{display:flex; justify-content:space-between; margin-top:60px; font-size:12px;}
      .sigs div{border-top:1px solid #555; padding-top:6px; width:200px; text-align:center;}
      .foot{margin-top:40px; font-size:10px; color:#777; text-align:center;}
    </style></head><body>
    <div class="head"><div class="sub">Edureon School Management</div><h1>Mothers Public School — Unit-1</h1><div class="sub">New Delhi · Affiliation No. 2130428</div></div>
    <h2>${title}</h2>
    <table>${rows}</table>
    <p>${paragraph}</p>
    <div class="sigs"><div>Class Teacher</div><div>Principal</div></div>
    <div class="foot">Ref. No. ${ack} · Issued on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} · System-generated document</div>
    </body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 300);
}

/* ====================== TRANSFER DIALOG ====================== */
export function TransferDialog({ open, onOpenChange, student }: { open: boolean; onOpenChange: (v: boolean) => void; student: Student }) {
  const [kind, setKind] = useState<"section" | "stream" | "school">("section");
  const [section, setSection] = useState(student.section);
  const [stream, setStream] = useState(student.stream || "Science");
  const [school, setSchool] = useState("");
  const [reason, setReason] = useState("");

  const submit = () => {
    if (kind === "section") {
      studentsApi.update(student.id, { section });
      activityApi.log("student", student.id, `Transferred to section ${student.class}-${section}${reason ? ` · ${reason}` : ""}`);
      toast.success(`Moved to ${student.class}-${section}`);
    } else if (kind === "stream") {
      studentsApi.update(student.id, { stream, section });
      activityApi.log("student", student.id, `Stream changed to ${stream}${reason ? ` · ${reason}` : ""}`);
      toast.success(`Stream changed to ${stream}`);
    } else {
      if (!school.trim()) { toast.error("Enter the destination school"); return; }
      studentsApi.archive(student.id, { archiveType: "Transferred", archiveReason: reason || `Transferred to ${school}`, archiveTargetBranch: school });
      activityApi.log("student", student.id, `Transferred out to ${school}`);
      printCertificate("Transfer Certificate", [
        ["Student Name", student.name],
        ["Admission No.", student.admissionNo],
        ["Class / Section", `${student.class} - ${student.section}`],
        ["Father / Guardian", student.parent],
        ["Date of Birth", student.dob || "—"],
        ["Transferred To", school],
        ["Reason", reason || "On parent's request"],
        ["Date of Leaving", new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })],
        ["Conduct", "Satisfactory"],
      ], `This is to certify that <b>${student.name}</b>, a bona-fide student of this institution, has been granted a Transfer Certificate to join <b>${school}</b>. All dues have been cleared and the conduct of the student during their stay has been satisfactory.`);
      toast.success("Transfer certificate generated");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" />Transfer Student</DialogTitle>
          <DialogDescription>Move {student.name} to a different section, stream or school.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Transfer type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="section">Different Section</SelectItem>
                <SelectItem value="stream">Different Stream</SelectItem>
                <SelectItem value="school">Different School (generates TC)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {kind === "section" && (
            <div className="grid gap-2">
              <Label>New section (Class {student.class})</Label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SECTIONS.map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {kind === "stream" && (
            <>
              <div className="grid gap-2">
                <Label>New stream</Label>
                <Select value={stream} onValueChange={setStream}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STREAMS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Section</Label>
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SECTIONS.map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </>
          )}
          {kind === "school" && (
            <div className="grid gap-2">
              <Label>Destination school</Label>
              <Input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Ryan International, Mumbai" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><FileText className="h-3 w-3" />A Transfer Certificate will be generated and the student archived.</div>
            </div>
          )}
          <div className="grid gap-2">
            <Label>Reason / remarks (optional)</Label>
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for transfer…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Confirm Transfer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ====================== SUSPEND DIALOG ====================== */
export function SuspendDialog({ open, onOpenChange, student }: { open: boolean; onOpenChange: (v: boolean) => void; student: Student }) {
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("3");

  const submit = () => {
    const d = parseInt(days, 10);
    if (!reason.trim()) { toast.error("Please provide a reason"); return; }
    if (!d || d < 1) { toast.error("Enter a valid duration in days"); return; }
    const from = new Date();
    const until = new Date(); until.setDate(until.getDate() + d);
    studentsApi.update(student.id, {
      suspended: true,
      suspendReason: reason,
      suspendDays: d,
      suspendFrom: from.toISOString().slice(0, 10),
      suspendUntil: until.toISOString().slice(0, 10),
      status: "Inactive",
    });
    activityApi.log("student", student.id, `Suspended for ${d} day(s) — ${reason}`);
    toast.success(`${student.name} suspended for ${d} day(s)`);
    onOpenChange(false);
  };

  const revoke = () => {
    studentsApi.update(student.id, {
      suspended: false, suspendReason: undefined, suspendDays: undefined,
      suspendFrom: undefined, suspendUntil: undefined, status: "Active",
    });
    activityApi.log("student", student.id, "Suspension revoked");
    toast.success("Suspension revoked");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserX className="h-4 w-4" />{student.suspended ? "Manage Suspension" : "Suspend Student"}</DialogTitle>
          <DialogDescription>{student.name} · {student.class}-{student.section}</DialogDescription>
        </DialogHeader>
        {student.suspended ? (
          <div className="space-y-3">
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm space-y-1">
              <div className="flex items-center gap-2"><Badge variant="outline" className="text-destructive border-destructive/40">Suspended</Badge></div>
              <div><span className="text-muted-foreground">Reason:</span> {student.suspendReason}</div>
              <div><span className="text-muted-foreground">Period:</span> {student.suspendFrom} → {student.suspendUntil} ({student.suspendDays} days)</div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={revoke}><ShieldCheck className="h-4 w-4" />Revoke Suspension</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Reason for suspension</Label>
                <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe the reason…" />
              </div>
              <div className="grid gap-2">
                <Label>Duration (days)</Label>
                <Input type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button variant="destructive" onClick={submit}>Suspend</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}