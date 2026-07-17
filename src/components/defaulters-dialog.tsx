import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, AlertTriangle, IndianRupee, Mail, Phone, CalendarDays, Download } from "lucide-react";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export type Defaulter = {
  studentId: string;
  name: string;
  klass: string;
  guardian: string;
  phone: string;
  email: string;
  pending: number;
  lateFee: number;
  monthsDue: string[];
  daysOverdue: number;
};

export type DefaulterContext = {
  title: string;
  subtitle: string;
  klass: string;
  period: string;
};

function seedHash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const FIRST = ["Aarav", "Ananya", "Vihaan", "Diya", "Kiara", "Rohan", "Saanvi", "Aditya", "Isha", "Kabir", "Myra", "Aryan", "Anika", "Reyansh", "Avni", "Krish", "Pari", "Dev", "Tara", "Arjun"];
const LAST = ["Sharma", "Iyer", "Patel", "Verma", "Mehta", "Kapoor", "Reddy", "Nair", "Joshi", "Singh", "Bansal", "Gupta", "Rao", "Khan", "Shetty"];
const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function generateDefaulters(klass: string, period: string, count: number, totalPending: number, totalLate: number): Defaulter[] {
  const base = seedHash(`${klass}-${period}`);
  const out: Defaulter[] = [];
  const usedIds = new Set<string>();
  let pendingLeft = totalPending;
  let lateLeft = totalLate;
  const safeCount = Math.max(1, count | 0);
  for (let i = 0; i < safeCount; i++) {
    const h = seedHash(`${base}-${i}`);
    const fn = FIRST[h % FIRST.length] ?? FIRST[0];
    const ln = LAST[(h >>> 4) % LAST.length] ?? LAST[0];
    const remaining = safeCount - i;
    const pending = i === safeCount - 1 ? pendingLeft : Math.round((pendingLeft / remaining) * (0.6 + ((h >>> 8) % 80) / 100));
    const late = i === safeCount - 1 ? lateLeft : Math.round((lateLeft / remaining) * (0.6 + ((h >>> 10) % 80) / 100));
    pendingLeft = Math.max(0, pendingLeft - pending);
    lateLeft = Math.max(0, lateLeft - late);
    const monthIdx = ALL_MONTHS.indexOf(period.split(" ")[0]);
    const dueMonths: string[] = [];
    const dueCount = 1 + ((h >>> 12) % 3);
    for (let k = 0; k < dueCount; k++) {
      const m = ALL_MONTHS[Math.max(0, (monthIdx >= 0 ? monthIdx : 6) - k)];
      if (m && !dueMonths.includes(m)) dueMonths.push(m);
    }
    let sid = "STU" + (1000 + ((h >>> 2) % 9000));
    let bump = 1;
    while (usedIds.has(sid)) { sid = "STU" + (1000 + (((h >>> 2) + bump * 137) % 9000)); bump++; }
    usedIds.add(sid);
    out.push({
      studentId: sid,
      name: `${fn} ${ln}`,
      klass: `Class ${klass}`,
      guardian: `${LAST[(h >>> 14) % LAST.length] ?? LAST[0]} (Parent)`,
      phone: `+91 9${((h >>> 6) % 900000000 + 100000000)}`.slice(0, 14),
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@parent.edureon.in`,
      pending,
      lateFee: late,
      monthsDue: dueMonths,
      daysOverdue: 5 + ((h >>> 16) % 60),
    });
  }
  return out;
}

function exportCSV(rows: Defaulter[], name: string) {
  const header = ["Student ID", "Name", "Class", "Guardian", "Phone", "Email", "Pending (₹)", "Late Fee (₹)", "Months Due", "Days Overdue"];
  const body = rows.map(r => [r.studentId, r.name, r.klass, r.guardian, r.phone, r.email, r.pending, r.lateFee, r.monthsDue.join("|"), r.daysOverdue]);
  const csv = [header, ...body].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function DefaultersDialog({
  open, onOpenChange, ctx, defaulters,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ctx: DefaulterContext | null;
  defaulters: Defaulter[];
}) {
  if (!ctx) return null;
  const totalPending = defaulters.reduce((s, d) => s + d.pending, 0);
  const totalLate = defaulters.reduce((s, d) => s + d.lateFee, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-5 sm:px-6 pt-5 pb-3 border-b">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg grid place-items-center bg-warning/10 text-warning shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-display text-base sm:text-lg truncate">{ctx.title}</DialogTitle>
              <DialogDescription className="text-xs">{ctx.subtitle}</DialogDescription>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
            <Stat icon={<Users className="h-3.5 w-3.5" />} label="Defaulters" value={String(defaulters.length)} />
            <Stat icon={<IndianRupee className="h-3.5 w-3.5" />} label="Pending Fees" value={inr(totalPending)} tone="warning" />
            <Stat icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Late Fees" value={inr(totalLate)} tone="destructive" />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border/60">
            {defaulters.map((d) => (
              <div key={d.studentId} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0"><AvatarFallback className="text-xs">{d.name.split(" ").map(s => s[0]).join("").slice(0,2)}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{d.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{d.studentId} · {d.klass}</div>
                      </div>
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-[10px] shrink-0">{d.daysOverdue}d</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {d.monthsDue.map(m => <Badge key={m} variant="secondary" className="text-[10px]"><CalendarDays className="h-2.5 w-2.5 mr-1" />{m}</Badge>)}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div><div className="text-[10px] text-muted-foreground">Pending</div><div className="font-semibold text-warning">{inr(d.pending)}</div></div>
                      <div><div className="text-[10px] text-muted-foreground">Late Fee</div><div className="font-semibold text-destructive">{inr(d.lateFee)}</div></div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Phone className="h-3 w-3" /><span className="truncate">{d.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Months Due</TableHead>
                  <TableHead>Guardian Contact</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-right">Late Fee</TableHead>
                  <TableHead className="text-right">Days Overdue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {defaulters.map((d) => (
                  <TableRow key={d.studentId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px]">{d.name.split(" ").map(s => s[0]).join("").slice(0,2)}</AvatarFallback></Avatar>
                        <div>
                          <div className="text-sm font-medium">{d.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{d.studentId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs"><Badge variant="secondary" className="font-mono text-[10px]">{d.klass}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {d.monthsDue.map(m => <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{d.phone}</div>
                      <div className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{d.email}</div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold text-warning">{inr(d.pending)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold text-destructive">{inr(d.lateFee)}</TableCell>
                    <TableCell className="text-right text-sm">{d.daysOverdue}d</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="px-5 sm:px-6 py-3 border-t bg-muted/30 flex-row gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV(defaulters, `defaulters-${ctx.klass}-${ctx.period}.csv`)}>
            <Download className="h-4 w-4" />Export CSV
          </Button>
          <Button size="sm" className="gradient-primary border-0" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "warning" | "destructive" }) {
  const c = tone === "warning" ? "text-warning" : tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-md border border-border/60 bg-card p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">{icon}{label}</div>
      <div className={`mt-1 font-display font-semibold text-sm sm:text-base ${c}`}>{value}</div>
    </div>
  );
}
