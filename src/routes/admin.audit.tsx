import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, History, Search } from "lucide-react";
import { useState } from "react";
import { KpiCard } from "@/components/kpi-card";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Audit Log — Edureon" }] }),
  component: AuditPage,
});

const ACTIONS = ["Created", "Updated", "Deleted", "Approved", "Rejected", "Logged in", "Exported"];
const MODULES = ["Students", "Employees", "Fees", "Exams", "Payroll", "Library", "Permissions", "Auth"];

type Entry = {
  ts: string; user: string; role: string; action: string; module: string;
  record: string; old?: string; new?: string; ip: string;
};

const seed: Entry[] = [
  { ts: "Today 14:32:08", user: "Rahul Kapoor", role: "Principal", action: "Approved", module: "Fees", record: "Concession #C-2092 — Aarav Sharma", new: "Approved 20%", ip: "182.74.12.4" },
  { ts: "Today 14:18:51", user: "Priya Singh", role: "Accountant", action: "Created", module: "Fees", record: "TX10422 — ₹48,000 (Ananya Iyer)", ip: "182.74.12.4" },
  { ts: "Today 13:55:11", user: "Rahul Kapoor", role: "Principal", action: "Updated", module: "Permissions", record: "Role: Teacher — Exam.Approve", old: "OFF", new: "ON", ip: "182.74.12.4" },
  { ts: "Today 11:02:00", user: "Vikas Yadav", role: "HR Manager", action: "Created", module: "Employees", record: "EMP2031 — Sunita Roy (Maths)", ip: "182.74.12.4" },
  { ts: "Today 10:21:33", user: "system", role: "System", action: "Logged in", module: "Auth", record: "rahul.kapoor@dpsnorth.in", ip: "182.74.12.4" },
  { ts: "Yesterday 18:11:09", user: "Mrs. Sharma", role: "Teacher", action: "Updated", module: "Exams", record: "Mid-Term II · X-B · Question Q4", old: "Marks 4", new: "Marks 5", ip: "10.0.0.118" },
  { ts: "Yesterday 17:00:51", user: "Rahul Kapoor", role: "Principal", action: "Exported", module: "Students", record: "Students.xlsx (2,840 rows)", ip: "182.74.12.4" },
  { ts: "Yesterday 12:45:22", user: "Priya Singh", role: "Accountant", action: "Deleted", module: "Fees", record: "Draft invoice INV-DRAFT-208", ip: "182.74.12.4" },
];

const actionColor: Record<string, string> = {
  Created: "bg-info/10 text-info border-info/20",
  Updated: "bg-warning/15 text-warning border-warning/20",
  Deleted: "bg-destructive/10 text-destructive border-destructive/20",
  Approved: "bg-success/10 text-success border-success/20",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20",
  "Logged in": "bg-muted text-muted-foreground border-border",
  Exported: "bg-accent/15 text-accent border-accent/20",
};

function AuditPage() {
  const [q, setQ] = useState("");
  const [act, setAct] = useState("All");
  const [mod, setMod] = useState("All");

  const filtered = seed.filter((e) =>
    (act === "All" || e.action === act) &&
    (mod === "All" || e.module === mod) &&
    (!q || (e.user + e.record).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Admin · Security"
        title="Audit Log"
        description="Tamper-evident trail of every create / update / delete / approval across the institute. Filter by user, module or action; export for compliance."
        actions={<Button variant="outline" size="sm"><Download className="h-4 w-4" />Export</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Events Today" value={seed.filter((e) => e.ts.startsWith("Today")).length} icon={<History className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Critical (Delete/Reject)" value={seed.filter((e) => e.action === "Deleted" || e.action === "Rejected").length} icon={<History className="h-5 w-5" />} tone="warning" />
        <KpiCard label="Active Users" value={new Set(seed.map((e) => e.user)).size} icon={<History className="h-5 w-5" />} tone="info" />
        <KpiCard label="Modules Touched" value={new Set(seed.map((e) => e.module)).size} icon={<History className="h-5 w-5" />} tone="success" />
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0 gap-2 flex-wrap">
          <div>
            <CardTitle className="font-display text-base">Activity Stream</CardTitle>
            <CardDescription>{filtered.length} entries</CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user or record…" className="pl-8 h-9 w-52" />
            </div>
            <Select value={act} onValueChange={setAct}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="All">All actions</SelectItem>{ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={mod} onValueChange={setMod}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="All">All modules</SelectItem>{MODULES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Module</TableHead><TableHead>Record</TableHead><TableHead>Old → New</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((e, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-mono whitespace-nowrap">{e.ts}</TableCell>
                  <TableCell><div className="text-sm font-medium">{e.user}</div><div className="text-[10px] text-muted-foreground">{e.role}</div></TableCell>
                  <TableCell><Badge variant="outline" className={actionColor[e.action]}>{e.action}</Badge></TableCell>
                  <TableCell className="text-xs">{e.module}</TableCell>
                  <TableCell className="text-sm max-w-[280px] truncate">{e.record}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.old || e.new ? `${e.old ?? "—"} → ${e.new ?? "—"}` : "—"}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{e.ip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
