import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Folder, FileText, FileImage, Upload, Search, FileCheck2, Clock, ShieldAlert, Eye, Download } from "lucide-react";
import { useState } from "react";
import { DocumentUploadDialog } from "@/components/document-upload-dialog";

export const Route = createFileRoute("/admin/dms")({
  head: () => ({ meta: [{ title: "Documents — Edureon" }] }),
  component: DmsPage,
});

const FOLDERS = [
  { name: "Institute Documents", count: 24, icon: ShieldAlert, tone: "bg-primary/10 text-primary" },
  { name: "Student Documents", count: 8420, icon: FileText, tone: "bg-info/10 text-info" },
  { name: "Employee Documents", count: 1240, icon: FileText, tone: "bg-success/10 text-success" },
  { name: "Certificates", count: 312, icon: FileCheck2, tone: "bg-warning/15 text-warning" },
  { name: "Statutory & Compliance", count: 42, icon: ShieldAlert, tone: "bg-destructive/10 text-destructive" },
  { name: "Templates", count: 18, icon: FileText, tone: "bg-accent/15 text-accent" },
];

type Doc = {
  name: string; folder: string; type: "pdf" | "image" | "doc";
  uploadedBy: string; date: string; size: string; status: "Verified" | "Pending" | "Rejected"; version: number;
};

const seed: Doc[] = [
  { name: "CBSE Affiliation Certificate.pdf", folder: "Institute Documents", type: "pdf", uploadedBy: "Rahul Kapoor", date: "12 Apr 2024", size: "2.4 MB", status: "Verified", version: 3 },
  { name: "Fire Safety NOC 2025.pdf", folder: "Statutory & Compliance", type: "pdf", uploadedBy: "Vikas Yadav", date: "08 Sep 2025", size: "880 KB", status: "Verified", version: 1 },
  { name: "Bonafide Certificate Template.docx", folder: "Templates", type: "doc", uploadedBy: "Rahul Kapoor", date: "01 Apr 2024", size: "112 KB", status: "Verified", version: 2 },
  { name: "ADM-2025-0142 — Birth Certificate.jpg", folder: "Student Documents", type: "image", uploadedBy: "Priya Singh", date: "Yesterday", size: "1.1 MB", status: "Pending", version: 1 },
  { name: "EMP2031 — UG Degree.pdf", folder: "Employee Documents", type: "pdf", uploadedBy: "Vikas Yadav", date: "Today", size: "640 KB", status: "Pending", version: 1 },
  { name: "ADM-2024-0211 — Aadhaar.jpg", folder: "Student Documents", type: "image", uploadedBy: "Priya Singh", date: "2d ago", size: "780 KB", status: "Rejected", version: 2 },
];

const statusColor: Record<Doc["status"], string> = {
  Verified: "bg-success/10 text-success border-success/20",
  Pending: "bg-warning/15 text-warning border-warning/20",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

function DmsPage() {
  const [active, setActive] = useState<string>("All");
  const [q, setQ] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const filtered = seed.filter((d) =>
    (active === "All" || d.folder === active) &&
    (!q || d.name.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Admin · Compliance"
        title="Document Management"
        description="Centralized DMS with versioned uploads, verification workflow and inline previews."
        actions={<Button size="sm" className="gradient-primary border-0" onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4" />Upload Document</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {FOLDERS.map((f) => (
          <button key={f.name} onClick={() => setActive(active === f.name ? "All" : f.name)} className={`p-3 rounded-lg border text-left transition ${active === f.name ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40"}`}>
            <div className={`h-8 w-8 rounded-md flex items-center justify-center mb-2 ${f.tone}`}><f.icon className="h-4 w-4" /></div>
            <div className="text-xs font-medium truncate">{f.name}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{f.count.toLocaleString()} files</div>
          </button>
        ))}
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-display text-base">{active === "All" ? "All Documents" : active}</CardTitle>
            <CardDescription>{filtered.length} files</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents…" className="pl-8 h-9" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.map((d) => (
            <div key={d.name} className="flex items-center gap-3 p-3 border rounded-md hover:bg-muted/30">
              <div className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 ${d.type === "image" ? "bg-info/10 text-info" : d.type === "pdf" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                {d.type === "image" ? <FileImage className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{d.name}</div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                  <Folder className="h-3 w-3" />{d.folder}
                  <span>·</span><Clock className="h-3 w-3" />{d.date}
                  <span>·</span>v{d.version} · {d.size}
                  <span>·</span>by {d.uploadedBy}
                </div>
              </div>
              <Badge variant="outline" className={statusColor[d.status]}>{d.status}</Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        categories={FOLDERS.map((f) => f.name)}
        onSubmit={() => {}}
      />
    </PageContainer>
  );
}
