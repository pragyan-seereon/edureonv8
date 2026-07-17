import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/kpi-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Wallet, BadgeIndianRupee, ArrowDownToLine, Send } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  useWallet, walletApi, useStudents, sectionChangeApi, useSectionChangeRequests,
} from "@/lib/store";

export const Route = createFileRoute("/student/wallet")({
  head: () => ({ meta: [{ title: "My Wallet & Requests — Edureon" }] }),
  component: StudentWallet,
});

function StudentWallet() {
  const { user } = useAuth();
  const allWallet = useWallet();
  const students = useStudents();
  const requests = useSectionChangeRequests();

  // pick the student record matching auth user; fall back to first
  const student = useMemo(() => {
    const byEmail = students.find((s) => s.email && user?.email && s.email.toLowerCase() === user.email.toLowerCase());
    return byEmail ?? students[0];
  }, [students, user]);

  const entries = student ? allWallet.filter((w) => w.studentId === student.id) : [];
  const balance = entries.reduce((s, w) => s + (w.type === "Credit" ? w.amount : -w.amount), 0);

  const myReqs = student ? requests.filter((r) => r.studentId === student.id) : [];

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmt, setRefundAmt] = useState<number>(0);
  const [acct, setAcct] = useState("");
  const [ifsc, setIfsc] = useState("");

  const requestRefund = () => {
    if (!student) return;
    if (refundAmt <= 0 || refundAmt > balance) return toast.error("Enter a valid amount within your balance");
    if (!acct || !ifsc) return toast.error("Bank account and IFSC are required");
    walletApi.add({
      studentId: student.id,
      type: "Refund",
      amount: refundAmt,
      reason: `Refund requested to A/c ${acct} · IFSC ${ifsc}`,
    });
    toast.success(`Refund of ₹${refundAmt.toLocaleString("en-IN")} requested`);
    setRefundOpen(false); setRefundAmt(0); setAcct(""); setIfsc("");
  };

  // section change request form
  const [reqOpen, setReqOpen] = useState(false);
  const [toSection, setToSection] = useState("A");
  const [reason, setReason] = useState("");
  const submitReq = () => {
    if (!student) return;
    if (!reason.trim()) return toast.error("Please share a reason");
    sectionChangeApi.add({
      studentId: student.id,
      studentName: student.name,
      fromClass: student.class,
      fromSection: student.section,
      toClass: student.class,
      toSection,
      reason,
    });
    toast.success("Request submitted — pending admin approval");
    setReqOpen(false); setReason("");
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Student · Wallet"
        title="My Wallet"
        description="Credits from fee adjustments (stream change, overpayment). Auto-adjusts against next year's fees or refundable to your bank."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Wallet Balance" value={"₹" + balance.toLocaleString("en-IN")} icon={<Wallet className="h-5 w-5" />} tone={balance > 0 ? "success" : "primary"} />
        <KpiCard label="Total Credits" value={"₹" + entries.filter((e) => e.type === "Credit").reduce((s, e) => s + e.amount, 0).toLocaleString("en-IN")} icon={<BadgeIndianRupee className="h-5 w-5" />} tone="info" />
        <KpiCard label="Refunded / Adjusted" value={"₹" + entries.filter((e) => e.type !== "Credit").reduce((s, e) => s + e.amount, 0).toLocaleString("en-IN")} icon={<ArrowDownToLine className="h-5 w-5" />} tone="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Wallet Activity</CardTitle>
              <CardDescription>All credits, debits and refund requests on your account.</CardDescription>
            </div>
            <Button size="sm" disabled={balance <= 0} onClick={() => setRefundOpen(true)}>
              <ArrowDownToLine className="h-4 w-4" /> Request Refund
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No wallet activity yet.</TableCell></TableRow>
                )}
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs">{new Date(e.date).toLocaleString("en-IN")}</TableCell>
                    <TableCell><Badge variant={e.type === "Credit" ? "default" : "outline"}>{e.type}</Badge></TableCell>
                    <TableCell className="text-sm">{e.reason}</TableCell>
                    <TableCell className={"text-right font-mono " + (e.type === "Credit" ? "text-success" : "text-destructive")}>
                      {e.type === "Credit" ? "+" : "-"}₹{e.amount.toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Section Change Request</CardTitle>
            <CardDescription>Raise a request to switch your section.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {student && (
              <div className="text-xs text-muted-foreground">Current: <Badge variant="secondary">{student.class}-{student.section}</Badge></div>
            )}
            <Button className="w-full gradient-primary border-0" onClick={() => setReqOpen(true)}>
              <Send className="h-4 w-4" /> New Request
            </Button>
            <div className="space-y-2 pt-2">
              <div className="text-xs font-semibold uppercase text-muted-foreground">My Requests</div>
              {myReqs.length === 0 && <div className="text-xs text-muted-foreground">No requests submitted.</div>}
              {myReqs.map((r) => (
                <div key={r.id} className="rounded-md border p-2 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span>{r.fromClass}-{r.fromSection} → {r.toClass}-{r.toSection}</span>
                    <Badge variant={r.status === "Approved" ? "default" : r.status === "Rejected" ? "destructive" : "outline"}>{r.status}</Badge>
                  </div>
                  <div className="text-muted-foreground truncate" title={r.reason}>{r.reason}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Refund to Bank</DialogTitle>
            <DialogDescription>Available balance: ₹{balance.toLocaleString("en-IN")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Amount (₹)</Label>
              <Input type="number" value={refundAmt} onChange={(e) => setRefundAmt(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Bank Account No.</Label>
              <Input value={acct} onChange={(e) => setAcct(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">IFSC</Label>
              <Input value={ifsc} onChange={(e) => setIfsc(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)}>Cancel</Button>
            <Button className="gradient-primary border-0" onClick={requestRefund}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reqOpen} onOpenChange={setReqOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Section Change Request</DialogTitle>
            <DialogDescription>Your request will be reviewed by the admin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Preferred Section</Label>
              <Select value={toSection} onValueChange={setToSection}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["A", "B", "C", "D", "E"].map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reason</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Why do you want to change your section?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReqOpen(false)}>Cancel</Button>
            <Button className="gradient-primary border-0" onClick={submitReq}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
