import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Users, Layers, Pencil, UserPlus } from "lucide-react";
import {
  useSalaryStructures, salaryStructureApi, useEmployees,
  type SalaryStructure, type SalaryStructureComponent,
} from "@/lib/store";
import { toast } from "sonner";

const blankComp = (): SalaryStructureComponent => ({
  id: crypto.randomUUID(), label: "", kind: "earning", type: "fixed", value: 0,
});

export function SalaryStructureManager() {
  const structures = useSalaryStructures();
  const employees = useEmployees();
  const [editing, setEditing] = useState<SalaryStructure | null>(null);
  const [creating, setCreating] = useState(false);
  const [assignFor, setAssignFor] = useState<SalaryStructure | null>(null);

  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? id;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Define reusable salary structures and assign employees. Assigned structures are applied automatically when you Run Payroll — you can still customise per employee in the run.
        </div>
        <Button size="sm" className="gradient-primary border-0" onClick={() => { setEditing(null); setCreating(true); }}>
          <Plus className="h-4 w-4" />New Structure
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {structures.map((s) => {
          const earnings = s.components.filter((c) => c.kind === "earning").length;
          const deductions = s.components.filter((c) => c.kind === "deduction").length;
          return (
            <Card key={s.id} className="border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />{s.name}
                    </CardTitle>
                    <CardDescription>{s.description || "—"}</CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">{s.id}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">Basic {s.basicPct}% of CTC</Badge>
                  <Badge variant="secondary" className="bg-success/10 text-success">{earnings} earnings</Badge>
                  <Badge variant="secondary" className="bg-destructive/10 text-destructive">{deductions} deductions</Badge>
                  <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" />{s.employeeIds.length} assigned</Badge>
                </div>
                {s.employeeIds.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.employeeIds.slice(0, 6).map((id) => (
                      <Badge key={id} variant="outline" className="text-[10px] gap-1">
                        {empName(id)}
                        <button onClick={() => salaryStructureApi.unassign(s.id, id)} className="hover:text-destructive">×</button>
                      </Badge>
                    ))}
                    {s.employeeIds.length > 6 && <Badge variant="outline" className="text-[10px]">+{s.employeeIds.length - 6} more</Badge>}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setAssignFor(s)}>
                    <UserPlus className="h-3.5 w-3.5" />Assign Employees
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setCreating(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { salaryStructureApi.remove(s.id); toast.success("Structure removed"); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {creating && (
        <StructureEditor
          structure={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}
      {assignFor && (
        <AssignDialog structure={assignFor} onClose={() => setAssignFor(null)} />
      )}
    </div>
  );
}

function StructureEditor({ structure, onClose }: { structure: SalaryStructure | null; onClose: () => void }) {
  const [name, setName] = useState(structure?.name ?? "");
  const [description, setDescription] = useState(structure?.description ?? "");
  const [basicPct, setBasicPct] = useState(structure?.basicPct ?? 50);
  const [components, setComponents] = useState<SalaryStructureComponent[]>(
    structure?.components ?? [blankComp()],
  );

  const upd = (id: string, patch: Partial<SalaryStructureComponent>) =>
    setComponents((p) => p.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const save = () => {
    if (!name.trim()) return toast.error("Structure name required");
    const clean = components.filter((c) => c.label.trim());
    const payload = { name: name.trim(), description: description.trim(), basicPct, components: clean };
    if (structure) {
      salaryStructureApi.update(structure.id, payload);
      toast.success("Structure updated");
    } else {
      salaryStructureApi.add({ ...payload, employeeIds: [] });
      toast.success("Structure created");
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{structure ? "Edit Structure" : "New Salary Structure"}</DialogTitle>
          <DialogDescription>Percent components are calculated off Basic. Basic is a % of employee CTC / gross.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 col-span-2"><Label className="text-xs">Structure Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Teaching Staff — Senior" /></div>
          <div className="space-y-1 col-span-2"><Label className="text-xs">Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Basic (% of CTC)</Label><Input type="number" value={basicPct} onChange={(e) => setBasicPct(parseInt(e.target.value) || 0)} /></div>
        </div>

        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase text-muted-foreground">Components</Label>
            <Button size="sm" variant="outline" onClick={() => setComponents((p) => [...p, blankComp()])}><Plus className="h-3.5 w-3.5" />Add Component</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Label</TableHead><TableHead>Kind</TableHead><TableHead>Calc</TableHead><TableHead className="text-right">Value</TableHead><TableHead className="w-8"></TableHead></TableRow></TableHeader>
            <TableBody>
              {components.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><Input className="h-7 text-xs" value={c.label} onChange={(e) => upd(c.id, { label: e.target.value })} placeholder="Component" /></TableCell>
                  <TableCell>
                    <Select value={c.kind} onValueChange={(v) => upd(c.id, { kind: v as "earning" | "deduction" })}>
                      <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="earning">Earning</SelectItem><SelectItem value="deduction">Deduction</SelectItem></SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={c.type} onValueChange={(v) => upd(c.id, { type: v as "percent" | "fixed" })}>
                      <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="percent">% of Basic</SelectItem><SelectItem value="fixed">Fixed ₹</SelectItem></SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right"><Input type="number" className="h-7 w-24 text-xs ml-auto" value={c.value} onChange={(e) => upd(c.id, { value: parseInt(e.target.value) || 0 })} /></TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setComponents((p) => p.filter((x) => x.id !== c.id))}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="gradient-primary border-0" onClick={save}>{structure ? "Save Structure" : "Create Structure"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({ structure, onClose }: { structure: SalaryStructure; onClose: () => void }) {
  const employees = useEmployees();
  const structures = useSalaryStructures();
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [picked, setPicked] = useState<Set<string>>(new Set(structure.employeeIds));

  const departments = useMemo(() => Array.from(new Set(employees.map((e) => e.department))).sort(), [employees]);
  const otherAssign = (id: string) => structures.find((s) => s.id !== structure.id && s.employeeIds.includes(id));

  const filtered = employees.filter((e) => {
    if (dept !== "all" && e.department !== dept) return false;
    if (search && !(e.name + e.id + e.role).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggle = (id: string) => setPicked((p) => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const save = () => {
    salaryStructureApi.assign(structure.id, Array.from(picked));
    toast.success(`${picked.size} employee(s) assigned to ${structure.name}`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display">Assign Employees — {structure.name}</DialogTitle>
          <DialogDescription>Selected employees will use this structure automatically in payroll. Assigning here removes them from any other structure.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input placeholder="Search employees…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{picked.size} selected</span>
          <div className="flex gap-2">
            <button className="underline" onClick={() => setPicked(new Set(filtered.map((e) => e.id)))}>Select all shown</button>
            <button className="underline" onClick={() => setPicked(new Set())}>Clear</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto border rounded-md divide-y">
          {filtered.map((e) => {
            const other = otherAssign(e.id);
            return (
              <label key={e.id} className="flex items-center gap-3 p-2.5 hover:bg-muted/40 cursor-pointer">
                <Checkbox checked={picked.has(e.id)} onCheckedChange={() => toggle(e.id)} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{e.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{e.id} · {e.role} · {e.department}</div>
                </div>
                {other && <Badge variant="outline" className="text-[10px] text-warning border-warning/30">in {other.name}</Badge>}
              </label>
            );
          })}
          {filtered.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No employees match.</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="gradient-primary border-0" onClick={save}>Save Assignments</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
