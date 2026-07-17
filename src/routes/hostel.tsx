import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Plus, Users, UserCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { CrudDialog } from "@/components/crud-dialog";
import { useStudents } from "@/lib/store";
import { DataMigrationBar } from "@/components/data-migration-bar";

export const Route = createFileRoute("/hostel")({
  head: () => ({ meta: [{ title: "Hostel — Edureon ERP" }] }),
  component: HostelPage,
});

type Allocation = { studentId: string; studentName: string; bed: string; checkin: string; guardian: string };
type Room = { no: string; type: string; capacity: number; allocations: Allocation[] };
type Block = { name: string; gender: "Boys" | "Girls" | "Co-ed"; warden: string; wardenCount: number; rooms: Room[] };

const SEED: Block[] = [
  { name: "Aravalli Block", gender: "Boys", warden: "Mr. Rao", wardenCount: 2, rooms: [
    { no: "A-101", type: "Twin Sharing", capacity: 2, allocations: [{ studentId: "STU1003", studentName: "Aarav Sharma", bed: "A", checkin: "2025-06-01", guardian: "+91 9000000001" }] },
    { no: "A-102", type: "Twin Sharing", capacity: 2, allocations: [] },
    { no: "A-103", type: "Single", capacity: 1, allocations: [] },
  ]},
  { name: "Vindhya Block", gender: "Girls", warden: "Mrs. Iyer", wardenCount: 3, rooms: [
    { no: "V-201", type: "Triple Sharing", capacity: 3, allocations: [{ studentId: "STU1007", studentName: "Diya Verma", bed: "A", checkin: "2025-06-01", guardian: "+91 9000000002" }] },
    { no: "V-202", type: "Twin Sharing", capacity: 2, allocations: [] },
  ]},
];

function HostelPage() {
  const students = useStudents();
  const [blocks, setBlocks] = useState<Block[]>(SEED);
  const [addBlock, setAddBlock] = useState(false);
  const [addRoomFor, setAddRoomFor] = useState<string | null>(null);
  const [allocFor, setAllocFor] = useState<{ block: string; room: Room } | null>(null);
  const [bulkAllocOpen, setBulkAllocOpen] = useState(false);

  const allRooms = blocks.flatMap((b) => b.rooms.map((r) => ({ ...r, block: b.name, gender: b.gender })));
  const allAllocs = allRooms.flatMap((r) => r.allocations.map((a) => ({ ...a, room: r.no, block: r.block })));
  const totalCapacity = allRooms.reduce((s, r) => s + r.capacity, 0);
  const occupied = allAllocs.length;
  const allocatedStudentIds = new Set(allAllocs.map((a) => a.studentId));
  const availableStudents = students.filter((s) => !allocatedStudentIds.has(s.id));
  const totalWardens = blocks.reduce((s, b) => s + (b.wardenCount || 0), 0);

  const removeAlloc = (room: string, studentId: string) => {
    setBlocks((p) => p.map((b) => ({ ...b, rooms: b.rooms.map((r) => r.no !== room ? r : { ...r, allocations: r.allocations.filter((a) => a.studentId !== studentId) }) })));
    toast.success("Allocation removed");
  };

  const applyBulkAlloc = (assignments: { block: string; roomNo: string; alloc: Allocation }[]) => {
    setBlocks((p) => p.map((b) => ({
      ...b,
      rooms: b.rooms.map((r) => {
        const adds = assignments.filter((a) => a.block === b.name && a.roomNo === r.no).map((a) => a.alloc);
        return adds.length ? { ...r, allocations: [...r.allocations, ...adds] } : r;
      }),
    })));
    toast.success(`${assignments.length} allocation${assignments.length > 1 ? "s" : ""} created across ${new Set(assignments.map((a) => a.roomNo)).size} room(s)`);
    setBulkAllocOpen(false);
  };

  const deleteRoom = (block: string, no: string) => {
    setBlocks((p) => p.map((b) => b.name !== block ? b : { ...b, rooms: b.rooms.filter((r) => r.no !== no) }));
    toast.success("Room removed");
  };

  return (
    <PageContainer>
      <PageHeader eyebrow="Operations" title="Hostel Management"
        description="Blocks, rooms, beds, and student allocations — fully integrated with the student registry."
        actions={<>
          <DataMigrationBar
            moduleName="Hostel Blocks"
            rows={blocks}
            columns={[
              { header: "Block", accessor: (b) => b.name },
              { header: "Type", accessor: (b) => b.gender },
              { header: "Wardens", accessor: (b) => b.wardenCount },
              { header: "Warden Name", accessor: (b) => b.warden },
              { header: "Rooms", accessor: (b) => b.rooms.length },
              { header: "Occupied Beds", accessor: (b) => b.rooms.reduce((a, r) => a + r.allocations.length, 0) },
            ]}
          />
          <Button size="sm" className="gradient-primary border-0" onClick={() => setAddBlock(true)}><Plus className="h-4 w-4" />Add Block</Button>
        </>}
      />

      <CrudDialog open={addBlock} onOpenChange={setAddBlock} title="Add Hostel Block"
        fields={[
          { name: "name", label: "Block Name" },
          { name: "gender", label: "Type of Hostel", type: "select", options: ["Boys", "Girls", "Co-ed"] },
          { name: "warden", label: "Warden Name" },
          { name: "wardenCount", label: "Number of Wardens", type: "number" },
        ]}
        submitLabel="Add Block"
        onSubmit={(d) => setBlocks((p) => [...p, { name: String(d.name), gender: String(d.gender) as Block["gender"], warden: String(d.warden), wardenCount: Number(d.wardenCount) || 1, rooms: [] }])}
      />

      {addRoomFor && (
        <CrudDialog open onOpenChange={(v) => !v && setAddRoomFor(null)} title={`Add Room — ${addRoomFor}`}
          fields={[
            { name: "no", label: "Room No." },
            { name: "type", label: "Type", type: "select", options: ["Single", "Twin Sharing", "Triple Sharing", "Quad Sharing", "Six Sharing", "Dormitory"] },
            { name: "capacity", label: "Capacity (beds)", type: "select", options: ["1", "2", "3", "4", "6"] },
          ]}
          submitLabel="Add Room"
          onSubmit={(d) => {
            const ref = addRoomFor;
            const cap = Number(d.capacity) || 2;
            setBlocks((p) => p.map((b) => b.name !== ref ? b : { ...b, rooms: [...b.rooms, { no: String(d.no), type: String(d.type), capacity: cap, allocations: [] }] }));
            setAddRoomFor(null);
          }}
        />
      )}

      {allocFor && (
        <AllocateDialog
          block={allocFor.block}
          room={allocFor.room}
          students={availableStudents}
          onClose={() => setAllocFor(null)}
          onAssignMany={(allocs) => {
            const ref = allocFor;
            setBlocks((p) => p.map((b) => b.name !== ref.block ? b : { ...b, rooms: b.rooms.map((r) => {
              if (r.no !== ref.room.no) return r;
              const free = r.capacity - r.allocations.length;
              return { ...r, allocations: [...r.allocations, ...allocs.slice(0, free)] };
            }) }));
            toast.success(`${allocs.length} student${allocs.length > 1 ? "s" : ""} allocated to ${ref.room.no}`);
            setAllocFor(null);
          }}
        />
      )}

      {bulkAllocOpen && (
        <BulkAllocateDialog
          blocks={blocks}
          students={availableStudents}
          onClose={() => setBulkAllocOpen(false)}
          onAllocate={applyBulkAlloc}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Blocks" value={blocks.length} icon={<Building2 className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Wardens" value={totalWardens} icon={<UserCheck className="h-5 w-5" />} tone="info" />
        <KpiCard label="Rooms" value={allRooms.length} icon={<Building2 className="h-5 w-5" />} tone="info" />
        <KpiCard label="Bed Occupancy" value={`${Math.round((occupied / Math.max(1, totalCapacity)) * 100)}%`} icon={<Users className="h-5 w-5" />} tone="success" />
        <KpiCard label="Vacant Beds" value={totalCapacity - occupied} icon={<UserCheck className="h-5 w-5" />} tone="warning" />
      </div>

      <Tabs defaultValue="blocks">
        <TabsList>
          <TabsTrigger value="blocks">Blocks & Rooms</TabsTrigger>
          <TabsTrigger value="allocs">All Allocations</TabsTrigger>
        </TabsList>

        <TabsContent value="blocks" className="mt-4 space-y-4">
          {blocks.map((b) => (
            <Card key={b.name} className="border-border/60">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base">{b.name} <Badge variant="secondary" className="ml-2 text-[10px]">{b.gender}</Badge></CardTitle>
                  <CardDescription>Warden: {b.warden} · {b.wardenCount} warden{b.wardenCount > 1 ? "s" : ""} · {b.rooms.length} rooms · {b.rooms.reduce((s, r) => s + r.allocations.length, 0)}/{b.rooms.reduce((s, r) => s + r.capacity, 0)} beds</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => setAddRoomFor(b.name)}><Plus className="h-4 w-4" />Add Room</Button>
              </CardHeader>
              <CardContent>
                {b.rooms.length === 0 && <div className="text-xs text-muted-foreground border border-dashed rounded p-4 text-center">No rooms yet.</div>}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {b.rooms.map((r) => {
                    const free = r.capacity - r.allocations.length;
                    const cls = free === 0 ? "border-destructive/30 bg-destructive/5" : free < r.capacity ? "border-warning/30 bg-warning/5" : "border-success/30 bg-success/5";
                    return (
                      <div key={r.no} className={`border rounded-md p-3 ${cls}`}>
                        <div className="flex items-center justify-between">
                          <div className="font-mono text-sm font-semibold">{r.no}</div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px]">{r.allocations.length}/{r.capacity}</Badge>
                            <button onClick={() => deleteRoom(b.name, r.no)} className="p-1 hover:bg-muted rounded"><Trash2 className="h-3 w-3 text-destructive" /></button>
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{r.type}</div>
                        <div className="mt-2 space-y-1">
                          {r.allocations.map((a) => (
                            <div key={a.studentId} className="flex items-center justify-between text-xs bg-background/60 rounded px-2 py-1">
                              <span className="truncate"><span className="font-medium">{a.studentName}</span> <span className="font-mono text-[10px] text-muted-foreground">· {a.studentId} · Bed {a.bed}</span></span>
                              <button onClick={() => removeAlloc(r.no, a.studentId)} className="p-0.5 hover:bg-muted rounded"><Trash2 className="h-3 w-3 text-destructive" /></button>
                            </div>
                          ))}
                          {free > 0 && (
                            <Button size="sm" variant="ghost" className="w-full h-7 text-xs" onClick={() => setAllocFor({ block: b.name, room: r })}>
                              <UserPlus className="h-3 w-3" />Allocate Student ({free} bed{free > 1 ? "s" : ""})
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="allocs" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base">All Allocations</CardTitle>
                <CardDescription>{allAllocs.length} student{allAllocs.length !== 1 ? "s" : ""} allocated · {totalCapacity - occupied} vacant beds</CardDescription>
              </div>
              <Button size="sm" className="gradient-primary border-0" onClick={() => setBulkAllocOpen(true)}><UserPlus className="h-4 w-4" />Add Allocation</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>ID</TableHead><TableHead>Block</TableHead><TableHead>Room</TableHead><TableHead>Bed</TableHead><TableHead>Check-in</TableHead><TableHead>Guardian</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {allAllocs.map((a) => (
                    <TableRow key={a.studentId + a.room}>
                      <TableCell className="text-sm font-medium">{a.studentName}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{a.studentId}</TableCell>
                      <TableCell className="text-xs">{a.block}</TableCell>
                      <TableCell className="font-mono text-xs">{a.room}</TableCell>
                      <TableCell className="text-xs">{a.bed}</TableCell>
                      <TableCell className="text-xs">{a.checkin}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.guardian}</TableCell>
                      <TableCell><Button size="sm" variant="ghost" onClick={() => removeAlloc(a.room, a.studentId)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {allAllocs.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">No students allocated yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

type StudentLite = { id: string; name: string; phone?: string; parent?: string; class?: string; section?: string; admissionNo?: string };

function batchOf(s: StudentLite): string {
  const m = (s.admissionNo ?? "").match(/(\d{4})/);
  return m ? m[1] : "—";
}

function AllocateDialog({ block, room, students, onClose, onAssignMany }: {
  block: string; room: Room;
  students: StudentLite[];
  onClose: () => void; onAssignMany: (a: Allocation[]) => void;
}) {
  const usedBeds = new Set(room.allocations.map((a) => a.bed));
  const beds = ["A", "B", "C", "D", "E", "F"].slice(0, room.capacity).filter((b) => !usedBeds.has(b));
  const [query, setQuery] = useState("");
  const [fYear, setFYear] = useState<string>("all");
  const [fBatch, setFBatch] = useState<string>("all");
  const [fClass, setFClass] = useState<string>("all");
  const [fSection, setFSection] = useState<string>("all");
  const [checkin, setCheckin] = useState(new Date().toISOString().slice(0, 10));
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const classes = Array.from(new Set(students.map((s) => s.class).filter(Boolean))) as string[];
  const sections = Array.from(new Set(students.map((s) => s.section).filter(Boolean))) as string[];
  const batches = Array.from(new Set(students.map((s) => batchOf(s)))).filter((b) => b !== "—");
  const years = ["2024-25", "2025-26", "2026-27"];

  const filtered = students.filter((s) => {
    if (fClass !== "all" && s.class !== fClass) return false;
    if (fSection !== "all" && s.section !== fSection) return false;
    if (fBatch !== "all" && batchOf(s) !== fBatch) return false;
    if (query && !(s.name + " " + s.id).toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const maxPick = beds.length;
  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else if (next.size < maxPick) next.add(id);
    else toast.error(`Only ${maxPick} bed${maxPick !== 1 ? "s" : ""} available`);
    setPicked(next);
  };

  const onConfirm = () => {
    const ids = Array.from(picked);
    const allocs: Allocation[] = ids.map((id, i) => {
      const s = students.find((x) => x.id === id)!;
      return { studentId: s.id, studentName: s.name, bed: beds[i], checkin, guardian: s.phone ?? "" };
    });
    onAssignMany(allocs);
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">Allocate Students — {block} / {room.no}</DialogTitle>
          <DialogDescription>{room.type} · {beds.length} free bed{beds.length !== 1 ? "s" : ""} · Selected {picked.size}/{maxPick}. Academic Year is informational.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div className="md:col-span-1"><Label className="text-xs">Search</Label><Input placeholder="Name or ID…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
            <div><Label className="text-xs">Year</Label>
              <Select value={fYear} onValueChange={setFYear}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Years</SelectItem>{years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label className="text-xs">Batch</Label>
              <Select value={fBatch} onValueChange={setFBatch}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Batches</SelectItem>{batches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label className="text-xs">Class</Label>
              <Select value={fClass} onValueChange={setFClass}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Classes</SelectItem>{classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label className="text-xs">Section</Label>
              <Select value={fSection} onValueChange={setFSection}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>

          <div className="border rounded-md max-h-80 overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead className="w-10"></TableHead><TableHead>Student</TableHead><TableHead>ID</TableHead><TableHead>Class</TableHead><TableHead>Section</TableHead><TableHead>Batch</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => toggle(s.id)}>
                    <TableCell><input type="checkbox" checked={picked.has(s.id)} onChange={() => toggle(s.id)} /></TableCell>
                    <TableCell className="text-sm font-medium">{s.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{s.id}</TableCell>
                    <TableCell className="text-xs">{s.class}</TableCell>
                    <TableCell className="text-xs">{s.section}</TableCell>
                    <TableCell className="text-xs">{batchOf(s)}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">No students match the filters.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Check-in Date</Label><Input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} /></div>
            <div className="text-xs text-muted-foreground self-end">Beds auto-assigned: {beds.slice(0, picked.size).join(", ") || "—"}</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="gradient-primary border-0" disabled={picked.size === 0} onClick={onConfirm}>Allocate {picked.size > 0 ? `(${picked.size})` : ""}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type BlockLite = { name: string; gender: string; rooms: Room[] };

function BulkAllocateDialog({ blocks, students, onClose, onAllocate }: {
  blocks: BlockLite[];
  students: StudentLite[];
  onClose: () => void;
  onAllocate: (assignments: { block: string; roomNo: string; alloc: Allocation }[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [fClass, setFClass] = useState<string>("all");
  const [fSection, setFSection] = useState<string>("all");
  const [checkin, setCheckin] = useState(new Date().toISOString().slice(0, 10));
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [rooms, setRooms] = useState<Set<string>>(new Set());

  const classes = Array.from(new Set(students.map((s) => s.class).filter(Boolean))) as string[];
  const sections = Array.from(new Set(students.map((s) => s.section).filter(Boolean))) as string[];

  // Rooms with free beds
  const roomOptions = blocks.flatMap((b) =>
    b.rooms
      .map((r) => ({ block: b.name, gender: b.gender, no: r.no, type: r.type, capacity: r.capacity, used: r.allocations.map((a) => a.bed), free: r.capacity - r.allocations.length }))
      .filter((r) => r.free > 0),
  );

  const roomKey = (block: string, no: string) => `${block}|${no}`;
  const selectedRooms = roomOptions.filter((r) => rooms.has(roomKey(r.block, r.no)));
  const totalFreeBeds = selectedRooms.reduce((s, r) => s + r.free, 0);

  const filtered = students.filter((s) => {
    if (fClass !== "all" && s.class !== fClass) return false;
    if (fSection !== "all" && s.section !== fSection) return false;
    if (query && !(s.name + " " + s.id).toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const toggleStudent = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else if (next.size < totalFreeBeds || totalFreeBeds === 0) next.add(id);
    else { toast.error(`Only ${totalFreeBeds} free bed(s) in selected rooms`); return; }
    setPicked(next);
  };

  const toggleRoom = (key: string) => {
    const next = new Set(rooms);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setRooms(next);
  };

  const onConfirm = () => {
    if (picked.size === 0) return toast.error("Select at least one student");
    if (selectedRooms.length === 0) return toast.error("Select at least one room");
    if (picked.size > totalFreeBeds) return toast.error("Not enough beds in selected rooms");
    const ids = Array.from(picked);
    const beds = ["A", "B", "C", "D", "E", "F"];
    const assignments: { block: string; roomNo: string; alloc: Allocation }[] = [];
    let idx = 0;
    for (const r of selectedRooms) {
      const freeBeds = beds.slice(0, r.capacity).filter((b) => !r.used.includes(b));
      for (const bed of freeBeds) {
        if (idx >= ids.length) break;
        const s = students.find((x) => x.id === ids[idx])!;
        assignments.push({ block: r.block, roomNo: r.no, alloc: { studentId: s.id, studentName: s.name, bed, checkin, guardian: s.phone ?? "" } });
        idx++;
      }
      if (idx >= ids.length) break;
    }
    onAllocate(assignments);
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Add Allocation — Bulk</DialogTitle>
          <DialogDescription>
            Filter students by class & section, bulk-select them, then pick one or more rooms. Students are distributed across the selected rooms automatically. Selected {picked.size} student(s) · {totalFreeBeds} free bed(s).
          </DialogDescription>
        </DialogHeader>

        <div className="grid lg:grid-cols-2 gap-4 py-2">
          {/* Students panel */}
          <div className="space-y-3">
            <div className="font-semibold text-sm">1 · Select Students</div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-xs">Search</Label><Input placeholder="Name or ID…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
              <div><Label className="text-xs">Class</Label>
                <Select value={fClass} onValueChange={setFClass}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Classes</SelectItem>{classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Section</Label>
                <Select value={fSection} onValueChange={setFSection}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="border rounded-md max-h-72 overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead className="w-10"></TableHead><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Sec</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => toggleStudent(s.id)}>
                      <TableCell><input type="checkbox" checked={picked.has(s.id)} onChange={() => toggleStudent(s.id)} /></TableCell>
                      <TableCell className="text-sm font-medium">{s.name}<div className="font-mono text-[10px] text-muted-foreground">{s.id}</div></TableCell>
                      <TableCell className="text-xs">{s.class}</TableCell>
                      <TableCell className="text-xs">{s.section}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">No students match the filters.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Rooms panel */}
          <div className="space-y-3">
            <div className="font-semibold text-sm">2 · Select Room(s)</div>
            <div className="border rounded-md max-h-72 overflow-auto divide-y">
              {roomOptions.map((r) => {
                const key = roomKey(r.block, r.no);
                return (
                  <label key={key} className="flex items-center gap-3 p-2.5 hover:bg-muted/40 cursor-pointer">
                    <input type="checkbox" checked={rooms.has(key)} onChange={() => toggleRoom(key)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{r.no} <span className="text-[10px] text-muted-foreground">· {r.block} · {r.gender}</span></div>
                      <div className="text-[11px] text-muted-foreground">{r.type}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{r.free} free</Badge>
                  </label>
                );
              })}
              {roomOptions.length === 0 && <div className="text-center text-xs text-muted-foreground py-6">No rooms with vacant beds.</div>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Check-in Date</Label><Input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} /></div>
              <div className="text-xs text-muted-foreground self-end">{selectedRooms.length} room(s) · {totalFreeBeds} bed(s) selected</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="gradient-primary border-0" disabled={picked.size === 0 || selectedRooms.length === 0} onClick={onConfirm}>
            Allocate {picked.size > 0 ? `${picked.size} student(s)` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
