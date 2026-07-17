import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Boxes, Wrench, ShieldCheck, Users, Pencil, Trash2, Building2, User, DoorOpen, MapPin } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { useState } from "react";
import { CrudDialog } from "@/components/crud-dialog";
import { useEmployees } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/assets")({
  head: () => ({ meta: [{ title: "Assets — Edureon" }] }),
  component: AssetsPage,
});

type MaintEntry = { id: string; type: "Scheduled" | "Repair" | "Inspection"; date: string; vendor: string; cost: number; status: "Scheduled" | "In Progress" | "Completed"; notes: string };
type Asset = {
  id: string; name: string; category: string; serial: string; value: number;
  purchaseDate: string; warranty: string;
  vendor: string;
  // Multi-link: an asset can simultaneously be assigned to a person, sitting in a room,
  // belonging to a department. Any of these may be empty.
  assignedPerson?: string;
  assignedRoom?: string;
  assignedDepartment?: string;
  status: "In Use" | "Maintenance" | "Retired";
  maintenance: MaintEntry[];
};
type Vendor = { name: string; category: string; contact: string; email: string };

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const newId = () => "AST-" + Math.floor(Math.random() * 9000 + 1000);

const SEED_VENDORS: Vendor[] = [
  { name: "Dell India", category: "IT Hardware", contact: "+91 80100 22000", email: "sales@dell.in" },
  { name: "CoolFix Services", category: "HVAC", contact: "+91 98101 88800", email: "support@coolfix.in" },
  { name: "Epson Care", category: "AV", contact: "+91 98101 99001", email: "care@epson.in" },
  { name: "Tata Motors", category: "Vehicles", contact: "+91 22 6665 5555", email: "fleet@tata.in" },
];

const DEPARTMENTS = ["Facilities", "Academic", "Admin", "Sports", "IT", "Library", "Accounts", "Transport"];

const SEED_ASSETS: Asset[] = [
  { id: "AST-0142", name: "Dell OptiPlex 7090", category: "Computer", serial: "DLP7090-A12", value: 78000, purchaseDate: "2024-03-12", warranty: "2027-03-31", vendor: "Dell India",
    assignedPerson: "Rohan Mehta (EMP-1042)", assignedRoom: "Computer Lab", assignedDepartment: "IT", status: "In Use",
    maintenance: [{ id: "M1", type: "Scheduled", date: "2026-03-12", vendor: "Dell India", cost: 0, status: "Scheduled", notes: "Annual service" }] },
  { id: "AST-0141", name: "Epson Projector EB-S05", category: "AV Equipment", serial: "EBS05-2247", value: 42000, purchaseDate: "2023-06-12", warranty: "2026-06-12", vendor: "Epson Care",
    assignedRoom: "Room G-02", assignedDepartment: "Academic", status: "In Use",
    maintenance: [{ id: "M2", type: "Repair", date: "2025-11-08", vendor: "Epson Care", cost: 12000, status: "Completed", notes: "Lamp replaced" }] },
  { id: "AST-0140", name: "Centralised AC — Block A", category: "HVAC", serial: "AC-BLKA-01", value: 285000, purchaseDate: "2022-06-12", warranty: "2028-12-31", vendor: "CoolFix Services",
    assignedRoom: "Block A", assignedDepartment: "Facilities", status: "Maintenance",
    maintenance: [{ id: "M3", type: "Repair", date: "2025-11-20", vendor: "CoolFix Services", cost: 18000, status: "In Progress", notes: "Compressor noise" }] },
];

const CATEGORIES = ["Computer", "AV Equipment", "HVAC", "Furniture", "Vehicle", "Lab Equipment", "Sports", "Other"];
const ROOMS = ["Room G-01","Room G-02","Room F-11","Room F-12","Room F-13","Computer Lab","Chemistry Lab","Biology Lab","Auditorium","Library","Staff Room","Block A","Block B"];

function AssignmentBadges({ a }: { a: Asset }) {
  const any = a.assignedPerson || a.assignedRoom || a.assignedDepartment;
  if (!any) return <span className="text-xs text-muted-foreground">Unassigned</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {a.assignedPerson && <Badge variant="outline" className="text-[10px] gap-1"><User className="h-2.5 w-2.5" />{a.assignedPerson}</Badge>}
      {a.assignedRoom && <Badge variant="outline" className="text-[10px] gap-1"><DoorOpen className="h-2.5 w-2.5" />{a.assignedRoom}</Badge>}
      {a.assignedDepartment && <Badge variant="outline" className="text-[10px] gap-1"><Building2 className="h-2.5 w-2.5" />{a.assignedDepartment}</Badge>}
    </div>
  );
}

function AssetsPage() {
  const employees = useEmployees();
  const [assets, setAssets] = useState<Asset[]>(SEED_ASSETS);
  const [vendors, setVendors] = useState<Vendor[]>(SEED_VENDORS);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [creating, setCreating] = useState(false);
  const [addVendor, setAddVendor] = useState(false);

  const upsert = (a: Asset) => setAssets((p) => p.some((x) => x.id === a.id) ? p.map((x) => x.id === a.id ? a : x) : [a, ...p]);
  const remove = (id: string) => { setAssets((p) => p.filter((x) => x.id !== id)); toast.success("Asset removed"); };

  const allMaint = assets.flatMap((a) => a.maintenance.map((m) => ({ ...m, assetId: a.id, assetName: a.name })));
  const assignedCount = assets.filter((a) => a.assignedPerson || a.assignedRoom || a.assignedDepartment).length;
  const personOptions = employees.map((e) => `${e.name} (${e.id})`);

  return (
    <PageContainer>
      <PageHeader eyebrow="Admin · Operations" title="Assets Management"
        description="Full asset lifecycle — purchase, vendor link, person + room + department assignment, and recurring maintenance schedules."
        actions={<Button size="sm" className="gradient-primary border-0" onClick={() => { setEditing(null); setCreating(true); }}><Plus className="h-4 w-4" />Add Asset</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KpiCard label="Total Assets" value={assets.length} icon={<Boxes className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Assigned" value={assignedCount} icon={<Users className="h-5 w-5" />} tone="info" />
        <KpiCard label="In Maintenance" value={allMaint.filter((m) => m.status === "In Progress").length} icon={<Wrench className="h-5 w-5" />} tone="warning" />
        <KpiCard label="Asset Value" value={inr(assets.reduce((s, a) => s + a.value, 0))} icon={<ShieldCheck className="h-5 w-5" />} tone="success" />
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="details">Asset Register</TabsTrigger>
          <TabsTrigger value="maint">Maintenance</TabsTrigger>
          <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Asset Register</CardTitle>
              <CardDescription>Each asset can be linked to a person, a room, and a department simultaneously.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Serial</TableHead>
                      <TableHead>Category</TableHead><TableHead>Vendor</TableHead>
                      <TableHead>Assignment (Person · Room · Dept)</TableHead>
                      <TableHead className="text-right">Value</TableHead><TableHead>Warranty</TableHead>
                      <TableHead>Status</TableHead><TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((a) => (
                      <TableRow key={a.id} className="cursor-pointer" onClick={() => { setEditing(a); setCreating(false); }}>
                        <TableCell className="font-mono text-xs">{a.id}</TableCell>
                        <TableCell className="text-sm font-medium">{a.name}</TableCell>
                        <TableCell className="font-mono text-[10px] text-muted-foreground">{a.serial}</TableCell>
                        <TableCell className="text-xs">{a.category}</TableCell>
                        <TableCell className="text-xs">{a.vendor}</TableCell>
                        <TableCell className="text-xs"><AssignmentBadges a={a} /></TableCell>
                        <TableCell className="text-right text-sm">{inr(a.value)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{a.warranty}</TableCell>
                        <TableCell><Badge variant="outline" className={a.status === "In Use" ? "bg-success/10 text-success border-success/20" : a.status === "Maintenance" ? "bg-warning/10 text-warning border-warning/20" : "bg-muted text-muted-foreground"}>{a.status}</Badge></TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => { setEditing(a); setCreating(false); }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border/60">
                {assets.map((a) => (
                  <button key={a.id} className="w-full text-left p-4 active:bg-muted/40" onClick={() => { setEditing(a); setCreating(false); }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{a.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{a.id} · {a.serial}</div>
                      </div>
                      <Badge variant="outline" className={`shrink-0 text-[10px] ${a.status === "In Use" ? "bg-success/10 text-success border-success/20" : a.status === "Maintenance" ? "bg-warning/10 text-warning border-warning/20" : "bg-muted text-muted-foreground"}`}>{a.status}</Badge>
                    </div>
                    <div className="mt-2"><AssignmentBadges a={a} /></div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{a.category} · {a.vendor}</span>
                      <span className="font-semibold">{inr(a.value)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maint">
          <Card className="border-border/60">
            <CardHeader className="pb-3"><CardTitle className="font-display text-base">Maintenance Schedule</CardTitle><CardDescription>Aggregated from all assets. Edit an asset to add or update its maintenance entries.</CardDescription></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Asset</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead>Vendor</TableHead><TableHead>Notes</TableHead><TableHead className="text-right">Cost</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {allMaint.sort((a, b) => b.date.localeCompare(a.date)).map((m) => (
                    <TableRow key={m.assetId + m.id}>
                      <TableCell className="text-xs"><div className="font-mono text-[10px] text-muted-foreground">{m.assetId}</div><div className="font-medium">{m.assetName}</div></TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{m.type}</Badge></TableCell>
                      <TableCell className="text-xs">{m.date}</TableCell>
                      <TableCell className="text-xs">{m.vendor}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.notes}</TableCell>
                      <TableCell className="text-right text-sm">{m.cost ? inr(m.cost) : "—"}</TableCell>
                      <TableCell><Badge variant="outline" className={m.status === "Completed" ? "bg-success/10 text-success border-success/20" : m.status === "In Progress" ? "bg-warning/10 text-warning border-warning/20" : "bg-info/10 text-info border-info/20"}>{m.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {allMaint.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No maintenance entries yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="depreciation">
          <DepreciationTab />
        </TabsContent>

        <TabsContent value="vendors">
          {/* Vendors */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <div><CardTitle className="font-display text-base">Vendors</CardTitle><CardDescription>Each vendor shows the assets you've purchased from them.</CardDescription></div>
              <Button size="sm" variant="outline" onClick={() => setAddVendor(true)}><Plus className="h-4 w-4" />Add Vendor</Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead>Category</TableHead><TableHead>Contact</TableHead><TableHead>Email</TableHead><TableHead>Assets Supplied</TableHead><TableHead className="text-right">Total Spend</TableHead></TableRow></TableHeader>
                <TableBody>
                  {vendors.map((v) => {
                    const linked = assets.filter((a) => a.vendor === v.name);
                    const spend = linked.reduce((s, a) => s + a.value, 0);
                    return (
                      <TableRow key={v.name}>
                        <TableCell className="font-medium text-sm">{v.name}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{v.category}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{v.contact}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{v.email}</TableCell>
                        <TableCell className="text-xs">{linked.length === 0 ? "—" : linked.map((a) => a.id).join(", ")}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">{inr(spend)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CrudDialog open={addVendor} onOpenChange={setAddVendor} title="Add Vendor"
        fields={[
          { name: "name", label: "Vendor Name" },
          { name: "category", label: "Category", type: "select", options: ["IT Hardware", "AV", "HVAC", "Furniture", "Vehicles", "Lab", "Sports", "Other"] },
          { name: "contact", label: "Contact" },
          { name: "email", label: "Email", type: "email" },
        ]}
        submitLabel="Add Vendor"
        onSubmit={(d) => setVendors((p) => [{ name: String(d.name), category: String(d.category), contact: String(d.contact), email: String(d.email) }, ...p])}
      />

      {(editing || creating) && (
        <AssetEditor
          asset={editing}
          vendors={vendors}
          personOptions={personOptions}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={(a) => { upsert(a); setEditing(null); setCreating(false); }}
          onAddVendor={() => setAddVendor(true)}
        />
      )}
    </PageContainer>
  );
}

function AssetEditor({ asset, vendors, personOptions, onClose, onSave, onAddVendor }: {
  asset: Asset | null;
  vendors: Vendor[];
  personOptions: string[];
  onClose: () => void;
  onSave: (a: Asset) => void;
  onAddVendor: () => void;
}) {
  const [a, setA] = useState<Asset>(asset ?? {
    id: newId(), name: "", category: CATEGORIES[0], serial: "", value: 0,
    purchaseDate: new Date().toISOString().slice(0, 10), warranty: "",
    vendor: vendors[0]?.name ?? "",
    assignedPerson: "", assignedRoom: "", assignedDepartment: "",
    status: "In Use", maintenance: [],
  });

  const set = <K extends keyof Asset>(k: K, v: Asset[K]) => setA((p) => ({ ...p, [k]: v }));
  const addMaint = () => set("maintenance", [...a.maintenance, { id: "M" + Date.now(), type: "Scheduled", date: new Date().toISOString().slice(0, 10), vendor: a.vendor, cost: 0, status: "Scheduled", notes: "" }]);
  const updMaint = (i: number, patch: Partial<MaintEntry>) => set("maintenance", a.maintenance.map((m, idx) => idx === i ? { ...m, ...patch } : m));
  const delMaint = (i: number) => set("maintenance", a.maintenance.filter((_, idx) => idx !== i));

  const NONE = "__none__";

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{asset ? `Edit ${asset.id}` : "Add Asset"}</DialogTitle>
          <DialogDescription>Capture asset details, vendor, multi-assignment (person + room + department) and maintenance.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <section>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Asset Details</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">Name</Label><Input value={a.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Dell Latitude 5440" /></div>
              <div><Label className="text-xs">Category</Label>
                <Select value={a.category} onValueChange={(v) => set("category", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Serial / Tag</Label><Input value={a.serial} onChange={(e) => set("serial", e.target.value)} /></div>
              <div><Label className="text-xs">Value (₹)</Label><Input type="number" value={a.value} onChange={(e) => set("value", Number(e.target.value))} /></div>
              <div><Label className="text-xs">Purchase Date</Label><Input type="date" value={a.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} /></div>
              <div><Label className="text-xs">Warranty Until</Label><Input type="date" value={a.warranty} onChange={(e) => set("warranty", e.target.value)} /></div>
              <div><Label className="text-xs">Status</Label>
                <Select value={a.status} onValueChange={(v) => set("status", v as Asset["status"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["In Use", "Maintenance", "Retired"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vendor</div>
              <Button size="sm" variant="ghost" onClick={onAddVendor} className="text-xs"><Plus className="h-3 w-3" />New Vendor</Button>
            </div>
            <Select value={a.vendor} onValueChange={(v) => set("vendor", v)}>
              <SelectTrigger><SelectValue placeholder="Pick vendor" /></SelectTrigger>
              <SelectContent>{vendors.map((v) => <SelectItem key={v.name} value={v.name}>{v.name} · {v.category}</SelectItem>)}</SelectContent>
            </Select>
          </section>

          <section>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Assignment</div>
            <p className="text-xs text-muted-foreground mb-3">An asset can belong to a person, sitting in a room, of a particular department — all at the same time. Leave any field blank if not applicable.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs flex items-center gap-1"><User className="h-3 w-3" />Person</Label>
                <Select value={a.assignedPerson || NONE} onValueChange={(v) => set("assignedPerson", v === NONE ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="No person" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— None —</SelectItem>
                    {personOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1"><DoorOpen className="h-3 w-3" />Room</Label>
                <Select value={a.assignedRoom || NONE} onValueChange={(v) => set("assignedRoom", v === NONE ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="No room" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— None —</SelectItem>
                    {ROOMS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1"><Building2 className="h-3 w-3" />Department</Label>
                <Select value={a.assignedDepartment || NONE} onValueChange={(v) => set("assignedDepartment", v === NONE ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="No department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— None —</SelectItem>
                    {DEPARTMENTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(a.assignedPerson || a.assignedRoom || a.assignedDepartment) && (
              <div className="mt-3 p-3 rounded-md bg-muted/40 border border-border/60 text-xs flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span>
                  This asset is linked to{" "}
                  {a.assignedPerson && <><b>{a.assignedPerson}</b></>}
                  {a.assignedPerson && (a.assignedRoom || a.assignedDepartment) && ", "}
                  {a.assignedRoom && <>sitting in <b>{a.assignedRoom}</b></>}
                  {a.assignedRoom && a.assignedDepartment && ", "}
                  {a.assignedDepartment && <>under the <b>{a.assignedDepartment}</b> department</>}.
                </span>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Maintenance Schedule</div>
              <Button size="sm" variant="outline" onClick={addMaint}><Plus className="h-3 w-3" />Add Entry</Button>
            </div>
            <div className="space-y-2">
              {a.maintenance.length === 0 && <div className="text-xs text-muted-foreground border border-dashed rounded p-3 text-center">No maintenance scheduled. Click Add Entry.</div>}
              {a.maintenance.map((m, i) => (
                <div key={m.id} className="border rounded p-3 grid grid-cols-12 gap-2">
                  <div className="col-span-6 sm:col-span-2"><Label className="text-[10px]">Type</Label>
                    <Select value={m.type} onValueChange={(v) => updMaint(i, { type: v as MaintEntry["type"] })}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent>{["Scheduled", "Repair", "Inspection"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="col-span-6 sm:col-span-2"><Label className="text-[10px]">Date</Label><Input className="h-8" type="date" value={m.date} onChange={(e) => updMaint(i, { date: e.target.value })} /></div>
                  <div className="col-span-6 sm:col-span-2"><Label className="text-[10px]">Vendor</Label>
                    <Select value={m.vendor} onValueChange={(v) => updMaint(i, { vendor: v })}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent>{vendors.map((v) => <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="col-span-3 sm:col-span-1"><Label className="text-[10px]">Cost</Label><Input className="h-8" type="number" value={m.cost} onChange={(e) => updMaint(i, { cost: Number(e.target.value) })} /></div>
                  <div className="col-span-6 sm:col-span-2"><Label className="text-[10px]">Status</Label>
                    <Select value={m.status} onValueChange={(v) => updMaint(i, { status: v as MaintEntry["status"] })}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent>{["Scheduled", "In Progress", "Completed"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="col-span-9 sm:col-span-2"><Label className="text-[10px]">Notes</Label><Input className="h-8" value={m.notes} onChange={(e) => updMaint(i, { notes: e.target.value })} /></div>
                  <div className="col-span-12 sm:col-span-1 flex items-end justify-end"><Button size="sm" variant="ghost" onClick={() => delMaint(i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="gradient-primary border-0" onClick={() => { if (!a.name) { toast.error("Asset name required"); return; } onSave(a); toast.success(asset ? "Asset updated" : "Asset added"); }}>{asset ? "Save Changes" : "Create Asset"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type DepMethod = "Straight Line" | "Written Down Value";
type DepAsset = {
  id: string; name: string; category: string; acquisitionDate: string; cost: number;
  salvage: number; lifeYears: number; method: DepMethod; ratePct: number;
  location: string; custodian: string;
};

const SEED_DEP: DepAsset[] = [
  { id: "DEP-001", name: "Dell OptiPlex 7090", category: "Computer", acquisitionDate: "2024-03-12", cost: 78000, salvage: 5000, lifeYears: 5, method: "Written Down Value", ratePct: 40, location: "Computer Lab", custodian: "IT Dept" },
  { id: "DEP-002", name: "Centralised AC — Block A", category: "HVAC", acquisitionDate: "2022-06-12", cost: 285000, salvage: 25000, lifeYears: 10, method: "Straight Line", ratePct: 10, location: "Block A", custodian: "Facilities" },
  { id: "DEP-003", name: "School Bus (Tata)", category: "Vehicle", acquisitionDate: "2021-04-01", cost: 1850000, salvage: 200000, lifeYears: 8, method: "Written Down Value", ratePct: 15, location: "Transport Yard", custodian: "Transport" },
];

function yearsElapsed(dateStr: string) {
  const d = new Date(dateStr);
  return Math.max(0, (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}

function computeDep(a: DepAsset) {
  const elapsed = Math.floor(yearsElapsed(a.acquisitionDate));
  let annual: number;
  let accumulated = 0;
  let book = a.cost;
  const schedule: { year: number; opening: number; depreciation: number; closing: number }[] = [];
  if (a.method === "Straight Line") {
    annual = Math.max(0, (a.cost - a.salvage) / a.lifeYears);
    for (let y = 1; y <= a.lifeYears; y++) {
      const opening = book;
      const dep = Math.min(annual, Math.max(0, opening - a.salvage));
      book = opening - dep;
      schedule.push({ year: y, opening: Math.round(opening), depreciation: Math.round(dep), closing: Math.round(book) });
    }
  } else {
    for (let y = 1; y <= a.lifeYears; y++) {
      const opening = book;
      const dep = Math.max(0, Math.min(opening * (a.ratePct / 100), opening - a.salvage));
      book = opening - dep;
      schedule.push({ year: y, opening: Math.round(opening), depreciation: Math.round(dep), closing: Math.round(book) });
    }
  }
  const capped = Math.min(elapsed, a.lifeYears);
  accumulated = schedule.slice(0, capped).reduce((s, r) => s + r.depreciation, 0);
  const currentBook = Math.round(a.cost - accumulated);
  const currentAnnual = schedule[Math.min(capped, schedule.length - 1)]?.depreciation ?? 0;
  return { schedule, accumulated: Math.round(accumulated), currentBook, currentAnnual, elapsed: capped };
}

function DepreciationTab() {
  const [rows, setRows] = useState<DepAsset[]>(SEED_DEP);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<DepAsset | null>(null);
  const [f, setF] = useState<DepAsset>({ id: "", name: "", category: CATEGORIES[0], acquisitionDate: new Date().toISOString().slice(0, 10), cost: 0, salvage: 0, lifeYears: 5, method: "Straight Line", ratePct: 15, location: "", custodian: "" });

  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalAccum = rows.reduce((s, r) => s + computeDep(r).accumulated, 0);
  const totalBook = rows.reduce((s, r) => s + computeDep(r).currentBook, 0);

  const save = () => {
    if (!f.name.trim()) { toast.error("Asset name required"); return; }
    const rec = { ...f, id: f.id || "DEP-" + Math.floor(Math.random() * 9000 + 1000) };
    setRows((p) => [rec, ...p]);
    setOpen(false);
    setF({ id: "", name: "", category: CATEGORIES[0], acquisitionDate: new Date().toISOString().slice(0, 10), cost: 0, salvage: 0, lifeYears: 5, method: "Straight Line", ratePct: 15, location: "", custodian: "" });
    toast.success("Depreciable asset added");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Depreciable Assets" value={rows.length} icon={<Boxes className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Acquisition Cost" value={inr(totalCost)} icon={<ShieldCheck className="h-5 w-5" />} tone="info" />
        <KpiCard label="Accumulated Dep." value={inr(totalAccum)} icon={<Wrench className="h-5 w-5" />} tone="warning" />
        <KpiCard label="Net Book Value" value={inr(totalBook)} icon={<ShieldCheck className="h-5 w-5" />} tone="success" />
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-display text-base">Asset Depreciation Register</CardTitle>
            <CardDescription>Straight-line & WDV schedules. Click a row for the year-by-year breakdown.</CardDescription>
          </div>
          <Button size="sm" className="gradient-primary border-0" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add Asset</Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>ID</TableHead><TableHead>Asset</TableHead><TableHead>Method</TableHead>
              <TableHead className="text-right">Cost</TableHead><TableHead className="text-right">Salvage</TableHead>
              <TableHead className="text-right">Life</TableHead><TableHead className="text-right">Annual Dep.</TableHead>
              <TableHead className="text-right">Accumulated</TableHead><TableHead className="text-right">Book Value</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => {
                const d = computeDep(r);
                return (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setDetail(r)}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="text-sm font-medium">{r.name}<div className="text-[10px] text-muted-foreground">{r.category} · {r.location}</div></TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{r.method}{r.method === "Written Down Value" ? ` ${r.ratePct}%` : ""}</Badge></TableCell>
                    <TableCell className="text-right text-sm">{inr(r.cost)}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{inr(r.salvage)}</TableCell>
                    <TableCell className="text-right text-xs">{r.lifeYears}y</TableCell>
                    <TableCell className="text-right text-sm">{inr(d.currentAnnual)}</TableCell>
                    <TableCell className="text-right text-sm text-warning">{inr(d.accumulated)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{inr(d.currentBook)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Add Depreciable Asset</DialogTitle>
            <DialogDescription>Capture acquisition, salvage value, useful life and depreciation method.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2"><Label className="text-xs">Asset Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Category</Label>
              <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Acquisition Date</Label><Input type="date" value={f.acquisitionDate} onChange={(e) => setF({ ...f, acquisitionDate: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Acquisition Cost (₹)</Label><Input type="number" value={f.cost} onChange={(e) => setF({ ...f, cost: Number(e.target.value) || 0 })} /></div>
            <div className="space-y-1"><Label className="text-xs">Salvage / Residual Value (₹)</Label><Input type="number" value={f.salvage} onChange={(e) => setF({ ...f, salvage: Number(e.target.value) || 0 })} /></div>
            <div className="space-y-1"><Label className="text-xs">Useful Life (years)</Label><Input type="number" value={f.lifeYears} onChange={(e) => setF({ ...f, lifeYears: Number(e.target.value) || 1 })} /></div>
            <div className="space-y-1"><Label className="text-xs">Method</Label>
              <Select value={f.method} onValueChange={(v) => setF({ ...f, method: v as DepMethod })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Straight Line">Straight Line</SelectItem><SelectItem value="Written Down Value">Written Down Value</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">WDV Rate (%)</Label><Input type="number" value={f.ratePct} onChange={(e) => setF({ ...f, ratePct: Number(e.target.value) || 0 })} disabled={f.method === "Straight Line"} /></div>
            <div className="space-y-1"><Label className="text-xs">Location</Label><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Custodian / Dept</Label><Input value={f.custodian} onChange={(e) => setF({ ...f, custodian: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="gradient-primary border-0" onClick={save}>Add Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {detail && (() => {
            const d = computeDep(detail);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display">{detail.name}</DialogTitle>
                  <DialogDescription>{detail.method} · {detail.lifeYears} years · acquired {detail.acquisitionDate}</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border/60 p-3 text-center"><div className="text-sm font-semibold">{inr(detail.cost)}</div><div className="text-[11px] text-muted-foreground">Cost</div></div>
                  <div className="rounded-lg border border-border/60 p-3 text-center"><div className="text-sm font-semibold">{inr(d.accumulated)}</div><div className="text-[11px] text-muted-foreground">Accumulated</div></div>
                  <div className="rounded-lg border border-border/60 p-3 text-center"><div className="text-sm font-semibold">{inr(d.currentBook)}</div><div className="text-[11px] text-muted-foreground">Book Value</div></div>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Year</TableHead><TableHead className="text-right">Opening</TableHead><TableHead className="text-right">Depreciation</TableHead><TableHead className="text-right">Closing</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {d.schedule.map((s) => (
                      <TableRow key={s.year} className={s.year <= d.elapsed ? "" : "opacity-50"}>
                        <TableCell className="text-sm">Year {s.year}</TableCell>
                        <TableCell className="text-right text-sm">{inr(s.opening)}</TableCell>
                        <TableCell className="text-right text-sm text-warning">{inr(s.depreciation)}</TableCell>
                        <TableCell className="text-right text-sm">{inr(s.closing)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
