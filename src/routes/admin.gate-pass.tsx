import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DoorOpen, Plus, Printer, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import { KpiCard } from "@/components/kpi-card";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/gate-pass")({
  head: () => ({ meta: [{ title: "Gate Pass — Edureon" }] }),
  component: GatePassPage,
});

type Pass = {
  id: string; passType: "Student" | "Staff" | "Visitor";
  name: string; deptClass: string; contact: string;
  outTime: string; inTime: string; purpose: string;
  vehicleNo: string; authority: string; accompaniedBy: string;
  status: "Out" | "Returned";
};

const seed: Pass[] = [
  { id: "GP-1042", passType: "Student", name: "Aarav Sharma", deptClass: "X-A · Roll 14", contact: "+91 98765 43210", outTime: "11:30", inTime: "13:00", purpose: "Dental appointment", vehicleNo: "—", authority: "Principal", accompaniedBy: "Parent — Mr. Sharma", status: "Returned" },
  { id: "GP-1041", passType: "Staff", name: "Meera Iyer", deptClass: "Science Dept.", contact: "+91 99887 66554", outTime: "14:15", inTime: "—", purpose: "Board meeting at DEO office", vehicleNo: "DL 3C AB 1234", authority: "Vice Principal", accompaniedBy: "—", status: "Out" },
  { id: "GP-1040", passType: "Visitor", name: "Rajesh Kumar", deptClass: "Vendor — CoolFix", contact: "+91 90011 22334", outTime: "16:00", inTime: "16:45", purpose: "AC maintenance pickup", vehicleNo: "DL 1A XY 9090", authority: "Admin Officer", accompaniedBy: "Security — Gate 2", status: "Returned" },
];

function GatePassPage() {
  const [items, setItems] = useState<Pass[]>(seed);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Pass | null>(null);
  const blank = { passType: "Student" as Pass["passType"], name: "", deptClass: "", contact: "", outTime: "", inTime: "", purpose: "", vehicleNo: "", authority: "", accompaniedBy: "" };
  const [f, setF] = useState(blank);

  const submit = () => {
    if (!f.name || !f.outTime) return toast.error("Name and Out Time are required");
    const id = "GP-" + (1043 + items.length);
    const pass: Pass = { ...f, id, vehicleNo: f.vehicleNo || "—", inTime: f.inTime || "—", accompaniedBy: f.accompaniedBy || "—", status: f.inTime ? "Returned" : "Out" };
    setItems((p) => [pass, ...p]);
    toast.success("Gate pass generated · " + id);
    setOpen(false); setF(blank); setPreview(pass);
  };

  const out = items.filter((i) => i.status === "Out").length;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Admin · Documents"
        title="Gate Pass Generation"
        description="Issue and track gate passes for students, staff and visitors. Capture timing, purpose, vehicle and approving authority, then print."
        actions={
          <Button size="sm" className="gradient-primary border-0" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New Gate Pass</Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Passes Today" value={items.length} icon={<DoorOpen className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Currently Out" value={out} icon={<DoorOpen className="h-5 w-5" />} tone="warning" />
        <KpiCard label="Returned" value={items.length - out} icon={<ShieldCheck className="h-5 w-5" />} tone="success" />
        <KpiCard label="With Vehicle" value={items.filter((i) => i.vehicleNo !== "—").length} icon={<DoorOpen className="h-5 w-5" />} tone="info" />
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Gate Pass Register</CardTitle>
          <CardDescription>{items.length} passes</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pass No.</TableHead><TableHead>Type</TableHead><TableHead>Name</TableHead>
                <TableHead>Class / Dept.</TableHead><TableHead>Out</TableHead><TableHead>In</TableHead>
                <TableHead>Purpose</TableHead><TableHead>Vehicle</TableHead><TableHead>Authority</TableHead>
                <TableHead>Status</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{p.passType}</Badge></TableCell>
                  <TableCell className="text-sm font-medium">{p.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.deptClass}</TableCell>
                  <TableCell className="text-xs">{p.outTime}</TableCell>
                  <TableCell className="text-xs">{p.inTime}</TableCell>
                  <TableCell className="text-xs max-w-[180px] truncate">{p.purpose}</TableCell>
                  <TableCell className="text-xs">{p.vehicleNo}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.authority}</TableCell>
                  <TableCell><Badge variant="outline" className={p.status === "Out" ? "bg-warning/15 text-warning border-warning/20" : "bg-success/10 text-success border-success/20"}>{p.status}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreview(p)}><Printer className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New Gate Pass</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Pass Type *">
              <Select value={f.passType} onValueChange={(v) => setF({ ...f, passType: v as Pass["passType"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Student", "Staff", "Visitor"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Name *"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Class / Section / Department"><Input value={f.deptClass} onChange={(e) => setF({ ...f, deptClass: e.target.value })} placeholder="X-A · Roll 14 / Science Dept." /></Field>
            <Field label="Contact No."><Input value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} placeholder="+91 …" /></Field>
            <Field label="Out Time *"><Input type="time" value={f.outTime} onChange={(e) => setF({ ...f, outTime: e.target.value })} /></Field>
            <Field label="In Time"><Input type="time" value={f.inTime} onChange={(e) => setF({ ...f, inTime: e.target.value })} /></Field>
            <Field label="Vehicle No."><Input value={f.vehicleNo} onChange={(e) => setF({ ...f, vehicleNo: e.target.value })} placeholder="DL 3C AB 1234" /></Field>
            <Field label="Permission Authority"><Input value={f.authority} onChange={(e) => setF({ ...f, authority: e.target.value })} placeholder="Principal" /></Field>
            <Field label="Accompanied By"><Input value={f.accompaniedBy} onChange={(e) => setF({ ...f, accompaniedBy: e.target.value })} placeholder="Parent / Guardian / Staff" /></Field>
            <div className="md:col-span-2">
              <Field label="Purpose"><Textarea rows={2} value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} /></Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} className="gradient-primary border-0">Generate Pass</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PreviewDialog pass={preview} onClose={() => setPreview(null)} />
    </PageContainer>
  );
}

function PreviewDialog({ pass, onClose }: { pass: Pass | null; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const print = () => {
    const node = ref.current;
    if (!node) return;
    const win = window.open("", "_blank", "width=640,height=480");
    if (!win) return toast.error("Allow pop-ups to print");
    win.document.write(`<html><head><title>Gate Pass</title></head><body style="margin:0;padding:24px;font-family:sans-serif;">${node.outerHTML}</body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
  };
  return (
    <Dialog open={!!pass} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Gate Pass · {pass?.id}</DialogTitle></DialogHeader>
        {pass && (
          <div ref={ref} className="rounded-xl border border-border/60 overflow-hidden">
            <div className="gradient-primary px-4 py-3 text-primary-foreground flex items-center justify-between">
              <div>
                <div className="font-display font-semibold">Edureon School</div>
                <div className="text-[10px] uppercase tracking-wider opacity-80">Gate Pass · {pass.passType}</div>
              </div>
              <div className="text-right text-xs font-mono">{pass.id}</div>
            </div>
            <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <Row label="Name" value={pass.name} />
              <Row label="Class / Dept." value={pass.deptClass || "—"} />
              <Row label="Contact" value={pass.contact || "—"} />
              <Row label="Vehicle No." value={pass.vehicleNo} />
              <Row label="Out Time" value={pass.outTime} />
              <Row label="In Time" value={pass.inTime} />
              <Row label="Permission Authority" value={pass.authority || "—"} />
              <Row label="Accompanied By" value={pass.accompaniedBy} />
              <div className="col-span-2"><Row label="Purpose" value={pass.purpose || "—"} /></div>
            </div>
            <div className="flex justify-between px-4 py-3 border-t border-border/60 text-[10px] text-muted-foreground">
              <span>Holder Signature</span><span>Authority Signature</span><span>Security Gate</span>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={print} className="gradient-primary border-0"><Printer className="h-4 w-4" />Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
