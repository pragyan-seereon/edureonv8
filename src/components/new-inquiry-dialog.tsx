import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileCheck2, Upload } from "lucide-react";
import { toast } from "sonner";

export type NewInquiryData = {
  name: string;
  class: string;
  parent: string;
  phone: string;
  email: string;
  source: string;
  notes: string;
};

const docs = [
  "Aadhar Card",
  "Birth Certificate",
  "Previous School TC",
  "Last Marksheet",
  "Passport Photo",
  "Parent ID (PAN/Aadhar)",
  "Address Proof",
  "Caste / EWS Certificate",
];

export function NewInquiryDialog({
  trigger,
  onCreate,
}: {
  trigger: React.ReactNode;
  onCreate?: (data: NewInquiryData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("personal");
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});
  const [d, setD] = useState({
    // personal
    name: "",
    dob: "",
    gender: "Male",
    blood: "",
    nationality: "Indian",
    religion: "",
    category: "General",
    motherTongue: "",
    aadhar: "",
    birthCertificateNo: "",
    // academic
    class: "VI",
    section: "A",
    previousSchool: "",
    previousClass: "",
    lastPercent: "",
    board: "CBSE",
    // address
    address: "",
    city: "",
    state: "",
    pin: "",
    country: "India",
    // parent
    parent: "",
    parentOccupation: "",
    parentIncome: "",
    phone: "",
    email: "",
    motherName: "",
    emergencyContact: "",
    // misc
    source: "Walk-in",
    notes: "",
    transportRequired: "No",
    hostelRequired: "No",
    sibling: "",
    feePlan: "Quarterly",
    medicalNotes: "",
  });
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((p) => ({ ...p, [k]: v }));

  const save = () => {
    if (!d.name || !d.parent || !d.phone) {
      setTab("personal");
      return toast.error("Student name, parent name and phone are required");
    }
    onCreate?.({
      name: d.name,
      class: d.class,
      parent: d.parent,
      phone: d.phone,
      email: d.email,
      source: d.source,
      notes: d.notes,
    });
    const uploadedCount = Object.values(uploaded).filter(Boolean).length;
    toast.success(`Admission created for ${d.name}`, {
      description: `Stage: Inquiry · ${uploadedCount}/${docs.length} documents on file`,
    });
    setOpen(false);
    setTab("personal");
    setUploaded({});
    setD({
      name: "",
      dob: "",
      gender: "Male",
      blood: "",
      nationality: "Indian",
      religion: "",
      category: "General",
      motherTongue: "",
      aadhar: "",
      birthCertificateNo: "",
      class: "VI",
      section: "A",
      previousSchool: "",
      previousClass: "",
      lastPercent: "",
      board: "CBSE",
      address: "",
      city: "",
      state: "",
      pin: "",
      country: "India",
      parent: "",
      parentOccupation: "",
      parentIncome: "",
      phone: "",
      email: "",
      motherName: "",
      emergencyContact: "",
      source: "Walk-in",
      notes: "",
      transportRequired: "No",
      hostelRequired: "No",
      sibling: "",
      feePlan: "Quarterly",
      medicalNotes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">New Admission</DialogTitle>
          <DialogDescription>
            Capture complete student profile, academic background, address, parent info and legal
            documents.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="academic">Educational</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
            <TabsTrigger value="parent">Parent</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="docs">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="grid sm:grid-cols-2 gap-3 mt-4">
            <F label="Full Name *">
              <Input
                value={d.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Riya Mehra"
              />
            </F>
            <F label="Date of Birth *">
              <Input type="date" value={d.dob} onChange={(e) => set("dob", e.target.value)} />
            </F>
            <F label="Gender">
              <Select value={d.gender} onValueChange={(v) => set("gender", v)}>
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
            </F>
            <F label="Blood Group">
              <Select value={d.blood} onValueChange={(v) => set("blood", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </F>
            <F label="Nationality">
              <Input value={d.nationality} onChange={(e) => set("nationality", e.target.value)} />
            </F>
            <F label="Religion">
              <Input value={d.religion} onChange={(e) => set("religion", e.target.value)} />
            </F>
            <F label="Category">
              <Select value={d.category} onValueChange={(v) => set("category", v)}>
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
            </F>
            <F label="Mother Tongue">
              <Input
                value={d.motherTongue}
                onChange={(e) => set("motherTongue", e.target.value)}
                placeholder="Hindi"
              />
            </F>
            <F label="Student Aadhar">
              <Input
                value={d.aadhar}
                onChange={(e) => set("aadhar", e.target.value)}
                placeholder="XXXX-XXXX-1234"
              />
            </F>
            <F label="Birth Certificate No.">
              <Input
                value={d.birthCertificateNo}
                onChange={(e) => set("birthCertificateNo", e.target.value)}
              />
            </F>
          </TabsContent>

          <TabsContent value="academic" className="grid sm:grid-cols-2 gap-3 mt-4">
            <F label="Applying for Class *">
              <Select value={d.class} onValueChange={(v) => set("class", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
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
                  ].map((c) => (
                    <SelectItem key={c} value={c}>
                      Class {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </F>
            <F label="Preferred Section">
              <Select value={d.section} onValueChange={(v) => set("section", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["A", "B", "C", "D", "Any"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </F>
            <F label="Previous School">
              <Input
                value={d.previousSchool}
                onChange={(e) => set("previousSchool", e.target.value)}
                placeholder="DAV Public School"
              />
            </F>
            <F label="Previous Class">
              <Input
                value={d.previousClass}
                onChange={(e) => set("previousClass", e.target.value)}
                placeholder="Class V"
              />
            </F>
            <F label="Last Aggregate %">
              <Input
                type="number"
                value={d.lastPercent}
                onChange={(e) => set("lastPercent", e.target.value)}
                placeholder="87"
              />
            </F>
            <F label="Previous Board">
              <Select value={d.board} onValueChange={(v) => set("board", v)}>
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
            </F>
          </TabsContent>

          <TabsContent value="address" className="grid sm:grid-cols-2 gap-3 mt-4">
            <F label="Residential Address" wide>
              <Textarea
                rows={2}
                value={d.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="House no, street, locality"
              />
            </F>
            <F label="City">
              <Input
                value={d.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Delhi"
              />
            </F>
            <F label="State">
              <Input value={d.state} onChange={(e) => set("state", e.target.value)} />
            </F>
            <F label="PIN Code">
              <Input
                value={d.pin}
                onChange={(e) => set("pin", e.target.value)}
                placeholder="110001"
              />
            </F>
            <F label="Country">
              <Input value={d.country} onChange={(e) => set("country", e.target.value)} />
            </F>
          </TabsContent>

          <TabsContent value="parent" className="grid sm:grid-cols-2 gap-3 mt-4">
            <F label="Father / Guardian Name *">
              <Input
                value={d.parent}
                onChange={(e) => set("parent", e.target.value)}
                placeholder="Anil Mehra"
              />
            </F>
            <F label="Mother's Name">
              <Input value={d.motherName} onChange={(e) => set("motherName", e.target.value)} />
            </F>
            <F label="Occupation">
              <Input
                value={d.parentOccupation}
                onChange={(e) => set("parentOccupation", e.target.value)}
                placeholder="Business / Service"
              />
            </F>
            <F label="Annual Income (₹)">
              <Input
                type="number"
                value={d.parentIncome}
                onChange={(e) => set("parentIncome", e.target.value)}
                placeholder="1200000"
              />
            </F>
            <F label="Primary Mobile *">
              <Input
                value={d.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 …"
              />
            </F>
            <F label="Emergency Contact">
              <Input
                value={d.emergencyContact}
                onChange={(e) => set("emergencyContact", e.target.value)}
                placeholder="+91 …"
              />
            </F>
            <F label="Email" wide>
              <Input
                type="email"
                value={d.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="parent@mail.com"
              />
            </F>
            <F label="Source">
              <Select value={d.source} onValueChange={(v) => set("source", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Walk-in",
                    "Website",
                    "Referral",
                    "Ad Campaign",
                    "Education Fair",
                    "Social Media",
                  ].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </F>
            <F label="Counselor Notes" wide>
              <Textarea
                rows={2}
                value={d.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Sibling, transport, scholarship interest…"
              />
            </F>
          </TabsContent>

          <TabsContent value="services" className="grid sm:grid-cols-2 gap-3 mt-4">
            <F label="Transport Required">
              <Select
                value={d.transportRequired}
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
            </F>
            <F label="Hostel Required">
              <Select value={d.hostelRequired} onValueChange={(v) => set("hostelRequired", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <F label="Fee Plan">
              <Select value={d.feePlan} onValueChange={(v) => set("feePlan", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Monthly", "Quarterly", "Half-yearly", "Annual"].map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </F>
            <F label="Sibling in School">
              <Input
                value={d.sibling}
                onChange={(e) => set("sibling", e.target.value)}
                placeholder="Name / admission no."
              />
            </F>
            <F label="Medical Notes / Allergies" wide>
              <Textarea
                rows={3}
                value={d.medicalNotes}
                onChange={(e) => set("medicalNotes", e.target.value)}
                placeholder="Allergies, medication, special care instructions"
              />
            </F>
          </TabsContent>

          <TabsContent value="docs" className="mt-4 space-y-2">
            <div className="text-xs text-muted-foreground mb-2">
              Upload legal & identity documents. All uploads encrypted at rest.
            </div>
            {docs.map((doc) => (
              <div key={doc} className="flex items-center justify-between border rounded-md p-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-8 w-8 rounded-md flex items-center justify-center ${uploaded[doc] ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                  >
                    {uploaded[doc] ? (
                      <FileCheck2 className="h-4 w-4" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{doc}</div>
                    <div className="text-[11px] text-muted-foreground">PDF / JPG · max 5 MB</div>
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
                    <Upload className="h-3.5 w-3.5" />
                    Upload
                  </Button>
                )}
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {tab !== "docs" && (
            <Button
              variant="secondary"
              onClick={() => {
                const order = ["personal", "academic", "address", "parent", "services", "docs"];
                setTab(order[order.indexOf(tab) + 1] ?? "docs");
              }}
            >
              Next
            </Button>
          )}
          <Button className="gradient-primary border-0" onClick={save}>
            Create Admission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function F({
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
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
