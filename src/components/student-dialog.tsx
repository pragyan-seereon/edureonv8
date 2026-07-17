import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileCheck2, Upload } from "lucide-react";
import { ImageOcrUpload } from "@/components/image-ocr-upload";
import { studentsApi } from "@/lib/store";
import type { Student } from "@/lib/mock";
import { toast } from "sonner";

const classes = [
  "Pre-KG",
  "KG",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];
const sections = ["A", "B", "C", "D"];
const docs = [
  "Student Aadhar",
  "Birth Certificate",
  "Transfer Certificate",
  "Previous Marksheet",
  "Parent ID",
  "Address Proof",
  "Passport Photo",
  "Medical Certificate",
];

const STREAMS = ["Science", "Commerce", "Arts", "Vocational"];
const isSeniorClass = (c: string) => c === "XI" || c === "XII";

type StudentForm = Omit<Student, "id">;
type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student?: Student | null;
  /** Override the default save behavior. When provided, the dialog will call
   * this instead of writing to studentsApi (used by the Admissions pipeline,
   * where a record only becomes a Student once the inquiry reaches Enrolled). */
  onCreate?: (data: StudentForm) => void;
  title?: string;
  description?: string;
  submitLabel?: string;
};

const empty: StudentForm = {
  name: "",
  admissionNo: "",
  class: "X",
  section: "A",
  rollNo: 1,
  gender: "Male",
  parent: "",
  phone: "",
  feeStatus: "Pending",
  attendance: 95,
  dob: "",
  blood: "",
  nationality: "Indian",
  religion: "",
  category: "General",
  motherTongue: "",
  previousSchool: "",
  previousClass: "",
  board: "CBSE",
  lastPercent: "",
  address: "",
  city: "",
  state: "",
  pin: "",
  email: "",
  motherName: "",
  parentOccupation: "",
  parentIncome: "",
  emergencyContact: "",
  aadhar: "",
  birthCertificateNo: "",
  transportRequired: "No",
  hostelRequired: "No",
  medicalNotes: "",
  documents: [],
};

export function StudentDialog({
  open,
  onOpenChange,
  student,
  onCreate,
  title,
  description,
  submitLabel,
}: Props) {
  const [tab, setTab] = useState("personal");
  const [f, setF] = useState<StudentForm>(empty);
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (student) {
      setF({ ...empty, ...student });
      setUploaded(Object.fromEntries((student.documents ?? []).map((d) => [d, true])));
    } else if (open) {
      setF({ ...empty, admissionNo: "ADM-2025-" + Math.floor(1000 + Math.random() * 8999) });
      setUploaded({});
    }
    if (open) setTab("personal");
  }, [student, open]);

  const set = <K extends keyof StudentForm>(key: K, value: StudentForm[K]) =>
    setF((p) => ({ ...p, [key]: value }));

  const save = () => {
    if (!f.name || !f.parent || !f.phone)
      return toast.error("Student name, guardian and phone are required");
    const payload = {
      ...f,
      documents: Object.entries(uploaded)
        .filter(([, ok]) => ok)
        .map(([name]) => name),
    };
    if (student) {
      studentsApi.update(student.id, payload);
      toast.success("Student admission profile updated");
    } else if (onCreate) {
      onCreate(payload);
    } else {
      studentsApi.add(payload);
      toast.success("Student admitted with detailed profile");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {title ?? (student ? "Edit Student Admission" : "New Student Admission")}
          </DialogTitle>
          <DialogDescription>
            {description ??
              "Capture personal, academic, guardian, fee, transport, hostel, medical and document details."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
          <div className="text-xs text-muted-foreground">
            Have an Aadhar card, birth certificate or previous marksheet image?
            Scan it to auto-fill this form.
          </div>
          <ImageOcrUpload
            label="Scan from Image"
            sample={{
              name: "Aarav Sharma",
              dob: "2012-08-14",
              gender: "Male",
              aadhar: "XXXX-XXXX-4521",
              parent: "Rajesh Sharma",
              motherName: "Priya Sharma",
              phone: "+91 98101 22334",
              address: "B-204, Green Park",
              city: "New Delhi",
              state: "Delhi",
              pin: "110016",
            }}
            onParsed={(fields) => {
              setF((p) => ({ ...p, ...(fields as Partial<StudentForm>) }));
            }}
          />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="guardian">Guardian</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="medical">Medical</TabsTrigger>
            <TabsTrigger value="docs">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="grid sm:grid-cols-2 gap-4 mt-4">
            <Field label="Full name *">
              <Input value={f.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Admission No">
              <Input
                value={f.admissionNo}
                onChange={(e) => set("admissionNo", e.target.value)}
                className="font-mono"
              />
            </Field>
            <Field label="Date of birth">
              <Input type="date" value={f.dob} onChange={(e) => set("dob", e.target.value)} />
            </Field>
            <Field label="Gender">
              <Select value={f.gender} onValueChange={(v) => set("gender", v as Student["gender"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Male", "Female", "Other"].map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Blood group">
              <Input value={f.blood ?? ""} onChange={(e) => set("blood", e.target.value)} />
            </Field>
            <Field label="Student Aadhar">
              <Input
                value={f.aadhar ?? ""}
                onChange={(e) => set("aadhar", e.target.value)}
                placeholder="XXXX-XXXX-1234"
              />
            </Field>
            <Field label="Nationality">
              <Input
                value={f.nationality ?? ""}
                onChange={(e) => set("nationality", e.target.value)}
              />
            </Field>
            <Field label="Category">
              <Select value={f.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["General", "OBC", "SC", "ST", "EWS"].map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </TabsContent>

          <TabsContent value="academic" className="grid sm:grid-cols-2 gap-4 mt-4">
            <Field label="Class">
              <Select value={f.class} onValueChange={(v) => set("class", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Section">
              <Select value={f.section} onValueChange={(v) => set("section", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Roll No">
              <Input
                type="number"
                min={1}
                value={f.rollNo}
                onChange={(e) => set("rollNo", parseInt(e.target.value) || 1)}
              />
            </Field>
            <Field label="Previous school">
              <Input
                value={f.previousSchool ?? ""}
                onChange={(e) => set("previousSchool", e.target.value)}
              />
            </Field>
            <Field label="Previous class">
              <Input
                value={f.previousClass ?? ""}
                onChange={(e) => set("previousClass", e.target.value)}
              />
            </Field>
            <Field label="Board">
              <Select value={f.board} onValueChange={(v) => set("board", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["CBSE", "ICSE", "State Board", "IB", "IGCSE", "Other"].map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Last aggregate %">
              <Input
                value={f.lastPercent ?? ""}
                onChange={(e) => set("lastPercent", e.target.value)}
              />
            </Field>
            <Field label="Attendance %">
              <Input
                type="number"
                min={0}
                max={100}
                value={f.attendance}
                onChange={(e) => set("attendance", parseInt(e.target.value) || 0)}
              />
            </Field>
            {isSeniorClass(f.class) && (
              <>
                <Field label="Stream *">
                  <Select value={(f as any).stream || ""} onValueChange={(v) => setF((p) => ({ ...p, stream: v } as StudentForm))}>
                    <SelectTrigger><SelectValue placeholder="Select stream" /></SelectTrigger>
                    <SelectContent>
                      {STREAMS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Stream Change Workflow" wide>
                  <div className="rounded-md border border-border/60 p-3 space-y-2 bg-muted/20">
                    <div className="text-[11px] text-muted-foreground">Track stream migration (e.g. Science → Commerce, Biology → Computer Science)</div>
                    <div className="grid sm:grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-muted-foreground">Old Stream</label>
                        <Select value={(f as any).stream || ""} onValueChange={() => {}}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>{STREAMS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-muted-foreground">New Stream</label>
                        <Select onValueChange={() => {}}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{STREAMS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-muted-foreground">Effective Date</label>
                        <Input type="date" className="h-8" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-muted-foreground">Approval</label>
                        <Select defaultValue="Pending">
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Approved">Approved by Principal</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" type="button" onClick={() => toast.success("Stream change request submitted for approval")}>
                      Request Change
                    </Button>
                  </div>
                </Field>
              </>
            )}
          </TabsContent>


          <TabsContent value="guardian" className="grid sm:grid-cols-2 gap-4 mt-4">
            <Field label="Father / Guardian *">
              <Input value={f.parent} onChange={(e) => set("parent", e.target.value)} />
            </Field>
            <Field label="Mother's name">
              <Input
                value={f.motherName ?? ""}
                onChange={(e) => set("motherName", e.target.value)}
              />
            </Field>
            <Field label="Primary phone *">
              <Input value={f.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={f.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="Occupation">
              <Input
                value={f.parentOccupation ?? ""}
                onChange={(e) => set("parentOccupation", e.target.value)}
              />
            </Field>
            <Field label="Annual income">
              <Input
                value={f.parentIncome ?? ""}
                onChange={(e) => set("parentIncome", e.target.value)}
              />
            </Field>
            <Field label="Emergency contact">
              <Input
                value={f.emergencyContact ?? ""}
                onChange={(e) => set("emergencyContact", e.target.value)}
              />
            </Field>
            <Field label="Birth certificate no.">
              <Input
                value={f.birthCertificateNo ?? ""}
                onChange={(e) => set("birthCertificateNo", e.target.value)}
              />
            </Field>
            <Field label="Residential address" wide>
              <Textarea
                rows={2}
                value={f.address ?? ""}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
            <Field label="City">
              <Input value={f.city ?? ""} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="State">
              <Input value={f.state ?? ""} onChange={(e) => set("state", e.target.value)} />
            </Field>
            <Field label="PIN">
              <Input value={f.pin ?? ""} onChange={(e) => set("pin", e.target.value)} />
            </Field>
          </TabsContent>

          <TabsContent value="services" className="grid sm:grid-cols-2 gap-4 mt-4">
            <Field label="Fee status">
              <Select
                value={f.feeStatus}
                onValueChange={(v) => set("feeStatus", v as Student["feeStatus"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Transport required">
              <Select
                value={f.transportRequired}
                onValueChange={(v) => set("transportRequired", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Hostel required">
              <Select value={f.hostelRequired} onValueChange={(v) => set("hostelRequired", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </TabsContent>

          <TabsContent value="medical" className="mt-4">
            <Field label="Medical notes / allergies / special care" wide>
              <Textarea
                rows={5}
                value={f.medicalNotes ?? ""}
                onChange={(e) => set("medicalNotes", e.target.value)}
              />
            </Field>
          </TabsContent>

          <TabsContent value="docs" className="mt-4 space-y-2">
            {docs.map((doc) => (
              <div
                key={doc}
                className="flex items-center justify-between rounded-md border border-border/60 p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                    {uploaded[doc] ? (
                      <FileCheck2 className="h-4 w-4 text-success" />
                    ) : (
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{doc}</div>
                    <div className="text-[11px] text-muted-foreground">PDF / JPG record</div>
                  </div>
                </div>
                {uploaded[doc] ? (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    Uploaded
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setUploaded((u) => ({ ...u, [doc]: true }))}
                  >
                    Upload
                  </Button>
                )}
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} className="gradient-primary border-0">
            {submitLabel ?? (student ? "Save admission" : "Admit student")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
