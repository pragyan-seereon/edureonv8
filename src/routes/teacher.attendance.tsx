import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CalendarCheck, Save, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStudents } from "@/lib/store";

export const Route = createFileRoute("/teacher/attendance")({
  head: () => ({ meta: [{ title: "Take Attendance — Edureon" }] }),
  component: TakeAttendancePage,
});

type Mark = "P" | "A" | "L";
const SECTIONS = ["X-B", "X-A", "IX-A", "VIII-B"];

const fmt = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });

function TakeAttendancePage() {
  const all = useStudents();
  const [section, setSection] = useState("X-B");
  const [date, setDate] = useState(new Date());
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [confirm, setConfirm] = useState(false);

  const roster = useMemo(() => all.slice(0, 24), [all]);
  const present = roster.filter((s) => (marks[s.id] ?? "P") === "P").length;
  const absent = roster.filter((s) => marks[s.id] === "A").length;
  const leave = roster.filter((s) => marks[s.id] === "L").length;

  const setMark = (id: string, m: Mark) => setMarks((p) => ({ ...p, [id]: m }));
  const bulk = (m: Mark) => setMarks(Object.fromEntries(roster.map((s) => [s.id, m])));
  const shift = (dx: number) => { const d = new Date(date); d.setDate(d.getDate() + dx); setDate(d); };

  const submit = () => {
    setConfirm(false);
    toast.success(`Attendance saved · ${section} · ${fmt(date)}`, {
      description: `${present} present · ${absent} absent · ${leave} on leave`,
    });
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Teacher Portal"
        title="Take Attendance"
        description="Tap P / A / L per student. Date defaults to today; tap to mark past sessions."
      />

      <Card className="border-border/60 mb-5">
        <CardContent className="p-4 flex items-center gap-3 flex-wrap">
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="h-10 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{SECTIONS.map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}</SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="px-4 h-10 border rounded-md flex items-center font-medium text-sm min-w-[140px] justify-center">{fmt(date)}</div>
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => bulk("P")}>Mark all Present</Button>
            <Button variant="outline" size="sm" onClick={() => setMarks({})}>Reset</Button>
            <Button className="gradient-primary border-0" size="sm" onClick={() => setConfirm(true)}><Save className="h-4 w-4" />Submit</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <SummaryCard label="Present" value={present} tone="bg-success/10 text-success" />
        <SummaryCard label="Absent" value={absent} tone="bg-destructive/10 text-destructive" />
        <SummaryCard label="On Leave" value={leave} tone="bg-warning/15 text-warning" />
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="font-display text-base">Roster · Section {section}</CardTitle><CardDescription>{roster.length} students</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {roster.map((s) => {
            const m = (marks[s.id] ?? "P") as Mark;
            return (
              <div key={s.id} className="flex items-center gap-3 p-2.5 border rounded-md hover:bg-muted/30">
                <Avatar className="h-9 w-9"><AvatarFallback className="text-[10px] bg-primary/10 text-primary">{s.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground">Roll {s.rollNo} · {s.admissionNo}</div>
                </div>
                <div className="flex items-center gap-1">
                  {(["P", "A", "L"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setMark(s.id, opt)}
                      className={`h-11 w-11 rounded-md text-sm font-bold transition border-2 ${
                        m === opt
                          ? opt === "P" ? "bg-success text-success-foreground border-success" :
                            opt === "A" ? "bg-destructive text-destructive-foreground border-destructive" :
                            "bg-warning text-warning-foreground border-warning"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-primary" />Submit attendance?</DialogTitle>
            <DialogDescription>
              Section <span className="font-semibold text-foreground">{section}</span> · {fmt(date)}<br />
              {present} present · {absent} absent · {leave} on leave
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button className="gradient-primary border-0" onClick={submit}><Check className="h-4 w-4" />Confirm Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card className="border-border/60"><CardContent className="p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2 mt-1">
        <div className={`h-8 w-8 rounded-md flex items-center justify-center font-bold ${tone}`}>{label[0]}</div>
        <div className="text-2xl font-display font-semibold">{value}</div>
      </div>
    </CardContent></Card>
  );
}

function _unused() { return Badge; }
