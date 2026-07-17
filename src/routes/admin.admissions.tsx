import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Search, Phone, Mail, ArrowRight, Archive, Trash2, Send, TrendingUp, FileText, ClipboardCheck, Eye, XCircle, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { StudentDialog } from "@/components/student-dialog";
import { ExcelUpload } from "@/components/excel-upload";
import { ExcelExport } from "@/components/excel-export";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInquiries, inquiriesApi, ADM_STAGES, type AdmStage, type Inquiry } from "@/lib/store";


export const Route = createFileRoute("/admin/admissions")({
  head: () => ({ meta: [{ title: "Admissions — Edureon" }] }),
  component: AdmissionsPage,
});

const stageColor: Record<AdmStage, string> = {
  "Inquiry": "border-l-muted-foreground",
  "Lead": "border-l-info",
  "Counseling": "border-l-chart-3",
  "Admission Test": "border-l-warning",
  "Doc Verification": "border-l-accent",
  "Fee Payment": "border-l-chart-5",
  "Enrolled": "border-l-success",
};

const COUNSELORS = ["Sneha K.", "Rohit M.", "Priya S.", "Vikram T."];
const SOURCES: Inquiry["source"][] = ["Walk-in", "Website", "Referral", "Ad Campaign", "Phone"];

function AdmissionsPage() {
  const navigate = useNavigate();
  const all = useInquiries();
  const [q, setQ] = useState("");
  const [src, setSrc] = useState<string>("all");
  const [counselor, setCounselor] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragId, setDragId] = useState<string | null>(null);
  const [tab, setTab] = useState("pipeline");
  const [newOpen, setNewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [viewForm, setViewForm] = useState<Inquiry | null>(null);
  const [testFilter, setTestFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [rejectFor, setRejectFor] = useState<Inquiry | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [publicForm, setPublicForm] = useState({
    name: "", email: "", phone: "", location: "", school: "", parent: "",
    occupation: "", class: "VI", notes: "", consent: false,
  });

  const cards = useMemo(() => all.filter((c) => {
    if (c.archived || c.rejected) return false;
    if (q && !(c.name.toLowerCase().includes(q.toLowerCase()) || c.parent.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q))) return false;
    if (src !== "all" && c.source !== src) return false;
    if (counselor !== "all" && c.counselor !== counselor) return false;
    return true;
  }), [all, q, src, counselor]);
  const rejectedList = useMemo(() => all.filter((c) => c.rejected && !c.archived), [all]);
  const openStage = (s: AdmStage | "Rejected") => {
    setStageFilter(s);
    setTab(s === "Rejected" ? "rejected" : "forms");
  };
  const confirmReject = () => {
    if (!rejectFor) return;
    if (!rejectReason.trim()) return toast.error("Reason is required");
    inquiriesApi.reject(rejectFor.id, rejectReason.trim());
    toast.success(`${rejectFor.name} marked as rejected`);
    setRejectFor(null);
    setRejectReason("");
  };


  const toggleSel = (id: string) => setSelected((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const onDrop = (stage: AdmStage) => {
    if (!dragId) return;
    inquiriesApi.moveStage(dragId, stage);
    toast.success(`Moved to ${stage}`);
    setDragId(null);
  };

  const bulkMove = (stage: AdmStage) => {
    selected.forEach((id) => inquiriesApi.moveStage(id, stage));
    toast.success(`${selected.size} moved to ${stage}`);
    setSelected(new Set());
  };

  // Conversion analytics
  const counts = ADM_STAGES.map((s) => ({ stage: s, n: all.filter((c) => c.stage === s && !c.archived).length }));
  const total = counts.reduce((a, c) => a + c.n, 0);
  const enrolled = counts.find((c) => c.stage === "Enrolled")?.n || 0;
  const convRate = total ? Math.round((enrolled / total) * 100) : 0;
  const bySource = SOURCES.map((s) => ({ source: s, n: all.filter((c) => c.source === s).length }));

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Admin · Academic"
        title="Admissions Pipeline"
        description="Drag prospects across stages. Click any card to open the full counseling, document, payment and communication record."
        actions={
          <>
            <ExcelExport
              rows={all as any}
              fileName="admissions.xlsx"
              columns={[
                { header: "ID", accessor: (r: any) => r.id },
                { header: "Name", accessor: (r: any) => r.name },
                { header: "Class", accessor: (r: any) => r.class },
                { header: "Parent", accessor: (r: any) => r.parent },
                { header: "Phone", accessor: (r: any) => r.phone },
                { header: "Email", accessor: (r: any) => r.email },
                { header: "Source", accessor: (r: any) => r.source },
                { header: "Stage", accessor: (r: any) => r.stage },
                { header: "Counselor", accessor: (r: any) => r.counselor ?? "" },
                { header: "Test Score", accessor: (r: any) => r.testScore ?? "" },
              ]}
            />
            <ExcelUpload
              label="Bulk Upload"
              templateName="admissions-template.xlsx"
              templateHeaders={["Name", "Class", "Parent", "Phone", "Email", "Source", "Counselor"]}
              onRows={(rows) => {
                let added = 0;
                rows.forEach((r) => {
                  const name = r["Name"]?.trim(); if (!name) return;
                  inquiriesApi.add({
                    name,
                    class: r["Class"] || "VI",
                    parent: r["Parent"] || "—",
                    phone: r["Phone"] || "—",
                    email: r["Email"] || "—",
                    source: (SOURCES.includes(r["Source"] as any) ? r["Source"] : "Walk-in") as any,
                    stage: "Inquiry",
                    counselor: r["Counselor"] || COUNSELORS[0],
                  } as any);
                  added++;
                });
                toast.success(`${added} inquiries imported`);
              }}
            />
            <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
              <FileText className="h-4 w-4" />Public Form
            </Button>
            <Button size="sm" className="gradient-primary border-0" onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" />New Inquiry
            </Button>
          </>
        }
      />

      <StudentDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        title="New Admission Inquiry"
        description="Capture the full admission profile. The record will enter the pipeline at the Inquiry stage and auto-create a Student when it reaches Enrolled."
        submitLabel="Create Inquiry"
        onCreate={(d) => {
          const id = inquiriesApi.add({
            name: d.name,
            class: d.class,
            parent: d.parent,
            motherName: d.motherName,
            phone: d.phone,
            email: d.email || "—",
            source: "Walk-in",
            stage: "Inquiry",
            counselor: COUNSELORS[0],
            gender: d.gender,
            dob: d.dob,
            prevSchool: d.previousSchool,
            address: d.address,
            notes: d.medicalNotes,
            studentDraft: d,
          } as any);
          toast.success(`${d.name} added · ${id}`);
        }}
      />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="test">Admission Test</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedList.length})</TabsTrigger>
          <TabsTrigger value="analytics">Conversion Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / parent / phone…" className="pl-8 h-9 w-64" />
            </div>
            <Select value={src} onValueChange={setSrc}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={counselor} onValueChange={setCounselor}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Counselor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All counselors</SelectItem>
                {COUNSELORS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {selected.size > 0 && (
              <div className="flex items-center gap-2 ml-auto bg-muted/50 px-3 py-1.5 rounded-md border">
                <span className="text-xs font-medium">{selected.size} selected</span>
                <Select onValueChange={(v) => bulkMove(v as AdmStage)}>
                  <SelectTrigger className="h-7 w-36 text-xs"><SelectValue placeholder="Move to…" /></SelectTrigger>
                  <SelectContent>{ADM_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { toast.success(`Bulk SMS to ${selected.size}`); setSelected(new Set()); }}><Send className="h-3 w-3" />SMS</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { inquiriesApi.bulkArchive(Array.from(selected)); toast.success("Archived"); setSelected(new Set()); }}><Archive className="h-3 w-3" /></Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => { inquiriesApi.bulkRemove(Array.from(selected)); toast.success("Deleted"); setSelected(new Set()); }}><Trash2 className="h-3 w-3" /></Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {ADM_STAGES.map((s) => {
              const n = cards.filter((c) => c.stage === s).length;
              return (
                <Card
                  key={s}
                  role="button"
                  tabIndex={0}
                  className="border-border/60 cursor-pointer hover:border-primary/50 hover:shadow-sm transition"
                  onClick={() => openStage(s)}
                  onKeyDown={(e) => { if (e.key === "Enter") openStage(s); }}
                  title={`Open ${s} table`}
                >
                  <CardContent className="p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s}</div>
                    <div className="text-2xl font-display font-semibold mt-1">{n}</div>
                  </CardContent>
                </Card>
              );
            })}
            <Card
              role="button"
              tabIndex={0}
              className="border-destructive/40 bg-destructive/5 cursor-pointer hover:border-destructive/70 transition"
              onClick={() => openStage("Rejected")}
              onKeyDown={(e) => { if (e.key === "Enter") openStage("Rejected"); }}
              title="Open Rejected list"
            >
              <CardContent className="p-3">
                <div className="text-[10px] uppercase tracking-wider text-destructive/80 flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</div>
                <div className="text-2xl font-display font-semibold mt-1 text-destructive">{rejectedList.length}</div>
              </CardContent>
            </Card>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ADM_STAGES.map((s) => {
              const items = cards.filter((c) => c.stage === s);
              return (
                <Card key={s} className="border-border/60 bg-muted/20"
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={() => onDrop(s)}>
                  <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-display uppercase tracking-wider text-muted-foreground">{s}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[560px] overflow-y-auto p-2">
                    {items.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">Drop here</div>}
                    {items.map((c) => {
                      const stageIdx = ADM_STAGES.indexOf(c.stage);
                      const next = ADM_STAGES[stageIdx + 1];
                      return (
                        <div key={c.id} draggable onDragStart={() => setDragId(c.id)}
                          className={`bg-card border border-l-4 ${stageColor[c.stage]} rounded-md p-3 hover:shadow-md transition cursor-grab active:cursor-grabbing ${selected.has(c.id) ? "ring-2 ring-primary" : ""}`}
                          onClick={(e) => { if ((e.target as HTMLElement).closest("[data-stop]")) return; navigate({ to: "/admin/admissions/$id", params: { id: c.id } }); }}>
                          <div className="flex items-start gap-2.5">
                            <div data-stop onClick={(e) => e.stopPropagation()}>
                              <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleSel(c.id)} />
                            </div>
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{c.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{c.name}</div>
                              <div className="text-[10px] text-muted-foreground">Class {c.class} · {c.source}</div>
                            </div>
                          </div>
                          <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{c.phone}</div>
                            <div className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 shrink-0" /><span className="truncate">{c.email}</span></div>
                            {c.counselor && <div className="text-[10px]">👤 {c.counselor}</div>}
                          </div>
                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t gap-1" data-stop onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] text-muted-foreground">{new Date(c.updatedAt).toLocaleDateString()}</span>
                            <div className="flex items-center gap-0.5">
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-destructive hover:text-destructive" onClick={() => { setRejectFor(c); setRejectReason(""); }} title="Reject inquiry">
                                <XCircle className="h-3 w-3" />
                              </Button>
                              {next && (
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => { inquiriesApi.moveStage(c.id, next); toast.success(`→ ${next}`); }}>
                                  {next.split(" ")[0]}<ArrowRight className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="forms" className="mt-4 space-y-3">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Admission Forms Received</CardTitle>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Filter by stage" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {ADM_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Parent / Contact</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {all.filter((i) => !i.archived && !i.rejected && (stageFilter === "all" || i.stage === stageFilter)).map((i) => (
                    <TableRow key={i.id} className="cursor-pointer" onClick={() => setViewForm(i)}>
                      <TableCell className="font-mono text-xs">{i.id}</TableCell>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell>{i.class}</TableCell>
                      <TableCell className="text-xs">{i.parent}<div className="text-muted-foreground">{i.phone}</div></TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{i.stage}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{i.source}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(i.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" onClick={() => setViewForm(i)}><Eye className="h-3.5 w-3.5" />View</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setRejectFor(i); setRejectReason(""); }}><XCircle className="h-3.5 w-3.5" />Reject</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="mt-4 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-destructive"><XCircle className="h-4 w-4" />Rejected Inquiries</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Rejected On</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejectedList.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No rejected inquiries.</TableCell></TableRow>
                  )}
                  {rejectedList.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">{i.id}</TableCell>
                      <TableCell className="font-medium">{i.name}<div className="text-[10px] text-muted-foreground">{i.parent} · {i.phone}</div></TableCell>
                      <TableCell>{i.class}</TableCell>
                      <TableCell className="text-xs max-w-md">{i.rejectionReason || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{i.rejectedAt ? new Date(i.rejectedAt).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => { inquiriesApi.unreject(i.id); toast.success(`${i.name} reinstated`); }}>
                          <RotateCcw className="h-3.5 w-3.5" />Reinstate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="test" className="mt-4 space-y-3">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="h-4 w-4" />Admission Test Results</CardTitle>
              <Select value={testFilter} onValueChange={setTestFilter}>
                <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Filter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All scores</SelectItem>
                  <SelectItem value="85">85 – 100% (Excellent)</SelectItem>
                  <SelectItem value="70">70 – 85% (Good)</SelectItem>
                  <SelectItem value="50">50 – 70% (Average)</SelectItem>
                  <SelectItem value="0">Below 50% (Weak)</SelectItem>
                  <SelectItem value="pending">Not attempted</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {all.filter((i) => {
                    const s = i.testScore;
                    if (testFilter === "all") return true;
                    if (testFilter === "pending") return s == null;
                    if (s == null) return false;
                    const min = Number(testFilter);
                    const max = min === 85 ? 100 : min === 70 ? 85 : min === 50 ? 70 : 50;
                    return s >= min && s < max + (min === 85 ? 1 : 0);
                  }).map((i) => {
                    const s = i.testScore;
                    const grade = s == null ? "—" : s >= 85 ? "A+" : s >= 70 ? "A" : s >= 50 ? "B" : "C";
                    const tone = s == null ? "outline" : s >= 70 ? "default" : s >= 50 ? "secondary" : "destructive";
                    return (
                      <TableRow key={i.id}>
                        <TableCell className="font-mono text-xs">{i.id}</TableCell>
                        <TableCell className="font-medium">{i.name}</TableCell>
                        <TableCell>{i.class}</TableCell>
                        <TableCell className="font-semibold">{s ?? "—"}{s != null && "%"}</TableCell>
                        <TableCell><Badge variant={tone as any}>{grade}</Badge></TableCell>
                        <TableCell><span className="text-xs text-muted-foreground">{i.stage}</span></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="analytics" className="mt-4">
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Inquiries</div><div className="text-3xl font-display font-semibold mt-1">{total}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Enrolled</div><div className="text-3xl font-display font-semibold mt-1 text-success">{enrolled}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" />Conversion Rate</div><div className="text-3xl font-display font-semibold mt-1">{convRate}%</div></CardContent></Card>
          </div>
          <Card className="mb-4"><CardHeader><CardTitle className="text-base">Stage Funnel</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {counts.map((c) => (
                <div key={c.stage} className="flex items-center gap-3">
                  <div className="w-32 text-xs text-muted-foreground">{c.stage}</div>
                  <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${total ? (c.n / total) * 100 : 0}%` }} />
                  </div>
                  <div className="w-12 text-right text-sm font-medium">{c.n}</div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle className="text-base">By Source</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {bySource.map((s) => (
                <div key={s.source} className="p-3 border rounded-md">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.source}</div>
                  <div className="text-xl font-display font-semibold mt-1">{s.n}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Public Admission Form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Public Admission Form</DialogTitle>
            <DialogDescription>Minimum details to register an enquiry.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Full Name *</Label><Input value={publicForm.name} onChange={(e) => setPublicForm({ ...publicForm, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={publicForm.email} onChange={(e) => setPublicForm({ ...publicForm, email: e.target.value })} /></div>
            <div><Label>Phone *</Label><Input value={publicForm.phone} onChange={(e) => setPublicForm({ ...publicForm, phone: e.target.value })} /></div>
            <div><Label>Location</Label><Input value={publicForm.location} onChange={(e) => setPublicForm({ ...publicForm, location: e.target.value })} /></div>
            <div><Label>Previous School</Label><Input value={publicForm.school} onChange={(e) => setPublicForm({ ...publicForm, school: e.target.value })} /></div>
            <div><Label>Parent Name</Label><Input value={publicForm.parent} onChange={(e) => setPublicForm({ ...publicForm, parent: e.target.value })} /></div>
            <div><Label>Parent Occupation</Label><Input value={publicForm.occupation} onChange={(e) => setPublicForm({ ...publicForm, occupation: e.target.value })} /></div>
            <div className="col-span-2"><Label>Class Applying For</Label>
              <Select value={publicForm.class} onValueChange={(v) => setPublicForm({ ...publicForm, class: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"].map((c) => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={publicForm.notes} onChange={(e) => setPublicForm({ ...publicForm, notes: e.target.value })} /></div>
            <label className="col-span-2 flex items-start gap-2 text-xs">
              <Checkbox checked={publicForm.consent} onCheckedChange={(v) => setPublicForm({ ...publicForm, consent: !!v })} />
              <span>I consent to the school storing this information for admission processing.</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button disabled={!publicForm.consent || !publicForm.name || !publicForm.phone} onClick={() => {
              const id = inquiriesApi.add({
                name: publicForm.name, class: publicForm.class, parent: publicForm.parent || "—",
                phone: publicForm.phone, email: publicForm.email || "—", source: "Website",
                stage: "Inquiry", counselor: COUNSELORS[0],
                address: publicForm.location, prevSchool: publicForm.school,
                notes: `Parent occupation: ${publicForm.occupation}\n${publicForm.notes}`,
              } as any);
              toast.success(`Form submitted · ${id}`);
              setFormOpen(false);
              setPublicForm({ name: "", email: "", phone: "", location: "", school: "", parent: "", occupation: "", class: "VI", notes: "", consent: false });
            }}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Form Details */}
      <Dialog open={!!viewForm} onOpenChange={(o) => !o && setViewForm(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewForm?.name} — {viewForm?.id}</DialogTitle>
            <DialogDescription>Admission form details</DialogDescription>
          </DialogHeader>
          {viewForm && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><Label className="text-xs">Class</Label><div>{viewForm.class}</div></div>
              <div><Label className="text-xs">Source</Label><div>{viewForm.source}</div></div>
              <div><Label className="text-xs">Parent</Label><div>{viewForm.parent}</div></div>
              <div><Label className="text-xs">Mother</Label><div>{viewForm.motherName || "—"}</div></div>
              <div><Label className="text-xs">Phone</Label><div>{viewForm.phone}</div></div>
              <div><Label className="text-xs">Email</Label><div>{viewForm.email}</div></div>
              <div><Label className="text-xs">DOB</Label><div>{viewForm.dob || "—"}</div></div>
              <div><Label className="text-xs">Gender</Label><div>{viewForm.gender || "—"}</div></div>
              <div className="col-span-2"><Label className="text-xs">Previous School</Label><div>{viewForm.prevSchool || "—"}</div></div>
              <div className="col-span-2"><Label className="text-xs">Address</Label><div>{viewForm.address || "—"}</div></div>
              <div className="col-span-2"><Label className="text-xs">Notes</Label><div className="whitespace-pre-wrap">{viewForm.notes || "—"}</div></div>
              <div><Label className="text-xs">Stage</Label><div><Badge>{viewForm.stage}</Badge></div></div>
              <div><Label className="text-xs">Counselor</Label><div>{viewForm.counselor || "—"}</div></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { if (viewForm) { navigate({ to: "/admin/admissions/$id", params: { id: viewForm.id } }); setViewForm(null); } }}>Open full record</Button>
            <Button onClick={() => setViewForm(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject inquiry dialog */}
      <Dialog open={!!rejectFor} onOpenChange={(o) => { if (!o) { setRejectFor(null); setRejectReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reason for Rejection</DialogTitle>
            <DialogDescription>{rejectFor?.name} · {rejectFor?.id} — this inquiry will move to the Rejected list.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">Reason *</Label>
            <Textarea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Seats full for the requested class, documents incomplete, applicant withdrew, etc." />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setRejectFor(null); setRejectReason(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject}><XCircle className="h-4 w-4" />Reject Inquiry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>

  );
}
