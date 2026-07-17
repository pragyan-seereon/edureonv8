import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Download, Receipt, FileUp, Search, FileBarChart2 } from "lucide-react";
import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { KpiCard } from "@/components/kpi-card";
import { toast } from "sonner";
import { FinanceAuditReport, type AuditReportData } from "@/components/finance-audit-report";
import { ExcelExport } from "@/components/excel-export";
import { DocumentUploadDialog } from "@/components/document-upload-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useExtraExpenses } from "@/lib/store";

export const Route = createFileRoute("/admin/expenses")({
  head: () => ({ meta: [{ title: "Expenses — Edureon" }] }),
  component: ExpensesPage,
});

type Expense = {
  id: string; date: string; category: string; description: string;
  amount: number; gst: number; total: number; mode: string; vendor: string;
  status: "Approved" | "Pending" | "Paid";
  kind: "OpEx" | "CapEx";
};

const CATS = ["Utilities", "Office Supplies", "Maintenance", "Events", "Software", "Travel", "Catering"];
const MODES = ["NEFT", "UPI", "Cash", "Cheque", "Card"];
const KINDS = ["OpEx", "CapEx"] as const;

const seed: Expense[] = [
  { id: "EXP-2451", date: "20 Nov 2025", category: "Utilities", description: "November electricity bill", amount: 184000, gst: 33120, total: 217120, mode: "NEFT", vendor: "DELDISCOM Ltd.", status: "Paid", kind: "OpEx" },
  { id: "EXP-2450", date: "19 Nov 2025", category: "Maintenance", description: "AC servicing — Block A", amount: 38000, gst: 6840, total: 44840, mode: "UPI", vendor: "CoolFix Services", status: "Approved", kind: "OpEx" },
  { id: "EXP-2449", date: "18 Nov 2025", category: "Events", description: "Annual Day decoration", amount: 92000, gst: 16560, total: 108560, mode: "Cheque", vendor: "Eventify", status: "Pending", kind: "OpEx" },
  { id: "EXP-2448", date: "17 Nov 2025", category: "Software", description: "Smart-board procurement — 8 units", amount: 240000, gst: 43200, total: 283200, mode: "Card", vendor: "Microsoft India", status: "Paid", kind: "CapEx" },
  { id: "EXP-2447", date: "15 Nov 2025", category: "Catering", description: "Staff lunch — Diwali", amount: 56000, gst: 2800, total: 58800, mode: "UPI", vendor: "Annapurna Caterers", status: "Paid", kind: "OpEx" },
  { id: "EXP-2446", date: "14 Nov 2025", category: "Office Supplies", description: "Lab furniture procurement", amount: 220000, gst: 39600, total: 259600, mode: "Cash", vendor: "BookWorld", status: "Approved", kind: "CapEx" },
  { id: "EXP-2445", date: "12 Nov 2025", category: "Travel", description: "Principal — board meeting (Mumbai)", amount: 38000, gst: 1900, total: 39900, mode: "Card", vendor: "MakeMyTrip", status: "Pending", kind: "OpEx" },
];

const trendData = [
  { month: "Jun", Utilities: 180, Maintenance: 60, Events: 30, Other: 40 },
  { month: "Jul", Utilities: 175, Maintenance: 45, Events: 20, Other: 55 },
  { month: "Aug", Utilities: 195, Maintenance: 80, Events: 80, Other: 60 },
  { month: "Sep", Utilities: 205, Maintenance: 70, Events: 25, Other: 50 },
  { month: "Oct", Utilities: 190, Maintenance: 55, Events: 35, Other: 70 },
  { month: "Nov", Utilities: 184, Maintenance: 38, Events: 92, Other: 78 },
];

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const statusColor: Record<Expense["status"], string> = {
  Pending: "bg-warning/15 text-warning border-warning/20",
  Approved: "bg-info/10 text-info border-info/20",
  Paid: "bg-success/10 text-success border-success/20",
};

function ExpensesPage() {
  const [items, setItems] = useState<Expense[]>(seed);
  // Expenses posted by other modules (e.g. resolved Classroom Maintenance) flow in as OpEx.
  const extra = useExtraExpenses();
  const allItems = [...(extra as Expense[]), ...items];
  const [filter, setFilter] = useState("All");
  const [status, setStatus] = useState("All");
  const [kind, setKind] = useState<"All" | "OpEx" | "CapEx">("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ kind: "OpEx" as "OpEx" | "CapEx", category: "Utilities", description: "", amount: "", gst: "", mode: "NEFT", vendor: "" });
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState<AuditReportData | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const filtered = allItems.filter((e) =>
    (filter === "All" || e.category === filter) &&
    (status === "All" || e.status === status) &&
    (kind === "All" || e.kind === kind) &&
    (!q || (e.description + e.vendor + e.id).toLowerCase().includes(q.toLowerCase()))
  );

  const total = allItems.reduce((s, e) => s + e.total, 0);
  const opex = allItems.filter((e) => e.kind === "OpEx").reduce((s, e) => s + e.total, 0);
  const capex = allItems.filter((e) => e.kind === "CapEx").reduce((s, e) => s + e.total, 0);
  const pending = allItems.filter((e) => e.status === "Pending").reduce((s, e) => s + e.total, 0);

  const submit = () => {
    const amount = Number(form.amount) || 0;
    const gst = Number(form.gst) || 0;
    const id = "EXP-" + (2452 + items.length);
    setItems((p) => [{
      id, date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      category: form.category, description: form.description, amount, gst, total: amount + gst,
      mode: form.mode, vendor: form.vendor, status: "Pending", kind: form.kind,
    }, ...p]);
    toast.success(`${form.kind} expense recorded · ${id}`);
    setOpen(false);
    setForm({ kind: "OpEx", category: "Utilities", description: "", amount: "", gst: "", mode: "NEFT", vendor: "" });
  };

  const buildReport = (): AuditReportData => {
    const cats = Array.from(new Set(items.map(e => e.category)));
    return {
      reportTitle: "Additional Expenses Audit Report",
      reportSubtitle: `OpEx vs CapEx ledger review · ${items.length} vouchers in scope`,
      reportCode: `AUD/EXP/${new Date().getFullYear()}`,
      period: new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
      institute: "Edureon International School",
      preparedBy: "S. Ramanathan, Bursar",
      reviewedBy: "Priya Mehta, Senior Accountant",
      approvedBy: "Dr. A. Khanna, Principal",
      summary: [
        { label: "Total Spend", value: total, tone: "net" },
        { label: "OpEx", value: opex, tone: "out" },
        { label: "CapEx", value: capex, tone: "in" },
      ],
      sections: [
        {
          title: "Category-wise Expenditure",
          rows: [
            ...cats.map(c => ({
              label: c,
              value: items.filter(e => e.category === c).reduce((s, e) => s + e.total, 0),
              note: `${items.filter(e => e.category === c).length} voucher(s)`,
            })),
            { label: "Total", value: total, note: "Sum of all categories", emphasis: true },
          ],
        },
        {
          title: "Approval Status",
          rows: [
            { label: "Paid", value: items.filter(e => e.status === "Paid").reduce((s, e) => s + e.total, 0), note: "Settled vouchers" },
            { label: "Approved (pending payment)", value: items.filter(e => e.status === "Approved").reduce((s, e) => s + e.total, 0), note: "Released for treasury" },
            { label: "Pending approval", value: pending, note: "Awaiting authorising signature", emphasis: true },
          ],
        },
      ],
      observations: [
        `${items.length} voucher(s) reviewed for the period; sample checked against bills and bank entries.`,
        `OpEx accounts for ${((opex / Math.max(1, total)) * 100).toFixed(1)}% and CapEx for ${((capex / Math.max(1, total)) * 100).toFixed(1)}% of total spend.`,
        "GST captured separately and reconciled with GSTR-2B; input credit posted.",
        "All CapEx items above ₹1,00,000 supported by purchase orders and goods-received notes.",
        "No expense found booked twice; vendor master verified for duplicate entries.",
      ],
      conclusion: "Based on our audit, the expense ledger fairly reflects the school's operational and capital outgo for the period under review. Internal controls relating to approval, GST capture and vendor onboarding are operating as intended, subject to the observations stated above.",
    };
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Admin · Finance"
        title="Additional Expenses"
        description="Track every non-payroll expense split into OpEx (operational) and CapEx (capital). GST capture, vendor mapping, approval workflow and bill storage."
        actions={
          <>
            <ExcelExport rows={items} fileName="expenses.xlsx" sheetName="Expenses" />
            <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}><FileUp className="h-4 w-4" />Upload Bill</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><FileBarChart2 className="h-4 w-4" />Audit Report</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setReport(buildReport()); setReportOpen(true); }}>Monthly Report</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setReport(buildReport()); setReportOpen(true); }}>Quarterly Report</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setReport(buildReport()); setReportOpen(true); }}>Annual Report</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm" className="gradient-primary border-0"><Plus className="h-4 w-4" />Add Expense</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Record new expense</DialogTitle>
                  <DialogDescription>Capture vendor, GST and supporting document. Submitted for approval.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Expense Type *</Label>
                    <Select value={form.kind} onValueChange={(v) => setForm((f) => ({ ...f, kind: v as "OpEx" | "CapEx" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OpEx">OpEx — Operational Expense</SelectItem>
                        <SelectItem value="CapEx">CapEx — Capital Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Category *</Label>
                    <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Payment Mode *</Label>
                    <Select value={form.mode} onValueChange={(v) => setForm((f) => ({ ...f, mode: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2"><Label>Description *</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>Vendor / Paid To *</Label><Input value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>Amount (₹) *</Label><Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>GST (₹)</Label><Input type="number" value={form.gst} onChange={(e) => setForm((f) => ({ ...f, gst: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>Total</Label><Input disabled value={inr((Number(form.amount) || 0) + (Number(form.gst) || 0))} /></div>
                  <div className="md:col-span-2"><Button variant="outline" className="w-full justify-start"><FileUp className="h-4 w-4" />Upload bill / invoice</Button></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={submit} className="gradient-primary border-0">Save Expense</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="This Month" value={inr(total)} icon={<Receipt className="h-5 w-5" />} tone="primary" delta={6.4} />
        <KpiCard label="OpEx — Operational" value={inr(opex)} icon={<Receipt className="h-5 w-5" />} tone="info" />
        <KpiCard label="CapEx — Capital" value={inr(capex)} icon={<Receipt className="h-5 w-5" />} tone="success" />
        <KpiCard label="Pending Approval" value={inr(pending)} icon={<Receipt className="h-5 w-5" />} tone="warning" />
      </div>

      <Card className="border-border/60 mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base">Monthly Expense by Category</CardTitle>
          <CardDescription>Stacked breakdown in ₹ thousands.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis fontSize={11} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Utilities" stackId="a" fill="var(--chart-1)" />
              <Bar dataKey="Maintenance" stackId="a" fill="var(--chart-2)" />
              <Bar dataKey="Events" stackId="a" fill="var(--chart-3)" />
              <Bar dataKey="Other" stackId="a" fill="var(--chart-4)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0 gap-2 flex-wrap">
          <div>
            <CardTitle className="font-display text-base">Expense Ledger</CardTitle>
            <CardDescription>{filtered.length} entries</CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-8 h-9 w-48" />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="All">All categories</SelectItem>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={kind} onValueChange={(v) => setKind(v as "All" | "OpEx" | "CapEx")}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{["All", ...KINDS].map((k) => <SelectItem key={k} value={k}>{k === "All" ? "All types" : k}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{["All", "Pending", "Approved", "Paid"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voucher</TableHead><TableHead>Date</TableHead><TableHead>Category</TableHead>
                <TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead>Vendor</TableHead>
                <TableHead className="text-right">Amount</TableHead><TableHead className="text-right">GST</TableHead>
                <TableHead className="text-right">Total</TableHead><TableHead>Mode</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.id}</TableCell>
                  <TableCell className="text-xs">{e.date}</TableCell>
                  <TableCell className="text-xs"><Badge variant="secondary" className="text-[10px]">{e.category}</Badge></TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className={e.kind === "CapEx" ? "text-[10px] bg-info/10 text-info border-info/20" : "text-[10px] bg-success/10 text-success border-success/20"}>{e.kind}</Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-[260px] truncate">{e.description}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.vendor}</TableCell>
                  <TableCell className="text-right text-sm">{inr(e.amount)}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{inr(e.gst)}</TableCell>
                  <TableCell className="text-right text-sm font-semibold">{inr(e.total)}</TableCell>
                  <TableCell className="text-xs">{e.mode}</TableCell>
                  <TableCell><Badge variant="outline" className={statusColor[e.status]}>{e.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FinanceAuditReport open={reportOpen} onOpenChange={setReportOpen} data={report} />
      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload Expense Bill / Invoice"
        categories={["Invoice", "Receipt", "Purchase Order", "GST Doc", "Other"]}
        onSubmit={() => {}}
      />
    </PageContainer>
  );
}
