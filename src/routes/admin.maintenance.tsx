import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Wrench, ClipboardList, Loader2, CheckCircle2, IndianRupee, Search } from "lucide-react";
import { toast } from "sonner";
import { ExcelExport } from "@/components/excel-export";
import {
  useMaintenance, maintenanceApi,
  type MaintenanceRequest, type MaintStatus, type MaintPriority,
} from "@/lib/store";

export const Route = createFileRoute("/admin/maintenance")({
  head: () => ({ meta: [{ title: "Classroom Maintenance — Edureon" }] }),
  component: AdminMaintenance,
});

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const COORDINATORS = ["R. Kulkarni (Coordinator)", "S. Iyer (HR)", "M. Fernandes (Facilities)", "Estate Office"];
const STATUSES: MaintStatus[] = ["Requested", "Assigned", "In Progress", "Resolved"];

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

function AdminMaintenance() {
  const all = useMaintenance();
  const [status, setStatus] = useState<string>("all");
  const [prio, setPrio] = useState<string>("all");
  const [q, setQ] = useState("");
  const [active, setActive] = useState<MaintenanceRequest | null>(null);

  const rows = useMemo(() => all.filter((m) =>
    (status === "all" || m.status === status) &&
    (prio === "all" || m.priority === prio) &&
    (!q || (m.title + m.location + m.raisedBy + m.id).toLowerCase().includes(q.toLowerCase()))
  ), [all, status, prio, q]);

  const kpis = useMemo(() => ({
    open: all.filter((m) => m.status !== "Resolved").length,
    progress: all.filter((m) => m.status === "In Progress").length,
    resolved: all.filter((m) => m.status === "Resolved").length,
    spend: all.reduce((s, m) => s + (m.actualCost ?? 0), 0),
  }), [all]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Facilities · Admin"
        title="Classroom Maintenance"
        description="Handle teacher-raised maintenance requests — assign, track progress and resolve. Resolved requests with a cost are auto-posted to Expenses under OpEx › Maintenance."
        actions={<ExcelExport rows={rows} fileName="maintenance.xlsx" sheetName="Maintenance"
          columns={[
            { header: "ID", accessor: (r) => r.id },
            { header: "Title", accessor: (r) => r.title },
            { header: "Location", accessor: (r) => r.location },
            { header: "Type", accessor: (r) => r.kind },
            { header: "Priority", accessor: (r) => r.priority },
            { header: "Raised By", accessor: (r) => r.raisedBy },
            { header: "Status", accessor: (r) => r.status },
            { header: "Assigned To", accessor: (r) => r.assignedTo ?? "" },
            { header: "Est. Cost", accessor: (r) => r.estCost ?? "" },
            { header: "Actual Cost", accessor: (r) => r.actualCost ?? "" },
          ]}
        />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Open Requests" value={kpis.open} icon={<ClipboardList className="h-5 w-5" />} tone="info" />
        <KpiCard label="In Progress" value={kpis.progress} icon={<Loader2 className="h-5 w-5" />} tone="warning" />
        <KpiCard label="Resolved" value={kpis.resolved} icon={<CheckCircle2 className="h-5 w-5" />} tone="success" />
        <KpiCard label="OpEx Spend" value={inr(kpis.spend)} icon={<IndianRupee className="h-5 w-5" />} tone="primary" />
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3 flex-row items-end justify-between gap-3 flex-wrap space-y-0">
          <div>
            <CardTitle className="font-display text-base">Maintenance Register</CardTitle>
            <CardDescription>{rows.length} request(s)</CardDescription>
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Search</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, room, teacher…" className="pl-8 h-9 w-52" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Priority</Label>
              <Select value={prio} onValueChange={setPrio}>
                <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priority</SelectItem>
                  {(["Low", "Medium", "High", "Critical"] as MaintPriority[]).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead><TableHead>Issue</TableHead><TableHead>Location</TableHead>
                <TableHead>Priority</TableHead><TableHead>Raised By</TableHead><TableHead>Assigned</TableHead>
                <TableHead className="text-right">Actual Cost</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setActive(m)}>
                  <TableCell className="font-mono text-[11px]">{m.id}</TableCell>
                  <TableCell className="text-sm">{m.title}<div className="text-[11px] text-muted-foreground">{m.kind}</div></TableCell>
                  <TableCell className="text-xs">{m.location}</TableCell>
                  <TableCell><Badge variant="outline" className={"text-[10px] " + prioTone[m.priority]}>{m.priority}</Badge></TableCell>
                  <TableCell className="text-xs">{m.raisedBy}</TableCell>
                  <TableCell className="text-xs">{m.assignedTo ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-right text-sm">{m.actualCost ? inr(m.actualCost) : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell><Badge variant="outline" className={"text-[10px] " + statusTone[m.status]}>{m.status}</Badge></TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-10">No requests match these filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {active && <ManageDialog req={active} onClose={() => setActive(null)} />}
    </PageContainer>
  );
}

function ManageDialog({ req, onClose }: { req: MaintenanceRequest; onClose: () => void }) {
  const [assignee, setAssignee] = useState(req.assignedTo ?? COORDINATORS[0]);
  const [vendor, setVendor] = useState(req.vendor ?? "");
  const [estCost, setEstCost] = useState(String(req.estCost ?? ""));
  const [actualCost, setActualCost] = useState(String(req.actualCost ?? ""));
  const [note, setNote] = useState("");

  const assign = () => {
    maintenanceApi.setStatus(req.id, "Assigned", note || `Assigned to ${assignee}`, "Admin", { assignedTo: assignee, vendor: vendor || undefined, estCost: Number(estCost) || undefined });
    toast.success("Request assigned"); onClose();
  };
  const progress = () => {
    maintenanceApi.setStatus(req.id, "In Progress", note || "Work started", "Admin", { assignedTo: assignee, vendor: vendor || undefined, estCost: Number(estCost) || undefined });
    toast.success("Marked in progress"); onClose();
  };
  const resolve = () => {
    const cost = Number(actualCost) || 0;
    maintenanceApi.resolve(req.id, cost, vendor || "Maintenance Vendor", note);
    toast.success(cost > 0 ? `Resolved · ${inr(cost)} posted to OpEx` : "Marked resolved"); onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2"><Wrench className="h-4 w-4" />{req.title}</DialogTitle>
          <DialogDescription>{req.id} · {req.location} · {req.kind} · raised by {req.raisedBy}</DialogDescription>
        </DialogHeader>

        <p className="text-sm">{req.description}</p>

        <div className="rounded-md border border-border/60 p-3 space-y-2 max-h-40 overflow-auto">
          <div className="text-xs font-semibold text-muted-foreground">Timeline</div>
          {req.timeline.map((t, i) => (
            <div key={i} className="text-xs flex items-start gap-2">
              <Badge variant="outline" className={"text-[10px] " + statusTone[t.status]}>{t.status}</Badge>
              <div><span className="text-muted-foreground">{new Date(t.at).toLocaleString("en-IN")}</span> · {t.by}{t.note ? ` — ${t.note}` : ""}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs text-muted-foreground">Assign to (HR / Coordinator)</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{COORDINATORS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Vendor</Label><Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="CoolFix Services" /></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Est. Cost (₹)</Label><Input type="number" value={estCost} onChange={(e) => setEstCost(e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Actual Cost (₹) — for resolve</Label><Input type="number" value={actualCost} onChange={(e) => setActualCost(e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional update…" /></div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={assign} disabled={req.status === "Resolved"}>Assign</Button>
            <Button variant="outline" onClick={progress} disabled={req.status === "Resolved"}>In Progress</Button>
            <Button className="gradient-primary border-0" onClick={resolve} disabled={req.status === "Resolved"}>Resolve</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
