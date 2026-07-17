import { Fragment, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { payrollApi, type PayrollRun, useEmployees, useSalaryStructures } from "@/lib/store";
import { toast } from "sonner";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type Adj = { bonus: number; deduction: number; loan: number; note: string; extras: { id: string; label: string; amount: number; kind: "earning" | "deduction" }[] };
type StructComponent = { id: string; label: string; kind: "earning" | "deduction"; type: "percent" | "fixed"; value: number };

const DEFAULT_STRUCTURE: StructComponent[] = [
  { id: "hra", label: "House Rent Allowance (HRA)", kind: "earning", type: "percent", value: 40 },
  { id: "conv", label: "Conveyance Allowance", kind: "earning", type: "fixed", value: 1600 },
  { id: "med", label: "Medical Allowance", kind: "earning", type: "fixed", value: 1250 },
  { id: "spec", label: "Special Allowance", kind: "earning", type: "percent", value: 10 },
  { id: "pt", label: "Professional Tax", kind: "deduction", type: "fixed", value: 200 },
];

export function PayrollDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const employees = useEmployees();
  const salaryStructures = useSalaryStructures();
  const now = new Date();
  const [step, setStep] = useState<"setup" | "structure" | "deductions" | "review">("setup");
  const [f, setF] = useState({
    month: months[now.getMonth()],
    year: now.getFullYear(),
    avgSalary: 19000,
    pfPct: 5,
    tdsPct: 6,
    status: "Draft" as PayrollRun["status"],
  });
  const [adj, setAdj] = useState<Record<string, Adj>>({});
  const [structure, setStructure] = useState<StructComponent[]>(DEFAULT_STRUCTURE);
  const [newComp, setNewComp] = useState<StructComponent>({ id: "", label: "", kind: "earning", type: "fixed", value: 0 });

  const emptyAdj = (): Adj => ({ bonus: 0, deduction: 0, loan: 0, note: "", extras: [] });

  const setAdjField = (id: string, k: keyof Adj, v: string) => {
    setAdj((m) => {
      const prev: Adj = m[id] ?? emptyAdj();
      if (k === "note") return { ...m, [id]: { ...prev, note: v } };
      if (k === "extras") return m;
      return { ...m, [id]: { ...prev, [k]: parseInt(v) || 0 } };
    });
  };

  const addExtra = (empId: string, kind: "earning" | "deduction") => {
    setAdj((m) => {
      const prev = m[empId] ?? emptyAdj();
      return { ...m, [empId]: { ...prev, extras: [...prev.extras, { id: crypto.randomUUID(), label: kind === "earning" ? "Ad-hoc Earning" : "Ad-hoc Deduction", amount: 0, kind }] } };
    });
  };
  const updateExtra = (empId: string, id: string, field: "label" | "amount", value: string) => {
    setAdj((m) => {
      const prev = m[empId] ?? emptyAdj();
      return { ...m, [empId]: { ...prev, extras: prev.extras.map((x) => x.id === id ? { ...x, [field]: field === "amount" ? (parseInt(value) || 0) : value } : x) } };
    });
  };
  const removeExtra = (empId: string, id: string) => {
    setAdj((m) => {
      const prev = m[empId] ?? emptyAdj();
      return { ...m, [empId]: { ...prev, extras: prev.extras.filter((x) => x.id !== id) } };
    });
  };

  const computed = useMemo(() => {
    let gross = 0, totalTds = 0, totalPf = 0, totalAdj = 0, totalBonus = 0, totalStruct = 0;
    const rows = employees.map((e) => {
      const base = e.salary || f.avgSalary;
      const a = adj[e.id] ?? emptyAdj();
      // Auto-apply the employee's assigned salary structure; fall back to the default template.
      const assigned = salaryStructures.find((st) => st.employeeIds.includes(e.id));
      const comps = assigned ? assigned.components : structure;
      const structEarn = comps.filter((s) => s.kind === "earning").reduce((sum, s) => sum + (s.type === "percent" ? Math.round(base * (s.value / 100)) : s.value), 0);
      const structDed = comps.filter((s) => s.kind === "deduction").reduce((sum, s) => sum + (s.type === "percent" ? Math.round(base * (s.value / 100)) : s.value), 0);
      const extraEarn = a.extras.filter((x) => x.kind === "earning").reduce((s, x) => s + x.amount, 0);
      const extraDed = a.extras.filter((x) => x.kind === "deduction").reduce((s, x) => s + x.amount, 0);
      const empGross = base + structEarn + a.bonus + extraEarn;
      const tds = Math.round(empGross * (f.tdsPct / 100));
      const pf = Math.round(empGross * (f.pfPct / 100));
      const net = empGross - tds - pf - a.deduction - a.loan - structDed - extraDed;
      gross += empGross; totalTds += tds; totalPf += pf;
      totalAdj += a.deduction + a.loan + extraDed; totalBonus += a.bonus + extraEarn; totalStruct += structEarn;
      return { e, base, a, structEarn, structDed, empGross, tds, pf, net, structureName: assigned?.name ?? "Default template" };
    });
    const net = rows.reduce((s, r) => s + r.net, 0);
    return { rows, gross, tds: totalTds, pf: totalPf, totalAdj, totalBonus, totalStruct, net };
  }, [employees, f, adj, structure, salaryStructures]);

  const reset = () => { setStep("setup"); setAdj({}); };

  const run = () => {
    payrollApi.add({
      month: `${f.month} ${f.year}`,
      employeeCount: employees.length,
      gross: computed.gross, net: computed.net, tds: computed.tds,
      status: f.status,
    });
    toast.success(`Payroll for ${f.month} ${f.year} processed`);
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display">Process Payroll</DialogTitle>
          <DialogDescription>Manual control — set statutory rates, apply per-employee bonuses & deductions, review before publishing.</DialogDescription>
        </DialogHeader>

        <Tabs value={step} onValueChange={(v) => setStep(v as typeof step)} className="flex-1 overflow-hidden flex flex-col">
          <TabsList>
            <TabsTrigger value="setup">1. Setup</TabsTrigger>
            <TabsTrigger value="structure">2. Salary Structure</TabsTrigger>
            <TabsTrigger value="deductions">3. Manual Adjustments</TabsTrigger>
            <TabsTrigger value="review">4. Review & Run</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="mt-4 overflow-auto">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Pay Month">
                <Select value={f.month} onValueChange={(v) => setF({ ...f, month: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Year"><Input type="number" value={f.year} onChange={(e) => setF({ ...f, year: parseInt(e.target.value) || f.year })} /></Field>
              <Field label="Default gross (if not set on employee)"><Input type="number" value={f.avgSalary} onChange={(e) => setF({ ...f, avgSalary: parseInt(e.target.value) || 0 })} /></Field>
              <Field label="TDS %"><Input type="number" value={f.tdsPct} onChange={(e) => setF({ ...f, tdsPct: parseInt(e.target.value) || 0 })} /></Field>
              <Field label="PF %"><Input type="number" value={f.pfPct} onChange={(e) => setF({ ...f, pfPct: parseInt(e.target.value) || 0 })} /></Field>
              <Field label="Status">
                <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as PayrollRun["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(["Draft", "Approved", "Paid"] as const).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <div className="rounded-lg bg-muted/40 p-4 mt-4 text-sm">
              <div className="font-medium mb-1">{employees.length} active employees will be included.</div>
              <p className="text-muted-foreground text-xs">Configure the salary structure next — this template is applied to all employees and shows the derived earnings/deductions in the run.</p>
            </div>
          </TabsContent>

          <TabsContent value="structure" className="mt-4 overflow-auto space-y-4">
            <div className="rounded-lg border p-3 bg-muted/30">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" />This is the fallback template. Employees with a structure assigned in the <strong>Salary Structure</strong> tab automatically use theirs; everyone else uses this template. Percent components are calculated off Basic.</div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Calculation</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {structure.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Input className="h-7 text-xs" value={s.label} onChange={(e) => setStructure((p) => p.map((x) => x.id === s.id ? { ...x, label: e.target.value } : x))} />
                    </TableCell>
                    <TableCell>
                      <Select value={s.kind} onValueChange={(v) => setStructure((p) => p.map((x) => x.id === s.id ? { ...x, kind: v as "earning" | "deduction" } : x))}>
                        <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="earning">Earning</SelectItem><SelectItem value="deduction">Deduction</SelectItem></SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={s.type} onValueChange={(v) => setStructure((p) => p.map((x) => x.id === s.id ? { ...x, type: v as "percent" | "fixed" } : x))}>
                        <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="percent">% of Basic</SelectItem><SelectItem value="fixed">Fixed ₹</SelectItem></SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input type="number" className="h-7 w-24 text-xs ml-auto" value={s.value} onChange={(e) => setStructure((p) => p.map((x) => x.id === s.id ? { ...x, value: parseInt(e.target.value) || 0 } : x))} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStructure((p) => p.filter((x) => x.id !== s.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border rounded-md p-3 grid grid-cols-5 gap-2 items-end">
              <div className="col-span-2"><Label className="text-xs text-muted-foreground">New component label</Label><Input className="h-8" value={newComp.label} onChange={(e) => setNewComp({ ...newComp, label: e.target.value })} placeholder="e.g. Transport Allowance" /></div>
              <Select value={newComp.kind} onValueChange={(v) => setNewComp({ ...newComp, kind: v as "earning" | "deduction" })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="earning">Earning</SelectItem><SelectItem value="deduction">Deduction</SelectItem></SelectContent>
              </Select>
              <Select value={newComp.type} onValueChange={(v) => setNewComp({ ...newComp, type: v as "percent" | "fixed" })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="fixed">Fixed ₹</SelectItem><SelectItem value="percent">% of Basic</SelectItem></SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input type="number" className="h-8" value={newComp.value} onChange={(e) => setNewComp({ ...newComp, value: parseInt(e.target.value) || 0 })} />
                <Button size="sm" onClick={() => {
                  if (!newComp.label.trim()) return toast.error("Label required");
                  setStructure((p) => [...p, { ...newComp, id: crypto.randomUUID() }]);
                  setNewComp({ id: "", label: "", kind: "earning", type: "fixed", value: 0 });
                }}><Plus className="h-4 w-4" />Add</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="deductions" className="mt-4 overflow-auto space-y-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Base ₹</TableHead>
                  <TableHead className="text-right">Struct Earn</TableHead>
                  <TableHead className="text-right">Bonus ₹</TableHead>
                  <TableHead className="text-right">Deduction ₹</TableHead>
                  <TableHead className="text-right">Loan ₹</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {computed.rows.map((r) => (
                  <Fragment key={r.e.id}>
                    <TableRow>
                      <TableCell>
                        <div className="text-sm font-medium">{r.e.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{r.e.id} · {r.e.role}</div>
                        <div className="text-[10px] text-primary">{r.structureName}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{r.base.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-success">+{r.structEarn.toLocaleString("en-IN")}</TableCell>
                      <TableCell><Input type="number" className="h-7 w-20 text-xs ml-auto" defaultValue={r.a.bonus} onChange={(e) => setAdjField(r.e.id, "bonus", e.target.value)} /></TableCell>
                      <TableCell><Input type="number" className="h-7 w-20 text-xs ml-auto" defaultValue={r.a.deduction} onChange={(e) => setAdjField(r.e.id, "deduction", e.target.value)} /></TableCell>
                      <TableCell><Input type="number" className="h-7 w-20 text-xs ml-auto" defaultValue={r.a.loan} onChange={(e) => setAdjField(r.e.id, "loan", e.target.value)} /></TableCell>
                      <TableCell><Input className="h-7 text-xs" placeholder="e.g. Diwali bonus" defaultValue={r.a.note} onChange={(e) => setAdjField(r.e.id, "note", e.target.value)} /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/20">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] uppercase text-muted-foreground">Custom Fields</span>
                          {r.a.extras.map((x) => (
                            <div key={x.id} className="flex items-center gap-1 border rounded-md pl-2 pr-1 py-0.5 bg-background">
                              <Badge variant={x.kind === "earning" ? "default" : "destructive"} className="text-[9px] h-4">{x.kind === "earning" ? "+" : "−"}</Badge>
                              <Input className="h-6 w-32 text-xs border-0 shadow-none px-1" value={x.label} onChange={(e) => updateExtra(r.e.id, x.id, "label", e.target.value)} />
                              <Input type="number" className="h-6 w-20 text-xs" value={x.amount} onChange={(e) => updateExtra(r.e.id, x.id, "amount", e.target.value)} />
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeExtra(r.e.id, x.id)}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          ))}
                          <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={() => addExtra(r.e.id, "earning")}><Plus className="h-3 w-3" />Earning</Button>
                          <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={() => addExtra(r.e.id, "deduction")}><Plus className="h-3 w-3" />Deduction</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="review" className="mt-4 overflow-auto">
            <div className="rounded-lg bg-muted/40 p-4 space-y-1.5 text-sm">
              <Row k="Employees" v={employees.length.toString()} />
              <Row k="Structure Earnings" v={`+ ₹${computed.totalStruct.toLocaleString("en-IN")}`} muted />
              <Row k="Gross + Bonuses + Structure" v={`₹${computed.gross.toLocaleString("en-IN")}`} />
              <Row k={`TDS (${f.tdsPct}%)`} v={`− ₹${computed.tds.toLocaleString("en-IN")}`} muted />
              <Row k={`PF (${f.pfPct}%)`} v={`− ₹${computed.pf.toLocaleString("en-IN")}`} muted />
              <Row k="Manual deductions + loans + extras" v={`− ₹${computed.totalAdj.toLocaleString("en-IN")}`} muted />
              <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                <span>Net disbursement</span><span>₹{computed.net.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Status will be set to <strong>{f.status}</strong>. Structure ({structure.length} components) + per-employee custom fields are applied to every employee including teachers.
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {step !== "setup" && <Button variant="ghost" onClick={() => setStep(step === "review" ? "deductions" : step === "deductions" ? "structure" : "setup")}>Back</Button>}
          {step !== "review" ? (
            <Button onClick={() => setStep(step === "setup" ? "structure" : step === "structure" ? "deductions" : "review")} className="gradient-primary border-0">Continue</Button>
          ) : (
            <Button onClick={run} className="gradient-primary border-0">Process Payroll</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return <div className={`flex justify-between ${muted ? "text-muted-foreground" : ""}`}><span>{k}</span><span className="font-mono">{v}</span></div>;
}
