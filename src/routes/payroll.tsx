import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Briefcase, IndianRupee, Users, FileText, Plus, Download, MoreHorizontal, CheckCircle2, Eye, Trash2, Pencil, Layers } from "lucide-react";
import { usePayrollRuns, payrollApi, useEmployees, useSalaryStructures, type PayrollRun } from "@/lib/store";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useState } from "react";
import { PayrollDialog } from "@/components/payroll-dialog";
import { SalaryStructureManager } from "@/components/salary-structure-manager";
import { toast } from "sonner";

export const Route = createFileRoute("/payroll")({
  head: () => ({ meta: [{ title: "Payroll — Edureon ERP" }] }),
  component: PayrollPage,
});

const inr = (n: number) => "₹" + (n >= 1e5 ? (n / 1e5).toFixed(2) + " L" : n.toLocaleString("en-IN"));

const statusColor: Record<PayrollRun["status"], string> = {
  Draft: "bg-muted text-muted-foreground border-border",
  Approved: "bg-info/10 text-info border-info/20",
  Paid: "bg-success/10 text-success border-success/20",
};

function PayrollPage() {
  const runs = usePayrollRuns();
  const employees = useEmployees();
  const structures = useSalaryStructures();
  const [open, setOpen] = useState(false);

  const latest = runs[0];
  const trend = [...runs].reverse().map((r) => ({ month: r.month.split(" ")[0], gross: r.gross / 100000, net: r.net / 100000 }));

  return (
    <PageContainer>
      <PageHeader
        eyebrow="HR & Staff"
        title="Payroll"
        description="Salary structures, PF/ESI/TDS, payslip generation and bank transfer files."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.success("Bank file exported")}><Download className="h-4 w-4" />NEFT File</Button>
            <Button size="sm" className="gradient-primary border-0" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />Run Payroll
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="This Month" value={latest ? inr(latest.gross) : "—"} icon={<IndianRupee className="h-5 w-5" />} tone="primary" delta={2.1} />
        <KpiCard label="Payslips" value={latest ? latest.employeeCount.toString() : "0"} icon={<FileText className="h-5 w-5" />} tone="info" />
        <KpiCard label="On Payroll" value={employees.length.toString()} icon={<Users className="h-5 w-5" />} tone="success" />
        <KpiCard label="Salary Structures" value={structures.length.toString()} icon={<Layers className="h-5 w-5" />} tone="warning" />
      </div>

      <Tabs defaultValue="runs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="runs">Run Payroll</TabsTrigger>
          <TabsTrigger value="structures">Salary Structure</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="space-y-6">
      <Card className="border-border/60 mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base">Payroll Trend</CardTitle>
          <CardDescription>Gross vs net disbursement (₹ Lakhs)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="pg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pg2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="gross" stroke="var(--chart-1)" strokeWidth={2} fill="url(#pg1)" />
              <Area type="monotone" dataKey="net" stroke="var(--chart-2)" strokeWidth={2} fill="url(#pg2)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2 flex-row justify-between items-start space-y-0">
          <div>
            <CardTitle className="font-display text-base">Payroll Runs</CardTitle>
            <CardDescription>History of monthly salary cycles.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead>Run ID</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">TDS</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Run Date</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((r) => (
                <TableRow key={r.id} className="border-border/60 hover:bg-muted/40">
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="text-sm font-medium">{r.month}</TableCell>
                  <TableCell className="text-sm">{r.employeeCount}</TableCell>
                  <TableCell className="text-right">{inr(r.gross)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{inr(r.tds)}</TableCell>
                  <TableCell className="text-right font-semibold">{inr(r.net)}</TableCell>
                  <TableCell><Badge variant="outline" className={statusColor[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.runDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.success("Payslips emailed")}><Eye className="h-4 w-4" />View payslips</DropdownMenuItem>
                        {r.status !== "Paid" && (
                          <DropdownMenuItem onClick={() => { payrollApi.update(r.id, { status: r.status === "Draft" ? "Approved" : "Paid" }); toast.success("Status advanced"); }}>
                            <CheckCircle2 className="h-4 w-4" />{r.status === "Draft" ? "Approve" : "Mark paid"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => toast.success("NEFT file generated")}><Download className="h-4 w-4" />NEFT file</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => payrollApi.update(r.id, { status: "Draft" })}><Pencil className="h-4 w-4" />Reopen</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { payrollApi.remove(r.id); toast.success("Run deleted"); }}>
                          <Trash2 className="h-4 w-4" />Delete
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

        <TabsContent value="structures">
          <SalaryStructureManager />
        </TabsContent>
      </Tabs>

      <PayrollDialog open={open} onOpenChange={setOpen} />
    </PageContainer>
  );
}
