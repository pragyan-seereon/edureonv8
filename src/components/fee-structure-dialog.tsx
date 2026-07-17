import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { feeStructureApi, type FeeStructure, type FeeComponent } from "@/lib/store";
import { toast } from "sonner";

const CLASSES = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
const COURSES = ["CBSE", "ICSE", "State Board", "IB", "Cambridge"];
const FREQ: FeeComponent["frequency"][] = ["Monthly","Quarterly","Annual","One-time"];

const presetLabels = ["Base Fee","Tuition Fee","Hostel Fee","Transport Fee","Fooding Fee","Picnic Fee","Lab Fee","Library Fee","Exam Fee","Annual Charges"];

let _cid = 0;
const newComp = (label = "", freq: FeeComponent["frequency"] = "Monthly"): FeeComponent => ({
  id: "c" + ++_cid + "_" + Date.now(),
  label, amount: 0, frequency: freq,
});

export function FeeStructureDialog({ open, onOpenChange, structure }: {
  open: boolean; onOpenChange: (v: boolean) => void; structure?: FeeStructure | null;
}) {
  const [f, setF] = useState<Omit<FeeStructure, "id" | "createdAt">>({
    name: "", class: "VI", course: "CBSE", components: [newComp("Base Fee")],
    dueDay: 10, lateFeePerMonth: 500, graceDays: 0,
  });

  useEffect(() => {
    if (structure) {
      const { id: _id, createdAt: _c, ...rest } = structure;
      setF(rest);
    } else if (open) {
      setF({
        name: "", class: "VI", course: "CBSE",
        components: [newComp("Base Fee"), newComp("Tuition Fee")],
        dueDay: 10, lateFeePerMonth: 500, graceDays: 0,
      });
    }
  }, [structure, open]);

  const addComp = (label = "") =>
    setF((p) => ({ ...p, components: [...p.components, newComp(label)] }));
  const updComp = (id: string, patch: Partial<FeeComponent>) =>
    setF((p) => ({ ...p, components: p.components.map((c) => c.id === id ? { ...c, ...patch } : c) }));
  const rmComp = (id: string) =>
    setF((p) => ({ ...p, components: p.components.filter((c) => c.id !== id) }));

  const save = () => {
    if (!f.name.trim()) return toast.error("Structure name required");
    if (!f.components.length) return toast.error("Add at least one fee component");
    if (structure) { feeStructureApi.update(structure.id, f); toast.success("Structure updated"); }
    else { feeStructureApi.add(f); toast.success("Fee structure created"); }
    onOpenChange(false);
  };

  const monthly = f.components.filter(c => c.frequency === "Monthly").reduce((a,c) => a+c.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{structure ? "Edit Fee Structure" : "Create Fee Structure"}</DialogTitle>
          <DialogDescription>Define fee components, due date and late fee rules. Assigned by class.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
          <Field label="Structure name" className="sm:col-span-3">
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Class 6 — Standard 2025-26" />
          </Field>
          <Field label="Class">
            <Select value={f.class} onValueChange={(v) => setF({ ...f, class: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Course / Board">
            <Select value={f.course} onValueChange={(v) => setF({ ...f, course: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{COURSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Due day of month">
            <Input type="number" min={1} max={28} value={f.dueDay} onChange={(e) => setF({ ...f, dueDay: parseInt(e.target.value) || 1 })} />
          </Field>
        </div>

        <div className="rounded-lg border border-border/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Fee Components</Label>
            <div className="flex gap-2">
              <Select onValueChange={(v) => addComp(v)}>
                <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Quick add..." /></SelectTrigger>
                <SelectContent>{presetLabels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => addComp("")}><Plus className="h-4 w-4" />Custom</Button>
            </div>
          </div>
          <div className="space-y-2">
            {f.components.map((c) => (
              <div key={c.id} className="grid grid-cols-12 gap-2 items-center">
                <Input className="col-span-5" placeholder="Label (e.g. Base Fee)" value={c.label} onChange={(e) => updComp(c.id, { label: e.target.value })} />
                <Input className="col-span-3" type="number" min={0} placeholder="Amount" value={c.amount} onChange={(e) => updComp(c.id, { amount: parseInt(e.target.value) || 0 })} />
                <Select value={c.frequency} onValueChange={(v) => updComp(c.id, { frequency: v as FeeComponent["frequency"] })}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>{FREQ.map(fq => <SelectItem key={fq} value={fq}>{fq}</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="col-span-1 h-9 w-9 text-destructive" onClick={() => rmComp(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground pt-1">Monthly total: ₹{monthly.toLocaleString("en-IN")}</div>
        </div>

        <div className="rounded-lg border border-border/60 p-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3 text-sm font-semibold">Late Fee Configuration</div>
          <Field label="Late fee per month (₹)">
            <Input type="number" min={0} value={f.lateFeePerMonth} onChange={(e) => setF({ ...f, lateFeePerMonth: parseInt(e.target.value) || 0 })} />
          </Field>
          <Field label="Grace days after due">
            <Input type="number" min={0} value={f.graceDays} onChange={(e) => setF({ ...f, graceDays: parseInt(e.target.value) || 0 })} />
          </Field>
          <div className="text-xs text-muted-foreground self-end">
            Applied automatically when due date + grace days passes and the month is unpaid.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} className="gradient-primary border-0">{structure ? "Save changes" : "Create structure"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={"space-y-1.5 " + (className ?? "")}><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
