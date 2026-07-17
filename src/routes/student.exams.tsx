import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CalendarDays, Trophy, Download, Clock, MapPin, FileText, Target, TrendingUp, Award } from "lucide-react";
import { useExams, useMarkEntries, useStudents } from "@/lib/store";
import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/student/exams")({
  head: () => ({ meta: [{ title: "Student · Exams — Edureon" }] }),
  component: StudentExams,
});

const STUDENT_ID = "STU1000";

const EXAM_TYPES = [
  { type: "Unit Test", count: 4, weight: "10%", description: "Short tests held every 4–6 weeks to check chapter-level understanding.", color: "bg-info/10 text-info border-info/20" },
  { type: "Mid-Term", count: 2, weight: "25%", description: "Half-syllabus written exams covering taught chapters of the term.", color: "bg-warning/15 text-warning border-warning/20" },
  { type: "Pre-Board", count: 1, weight: "15%", description: "Full-syllabus rehearsal for Class X & XII before board exams.", color: "bg-primary/10 text-primary border-primary/20" },
  { type: "Annual / Board", count: 1, weight: "50%", description: "Final assessment as per CBSE/ICSE board pattern.", color: "bg-success/10 text-success border-success/20" },
];

const ROOM_MAP: Record<string, string> = { Math: "F-11", Science: "F-12", English: "G-04", Social: "G-05", Hindi: "G-06" };
const TIME_SLOTS = ["09:00 AM – 12:00 PM", "09:00 AM – 11:00 AM", "01:00 PM – 04:00 PM"];

const grade = (pct: number) => pct >= 91 ? "A1" : pct >= 81 ? "A2" : pct >= 71 ? "B1" : pct >= 61 ? "B2" : pct >= 51 ? "C1" : pct >= 41 ? "C2" : "D";
const gpa = (pct: number) => pct >= 91 ? 10 : pct >= 81 ? 9 : pct >= 71 ? 8 : pct >= 61 ? 7 : pct >= 51 ? 6 : pct >= 41 ? 5 : 4;

function StudentExams() {
  const exams = useExams();
  const marks = useMarkEntries();
  const students = useStudents();
  const me = students.find((s) => s.id === STUDENT_ID) ?? students[0];
  const myClass = me?.class ?? "X";

  const myExams = useMemo(() => exams.filter((e) => e.class === myClass || e.class === "X"), [exams, myClass]);
  const myMarks = useMemo(() => marks.filter((m) => m.studentId === STUDENT_ID || m.studentName === me?.name), [marks, me]);

  const examIds = useMemo(() => Array.from(new Set(myMarks.map((m) => m.examId))), [myMarks]);
  const [selectedExam, setSelectedExam] = useState<string>(examIds[0] ?? "EX2");

  const examRows = myMarks.filter((m) => m.examId === selectedExam);
  const totalObt = examRows.reduce((s, m) => s + (m.obtained ?? 0), 0);
  const totalMax = examRows.reduce((s, m) => s + m.max, 0);
  const pct = totalMax > 0 ? Math.round((totalObt / totalMax) * 100) : 0;

  const upcoming = myExams.filter((e) => e.status === "Scheduled" || e.status === "In Progress");
  const completed = myExams.filter((e) => e.status === "Completed");

  const radarData = examRows.map((m) => ({ subject: m.subject, score: Math.round(((m.obtained ?? 0) / m.max) * 100), fullMark: 100 }));
  const barData = examRows.map((m) => ({ subject: m.subject, obtained: m.obtained ?? 0, max: m.max }));

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Student Portal"
        title="My Examinations"
        description={`Class ${myClass} · ${me?.section ?? "B"} · Schedule, exam types and detailed performance reports.`}
        actions={
          <Button size="sm" className="gradient-primary border-0" onClick={() => toast.success("Admit card downloaded")}>
            <Download className="h-4 w-4" />Admit Card
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Upcoming Exams" value={upcoming.length} icon={<CalendarDays className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Completed" value={completed.length} icon={<BookOpen className="h-5 w-5" />} tone="success" />
        <KpiCard label="Latest %" value={`${pct}%`} icon={<TrendingUp className="h-5 w-5" />} tone="info" />
        <KpiCard label="Overall Grade" value={grade(pct)} icon={<Trophy className="h-5 w-5" />} tone="warning" />
      </div>

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="schedule"><CalendarDays className="h-3.5 w-3.5 mr-1" />Schedule</TabsTrigger>
          <TabsTrigger value="types"><FileText className="h-3.5 w-3.5 mr-1" />Exam Types</TabsTrigger>
          <TabsTrigger value="report"><Trophy className="h-3.5 w-3.5 mr-1" />Detailed Report</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Upcoming Exam Schedule</CardTitle>
              <CardDescription>{upcoming.length} exam series scheduled for your class</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.map((e) => (
                <div key={e.id} className="border rounded-lg p-4 hover:bg-muted/30 transition">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                    <div>
                      <div className="text-sm font-semibold">{e.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{e.from} – {e.to}</span>
                        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{e.subjects} subjects</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Class {e.class}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{e.status}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                    {Object.entries(ROOM_MAP).slice(0, e.subjects).map(([subj, room], idx) => (
                      <div key={subj} className="border rounded-md p-2.5 text-xs bg-muted/20">
                        <div className="font-medium text-sm">{subj}</div>
                        <div className="text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" />{TIME_SLOTS[idx % TIME_SLOTS.length]}</div>
                        <div className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />Room {room}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {upcoming.length === 0 && <div className="text-xs text-muted-foreground text-center p-8">No upcoming exams.</div>}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="font-display text-base">Past Exams</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Exam</TableHead><TableHead>Period</TableHead><TableHead>Subjects</TableHead><TableHead>Status</TableHead><TableHead>Result</TableHead></TableRow></TableHeader>
                <TableBody>
                  {completed.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm font-medium">{e.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.from} – {e.to}</TableCell>
                      <TableCell className="text-xs">{e.subjects}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{e.status}</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="sm" asChild><Link to="/student/results">View</Link></Button></TableCell>
                    </TableRow>
                  ))}
                  {completed.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">No past exams.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EXAM_TYPES.map((t) => (
              <Card key={t.type} className="border-border/60">
                <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                  <CardTitle className="font-display text-base flex items-center gap-2"><Award className="h-4 w-4" />{t.type}</CardTitle>
                  <Badge variant="outline" className={t.color}>{t.weight}</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs text-muted-foreground">{t.description}</div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t">
                    <span className="text-muted-foreground">Per academic year</span>
                    <span className="font-semibold">{t.count} {t.count > 1 ? "exams" : "exam"}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="font-display text-base">Grading Scale (CBSE)</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Grade</TableHead><TableHead>Marks Range</TableHead><TableHead>GPA</TableHead><TableHead>Remarks</TableHead></TableRow></TableHeader>
                <TableBody>
                  {[
                    ["A1", "91 – 100", "10", "Outstanding"],
                    ["A2", "81 – 90", "9", "Excellent"],
                    ["B1", "71 – 80", "8", "Very Good"],
                    ["B2", "61 – 70", "7", "Good"],
                    ["C1", "51 – 60", "6", "Above Average"],
                    ["C2", "41 – 50", "5", "Average"],
                    ["D", "33 – 40", "4", "Pass"],
                  ].map((r) => (
                    <TableRow key={r[0]}>
                      <TableCell><Badge variant="secondary" className="font-mono">{r[0]}</Badge></TableCell>
                      <TableCell className="text-sm">{r[1]}</TableCell>
                      <TableCell className="text-sm font-semibold">{r[2]}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r[3]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2 flex-row items-start justify-between gap-2 flex-wrap space-y-0">
              <div>
                <CardTitle className="font-display text-base">Detailed Exam Report</CardTitle>
                <CardDescription>Subject-wise performance, grade and rank analysis</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger className="h-9 w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>{examIds.map((id) => <SelectItem key={id} value={id}>{exams.find((e) => e.id === id)?.name ?? id}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => toast.success("Report card PDF downloaded")}><Download className="h-4 w-4" />PDF</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="border rounded-md p-3"><div className="text-[10px] text-muted-foreground uppercase">Total</div><div className="text-lg font-display font-bold">{totalObt}/{totalMax}</div></div>
                <div className="border rounded-md p-3"><div className="text-[10px] text-muted-foreground uppercase">Percentage</div><div className="text-lg font-display font-bold text-primary">{pct}%</div></div>
                <div className="border rounded-md p-3"><div className="text-[10px] text-muted-foreground uppercase">Grade</div><div className="text-lg font-display font-bold text-success">{grade(pct)}</div></div>
                <div className="border rounded-md p-3"><div className="text-[10px] text-muted-foreground uppercase">GPA</div><div className="text-lg font-display font-bold">{gpa(pct)}/10</div></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="border rounded-md p-3">
                  <div className="text-xs font-medium mb-2 flex items-center gap-1"><Target className="h-3.5 w-3.5" />Subject Scores</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="subject" fontSize={10} stroke="var(--muted-foreground)" />
                      <YAxis fontSize={10} stroke="var(--muted-foreground)" />
                      <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="obtained" name="Obtained" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="max" name="Max" fill="var(--chart-3)" radius={[4, 4, 0, 0]} opacity={0.4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-xs font-medium mb-2 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />Strength Radar</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="subject" fontSize={10} stroke="var(--muted-foreground)" />
                      <PolarRadiusAxis fontSize={9} stroke="var(--muted-foreground)" />
                      <Radar dataKey="score" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead className="text-right">Max</TableHead><TableHead className="text-right">Obtained</TableHead><TableHead>Progress</TableHead><TableHead>Grade</TableHead><TableHead>Remark</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {examRows.map((m) => {
                      const p = Math.round(((m.obtained ?? 0) / m.max) * 100);
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="text-sm font-medium">{m.subject}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{m.max}</TableCell>
                          <TableCell className="text-right text-sm font-semibold">{m.obtained ?? "—"}</TableCell>
                          <TableCell className="w-40"><Progress value={p} className="h-2" /></TableCell>
                          <TableCell><Badge variant="secondary" className="font-mono">{grade(p)}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{p >= 75 ? "Excellent" : p >= 60 ? "Good" : p >= 40 ? "Needs work" : "Improvement needed"}</TableCell>
                        </TableRow>
                      );
                    })}
                    {examRows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">No published marks for this exam yet.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
