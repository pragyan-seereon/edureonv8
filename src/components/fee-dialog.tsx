import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { feeApi, type FeeTxn } from "@/lib/store";
import { toast } from "sonner";

const heads = ["Term 1 Tuition", "Term 2 Tuition", "Term 3 Tuition", "Exam Fee", "Lab Fee", "Transport Fee", "Hostel Fee", "Library Fee", "Annual Charges"];

export function FeeDialog({ open, onOpenChange, txn }: {
  open: boolean; onOpenChange: (v: boolean) => void; txn?: FeeTxn | null;
}) {
  const [f, setF] = useState({
    studentId: "", student: "", class: "X-A", head: "Term 2 Tuition",
    amount: 0, mode: "UPI" as FeeTxn["mode"], status: "Success" as FeeTxn["status"],
  });

  useEffect(() => {
    if (txn) setF({ studentId: txn.studentId, student: txn.student, class: txn.class, head: txn.head, amount: txn.amount, mode: txn.mode, status: txn.status });
    else if (open) setF({ studentId: "", student: "", class: "X-A", head: "Term 2 Tuition", amount: 0, mode: "UPI", status: "Success" });
  }, [txn, open]);

  const save = () => {
    if (!f.student || f.amount <= 0) return toast.error("Student and amount are required");
    if (txn) { feeApi.update(txn.id, f); toast.success("Transaction updated"); }
    else { feeApi.add(f); toast.success(`Receipt issued — ₹${f.amount.toLocaleString("en-IN")}`); }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">{txn ? "Edit Transaction" : "Collect Fee"}</DialogTitle>
          <DialogDescription>{txn ? "Update or refund this payment record." : "Record a new fee payment and generate receipt."}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <Field label="Student name"><Input value={f.student} onChange={(e) => setF({ ...f, student: e.target.value })} placeholder="Aarav Sharma" /></Field>
          <Field label="Class"><Input value={f.class} onChange={(e) => setF({ ...f, class: e.target.value })} placeholder="X-B" /></Field>
          <Field label="Fee head">
            <Select value={f.head} onValueChange={(v) => setF({ ...f, head: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{heads.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Amount (₹)"><Input type="number" min={0} value={f.amount} onChange={(e) => setF({ ...f, amount: parseInt(e.target.value) || 0 })} /></Field>
          <Field label="Payment mode">
            <Select value={f.mode} onValueChange={(v) => setF({ ...f, mode: v as FeeTxn["mode"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["UPI", "Card", "NetBanking", "Cash", "Cheque"] as const).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as FeeTxn["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["Success", "Pending", "Failed"] as const).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} className="gradient-primary border-0">{txn ? "Save" : "Issue receipt"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
