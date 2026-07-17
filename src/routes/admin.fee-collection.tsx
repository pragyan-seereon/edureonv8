import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { IndianRupee, AlertCircle, TrendingUp, Download, AlertTriangle, FileBarChart2, ChevronRight, Users } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from "recharts";
import { toast } from "sonner";
import { DefaultersDialog, generateDefaulters, type DefaulterContext } from "@/components/defaulters-dialog";
import { FinanceAuditReport, type AuditReportData } from "@/components/finance-audit-report";
import { ExcelExport } from "@/components/excel-export";

export const Route = createFileRoute("/admin/fee-collection")({
  head: () => ({ meta: [{ title: "Fee Collection — Edureon ERP" }] }),
  component: FeeCollectionPage,
});

const inr = (n: number) => "₹" + (n >= 1e5 ? (n / 1e5).toFixed(2) + " L" : n.toLocaleString("en-IN"));
const CLASSES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = ["2024", "2025", "2026"];

// Deterministic mock generator — expected/collected/pending/late per (year, month, class)
function seed(y: string, m: string, c: string) {
  let h = 0;
  const s = `${y}-${m}-${c}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
type Row = {
  klass: string; year: string; month: string;
  expected: number; collected: number; pending: number;
  lateFine: number; defaulters: number; students: number;
};
function buildRow(y: string, m: string, c: string): Row {
  const h = seed(y, m, c);
  const students = 38 + (h % 18); // 38..55
  const perStudent = 22000 + ((h >> 4) % 8) * 1000; // ₹22k..29k
  const expected = students * perStudent;
  const collectionPct = 0.72 + ((h >> 8) % 25) / 100; // 72%..96%
  const collected = Math.round((expected * collectionPct) / 1000) * 1000;
  const pending = expected - collected;
  const defaulters = Math.round(students * (1 - collectionPct));
  const lateFine = defaulters * (300 + ((h >> 12) % 5) * 100); // ₹300..700/student
  return { klass: c, year: y, month: m, expected, collected, pending, lateFine, defaulters, students };
}
function buildWeeks(y: string, m: string, c: string): Row[] {
  const monthRow = buildRow(y, m, c);
  // split into 4 weeks with deterministic weights
  const weights = [0.18, 0.31, 0.27, 0.24];
  return weights.map((w, i) => ({
    klass: c, year: y, month: `${m} W${i + 1}`,
    expected: Math.round(monthRow.expected * w),
    collected: Math.round(monthRow.collected * w),
    pending: Math.round(monthRow.pending * w),
    lateFine: Math.round(monthRow.lateFine * w),
    defaulters: Math.round(monthRow.defaulters * w),
    students: monthRow.students,
  }));
}

function exportCSV(rows: Row[], filename: string) {
  const header = ["Year", "Month/Week", "Class", "Students", "Expected", "Collected", "Pending", "Late Fine", "Defaulters", "Collection %"];
  const body = rows.map(r => [r.year, r.month, r.klass, r.students, r.expected, r.collected, r.pending, r.lateFine, r.defaulters, ((r.collected / r.expected) * 100).toFixed(1) + "%"]);
  const csv = [header, ...body].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success("Exported " + filename);
}

// ===== Payment reconciliation =====
const RECON_STATES = ["Pending", "Processing", "Success", "Failed", "Gateway Confirmation Pending"] as const;
type ReconState = (typeof RECON_STATES)[number];
const reconTone: Record<ReconState, string> = {
  Pending: "bg-muted text-foreground border-border",
  Processing: "bg-info/10 text-info border-info/20",
  Success: "bg-success/10 text-success border-success/20",
  Failed: "bg-destructive/10 text-destructive border-destructive/20",
  "Gateway Confirmation Pending": "bg-warning/15 text-warning border-warning/20",
};
const STUDENT_NAMES = ["Aarav Sharma", "Diya Menon", "Kabir Rao", "Ananya Iyer", "Vivaan Gupta", "Isha Nair", "Reyansh Das", "Myra Kapoor", "Aditya Verma", "Sara Khan"];
const RECON_MODES = ["UPI", "Card", "NetBanking", "NEFT", "Cheque"];
type ReconTxn = { id: string; student: string; klass: string; period: string; amount: number; mode: string; state: ReconState; ref: string; at: string };
function buildRecon(rows: Row[]): ReconTxn[] {
  const out: ReconTxn[] = [];
  let n = 0;
  for (const r of rows) {
    const h = seed(r.year, r.month, r.klass);
    const count = 2 + (h % 3); // 2..4 per row
    for (let i = 0; i < count; i++) {
      const hh = (h >> (i * 4)) >>> 0;
      const state = RECON_STATES[(hh + i) % RECON_STATES.length];
      out.push({
        id: "TXN-" + r.year.slice(2) + String(1000 + n),
        student: STUDENT_NAMES[hh % STUDENT_NAMES.length],
        klass: r.klass,
        period: `${r.month} ${r.year}`,
        amount: 5000 + ((hh >> 2) % 20) * 1000,
        mode: RECON_MODES[hh % RECON_MODES.length],
        state,
        ref: "PG" + (((hh >> 1) % 900000) + 100000),
        at: `${r.month} ${1 + (hh % 27)}, ${r.year}`,
      });
      n++;
      if (out.length >= 60) return out;
    }
  }
  return out;
}

function FeeCollectionPage() {
  const [year, setYear] = useState("2026");
  const [klass, setKlass] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");
  const [view, setView] = useState<"month" | "week">("month");
  const [q, setQ] = useState("");
  const [drillCtx, setDrillCtx] = useState<DefaulterContext | null>(null);
  const [drillRows, setDrillRows] = useState<ReturnType<typeof generateDefaulters>>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState<AuditReportData | null>(null);
  const [quick, setQuick] = useState<"none" | "pending" | "late" | "outstanding">("none");
  const [reconState, setReconState] = useState<string>("all");

  const openDrill = (r: Row, title: string) => {
    const defaulters = generateDefaulters(r.klass, `${r.month} ${r.year}`, r.defaulters || 1, r.pending, r.lateFine);
    setDrillRows(defaulters);
    setDrillCtx({
      title,
      subtitle: `Class ${r.klass} · ${r.month} ${r.year} · ${defaulters.length} defaulter(s)`,
      klass: r.klass,
      period: `${r.month}-${r.year}`,
    });
  };

  // Build rows based on filters
  const rows = useMemo<Row[]>(() => {
    const classes = klass === "all" ? CLASSES : [klass];
    const months = month === "all" ? MONTHS : [month];
    const out: Row[] = [];
    for (const c of classes) {
      for (const m of months) {
        if (view === "week" && month !== "all") {
          out.push(...buildWeeks(year, m, c));
        } else {
          out.push(buildRow(year, m, c));
        }
      }
    }
    return out.filter(r => !q || r.klass.toLowerCase().includes(q.toLowerCase()) || r.month.toLowerCase().includes(q.toLowerCase()));
  }, [year, klass, month, view, q]);

  // Quick-filter presets applied on top of the base filters (fewer clicks).
  const displayRows = useMemo(() => {
    let r = [...rows];
    if (quick === "pending") r = r.filter(x => x.pending > 0).sort((a, b) => b.pending - a.pending);
    else if (quick === "late") r = r.filter(x => x.lateFine > 0).sort((a, b) => b.lateFine - a.lateFine);
    else if (quick === "outstanding") {
      const avg = r.reduce((s, x) => s + x.pending, 0) / Math.max(1, r.length);
      r = r.filter(x => x.pending >= avg).sort((a, b) => b.pending - a.pending);
    }
    return r;
  }, [rows, quick]);

  const recon = useMemo(() => {
    const all = buildRecon(rows);
    return reconState === "all" ? all : all.filter(t => t.state === reconState);
  }, [rows, reconState]);
  const reconAll = useMemo(() => buildRecon(rows), [rows]);
  const reconCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of RECON_STATES) c[s] = reconAll.filter(t => t.state === s).length;
    return c;
  }, [reconAll]);

  const dueMonth = MONTHS[new Date().getMonth()];
  const totals = useMemo(() => rows.reduce((a, r) => ({
    expected: a.expected + r.expected,
    collected: a.collected + r.collected,
    pending: a.pending + r.pending,
    lateFine: a.lateFine + r.lateFine,
    defaulters: a.defaulters + r.defaulters,
  }), { expected: 0, collected: 0, pending: 0, lateFine: 0, defaulters: 0 }), [rows]);

  // Monthly trend across the selected year for the selected class (or all)
  const trend = useMemo(() => MONTHS.map(m => {
    const classes = klass === "all" ? CLASSES : [klass];
    let exp = 0, col = 0, late = 0;
    for (const c of classes) {
      const r = buildRow(year, m, c);
      exp += r.expected; col += r.collected; late += r.lateFine;
    }
    return { month: m, expected: exp, collected: col, lateFine: late };
  }), [year, klass]);

  // Late payment register — derived from rows
  const lateRegister = useMemo(() => rows
    .filter(r => r.lateFine > 0)
    .map(r => ({
      ...r,
      avgPerDefaulter: r.defaulters ? Math.round(r.lateFine / r.defaulters) : 0,
    }))
    .sort((a, b) => b.lateFine - a.lateFine), [rows]);

  const buildReport = (): AuditReportData => {
    const periodLabel = month === "all" ? `FY ${year}` : `${month} ${year}`;
    return {
      reportTitle: "Fee Collection Audit Report",
      reportSubtitle: `For the period ${periodLabel}${klass !== "all" ? ` · Class ${klass}` : " · All Classes"}`,
      reportCode: `AUD/FEE/${year}-${month === "all" ? "ALL" : month.toUpperCase()}`,
      period: periodLabel,
      institute: "Edureon International School",
      preparedBy: "S. Ramanathan, Bursar",
      reviewedBy: "Priya Mehta, Senior Accountant",
      approvedBy: "Dr. A. Khanna, Principal",
      summary: [
        { label: "Expected", value: totals.expected, tone: "net" },
        { label: "Collected", value: totals.collected, tone: "in" },
        { label: "Pending", value: totals.pending, tone: "out" },
      ],
      sections: [
        {
          title: "Class-wise Fee Position",
          rows: [
            ...rows.slice(0, 14).map(r => ({
              label: `Class ${r.klass} · ${r.month}`,
              value: r.collected as number,
              note: `Expected ${inr(r.expected)} · Pending ${inr(r.pending)}`,
            })),
            {
              label: "Total Collection",
              value: totals.collected as number,
              note: `${((totals.collected / Math.max(1, totals.expected)) * 100).toFixed(1)}% of expected`,
              emphasis: true,
            },
          ],
        },
        {
          title: "Late Payment & Penalty",
          rows: [
            { label: "Total Defaulters", value: String(totals.defaulters), note: "Unique students with arrears" },
            { label: "Late Fees Levied", value: totals.lateFine, note: "Per institute late-fee policy" },
            { label: "Pending Principal Dues", value: totals.pending, note: "Outstanding fee amount", emphasis: true },
          ],
        },
      ],
      observations: [
        `${((totals.collected / Math.max(1, totals.expected)) * 100).toFixed(1)}% of expected fees were collected during the audit period.`,
        `${totals.defaulters} defaulters identified; reminders dispatched via SMS, Email and WhatsApp.`,
        `Late payment penalties recovered amount to ${inr(totals.lateFine)}.`,
        "Receipts traced to bank statements; no discrepancies noted on sample basis.",
        "Refund register reviewed — refunds processed within 7 working days of approval.",
      ],
      conclusion: "Based on our audit, the fee collection records present a true and fair view of the school's receivables during the period under review. Internal controls over receipts, reconciliations and defaulter follow-up are operating effectively, subject to the observations stated above.",
    };
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Finance"
        title="Fee Collection"
        description="Month-wise expected vs collected vs pending, with late-payment fines. Filter by class, year, month or week. Click any row to drill into defaulters."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => exportCSV(rows, `fee-collection-${year}.csv`)}>
              <Download className="h-4 w-4" />Export CSV
            </Button>
            <ExcelExport rows={rows} fileName={`fee-collection-${year}.xlsx`} sheetName="Collection" label="Export Excel" />
            <Button size="sm" className="gradient-primary border-0" onClick={() => { setReport(buildReport()); setReportOpen(true); }}>
              <FileBarChart2 className="h-4 w-4" />Generate Audit Report
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Card className="border-border/60 mb-6">
        <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Class</Label>
            <Select value={klass} onValueChange={setKlass}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {CLASSES.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Month</Label>
            <Select value={month} onValueChange={(v) => { setMonth(v); if (v === "all") setView("month"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Granularity</Label>
            <Select value={view} onValueChange={(v) => setView(v as "month" | "week")} disabled={month === "all"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <Input placeholder="Class or month…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Expected" value={inr(totals.expected)} icon={<IndianRupee className="h-5 w-5" />} tone="info" />
        <KpiCard label="Collected" value={inr(totals.collected)} delta={totals.expected ? +(((totals.collected / totals.expected) * 100 - 85).toFixed(1)) : 0} icon={<TrendingUp className="h-5 w-5" />} tone="success" />
        <KpiCard label="Pending" value={inr(totals.pending)} icon={<AlertCircle className="h-5 w-5" />} tone="warning" />
        <KpiCard label="Late Payment Fines" value={inr(totals.lateFine)} icon={<AlertTriangle className="h-5 w-5" />} tone="primary" />
      </div>

      {/* Trend chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Monthly Trend — {year} {klass !== "all" ? `· Class ${klass}` : "· All Classes"}</CardTitle>
            <CardDescription>Expected vs collected</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => inr(v)} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="expected" name="Expected" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Late Fines Trend</CardTitle>
            <CardDescription>Penalty collected per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => inr(v)} />
                <Line type="monotone" dataKey="lateFine" stroke="var(--chart-5)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick filters — one click, fewer steps */}
      <div className="mb-4">
        <Label className="text-xs text-muted-foreground">Quick filters</Label>
        <div className="flex flex-wrap gap-2 mt-1.5">
          <Button size="sm" variant={quick === "none" ? "default" : "outline"} onClick={() => setQuick("none")}>All</Button>
          <Button size="sm" variant={quick === "pending" ? "default" : "outline"} onClick={() => setQuick("pending")}>Pending Fees</Button>
          <Button size="sm" variant={month === dueMonth ? "default" : "outline"} onClick={() => { setMonth(dueMonth); setView("month"); }}>Due Month ({dueMonth})</Button>
          <Button size="sm" variant={quick === "late" ? "default" : "outline"} onClick={() => setQuick("late")}>Late Fee</Button>
          <Button size="sm" variant={quick === "outstanding" ? "default" : "outline"} onClick={() => setQuick("outstanding")}>High Outstanding</Button>
        </div>
      </div>

      <Tabs defaultValue="breakdown">
        <TabsList>
          <TabsTrigger value="breakdown">Class × Period Breakdown</TabsTrigger>
          <TabsTrigger value="late">Late Payment Register</TabsTrigger>
          <TabsTrigger value="recon">Payment Reconciliation</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Detailed Breakdown</CardTitle>
              <CardDescription>{displayRows.length} rows · {view === "week" ? "weekly" : "monthly"} granularity{quick !== "none" ? ` · ${quick} view` : ""}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead>Class</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Collected</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Late Fine</TableHead>
                    <TableHead className="w-[160px]">Collection %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRows.map((r, i) => {
                    const pct = (r.collected / r.expected) * 100;
                    return (
                      <TableRow key={i} className="border-border/60 hover:bg-muted/40 cursor-pointer"
                        onClick={() => openDrill(r, `Pending Fees · Class ${r.klass} · ${r.month} ${r.year}`)}>
                        <TableCell><Badge variant="secondary" className="font-mono">Class {r.klass}</Badge></TableCell>
                        <TableCell className="text-sm">{r.month} {r.year}</TableCell>
                        <TableCell className="text-right text-sm">{r.students}</TableCell>
                        <TableCell className="text-right font-medium">{inr(r.expected)}</TableCell>
                        <TableCell className="text-right font-semibold text-success">{inr(r.collected)}</TableCell>
                        <TableCell className="text-right font-medium text-warning">{inr(r.pending)}</TableCell>
                        <TableCell className="text-right text-sm">{inr(r.lateFine)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-1.5 flex-1" />
                            <span className="text-xs tabular-nums w-10 text-right">{pct.toFixed(0)}%</span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {displayRows.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">No data for the selected filters.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="late" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Late Payment Fines</CardTitle>
              <CardDescription>Penalty collected for overdue dues. Sorted by total fine.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead>Class</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Defaulters</TableHead>
                    <TableHead className="text-right">Avg / Defaulter</TableHead>
                    <TableHead className="text-right">Total Late Fine</TableHead>
                    <TableHead className="text-right">Pending Principal</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lateRegister.map((r, i) => (
                    <TableRow key={i} className="border-border/60 hover:bg-muted/40 cursor-pointer"
                      onClick={() => openDrill(r, `Late Payment Defaulters · Class ${r.klass} · ${r.month} ${r.year}`)}>
                      <TableCell><Badge variant="secondary" className="font-mono">Class {r.klass}</Badge></TableCell>
                      <TableCell className="text-sm">{r.month} {r.year}</TableCell>
                      <TableCell className="text-right text-sm"><span className="inline-flex items-center gap-1"><Users className="h-3 w-3 text-muted-foreground" />{r.defaulters}</span></TableCell>
                      <TableCell className="text-right text-sm">{inr(r.avgPerDefaulter)}</TableCell>
                      <TableCell className="text-right font-semibold">{inr(r.lateFine)}</TableCell>
                      <TableCell className="text-right text-warning">{inr(r.pending)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" onClick={() => toast.success(`Reminders sent to ${r.defaulters} parents · Class ${r.klass} (${r.month})`)}>
                          Send Reminders
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {lateRegister.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No late fines for the selected filters.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recon" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3 flex-row items-end justify-between gap-3 flex-wrap space-y-0">
              <div>
                <CardTitle className="font-display text-base">Payment Reconciliation</CardTitle>
                <CardDescription>Gateway & bank settlement status for recent fee payments.</CardDescription>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Reconciliation state</Label>
                <Select value={reconState} onValueChange={setReconState}>
                  <SelectTrigger className="h-9 w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All states</SelectItem>
                    {RECON_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* State legend + counts */}
              <div className="flex flex-wrap gap-2 px-6 pb-3">
                {RECON_STATES.map(s => (
                  <button key={s} onClick={() => setReconState(reconState === s ? "all" : s)}
                    className="focus:outline-none">
                    <Badge variant="outline" className={"text-[10px] cursor-pointer " + reconTone[s]}>{s} · {reconCounts[s] ?? 0}</Badge>
                  </button>
                ))}
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead>Txn ID</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Gateway Ref</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recon.map((t) => (
                    <TableRow key={t.id} className="border-border/60 hover:bg-muted/40">
                      <TableCell className="font-mono text-[11px]">{t.id}</TableCell>
                      <TableCell className="text-sm">{t.student}</TableCell>
                      <TableCell><Badge variant="secondary" className="font-mono text-[10px]">Class {t.klass}</Badge></TableCell>
                      <TableCell className="text-xs">{t.period}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{inr(t.amount)}</TableCell>
                      <TableCell className="text-xs">{t.mode}</TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">{t.ref}</TableCell>
                      <TableCell><Badge variant="outline" className={"text-[10px] " + reconTone[t.state]}>{t.state}</Badge></TableCell>
                      <TableCell>
                        {t.state === "Failed" && <Button size="sm" variant="outline" onClick={() => toast.success(`Retry initiated for ${t.id}`)}>Retry</Button>}
                        {t.state === "Gateway Confirmation Pending" && <Button size="sm" variant="outline" onClick={() => toast.success(`Confirmation re-checked for ${t.id}`)}>Re-check</Button>}
                        {t.state === "Processing" && <span className="text-[11px] text-muted-foreground">Awaiting settlement</span>}
                        {t.state === "Pending" && <Button size="sm" variant="outline" onClick={() => toast.success(`Reminder sent for ${t.id}`)}>Remind</Button>}
                        {t.state === "Success" && <span className="text-[11px] text-success">Reconciled</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {recon.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">No transactions in this state.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DefaultersDialog open={!!drillCtx} onOpenChange={(v) => !v && setDrillCtx(null)} ctx={drillCtx} defaulters={drillRows} />
      <FinanceAuditReport open={reportOpen} onOpenChange={setReportOpen} data={report} />
    </PageContainer>
  );
}
