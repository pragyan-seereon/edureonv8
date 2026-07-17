import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileBox, Download, Archive, ArchiveRestore, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useMaterials, useSubjects, useSections, materialsApi, type Material } from "@/lib/store";

export const Route = createFileRoute("/teacher/materials")({
  head: () => ({ meta: [{ title: "Study Materials — Edureon" }] }),
  component: MaterialsPage,
});

function MaterialsPage() {
  const materials = useMaterials();
  const subjects = useSubjects();
  const sections = useSections();
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [filterSub, setFilterSub] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", type: "PDF" as Material["type"], url: "", subject: subjects[0]?.name || "Mathematics", klasses: [] as string[], description: "", size: "" });

  const visible = useMemo(() => materials.filter((m) =>
    (showArchived ? m.archived : !m.archived) &&
    (filterSub === "all" || m.subject === filterSub) &&
    (!q || m.title.toLowerCase().includes(q.toLowerCase()))
  ), [materials, showArchived, filterSub, q]);

  const submit = () => {
    if (!form.title || !form.url || form.klasses.length === 0) { toast.error("Title, URL and at least one class required"); return; }
    materialsApi.add({ ...form, teacher: "A. Mehta" });
    toast.success("Material uploaded");
    setOpen(false);
    setForm({ ...form, title: "", url: "", description: "", klasses: [] });
  };

  return (
    <PageContainer>
      <PageHeader eyebrow="Teacher Portal" title="Study Materials"
        description="Upload PDFs, videos and reference links. Map to subjects and classes."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="gradient-primary border-0"><Plus className="h-4 w-4" />Upload</Button></DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Upload study material</DialogTitle><DialogDescription>Linked materials become visible to mapped classes.</DialogDescription></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as Material["type"] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{(["PDF","Video","Link","Doc"] as const).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Subject</Label>
                    <Select value={form.subject} onValueChange={(v) => setForm((f) => ({ ...f, subject: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>URL / File reference</Label><Input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://… or /files/foo.pdf" /></div>
                <div className="space-y-1.5"><Label>Map to classes</Label>
                  <div className="flex flex-wrap gap-1">
                    {sections.map((s) => (
                      <Badge key={s.id} variant={form.klasses.includes(s.name) ? "default" : "outline"} className="cursor-pointer text-[11px]"
                        onClick={() => setForm((f) => ({ ...f, klasses: f.klasses.includes(s.name) ? f.klasses.filter((k) => k !== s.name) : [...f.klasses, s.name] }))}>
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
              </div>
              <DialogFooter><Button onClick={submit} className="gradient-primary border-0">Upload</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 max-w-sm"><Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search materials…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8 h-9" /></div>
        <Select value={filterSub} onValueChange={setFilterSub}>
          <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All subjects</SelectItem>{subjects.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={() => setShowArchived((v) => !v)}>{showArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}{showArchived ? "Active" : "Archived"}</Button>
      </div>

      <Card><CardContent className="p-0 divide-y">
        {visible.map((m) => (
          <Link key={m.id} to="/teacher/materials/$id" params={{ id: m.id }} className="flex items-start gap-3 p-3 hover:bg-muted/40">
            <div className="h-9 w-9 rounded-md flex items-center justify-center bg-info/10 text-info shrink-0"><FileBox className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2"><span className="text-sm font-medium truncate">{m.title}</span><Badge variant="outline" className="text-[10px]">{m.type}</Badge></div>
              <div className="text-[11px] text-muted-foreground">{m.subject} · {m.klasses.join(", ")} · {m.teacher}</div>
            </div>
            <div className="text-right shrink-0"><div className="text-[11px] text-muted-foreground flex items-center gap-1"><Download className="h-3 w-3" />{m.downloads}</div><div className="text-[10px] text-muted-foreground">{new Date(m.uploadedAt).toLocaleDateString("en-IN")}</div></div>
          </Link>
        ))}
        {visible.length === 0 && <div className="text-sm text-muted-foreground text-center p-6">No materials.</div>}
      </CardContent></Card>
    </PageContainer>
  );
}
