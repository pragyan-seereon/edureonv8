import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileBox, Download, Search, ExternalLink } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useMaterials, useSubjects, materialsApi } from "@/lib/store";

export const Route = createFileRoute("/student/materials")({
  head: () => ({ meta: [{ title: "Study Materials — Edureon" }] }),
  component: StudentMaterials,
});

const STUDENT_CLASS = "X-B";

function StudentMaterials() {
  const materials = useMaterials();
  const subjects = useSubjects();
  const [q, setQ] = useState("");
  const [sub, setSub] = useState("all");

  const visible = useMemo(() =>
    materials.filter((m) => !m.archived && m.klasses.includes(STUDENT_CLASS) && (sub === "all" || m.subject === sub) && (!q || m.title.toLowerCase().includes(q.toLowerCase())))
  , [materials, q, sub]);

  return (
    <PageContainer>
      <PageHeader eyebrow="Student Portal" title="Study Materials" description={`Resources mapped to class ${STUDENT_CLASS}`} />
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 max-w-sm"><Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input className="pl-8 h-9" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={sub} onValueChange={setSub}><SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All subjects</SelectItem>{subjects.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select>
      </div>
      <Card><CardContent className="p-0 divide-y">
        {visible.map((m) => (
          <div key={m.id} className="flex items-start gap-3 p-3 hover:bg-muted/40">
            <div className="h-9 w-9 rounded-md flex items-center justify-center bg-info/10 text-info shrink-0"><FileBox className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{m.title}</div><div className="text-[11px] text-muted-foreground">{m.subject} · {m.type} · {m.teacher}</div>{m.description && <div className="text-[11px] mt-1 text-muted-foreground">{m.description}</div>}</div>
            <Button size="sm" variant="outline" onClick={() => { materialsApi.download(m.id); toast.success("Opening…"); }}>{m.type === "Link" ? <ExternalLink className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}{m.type === "Link" ? "Open" : "Download"}</Button>
            <Badge variant="outline" className="text-[10px]">{m.downloads}</Badge>
          </div>
        ))}
        {visible.length === 0 && <div className="text-sm text-muted-foreground text-center p-6">No materials yet for your class.</div>}
      </CardContent></Card>
    </PageContainer>
  );
}
