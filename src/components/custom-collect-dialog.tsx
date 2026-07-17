import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { feeApi, useFeeStructures, useStudents, type FeeTxn } from "@/lib/store";
import { toast } from "sonner";
import { QrCode, Send, Wallet } from "lucide-react";

type Mode = "Online" | "Cash" | "Cheque";

export function CustomCollectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const students = useStudents();
  const structures = useFeeStructures();

  const [studentId, setStudentId] = useState<string>("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [multiplier, setMultiplier] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<Mode>("Online");
  const [txnId, setTxnId] = useState("");
  const [remarks, setRemarks] = useState("");

  const student = students.find((s) => s.id === studentId);
  const structure = useMemo(
    () => (student ? structures.find((f) => f.class === student.class) : undefined),
    [student, structures],
  );

  useEffect(() => {
    if (open) {
      setStudentId(""); setSelected({}); setMultiplier({}); setMode("Online"); setTxnId(""); setRemarks("");
    }
  }, [open]);

  const lines = useMemo(() => {
    if (!structure) return [];
    return structure.components.filter((c) => selected[c.id]).map((c) => {
      const mult = multiplier[c.id] || 1;
      const isMonthly = c.frequency === "Monthly";
      return {
        id: c.id,
        label: c.label,
        frequency: c.frequency,
        unit: c.amount,
        mult: isMonthly ? mult : 1,
        total: c.amount * (isMonthly ? mult : 1),
      };
    });
  }, [structure, selected, multiplier]);

  const grandTotal = lines.reduce((s, l) => s + l.total, 0);

  const upiQrUrl = useMemo(() => {
    if (!grandTotal) return "";
    const payee = "scholaris@icici";
    const note = `Fees ${student?.id ?? ""}`;
    const upi = `upi://pay?pa=${payee}&pn=Edureon&am=${grandTotal}&cu=INR&tn=${encodeURIComponent(note)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upi)}`;
  }, [grandTotal, student]);

  const record = () => {
    if (!student || !structure) return toast.error("Choose a student first");
    if (!lines.length) return toast.error("Select at least one fee head");
    if (mode !== "Online" && !txnId.trim()) {
      // Allow blank for cash but nudge
      // (still record)
    }
    lines.forEach((l) => {
      feeApi.add({
        studentId: student.id,
        student: student.name,
        class: student.class,
        head: l.mult > 1 ? `${l.label} × ${l.mult}m` : l.label,
        amount: l.total,
        mode: (mode === "Online" ? "UPI" : mode) as FeeTxn["mode"],
        status: "Success",
      });
    });
    toast.success(`₹${grandTotal.toLocaleString("en-IN")} recorded${txnId ? ` · Ref ${txnId}` : ""}`);
    onOpenChange(false);
  };

  const notify = () => {
    if (!student || !lines.length) return toast.error("Pick student and fee heads first");
    toast.success(`Pay-now request of ₹${grandTotal.toLocaleString("en-IN")} sent to ${student.name}'s portal`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2"><Wallet className="h-4 w-4" />Custom Collection</DialogTitle>
          <DialogDescription>Select fee heads, apply a month multiplier, then either notify the parent portal or record an offline payment.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="Search student…" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} · {s.class}-{s.section} · {s.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Applicable Structure</Label>
            <div className="h-9 flex items-center px-3 rounded-md border border-input text-sm">
              {structure ? structure.name : <span className="text-muted-foreground">Pick a student to load structure</span>}
            </div>
          </div>
        </div>

        {structure && (
          <div className="rounded-lg border border-border/60">
            <div className="px-3 py-2 border-b text-xs font-medium text-muted-foreground bg-muted/40">Fee Heads · pick items and set month multiplier for monthly heads</div>
            <div className="divide-y">
              {structure.components.map((c) => {
                const chosen = !!selected[c.id];
                const mult = multiplier[c.id] || 1;
                const isMonthly = c.frequency === "Monthly";
                return (
                  <div key={c.id} className="flex items-center gap-3 p-3">
                    <Checkbox checked={chosen} onCheckedChange={(v) => setSelected((prev) => ({ ...prev, [c.id]: !!v }))} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{c.label}</div>
                      <div className="text-[11px] text-muted-foreground">₹{c.amount.toLocaleString("en-IN")} · <Badge variant="outline" className="text-[10px] ml-1">{c.frequency}</Badge></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] text-muted-foreground">Months</Label>
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        disabled={!chosen || !isMonthly}
                        value={mult}
                        onChange={(e) => setMultiplier((prev) => ({ ...prev, [c.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                        className="h-8 w-16 text-center"
                      />
                    </div>
                    <div className="w-28 text-right text-sm font-semibold">
                      ₹{(c.amount * (chosen ? (isMonthly ? mult : 1) : 0)).toLocaleString("en-IN")}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/30">
              <span className="text-sm text-muted-foreground">Grand Total</span>
              <span className="text-lg font-display font-semibold">₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Payment Mode</Label>
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as Mode)} className="grid grid-cols-3 gap-2">
            {(["Online", "Cash", "Cheque"] as Mode[]).map((m) => (
              <label key={m} className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer ${mode === m ? "border-primary bg-primary/5" : "border-border"}`}>
                <RadioGroupItem value={m} /> <span className="text-sm">{m}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        {mode === "Online" ? (
          <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            A Pay Now notification will be pushed to the student & parent portal. They can pay via UPI, card, or netbanking through Razorpay.
          </div>
        ) : (
          <div className="rounded-lg border p-3 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4">
            <div className="flex flex-col items-center gap-2">
              {grandTotal > 0 ? (
                <img src={upiQrUrl} alt="UPI QR" className="h-44 w-44 rounded-md border bg-white" />
              ) : (
                <div className="h-44 w-44 rounded-md border bg-muted/40 flex items-center justify-center text-muted-foreground">
                  <QrCode className="h-8 w-8" />
                </div>
              )}
              <div className="text-[10px] text-muted-foreground">Scan to pay · scholaris@icici</div>
            </div>
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Transaction / Receipt ID</Label>
                <Input placeholder="UTR / Cheque no / Cash receipt" value={txnId} onChange={(e) => setTxnId(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Remarks</Label>
                <Input placeholder="e.g. Received at front office" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </div>
              <p className="text-[11px] text-muted-foreground">Parent may scan the QR; alternatively fill the received amount above and record it manually.</p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {mode === "Online" ? (
            <Button onClick={notify} className="gradient-primary border-0"><Send className="h-4 w-4" />Send Pay Now Request</Button>
          ) : (
            <Button onClick={record} className="gradient-primary border-0">Record Payment · ₹{grandTotal.toLocaleString("en-IN")}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
