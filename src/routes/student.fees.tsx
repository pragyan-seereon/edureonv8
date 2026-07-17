import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, IndianRupee, CreditCard, Receipt, ShieldCheck } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { useState } from "react";
import { RazorpayDialog, downloadReceipt, type RazorpayReceipt } from "@/components/razorpay-dialog";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/student/fees")({
  head: () => ({ meta: [{ title: "My Fees — Edureon" }] }),
  component: StudentFees,
});

type Installment = { name: string; amount: number; dueDate: string; status: "Paid" | "Due" | "Upcoming"; paidOn: string };

const initialInstallments: Installment[] = [
  { name: "Term 1 — Tuition", amount: 48000, dueDate: "15 Apr 2025", status: "Paid", paidOn: "12 Apr 2025" },
  { name: "Term 1 — Transport", amount: 12000, dueDate: "15 Apr 2025", status: "Paid", paidOn: "12 Apr 2025" },
  { name: "Term 2 — Tuition", amount: 48000, dueDate: "30 Sep 2025", status: "Paid", paidOn: "28 Sep 2025" },
  { name: "Term 2 — Transport", amount: 12000, dueDate: "30 Sep 2025", status: "Paid", paidOn: "28 Sep 2025" },
  { name: "Term 3 — Tuition", amount: 48000, dueDate: "30 Nov 2025", status: "Due", paidOn: "—" },
  { name: "Term 3 — Transport", amount: 12000, dueDate: "30 Nov 2025", status: "Due", paidOn: "—" },
  { name: "Annual — Activity Fee", amount: 8000, dueDate: "31 Mar 2026", status: "Upcoming", paidOn: "—" },
];

const initialHistory: RazorpayReceipt[] = [
  { receiptNo: "RCP-1042", date: "28 Sep 2025, 11:14 AM", amount: 60000, method: "UPI · student@okupi", txnId: "pay_ICICI28092025871", description: "Term 2 — Tuition & Transport" },
  { receiptNo: "RCP-0921", date: "12 Apr 2025, 09:42 AM", amount: 60000, method: "NetBanking · HDFC", txnId: "pay_HDFC12042025004", description: "Term 1 — Tuition & Transport" },
];

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const statusColor: Record<Installment["status"], string> = {
  Paid: "bg-success/10 text-success border-success/20",
  Due: "bg-warning/15 text-warning border-warning/20",
  Upcoming: "bg-muted text-muted-foreground border-border",
};

function StudentFees() {
  const { user } = useAuth();
  const [installments, setInstallments] = useState(initialInstallments);
  const [history, setHistory] = useState<RazorpayReceipt[]>(initialHistory);
  const [payOpen, setPayOpen] = useState(false);

  const total = installments.reduce((s, i) => s + i.amount, 0);
  const paid = installments.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const due = installments.filter((i) => i.status === "Due").reduce((s, i) => s + i.amount, 0);
  const pct = Math.round((paid / total) * 100);

  const onSuccess = (r: RazorpayReceipt) => {
    setHistory((h) => [r, ...h]);
    setInstallments((list) =>
      list.map((i) => (i.status === "Due" ? { ...i, status: "Paid", paidOn: new Date().toLocaleDateString("en-IN") } : i))
    );
  };

  return (
    <PageContainer>
      <PageHeader eyebrow="Student Portal · Fees"
        title="My Fees"
        description="Installment schedule, payment history and instant downloads of receipts."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Annual Fee" value={inr(total)} icon={<IndianRupee className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Paid" value={inr(paid)} icon={<IndianRupee className="h-5 w-5" />} tone="success" />
        <KpiCard label="Due Now" value={inr(due)} icon={<IndianRupee className="h-5 w-5" />} tone="warning" />
        <KpiCard label="Progress" value={pct + "%"} icon={<IndianRupee className="h-5 w-5" />} tone="info" />
      </div>

      {due > 0 && (
        <Card className="border-border/60 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Term 3 — Pay Now</CardTitle>
            <CardDescription>Due 30 Nov 2025 · Powered by Razorpay <ShieldCheck className="inline h-3 w-3 ml-1" /></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <div>
                <div className="text-3xl font-display font-semibold">{inr(due)}</div>
                <div className="text-xs text-muted-foreground">Tuition ₹48,000 · Transport ₹12,000</div>
              </div>
              <Button size="lg" className="gradient-primary border-0" onClick={() => setPayOpen(true)}>
                <CreditCard className="h-5 w-5" />Pay {inr(due)}
              </Button>
            </div>
            <Progress value={pct} className="h-2" />
            <div className="text-xs text-muted-foreground mt-2">{inr(paid)} of {inr(total)} paid this academic year</div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="font-display text-base">Installment Schedule</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Installment</TableHead><TableHead>Due</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {installments.map((i) => (
                  <TableRow key={i.name}>
                    <TableCell className="text-sm">{i.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{i.dueDate}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{inr(i.amount)}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColor[i.status]}>{i.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="font-display text-base flex items-center gap-2"><Receipt className="h-4 w-4" />Payment History</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {history.map((h) => (
              <div key={h.receiptNo} className="flex items-center gap-3 p-3 border rounded-md">
                <div className="h-9 w-9 rounded-md flex items-center justify-center bg-success/10 text-success shrink-0"><IndianRupee className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{inr(h.amount)} · {h.method.split(" · ")[0]}</div>
                  <div className="text-[10px] text-muted-foreground">{h.date} · {h.receiptNo}</div>
                  <div className="text-[10px] text-muted-foreground font-mono truncate">{h.txnId}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => downloadReceipt({ ...h, payerName: user?.name, payerEmail: user?.email })}>
                  <Download className="h-3.5 w-3.5" />Receipt
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <RazorpayDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        amount={due}
        description="Term 3 — Tuition & Transport"
        payerName={user?.name}
        payerEmail={user?.email}
        onSuccess={onSuccess}
      />
    </PageContainer>
  );
}
