import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { IndianRupee, TrendingUp, AlertCircle, Plus, MoreHorizontal, Pencil, Trash2, Receipt, RefreshCcw, Layers, Wallet, FileBarChart2, CalendarRange, Send, Sparkles } from "lucide-react";
import { FinanceAuditReport, type AuditReportData } from "@/components/finance-audit-report";
import { ExcelExport } from "@/components/excel-export";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { feeCollectionTrend } from "@/lib/mock";
import {
  useFeeTxns, feeApi, type FeeTxn,
  useFeeStructures, feeStructureApi, type FeeStructure,
  usePaidMonths, useStudents,
  monthlyTotal, annualTotal, computeStudentDues,
} from "@/lib/store";
import { useMemo, useState } from "react";
import { FeeDialog } from "@/components/fee-dialog";
import { FeeStructureDialog } from "@/components/fee-structure-dialog";
import { CustomCollectDialog } from "@/components/custom-collect-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/fees")({
  head: () => ({ meta: [{ title: "Fees & Finance — Edureon ERP" }] }),
  component: FeesPage,
});

const inr = (n: number) => "₹" + (n >= 1e5 ? (n / 1e5).toFixed(2) + " L" : n.toLocaleString("en-IN"));
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const expenseBreak = [
  { name: "Salaries", value: 3200000 },
  { name: "Operations", value: 680000 },
  { name: "Maintenance", value: 240000 },
  { name: "Transport", value: 410000 },
  { name: "Utilities", value: 195000 },
];

const statusColor: Record<FeeTxn["status"], string> = {
  Success: "bg-success/10 text-success border-success/20",
  Pending: "bg-warning/15 text-warning border-warning/30",
  Failed: "bg-destructive/10 text-destructive border-destructive/20",
};

function FeesPage() {
  const tx = useFeeTxns();
  const structures = useFeeStructures();
  const students = useStudents();
  const paid = usePaidMonths();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FeeTxn | null>(null);

  const [structOpen, setStructOpen] = useState(false);
  const [editingStruct, setEditingStruct] = useState<FeeStructure | null>(null);

  const [collectFor, setCollectFor] = useState<{ studentId: string; name: string; class: string } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState<AuditReportData | null>(null);
  const [customOpen, setCustomOpen] = useState(false);

  const periodLabel = (p: "week" | "month" | "year") => {
    const d = new Date();
    if (p === "week") {
      const start = new Date(d); start.setDate(d.getDate() - 6);
      return `${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} – ${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;
    }
    if (p === "month") return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    return `FY ${d.getFullYear()}-${String((d.getFullYear() + 1) % 100).padStart(2, "0")}`;
  };
  const buildReport = (period: "week" | "month" | "year" = "month"): AuditReportData => ({
    reportTitle: `Fees & Finance Audit Report (${period === "week" ? "Weekly" : period === "month" ? "Monthly" : "Annual"})`,
    reportSubtitle: "Consolidated income, dues and late-fee position",
    reportCode: `AUD/F&F/${period.toUpperCase()}/${new Date().getFullYear()}`,
    period: periodLabel(period),
    institute: "Edureon International School",
    preparedBy: "S. Ramanathan, Bursar",
    reviewedBy: "Priya Mehta, Senior Accountant",
    approvedBy: "Dr. A. Khanna, Principal",
    summary: [
      { label: "Collection (FY)", value: totalFY, tone: "in" },
      { label: "Outstanding Dues", value: duesAgg.totalDue || 2160000, tone: "out" },
      { label: "Late Fees Accrued", value: duesAgg.totalLate, tone: "net" },
    ],
    sections: [
      {
        title: "Fee Collection Summary",
        rows: [
          { label: "Total collected during the year", value: totalFY, note: "All payment modes pooled" },
          { label: "Successful online + offline receipts", value: tx.filter(t => t.status === "Success").reduce((s, t) => s + t.amount, 0), note: `${tx.filter(t => t.status === "Success").length} txns` },
          { label: "Pending / failed transactions", value: tx.filter(t => t.status !== "Success").reduce((s, t) => s + t.amount, 0), note: `${tx.filter(t => t.status !== "Success").length} txns flagged` },
        ],
      },
      {
        title: "Outstanding & Defaulters",
        rows: [
          { label: "Students with dues", value: String(duesAgg.studentsWithDues), note: "Across all classes" },
          { label: "Outstanding principal", value: duesAgg.totalDue || 2160000, note: "Net of advances", emphasis: true },
          { label: "Late fee accrued", value: duesAgg.totalLate, note: "Per institute policy" },
        ],
      },
      {
        title: "Expense (P&L) Snapshot",
        rows: [
          ...expenseBreak.map(e => ({ label: e.name, value: e.value, note: "Monthly accrual" })),
          { label: "Total operating outgo", value: expenseBreak.reduce((s, e) => s + e.value, 0), note: "Sum of above", emphasis: true },
        ],
      },
    ],
    observations: [
      "Bank reconciliation completed up to month-end; no unmatched receipts beyond 3 days.",
      "All fee structures approved by the management committee on record.",
      "Late fee policy uniformly applied; no discretionary waivers without approval.",
      "Operating margin held at 28.4%, in line with prior period.",
      "Recommend stepping up follow-up on defaulters above 30 days overdue.",
    ],
    conclusion: "In our opinion, the Fees & Finance records present a true and fair view of the income and outstanding position of the institute for the period under review, and the related internal controls are operating effectively, subject to the observations above.",
  });

  const totalFY = 41700000 + tx.reduce((a, t) => a + (t.status === "Success" ? t.amount : 0), 0);

  // Aggregate dues across students for KPI
  const duesAgg = useMemo(() => {
    let totalDue = 0, totalLate = 0, studentsWithDues = 0;
    for (const s of students) {
      const r = computeStudentDues(s.class, s.id, structures, paid);
      if (r.totalDue > 0) studentsWithDues++;
      totalDue += r.totalDue;
      totalLate += r.totalLate;
    }
    return { totalDue, totalLate, studentsWithDues };
  }, [students, structures, paid]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Operations"
        title="Fees & Finance"
        description="Structures, collections, dues, late fees and full P&L visibility."
        actions={
          <>
            <ExcelExport rows={tx} fileName="fee-transactions.xlsx" sheetName="Transactions" label="Export" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><FileBarChart2 className="h-4 w-4" />Audit Report<CalendarRange className="h-3 w-3 ml-1 opacity-60" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setReport(buildReport("week")); setReportOpen(true); }}>Weekly Audit Report</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setReport(buildReport("month")); setReportOpen(true); }}>Monthly Audit Report</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setReport(buildReport("year")); setReportOpen(true); }}>Annual Audit Report</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" onClick={() => setCustomOpen(true)}><Sparkles className="h-4 w-4" />Custom Collection</Button>
            <Button size="sm" className="gradient-primary border-0" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4" />Collect Fee
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Collection (FY)" value={inr(totalFY)} delta={9.1} icon={<IndianRupee className="h-5 w-5" />} tone="success" />
        <KpiCard label="Outstanding Dues" value={inr(duesAgg.totalDue || 2160000)} delta={-3.4} icon={<AlertCircle className="h-5 w-5" />} tone="warning" />
        <KpiCard label="Late Fees Accrued" value={inr(duesAgg.totalLate)} delta={0} icon={<Wallet className="h-5 w-5" />} tone="info" />
        <KpiCard label="Operating Margin" value="28.4%" delta={1.8} icon={<TrendingUp className="h-5 w-5" />} tone="primary" />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="dues">Student Dues</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base">Monthly Collection</CardTitle>
                <CardDescription>Collected vs pending</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={feeCollectionTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `${v / 100000}L`} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => inr(v)} />
                    <Bar dataKey="collected" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base">Expense Breakdown</CardTitle>
                <CardDescription>This month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={expenseBreak} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={2}>
                      {expenseBreak.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => inr(v)} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsPanel
            tx={tx}
            onNew={() => { setEditing(null); setOpen(true); }}
            onEdit={(t) => { setEditing(t); setOpen(true); }}
          />
        </TabsContent>


        <TabsContent value="structures">
          <Card className="border-border/60">
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="font-display text-base flex items-center gap-2"><Layers className="h-4 w-4" />Fee Structures</CardTitle>
                <CardDescription>Create per-class structures. Auto-applied to every student of that class.</CardDescription>
              </div>
              <Button size="sm" className="gradient-primary border-0" onClick={() => { setEditingStruct(null); setStructOpen(true); }}>
                <Plus className="h-4 w-4" />New Structure
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Components</TableHead>
                    <TableHead className="text-right">Monthly</TableHead>
                    <TableHead className="text-right">Annual</TableHead>
                    <TableHead>Due Day</TableHead>
                    <TableHead>Late Fee</TableHead>
                    <TableHead className="text-right">Assigned</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {structures.map((s) => {
                    const assigned = students.filter((st) => st.class === s.class).length;
                    return (
                      <TableRow key={s.id} className="border-border/60 hover:bg-muted/40">
                        <TableCell className="text-sm font-medium">{s.name}</TableCell>
                        <TableCell><Badge variant="secondary" className="font-mono">{s.class}</Badge></TableCell>
                        <TableCell className="text-xs">{s.course ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.components.length} heads</TableCell>
                        <TableCell className="text-right font-semibold">{inr(monthlyTotal(s))}</TableCell>
                        <TableCell className="text-right">{inr(annualTotal(s))}</TableCell>
                        <TableCell className="text-xs">{s.dueDay}</TableCell>
                        <TableCell className="text-xs">₹{s.lateFeePerMonth}/mo · {s.graceDays}d grace</TableCell>
                        <TableCell className="text-right text-xs">{assigned} students</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditingStruct(s); setStructOpen(true); }}><Pencil className="h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { feeStructureApi.remove(s.id); toast.success("Structure removed"); }} className="text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {structures.length === 0 && (
                    <TableRow><TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-8">No fee structures yet. Click "New Structure" to begin.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dues">
          <DuesTab onCollect={setCollectFor} />
        </TabsContent>
      </Tabs>

      <FeeDialog open={open} onOpenChange={setOpen} txn={editing} />
      <FeeStructureDialog open={structOpen} onOpenChange={setStructOpen} structure={editingStruct} />
      <StudentDuesDialog target={collectFor} onClose={() => setCollectFor(null)} />
      <CustomCollectDialog open={customOpen} onOpenChange={setCustomOpen} />
      <FinanceAuditReport open={reportOpen} onOpenChange={setReportOpen} data={report} />
    </PageContainer>
  );
}

function TransactionsPanel({ tx, onNew, onEdit }: { tx: FeeTxn[]; onNew: () => void; onEdit: (t: FeeTxn) => void }) {
  const students = useStudents();
  const structures = useFeeStructures();
  const paid = usePaidMonths();

  // Build a per-student list of month-lines (paid / pending / upcoming)
  type Row = { studentId: string; student: string; class: string; section: string; head: string; amount: number; ym: string; label: string; kind: "paid" | "pending" | "upcoming"; date?: string };
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const s of students) {
      const r = computeStudentDues(s.class, s.id, structures, paid);
      if (!r.structure) continue;
      for (const l of r.lines) {
        const total = l.monthly + l.lateFee;
        const kind: Row["kind"] = l.paid ? "paid" : l.lateFee > 0 ? "pending" : "upcoming";
        out.push({
          studentId: s.id, student: s.name, class: s.class, section: s.section,
          head: `Monthly · ${l.label}`, amount: total, ym: l.ym, label: l.label, kind,
        });
      }
    }
    return out;
  }, [students, structures, paid]);

  const notify = (r: Row) => toast.success(`Pay Now request of ${inr(r.amount)} sent to ${r.student} · ${r.label}`);
  const notifyAll = (kind: "pending" | "upcoming") => {
    const n = rows.filter((r) => r.kind === kind).length;
    if (!n) return toast.error("Nothing to notify");
    toast.success(`Pay Now notification pushed to ${n} recipient${n > 1 ? "s" : ""}`);
  };

  return (
    <Card className="border-border/60">
      <Tabs defaultValue="all">
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0 gap-3 flex-wrap">
          <div>
            <CardTitle className="font-display text-base">Transactions & Dues</CardTitle>
            <CardDescription>All fee payments, pending & upcoming dues. Trigger pay-now reminders to student/parent portals.</CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <TabsList>
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="pending">Pending <Badge variant="outline" className="ml-2 bg-destructive/10 text-destructive border-destructive/20">{rows.filter(r => r.kind === "pending").length}</Badge></TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming <Badge variant="outline" className="ml-2 bg-warning/15 text-warning border-warning/30">{rows.filter(r => r.kind === "upcoming").length}</Badge></TabsTrigger>
            </TabsList>
            <Button size="sm" variant="outline" onClick={onNew}><Plus className="h-4 w-4" />Manual Entry</Button>
          </div>
        </CardHeader>

        <TabsContent value="all" className="mt-0">
          <div className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead>Txn ID</TableHead><TableHead>Student</TableHead><TableHead>Class</TableHead>
                  <TableHead>Fee Head</TableHead><TableHead className="text-right">Amount</TableHead>
                  <TableHead>Mode</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tx.map((t) => (
                  <TableRow key={t.id} className="border-border/60 hover:bg-muted/40">
                    <TableCell className="font-mono text-xs">{t.id}</TableCell>
                    <TableCell className="text-sm font-medium">{t.student}</TableCell>
                    <TableCell><Badge variant="secondary" className="font-mono">{t.class}</Badge></TableCell>
                    <TableCell className="text-sm">{t.head}</TableCell>
                    <TableCell className="text-right font-semibold">{inr(t.amount)}</TableCell>
                    <TableCell className="text-xs">{t.mode}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColor[t.status]}>{t.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.date}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.success("Receipt sent")}><Receipt className="h-4 w-4" />Email receipt</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(t)}><Pencil className="h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { feeApi.update(t.id, { status: "Failed" }); toast.success("Refund initiated"); }}><RefreshCcw className="h-4 w-4" />Refund</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { feeApi.remove(t.id); toast.success("Transaction removed"); }} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="paid" className="mt-0">
          <DueList rows={rows.filter((r) => r.kind === "paid")} kind="paid" />
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          <div className="flex justify-end px-4 pt-3">
            <Button size="sm" variant="outline" onClick={() => notifyAll("pending")}><Send className="h-4 w-4" />Notify All</Button>
          </div>
          <DueList rows={rows.filter((r) => r.kind === "pending")} kind="pending" onNotify={notify} />
        </TabsContent>

        <TabsContent value="upcoming" className="mt-0">
          <div className="flex justify-end px-4 pt-3">
            <Button size="sm" variant="outline" onClick={() => notifyAll("upcoming")}><Send className="h-4 w-4" />Notify All</Button>
          </div>
          <DueList rows={rows.filter((r) => r.kind === "upcoming")} kind="upcoming" onNotify={notify} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}

type DueRow = { studentId: string; student: string; class: string; section: string; head: string; amount: number; ym: string; label: string; kind: "paid" | "pending" | "upcoming" };

function DueList({ rows, kind, onNotify }: { rows: DueRow[]; kind: "paid" | "pending" | "upcoming"; onNotify?: (r: DueRow) => void }) {
  return (
    <div className="p-0 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead>Student</TableHead><TableHead>Class</TableHead>
            <TableHead>Fee Head</TableHead><TableHead>Period</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            {kind !== "paid" && <TableHead className="w-32 text-right">Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={`${r.studentId}-${r.ym}-${i}`} className="border-border/60 hover:bg-muted/40">
              <TableCell className="text-sm font-medium">{r.student}<div className="text-[10px] text-muted-foreground font-mono">{r.studentId}</div></TableCell>
              <TableCell><Badge variant="secondary" className="font-mono">{r.class}-{r.section}</Badge></TableCell>
              <TableCell className="text-sm">{r.head}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{r.label}</TableCell>
              <TableCell className="text-right font-semibold">{inr(r.amount)}</TableCell>
              <TableCell>
                {r.kind === "paid" && <Badge variant="outline" className="bg-success/10 text-success border-success/20">Paid</Badge>}
                {r.kind === "pending" && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Overdue</Badge>}
                {r.kind === "upcoming" && <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30">Upcoming</Badge>}
              </TableCell>
              {kind !== "paid" && (
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => onNotify?.(r)}><Send className="h-3.5 w-3.5" />Notify</Button>
                </TableCell>
              )}
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={kind === "paid" ? 6 : 7} className="text-center text-sm text-muted-foreground py-8">Nothing to show.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function DuesTab({ onCollect }: { onCollect: (s: { studentId: string; name: string; class: string }) => void }) {
  const students = useStudents();
  const structures = useFeeStructures();
  const paid = usePaidMonths();
  const [q, setQ] = useState("");
  const [cls, setCls] = useState<string>("all");
  const [sec, setSec] = useState<string>("all");

  const classes = useMemo(() => Array.from(new Set(students.map((s) => s.class))).sort(), [students]);
  const sections = useMemo(
    () => Array.from(new Set(students.filter((s) => cls === "all" || s.class === cls).map((s) => s.section))).sort(),
    [students, cls],
  );

  const rows = useMemo(() => {
    return students
      .filter((s) =>
        (cls === "all" || s.class === cls) &&
        (sec === "all" || s.section === sec) &&
        (q === "" || s.name.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase()))
      )
      .map((s) => {
        const r = computeStudentDues(s.class, s.id, structures, paid);
        const paidCount = r.lines.filter((l) => l.paid).length;
        const overdueCount = r.lines.filter((l) => !l.paid && l.lateFee > 0).length;
        const upcomingCount = r.lines.filter((l) => !l.paid && l.lateFee === 0).length;
        return { s, r, paidCount, overdueCount, upcomingCount };
      })
      .sort((a, b) => b.r.totalDue - a.r.totalDue);
  }, [students, structures, paid, q, cls, sec]);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="font-display text-base">Student Fee Accounts</CardTitle>
            <CardDescription>Read-only ledger view — paid, delayed, upcoming per student. Filter by class & section.</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Input placeholder="Search name or ID..." value={q} onChange={(e) => setQ(e.target.value)} className="w-56 h-9" />
            <Select value={cls} onValueChange={(v) => { setCls(v); setSec("all"); }}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sec} onValueChange={setSec}>
              <SelectTrigger className="h-9 w-32"><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map((s) => <SelectItem key={s} value={s}>Sec {s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Structure</TableHead>
              <TableHead className="text-right">Monthly</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Overdue</TableHead>
              <TableHead className="text-right">Upcoming</TableHead>
              <TableHead className="text-right">Late Fee</TableHead>
              <TableHead className="text-right">Total Due</TableHead>
              <TableHead className="w-28 text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ s, r, paidCount, overdueCount, upcomingCount }) => (
              <TableRow key={s.id} className="border-border/60 hover:bg-muted/40">
                <TableCell className="text-sm font-medium">{s.name}<div className="text-[10px] text-muted-foreground font-mono">{s.id}</div></TableCell>
                <TableCell><Badge variant="secondary" className="font-mono">{s.class}-{s.section}</Badge></TableCell>
                <TableCell className="text-xs">{r.structure?.name ?? <span className="text-muted-foreground">No structure</span>}</TableCell>
                <TableCell className="text-right text-sm">{r.structure ? inr(monthlyTotal(r.structure)) : "—"}</TableCell>
                <TableCell className="text-right text-sm"><Badge variant="outline" className="bg-success/10 text-success border-success/20">{paidCount}</Badge></TableCell>
                <TableCell className="text-right text-sm">{overdueCount > 0 ? <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{overdueCount}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-right text-sm">{upcomingCount > 0 ? <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30">{upcomingCount}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-right text-sm">{r.totalLate > 0 ? <span className="text-destructive font-semibold">{inr(r.totalLate)}</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-right font-semibold">{r.totalDue > 0 ? inr(r.totalDue) : <span className="text-success">Clear</span>}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" disabled={!r.structure} onClick={() => onCollect({ studentId: s.id, name: s.name, class: s.class })}>View</Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-8">No students match the filters.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StudentDuesDialog({ target, onClose }: { target: { studentId: string; name: string; class: string } | null; onClose: () => void }) {
  const structures = useFeeStructures();
  const paid = usePaidMonths();
  if (!target) return null;
  const r = computeStudentDues(target.class, target.studentId, structures, paid);

  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Fee Account — {target.name}</DialogTitle>
          <DialogDescription>
            {r.structure ? `${r.structure.name} · Due day ${r.structure.dueDay} · Late fee ₹${r.structure.lateFeePerMonth}/mo` : "No structure assigned to this class."}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60">
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Monthly</TableHead>
                <TableHead className="text-right">Late Fee</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.lines.map((l) => {
                const total = l.monthly + l.lateFee;
                return (
                  <TableRow key={l.ym} className="border-border/60">
                    <TableCell className="text-sm">{l.label}</TableCell>
                    <TableCell className="text-right text-sm">{inr(l.monthly)}</TableCell>
                    <TableCell className="text-right text-sm">{l.lateFee > 0 ? <span className="text-destructive">{inr(l.lateFee)}</span> : "—"}</TableCell>
                    <TableCell className="text-right font-semibold">{inr(total)}</TableCell>
                    <TableCell className="text-right">
                      {l.paid
                        ? <Badge variant="outline" className="bg-success/10 text-success border-success/20">Paid</Badge>
                        : l.lateFee > 0
                          ? <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Delayed</Badge>
                          : <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30">Upcoming</Badge>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            Late fees accrued: <span className="text-destructive font-semibold">{inr(r.totalLate)}</span>
          </div>
          <div className="text-base font-display font-semibold">
            Total outstanding: {inr(r.totalDue)}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
