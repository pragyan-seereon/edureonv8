import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, ChevronLeft, ChevronRight, FileUp, FileCheck2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { institutesApi } from "@/lib/store";

export const Route = createFileRoute("/super/institutes/new")({
  head: () => ({ meta: [{ title: "New Institute — Edureon" }] }),
  component: NewInstitutePage,
});

const STEPS = [
  { id: 1, title: "Basic Info", desc: "Identity & branding" },
  { id: 2, title: "Contact & Address", desc: "Location details" },
  { id: 3, title: "Key People", desc: "Principal & admin" },
  { id: 4, title: "Financial", desc: "GST / PAN" },
  { id: 5, title: "Documents", desc: "Compliance uploads" },
  { id: 6, title: "Review", desc: "Confirm & submit" },
];

const DOC_SLOTS = [
  "Registration Certificate", "NOC", "Affiliation Certificate", "Address Proof",
  "GST Certificate", "PAN Card", "Fire Safety NOC", "ISO / NAAC Certificate",
  "Land / Building Docs", "Other Supporting Document",
];

type Form = Record<string, string>;
type DocState = Record<string, "pending" | "uploaded">;

function NewInstitutePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>({
    name: "", type: "Senior Secondary", board: "CBSE", academicYear: "2025-26",
    primaryColor: "#1e3a5f", address: "", city: "", state: "", pin: "", country: "India",
    phone: "", email: "", website: "",
    principalName: "", principalPhone: "", adminName: "", adminPhone: "",
    gst: "", pan: "",
  });
  const [docs, setDocs] = useState<DocState>(Object.fromEntries(DOC_SLOTS.map((d) => [d, "pending"])) as DocState);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const uploadedCount = Object.values(docs).filter((s) => s === "uploaded").length;

  const next = () => setStep((s) => Math.min(6, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const submit = () => {
    if (!form.name.trim()) { toast.error("Institute name is required"); setStep(1); return; }
    institutesApi.add({
      name: form.name, city: form.city || "—", students: 0,
      plan: "Growth", status: "Trial", mrr: 0,
      type: form.type, board: form.board, academicYear: form.academicYear,
      address: form.address, state: form.state, pin: form.pin, country: form.country,
      phone: form.phone, email: form.email, website: form.website,
      principalName: form.principalName, principalPhone: form.principalPhone,
      adminName: form.adminName, adminPhone: form.adminPhone,
      gst: form.gst, pan: form.pan, primaryColor: form.primaryColor,
      documents: Object.entries(docs).filter(([,s])=>s==="uploaded").map(([k])=>k),
    });
    toast.success(`Institute "${form.name}" created`, { description: "Onboarding email sent to admin." });
    router.navigate({ to: "/super/institutes" });
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Super Admin · Onboarding"
        title="Create new institute"
        description="Six-step compliance-grade onboarding. All institute data, GST, and statutory documents are captured before going live."
        actions={<Button variant="outline" size="sm" onClick={() => router.navigate({ to: "/super/institutes" })}>Cancel</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Stepper */}
        <Card className="border-border/60 h-fit lg:sticky lg:top-20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display">Onboarding progress</CardTitle>
            <CardDescription className="text-xs">Step {step} of 6</CardDescription>
            <Progress value={(step / 6) * 100} className="h-1.5 mt-2" />
          </CardHeader>
          <CardContent className="space-y-1 p-2">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`w-full text-left flex items-start gap-2.5 p-2.5 rounded-md transition-colors ${
                  step === s.id ? "bg-primary/10" : s.id < step ? "hover:bg-muted/50" : "hover:bg-muted/30"
                }`}
              >
                <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                  s.id < step ? "bg-success text-success-foreground" :
                  s.id === step ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {s.id < step ? <Check className="h-3 w-3" /> : s.id}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{s.title}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{s.desc}</div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Active step */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-lg">{STEPS[step - 1].title}</CardTitle>
            <CardDescription>{STEPS[step - 1].desc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Institute Name *"><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Mothers Public School — New Location" /></Field>
                <Field label="Type">
                  <Select value={form.type} onValueChange={(v) => set("type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Pre-Primary", "Primary", "Secondary", "Senior Secondary", "K-12", "College"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Board Affiliation">
                  <Select value={form.board} onValueChange={(v) => set("board", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["CBSE", "ICSE", "IB", "State Board", "Cambridge"].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Academic Year"><Input value={form.academicYear} onChange={(e) => set("academicYear", e.target.value)} /></Field>
                <Field label="Brand Primary Color">
                  <div className="flex items-center gap-2">
                    <Input type="color" value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className="w-16 h-9 p-1" />
                    <Input value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} />
                  </div>
                </Field>
                <Field label="Logo">
                  <Button variant="outline" className="w-full justify-start"><FileUp className="h-4 w-4" />Upload logo (PNG/SVG)</Button>
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Street Address *" className="md:col-span-2"><Textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
                <Field label="City *"><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
                <Field label="State *"><Input value={form.state} onChange={(e) => set("state", e.target.value)} /></Field>
                <Field label="PIN Code *"><Input value={form.pin} onChange={(e) => set("pin", e.target.value)} /></Field>
                <Field label="Country"><Input value={form.country} onChange={(e) => set("country", e.target.value)} /></Field>
                <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 …" /></Field>
                <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
                <Field label="Website" className="md:col-span-2"><Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" /></Field>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Principal Name *"><Input value={form.principalName} onChange={(e) => set("principalName", e.target.value)} /></Field>
                <Field label="Principal Phone *"><Input value={form.principalPhone} onChange={(e) => set("principalPhone", e.target.value)} /></Field>
                <Field label="Admin Contact Name *"><Input value={form.adminName} onChange={(e) => set("adminName", e.target.value)} /></Field>
                <Field label="Admin Phone *"><Input value={form.adminPhone} onChange={(e) => set("adminPhone", e.target.value)} /></Field>
              </div>
            )}

            {step === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="GST Number"><Input value={form.gst} onChange={(e) => set("gst", e.target.value)} placeholder="22AAAAA0000A1Z5" /></Field>
                <Field label="PAN Number"><Input value={form.pan} onChange={(e) => set("pan", e.target.value)} placeholder="AAAPL1234C" /></Field>
                <div className="md:col-span-2 flex items-start gap-2 p-3 rounded-md bg-info/10 border border-info/20 text-xs">
                  <AlertCircle className="h-4 w-4 text-info shrink-0 mt-0.5" />
                  <div><span className="font-semibold">Note: </span>Tax info is used for invoicing only. You can update it later from Institute Settings.</div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium">Statutory Documents</div>
                  <Badge variant="outline" className="text-xs">{uploadedCount} of {DOC_SLOTS.length} uploaded</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DOC_SLOTS.map((d) => (
                    <div key={d} className="flex items-center justify-between border rounded-md p-3 hover:bg-muted/30">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{d}</div>
                        <div className="text-[10px] text-muted-foreground">PDF / JPG · max 10 MB</div>
                      </div>
                      {docs[d] === "uploaded" ? (
                        <Badge className="bg-success/15 text-success border-success/20"><FileCheck2 className="h-3 w-3" />Uploaded</Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => { setDocs((p) => ({ ...p, [d]: "uploaded" })); toast.success(`${d} uploaded`); }}>
                          <FileUp className="h-3.5 w-3.5" />Upload
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <Review title="Basic Info" items={[["Name", form.name || "—"], ["Type", form.type], ["Board", form.board], ["Year", form.academicYear]]} onEdit={() => setStep(1)} />
                <Review title="Contact" items={[["Address", form.address || "—"], ["City", form.city || "—"], ["Phone", form.phone || "—"], ["Email", form.email || "—"]]} onEdit={() => setStep(2)} />
                <Review title="Key People" items={[["Principal", form.principalName || "—"], ["Admin", form.adminName || "—"]]} onEdit={() => setStep(3)} />
                <Review title="Financial" items={[["GST", form.gst || "—"], ["PAN", form.pan || "—"]]} onEdit={() => setStep(4)} />
                <Review title="Documents" items={[["Uploaded", `${uploadedCount} / ${DOC_SLOTS.length}`]]} onEdit={() => setStep(5)} />
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <Button variant="outline" onClick={prev} disabled={step === 1}><ChevronLeft className="h-4 w-4" />Back</Button>
              {step < 6 ? (
                <Button className="gradient-primary border-0" onClick={next}>Continue<ChevronRight className="h-4 w-4" /></Button>
              ) : (
                <Button className="gradient-primary border-0" onClick={submit}><Check className="h-4 w-4" />Create Institute</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

function Review({ title, items, onEdit }: { title: string; items: [string, string][]; onEdit: () => void }) {
  return (
    <div className="border rounded-md p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">{title}</div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onEdit}>Edit</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        {items.map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-dashed py-1">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-medium text-right">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
