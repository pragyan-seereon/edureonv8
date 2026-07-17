import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Trophy } from "lucide-react";
import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { KpiCard } from "@/components/kpi-card";
import { toast } from "sonner";

export const Route = createFileRoute("/student/results")({
  head: () => ({ meta: [{ title: "My Results — Edureon" }] }),
  component: StudentResults,
});

const EXAMS = ["Mid-Term II — 2025-26", "Unit Test 3 — 2025-26", "Mid-Term I — 2025-26"];
const data: Record<string, { subject: string; max: number; my: number; avg: number }[]> = {
  "Mid-Term II — 2025-26": [
    { subject: "Mathematics", max: 80, my: 74, avg: 58 },
    { subject: "Physics", max: 80, my: 68, avg: 55 },
    { subject: "Chemistry", max: 80, my: 71, avg: 60 },
    { subject: "English", max: 80, my: 66, avg: 62 },
    { subject: "Hindi", max: 80, my: 70, avg: 64 },
    { subject: "Computer Sci", max: 80, my: 78, avg: 67 },
  ],
  "Unit Test 3 — 2025-26": [
    { subject: "Mathematics", max: 25, my: 22, avg: 17 },
    { subject: "Physics", max: 25, my: 19, avg: 16 },
    { subject: "Chemistry", max: 25, my: 21, avg: 18 },
    { subject: "English", max: 25, my: 20, avg: 19 },
  ],
  "Mid-Term I — 2025-26": [
    { subject: "Mathematics", max: 80, my: 71, avg: 56 },
    { subject: "Physics", max: 80, my: 66, avg: 53 },
    { subject: "Chemistry", max: 80, my: 69, avg: 58 },
    { subject: "English", max: 80, my: 68, avg: 60 },
    { subject: "Hindi", max: 80, my: 72, avg: 63 },
    { subject: "Computer Sci", max: 80, my: 76, avg: 65 },
  ],
};

const upcoming = [
  { name: "Pre-Board", subject: "Physics", date: "12 Dec 2025", time: "09:00 AM", room: "F-11", duration: "3 hrs" },
  { name: "Pre-Board", subject: "Chemistry", date: "14 Dec 2025", time: "09:00 AM", room: "F-11", duration: "3 hrs" },
  { name: "Pre-Board", subject: "Maths", date: "16 Dec 2025", time: "09:00 AM", room: "F-11", duration: "3 hrs" },
];

const grade = (pct: number) => pct >= 91 ? "A1" : pct >= 81 ? "A2" : pct >= 71 ? "B1" : pct >= 61 ? "B2" : pct >= 51 ? "C1" : pct >= 41 ? "C2" : "D";

function StudentResults() {
  const [exam, setExam] = useState(EXAMS[0]);
  const rows = data[exam];
  const total = rows.reduce((s, r) => s + r.my, 0);
  const max = rows.reduce((s, r) => s + r.max, 0);
  const pct = Math.round((total / max) * 100);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Student Portal"
        title="My Results"
        description="Subject-wise scores, class average comparison, and report card downloads."
        actions={
          <>
            <Select value={exam} onValueChange={setExam}><SelectTrigger className="h-9 w-64"><SelectValue /></SelectTrigger>
              <SelectContent>{EXAMS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select>
            <Button size="sm" className="gradient-primary border-0" onClick={() => toast.success("Report card downloaded (PDF)")}><Download className="h-4 w-4" />Report Card</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Score" value={`${total} / ${max}`} icon={<Trophy className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Percentage" value={pct + "%"} icon={<Trophy className="h-5 w-5" />} tone="success" />
        <KpiCard label="Overall Grade" value={grade(pct)} icon={<Trophy className="h-5 w-5" />} tone="info" />
        <KpiCard label="Class Rank" value="#7 of 38" icon={<Trophy className="h-5 w-5" />} tone="warning" />
      </div>

      <Card className="border-border/60 mb-6">
        <CardHeader className="pb-2"><CardTitle className="font-display text-base">My score vs Class average</CardTitle><CardDescription>{exam}</CardDescription></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="subject" fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis fontSize={11} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="my" name="My Score" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avg" name="Class Avg" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="font-display text-base">Subject Breakdown</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead className="text-right">Max</TableHead><TableHead className="text-right">My</TableHead><TableHead className="text-right">Avg</TableHead><TableHead>Grade</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const p = Math.round((r.my / r.max) * 100);
                  return (
                    <TableRow key={r.subject}>
                      <TableCell className="text-sm">{r.subject}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{r.max}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{r.my}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{r.avg}</TableCell>
                      <TableCell><Badge variant="secondary" className="font-mono">{grade(p)}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="font-display text-base">Upcoming Exams</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcoming.map((u, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-md">
                <div className="text-center shrink-0">
                  <div className="text-[10px] uppercase text-muted-foreground">{u.date.split(" ")[1]}</div>
                  <div className="text-xl font-display font-bold">{u.date.split(" ")[0]}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{u.subject}</div>
                  <div className="text-[11px] text-muted-foreground">{u.name} · {u.time} · Room {u.room}</div>
                </div>
                <Badge variant="outline" className="text-[10px]">{u.duration}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
