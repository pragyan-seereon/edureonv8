import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarDays, Sparkles, Download, Printer, AlertTriangle, RefreshCw, Trash2, Lock, Unlock, Copy, Send, Archive, CheckCircle2, Settings2, Plus, X, RotateCcw } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTimetable, useTimetableMeta, timetableApi, type TtCell } from "@/lib/store";
import { useTtConfig, SUBJECT_PALETTE, defaultTtConfig, type TtConfig, type SubjectCfg } from "@/lib/timetable-config";
import { ConflictResolveDialog } from "@/components/conflict-resolve-dialog";
import { ExcelUpload } from "@/components/excel-upload";
import { BarChart3, UserX } from "lucide-react";

export const Route = createFileRoute("/timetable")({
  head: () => ({ meta: [{ title: "Timetable — Edureon ERP" }] }),
  component: TimetablePage,
});

function TimetablePage() {
  const overrides = useTimetable();
  const meta = useTimetableMeta();
  const { config, setConfig, reset: resetConfig } = useTtConfig();
  const { days, periods, classes: ALL_CLASSES, subjects, teachers, rooms, blockedRooms, unavailableTeachers, breakPeriods, breakLabels } = config;

  const isBreak = (p: number) => breakPeriods.includes(p);
  const breakLabel = (p: number) => breakLabels[p] || "Break";

  const [klass, setKlass] = useState(ALL_CLASSES[0] || "X-B");
  const [view, setView] = useState("class");
  const [editing, setEditing] = useState<{ day: number; period: number } | null>(null);
  const [draft, setDraft] = useState({ subject: subjects[0]?.name || "", teacher: teachers[0] || "", room: rooms[0] || "" });
  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneFrom, setCloneFrom] = useState(ALL_CLASSES[0]);
  const [dragging, setDragging] = useState<{ day: number; period: number } | null>(null);
  const [resolveConflict, setResolveConflict] = useState<null | { type: string; severity: "high" | "med"; what: string; when: string; klass: string; day: number; period: number }>(null);

  function defaultCell(kls: string, d: number, p: number): TtCell {
    const seed = (kls.charCodeAt(0) || 65);
    const sIdx = subjects.length ? (d * 7 + p * 3 + seed) % subjects.length : 0;
    const tIdx = teachers.length ? (d + p + seed) % teachers.length : 0;
    const rIdx = rooms.length ? (d * 2 + p + seed) % rooms.length : 0;
    return {
      subject: subjects[sIdx]?.name || "—",
      teacher: teachers[tIdx] || "—",
      room: rooms[rIdx] || "—",
    };
  }
  const subjectColor = (name: string) =>
    subjects.find((s) => s.name === name)?.color ?? "bg-muted text-foreground border-border";

  const getDef = (d: number, p: number) => defaultCell(klass, d, p);
  const getCell = (kls: string, d: number, p: number): TtCell =>
    overrides[`${kls}:${d}:${p}`] ?? defaultCell(kls, d, p);

  const effective = useMemo(() => {
    const grid: { klass: string; day: number; period: number; cell: TtCell }[] = [];
    ALL_CLASSES.forEach((k) => {
      for (let d = 0; d < days.length; d++) for (let p = 0; p < periods.length; p++) {
        if (isBreak(p)) continue;
        grid.push({ klass: k, day: d, period: p, cell: getCell(k, d, p) });
      }
    });
    return grid;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrides, config]);

  const conflicts = useMemo(() => {
    const out: { type: string; severity: "high" | "med"; what: string; when: string; klass: string; day: number; period: number }[] = [];
    const tMap = new Map<string, typeof effective>();
    const rMap = new Map<string, typeof effective>();
    effective.forEach((e) => {
      const tk = `${e.cell.teacher}:${e.day}:${e.period}`;
      const rk = `${e.cell.room}:${e.day}:${e.period}`;
      if (!tMap.has(tk)) tMap.set(tk, []);
      if (!rMap.has(rk)) rMap.set(rk, []);
      tMap.get(tk)!.push(e); rMap.get(rk)!.push(e);
    });
    tMap.forEach((list) => {
      if (list.length > 1) {
        const [a, b] = list;
        out.push({ type: "Teacher", severity: "high", what: `${a.cell.teacher} double-booked`, when: `${days[a.day]} · ${periods[a.period]}`, klass: `${a.klass} vs ${b.klass}`, day: a.day, period: a.period });
      }
    });
    rMap.forEach((list) => {
      if (list.length > 1) {
        const [a, b] = list;
        out.push({ type: "Room", severity: "med", what: `${a.cell.room} overlap`, when: `${days[a.day]} · ${periods[a.period]}`, klass: `${a.klass} vs ${b.klass}`, day: a.day, period: a.period });
      }
    });
    effective.forEach((e) => {
      if ((blockedRooms[e.cell.room] || []).includes(e.day)) out.push({ type: "Blocked Room", severity: "med", what: `${e.cell.room} is blocked`, when: `${days[e.day]} · ${periods[e.period]}`, klass: e.klass, day: e.day, period: e.period });
      if ((unavailableTeachers[e.cell.teacher] || []).includes(e.day)) out.push({ type: "Unavailable Teacher", severity: "high", what: `${e.cell.teacher} unavailable`, when: `${days[e.day]} · ${periods[e.period]}`, klass: e.klass, day: e.day, period: e.period });
    });
    const load = new Map<string, number>();
    effective.forEach((e) => load.set(e.cell.teacher, (load.get(e.cell.teacher) || 0) + 1));
    load.forEach((v, t) => { if (v > config.overloadThreshold) out.push({ type: "Overload", severity: "high", what: `${t} overloaded — ${v} periods`, when: "Week", klass: "—", day: 0, period: 0 }); });
    return out;
  }, [effective, config, days, periods, blockedRooms, unavailableTeachers]);

  const teacherLoad = useMemo(() => {
    const m = new Map<string, number>();
    effective.forEach((e) => m.set(e.cell.teacher, (m.get(e.cell.teacher) || 0) + 1));
    return teachers.map((t) => ({ teacher: t, load: m.get(t) || 0 }));
  }, [effective, teachers]);

  const roomUtil = useMemo(() => {
    const total = days.length * Math.max(periods.length - breakPeriods.length, 1) * Math.max(ALL_CLASSES.length, 1);
    const m = new Map<string, number>();
    effective.forEach((e) => m.set(e.cell.room, (m.get(e.cell.room) || 0) + 1));
    return rooms.map((r) => ({ room: r, pct: Math.round(((m.get(r) || 0) / (total / Math.max(rooms.length, 1))) * 100) }));
  }, [effective, rooms, days.length, periods.length, breakPeriods.length, ALL_CLASSES.length]);

  const freePeriods = useMemo(() => {
    const counts: number[] = [];
    for (let p = 0; p < periods.length; p++) {
      if (isBreak(p)) continue;
      const set = new Set<string>();
      for (let d = 0; d < days.length; d++) set.add(getCell(klass, d, p).subject);
      counts.push(set.size);
    }
    const avg = counts.reduce((a, b) => a + b, 0) / Math.max(counts.length, 1);
    return { avgVariety: avg.toFixed(1), balanced: counts.filter((c) => c >= 3).length, total: counts.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrides, klass, config]);

  const openEdit = (d: number, p: number) => {
    if (isBreak(p)) return;
    const c = getCell(klass, d, p);
    setDraft({ subject: c.subject, teacher: c.teacher, room: c.room });
    setEditing({ day: d, period: p });
  };
  const saveEdit = () => {
    if (!editing) return;
    const cur = getCell(klass, editing.day, editing.period);
    if (cur.locked) return toast.error("Period is locked — unlock to edit");
    timetableApi.set(klass, editing.day, editing.period, { ...draft, locked: cur.locked });
    toast.success(`${klass} · ${days[editing.day]} ${periods[editing.period]} updated`);
    setEditing(null);
  };
  const clearEdit = () => {
    if (!editing) return;
    timetableApi.clear(klass, editing.day, editing.period);
    toast.success("Reset to default");
    setEditing(null);
  };
  const toggleLock = () => {
    if (!editing) return;
    const cur = getCell(klass, editing.day, editing.period);
    timetableApi.lock(klass, editing.day, editing.period, !cur.locked, getDef);
    toast.success(cur.locked ? "Period unlocked" : "Period locked");
    setEditing(null);
  };
  const onDragStart = (d: number, p: number) => () => setDragging({ day: d, period: p });
  const onDrop = (d: number, p: number) => (ev: React.DragEvent) => {
    ev.preventDefault();
    if (!dragging || isBreak(p)) return;
    if (dragging.day === d && dragging.period === p) return;
    timetableApi.swap(klass, dragging.day, dragging.period, d, p, getDef);
    toast.success(`Swapped ${days[dragging.day]} ${periods[dragging.period]} ↔ ${days[d]} ${periods[p]}`);
    setDragging(null);
  };

  const klassMeta = meta[klass] || {};
  const exportCsv = () => {
    const rows = [["Day", "Period", "Subject", "Teacher", "Room", "Locked"]];
    for (let d = 0; d < days.length; d++) for (let p = 0; p < periods.length; p++) {
      if (isBreak(p)) continue;
      const c = getCell(klass, d, p);
      rows.push([days[d], periods[p], c.subject, c.teacher, c.room, c.locked ? "Yes" : "No"]);
    }
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `timetable-${klass}.csv`; a.click(); URL.revokeObjectURL(url);
    toast.success("Timetable exported");
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Academic"
        title="Timetable Engine"
        description="Fully configurable scheduling — define your own days, periods, subjects, teachers, rooms and constraints."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</Button>
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4" />Export</Button>
            <Button variant="outline" size="sm" onClick={() => setCloneOpen(true)}><Copy className="h-4 w-4" />Clone</Button>
            <Button variant="outline" size="sm" onClick={() => { timetableApi.archive(klass, !klassMeta.archived); toast.success(klassMeta.archived ? "Restored" : "Archived"); }}>
              <Archive className="h-4 w-4" />{klassMeta.archived ? "Restore" : "Archive"}
            </Button>
            <Button size="sm" className="gradient-primary border-0" onClick={() => { timetableApi.publish(klass); toast.success(`${klass} timetable published`); }}>
              <Send className="h-4 w-4" />Publish
            </Button>
          </>
        }
      />

      <TimetableTypeBar />


      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Periods Scheduled" value={(days.length * Math.max(periods.length - breakPeriods.length, 0)).toString()} icon={<CalendarDays className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Active Conflicts" value={conflicts.length.toString()} icon={<AlertTriangle className="h-5 w-5" />} tone={conflicts.length ? "warning" : "success"} />
        <KpiCard label="Manual Overrides" value={Object.keys(overrides).filter((k) => k.startsWith(klass + ":")).length.toString()} icon={<RefreshCw className="h-5 w-5" />} tone="info" />
        <KpiCard label={klassMeta.published ? `Published v${klassMeta.version || 1}` : "Status"} value={klassMeta.archived ? "Archived" : klassMeta.published ? "Live" : "Draft"} icon={<CheckCircle2 className="h-5 w-5" />} tone={klassMeta.published ? "success" : "warning"} />
      </div>

      <Tabs value={view} onValueChange={setView} className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="class">Class View</TabsTrigger>
            <TabsTrigger value="teacher">Teacher View</TabsTrigger>
            <TabsTrigger value="room">Room View</TabsTrigger>
            <TabsTrigger value="conflicts">Conflicts {conflicts.length > 0 && <Badge variant="destructive" className="ml-1.5 h-4 px-1 text-[10px]">{conflicts.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="balance">Free-Period Balance</TabsTrigger>
            <TabsTrigger value="configure"><Settings2 className="h-3.5 w-3.5 mr-1" />Configure</TabsTrigger>
          </TabsList>
          {view !== "configure" && (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Class</Label>
              <Select value={klass} onValueChange={setKlass}>
                <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={() => { timetableApi.resetClass(klass); toast.success("Reset to defaults"); }}>
                <Trash2 className="h-4 w-4" />Reset All
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast.info("Auto-schedule suggested — review manually before publishing")}>
                <Sparkles className="h-4 w-4" />Auto-suggest
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="class">
          <Card className="border-border/60">
            <CardContent className="p-0 overflow-auto">
              <div className="min-w-[900px] grid" style={{ gridTemplateColumns: `90px repeat(${days.length}, 1fr)` }}>
                <div className="bg-muted/40 p-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-r">Period</div>
                {days.map((d) => (
                  <div key={d} className="bg-muted/40 p-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b text-center">{d}</div>
                ))}
                {periods.map((p, pi) => (
                  <Fragment key={`row-${pi}`}>
                    <div className="p-3 text-xs font-medium text-muted-foreground border-b border-r">{p}</div>
                    {days.map((_, di) => {
                      if (isBreak(pi)) return (
                        <div key={`${di}-${pi}`} className="p-2 border-b text-[10px] uppercase tracking-wider text-muted-foreground text-center bg-muted/20">{breakLabel(pi)}</div>
                      );
                      const cell = getCell(klass, di, pi);
                      const isOverride = !!overrides[`${klass}:${di}:${pi}`];
                      const hasConflict = conflicts.some((c) => c.day === di && c.period === pi && (c.klass.includes(klass) || c.klass === klass));
                      return (
                        <div key={`${di}-${pi}`} className="p-2 border-b">
                          <div
                            draggable={!cell.locked}
                            onDragStart={onDragStart(di, pi)}
                            onDragOver={(ev) => { ev.preventDefault(); }}
                            onDrop={onDrop(di, pi)}
                            className={`relative rounded-md border px-2 py-1.5 cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-primary/40 transition ${subjectColor(cell.subject)} ${isOverride ? "ring-1 ring-primary" : ""} ${hasConflict ? "ring-2 ring-destructive" : ""} ${cell.locked ? "opacity-90" : ""}`}
                          >
                            <button type="button" onClick={() => openEdit(di, pi)} className="w-full text-left">
                              <div className="text-[11px] font-semibold leading-tight flex items-center gap-1">
                                {cell.subject}
                                {cell.locked && <Lock className="h-2.5 w-2.5" />}
                              </div>
                              <div className="text-[10px] opacity-80 truncate">{cell.teacher}</div>
                              <div className="text-[10px] opacity-70">{cell.room}</div>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
              <div className="p-3 text-[11px] text-muted-foreground border-t flex items-center gap-4">
                <span>Click to edit · Drag to swap · Conflicts highlighted in red</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teacher">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Teacher Workload</CardTitle><CardDescription>Periods per week vs cap ({config.teacherWeeklyCap}) — computed across all classes</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {teacherLoad.map((t) => {
                const over = t.load > config.overloadThreshold;
                return (
                  <div key={t.teacher} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/40">
                    <div className="w-44 text-sm font-medium">{t.teacher}</div>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${over ? "bg-destructive" : "bg-primary"}`} style={{ width: `${Math.min((t.load / config.teacherWeeklyCap) * 100, 100)}%` }} />
                    </div>
                    <div className="w-16 text-right text-sm tabular-nums">{t.load}/{config.teacherWeeklyCap}</div>
                    {over && <Badge variant="destructive" className="text-[10px]">Overloaded</Badge>}
                    {(unavailableTeachers[t.teacher] || []).length > 0 && <Badge variant="outline" className="text-[10px]">Off {(unavailableTeachers[t.teacher] || []).map((d) => days[d]).join(",")}</Badge>}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="room">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Room Utilization</CardTitle><CardDescription>Computed across all classes for the week</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {roomUtil.map((r) => (
                <div key={r.room} className="p-4 rounded-lg border border-border/60">
                  <div className="text-sm font-semibold flex items-center justify-between">
                    {r.room}
                    {(blockedRooms[r.room] || []).length > 0 && (
                      <Badge variant="destructive" className="text-[10px]">Blocked {(blockedRooms[r.room] || []).map((d) => days[d]).join(",")}</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">Capacity 40</div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-info" style={{ width: `${Math.min(r.pct, 100)}%` }} />
                  </div>
                  <div className="mt-1 text-xs">{r.pct}% utilized</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts">
          <Card className="border-border/60">
            <CardContent className="p-0">
              {conflicts.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No conflicts detected ✓</div>}
              {conflicts.map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-4 border-b last:border-0">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${c.severity === "high" ? "text-destructive" : "text-warning"}`} />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{c.what}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{c.when} · {c.klass}</div>
                  </div>
                  <Badge variant={c.severity === "high" ? "destructive" : "outline"} className="text-[10px]">{c.type}</Badge>
                  <Button size="sm" variant="outline" onClick={() => setResolveConflict(c)}>Resolve</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Free-Period Balance — {klass}</CardTitle><CardDescription>Subject variety spread across each period slot for this class</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-md bg-muted/40"><div className="text-xs text-muted-foreground">Avg variety / slot</div><div className="text-xl font-semibold">{freePeriods.avgVariety}</div></div>
                <div className="p-3 rounded-md bg-muted/40"><div className="text-xs text-muted-foreground">Balanced slots</div><div className="text-xl font-semibold">{freePeriods.balanced}/{freePeriods.total}</div></div>
                <div className="p-3 rounded-md bg-muted/40"><div className="text-xs text-muted-foreground">Recommendation</div><div className="text-xs">{freePeriods.balanced === freePeriods.total ? "Well balanced" : "Consider distributing core subjects across mornings"}</div></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configure">
          <ConfigurePanel config={config} setConfig={setConfig} onReset={() => { resetConfig(); toast.success("Configuration reset to defaults"); }} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Edit Period</DialogTitle>
            <DialogDescription>
              {editing && <>{klass} · {days[editing.day]} · {periods[editing.period]}</>}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Subject</Label>
              <Select value={draft.subject} onValueChange={(v) => setDraft({ ...draft, subject: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{subjects.map((s) => <SelectItem key={s.code} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Teacher</Label>
              <Select value={draft.teacher} onValueChange={(v) => setDraft({ ...draft, teacher: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{teachers.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Room</Label>
              <Select value={draft.room} onValueChange={(v) => setDraft({ ...draft, room: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{rooms.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Or custom room</Label>
              <Input value={draft.room} onChange={(e) => setDraft({ ...draft, room: e.target.value })} placeholder="e.g. R-205" />
            </div>
          </div>
          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="ghost" onClick={clearEdit}><Trash2 className="h-4 w-4" />Reset</Button>
            <Button variant="outline" onClick={toggleLock}>
              {editing && getCell(klass, editing.day, editing.period).locked ? <><Unlock className="h-4 w-4" />Unlock</> : <><Lock className="h-4 w-4" />Lock</>}
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit} className="gradient-primary border-0">Save Period</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cloneOpen} onOpenChange={setCloneOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Clone Timetable</DialogTitle>
            <DialogDescription>Copy all manual overrides from another class to <b>{klass}</b>. Existing overrides will be replaced.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs text-muted-foreground">Source class</Label>
            <Select value={cloneFrom} onValueChange={setCloneFrom}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ALL_CLASSES.filter((c) => c !== klass).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneOpen(false)}>Cancel</Button>
            <Button className="gradient-primary border-0" onClick={() => { timetableApi.clone(cloneFrom, klass); toast.success(`Cloned ${cloneFrom} → ${klass}`); setCloneOpen(false); }}>
              <Copy className="h-4 w-4" />Clone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConflictResolveDialog
        open={!!resolveConflict}
        onOpenChange={(v) => { if (!v) setResolveConflict(null); }}
        conflict={resolveConflict}
        subjects={subjects.map((s) => s.name)}
        teachers={teachers}
        rooms={rooms}
        initial={resolveConflict ? { subject: getCell(klass, resolveConflict.day, resolveConflict.period).subject, teacher: getCell(klass, resolveConflict.day, resolveConflict.period).teacher, room: getCell(klass, resolveConflict.day, resolveConflict.period).room } : undefined}
        validate={(p) => {
          if (!resolveConflict) return null;
          const { day, period } = resolveConflict;
          const clash = effective.find((e) => e.day === day && e.period === period && e.klass !== klass && (e.cell.teacher === p.teacher || e.cell.room === p.room));
          if (clash) return `${p.teacher === clash.cell.teacher ? "Teacher" : "Room"} still clashes with ${clash.klass} at ${days[day]} · ${periods[period]}`;
          if ((unavailableTeachers[p.teacher] || []).includes(day)) return `${p.teacher} is unavailable on ${days[day]}`;
          if ((blockedRooms[p.room] || []).includes(day)) return `${p.room} is blocked on ${days[day]}`;
          return null;
        }}
        onResolve={(p) => {
          if (!resolveConflict) return;
          timetableApi.set(klass, resolveConflict.day, resolveConflict.period, { ...p });
          toast.success("Conflict resolved — timetable updated");
          setResolveConflict(null);
        }}
      />
    </PageContainer>
  );
}

/* --------------------------- Configure Panel --------------------------- */

function ConfigurePanel({ config, setConfig, onReset }: { config: TtConfig; setConfig: (c: TtConfig) => void; onReset: () => void }) {
  const [draft, setDraft] = useState<TtConfig>(config);

  const update = <K extends keyof TtConfig>(k: K, v: TtConfig[K]) => setDraft({ ...draft, [k]: v });
  const save = () => { setConfig(draft); toast.success("Timetable configuration saved"); };
  const revert = () => { setDraft(config); toast.info("Reverted unsaved changes"); };

  /* ---- list helpers ---- */
  const updateListItem = (key: "days" | "classes" | "teachers" | "rooms", i: number, v: string) => {
    const next = [...draft[key]]; next[i] = v; update(key, next as never);
  };
  const removeListItem = (key: "days" | "classes" | "teachers" | "rooms", i: number) => {
    const next = draft[key].filter((_, idx) => idx !== i); update(key, next as never);
  };
  const addListItem = (key: "days" | "classes" | "teachers" | "rooms", v: string) => {
    if (!v.trim()) return; update(key, [...draft[key], v.trim()] as never);
  };

  /* ---- periods ---- */
  const updatePeriod = (i: number, v: string) => {
    const next = [...draft.periods]; next[i] = v; update("periods", next);
  };
  const removePeriod = (i: number) => {
    const next = draft.periods.filter((_, idx) => idx !== i);
    const breaks = draft.breakPeriods.filter((p) => p !== i).map((p) => (p > i ? p - 1 : p));
    const labels: Record<number, string> = {};
    Object.entries(draft.breakLabels).forEach(([k, v]) => { const n = Number(k); if (n === i) return; labels[n > i ? n - 1 : n] = v; });
    setDraft({ ...draft, periods: next, breakPeriods: breaks, breakLabels: labels });
  };
  const addPeriod = (v: string) => { if (!v.trim()) return; update("periods", [...draft.periods, v.trim()]); };
  const toggleBreak = (i: number) => {
    const isBreak = draft.breakPeriods.includes(i);
    const breaks = isBreak ? draft.breakPeriods.filter((p) => p !== i) : [...draft.breakPeriods, i].sort((a, b) => a - b);
    const labels = { ...draft.breakLabels };
    if (isBreak) delete labels[i]; else labels[i] = labels[i] || "Break";
    setDraft({ ...draft, breakPeriods: breaks, breakLabels: labels });
  };
  const setBreakLabel = (i: number, v: string) => setDraft({ ...draft, breakLabels: { ...draft.breakLabels, [i]: v } });

  /* ---- subjects ---- */
  const addSubject = () => update("subjects", [...draft.subjects, { code: "NEW", name: "New Subject", color: SUBJECT_PALETTE[draft.subjects.length % SUBJECT_PALETTE.length] }]);
  const updateSubject = (i: number, patch: Partial<SubjectCfg>) => {
    const next = [...draft.subjects]; next[i] = { ...next[i], ...patch }; update("subjects", next);
  };
  const removeSubject = (i: number) => update("subjects", draft.subjects.filter((_, idx) => idx !== i));

  /* ---- blocked rooms / unavailable teachers ---- */
  const toggleRoomBlock = (room: string, dayIdx: number) => {
    const cur = draft.blockedRooms[room] || [];
    const next = cur.includes(dayIdx) ? cur.filter((d) => d !== dayIdx) : [...cur, dayIdx];
    update("blockedRooms", { ...draft.blockedRooms, [room]: next });
  };
  const toggleTeacherOff = (teacher: string, dayIdx: number) => {
    const cur = draft.unavailableTeachers[teacher] || [];
    const next = cur.includes(dayIdx) ? cur.filter((d) => d !== dayIdx) : [...cur, dayIdx];
    update("unavailableTeachers", { ...draft.unavailableTeachers, [teacher]: next });
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Timetable Configuration</CardTitle>
            <CardDescription>Customize the entire timetable engine to match your institution. Changes are saved locally to your browser.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onReset}><RotateCcw className="h-4 w-4" />Defaults</Button>
            <Button variant="outline" size="sm" onClick={revert}>Revert</Button>
            <Button size="sm" className="gradient-primary border-0" onClick={save}><CheckCircle2 className="h-4 w-4" />Save Configuration</Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Working days */}
        <ListEditor
          title="Working Days"
          description="Days of the week shown across the timetable grid."
          items={draft.days}
          onUpdate={(i, v) => updateListItem("days", i, v)}
          onRemove={(i) => removeListItem("days", i)}
          onAdd={(v) => addListItem("days", v)}
          placeholder="e.g. Sun"
        />

        {/* Classes */}
        <ListEditor
          title="Classes"
          description="Classes/sections that have their own timetable."
          items={draft.classes}
          onUpdate={(i, v) => updateListItem("classes", i, v)}
          onRemove={(i) => removeListItem("classes", i)}
          onAdd={(v) => addListItem("classes", v)}
          placeholder="e.g. XI-A"
        />

        {/* Teachers */}
        <ListEditor
          title="Teachers"
          description="Faculty pool used in the period editor."
          items={draft.teachers}
          onUpdate={(i, v) => updateListItem("teachers", i, v)}
          onRemove={(i) => removeListItem("teachers", i)}
          onAdd={(v) => addListItem("teachers", v)}
          placeholder="e.g. R. Sharma"
        />

        {/* Rooms */}
        <ListEditor
          title="Rooms"
          description="Available rooms / labs / venues."
          items={draft.rooms}
          onUpdate={(i, v) => updateListItem("rooms", i, v)}
          onRemove={(i) => removeListItem("rooms", i)}
          onAdd={(v) => addListItem("rooms", v)}
          placeholder="e.g. R-201"
        />
      </div>

      {/* Periods & breaks */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Periods & Breaks</CardTitle>
          <CardDescription>Define the daily period schedule. Tick "Break" to mark a slot as a recess/lunch period.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {draft.periods.map((p, i) => {
            const isBr = draft.breakPeriods.includes(i);
            return (
              <div key={i} className="flex flex-wrap items-center gap-2 p-2 rounded-md border border-border/40">
                <span className="text-xs font-medium text-muted-foreground w-16">P{i + 1}</span>
                <Input className="h-8 w-28" value={p} onChange={(e) => updatePeriod(i, e.target.value)} placeholder="08:00" />
                <label className="flex items-center gap-1.5 text-xs">
                  <Checkbox checked={isBr} onCheckedChange={() => toggleBreak(i)} /> Break
                </label>
                {isBr && (
                  <Input className="h-8 w-40" value={draft.breakLabels[i] || ""} onChange={(e) => setBreakLabel(i, e.target.value)} placeholder="Break label" />
                )}
                <Button variant="ghost" size="sm" className="ml-auto text-destructive" onClick={() => removePeriod(i)}><X className="h-4 w-4" /></Button>
              </div>
            );
          })}
          <AddInline placeholder="e.g. 15:30" onAdd={addPeriod} />
        </CardContent>
      </Card>

      {/* Subjects */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Subjects</CardTitle>
            <CardDescription>Subjects with code and color swatch used on the grid.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={addSubject}><Plus className="h-4 w-4" />Add Subject</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {draft.subjects.map((s, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 p-2 rounded-md border border-border/40">
              <Input className="h-8 w-20" value={s.code} onChange={(e) => updateSubject(i, { code: e.target.value })} placeholder="Code" />
              <Input className="h-8 flex-1 min-w-[160px]" value={s.name} onChange={(e) => updateSubject(i, { name: e.target.value })} placeholder="Subject name" />
              <div className="flex items-center gap-1">
                {SUBJECT_PALETTE.map((c, ci) => (
                  <button
                    key={ci}
                    type="button"
                    onClick={() => updateSubject(i, { color: c })}
                    className={`h-6 w-6 rounded-md border ${c} ${s.color === c ? "ring-2 ring-primary" : ""}`}
                    aria-label={`color-${ci}`}
                  />
                ))}
              </div>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeSubject(i)}><X className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Constraints */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Blocked Rooms</CardTitle>
            <CardDescription>Days when a room cannot be used (maintenance, exams, etc).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {draft.rooms.map((r) => (
              <div key={r} className="flex flex-wrap items-center gap-2 p-2 rounded-md border border-border/40">
                <span className="text-sm font-medium w-28 truncate">{r}</span>
                <div className="flex flex-wrap gap-1">
                  {draft.days.map((d, di) => {
                    const on = (draft.blockedRooms[r] || []).includes(di);
                    return (
                      <button key={di} type="button" onClick={() => toggleRoomBlock(r, di)}
                        className={`text-[11px] px-2 py-0.5 rounded-md border ${on ? "bg-destructive text-destructive-foreground border-destructive" : "border-border hover:bg-muted"}`}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Teacher Off-Days</CardTitle>
            <CardDescription>Days a teacher is unavailable (leave, half-time, etc).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {draft.teachers.map((t) => (
              <div key={t} className="flex flex-wrap items-center gap-2 p-2 rounded-md border border-border/40">
                <span className="text-sm font-medium w-32 truncate">{t}</span>
                <div className="flex flex-wrap gap-1">
                  {draft.days.map((d, di) => {
                    const on = (draft.unavailableTeachers[t] || []).includes(di);
                    return (
                      <button key={di} type="button" onClick={() => toggleTeacherOff(t, di)}
                        className={`text-[11px] px-2 py-0.5 rounded-md border ${on ? "bg-destructive text-destructive-foreground border-destructive" : "border-border hover:bg-muted"}`}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Workload thresholds */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Workload Limits</CardTitle>
          <CardDescription>Thresholds used by the workload bar and overload conflicts.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Weekly cap (periods)</Label>
            <Input type="number" min={1} value={draft.teacherWeeklyCap} onChange={(e) => update("teacherWeeklyCap", Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Overload threshold</Label>
            <Input type="number" min={1} value={draft.overloadThreshold} onChange={(e) => update("overloadThreshold", Number(e.target.value) || 0)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={revert}>Revert</Button>
        <Button className="gradient-primary border-0" onClick={save}><CheckCircle2 className="h-4 w-4" />Save Configuration</Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Defaults reference: {defaultTtConfig.days.length} days, {defaultTtConfig.periods.length} periods, {defaultTtConfig.subjects.length} subjects.
      </p>
    </div>
  );
}

function ListEditor({
  title, description, items, onUpdate, onRemove, onAdd, placeholder,
}: {
  title: string; description: string; items: string[];
  onUpdate: (i: number, v: string) => void; onRemove: (i: number) => void; onAdd: (v: string) => void; placeholder?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input className="h-8" value={it} onChange={(e) => onUpdate(i, e.target.value)} />
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onRemove(i)}><X className="h-4 w-4" /></Button>
          </div>
        ))}
        <AddInline placeholder={placeholder} onAdd={onAdd} />
      </CardContent>
    </Card>
  );
}

function AddInline({ placeholder, onAdd }: { placeholder?: string; onAdd: (v: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex items-center gap-2 pt-1">
      <Input className="h-8" value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { onAdd(v); setV(""); } }} />
      <Button size="sm" variant="outline" onClick={() => { onAdd(v); setV(""); }}><Plus className="h-4 w-4" />Add</Button>
    </div>
  );
}

function TimetableTypeBar() {
  const [type, setType] = useState("regular");
  const [weeks, setWeeks] = useState("4");
  const [workdayOpen, setWorkdayOpen] = useState(false);
  const [absentOpen, setAbsentOpen] = useState(false);
  const [absentTeacher, setAbsentTeacher] = useState("A. Mehta");
  const [saturdayRule, setSaturdayRule] = useState("second-off");
  const [specialHolidays, setSpecialHolidays] = useState<string[]>(["2026-08-15", "2026-10-02"]);
  const [newHoliday, setNewHoliday] = useState("");

  const workload = [
    { teacher: "A. Mehta", periods: 32, cap: 30, subject: "Math" },
    { teacher: "S. Bose", periods: 22, cap: 30, subject: "Science" },
    { teacher: "V. Nair", periods: 15, cap: 30, subject: "English" },
    { teacher: "K. Das", periods: 34, cap: 30, subject: "Social" },
    { teacher: "N. Patel", periods: 12, cap: 30, subject: "Hindi" },
    { teacher: "R. Khanna", periods: 28, cap: 30, subject: "CS" },
  ];
  const overbooked = workload.filter((w) => w.periods > w.cap);
  const underbooked = workload.filter((w) => w.periods < w.cap * 0.6);
  const subjectAlloc = Array.from(
    workload.reduce((m, w) => m.set(w.subject, (m.get(w.subject) || 0) + w.periods), new Map<string, number>())
  );

  return (
    <Card className="border-border/60 mb-6">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-display">Timetable Type & Working Days</CardTitle>
            <CardDescription>Switch between Regular / Summer / Examination and configure school-week rules</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Cycle</Label>
            <Select value={weeks} onValueChange={setWeeks}>
              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Week</SelectItem>
                <SelectItem value="2">2 Weeks</SelectItem>
                <SelectItem value="4">4 Weeks</SelectItem>
                <SelectItem value="term">Full Term</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setWorkdayOpen(true)}>
              <Settings2 className="h-4 w-4" />Working Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAbsentOpen(true)}>
              <UserX className="h-4 w-4" />Absent Alert
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={type} onValueChange={setType}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <TabsList>
              <TabsTrigger value="regular">Regular Timetable</TabsTrigger>
              <TabsTrigger value="summer">Summer Timetable</TabsTrigger>
              <TabsTrigger value="exam">Examination Timetable</TabsTrigger>
              <TabsTrigger value="workload"><BarChart3 className="h-3.5 w-3.5 mr-1" />Workload Analytics</TabsTrigger>
            </TabsList>
            {type !== "workload" && (
              <ExcelUpload
                label={`Upload ${type === "regular" ? "Regular" : type === "summer" ? "Summer" : "Exam"} Timetable`}
                templateName={`timetable-${type}-template.xlsx`}
                templateHeaders={["Class", "Day", "Period", "Subject", "Teacher", "Room"]}
                onRows={(rows) => toast.success(`Parsed ${rows.length} slots — apply to ${type} schedule`)}
              />
            )}
          </div>
          <TabsContent value="regular">
            <div className="text-xs text-muted-foreground p-3 rounded-md bg-muted/30 border">
              Regular timetable applies during standard academic weeks. Cycle: <b>{weeks === "term" ? "Full Term" : `${weeks} week(s)`}</b>. Configure or upload above.
            </div>
          </TabsContent>
          <TabsContent value="summer">
            <div className="text-xs text-muted-foreground p-3 rounded-md bg-warning/10 border border-warning/30">
              Summer timetable — typically shorter periods, no post-lunch load. Upload the summer-specific Excel.
            </div>
          </TabsContent>
          <TabsContent value="exam">
            <div className="text-xs text-muted-foreground p-3 rounded-md bg-info/10 border border-info/30">
              Examination timetable — one paper per day slot, staggered by class. Upload the exam schedule.
            </div>
          </TabsContent>
          <TabsContent value="workload">
            <div className="grid md:grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded-md border"><div className="text-[10px] uppercase text-muted-foreground">Teachers Allocated</div><div className="text-2xl font-display font-semibold mt-1">{workload.length}</div></div>
              <div className="p-3 rounded-md border"><div className="text-[10px] uppercase text-muted-foreground">Total Classes/Week</div><div className="text-2xl font-display font-semibold mt-1">{workload.reduce((a, w) => a + w.periods, 0)}</div></div>
              <div className="p-3 rounded-md border border-destructive/40 bg-destructive/5"><div className="text-[10px] uppercase text-destructive">Overbooked</div><div className="text-2xl font-display font-semibold mt-1 text-destructive">{overbooked.length}</div></div>
              <div className="p-3 rounded-md border border-warning/40 bg-warning/5"><div className="text-[10px] uppercase text-warning">Underbooked</div><div className="text-2xl font-display font-semibold mt-1">{underbooked.length}</div></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">Teacher Allocation</div>
                <div className="space-y-1.5">
                  {workload.map((w) => (
                    <div key={w.teacher} className="flex items-center gap-3 p-2 rounded border">
                      <div className="w-32 text-sm">{w.teacher}</div>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${w.periods > w.cap ? "bg-destructive" : w.periods < w.cap * 0.6 ? "bg-warning" : "bg-primary"}`} style={{ width: `${Math.min((w.periods / w.cap) * 100, 100)}%` }} />
                      </div>
                      <div className="text-xs tabular-nums w-14 text-right">{w.periods}/{w.cap}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">Subject-wise Allocation</div>
                <div className="space-y-1.5">
                  {subjectAlloc.map(([sub, n]) => (
                    <div key={sub} className="flex items-center gap-3 p-2 rounded border">
                      <div className="w-24 text-sm">{sub}</div>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${(n / 40) * 100}%` }} />
                      </div>
                      <div className="text-xs tabular-nums w-14 text-right">{n} periods</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={workdayOpen} onOpenChange={setWorkdayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>School Working Day Configuration</DialogTitle>
            <DialogDescription>Configure Saturday rules and special holidays</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Saturday Rule</Label>
              <Select value={saturdayRule} onValueChange={setSaturdayRule}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-working">All Saturdays Working</SelectItem>
                  <SelectItem value="alternate">Alternate Saturday Off</SelectItem>
                  <SelectItem value="second-off">Second Saturday Off</SelectItem>
                  <SelectItem value="all-off">All Saturdays Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Special Holidays</Label>
              <div className="flex gap-2">
                <Input type="date" value={newHoliday} onChange={(e) => setNewHoliday(e.target.value)} />
                <Button variant="outline" size="sm" onClick={() => { if (newHoliday) { setSpecialHolidays((s) => [...s, newHoliday]); setNewHoliday(""); } }}>
                  <Plus className="h-4 w-4" />Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {specialHolidays.map((h) => (
                  <Badge key={h} variant="secondary" className="text-xs">
                    {h}
                    <button onClick={() => setSpecialHolidays((s) => s.filter((x) => x !== h))} className="ml-1.5"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkdayOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast.success("Working day rules saved"); setWorkdayOpen(false); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={absentOpen} onOpenChange={setAbsentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teacher Absence Alert</DialogTitle>
            <DialogDescription>Notify Admin / HR to arrange a suitable replacement</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Teacher</Label>
              <Select value={absentTeacher} onValueChange={setAbsentTeacher}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["A. Mehta", "S. Bose", "V. Nair", "K. Das", "N. Patel", "R. Khanna"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs uppercase text-muted-foreground">From</Label>
                <Input type="date" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase text-muted-foreground">To</Label>
                <Input type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Reason</Label>
              <Select defaultValue="Sick Leave">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                  <SelectItem value="Official Duty">Official Duty</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md bg-info/10 border border-info/30 p-2.5 text-xs">
              System will auto-alert Admin & HR with 3 suggested replacement teachers based on subject match and free periods.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbsentOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast.success(`Alert sent — replacement suggestions dispatched to Admin & HR for ${absentTeacher}`); setAbsentOpen(false); }}>
              <Send className="h-4 w-4" />Send Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
