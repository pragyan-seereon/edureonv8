import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, IdCard, Printer, GraduationCap, UserCog } from "lucide-react";
import { useRef, useState } from "react";
import { useStudents, useEmployees, useAcademicSession } from "@/lib/store";
import { initials } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/id-cards")({
  head: () => ({ meta: [{ title: "ID Card Designer — Edureon" }] }),
  component: IdCardPage,
});

type CardData = {
  name: string;
  idNo: string;
  contact: string;
  meta: string;
  note: string;
  photo: string;
  logo: string;
};

const blank: CardData = { name: "", idNo: "", contact: "", meta: "", note: "", photo: "", logo: "" };

function useFile(set: (url: string) => void) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set(String(reader.result));
    reader.readAsDataURL(file);
  };
}

function IdCardPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Admin · Documents"
        title="ID Card Designer"
        description="Design and print identity cards for students and staff. Add a photo, brand logo, contact details and custom text, then print or save."
      />
      <Tabs defaultValue="student">
        <TabsList>
          <TabsTrigger value="student"><GraduationCap className="h-4 w-4 mr-1.5" />Student ID</TabsTrigger>
          <TabsTrigger value="employee"><UserCog className="h-4 w-4 mr-1.5" />Teacher / Employee ID</TabsTrigger>
        </TabsList>
        <TabsContent value="student" className="mt-4"><StudentForm /></TabsContent>
        <TabsContent value="employee" className="mt-4"><EmployeeForm /></TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function StudentForm() {
  const students = useStudents();
  const [d, setD] = useState<CardData>(blank);
  const onPhoto = useFile((u) => setD((p) => ({ ...p, photo: u })));
  const onLogo = useFile((u) => setD((p) => ({ ...p, logo: u })));

  const prefill = (id: string) => {
    const s = students.find((x) => x.id === id);
    if (!s) return;
    setD((p) => ({
      ...p,
      name: s.name,
      idNo: s.admissionNo,
      contact: s.phone,
      meta: `Class ${s.class}-${s.section} · Roll ${s.rollNo}`,
    }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Card Details</CardTitle>
          <CardDescription>Auto-fill from a student record or enter manually.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Pick student (auto-fill)">
            <Select onValueChange={prefill}>
              <SelectTrigger><SelectValue placeholder="Select a student…" /></SelectTrigger>
              <SelectContent>
                {students.slice(0, 60).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} · {s.class}-{s.section}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <UploadField label="Student Photo" onChange={onPhoto} has={!!d.photo} />
            <UploadField label="Brand / School Logo" onChange={onLogo} has={!!d.logo} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name"><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Aarav Sharma" /></Field>
            <Field label="Admission / Student ID"><Input value={d.idNo} onChange={(e) => setD({ ...d, idNo: e.target.value })} placeholder="ADM-2026-014" /></Field>
            <Field label="Contact Number"><Input value={d.contact} onChange={(e) => setD({ ...d, contact: e.target.value })} placeholder="+91 98765 43210" /></Field>
            <Field label="Class / Section / Roll"><Input value={d.meta} onChange={(e) => setD({ ...d, meta: e.target.value })} placeholder="Class X-A · Roll 14" /></Field>
          </div>
          <Field label="Additional Text (blood group, address, validity…)">
            <Textarea rows={3} value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} placeholder="Blood group: O+ · Valid till 31 Mar 2027" />
          </Field>
        </CardContent>
      </Card>
      <CardPreview d={d} kind="STUDENT" />
    </div>
  );
}

function EmployeeForm() {
  const employees = useEmployees();
  const [d, setD] = useState<CardData>(blank);
  const onPhoto = useFile((u) => setD((p) => ({ ...p, photo: u })));
  const onLogo = useFile((u) => setD((p) => ({ ...p, logo: u })));

  const prefill = (id: string) => {
    const s = employees.find((x) => x.id === id);
    if (!s) return;
    setD((p) => ({
      ...p,
      name: s.name,
      idNo: s.id,
      contact: s.phone,
      meta: `${s.role} · ${s.department}`,
    }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Card Details</CardTitle>
          <CardDescription>Auto-fill from an employee record or enter manually.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Pick employee (auto-fill)">
            <Select onValueChange={prefill}>
              <SelectTrigger><SelectValue placeholder="Select an employee…" /></SelectTrigger>
              <SelectContent>
                {employees.slice(0, 60).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} · {s.department}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <UploadField label="Employee Photo" onChange={onPhoto} has={!!d.photo} />
            <UploadField label="Brand / School Logo" onChange={onLogo} has={!!d.logo} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name"><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Meera Iyer" /></Field>
            <Field label="Employee ID"><Input value={d.idNo} onChange={(e) => setD({ ...d, idNo: e.target.value })} placeholder="EMP3012" /></Field>
            <Field label="Contact Number"><Input value={d.contact} onChange={(e) => setD({ ...d, contact: e.target.value })} placeholder="+91 98765 43210" /></Field>
            <Field label="Designation / Department"><Input value={d.meta} onChange={(e) => setD({ ...d, meta: e.target.value })} placeholder="Senior Teacher · Science" /></Field>
          </div>
          <Field label="Additional Text (blood group, address, validity…)">
            <Textarea rows={3} value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} placeholder="Blood group: B+ · Valid till 31 Mar 2027" />
          </Field>
        </CardContent>
      </Card>
      <CardPreview d={d} kind="STAFF" />
    </div>
  );
}

function CardPreview({ d, kind }: { d: CardData; kind: "STUDENT" | "STAFF" }) {
  const session = useAcademicSession();
  const ref = useRef<HTMLDivElement>(null);

  const print = () => {
    const node = ref.current;
    if (!node) return;
    const win = window.open("", "_blank", "width=420,height=640");
    if (!win) return toast.error("Allow pop-ups to print the card");
    win.document.write(`<html><head><title>ID Card</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;padding:24px;font-family:sans-serif;">${node.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
    toast.success("Opening print dialog…");
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={ref}
        className="w-[320px] rounded-2xl overflow-hidden shadow-xl border border-border/60 bg-card"
      >
        <div className="gradient-primary px-4 py-3 flex items-center gap-2 text-primary-foreground">
          {d.logo ? (
            <img src={d.logo} alt="logo" className="h-8 w-8 rounded object-contain bg-white/90 p-0.5" />
          ) : (
            <div className="h-8 w-8 rounded bg-white/20 flex items-center justify-center"><IdCard className="h-4 w-4" /></div>
          )}
          <div className="leading-tight">
            <div className="font-display font-semibold text-sm">Edureon School</div>
            <div className="text-[9px] uppercase tracking-wider opacity-80">{kind} IDENTITY CARD</div>
          </div>
        </div>
        <div className="p-4 flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 rounded-xl border-2 border-border">
            {d.photo && <AvatarImage src={d.photo} alt={d.name} className="object-cover" />}
            <AvatarFallback className="rounded-xl text-lg">{d.name ? initials(d.name) : "?"}</AvatarFallback>
          </Avatar>
          <div className="mt-3 font-display font-semibold text-lg">{d.name || "Full Name"}</div>
          <div className="text-xs text-muted-foreground">{d.meta || "Class / Designation"}</div>
          <div className="mt-3 w-full space-y-1 text-left text-xs">
            <Row label={kind === "STUDENT" ? "Student ID" : "Employee ID"} value={d.idNo || "—"} />
            <Row label="Contact" value={d.contact || "—"} />
            <Row label="Session" value={session} />
          </div>
          {d.note && <div className="mt-3 w-full rounded-md bg-muted/50 p-2 text-[10px] text-muted-foreground whitespace-pre-wrap text-left">{d.note}</div>}
        </div>
        <div className="bg-muted/40 px-4 py-1.5 text-center text-[8px] uppercase tracking-wider text-muted-foreground border-t border-border/60">
          If found, return to Edureon School administration office
        </div>
      </div>
      <Button onClick={print} className="gradient-primary border-0 w-full max-w-[320px]"><Printer className="h-4 w-4" />Print / Save Card</Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-dashed border-border/60 py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}

function UploadField({ label, onChange, has }: { label: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; has: boolean }) {
  const id = "up-" + label.replace(/\s/g, "");
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <label htmlFor={id} className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:bg-accent">
        <Upload className="h-4 w-4" />{has ? "Change file" : "Upload image"}
      </label>
      <input id={id} type="file" accept="image/*" className="hidden" onChange={onChange} />
    </div>
  );
}
