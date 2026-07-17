import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Smartphone, Wallet, Building2, ShieldCheck, CheckCircle2, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

export type RazorpayReceipt = {
  receiptNo: string;
  amount: number;
  date: string;
  method: string;
  txnId: string;
  description: string;
  payerName?: string;
  payerEmail?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  amount: number;
  description: string;
  payerName?: string;
  payerEmail?: string;
  onSuccess?: (r: RazorpayReceipt) => void;
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export function downloadReceipt(r: RazorpayReceipt) {
  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Receipt ${r.receiptNo}</title>
<style>
body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:680px;margin:32px auto;padding:24px;color:#0f172a}
.hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:16px;margin-bottom:24px}
.logo{font-size:22px;font-weight:800;letter-spacing:-.5px}
.muted{color:#64748b;font-size:12px}
.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:16px 0}
.row{display:flex;justify-content:space-between;padding:8px 0;font-size:14px}
.row+.row{border-top:1px dashed #e2e8f0}
.amt{font-size:32px;font-weight:800;color:#16a34a;margin:4px 0}
.tag{display:inline-block;background:#dcfce7;color:#15803d;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600}
.ft{margin-top:32px;font-size:11px;color:#64748b;text-align:center;border-top:1px solid #e2e8f0;padding-top:16px}
</style></head><body>
<div class="hd">
  <div><div class="logo">Edureon</div><div class="muted">Education Management Platform</div></div>
  <div style="text-align:right"><div class="muted">Receipt</div><div style="font-weight:700;font-family:monospace">${r.receiptNo}</div><div class="muted">${r.date}</div></div>
</div>
<div style="text-align:center"><span class="tag">✓ PAYMENT SUCCESSFUL</span><div class="amt">${inr(r.amount)}</div><div class="muted">${r.description}</div></div>
<div class="box">
  <div class="row"><span class="muted">Paid by</span><span>${r.payerName ?? "—"}</span></div>
  <div class="row"><span class="muted">Email</span><span>${r.payerEmail ?? "—"}</span></div>
  <div class="row"><span class="muted">Payment method</span><span>${r.method}</span></div>
  <div class="row"><span class="muted">Transaction ID</span><span style="font-family:monospace">${r.txnId}</span></div>
  <div class="row"><span class="muted">Date &amp; time</span><span>${r.date}</span></div>
  <div class="row"><span class="muted">Status</span><span style="color:#16a34a;font-weight:600">Captured</span></div>
</div>
<div class="ft">Powered by Razorpay · This is a computer-generated receipt and does not require a signature.<br/>For queries write to accounts@scholaris.app · GSTIN 29ABCDE1234F1Z5</div>
</body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Receipt-${r.receiptNo}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function RazorpayDialog({ open, onOpenChange, amount, description, payerName, payerEmail, onSuccess }: Props) {
  const [method, setMethod] = useState<"upi" | "card" | "netbanking" | "wallet">("upi");
  const [stage, setStage] = useState<"select" | "processing" | "done">("select");
  const [receipt, setReceipt] = useState<RazorpayReceipt | null>(null);
  const [upi, setUpi] = useState("student@okhdfc");
  const [card, setCard] = useState({ num: "4111 1111 1111 1111", name: payerName ?? "", exp: "12/28", cvv: "123" });
  const [bank, setBank] = useState("HDFC");
  const [wallet, setWallet] = useState("Paytm");

  const reset = () => { setStage("select"); setReceipt(null); };

  const pay = () => {
    setStage("processing");
    setTimeout(() => {
      const methodLabel =
        method === "upi" ? `UPI · ${upi}` :
        method === "card" ? `Card · **** ${card.num.slice(-4)}` :
        method === "netbanking" ? `NetBanking · ${bank}` :
        `Wallet · ${wallet}`;
      const r: RazorpayReceipt = {
        receiptNo: "RCP-" + Math.floor(100000 + Math.random() * 900000),
        amount, description, payerName, payerEmail,
        method: methodLabel,
        txnId: "pay_" + Math.random().toString(36).slice(2, 16).toUpperCase(),
        date: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      };
      setReceipt(r);
      setStage("done");
      onSuccess?.(r);
      toast.success("Payment successful", { description: `${inr(amount)} · ${r.txnId}` });
    }, 1800);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setTimeout(reset, 200); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-[#0a2540] to-[#1e3a8a] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-white/10 flex items-center justify-center font-bold text-sm">R</div>
            <div>
              <div className="text-sm font-semibold leading-tight">Razorpay</div>
              <div className="text-[10px] opacity-80">Secured by 256-bit SSL</div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/15 text-white border-0 text-[10px]"><ShieldCheck className="h-3 w-3 mr-1" />TEST MODE</Badge>
        </div>

        <DialogHeader className="px-5 pt-4 pb-0">
          <DialogTitle className="text-sm font-medium text-muted-foreground">Edureon School</DialogTitle>
          <DialogDescription className="sr-only">Payment</DialogDescription>
          <div className="text-2xl font-display font-bold">{inr(amount)}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </DialogHeader>

        {stage === "select" && (
          <div className="p-5 pt-3 space-y-3">
            <Tabs value={method} onValueChange={(v) => setMethod(v as typeof method)}>
              <TabsList className="grid grid-cols-4 w-full h-auto">
                <TabsTrigger value="upi" className="flex-col gap-1 py-2 text-[10px]"><Smartphone className="h-4 w-4" />UPI</TabsTrigger>
                <TabsTrigger value="card" className="flex-col gap-1 py-2 text-[10px]"><CreditCard className="h-4 w-4" />Card</TabsTrigger>
                <TabsTrigger value="netbanking" className="flex-col gap-1 py-2 text-[10px]"><Building2 className="h-4 w-4" />Bank</TabsTrigger>
                <TabsTrigger value="wallet" className="flex-col gap-1 py-2 text-[10px]"><Wallet className="h-4 w-4" />Wallet</TabsTrigger>
              </TabsList>

              <TabsContent value="upi" className="space-y-2 mt-4">
                <Label className="text-xs">UPI ID</Label>
                <Input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="yourname@bank" />
                <div className="flex gap-2 flex-wrap">
                  {["GPay", "PhonePe", "Paytm", "BHIM"].map((a) => (
                    <Badge key={a} variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setUpi(`student@ok${a.toLowerCase()}`)}>{a}</Badge>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="card" className="space-y-2 mt-4">
                <Label className="text-xs">Card Number</Label>
                <Input value={card.num} onChange={(e) => setCard({ ...card, num: e.target.value })} />
                <Label className="text-xs">Name on Card</Label>
                <Input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">Expiry</Label><Input value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} /></div>
                  <div><Label className="text-xs">CVV</Label><Input value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} type="password" /></div>
                </div>
              </TabsContent>

              <TabsContent value="netbanking" className="space-y-2 mt-4">
                <Label className="text-xs">Select Bank</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["HDFC", "ICICI", "SBI", "Axis", "Kotak", "Yes Bank"].map((b) => (
                    <button key={b} onClick={() => setBank(b)} className={`p-2 border rounded-md text-sm hover:bg-muted ${bank === b ? "border-primary bg-primary/5" : ""}`}>{b}</button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="wallet" className="space-y-2 mt-4">
                <Label className="text-xs">Select Wallet</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Paytm", "Mobikwik", "Freecharge", "Amazon Pay"].map((w) => (
                    <button key={w} onClick={() => setWallet(w)} className={`p-2 border rounded-md text-sm hover:bg-muted ${wallet === w ? "border-primary bg-primary/5" : ""}`}>{w}</button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <Separator />
            <Button className="w-full bg-[#0a2540] hover:bg-[#0a2540]/90 text-white" onClick={pay}>
              Pay {inr(amount)}
            </Button>
            <div className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
              <ShieldCheck className="h-3 w-3" />Your payment is secure. Test gateway — no real money will be charged.
            </div>
          </div>
        )}

        {stage === "processing" && (
          <div className="p-10 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-sm font-medium">Processing payment…</div>
            <div className="text-xs text-muted-foreground">Do not refresh or close this window</div>
          </div>
        )}

        {stage === "done" && receipt && (
          <div className="p-5 space-y-3">
            <div className="flex flex-col items-center gap-2 py-3">
              <div className="h-14 w-14 rounded-full bg-success/15 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div className="text-base font-semibold">Payment Successful</div>
              <div className="text-xs text-muted-foreground">{receipt.txnId}</div>
            </div>
            <div className="border rounded-md p-3 space-y-1.5 text-xs bg-muted/30">
              <div className="flex justify-between"><span className="text-muted-foreground">Receipt</span><span className="font-mono font-medium">{receipt.receiptNo}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{inr(receipt.amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span>{receipt.method}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{receipt.date}</span></div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => downloadReceipt(receipt)}>
                <Download className="h-4 w-4" />Download Receipt
              </Button>
              <Button className="flex-1" onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
