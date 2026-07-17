import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, ChevronDown, Building2, Layers, DoorOpen, Plus, Search, Trash2, Pencil, X } from "lucide-react";
import { useState } from "react";
import { KpiCard } from "@/components/kpi-card";
import { CrudDialog } from "@/components/crud-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/infrastructure")({
  head: () => ({ meta: [{ title: "Infrastructure — Edureon" }] }),
  component: InfraPage,
});

type Room = { no: string; name: string; type: string; capacity: number; status: "Active" | "Maintenance" };
type Floor = { name: string; rooms: Room[] };
type Block = { name: string; floors: Floor[] };
type Building = { name: string; code: string; purpose: string; blocks: Block[] };

const TREE: Building[] = [
  { name: "Main Academic Block", code: "MAB", purpose: "Classrooms",
    blocks: [
      { name: "Block A", floors: [
        { name: "Ground Floor", rooms: [
          { no: "G-01", name: "Class VI-A", type: "Classroom", capacity: 40, status: "Active" },
          { no: "G-02", name: "Class VI-B", type: "Classroom", capacity: 40, status: "Active" },
          { no: "G-03", name: "Staff Room", type: "Staff", capacity: 25, status: "Active" },
        ]},
        { name: "First Floor", rooms: [
          { no: "F-11", name: "Class VII-A", type: "Classroom", capacity: 40, status: "Active" },
          { no: "F-12", name: "Class VII-B", type: "Classroom", capacity: 40, status: "Active" },
          { no: "F-13", name: "Physics Lab", type: "Lab", capacity: 30, status: "Active" },
        ]},
      ]},
      { name: "Block B", floors: [
        { name: "Ground Floor", rooms: [
          { no: "B-G1", name: "Auditorium", type: "Hall", capacity: 400, status: "Active" },
          { no: "B-G2", name: "Library", type: "Library", capacity: 120, status: "Active" },
        ]},
      ]},
    ],
  },
  { name: "Science Wing", code: "SW", purpose: "Laboratories",
    blocks: [
      { name: "Lab Block", floors: [
        { name: "First Floor", rooms: [
          { no: "S-11", name: "Chemistry Lab", type: "Lab", capacity: 30, status: "Active" },
          { no: "S-12", name: "Biology Lab", type: "Lab", capacity: 30, status: "Maintenance" },
          { no: "S-13", name: "Computer Lab", type: "Lab", capacity: 35, status: "Active" },
        ]},
      ]},
    ],
  },
];

function InfraPage() {
  const [tree, setTree] = useState<Building[]>(TREE);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["Main Academic Block"]));
  const [q, setQ] = useState("");
  const [addBuilding, setAddBuilding] = useState(false);
  const [addBlockFor, setAddBlockFor] = useState<string | null>(null);
  const [addFloorFor, setAddFloorFor] = useState<{ b: string; bl: string } | null>(null);
  const [addRoomFor, setAddRoomFor] = useState<{ b: string; bl: string; f: string } | null>(null);
  const [editRoom, setEditRoom] = useState<{ b: string; bl: string; f: string; r: Room } | null>(null);

  const toggle = (k: string) => setExpanded((p) => {
    const n = new Set(p); if (n.has(k)) n.delete(k); else n.add(k); return n;
  });

  const allRooms = tree.flatMap((b) => b.blocks.flatMap((bl) => bl.floors.flatMap((f) =>
    f.rooms.map((r) => ({ ...r, building: b.name, block: bl.name, floor: f.name }))
  )));
  const filtered = allRooms.filter((r) => !q || (r.no + r.name + r.type).toLowerCase().includes(q.toLowerCase()));

  const updateTree = (mutate: (t: Building[]) => Building[]) => setTree(mutate);

  const deleteBuilding = (name: string) => { updateTree((t) => t.filter((b) => b.name !== name)); toast.success("Building removed"); };
  const deleteBlock = (b: string, bl: string) => { updateTree((t) => t.map((x) => x.name !== b ? x : { ...x, blocks: x.blocks.filter((y) => y.name !== bl) })); toast.success("Block removed"); };
  const deleteFloor = (b: string, bl: string, f: string) => { updateTree((t) => t.map((x) => x.name !== b ? x : { ...x, blocks: x.blocks.map((y) => y.name !== bl ? y : { ...y, floors: y.floors.filter((z) => z.name !== f) }) })); toast.success("Floor removed"); };
  const deleteRoom = (b: string, bl: string, f: string, no: string) => { updateTree((t) => t.map((x) => x.name !== b ? x : { ...x, blocks: x.blocks.map((y) => y.name !== bl ? y : { ...y, floors: y.floors.map((z) => z.name !== f ? z : { ...z, rooms: z.rooms.filter((r) => r.no !== no) }) }) })); toast.success("Room removed"); };

  return (
    <PageContainer>
      <PageHeader eyebrow="Admin · Operations" title="Infrastructure"
        description="Buildings, blocks, floors, and rooms. Build out your campus tree with unlimited depth."
        actions={<Button size="sm" className="gradient-primary border-0" onClick={() => setAddBuilding(true)}><Plus className="h-4 w-4" />Add Building</Button>}
      />

      <UnifiedBuildingDialog
        open={addBuilding}
        onOpenChange={setAddBuilding}
        onSubmit={(b) => {
          updateTree((p) => [...p, b]);
          toast.success(`Added "${b.name}" with ${b.blocks.length} block(s)`);
          setExpanded((p) => new Set(p).add(b.name));
        }}
      />

      {addBlockFor && (
        <CrudDialog open onOpenChange={(v) => !v && setAddBlockFor(null)} title={`Add Block — ${addBlockFor}`}
          fields={[{ name: "name", label: "Block Name" }]} submitLabel="Add Block"
          onSubmit={(d) => { const ref = addBlockFor; updateTree((t) => t.map((x) => x.name !== ref ? x : { ...x, blocks: [...x.blocks, { name: String(d.name), floors: [] }] })); setAddBlockFor(null); }}
        />
      )}

      {addFloorFor && (
        <CrudDialog open onOpenChange={(v) => !v && setAddFloorFor(null)} title={`Add Floor — ${addFloorFor.b} / ${addFloorFor.bl}`}
          fields={[{ name: "name", label: "Floor Name", type: "select", options: ["Basement", "Ground Floor", "First Floor", "Second Floor", "Third Floor", "Fourth Floor", "Fifth Floor", "Terrace"] }]}
          submitLabel="Add Floor"
          onSubmit={(d) => { const ref = addFloorFor; updateTree((t) => t.map((x) => x.name !== ref.b ? x : { ...x, blocks: x.blocks.map((y) => y.name !== ref.bl ? y : { ...y, floors: [...y.floors, { name: String(d.name), rooms: [] }] }) })); setAddFloorFor(null); }}
        />
      )}

      {addRoomFor && (
        <CrudDialog open onOpenChange={(v) => !v && setAddRoomFor(null)}
          title={`Add Room — ${addRoomFor.b} / ${addRoomFor.bl} / ${addRoomFor.f}`}
          fields={[
            { name: "no", label: "Room No." },
            { name: "name", label: "Room Name" },
            { name: "type", label: "Type", type: "select", options: ["Classroom", "Lab", "Staff", "Hall", "Library", "Office", "Hostel", "Storage"] },
            { name: "capacity", label: "Capacity", type: "number" },
            { name: "status", label: "Status", type: "select", options: ["Active", "Maintenance"] },
          ]}
          submitLabel="Add Room"
          onSubmit={(d) => {
            const ref = addRoomFor;
            const room: Room = { no: String(d.no), name: String(d.name), type: String(d.type), capacity: Number(d.capacity) || 30, status: (String(d.status) as Room["status"]) || "Active" };
            updateTree((p) => p.map((b) => b.name !== ref.b ? b : { ...b, blocks: b.blocks.map((bl) => bl.name !== ref.bl ? bl : { ...bl, floors: bl.floors.map((f) => f.name !== ref.f ? f : { ...f, rooms: [...f.rooms, room] }) }) }));
            setAddRoomFor(null);
          }}
        />
      )}

      {editRoom && (
        <CrudDialog open onOpenChange={(v) => !v && setEditRoom(null)}
          title={`Edit Room — ${editRoom.r.no}`}
          initial={{ no: editRoom.r.no, name: editRoom.r.name, type: editRoom.r.type, capacity: editRoom.r.capacity, status: editRoom.r.status }}
          fields={[
            { name: "no", label: "Room No." },
            { name: "name", label: "Room Name" },
            { name: "type", label: "Type", type: "select", options: ["Classroom", "Lab", "Staff", "Hall", "Library", "Office", "Hostel", "Storage"] },
            { name: "capacity", label: "Capacity", type: "number" },
            { name: "status", label: "Status", type: "select", options: ["Active", "Maintenance"] },
          ]}
          submitLabel="Save"
          onSubmit={(d) => {
            const ref = editRoom;
            updateTree((p) => p.map((b) => b.name !== ref.b ? b : { ...b, blocks: b.blocks.map((bl) => bl.name !== ref.bl ? bl : { ...bl, floors: bl.floors.map((f) => f.name !== ref.f ? f : { ...f, rooms: f.rooms.map((r) => r.no !== ref.r.no ? r : { no: String(d.no), name: String(d.name), type: String(d.type), capacity: Number(d.capacity) || 30, status: String(d.status) as Room["status"] }) }) }) }));
            setEditRoom(null);
          }}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Buildings" value={tree.length} icon={<Building2 className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Floors" value={tree.flatMap((b) => b.blocks.flatMap((bl) => bl.floors)).length} icon={<Layers className="h-5 w-5" />} tone="info" />
        <KpiCard label="Rooms" value={allRooms.length} icon={<DoorOpen className="h-5 w-5" />} tone="success" />
        <KpiCard label="In Maintenance" value={allRooms.filter((r) => r.status === "Maintenance").length} icon={<DoorOpen className="h-5 w-5" />} tone="warning" />
      </div>

      <Tabs defaultValue="tree" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tree">Campus Tree</TabsTrigger>
          <TabsTrigger value="rooms">All Rooms</TabsTrigger>
        </TabsList>

        <TabsContent value="tree">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Buildings → Blocks → Floors → Rooms</CardTitle>
              <CardDescription>Add unlimited blocks, floors and rooms in each building. Hover for actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {tree.map((b) => {
                const bKey = b.name; const bOpen = expanded.has(bKey);
                const roomCount = b.blocks.flatMap((bl) => bl.floors.flatMap((f) => f.rooms)).length;
                return (
                  <div key={bKey} className="group/b">
                    <div className="w-full flex items-center gap-2 p-2.5 rounded-md hover:bg-muted/50">
                      <button onClick={() => toggle(bKey)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                        {bOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-medium">{b.name}</span>
                        <Badge variant="outline" className="text-[10px]">{b.code}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{b.purpose}</Badge>
                        <span className="ml-auto text-xs text-muted-foreground">{b.blocks.length} blocks · {roomCount} rooms</span>
                      </button>
                      <Button size="sm" variant="ghost" onClick={() => setAddBlockFor(b.name)}><Plus className="h-3.5 w-3.5" />Block</Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteBuilding(b.name)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                    {bOpen && b.blocks.map((bl) => {
                      const blKey = bKey + "/" + bl.name; const blOpen = expanded.has(blKey);
                      return (
                        <div key={blKey} className="ml-6">
                          <div className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                            <button onClick={() => toggle(blKey)} className="flex items-center gap-2 flex-1 text-left">
                              {blOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              <span className="text-sm font-medium">{bl.name}</span>
                              <span className="ml-auto text-[10px] text-muted-foreground">{bl.floors.length} floors</span>
                            </button>
                            <Button size="sm" variant="ghost" onClick={() => setAddFloorFor({ b: b.name, bl: bl.name })}><Plus className="h-3 w-3" />Floor</Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteBlock(b.name, bl.name)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                          </div>
                          {blOpen && bl.floors.map((f) => {
                            const fKey = blKey + "/" + f.name; const fOpen = expanded.has(fKey);
                            return (
                              <div key={fKey} className="ml-6">
                                <div className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                                  <button onClick={() => toggle(fKey)} className="flex items-center gap-2 flex-1 text-left">
                                    {fOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-sm">{f.name}</span>
                                    <span className="ml-auto text-[10px] text-muted-foreground">{f.rooms.length} rooms</span>
                                  </button>
                                  <Button size="sm" variant="ghost" onClick={() => setAddRoomFor({ b: b.name, bl: bl.name, f: f.name })}><Plus className="h-3 w-3" />Room</Button>
                                  <Button size="sm" variant="ghost" onClick={() => deleteFloor(b.name, bl.name, f.name)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                                </div>
                                {fOpen && (
                                  <div className="ml-6 grid grid-cols-2 md:grid-cols-3 gap-2 p-2">
                                    {f.rooms.map((r) => (
                                      <div key={r.no} className="border rounded-md p-2.5 text-xs hover:bg-muted/40 group/r">
                                        <div className="flex items-center justify-between">
                                          <span className="font-mono text-[10px] text-muted-foreground">{r.no}</span>
                                          <div className="flex items-center gap-0.5">
                                            <Badge variant={r.status === "Active" ? "secondary" : "outline"} className="text-[9px]">{r.status}</Badge>
                                            <button onClick={() => setEditRoom({ b: b.name, bl: bl.name, f: f.name, r })} className="opacity-0 group-hover/r:opacity-100 p-1 hover:bg-muted rounded"><Pencil className="h-3 w-3" /></button>
                                            <button onClick={() => deleteRoom(b.name, bl.name, f.name, r.no)} className="opacity-0 group-hover/r:opacity-100 p-1 hover:bg-muted rounded"><Trash2 className="h-3 w-3 text-destructive" /></button>
                                          </div>
                                        </div>
                                        <div className="font-medium mt-0.5">{r.name}</div>
                                        <div className="text-[10px] text-muted-foreground">{r.type} · cap {r.capacity}</div>
                                      </div>
                                    ))}
                                    <button onClick={() => setAddRoomFor({ b: b.name, bl: bl.name, f: f.name })} className="border border-dashed rounded-md p-2.5 text-xs hover:bg-primary/5 hover:border-primary/40 flex items-center justify-center gap-1 text-muted-foreground">
                                      <Plus className="h-3.5 w-3.5" />Add Room
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {blOpen && bl.floors.length === 0 && (
                            <div className="ml-6 p-2"><Button size="sm" variant="outline" onClick={() => setAddFloorFor({ b: b.name, bl: bl.name })}><Plus className="h-3 w-3" />Add first floor</Button></div>
                          )}
                        </div>
                      );
                    })}
                    {bOpen && b.blocks.length === 0 && (
                      <div className="ml-6 p-2"><Button size="sm" variant="outline" onClick={() => setAddBlockFor(b.name)}><Plus className="h-3 w-3" />Add first block</Button></div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms">
          <Card className="border-border/60">
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <div><CardTitle className="font-display text-base">All Rooms</CardTitle><CardDescription>Searchable across the campus.</CardDescription></div>
              <div className="relative w-64">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search room…" className="pl-8 h-9" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Room</TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Floor</TableHead><TableHead>Building</TableHead><TableHead className="text-right">Capacity</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.building + r.no}>
                      <TableCell className="font-mono text-xs">{r.no}</TableCell>
                      <TableCell className="text-sm font-medium">{r.name}</TableCell>
                      <TableCell className="text-xs">{r.type}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.floor}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.building}</TableCell>
                      <TableCell className="text-right text-sm">{r.capacity}</TableCell>
                      <TableCell><Badge variant="outline" className={r.status === "Active" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}>{r.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

const ROOM_TYPES = ["Classroom", "Lab", "Staff", "Hall", "Library", "Office", "Hostel", "Storage"];
const FLOOR_NAMES = ["Basement", "Ground Floor", "First Floor", "Second Floor", "Third Floor", "Fourth Floor", "Fifth Floor", "Terrace"];
const PURPOSES = ["Classrooms", "Laboratories", "Administration", "Sports", "Hostel", "Other"];

const emptyRoom = (i: number): Room => ({ no: `R-${String(i).padStart(2, "0")}`, name: "", type: "Classroom", capacity: 40, status: "Active" });
const emptyFloor = (): Floor => ({ name: "Ground Floor", rooms: [emptyRoom(1)] });
const emptyBlock = (): Block => ({ name: "Block A", floors: [emptyFloor()] });
const emptyBuilding = (): Building => ({ name: "", code: "", purpose: "Classrooms", blocks: [emptyBlock()] });

function UnifiedBuildingDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (b: Building) => void;
}) {
  const [b, setB] = useState<Building>(emptyBuilding());

  const reset = () => setB(emptyBuilding());
  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) reset();
  };

  const patchBlock = (bi: number, p: Partial<Block>) =>
    setB((x) => ({ ...x, blocks: x.blocks.map((bl, i) => (i === bi ? { ...bl, ...p } : bl)) }));
  const patchFloor = (bi: number, fi: number, p: Partial<Floor>) =>
    setB((x) => ({
      ...x,
      blocks: x.blocks.map((bl, i) =>
        i === bi ? { ...bl, floors: bl.floors.map((f, j) => (j === fi ? { ...f, ...p } : f)) } : bl,
      ),
    }));
  const patchRoom = (bi: number, fi: number, ri: number, p: Partial<Room>) =>
    setB((x) => ({
      ...x,
      blocks: x.blocks.map((bl, i) =>
        i === bi
          ? {
              ...bl,
              floors: bl.floors.map((f, j) =>
                j === fi ? { ...f, rooms: f.rooms.map((r, k) => (k === ri ? { ...r, ...p } : r)) } : f,
              ),
            }
          : bl,
      ),
    }));

  const submit = () => {
    if (!b.name.trim()) return toast.error("Building name is required");
    if (!b.code.trim()) return toast.error("Building code is required");
    onSubmit(b);
    close(false);
  };

  const totalRooms = b.blocks.reduce((s, bl) => s + bl.floors.reduce((t, f) => t + f.rooms.length, 0), 0);
  const totalFloors = b.blocks.reduce((s, bl) => s + bl.floors.length, 0);

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Add Building</DialogTitle>
          <DialogDescription>
            Set up everything in one go — blocks, floors and rooms. Add as many as you need.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Building Name</Label>
            <Input value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} placeholder="e.g. Main Academic Block" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Code</Label>
            <Input value={b.code} onChange={(e) => setB({ ...b, code: e.target.value })} placeholder="e.g. MAB" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Purpose</Label>
            <Select value={b.purpose} onValueChange={(v) => setB({ ...b, purpose: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PURPOSES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex items-center gap-4">
          <span><Building2 className="inline h-3.5 w-3.5 mr-1" />{b.blocks.length} block(s)</span>
          <span><Layers className="inline h-3.5 w-3.5 mr-1" />{totalFloors} floor(s)</span>
          <span><DoorOpen className="inline h-3.5 w-3.5 mr-1" />{totalRooms} room(s)</span>
        </div>

        <div className="space-y-3">
          {b.blocks.map((bl, bi) => (
            <div key={bi} className="border rounded-md p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <Input
                  value={bl.name}
                  onChange={(e) => patchBlock(bi, { name: e.target.value })}
                  className="h-8 max-w-xs"
                  placeholder="Block name"
                />
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  {bl.floors.length} floors · {bl.floors.reduce((s, f) => s + f.rooms.length, 0)} rooms
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setB((x) => ({ ...x, blocks: x.blocks.filter((_, i) => i !== bi) }))}
                  disabled={b.blocks.length === 1}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>

              {bl.floors.map((f, fi) => (
                <div key={fi} className="ml-3 border-l-2 pl-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    <Select value={f.name} onValueChange={(v) => patchFloor(bi, fi, { name: v })}>
                      <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FLOOR_NAMES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <span className="text-[11px] text-muted-foreground">{f.rooms.length} rooms</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto h-7"
                      onClick={() =>
                        patchBlock(bi, {
                          floors: [...bl.floors, emptyFloor()],
                        })
                      }
                    >
                      <Plus className="h-3 w-3" />Floor
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      onClick={() => patchBlock(bi, { floors: bl.floors.filter((_, i) => i !== fi) })}
                      disabled={bl.floors.length === 1}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-12 gap-1.5 text-[10px] text-muted-foreground px-1">
                    <div className="col-span-2">Room No.</div>
                    <div className="col-span-3">Name</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Capacity</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1" />
                  </div>
                  {f.rooms.map((r, ri) => (
                    <div key={ri} className="grid grid-cols-12 gap-1.5 items-center">
                      <Input className="col-span-2 h-8" value={r.no} onChange={(e) => patchRoom(bi, fi, ri, { no: e.target.value })} />
                      <Input className="col-span-3 h-8" value={r.name} placeholder="Room name" onChange={(e) => patchRoom(bi, fi, ri, { name: e.target.value })} />
                      <div className="col-span-2">
                        <Select value={r.type} onValueChange={(v) => patchRoom(bi, fi, ri, { type: v })}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>{ROOM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <Input
                        className="col-span-2 h-8"
                        type="number"
                        value={r.capacity}
                        onChange={(e) => patchRoom(bi, fi, ri, { capacity: Number(e.target.value) || 0 })}
                      />
                      <div className="col-span-2">
                        <Select value={r.status} onValueChange={(v) => patchRoom(bi, fi, ri, { status: v as Room["status"] })}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 col-span-1"
                        onClick={() => patchFloor(bi, fi, { rooms: f.rooms.filter((_, i) => i !== ri) })}
                        disabled={f.rooms.length === 1}
                      >
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7"
                    onClick={() => patchFloor(bi, fi, { rooms: [...f.rooms, emptyRoom(f.rooms.length + 1)] })}
                  >
                    <Plus className="h-3 w-3" />Add Room
                  </Button>
                </div>
              ))}

              <Button
                size="sm"
                variant="outline"
                onClick={() => patchBlock(bi, { floors: [...bl.floors, emptyFloor()] })}
              >
                <Plus className="h-3 w-3" />Add Floor
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setB((x) => ({ ...x, blocks: [...x.blocks, { ...emptyBlock(), name: `Block ${String.fromCharCode(65 + x.blocks.length)}` }] }))}
          >
            <Plus className="h-4 w-4" />Add Block
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
          <Button className="gradient-primary border-0" onClick={submit}>
            Create Building ({b.blocks.length} blocks · {totalRooms} rooms)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
