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
import { FileCheck2, Upload, Plus, Trash2, GraduationCap } from "lucide-react";
import { employeesApi, useSections, useSubjects } from "@/lib/store";
import type { Employee, EmployeeAssignment } from "@/lib/mock";
import { toast } from "sonner";


const roles = [
  "Teacher",
  "Principal",
  "Vice Principal",
  "Academic Coordinator",
  "Accountant",
  "HR",
  "Librarian",
  "Transport Manager",
  "Hostel Warden",
  "Lab Assistant",
];
const depts = [
  "Science",
  "Mathematics",
  "English",
  "Social Studies",
  "Hindi",
  "Computer Sci",
  "Commerce",
  "Administration",
  "Sports",
  "Arts",
];

const empty: Omit<Employee, "id"> = {
  name: "",
  role: "Teacher",
  department: "Science",
  email: "",
  phone: "",
  status: "Active",
  joinDate: new Date().toISOString().slice(0, 10),
  type: "Academic",
  gender: "Male",
  dob: "",
  employmentType: "Full-time",
  qualification: "",
  specialization: "",
  experience: "",
  previousEmployment: "",
  address: "",
  city: "",
  state: "",
  pin: "",
  emergencyContact: "",
  salary: 0,
  basic: 0,
  hra: 0,
  allowances: 0,
  bankName: "",
  accountNo: "",
  ifsc: "",
  pf: "",
  esi: "",
  aadhar: "",
  pan: "",
  medicalNotes: "",
  docs: [],
  assignments: [],
};
const docList = [
  "Aadhar",
  "PAN",
  "Resume",
  "Highest Degree",
  "Experience Letter",
  "Police Verification",
  "Medical Fitness",
  "Bank Proof",
];

export function EmployeeDialog({
  open,
  onOpenChange,
  employee,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employee?: Employee | null;
}) {
  const [f, setF] = useState(empty);
  const [tab, setTab] = useState("personal");
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});
  const sections = useSections();
  const subjects = useSubjects();
  const classOptions = Array.from(new Set(sections.map((s) => s.class)));


  useEffect(() => {
    if (employee) {
      const { id: _id, ...rest } = employee;
      void _id;
      setF({ ...empty, ...rest });
      setUploaded(Object.fromEntries((employee.docs ?? []).map((d) => [d, true])));
    } else if (open) {
      setF(empty);
      setUploaded({});
    }
    if (open) setTab("personal");
  }, [employee, open]);

  const save = () => {
    if (!f.name || !f.email || !f.phone) return toast.error("Name, email and phone are required");
    const cleanAssignments = (f.assignments ?? []).filter((a) => a.class && a.section && a.subject);
    const payload = {
      ...f,
      assignments: f.type === "Non-Academic" ? [] : cleanAssignments,
      docs: Object.entries(uploaded)
        .filter(([, ok]) => ok)
        .map(([name]) => name),
    };
    if (employee) {
      employeesApi.update(employee.id, payload);
      toast.success("Employee detailed profile updated");
    } else {
      employeesApi.add(payload);
      toast.success("Employee onboarded with documents");
    }
    onOpenChange(false);
  };

  const addAssignment = () =>
    setF((p) => ({
      ...p,
      assignments: [
        ...(p.assignments ?? []),
        { id: `A${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, class: "", section: "", subject: "" },
      ],
    }));
  const updateAssignment = (id: string, patch: Partial<EmployeeAssignment>) =>
    setF((p) => ({
      ...p,
      assignments: (p.assignments ?? []).map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  const removeAssignment = (id: string) =>
    setF((p) => ({ ...p, assignments: (p.assignments ?? []).filter((a) => a.id !== id) }));


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {employee ? "Edit Employee" : "Onboard Employee"}
          </DialogTitle>
          <DialogDescription>
            {employee ? "Update staff record." : "Add a teaching or non-teaching staff member."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="job">Job</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="salary">Salary</TabsTrigger>
            <TabsTrigger value="legal">Legal</TabsTrigger>
            <TabsTrigger value="bank">Bank</TabsTrigger>
            <TabsTrigger value="docs">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <Field label="Full name *">
              <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            </Field>
            <Field label="Gender">
              <Select
                value={f.gender}
                onValueChange={(v) => setF({ ...f, gender: v as Employee["gender"] })}
              >
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
            <Field label="Date of birth">
              <Input
                type="date"
                value={f.dob}
                onChange={(e) => setF({ ...f, dob: e.target.value })}
              />
            </Field>
            <Field label="Email *">
              <Input
                type="email"
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
              />
            </Field>
            <Field label="Phone *">
              <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            </Field>
            <Field label="Emergency contact">
              <Input
                value={f.emergencyContact}
                onChange={(e) => setF({ ...f, emergencyContact: e.target.value })}
              />
            </Field>
            <Field label="Address" wide>
              <Textarea
                rows={2}
                value={f.address}
                onChange={(e) => setF({ ...f, address: e.target.value })}
              />
            </Field>
            <Field label="City">
              <Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
            </Field>
            <Field label="State">
              <Input value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })} />
            </Field>
            <Field label="PIN">
              <Input value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value })} />
            </Field>
          </TabsContent>
          <TabsContent value="job" className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <Field label="Staff type">
              <Select
                value={f.type}
                onValueChange={(v) => setF({ ...f, type: v as Employee["type"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Non-Academic">Non-Academic</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Employment type">
              <Select
                value={f.employmentType}
                onValueChange={(v) =>
                  setF({ ...f, employmentType: v as Employee["employmentType"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Full-time", "Part-time", "Contract", "Visiting"].map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Role">
              <Select value={f.role} onValueChange={(v) => setF({ ...f, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Department">
              <Select value={f.department} onValueChange={(v) => setF({ ...f, department: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {depts.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={f.status}
                onValueChange={(v) => setF({ ...f, status: v as Employee["status"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Join date">
              <Input
                type="date"
                value={f.joinDate}
                onChange={(e) => setF({ ...f, joinDate: e.target.value })}
              />
            </Field>
            <Field label="Qualification">
              <Input
                value={f.qualification}
                onChange={(e) => setF({ ...f, qualification: e.target.value })}
              />
            </Field>
            <Field label="Specialization">
              <Input
                value={f.specialization}
                onChange={(e) => setF({ ...f, specialization: e.target.value })}
              />
            </Field>
            <Field label="Experience">
              <Input
                value={f.experience}
                onChange={(e) => setF({ ...f, experience: e.target.value })}
              />
            </Field>
            <Field label="Previous employment">
              <Input
                value={f.previousEmployment}
                onChange={(e) => setF({ ...f, previousEmployment: e.target.value })}
              />
            </Field>
          </TabsContent>
          <TabsContent value="assignments" className="space-y-3 py-2">
            {f.type === "Non-Academic" ? (
              <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                <GraduationCap className="h-5 w-5 mx-auto mb-2 opacity-60" />
                Class / Section / Subject assignments are optional and apply to Academic staff only.
                Switch <span className="font-medium text-foreground">Staff type</span> in the Job tab to Academic to enable assignments.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Teaching assignments</div>
                    <div className="text-[11px] text-muted-foreground">
                      A faculty can teach multiple subjects across different classes & sections. Optional.
                    </div>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={addAssignment}>
                    <Plus className="h-4 w-4" /> Add assignment
                  </Button>
                </div>
                {(f.assignments ?? []).length === 0 && (
                  <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                    No class / subject linked yet. Click <span className="font-medium text-foreground">Add assignment</span> to link this faculty to a class, section and subject.
                  </div>
                )}
                {(f.assignments ?? []).map((a) => {
                  const sectionsForClass = sections.filter((s) => s.class === a.class);
                  return (
                    <div key={a.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end rounded-md border border-border/60 p-3">
                      <Field label="Class">
                        <Select value={a.class} onValueChange={(v) => updateAssignment(a.id, { class: v, section: "" })}>
                          <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                          <SelectContent>
                            {classOptions.map((c) => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Section">
                        <Select value={a.section} onValueChange={(v) => updateAssignment(a.id, { section: v })} disabled={!a.class}>
                          <SelectTrigger><SelectValue placeholder={a.class ? "Select section" : "Choose class first"} /></SelectTrigger>
                          <SelectContent>
                            {sectionsForClass.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Subject">
                        <Select value={a.subject} onValueChange={(v) => updateAssignment(a.id, { subject: v })}>
                          <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                          <SelectContent>
                            {subjects.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeAssignment(a.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </>
            )}
          </TabsContent>
          <TabsContent value="salary" className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">

            {(["salary", "basic", "hra", "allowances"] as const).map((k) => (
              <Field key={k} label={k === "salary" ? "Gross salary" : k.toUpperCase()}>
                <Input
                  type="number"
                  value={f[k] ?? 0}
                  onChange={(e) => setF({ ...f, [k]: Number(e.target.value) })}
                />
              </Field>
            ))}
          </TabsContent>
          <TabsContent value="legal" className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <Field label="Aadhar">
              <Input value={f.aadhar} onChange={(e) => setF({ ...f, aadhar: e.target.value })} />
            </Field>
            <Field label="PAN">
              <Input
                value={f.pan}
                onChange={(e) => setF({ ...f, pan: e.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="PF number">
              <Input value={f.pf} onChange={(e) => setF({ ...f, pf: e.target.value })} />
            </Field>
            <Field label="ESI number">
              <Input value={f.esi} onChange={(e) => setF({ ...f, esi: e.target.value })} />
            </Field>
            <Field label="Medical notes" wide>
              <Textarea
                rows={3}
                value={f.medicalNotes}
                onChange={(e) => setF({ ...f, medicalNotes: e.target.value })}
              />
            </Field>
          </TabsContent>
          <TabsContent value="bank" className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <Field label="Bank name">
              <Input
                value={f.bankName}
                onChange={(e) => setF({ ...f, bankName: e.target.value })}
              />
            </Field>
            <Field label="Account no.">
              <Input
                value={f.accountNo}
                onChange={(e) => setF({ ...f, accountNo: e.target.value })}
              />
            </Field>
            <Field label="IFSC">
              <Input
                value={f.ifsc}
                onChange={(e) => setF({ ...f, ifsc: e.target.value.toUpperCase() })}
              />
            </Field>
          </TabsContent>
          <TabsContent value="docs" className="space-y-2 py-2">
            {docList.map((doc) => (
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} className="gradient-primary border-0">
            {employee ? "Save changes" : "Onboard"}
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
