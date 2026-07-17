import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Plus,
  Download,
  Trophy,
  AlertTriangle,
  FileText,
  Brain,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Upload,
  FileCheck2,
  Layers,
  ClipboardList,
  X,
} from "lucide-react";
import { examPerformance } from "@/lib/mock";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CrudDialog, type CrudRecord } from "@/components/crud-dialog";
import { ExcelUpload } from "@/components/excel-upload";
import { ImageOcrUpload } from "@/components/image-ocr-upload";
import { MultiQuestionDialog, type QuestionDraft, type QuestionBatchMeta } from "@/components/multi-question-dialog";
import { stripHtml } from "@/components/rich-text-editor";
import { ReportCardDialog } from "@/components/report-card-dialog";
import { BlueprintsTab, TemplatesTab } from "@/components/exam-blueprints";
import { printResultCard } from "@/lib/result-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  useExams,
  useQuestions,
  useStudents,
  examsApi,
  questionsApi,
  type Exam,
  type Question,
} from "@/lib/store";
import { useStoredResults, storedResultsApi } from "@/lib/store";

export const Route = createFileRoute("/exams")({
  head: () => ({ meta: [{ title: "Examinations — Edureon ERP" }] }),
  component: ExamsPage,
});

const marks = Array.from({ length: 14 }).map((_, i) => ({
  roll: i + 1,
  name:
    [
      "Aarav",
      "Diya",
      "Vihaan",
      "Ananya",
      "Kiara",
      "Ishaan",
      "Pari",
      "Arjun",
      "Saanvi",
      "Reyansh",
      "Anika",
      "Aadhya",
      "Krishna",
      "Tara",
    ][i] +
    " " +
    [
      "Sharma",
      "Verma",
      "Patel",
      "Iyer",
      "Mehta",
      "Nair",
      "Bose",
      "Das",
      "Joshi",
      "Khanna",
      "Singh",
      "Reddy",
      "Kumar",
      "Menon",
    ][i],
  math: 60 + ((i * 7) % 40),
  sci: 55 + ((i * 11) % 45),
  eng: 65 + ((i * 13) % 35),
  soc: 50 + ((i * 17) % 48),
  hin: 60 + ((i * 19) % 40),
}));

function grade(t: number) {
  if (t >= 91) return { g: "A1", c: "bg-success/15 text-success" };
  if (t >= 81) return { g: "A2", c: "bg-success/15 text-success" };
  if (t >= 71) return { g: "B1", c: "bg-info/15 text-info" };
  if (t >= 61) return { g: "B2", c: "bg-info/15 text-info" };
  if (t >= 51) return { g: "C1", c: "bg-warning/15 text-warning" };
  if (t >= 41) return { g: "C2", c: "bg-warning/15 text-warning" };
  return { g: "D", c: "bg-destructive/15 text-destructive" };
}

function createQuestionPdf(q: {
  subject: string;
  chapter: string;
  question: string;
  answer: string;
  marks: number;
}) {
  const lines = [
    "Edureon Question Bank",
    `Subject: ${q.subject}`,
    `Chapter: ${q.chapter}`,
    `Marks: ${q.marks}`,
    "",
    "Question:",
    q.question,
    "",
    "Answer Key:",
    q.answer || "Not provided",
  ].flatMap((line) => wrapPdfLine(line));
  const text = lines
    .map((line, index) => `BT /F1 11 Tf 48 ${770 - index * 18} Td (${escapePdf(line)}) Tj ET`)
    .join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${text.length} >> stream\n${text}\nendstream endobj`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n `)
    .join("\n")}\ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const blob = new Blob([pdf], { type: "application/pdf" });
  return { name: `${q.subject}-${Date.now()}.pdf`, url: URL.createObjectURL(blob) };
}

function escapePdf(value: string) {
  return value.replace(/[()\\]/g, "\\$&").replace(/[^\x20-\x7E]/g, "?");
}

function wrapPdfLine(value: string) {
  const clean = value || " ";
  const lines: string[] = [];
  for (let i = 0; i < clean.length; i += 82) lines.push(clean.slice(i, i + 82));
  return lines.length ? lines : [" "];
}

function openQuestionPdf(q: Question) {
  if (q.pdfUrl) window.open(q.pdfUrl, "_blank", "noopener,noreferrer");
  else toast.info("Legacy seed question — edit and save it once to generate its PDF.");
}

type ExamCategory = { id: string; name: string; description: string; weight: number };
type ExamPaper = {
  id: string;
  category: string;
  className: string;
  subject: string;
  paper: string;
  date: string;
  time: string;
  duration: number;
  maxMarks: number;
  room: string;
};
type SolutionDoc = { id: string; category: string; className: string; subject: string; paper: string; fileName: string };
type ResultEntry = { studentId: string; marks: Record<string, number> };

const DASH_SUBJECTS = ["Mathematics", "Science", "English", "Social Science", "Hindi"] as const;
type DashRow = {
  id: string;
  roll: number;
  name: string;
  subjects: { subject: string; obtained: number; max: number; grade: string }[];
  total: number;
  maxTotal: number;
  percent: number;
  rank: number;
};

function buildDashRows(students: { id: string; name: string; rollNo: number }[]): DashRow[] {
  const rows = students.map((s, i) => {
    const subjects = DASH_SUBJECTS.map((subject, j) => {
      const obtained = 45 + ((s.rollNo * (j + 3) + i * 7 + subject.length * 5) % 51); // 45-95
      const max = 100;
      return { subject, obtained, max, grade: grade(obtained).g };
    });
    const total = subjects.reduce((a, b) => a + b.obtained, 0);
    const maxTotal = subjects.reduce((a, b) => a + b.max, 0);
    return {
      id: s.id,
      roll: s.rollNo,
      name: s.name,
      subjects,
      total,
      maxTotal,
      percent: Math.round((total / maxTotal) * 1000) / 10,
      rank: 0,
    };
  });
  rows.sort((a, b) => b.total - a.total).forEach((r, idx) => (r.rank = idx + 1));
  return rows.sort((a, b) => a.roll - b.roll);
}

function ExamsPage() {
  const [tab, setTab] = useState("dash");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportStudent, setReportStudent] = useState<{ name: string; roll: string; math: number; sci: number; eng: number; soc: number; hin: number } | null>(null);
  const exams = useExams();
  const questions = useQuestions();
  const students = useStudents();
  const navigate = useNavigate();
  const [examOpen, setExamOpen] = useState(false);
  const [examEdit, setExamEdit] = useState<Exam | null>(null);
  const [qOpen, setQOpen] = useState(false);
  const [qEdit, setQEdit] = useState<Question | null>(null);
  const [multiAddOpen, setMultiAddOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [qfClass, setQfClass] = useState("all");
  const [qfSubject, setQfSubject] = useState("all");
  const [qfExam, setQfExam] = useState("all");

  // ---- Dashboard filters + nested detail ----
  const [dashClass, setDashClass] = useState("X");
  const [dashSection, setDashSection] = useState("A");
  const [dashApplied, setDashApplied] = useState(false);
  const [dashDetail, setDashDetail] = useState<DashRow | null>(null);

  // ---- Exam Categories (UI-only local state) ----
  const [categories, setCategories] = useState<ExamCategory[]>([
    { id: "c1", name: "Term 1", description: "First Term · Periodic + Final", weight: 50 },
    { id: "c2", name: "Term 2", description: "Second Term · Periodic + Final", weight: 50 },
    { id: "c3", name: "Half-Yearly", description: "Mid-session assessment", weight: 30 },
    { id: "c4", name: "Pre-Board", description: "Mock board examination", weight: 100 },
  ]);
  const [catOpen, setCatOpen] = useState(false);

  // ---- Subjects, Papers and Schedule ----
  const [papers, setPapers] = useState<ExamPaper[]>([
    { id: "p1", category: "Term 1", className: "X", subject: "Mathematics", paper: "Paper 1", date: "2025-09-12", time: "09:30", duration: 180, maxMarks: 80, room: "Hall A" },
    { id: "p2", category: "Term 1", className: "X", subject: "Science", paper: "Paper 1", date: "2025-09-14", time: "09:30", duration: 180, maxMarks: 80, room: "Hall A" },
    { id: "p3", category: "Term 1", className: "X", subject: "English", paper: "Paper 1", date: "2025-09-16", time: "09:30", duration: 180, maxMarks: 80, room: "Hall B" },
  ]);
  const [paperOpen, setPaperOpen] = useState(false);
  const [paperEdit, setPaperEdit] = useState<ExamPaper | null>(null);

  // ---- Solutions ----
  const [solutions, setSolutions] = useState<SolutionDoc[]>([]);
  const solnRef = useRef<HTMLInputElement>(null);
  const [solnDraft, setSolnDraft] = useState<Partial<SolutionDoc>>({ category: "Term 1", className: "X" });

  // ---- Results mapping ----
  const [resCourse, setResCourse] = useState("CBSE");
  const [resClass, setResClass] = useState("X");
  const [resSection, setResSection] = useState("A");
  const [resCategory, setResCategory] = useState("Term 1");
  const [resultRows, setResultRows] = useState<Record<string, ResultEntry>>({});

  const resSubjects = useMemo(
    () =>
      Array.from(
        new Set(
          papers.filter((p) => p.category === resCategory && p.className === resClass).map((p) => p.subject),
        ),
      ),
    [papers, resCategory, resClass],
  );
  const resStudents = useMemo(
    () => students.filter((s) => s.class === resClass && s.section === resSection),
    [students, resClass, resSection],
  );
  const setMark = (sid: string, subject: string, value: number) => {
    setResultRows((p) => ({
      ...p,
      [sid]: { studentId: sid, marks: { ...(p[sid]?.marks ?? {}), [subject]: value } },
    }));
  };




  const submitExam = (d: CrudRecord) => {
    const payload = {
      name: String(d.name),
      class: String(d.class),
      from: String(d.from),
      to: String(d.to),
      subjects: Number(d.subjects) || 1,
      status: (d.status as Exam["status"]) || "Draft",
    };
    if (examEdit) examsApi.update(examEdit.id, payload);
    else examsApi.add(payload);
    toast.success(examEdit ? "Exam updated" : "Exam created");
  };
  const submitQ = (d: CrudRecord) => {
    const question = String(d.question || "").trim();
    if (!question) return toast.error("Question text is required");
    const pdf = createQuestionPdf({
      subject: String(d.subject),
      chapter: String(d.chapter),
      question,
      answer: String(d.answer || ""),
      marks: Number(d.marks) || 1,
    });
    const payload = {
      subject: String(d.subject),
      chapter: String(d.chapter),
      question,
      answer: String(d.answer || ""),
      diff: (d.diff as Question["diff"]) || "Medium",
      marks: Number(d.marks) || 1,
      className: String(d.className || ""),
      examType: String(d.examType || ""),
      pdfName: pdf.name,
      pdfUrl: pdf.url,
    };
    if (qEdit) questionsApi.update(qEdit.id, payload);
    else questionsApi.add(payload);
    toast.success(
      qEdit ? "Question updated and PDF regenerated" : "Question added and stored as PDF",
    );
  };
  const submitMultiQ = (meta: QuestionBatchMeta, items: QuestionDraft[]) => {
    items.forEach((it) => {
      const questionText = stripHtml(it.question);
      const answerText = stripHtml(it.answer);
      const pdf = createQuestionPdf({
        subject: meta.subject,
        chapter: it.chapter,
        question: questionText,
        answer: answerText,
        marks: it.marks || 1,
      });
      questionsApi.add({
        subject: meta.subject,
        chapter: it.chapter,
        question: questionText,
        answer: answerText,
        diff: it.diff,
        marks: it.marks || 1,
        className: meta.className,
        examType: meta.examType,
        pdfName: pdf.name,
        pdfUrl: pdf.url,
      });
    });
    toast.success(`${items.length} question${items.length > 1 ? "s" : ""} added to ${meta.className} · ${meta.subject} · ${meta.examType}`);
  };
  const generatePaper = (d: CrudRecord) => {
    const target = Number(d.marks) || 50;
    let total = 0;
    const picked: Question[] = [];
    for (const q of [...questions].sort(() => 0.5 - Math.random())) {
      if (total + q.marks <= target) {
        picked.push(q);
        total += q.marks;
      }
      if (total >= target) break;
    }
    toast.success(`Paper generated: ${picked.length} questions · ${total} marks`);
  };

  const classOptions = ["VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  const subjectOptions = ["Math", "Science", "English", "Social", "Hindi", "CS", "Biology", "Economics"];
  const examTypeOptions = Array.from(
    new Set(["Unit Test", "Term 1", "Term 2", "Half-Yearly", "Pre-Board", ...categories.map((c) => c.name)]),
  );

  const filteredQ = questions.filter((q) => {
    if (search && !(q.subject + q.chapter + q.id + q.question).toLowerCase().includes(search.toLowerCase())) return false;
    if (qfClass !== "all" && q.className !== qfClass) return false;
    if (qfSubject !== "all" && q.subject !== qfSubject) return false;
    if (qfExam !== "all" && q.examType !== qfExam) return false;
    return true;
  });

  const dashStudents = useMemo(
    () => students.filter((s) => s.class === dashClass && s.section === dashSection),
    [students, dashClass, dashSection],
  );
  const dashRows = useMemo(() => buildDashRows(dashStudents), [dashStudents]);
  const dashAvg = dashRows.length ? Math.round((dashRows.reduce((a, r) => a + r.percent, 0) / dashRows.length) * 10) / 10 : 0;
  const dashPass = dashRows.filter((r) => r.percent >= 33).length;
  const dashTopper = dashRows.find((r) => r.rank === 1);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Academic"
        title="Examination Engine"
        description="CBSE-aligned scholastic & co-scholastic assessments with auto report cards, grading and analytics."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.success("Marks CSV exported")}>
              <Download className="h-4 w-4" />
              Export Marks
            </Button>
            <Button
              size="sm"
              className="gradient-primary border-0"
              onClick={() => {
                setExamEdit(null);
                setExamOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New Exam
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Upcoming Exams"
          value={exams.filter((e) => e.status !== "Completed").length.toString()}
          icon={<BookOpen className="h-5 w-5" />}
          tone="primary"
        />
        <KpiCard
          label="Marks Entered"
          value="86%"
          delta={4.2}
          icon={<FileText className="h-5 w-5" />}
          tone="info"
        />
        <KpiCard
          label="Average Score"
          value="78.4"
          delta={1.8}
          icon={<Trophy className="h-5 w-5" />}
          tone="success"
        />
        <KpiCard
          label="Questions Bank"
          value={questions.length.toString()}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="warning"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="dash">Dashboard</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="papers">Subjects & Papers</TabsTrigger>
          <TabsTrigger value="qb">Question Bank</TabsTrigger>
          <TabsTrigger value="blueprints">Blueprints</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="solutions">Solutions</TabsTrigger>
          <TabsTrigger value="marks">Marks Entry</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="dash" className="mt-4 space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Class Performance Explorer</CardTitle>
              <CardDescription>Pick a class &amp; section, apply the filter, then click any student to drill into their subject-wise breakdown.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Class</Label>
                  <Select value={dashClass} onValueChange={setDashClass}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{classOptions.map((c) => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Section</Label>
                  <Select value={dashSection} onValueChange={setDashSection}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{["A", "B", "C", "D"].map((c) => <SelectItem key={c} value={c}>Section {c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button size="sm" className="gradient-primary border-0" onClick={() => setDashApplied(true)}>
                  Apply Filters
                </Button>
                {dashApplied && (
                  <Button size="sm" variant="ghost" onClick={() => setDashApplied(false)}>Clear</Button>
                )}
              </div>

              {!dashApplied ? (
                <div className="rounded-lg border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                  Select a class &amp; section and press <span className="font-medium text-foreground">Apply Filters</span> to view results.
                </div>
              ) : dashRows.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                  No students found for Class {dashClass} · Section {dashSection}.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KpiCard label="Students" value={dashRows.length.toString()} icon={<BookOpen className="h-5 w-5" />} tone="primary" />
                    <KpiCard label="Class Average" value={dashAvg + "%"} icon={<Trophy className="h-5 w-5" />} tone="info" />
                    <KpiCard label="Passed" value={`${dashPass}/${dashRows.length}`} icon={<FileCheck2 className="h-5 w-5" />} tone="success" />
                    <KpiCard label="Topper" value={dashTopper ? `${dashTopper.percent}%` : "—"} icon={<Trophy className="h-5 w-5" />} tone="warning" />
                  </div>
                  <div className="rounded-lg border border-border/60 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Roll</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">%</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead className="text-right">Rank</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashRows.map((r) => (
                          <TableRow key={r.id} className="cursor-pointer" onClick={() => setDashDetail(r)}>
                            <TableCell className="font-mono text-xs">{r.roll}</TableCell>
                            <TableCell className="font-medium text-sm">{r.name}</TableCell>
                            <TableCell className="text-right text-sm">{r.total}/{r.maxTotal}</TableCell>
                            <TableCell className="text-right text-sm">{r.percent}%</TableCell>
                            <TableCell><Badge variant="outline" className={grade(r.percent).c}>{grade(r.percent).g}</Badge></TableCell>
                            <TableCell className="text-right text-sm">#{r.rank}</TableCell>
                            <TableCell><Eye className="h-4 w-4 text-muted-foreground" /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Subject-wise Average vs Top</CardTitle>
              <CardDescription>Term 1 · Class X</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={examPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="subject" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="avg" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="top" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Competency Radar</CardTitle>
              <CardDescription>CBSE skill mapping</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart
                  data={[
                    { skill: "Reasoning", v: 78 },
                    { skill: "Application", v: 82 },
                    { skill: "Recall", v: 88 },
                    { skill: "Analysis", v: 72 },
                    { skill: "Creativity", v: 65 },
                    { skill: "Communication", v: 80 },
                  ]}
                >
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="skill" fontSize={10} />
                  <PolarRadiusAxis fontSize={10} />
                  <Radar
                    dataKey="v"
                    stroke="var(--chart-2)"
                    fill="var(--chart-2)"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Exam Categories</CardTitle>
                <CardDescription>Term 1, Term 2, Pre-Board, Olympiad… use these to group papers and results.</CardDescription>
              </div>
              <Button size="sm" className="gradient-primary border-0" onClick={() => setCatOpen(true)}>
                <Plus className="h-4 w-4" /> New Category
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Weightage</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.description}</TableCell>
                      <TableCell>{c.weight}%</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => { setCategories((p) => p.filter((x) => x.id !== c.id)); toast.success("Category removed"); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((u) => (
                    <TableRow key={u.id} className="cursor-pointer hover:bg-muted/40" onClick={(e) => { if ((e.target as HTMLElement).closest("[data-no-row]")) return; navigate({ to: "/exams/$id", params: { id: u.id } }); }}>

                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.class}</TableCell>
                      <TableCell>{u.from}</TableCell>
                      <TableCell>{u.to}</TableCell>
                      <TableCell>{u.subjects}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            u.status === "In Progress"
                              ? "default"
                              : u.status === "Draft"
                                ? "outline"
                                : "secondary"
                          }
                        >
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell data-no-row>
                        <DropdownMenu>

                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info(`${u.name} · ${u.class} · ${u.from} – ${u.to}`)
                              }
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setExamEdit(u);
                                setExamOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                examsApi.update(u.id, {
                                  status:
                                    u.status === "Draft"
                                      ? "Scheduled"
                                      : u.status === "Scheduled"
                                        ? "In Progress"
                                        : "Completed",
                                });
                                toast.success("Status advanced");
                              }}
                            >
                              Advance status
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                examsApi.remove(u.id);
                                toast.success("Exam deleted");
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="papers" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Subjects & Papers</CardTitle>
                <CardDescription>Per-class subject papers with date, time, room and max marks.</CardDescription>
              </div>
              <div className="flex gap-2">
                <ExcelUpload
                  label="Import Papers"
                  templateHeaders={["category","className","subject","paper","date","time","duration","maxMarks","room"]}
                  templateName="exam-papers-template.xlsx"
                  onRows={(rows) => {
                    const fresh: ExamPaper[] = rows.filter((r) => r.subject).map((r, i) => ({
                      id: `xp-${Date.now()}-${i}`,
                      category: r.category || "Term 1",
                      className: r.className || "X",
                      subject: r.subject,
                      paper: r.paper || "Paper 1",
                      date: r.date || "",
                      time: r.time || "09:30",
                      duration: Number(r.duration) || 180,
                      maxMarks: Number(r.maxMarks) || 80,
                      room: r.room || "Hall A",
                    }));
                    setPapers((p) => [...p, ...fresh]);
                  }}
                />
                <Button size="sm" className="gradient-primary border-0"
                  onClick={() => { setPaperEdit(null); setPaperOpen(true); }}>
                  <Plus className="h-4 w-4" /> Add Subject / Paper
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Paper</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Max</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {papers.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                      <TableCell>{p.className}</TableCell>
                      <TableCell className="font-medium">{p.subject}</TableCell>
                      <TableCell>{p.paper}</TableCell>
                      <TableCell>{p.date}</TableCell>
                      <TableCell>{p.time}</TableCell>
                      <TableCell>{p.duration}m</TableCell>
                      <TableCell>{p.maxMarks}</TableCell>
                      <TableCell>{p.room}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => { setPapers((x) => x.filter((y) => y.id !== p.id)); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!papers.length && (
                    <TableRow><TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-8">No papers yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qb" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Question Bank</CardTitle>
                <CardDescription>{questions.length} questions · Bloom's tagged</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Input
                  placeholder="Search…"
                  className="h-8 w-48"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Select value={qfClass} onValueChange={setQfClass}>
                  <SelectTrigger className="h-8 w-28"><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={qfSubject} onValueChange={setQfSubject}>
                  <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Subject" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjectOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={qfExam} onValueChange={setQfExam}>
                  <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Exam Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exam Types</SelectItem>
                    {examTypeOptions.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
                <ImageOcrUpload
                  label="Scan Question Sheet"
                  sample={{
                    subject: "Math",
                    chapter: "Quadratic Equations",
                    question: "Solve for x: 2x² + 5x − 3 = 0",
                    answer: "x = 1/2 or x = −3",
                    diff: "Medium",
                    marks: 4,
                  }}
                  onParsed={() => {
                    setQEdit(null);
                    setQOpen(true);
                    toast.info("Open the form — sample extracted values shown below");
                  }}
                />
                <ExcelUpload
                  label="Import Questions"
                  templateHeaders={["subject","chapter","question","answer","diff","marks"]}
                  templateName="questions-template.xlsx"
                  onRows={(rows) => {
                    let n = 0;
                    rows.forEach((r) => {
                      if (!r.question) return;
                      const pdf = createQuestionPdf({
                        subject: r.subject || "Math",
                        chapter: r.chapter || "",
                        question: r.question,
                        answer: r.answer || "",
                        marks: Number(r.marks) || 1,
                      });
                      questionsApi.add({
                        subject: r.subject || "Math",
                        chapter: r.chapter || "",
                        question: r.question,
                        answer: r.answer || "",
                        diff: (r.diff as Question["diff"]) || "Medium",
                        marks: Number(r.marks) || 1,
                        pdfName: pdf.name,
                        pdfUrl: pdf.url,
                      });
                      n++;
                    });
                    if (n) toast.success(`${n} questions added to bank`);
                  }}
                />
                <Button size="sm" variant="outline" onClick={() => setGenOpen(true)}>
                  <Brain className="h-4 w-4" />
                  Generate Paper
                </Button>
                <Button
                  size="sm"
                  className="gradient-primary border-0"
                  onClick={() => {
                    setMultiAddOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Exam Type</TableHead>
                    <TableHead>Chapter</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>PDF</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQ.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono text-xs">{q.id}</TableCell>
                      <TableCell className="max-w-sm">
                        <div className="text-sm font-medium line-clamp-2">{q.question}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1">
                          Answer key: {q.answer || "Not added"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {q.className ? <Badge variant="outline">{q.className}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{q.subject}</Badge>
                      </TableCell>
                      <TableCell>
                        {q.examType ? <Badge variant="outline">{q.examType}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>{q.chapter}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            q.diff === "Hard"
                              ? "destructive"
                              : q.diff === "Medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {q.diff}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">{q.marks}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7"
                          onClick={() => openQuestionPdf(q)}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Open
                        </Button>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setQEdit(q);
                                setQOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                questionsApi.remove(q.id);
                                toast.success("Question deleted");
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blueprints" className="mt-4">
          <BlueprintsTab />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="solutions" className="mt-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Solution Documents</CardTitle>
              <CardDescription>Upload PDF/DOC solutions per subject and paper. Students see these after the exam window closes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-5 gap-3">
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select value={solnDraft.category} onValueChange={(v) => setSolnDraft((p) => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Class</Label>
                  <Select value={solnDraft.className} onValueChange={(v) => setSolnDraft((p) => ({ ...p, className: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["VI","VII","VIII","IX","X","XI","XII"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Subject</Label>
                  <Input value={solnDraft.subject ?? ""} onChange={(e) => setSolnDraft((p) => ({ ...p, subject: e.target.value }))} placeholder="Mathematics" />
                </div>
                <div>
                  <Label className="text-xs">Paper</Label>
                  <Input value={solnDraft.paper ?? ""} onChange={(e) => setSolnDraft((p) => ({ ...p, paper: e.target.value }))} placeholder="Paper 1" />
                </div>
                <div className="flex items-end">
                  <input ref={solnRef} type="file" accept=".pdf,.doc,.docx,image/*" hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f || !solnDraft.subject) { toast.error("Subject is required"); return; }
                      setSolutions((p) => [...p, {
                        id: `s-${Date.now()}`,
                        category: solnDraft.category || "Term 1",
                        className: solnDraft.className || "X",
                        subject: solnDraft.subject!,
                        paper: solnDraft.paper || "Paper 1",
                        fileName: f.name,
                      }]);
                      toast.success(`${f.name} uploaded`);
                      e.target.value = "";
                    }} />
                  <Button className="w-full" onClick={() => solnRef.current?.click()}>
                    <Upload className="h-4 w-4" /> Upload Solution
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Paper</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solutions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell><Badge variant="secondary">{s.category}</Badge></TableCell>
                      <TableCell>{s.className}</TableCell>
                      <TableCell className="font-medium">{s.subject}</TableCell>
                      <TableCell>{s.paper}</TableCell>
                      <TableCell className="text-xs"><FileCheck2 className="h-3.5 w-3.5 inline mr-1 text-success" />{s.fileName}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => setSolutions((p) => p.filter((x) => x.id !== s.id))}>
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!solutions.length && (
                    <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No solutions uploaded yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marks" className="mt-4 space-y-3">
          <Card className="border-border/60">
            <CardContent className="p-3 flex flex-wrap gap-2 items-center">
              <span className="text-[10px] uppercase text-muted-foreground mr-1">Filters</span>
              <Select defaultValue="X"><SelectTrigger className="h-8 w-28"><SelectValue placeholder="Class" /></SelectTrigger><SelectContent>{["VI","VII","VIII","IX","X","XI","XII"].map((c) => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent></Select>
              <Select defaultValue="B"><SelectTrigger className="h-8 w-28"><SelectValue placeholder="Section" /></SelectTrigger><SelectContent>{["A","B","C","D"].map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}</SelectContent></Select>
              <Select defaultValue="2025-26"><SelectTrigger className="h-8 w-32"><SelectValue placeholder="Academic Year" /></SelectTrigger><SelectContent>{["2024-25","2025-26","2026-27"].map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
              <Select defaultValue="Term 2"><SelectTrigger className="h-8 w-32"><SelectValue placeholder="Exam" /></SelectTrigger><SelectContent>{["Term 1","Term 2","Final"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              <span className="text-xs text-muted-foreground ml-2">Subjects & students refresh based on selected class</span>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Marks Entry · Class X-B · Term 2 · AY 2025-26</CardTitle>
                <CardDescription>Click any cell to edit · auto-saves · teachers can lock & publish to generate the class report</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setReportOpen(true)}>Preview Report Card</Button>
                <Button size="sm" onClick={() => { toast.success("Marks locked & class report generated for admin"); setReportOpen(true); }}>Lock & Publish</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Math /100</TableHead>
                    <TableHead>Sci /100</TableHead>
                    <TableHead>Eng /100</TableHead>
                    <TableHead>Soc /100</TableHead>
                    <TableHead>Hindi /100</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marks.map((m) => {
                    const total = m.math + m.sci + m.eng + m.soc + m.hin;
                    const pct = Math.round(total / 5);
                    const g = grade(pct);
                    return (
                      <TableRow key={m.roll}>
                        <TableCell>{m.roll}</TableCell>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        {[m.math, m.sci, m.eng, m.soc, m.hin].map((v, i) => (
                          <TableCell key={i}>
                            <Input defaultValue={v} className="h-7 w-14 text-xs" />
                          </TableCell>
                        ))}
                        <TableCell className="tabular-nums font-semibold">{total}</TableCell>
                        <TableCell className="tabular-nums">{pct}%</TableCell>
                        <TableCell>
                          <Badge className={g.c}>{g.g}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setReportStudent({ name: m.name, roll: String(m.roll), math: m.math, sci: m.sci, eng: m.eng, soc: m.soc, hin: m.hin }); setReportOpen(true); }}>Report</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-4 space-y-4">
          <Card className="border-border/60">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Class-wise Result Mapping</CardTitle>
                <CardDescription>Select course, class, section and exam — then enter marks per student per subject.</CardDescription>
              </div>
              <div className="flex gap-2">
                <ExcelUpload
                  label="Import Marks"
                  templateHeaders={["admissionNo", ...resSubjects]}
                  templateName={`marks-${resClass}-${resSection}.xlsx`}
                  onRows={(rows) => {
                    let n = 0;
                    rows.forEach((r) => {
                      const stu = resStudents.find((s) => s.admissionNo === r.admissionNo);
                      if (!stu) return;
                      const marksMap: Record<string, number> = {};
                      resSubjects.forEach((sub) => {
                        const v = Number(r[sub]);
                        if (!Number.isNaN(v)) marksMap[sub] = v;
                      });
                      setResultRows((p) => ({ ...p, [stu.id]: { studentId: stu.id, marks: { ...(p[stu.id]?.marks ?? {}), ...marksMap } } }));
                      n++;
                    });
                    if (n) toast.success(`${n} student marks imported`);
                  }}
                />
                <Button size="sm" variant="outline" onClick={() => {
                  const entries = resStudents
                    .filter((s) => resultRows[s.id])
                    .map((s) => ({ studentId: s.id, studentName: s.name, admissionNo: s.admissionNo, marks: resultRows[s.id].marks }));
                  if (entries.length === 0) return toast.error("Enter marks before saving");
                  storedResultsApi.saveBatch(resClass, resSection, resCategory, entries);
                  toast.success(`${entries.length} result(s) saved for Class ${resClass}-${resSection}`);
                }}>
                  <FileText className="h-4 w-4" /> Save Results
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const entries = resStudents
                    .filter((s) => resultRows[s.id])
                    .map((s) => ({ studentId: s.id, studentName: s.name, admissionNo: s.admissionNo, marks: resultRows[s.id].marks }));
                  if (entries.length === 0) return toast.error("Save results first");
                  storedResultsApi.saveBatch(resClass, resSection, resCategory, entries);
                  storedResultsApi.publish(resClass, resSection, resCategory);
                  toast.success("Results shared to parent portal");
                }}>
                  <Trophy className="h-4 w-4" /> Share to Parents
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Course</Label>
                  <Select value={resCourse} onValueChange={setResCourse}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["CBSE","ICSE","State Board","IB"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Class</Label>
                  <Select value={resClass} onValueChange={setResClass}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["VI","VII","VIII","IX","X","XI","XII"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Section</Label>
                  <Select value={resSection} onValueChange={setResSection}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["A","B","C","D"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Exam Category</Label>
                  <Select value={resCategory} onValueChange={setResCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Adm No.</TableHead>
                      <TableHead>Student</TableHead>
                      {resSubjects.map((s) => <TableHead key={s}>{s}</TableHead>)}
                      <TableHead>Total</TableHead>
                      <TableHead>%</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resStudents.length === 0 && (
                      <TableRow><TableCell colSpan={4 + resSubjects.length} className="text-center text-sm text-muted-foreground py-8">No students in Class {resClass}-{resSection}.</TableCell></TableRow>
                    )}
                    {resSubjects.length === 0 && resStudents.length > 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">Add subjects/papers for {resCategory} · Class {resClass} first.</TableCell></TableRow>
                    )}
                    {resSubjects.length > 0 && resStudents.map((stu) => {
                      const row = resultRows[stu.id]?.marks ?? {};
                      const total = resSubjects.reduce((a, s) => a + (row[s] || 0), 0);
                      const max = resSubjects.length * 100;
                      const pct = max ? Math.round((total / max) * 100) : 0;
                      const g = grade(pct);
                      return (
                        <TableRow key={stu.id}>
                          <TableCell className="font-mono text-xs">{stu.admissionNo}</TableCell>
                          <TableCell className="font-medium">{stu.name}</TableCell>
                          {resSubjects.map((sub) => (
                            <TableCell key={sub}>
                              <Input
                                type="number"
                                className="h-7 w-16 text-xs"
                                value={row[sub] ?? ""}
                                onChange={(e) => setMark(stu.id, sub, Number(e.target.value))}
                              />
                            </TableCell>
                          ))}
                          <TableCell className="tabular-nums font-semibold">{total}</TableCell>
                          <TableCell className="tabular-nums">{pct}%</TableCell>
                          <TableCell className="flex items-center gap-2">
                            <Badge className={g.c}>{g.g}</Badge>
                            <Button size="icon" variant="ghost" className="h-7 w-7" title="Result PDF"
                              onClick={() => printResultCard({
                                studentName: stu.name, admissionNo: stu.admissionNo,
                                className: resClass, section: resSection, category: resCategory,
                                subjects: resSubjects.map((sub) => ({ subject: sub, marks: row[sub] || 0, max: 100 })),
                              })}>
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-border/60">
              <CardHeader><CardTitle className="text-base">Top Performers</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {marks.slice(0, 5).sort((a, b) => (b.math+b.sci+b.eng+b.soc+b.hin)-(a.math+a.sci+a.eng+a.soc+a.hin)).map((m, i) => {
                  const total = m.math + m.sci + m.eng + m.soc + m.hin;
                  return (
                    <div key={m.roll} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/40">
                      <div className="h-8 w-8 rounded-full gradient-primary text-primary-foreground flex items-center justify-center text-xs font-bold">#{i + 1}</div>
                      <div className="flex-1"><div className="text-sm font-medium">{m.name}</div><div className="text-xs text-muted-foreground">Roll {m.roll}</div></div>
                      <div className="text-sm font-semibold tabular-nums">{total}/500</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardHeader><CardTitle className="text-base">Publishing Progress</CardTitle><CardDescription>Per-class status</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                {[{c:"VI",v:100},{c:"VII",v:100},{c:"VIII",v:92},{c:"IX",v:78},{c:"X",v:65},{c:"XI",v:40},{c:"XII",v:12}].map((r) => (
                  <div key={r.c} className="space-y-1">
                    <div className="flex justify-between text-xs"><span>Class {r.c}</span><span>{r.v}%</span></div>
                    <Progress value={r.v} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <CrudDialog
        open={examOpen}
        onOpenChange={setExamOpen}
        title={examEdit ? "Edit Exam" : "Create New Exam"}
        description="Schedule a new examination cycle."
        initial={
          examEdit
            ? {
                name: examEdit.name,
                class: examEdit.class,
                from: examEdit.from,
                to: examEdit.to,
                subjects: examEdit.subjects,
                status: examEdit.status,
              }
            : undefined
        }
        fields={[
          { name: "name", label: "Exam Name" },
          {
            name: "class",
            label: "Class",
            type: "select",
            options: ["VI", "VII", "VIII", "IX", "X", "XI", "XII"],
          },
          { name: "from", label: "From Date" },
          { name: "to", label: "To Date" },
          { name: "subjects", label: "No. of Subjects", type: "number" },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: ["Draft", "Scheduled", "In Progress", "Completed"],
          },
        ]}
        submitLabel={examEdit ? "Save Exam" : "Create Exam"}
        onSubmit={submitExam}
      />

      <CrudDialog
        open={qOpen}
        onOpenChange={setQOpen}
        title={qEdit ? "Edit Question" : "Add Question to Bank"}
        description="Manually enter the full question, answer key and marks. Saving stores a PDF copy for the question record."
        initial={
          qEdit
            ? {
                className: qEdit.className ?? "",
                examType: qEdit.examType ?? "",
                subject: qEdit.subject,
                chapter: qEdit.chapter,
                question: qEdit.question,
                answer: qEdit.answer,
                diff: qEdit.diff,
                marks: qEdit.marks,
              }
            : undefined
        }
        fields={[
          {
            name: "className",
            label: "Class",
            type: "select",
            options: classOptions,
          },
          {
            name: "examType",
            label: "Examination Type",
            type: "select",
            options: examTypeOptions,
          },
          {
            name: "subject",
            label: "Subject",
            type: "select",
            options: [
              "Math",
              "Science",
              "English",
              "Social",
              "Hindi",
              "CS",
              "Biology",
              "Economics",
            ],
          },
          { name: "chapter", label: "Chapter" },
          { name: "question", label: "Question Text", type: "textarea" },
          { name: "answer", label: "Answer Key / Evaluation Notes", type: "textarea" },
          {
            name: "diff",
            label: "Difficulty",
            type: "select",
            options: ["Easy", "Medium", "Hard"],
          },
          { name: "marks", label: "Marks", type: "number" },
        ]}
        submitLabel={qEdit ? "Save" : "Add Question"}
        onSubmit={submitQ}
      />

      <MultiQuestionDialog
        open={multiAddOpen}
        onOpenChange={setMultiAddOpen}
        classes={classOptions}
        subjects={subjectOptions}
        examTypes={examTypeOptions}
        onSubmit={submitMultiQ}
      />

      <CrudDialog
        open={genOpen}
        onOpenChange={setGenOpen}
        title="Generate Question Paper"
        description="Pick total marks and difficulty mix. Questions are sampled from the bank."
        fields={[
          {
            name: "subject",
            label: "Subject",
            type: "select",
            options: ["Math", "Science", "English", "Social", "Hindi", "CS"],
          },
          { name: "marks", label: "Total Marks", type: "number" },
          {
            name: "mix",
            label: "Difficulty Mix",
            type: "select",
            options: ["Balanced", "Easy-leaning", "Hard-leaning"],
          },
          { name: "duration", label: "Duration (mins)", type: "number" },
        ]}
        submitLabel="Generate"
        onSubmit={generatePaper}
      />

      <CrudDialog
        open={catOpen}
        onOpenChange={setCatOpen}
        title="New Exam Category"
        description="Group exams under a labelled category, e.g. Term 1 or Pre-Board."
        fields={[
          { name: "name", label: "Category Name" },
          { name: "description", label: "Description", type: "textarea" },
          { name: "weight", label: "Weightage %", type: "number" },
        ]}
        submitLabel="Create Category"
        onSubmit={(d) => {
          setCategories((p) => [
            ...p,
            { id: `c-${Date.now()}`, name: String(d.name), description: String(d.description || ""), weight: Number(d.weight) || 100 },
          ]);
          toast.success("Category added");
        }}
      />

      <CrudDialog
        open={paperOpen}
        onOpenChange={setPaperOpen}
        title={paperEdit ? "Edit Paper" : "Add Subject / Paper"}
        description="Schedule a subject paper with date, time, room and max marks."
        initial={paperEdit ? { ...paperEdit } as unknown as CrudRecord : undefined}
        fields={[
          { name: "category", label: "Category", type: "select", options: categories.map((c) => c.name) },
          { name: "className", label: "Class", type: "select", options: ["VI","VII","VIII","IX","X","XI","XII"] },
          { name: "subject", label: "Subject" },
          { name: "paper", label: "Paper (e.g. Paper 1)" },
          { name: "date", label: "Date", type: "date" },
          { name: "time", label: "Time (HH:MM)" },
          { name: "duration", label: "Duration (mins)", type: "number" },
          { name: "maxMarks", label: "Max Marks", type: "number" },
          { name: "room", label: "Room / Hall" },
        ]}
        submitLabel={paperEdit ? "Save Paper" : "Add Paper"}
        onSubmit={(d) => {
          const payload: ExamPaper = {
            id: paperEdit?.id ?? `xp-${Date.now()}`,
            category: String(d.category),
            className: String(d.className),
            subject: String(d.subject),
            paper: String(d.paper || "Paper 1"),
            date: String(d.date),
            time: String(d.time || "09:30"),
            duration: Number(d.duration) || 180,
            maxMarks: Number(d.maxMarks) || 80,
            room: String(d.room || "Hall A"),
          };
          setPapers((p) => paperEdit ? p.map((x) => x.id === paperEdit.id ? payload : x) : [...p, payload]);
          toast.success(paperEdit ? "Paper updated" : "Paper added");
        }}
      />
      <ReportCardDialog
        open={reportOpen}
        onOpenChange={(v) => { setReportOpen(v); if (!v) setReportStudent(null); }}
        student={{
          name: reportStudent?.name || "Class X-B",
          roll: reportStudent?.roll || "—",
          klass: "X",
          section: "B",
          admissionNo: "ADM2025-042",
          father: "Sample Parent",
          dob: "12-04-2010",
        }}
        academicYear="2025-26"
        term="Term 2"
        rows={reportStudent ? [
          { subject: "Mathematics", max: 100, marks: reportStudent.math },
          { subject: "Science", max: 100, marks: reportStudent.sci },
          { subject: "English", max: 100, marks: reportStudent.eng },
          { subject: "Social Studies", max: 100, marks: reportStudent.soc },
          { subject: "Hindi", max: 100, marks: reportStudent.hin },
        ] : [
          { subject: "Mathematics", max: 100, marks: 88 },
          { subject: "Science", max: 100, marks: 82 },
          { subject: "English", max: 100, marks: 79 },
          { subject: "Social Studies", max: 100, marks: 85 },
          { subject: "Hindi", max: 100, marks: 74 },
        ]}
      />

      <Dialog open={!!dashDetail} onOpenChange={(v) => !v && setDashDetail(null)}>
        <DialogContent className="max-w-lg">
          {dashDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">{dashDetail.name}</DialogTitle>
                <DialogDescription>
                  Roll #{dashDetail.roll} · Class {dashClass}-{dashSection} · Rank #{dashDetail.rank} of {dashRows.length}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border/60 p-3 text-center">
                  <div className="text-lg font-semibold">{dashDetail.total}/{dashDetail.maxTotal}</div>
                  <div className="text-[11px] text-muted-foreground">Total</div>
                </div>
                <div className="rounded-lg border border-border/60 p-3 text-center">
                  <div className="text-lg font-semibold">{dashDetail.percent}%</div>
                  <div className="text-[11px] text-muted-foreground">Percentage</div>
                </div>
                <div className="rounded-lg border border-border/60 p-3 text-center">
                  <div className="text-lg font-semibold">{grade(dashDetail.percent).g}</div>
                  <div className="text-[11px] text-muted-foreground">Overall Grade</div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Marks</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashDetail.subjects.map((s) => (
                    <TableRow key={s.subject}>
                      <TableCell className="font-medium text-sm">{s.subject}</TableCell>
                      <TableCell className="text-right text-sm">{s.obtained}/{s.max}</TableCell>
                      <TableCell className="text-right text-sm">{Math.round((s.obtained / s.max) * 100)}%</TableCell>
                      <TableCell><Badge variant="outline" className={grade(s.obtained).c}>{s.grade}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setDashDetail(null)}>Close</Button>
                <Button size="sm" className="gradient-primary border-0" onClick={() => {
                  setReportStudent({
                    name: dashDetail.name,
                    roll: String(dashDetail.roll),
                    math: dashDetail.subjects[0]?.obtained ?? 0,
                    sci: dashDetail.subjects[1]?.obtained ?? 0,
                    eng: dashDetail.subjects[2]?.obtained ?? 0,
                    soc: dashDetail.subjects[3]?.obtained ?? 0,
                    hin: dashDetail.subjects[4]?.obtained ?? 0,
                  });
                  setDashDetail(null);
                  setReportOpen(true);
                }}>
                  <FileText className="h-4 w-4" />Report Card
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
