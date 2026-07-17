import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Wrench, Plus, Clock, CheckCircle2, Loader2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import {
  useMaintenance, maintenanceApi,
  type MaintStatus, type MaintPriority, type MaintKind,
} from "@/lib/store";

export const Route = createFileRoute("/teacher/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance Requests — Edureon" }] }),
  component: TeacherMaintenance,
});

// The signed-in teacher for this demo portal.
const ME = "A. Mehta";

const KINDS: MaintKind[] = ["Equipment", "Structure", "Furniture", "Electrical", "Plumbing", "IT / AV", "Other"];
const PRIORITIES: MaintPriority[] = ["Low", "Medium", "High", "Critical"];
const LOCATIONS = ["Room X-A", "Room X-B", "Room IX-A", "Room XI-C", "Room XII-A", "Science Lab", "Computer Lab", "Library", "Auditorium", "Staff Room"];

const statusTone: Record<MaintStatus, string> = {
  Requested: "bg-muted text-foreground border-border",
  Assigned: "bg-info/10 text-info border-info/20",
  "In Progress": "bg-warning/15 text-warning border-warning/20",
  Resolved: "bg-success/10 text-success border-success/20",
};
const prioTone: Record<MaintPriority, string> = {
  Low: "bg-muted text-muted-foreground border-border",
  Medium: "bg-info/10 text-info border-info/20",
  High: "bg-warning/15 text-warning border-warning/20",
  Critical: "bg-destructive/10 text-destructive border-destructive/20",
};

const STEPS: MaintStatus[] = ["Requested", "Assigned", "In Progress", "Resolved"];

function TeacherMaintenance() {
  const all = useMaintenance();
  const mine = useMemo(() => all.filter((m) => m.raisedBy === ME), [all]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    title: "", location: "Room X-B", kind: "Equipment" as MaintKind,
    priority: "Medium" as MaintPriority, description: "",
  });

  const kpis = useMemo(() => ({
    open: mine.filter((m) => m.status !== "Resolved").length,
    progress: mine.filter((m) => m.status === "In Progress").length,
    resolved: mine.filter((m) => m.status === "Resolved").length,
  }), [mine]);

  const submit = () => {
    if (!f.title.trim()) return toast.error("Add a short title for the issue");
    if (!f.description.trim()) return toast.error("Describe the problem so it can be actioned");
    maintenanceApi.add({ ...f, raisedBy: ME });
    toast.success("Maintenance request submitted to coordinator");
    setOpen(false);
    setF({ title: "", location: "Room X-B", kind: "Equipment", priority: "Medium", description: "" });
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Facilities"
        title="Classroom Maintenance"
        description="Raise a request for faulty equipment or classroom repairs. Your coordinator handles assignment and resolution — you'll see the status update here."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary border-0"><Plus className="h-4 w-4" />New Request</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">Raise Maintenance Request</DialogTitle>
                <DialogDescription>Describe what needs fixing. The coordinator is notified immediately.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Issue title</Label>
                  <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Projector not powering on" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Location / Classroom</Label>
                  <Select value={f.location} onValueChange={(v) => setF({ ...f, location: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v as MaintKind })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <Select value={f.priority} onValueChange={(v) => setF({ ...f, priority: v as MaintPriority })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Explain the problem and how it affects teaching…" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} className="gradient-primary border-0">Submit request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard label="Open" value={kpis.open} icon={<ClipboardList className="h-5 w-5" />} tone="info" />
        <KpiCard label="In Progress" value={kpis.progress} icon={<Loader2 className="h-5 w-5" />} tone="warning" />
        <KpiCard label="Resolved" value={kpis.resolved} icon={<CheckCircle2 className="h-5 w-5" />} tone="success" />
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">My Requests</CardTitle>
          <CardDescription>{mine.length} request(s) raised by you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mine.map((m) => {
            const step = STEPS.indexOf(m.status);
            return (
              <div key={m.id} className="rounded-lg border border-border/60 p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] text-muted-foreground">{m.id}</span>
                      <span className="font-medium text-sm">{m.title}</span>
                      <Badge variant="outline" className={"text-[10px] " + prioTone[m.priority]}>{m.priority}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{m.location} · {m.kind}</div>
                    <p className="text-sm mt-1.5">{m.description}</p>
                  </div>
                  <Badge variant="outline" className={"text-[10px] " + statusTone[m.status]}>{m.status}</Badge>
                </div>

                {/* Progress tracker — teachers see status only, never cost/vendor */}
                <div className="flex items-center gap-1 mt-3">
                  {STEPS.map((s, i) => (
                    <div key={s} className="flex-1 flex items-center gap-1">
                      <div className={"h-1.5 flex-1 rounded-full " + (i <= step ? "bg-primary" : "bg-muted")} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                  {STEPS.map((s) => <span key={s}>{s}</span>)}
                </div>

                {m.assignedTo && (
                  <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                    <Wrench className="h-3 w-3" /> Handled by {m.assignedTo}
                  </div>
                )}
                <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Raised {new Date(m.createdAt).toLocaleDateString("en-IN")}
                  {m.resolvedAt && ` · Resolved ${new Date(m.resolvedAt).toLocaleDateString("en-IN")}`}
                </div>
              </div>
            );
          })}
          {mine.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-10">
              No maintenance requests yet. Click “New Request” to report an issue.
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
