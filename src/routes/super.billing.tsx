import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { IndianRupee, Sparkles, Check, Flag, CreditCard, Smartphone, Building2, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/super/billing")({
  head: () => ({ meta: [{ title: "Subscriptions — Super Admin" }] }),
  component: BillingPage,
});

const plans = [
  { name: "Growth", price: "₹18,000", per: "/mo", features: ["Up to 1,000 students","Core academic","Fees + Attendance","Email + SMS","Standard support"], pop: false },
  { name: "Business", price: "₹48,000", per: "/mo", features: ["Up to 3,000 students","All academic + Ops","Library + Transport + Hostel","Push notifications","Priority support","Custom domain"], pop: true },
  { name: "Enterprise", price: "Custom", per: "", features: ["Unlimited students","White label + SSO","Dedicated success manager","Custom integrations","99.99% SLA","Advanced security"], pop: false },
];

const invoices = [
  { id: "INV-2025-1182", tenant: "Mothers Public School — Unit-1", plan: "Enterprise", amt: "₹84,000", status: "Paid", date: "1 Nov 2025" },
  { id: "INV-2025-1181", tenant: "Mothers Public School — Firestation", plan: "Enterprise", amt: "₹92,000", status: "Paid", date: "1 Nov 2025" },
  { id: "INV-2025-1180", tenant: "Mothers Public School — CTC", plan: "Business", amt: "₹58,000", status: "Paid", date: "1 Nov 2025" },
  { id: "INV-2025-1179", tenant: "Mothers Public School — Puri", plan: "Enterprise", amt: "₹76,000", status: "Pending", date: "1 Nov 2025" },
  { id: "INV-2025-1178", tenant: "Mothers Public School — RKL", plan: "Growth", amt: "₹31,000", status: "Paid", date: "1 Nov 2025" },
];

const flags = [
  { name: "AI Report Cards", desc: "Generate scholastic + co-scholastic remarks with AI", enabled: true, scope: "Enterprise" },
  { name: "Face-Recognition Attendance", desc: "Camera-based marking · beta", enabled: false, scope: "Business+" },
  { name: "Parent Mobile App v3", desc: "Refreshed parent app · phased rollout", enabled: true, scope: "All tenants" },
  { name: "Stripe Connect Payouts", desc: "Direct payout to institute account", enabled: false, scope: "Enterprise" },
  { name: "Advanced BI Builder", desc: "Drag-drop dashboards", enabled: true, scope: "Business+" },
];

function BillingPage() {
  const [pay, setPay] = useState<{ plan: string; price: string } | null>(null);
  const [subscribed, setSubscribed] = useState<string>("Business");

  return (
    <PageContainer>
      <PageHeader eyebrow="Super Admin" title="Subscriptions, Billing & Feature Flags"
        description="Plans, recurring revenue, invoices and tenant-wide feature toggles."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="MRR" value="₹5.19 L" delta={6.4} icon={<IndianRupee className="h-5 w-5" />} tone="primary" />
        <KpiCard label="ARR" value="₹62.3 L" delta={7.1} icon={<IndianRupee className="h-5 w-5" />} tone="success" />
        <KpiCard label="Churn (30d)" value="1.2%" delta={-0.4} icon={<Flag className="h-5 w-5" />} tone="warning" />
        <KpiCard label="LTV" value="₹14.2 L" icon={<Sparkles className="h-5 w-5" />} tone="info" />
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="flags">Feature Flags</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-4 grid md:grid-cols-3 gap-4">
          {plans.map(p => {
            const isSubscribed = subscribed === p.name;
            return (
            <Card key={p.name} className={`relative ${isSubscribed ? "border-success shadow-md ring-2 ring-success/30" : p.pop ? "border-primary shadow-md" : "border-border/60"}`}>
              {isSubscribed && <Badge className="absolute -top-2 left-4 bg-success text-white border-0"><Check className="h-3 w-3" />Subscribed</Badge>}
              {!isSubscribed && p.pop && <Badge className="absolute -top-2 left-4 gradient-primary border-0 text-primary-foreground">Most Popular</Badge>}
              <CardHeader>
                <CardTitle className="font-display text-xl">{p.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-display font-semibold text-foreground">{p.price}</span>
                  <span className="text-muted-foreground">{p.per}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm"><Check className="h-4 w-4 mt-0.5 text-success shrink-0" />{f}</li>
                  ))}
                </ul>
                {isSubscribed ? (
                  <Button className="w-full" variant="outline" disabled><Check className="h-4 w-4" />Current Plan</Button>
                ) : (
                  <Button className={`w-full ${p.pop ? "gradient-primary border-0" : ""}`} variant={p.pop ? "default" : "outline"}
                    onClick={() => p.price === "Custom"
                      ? toast.success("Sales team will reach out within 24h")
                      : setPay({ plan: p.name, price: p.price })}>
                    {p.price === "Custom" ? "Contact Sales" : `Choose ${p.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          );})}
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Tenant</TableHead><TableHead>Plan</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {invoices.map(i => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">{i.id}</TableCell>
                      <TableCell className="font-medium">{i.tenant}</TableCell>
                      <TableCell><Badge variant="secondary">{i.plan}</Badge></TableCell>
                      <TableCell className="tabular-nums">{i.amt}</TableCell>
                      <TableCell className="text-xs">{i.date}</TableCell>
                      <TableCell><Badge variant={i.status==="Paid"?"default":"destructive"}>{i.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flags" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="p-0 divide-y">
              {flags.map(f => (
                <div key={f.name} className="flex items-center gap-3 p-4">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{f.desc}</div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{f.scope}</Badge>
                  <Switch defaultChecked={f.enabled} onCheckedChange={(v) => toast.success(`${f.name}: ${v ? "Enabled" : "Disabled"}`)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PaymentDialog open={!!pay} onClose={() => setPay(null)} plan={pay?.plan ?? ""} price={pay?.price ?? ""} onSuccess={(planName) => setSubscribed(planName)} />
    </PageContainer>
  );
}

function PaymentDialog({ open, onClose, plan, price, onSuccess }: { open: boolean; onClose: () => void; plan: string; price: string; onSuccess?: (planName: string) => void }) {
  const [stage, setStage] = useState<"method" | "details" | "processing" | "success">("method");
  const [method, setMethod] = useState("card");
  const [form, setForm] = useState({ card: "", name: "", expiry: "", cvv: "", upi: "", gst: "" });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const reset = () => { setStage("method"); setMethod("card"); setForm({ card: "", name: "", expiry: "", cvv: "", upi: "", gst: "" }); };
  const close = () => { reset(); onClose(); };

  const pay = () => {
    if (method === "card" && (!form.card || !form.name || !form.expiry || !form.cvv)) {
      toast.error("Please fill all card details"); return;
    }
    if (method === "upi" && !form.upi) { toast.error("Enter your UPI ID"); return; }
    setStage("processing");
    setTimeout(() => { setStage("success"); onSuccess?.(plan); }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-lg">
        {stage === "success" ? (
          <>
            <DialogHeader>
              <div className="mx-auto h-12 w-12 rounded-full bg-success/15 flex items-center justify-center mb-2">
                <Check className="h-6 w-6 text-success" />
              </div>
              <DialogTitle className="text-center font-display">Payment successful</DialogTitle>
              <DialogDescription className="text-center">
                Your {plan} plan is now active. A receipt has been emailed.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-md border p-4 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="font-medium">{plan}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-medium">{price}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="font-medium capitalize">{method}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Txn ID</span><span className="font-mono text-xs">TXN-{Date.now().toString(36).toUpperCase()}</span></div>
            </div>
            <DialogFooter>
              <Button className="w-full gradient-primary border-0" onClick={close}>Done</Button>
            </DialogFooter>
          </>
        ) : stage === "processing" ? (
          <div className="py-12 text-center space-y-3">
            <div className="mx-auto h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <div className="text-sm font-medium">Processing payment…</div>
            <div className="text-xs text-muted-foreground">Do not close this window</div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">Upgrade to {plan} · {price}/mo</DialogTitle>
              <DialogDescription>Secure payment · 256-bit TLS · PCI-DSS compliant</DialogDescription>
            </DialogHeader>

            {stage === "method" && (
              <div className="space-y-3">
                <Label className="text-xs">Choose payment method</Label>
                <RadioGroup value={method} onValueChange={setMethod} className="grid grid-cols-1 gap-2">
                  <PayMethod id="card" current={method} icon={<CreditCard className="h-4 w-4" />} label="Credit / Debit Card" sub="Visa, Mastercard, RuPay, Amex" />
                  <PayMethod id="upi" current={method} icon={<Smartphone className="h-4 w-4" />} label="UPI" sub="GPay, PhonePe, Paytm, BHIM" />
                  <PayMethod id="netbanking" current={method} icon={<Building2 className="h-4 w-4" />} label="Net Banking" sub="50+ banks supported" />
                </RadioGroup>
                <DialogFooter>
                  <Button variant="outline" onClick={close}>Cancel</Button>
                  <Button className="gradient-primary border-0" onClick={() => setStage("details")}>Continue</Button>
                </DialogFooter>
              </div>
            )}

            {stage === "details" && (
              <div className="space-y-4">
                {method === "card" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1.5"><Label className="text-xs">Card number *</Label><Input value={form.card} onChange={(e)=>set("card", e.target.value)} placeholder="4242 4242 4242 4242" /></div>
                    <div className="col-span-2 space-y-1.5"><Label className="text-xs">Name on card *</Label><Input value={form.name} onChange={(e)=>set("name", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Expiry *</Label><Input value={form.expiry} onChange={(e)=>set("expiry", e.target.value)} placeholder="MM/YY" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">CVV *</Label><Input type="password" maxLength={4} value={form.cvv} onChange={(e)=>set("cvv", e.target.value)} placeholder="•••" /></div>
                  </div>
                )}
                {method === "upi" && (
                  <div className="space-y-1.5"><Label className="text-xs">UPI ID *</Label><Input value={form.upi} onChange={(e)=>set("upi", e.target.value)} placeholder="yourname@upi" /></div>
                )}
                {method === "netbanking" && (
                  <div className="space-y-1.5"><Label className="text-xs">Bank</Label>
                    <select className="w-full h-9 rounded-md border bg-background px-3 text-sm" defaultValue="HDFC">
                      {["HDFC Bank","ICICI Bank","SBI","Axis Bank","Kotak Mahindra"].map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                )}
                <div className="space-y-1.5"><Label className="text-xs">GSTIN (optional)</Label><Input value={form.gst} onChange={(e)=>set("gst", e.target.value)} placeholder="22AAAAA0000A1Z5" /></div>

                <div className="rounded-md bg-muted/40 p-3 text-xs space-y-1">
                  <div className="flex justify-between"><span>{plan} plan · 1 month</span><span>{price}</span></div>
                  <div className="flex justify-between"><span>GST 18%</span><span>included</span></div>
                  <div className="flex justify-between font-semibold text-sm pt-1 border-t mt-1"><span>Total today</span><span>{price}</span></div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Lock className="h-3 w-3" /> Encrypted · <ShieldCheck className="h-3 w-3" /> PCI-DSS Level 1
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setStage("method")}>Back</Button>
                  <Button className="gradient-primary border-0" onClick={pay}>Pay {price}</Button>
                </DialogFooter>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PayMethod({ id, current, icon, label, sub }: { id: string; current: string; icon: React.ReactNode; label: string; sub: string }) {
  const active = current === id;
  return (
    <label htmlFor={`pm-${id}`} className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition ${active ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
      <RadioGroupItem value={id} id={`pm-${id}`} />
      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground truncate">{sub}</div>
      </div>
    </label>
  );
}
