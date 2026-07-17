import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Bus, Plus, MapPin, Fuel, Wrench, Users, Navigation, UserPlus, Trash2 } from "lucide-react";
import { useState } from "react";
import { CrudDialog } from "@/components/crud-dialog";
import { useStudents, useEmployees } from "@/lib/store";
import { toast } from "sonner";
import { DataMigrationBar } from "@/components/data-migration-bar";

export const Route = createFileRoute("/transport")({
  head: () => ({ meta: [{ title: "Transport — Edureon ERP" }] }),
  component: TransportPage,
});

type RouteRec = { id: string; name: string; driver: string; bus: string; stops: number; students: number; eta: string; status: string };
type Vehicle = { reg: string; model: string; year: number; fuel: number; odometer: number; insurance: string; service: string };
type Driver = { name: string; license: string; exp: string; rating: number; trips: number };
type Fuel0 = { bus: string; date: string; litres: number; cost: string };
type MaintRec = { bus: string; task: string; due: string };
type RosterMap = Record<string, { students: string[]; faculty: string[] }>;

const seedRoutes: RouteRec[] = [
  { id: "RT-01", name: "Vasant Kunj — Mehrauli", driver: "Sunil Yadav", bus: "DL-1C-AB-4521", stops: 12, students: 38, eta: "On time", status: "Running" },
  { id: "RT-02", name: "Dwarka Sec 12 — Janakpuri", driver: "Ramesh Kumar", bus: "DL-1C-AB-4522", stops: 14, students: 42, eta: "+12 min", status: "Delayed" },
  { id: "RT-03", name: "Greater Kailash — Hauz Khas", driver: "Vikas Singh", bus: "DL-1C-AB-4523", stops: 10, students: 35, eta: "On time", status: "Running" },
  { id: "RT-04", name: "Rohini Sec 9 — Pitampura", driver: "Anil Sharma", bus: "DL-1C-AB-4524", stops: 16, students: 44, eta: "On time", status: "Running" },
  { id: "RT-05", name: "Saket — Malviya Nagar", driver: "Ravi Verma", bus: "DL-1C-AB-4525", stops: 11, students: 32, eta: "Yard", status: "Idle" },
];

const seedVehicles: Vehicle[] = [
  { reg: "DL-1C-AB-4521", model: "Tata Starbus", year: 2022, fuel: 78, odometer: 48210, insurance: "Valid · Mar 26", service: "Due in 800 km" },
  { reg: "DL-1C-AB-4522", model: "Eicher Skyline", year: 2021, fuel: 32, odometer: 62100, insurance: "Valid · Aug 26", service: "OK" },
  { reg: "DL-1C-AB-4523", model: "Ashok Leyland Lynx", year: 2023, fuel: 88, odometer: 21400, insurance: "Valid · Jan 27", service: "OK" },
  { reg: "DL-1C-AB-4524", model: "Tata LP 1212", year: 2020, fuel: 12, odometer: 84500, insurance: "Expires 12 Dec", service: "OVERDUE" },
];

const seedDrivers: Driver[] = [
  { name: "Sunil Yadav", license: "DL-2018-0021541", exp: "2027", rating: 4.8, trips: 1204 },
  { name: "Ramesh Kumar", license: "DL-2016-0019021", exp: "2026", rating: 4.6, trips: 1521 },
  { name: "Vikas Singh", license: "DL-2019-0024418", exp: "2028", rating: 4.9, trips: 980 },
  { name: "Anil Sharma", license: "DL-2015-0018110", exp: "2025", rating: 4.4, trips: 1812 },
  { name: "Ravi Verma", license: "DL-2017-0022040", exp: "2026", rating: 4.7, trips: 1340 },
];
const seedFuel: Fuel0[] = [
  { bus: "DL-1C-AB-4521", date: "28 Nov", litres: 62, cost: "6,448" },
  { bus: "DL-1C-AB-4522", date: "27 Nov", litres: 58, cost: "6,032" },
  { bus: "DL-1C-AB-4524", date: "26 Nov", litres: 70, cost: "7,280" },
  { bus: "DL-1C-AB-4523", date: "25 Nov", litres: 55, cost: "5,720" },
];
const seedMaint: MaintRec[] = [
  { bus: "DL-1C-AB-4524", task: "Brake Pads + Oil", due: "Overdue" },
  { bus: "DL-1C-AB-4521", task: "Tyre Rotation", due: "800 km" },
  { bus: "DL-1C-AB-4522", task: "AC Service", due: "12 Dec" },
  { bus: "DL-1C-AB-4523", task: "Battery Check", due: "18 Dec" },
];

function TransportPage() {
  const students = useStudents();
  const employees = useEmployees();
  const [routes, setRoutes] = useState<RouteRec[]>(seedRoutes);
  const [vehicles, setVehicles] = useState<Vehicle[]>(seedVehicles);
  const [drivers, setDrivers] = useState<Driver[]>(seedDrivers);
  const [fuelLogs, setFuelLogs] = useState<Fuel0[]>(seedFuel);
  const [maintLogs, setMaintLogs] = useState<MaintRec[]>(seedMaint);
  const [dlg, setDlg] = useState<null | "route" | "vehicle" | "driver" | "fuel" | "maint">(null);
  const [roster, setRoster] = useState<RosterMap>({
    "RT-01": { students: students.slice(0, 3).map((s) => s.id), faculty: employees.slice(0, 1).map((e) => e.id) },
    "RT-02": { students: students.slice(3, 6).map((s) => s.id), faculty: [] },
  });
  const [rosterFor, setRosterFor] = useState<RouteRec | null>(null);

  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? id;
  const employeeName = (id: string) => employees.find((e) => e.id === id)?.name ?? id;
  const removeStudent = (rid: string, sid: string) => {
    setRoster((p) => ({ ...p, [rid]: { students: (p[rid]?.students ?? []).filter((x) => x !== sid), faculty: p[rid]?.faculty ?? [] } }));
    toast.success("Removed from route");
  };
  const removeFaculty = (rid: string, eid: string) => {
    setRoster((p) => ({ ...p, [rid]: { students: p[rid]?.students ?? [], faculty: (p[rid]?.faculty ?? []).filter((x) => x !== eid) } }));
    toast.success("Removed from route");
  };

  return (
    <PageContainer>
      <PageHeader eyebrow="Operations" title="Transport & Fleet Management"
        description="Vehicles, drivers, routes, GPS tracking, fuel and maintenance — end-to-end fleet operations."
        actions={<>
          <DataMigrationBar
            moduleName="Transport Routes"
            rows={routes}
            columns={[
              { header: "Route ID", accessor: (r) => r.id },
              { header: "Route", accessor: (r) => r.name },
              { header: "Driver", accessor: (r) => r.driver },
              { header: "Bus", accessor: (r) => r.bus },
              { header: "Stops", accessor: (r) => r.stops },
              { header: "Students", accessor: (r) => r.students },
              { header: "Status", accessor: (r) => r.status },
            ]}
          />
          <Button size="sm" className="gradient-primary border-0" onClick={() => setDlg("route")}><Plus className="h-4 w-4" />Add Route</Button>
        </>}
      />

      {rosterFor && (
        <RosterDialog route={rosterFor}
          students={students}
          employees={employees}
          initial={roster[rosterFor.id] ?? { students: [], faculty: [] }}
          onClose={() => setRosterFor(null)}
          onSave={(next) => {
            const ref = rosterFor;
            setRoster((p) => ({ ...p, [ref.id]: next }));
            setRoutes((p) => p.map((r) => r.id === ref.id ? { ...r, students: next.students.length } : r));
            toast.success(`Roster updated for ${ref.name}`);
            setRosterFor(null);
          }}
        />
      )}

      <CrudDialog open={dlg === "route"} onOpenChange={(v) => !v && setDlg(null)} title="Add Route"
        fields={[
          { name: "name", label: "Route Name" },
          { name: "driver", label: "Driver", type: "select", options: drivers.map((d) => d.name) },
          { name: "bus", label: "Bus", type: "select", options: vehicles.map((v) => v.reg) },
          { name: "stops", label: "Stops", type: "number" },
          { name: "students", label: "Students", type: "number" },
          { name: "status", label: "Status", type: "select", options: ["Running", "Delayed", "Idle"] },
        ]}
        submitLabel="Add Route"
        onSubmit={(d) => setRoutes((p) => [...p, { id: "RT-" + String(p.length + 1).padStart(2, "0"), name: String(d.name), driver: String(d.driver), bus: String(d.bus), stops: Number(d.stops) || 0, students: Number(d.students) || 0, eta: "On time", status: String(d.status) }])}
      />

      <CrudDialog open={dlg === "vehicle"} onOpenChange={(v) => !v && setDlg(null)} title="Add Vehicle"
        fields={[
          { name: "reg", label: "Registration No." },
          { name: "model", label: "Model" },
          { name: "year", label: "Year", type: "number" },
          { name: "odometer", label: "Odometer (km)", type: "number" },
          { name: "insurance", label: "Insurance Status" },
          { name: "service", label: "Service Status", type: "select", options: ["OK", "Due in 800 km", "OVERDUE"] },
        ]}
        submitLabel="Add Vehicle"
        onSubmit={(d) => setVehicles((p) => [...p, { reg: String(d.reg), model: String(d.model), year: Number(d.year) || 2024, fuel: 100, odometer: Number(d.odometer) || 0, insurance: String(d.insurance) || "Valid", service: String(d.service) }])}
      />

      <CrudDialog open={dlg === "driver"} onOpenChange={(v) => !v && setDlg(null)} title="Add Driver"
        fields={[
          { name: "name", label: "Full Name" },
          { name: "license", label: "License No." },
          { name: "exp", label: "License Expires" },
          { name: "rating", label: "Rating", type: "number" },
          { name: "trips", label: "Trips Completed", type: "number" },
        ]}
        submitLabel="Add Driver"
        onSubmit={(d) => setDrivers((p) => [...p, { name: String(d.name), license: String(d.license), exp: String(d.exp), rating: Number(d.rating) || 5, trips: Number(d.trips) || 0 }])}
      />

      <CrudDialog open={dlg === "fuel"} onOpenChange={(v) => !v && setDlg(null)} title="Log Fuel"
        fields={[
          { name: "bus", label: "Bus", type: "select", options: vehicles.map((v) => v.reg) },
          { name: "date", label: "Date", type: "date" },
          { name: "litres", label: "Litres", type: "number" },
          { name: "cost", label: "Cost (₹)" },
        ]}
        submitLabel="Log Fuel"
        onSubmit={(d) => setFuelLogs((p) => [{ bus: String(d.bus), date: String(d.date), litres: Number(d.litres) || 0, cost: String(d.cost) }, ...p])}
      />

      <CrudDialog open={dlg === "maint"} onOpenChange={(v) => !v && setDlg(null)} title="Schedule Maintenance"
        fields={[
          { name: "bus", label: "Bus", type: "select", options: vehicles.map((v) => v.reg) },
          { name: "task", label: "Task" },
          { name: "due", label: "Due" },
        ]}
        submitLabel="Schedule"
        onSubmit={(d) => setMaintLogs((p) => [...p, { bus: String(d.bus), task: String(d.task), due: String(d.due) }])}
      />


      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Active Routes" value="18" icon={<Navigation className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Buses on Road" value="22" icon={<Bus className="h-5 w-5" />} tone="info" />
        <KpiCard label="Students" value="1,140" icon={<Users className="h-5 w-5" />} tone="success" />
        <KpiCard label="On-Time %" value="96%" delta={1.4} icon={<MapPin className="h-5 w-5" />} tone="success" />
      </div>

      <Tabs defaultValue="live">
        <TabsList>
          <TabsTrigger value="live">Live Routes</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="fuel">Fuel & Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-4 grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-border/60">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Route</TableHead><TableHead>Driver</TableHead><TableHead>Bus</TableHead><TableHead>Stops</TableHead><TableHead>Riders</TableHead><TableHead>ETA</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {routes.map(r => {
                    const rs = roster[r.id] ?? { students: [], faculty: [] };
                    return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium"><div>{r.name}</div><div className="text-[10px] font-mono text-muted-foreground">{r.id}</div></TableCell>
                      <TableCell className="text-sm">{r.driver}</TableCell>
                      <TableCell className="text-xs font-mono">{r.bus}</TableCell>
                      <TableCell>{r.stops}</TableCell>
                      <TableCell className="text-xs"><span className="font-medium">{rs.students.length}</span> S · <span className="font-medium">{rs.faculty.length}</span> F</TableCell>
                      <TableCell><span className={r.eta.includes("+") ? "text-destructive" : ""}>{r.eta}</span></TableCell>
                      <TableCell><Badge variant={r.status==="Running"?"default":r.status==="Delayed"?"destructive":"secondary"}>{r.status}</Badge></TableCell>
                      <TableCell><Button size="sm" variant="outline" onClick={() => setRosterFor(r)}><UserPlus className="h-3.5 w-3.5" />Manage</Button></TableCell>
                    </TableRow>
                  );})}
                </TableBody>
              </Table>
            </CardContent>
          </Card>


          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Live Map</CardTitle><CardDescription>Real-time bus positions</CardDescription></CardHeader>
            <CardContent>
              <div className="aspect-square rounded-lg bg-gradient-to-br from-muted to-muted/30 relative overflow-hidden border">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                {[
                  { x: "20%", y: "30%", c: "bg-success" },{ x: "65%", y: "55%", c: "bg-warning" },
                  { x: "45%", y: "70%", c: "bg-success" },{ x: "80%", y: "20%", c: "bg-success" },
                  { x: "30%", y: "75%", c: "bg-muted-foreground" },
                ].map((p, i) => (
                  <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: p.x, top: p.y }}>
                    <div className={`h-3 w-3 rounded-full ${p.c} ring-4 ring-background animate-pulse`} />
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-success" />On time</div>
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-warning" />Delayed</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roster" className="mt-4 space-y-4">
          {routes.map((r) => {
            const rs = roster[r.id] ?? { students: [], faculty: [] };
            return (
              <Card key={r.id} className="border-border/60">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-base">{r.name} <span className="text-xs font-mono text-muted-foreground ml-2">{r.id}</span></CardTitle>
                    <CardDescription>Bus {r.bus} · Driver {r.driver} · {rs.students.length} students · {rs.faculty.length} faculty</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setRosterFor(r)}><UserPlus className="h-4 w-4" />Manage Riders</Button>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold mb-2 text-muted-foreground">Students ({rs.students.length})</div>
                    <div className="space-y-1 max-h-60 overflow-auto">
                      {rs.students.length === 0 && <div className="text-xs text-muted-foreground border border-dashed rounded p-3 text-center">No students enrolled.</div>}
                      {rs.students.map((sid) => {
                        const s = students.find((x) => x.id === sid);
                        return (
                          <div key={sid} className="flex items-center justify-between text-xs bg-muted/40 rounded px-2 py-1">
                            <span><span className="font-medium">{studentName(sid)}</span> <span className="font-mono text-[10px] text-muted-foreground">· {sid}{s ? ` · ${s.class}-${s.section}` : ""}</span></span>
                            <button onClick={() => removeStudent(r.id, sid)} className="p-0.5 hover:bg-muted rounded"><Trash2 className="h-3 w-3 text-destructive" /></button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold mb-2 text-muted-foreground">Faculty ({rs.faculty.length})</div>
                    <div className="space-y-1 max-h-60 overflow-auto">
                      {rs.faculty.length === 0 && <div className="text-xs text-muted-foreground border border-dashed rounded p-3 text-center">No faculty enrolled.</div>}
                      {rs.faculty.map((eid) => {
                        const e = employees.find((x) => x.id === eid);
                        return (
                          <div key={eid} className="flex items-center justify-between text-xs bg-muted/40 rounded px-2 py-1">
                            <span><span className="font-medium">{employeeName(eid)}</span> <span className="font-mono text-[10px] text-muted-foreground">· {eid}{e ? ` · ${e.department}` : ""}</span></span>
                            <button onClick={() => removeFaculty(r.id, eid)} className="p-0.5 hover:bg-muted rounded"><Trash2 className="h-3 w-3 text-destructive" /></button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>



        <TabsContent value="vehicles" className="mt-4 space-y-3">
          <div className="flex justify-end"><Button size="sm" variant="outline" onClick={() => setDlg("vehicle")}><Plus className="h-4 w-4" />Add Vehicle</Button></div>
          <Card className="border-border/60">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Reg #</TableHead><TableHead>Model</TableHead><TableHead>Year</TableHead><TableHead>Fuel</TableHead><TableHead>Odometer</TableHead><TableHead>Insurance</TableHead><TableHead>Service</TableHead></TableRow></TableHeader>
                <TableBody>
                  {vehicles.map(v => (
                    <TableRow key={v.reg}>
                      <TableCell className="font-mono text-xs">{v.reg}</TableCell>
                      <TableCell className="font-medium">{v.model}</TableCell>
                      <TableCell>{v.year}</TableCell>
                      <TableCell><div className="flex items-center gap-2"><Progress value={v.fuel} className="h-1.5 w-20" /><span className="text-xs tabular-nums">{v.fuel}%</span></div></TableCell>
                      <TableCell className="tabular-nums">{v.odometer.toLocaleString()} km</TableCell>
                      <TableCell className="text-xs">{v.insurance}</TableCell>
                      <TableCell><Badge variant={v.service==="OVERDUE"?"destructive":v.service==="OK"?"secondary":"default"}>{v.service}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="mt-4 space-y-3">
          <div className="flex justify-end"><Button size="sm" variant="outline" onClick={() => setDlg("driver")}><Plus className="h-4 w-4" />Add Driver</Button></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map(d => (
            <Card key={d.name} className="border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">{d.name.split(" ").map(n=>n[0]).join("")}</div>
                  <div className="flex-1"><div className="font-semibold">{d.name}</div><div className="text-xs text-muted-foreground font-mono">{d.license}</div></div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div><div className="text-xs text-muted-foreground">Rating</div><div className="font-semibold">{d.rating}★</div></div>
                  <div><div className="text-xs text-muted-foreground">Trips</div><div className="font-semibold">{d.trips}</div></div>
                  <div><div className="text-xs text-muted-foreground">License</div><div className="font-semibold">{d.exp}</div></div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </TabsContent>

        <TabsContent value="fuel" className="mt-4 grid md:grid-cols-2 gap-4">
          <Card className="border-border/60">
            <CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="text-base flex items-center gap-2"><Fuel className="h-4 w-4" />Fuel Logs</CardTitle><Button size="sm" variant="outline" onClick={() => setDlg("fuel")}><Plus className="h-4 w-4" />Log Fuel</Button></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Bus</TableHead><TableHead>Date</TableHead><TableHead>Litres</TableHead><TableHead>₹</TableHead></TableRow></TableHeader>
                <TableBody>
                  {fuelLogs.map((r,i) => <TableRow key={i}><TableCell className="font-mono text-xs">{r.bus}</TableCell><TableCell>{r.date}</TableCell><TableCell>{r.litres}L</TableCell><TableCell>₹{r.cost}</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4" />Maintenance Schedule</CardTitle><Button size="sm" variant="outline" onClick={() => setDlg("maint")}><Plus className="h-4 w-4" />Schedule</Button></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Bus</TableHead><TableHead>Task</TableHead><TableHead>Due</TableHead></TableRow></TableHeader>
                <TableBody>
                  {maintLogs.map((r,i) => <TableRow key={i}><TableCell className="font-mono text-xs">{r.bus}</TableCell><TableCell>{r.task}</TableCell><TableCell>{r.due==="Overdue"?<Badge variant="destructive">{r.due}</Badge>:r.due}</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

type StudentLite = { id: string; name: string; class?: string; section?: string; admissionNo?: string };
type EmployeeLite = { id: string; name: string; department?: string; role?: string };

function batchOf(s: StudentLite): string {
  const m = (s.admissionNo ?? "").match(/(\d{4})/);
  return m ? m[1] : "—";
}

function RosterDialog({ route, students, employees, initial, onClose, onSave }: {
  route: RouteRec;
  students: StudentLite[];
  employees: EmployeeLite[];
  initial: { students: string[]; faculty: string[] };
  onClose: () => void;
  onSave: (next: { students: string[]; faculty: string[] }) => void;
}) {
  const [tab, setTab] = useState<"students" | "faculty">("students");
  const [sPicked, setSPicked] = useState<Set<string>>(new Set(initial.students));
  const [fPicked, setFPicked] = useState<Set<string>>(new Set(initial.faculty));
  const [query, setQuery] = useState("");
  const [fClass, setFClass] = useState("all");
  const [fSection, setFSection] = useState("all");
  const [fBatch, setFBatch] = useState("all");
  const [fYear, setFYear] = useState("all");
  const [fDept, setFDept] = useState("all");

  const classes = Array.from(new Set(students.map((s) => s.class).filter(Boolean))) as string[];
  const sections = Array.from(new Set(students.map((s) => s.section).filter(Boolean))) as string[];
  const batches = Array.from(new Set(students.map(batchOf))).filter((b) => b !== "—");
  const depts = Array.from(new Set(employees.map((e) => e.department).filter(Boolean))) as string[];
  const years = ["2024-25", "2025-26", "2026-27"];

  const sFiltered = students.filter((s) => {
    if (fClass !== "all" && s.class !== fClass) return false;
    if (fSection !== "all" && s.section !== fSection) return false;
    if (fBatch !== "all" && batchOf(s) !== fBatch) return false;
    if (query && !(s.name + " " + s.id).toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });
  const eFiltered = employees.filter((e) => {
    if (fDept !== "all" && e.department !== fDept) return false;
    if (query && !(e.name + " " + e.id).toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const toggleS = (id: string) => { const n = new Set(sPicked); n.has(id) ? n.delete(id) : n.add(id); setSPicked(n); };
  const toggleF = (id: string) => { const n = new Set(fPicked); n.has(id) ? n.delete(id) : n.add(id); setFPicked(n); };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">Manage Riders — {route.name}</DialogTitle>
          <DialogDescription>Bus {route.bus} · Driver {route.driver}. Select students and faculty enrolled to this route.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "students" | "faculty")}>
          <TabsList><TabsTrigger value="students">Students ({sPicked.size})</TabsTrigger><TabsTrigger value="faculty">Faculty ({fPicked.size})</TabsTrigger></TabsList>
          <TabsContent value="students" className="mt-3 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div><Label className="text-xs">Search</Label><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or ID…" /></div>
              <div><Label className="text-xs">Year</Label>
                <Select value={fYear} onValueChange={setFYear}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Batch</Label>
                <Select value={fBatch} onValueChange={setFBatch}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{batches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Class</Label>
                <Select value={fClass} onValueChange={setFClass}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Section</Label>
                <Select value={fSection} onValueChange={setFSection}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="border rounded-md max-h-72 overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead className="w-10"></TableHead><TableHead>Student</TableHead><TableHead>ID</TableHead><TableHead>Class</TableHead><TableHead>Section</TableHead><TableHead>Batch</TableHead></TableRow></TableHeader>
                <TableBody>
                  {sFiltered.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => toggleS(s.id)}>
                      <TableCell><input type="checkbox" checked={sPicked.has(s.id)} onChange={() => toggleS(s.id)} /></TableCell>
                      <TableCell className="text-sm font-medium">{s.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{s.id}</TableCell>
                      <TableCell className="text-xs">{s.class}</TableCell>
                      <TableCell className="text-xs">{s.section}</TableCell>
                      <TableCell className="text-xs">{batchOf(s)}</TableCell>
                    </TableRow>
                  ))}
                  {sFiltered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">No students match.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="faculty" className="mt-3 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div><Label className="text-xs">Search</Label><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or ID…" /></div>
              <div><Label className="text-xs">Department</Label>
                <Select value={fDept} onValueChange={setFDept}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{depts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="border rounded-md max-h-72 overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead className="w-10"></TableHead><TableHead>Faculty</TableHead><TableHead>ID</TableHead><TableHead>Department</TableHead><TableHead>Role</TableHead></TableRow></TableHeader>
                <TableBody>
                  {eFiltered.map((e) => (
                    <TableRow key={e.id} className="cursor-pointer" onClick={() => toggleF(e.id)}>
                      <TableCell><input type="checkbox" checked={fPicked.has(e.id)} onChange={() => toggleF(e.id)} /></TableCell>
                      <TableCell className="text-sm font-medium">{e.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{e.id}</TableCell>
                      <TableCell className="text-xs">{e.department}</TableCell>
                      <TableCell className="text-xs">{e.role}</TableCell>
                    </TableRow>
                  ))}
                  {eFiltered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">No faculty match.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="gradient-primary border-0" onClick={() => onSave({ students: Array.from(sPicked), faculty: Array.from(fPicked) })}>Save Roster</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
