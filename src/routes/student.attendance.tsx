import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi-card";
import { CalendarCheck, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/student/attendance")({
  head: () => ({ meta: [{ title: "My Attendance — Edureon" }] }),
  component: StudentAttendance,
});

// Generate Nov calendar with statuses
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();
const daysInMonth = new Date(year, month + 1, 0).getDate();
const offset = (new Date(year, month, 1).getDay() + 6) % 7;
type Mark = "P" | "A" | "L" | "H" | "F";
const marks: Mark[] = Array.from({ length: daysInMonth }).map((_, i) => {
  const d = i + 1;
  const dow = (offset + i) % 7;
  if (dow === 6) return "H"; // Sunday
  if (d > now.getDate()) return "F";
  if (d % 11 === 0) return "A";
  if (d % 17 === 0) return "L";
  return "P";
});
const colorMap: Record<Mark, string> = {
  P: "bg-success/20 text-success border-success/30",
  A: "bg-destructive/20 text-destructive border-destructive/30",
  L: "bg-warning/20 text-warning border-warning/30",
  H: "bg-muted/40 text-muted-foreground border-border",
  F: "bg-transparent text-muted-foreground/40 border-dashed border-border",
};

const trend = [
  { month: "Aug", pct: 95 }, { month: "Sep", pct: 94 }, { month: "Oct", pct: 92 }, { month: "Nov", pct: 93 },
];

function StudentAttendance() {
  const present = marks.filter((m) => m === "P").length;
  const absent = marks.filter((m) => m === "A").length;
  const leave = marks.filter((m) => m === "L").length;
  const considered = present + absent + leave;
  const pct = considered ? Math.round((present / considered) * 100) : 0;

  return (
    <PageContainer>
      <PageHeader eyebrow="Student Portal" title="My Attendance" description="Daily attendance calendar with monthly trend." />

      {pct < 75 && (
        <div className="mb-5 flex items-start gap-3 p-4 rounded-md bg-warning/10 border border-warning/30">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div><div className="font-medium text-sm">Attendance below 75% threshold</div>
            <div className="text-xs text-muted-foreground">As per CBSE norms, sustained attendance below 75% may affect board eligibility.</div></div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Present" value={present} icon={<CalendarCheck className="h-5 w-5" />} tone="success" />
        <KpiCard label="Absent" value={absent} icon={<CalendarCheck className="h-5 w-5" />} tone="warning" />
        <KpiCard label="On Leave" value={leave} icon={<CalendarCheck className="h-5 w-5" />} tone="info" />
        <KpiCard label="Attendance %" value={pct + "%"} icon={<CalendarCheck className="h-5 w-5" />} tone="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="font-display text-base">{now.toLocaleString("en-IN", { month: "long", year: "numeric" })}</CardTitle>
              <CardDescription>P · A · L · H (Holiday) · Future</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              {(["P", "A", "L", "H"] as Mark[]).map((m) => (
                <span key={m} className={`px-2 py-0.5 rounded border ${colorMap[m]}`}>{m}</span>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] text-muted-foreground mb-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: offset }).map((_, i) => <div key={"o" + i} />)}
              {marks.map((m, i) => (
                <div key={i} className={`aspect-square rounded-md border text-xs font-semibold flex flex-col items-center justify-center ${colorMap[m]}`}>
                  <span>{i + 1}</span>
                  {m !== "F" && <span className="text-[9px] mt-0.5">{m}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="font-display text-base">Last 4 Months</CardTitle><CardDescription>Attendance % trend</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis domain={[60, 100]} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="pct" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">Eligible</Badge>
              <span className="text-muted-foreground">Above 75% sustained</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
