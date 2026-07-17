import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ExcelUpload } from "@/components/excel-upload";
import { ExcelExport } from "@/components/excel-export";
import { Archive, Upload, FolderArchive, GraduationCap, CalendarClock, Users, Filter, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/student-archive")({
  head: () => ({ meta: [{ title: "Student Archive — Edureon ERP" }] }),
  component: StudentArchivePage,
});

type ArchivedStudent = {
  id: string;
  admissionNo: string;
  name: string;
  klass: string;
  section: string;
  year: string;
  session: string;
  father?: string;
  mother?: string;
  contact?: string;
  status?: string;
  remarks?: string;
};

const SEED: ArchivedStudent[] = [
  { id: "AR-2019-001", admissionNo: "ADM19001", name: "Anaya Kapoor", klass: "X", section: "A", year: "2019", session: "2018-19", father: "R. Kapoor", contact: "98xxxxx012", status: "Passed Out", remarks: "TC issued" },
  { id: "AR-2019-002", admissionNo: "ADM19002", name: "Vihaan Rao", klass: "XII", section: "B", year: "2019", session: "2018-19", father: "S. Rao", contact: "98xxxxx077", status: "Passed Out" },
  { id: "AR-2020-011", admissionNo: "ADM20011", name: "Meera Iyer", klass: "IX", section: "C", year: "2020", session: "2019-20", father: "K. Iyer", contact: "98xxxxx211", status: "Transferred", remarks: "Moved to Chennai branch" },
  { id: "AR-2021-045", admissionNo: "ADM21045", name: "Kabir Sharma", klass: "VIII", section: "A", year: "2021", session: "2020-21", father: "P. Sharma", contact: "98xxxxx415", status: "Left" },
  { id: "AR-2022-102", admissionNo: "ADM22102", name: "Riya Menon", klass: "XI", section: "B", year: "2022", session: "2021-22", father: "T. Menon", contact: "98xxxxx630", status: "Passed Out" },
  { id: "AR-2023-088", admissionNo: "ADM23088", name: "Aarav Deshpande", klass: "XII", section: "A", year: "2023", session: "2022-23", father: "V. Deshpande", contact: "98xxxxx712", status: "Passed Out", remarks: "Awarded 92%" },
];

function StudentArchivePage() {
  const [rows, setRows] = useState<ArchivedStudent[]>(SEED);
  const [year, setYear] = useState("All");
  const [session, setSession] = useState("All");
  const [klass, setKlass] = useState("All");
  const [section, setSection] = useState("All");
  const [q, setQ] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  const YEARS = ["All", ...Array.from(new Set(rows.map((r) => r.year))).sort()];
  const SESSIONS = ["All", ...Array.from(new Set(rows.map((r) => r.session))).sort()];
  const CLASSES = ["All", ...Array.from(new Set(rows.map((r) => r.klass))).sort()];
  const SECTIONS = ["All", ...Array.from(new Set(rows.map((r) => r.section))).sort()];

  const filtered = useMemo(() => rows.filter((r) =>
    (year === "All" || r.year === year) &&
    (session === "All" || r.session === session) &&
    (klass === "All" || r.klass === klass) &&
    (section === "All" || r.section === section) &&
    (!q.trim() || `${r.name} ${r.admissionNo}`.toLowerCase().includes(q.trim().toLowerCase()))
  ), [rows, year, session, klass, section, q]);

  const importRows = (imported: Record<string, string>[]) => {
    const mapped: ArchivedStudent[] = imported.map((r, i) => ({
      id: `AR-IMP-${Date.now()}-${i}`,
      admissionNo: r.admissionNo || r["Admission No"] || `IMP${i}`,
      name: r.name || r.Name || "Unnamed",
      klass: r.klass || r.class || r.Class || "",
      section: r.section || r.Section || "",
      year: r.year || r.Year || new Date().getFullYear().toString(),
      session: r.session || r.Session || "—",
      father: r.father || r["Father Name"] || "",
      mother: r.mother || r["Mother Name"] || "",
      contact: r.contact || r.Contact || "",
      status: r.status || r.Status || "Passed Out",
      remarks: r.remarks || r.Remarks || "",
    }));
    setRows((prev) => [...mapped, ...prev]);
    setUploadOpen(false);
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Records"
        title="Student Archive"
        description="Historical student records — passed-out, transferred, or discontinued. Import CSV/Excel to bulk-load legacy data."
        actions={<>
          <ExcelExport
            fileName="student-archive.xlsx"
            columns={[
              { header: "Admission No", accessor: (r) => r.admissionNo },
              { header: "Name", accessor: (r) => r.name },
              { header: "Class", accessor: (r) => r.klass },
              { header: "Section", accessor: (r) => r.section },
              { header: "Year", accessor: (r) => r.year },
              { header: "Session", accessor: (r) => r.session },
              { header: "Father", accessor: (r) => r.father },
              { header: "Contact", accessor: (r) => r.contact },
              { header: "Status", accessor: (r) => r.status },
              { header: "Remarks", accessor: (r) => r.remarks },
            ]}
            rows={filtered}
          />
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary border-0"><Upload className="h-4 w-4" />Import Historical Data</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Import Archive</DialogTitle>
                <DialogDescription>
                  Upload a CSV or XLSX of historical students. Expected columns: admissionNo, name, klass, section, year, session, father, contact, status, remarks.
                </DialogDescription>
              </DialogHeader>
              <div className="p-6 border-2 border-dashed rounded-md text-center space-y-3">
                <FolderArchive className="h-10 w-10 mx-auto text-muted-foreground" />
                <div className="text-sm">Drop a file or use the button below</div>
                <ExcelUpload
                  label="Choose File (CSV/XLSX)"
                  templateHeaders={["admissionNo","name","klass","section","year","session","father","mother","contact","status","remarks"]}
                  templateName="archive-template.xlsx"
                  onRows={importRows}
                />
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setUploadOpen(false)}>Close</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Archived" value={rows.length.toString()} icon={<Archive className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Passed Out" value={rows.filter((r) => r.status === "Passed Out").length.toString()} icon={<GraduationCap className="h-5 w-5" />} tone="success" />
        <KpiCard label="Transferred" value={rows.filter((r) => r.status === "Transferred").length.toString()} icon={<Users className="h-5 w-5" />} tone="info" />
        <KpiCard label="Sessions Covered" value={(SESSIONS.length - 1).toString()} icon={<CalendarClock className="h-5 w-5" />} tone="warning" />
      </div>

      <Card className="border-border/60 mb-4">
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2"><Filter className="h-4 w-4" />Filters</CardTitle>
          <CardDescription>{filtered.length} of {rows.length} record(s)</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Input placeholder="Search name or admission no." value={q} onChange={(e) => setQ(e.target.value)} className="md:col-span-1" />
          <Select value={klass} onValueChange={setKlass}>
            <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>{CLASSES.map((c) => <SelectItem key={c} value={c}>{c === "All" ? "All Classes" : `Class ${c}`}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
            <SelectContent>{SECTIONS.map((c) => <SelectItem key={c} value={c}>{c === "All" ? "All Sections" : `Section ${c}`}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>{YEARS.map((c) => <SelectItem key={c} value={c}>{c === "All" ? "All Years" : c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={session} onValueChange={setSession}>
            <SelectTrigger><SelectValue placeholder="Session" /></SelectTrigger>
            <SelectContent>{SESSIONS.map((c) => <SelectItem key={c} value={c}>{c === "All" ? "All Sessions" : c}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Father</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.admissionNo}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.klass}</TableCell>
                  <TableCell>{r.section}</TableCell>
                  <TableCell>{r.session}</TableCell>
                  <TableCell>{r.year}</TableCell>
                  <TableCell className="text-xs">{r.father || "—"}</TableCell>
                  <TableCell className="text-xs">{r.contact || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "Passed Out" ? "default" : r.status === "Transferred" ? "secondary" : "outline"}>
                      {r.status || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{r.remarks || "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setRows((p) => p.filter((x) => x.id !== r.id)); toast.success("Removed from archive"); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={11} className="text-center py-10 text-sm text-muted-foreground">No archived students match the filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
