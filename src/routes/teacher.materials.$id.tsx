import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Archive, Download } from "lucide-react";
import { toast } from "sonner";
import { useMaterials, useLessonPlans, materialsApi, activityApi } from "@/lib/store";

export const Route = createFileRoute("/teacher/materials/$id")({
  head: () => ({ meta: [{ title: "Material — Edureon" }] }),
  component: MaterialDetail,
});

function MaterialDetail() {
  const { id } = useParams({ from: "/teacher/materials/$id" });
  useMaterials();
  const plans = useLessonPlans();
  const m = materialsApi.get(id);
  if (!m) return <PageContainer><div className="text-sm text-muted-foreground">Not found. <Link to="/teacher/materials" className="underline">Back</Link></div></PageContainer>;
  const linkedPlans = plans.filter((p) => p.materials.includes(m.id));
  const acts = activityApi.for("material", m.id);

  return (
    <PageContainer>
      <PageHeader eyebrow={m.id} title={m.title}
        description={`${m.type} · ${m.subject} · uploaded by ${m.teacher}`}
        actions={
          <>
            <Button variant="ghost" size="sm" asChild><Link to="/teacher/materials"><ArrowLeft className="h-4 w-4" />Back</Link></Button>
            <Button size="sm" onClick={() => { materialsApi.download(m.id); toast.success("Logged download"); }}><Download className="h-4 w-4" />Download</Button>
            <Button size="sm" variant="outline" onClick={() => { materialsApi.archive(m.id, !m.archived); toast.success(m.archived ? "Restored" : "Archived"); }}><Archive className="h-4 w-4" />{m.archived ? "Restore" : "Archive"}</Button>
          </>
        }
      />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subjects ({1})</TabsTrigger>
          <TabsTrigger value="classes">Classes ({m.klasses.length})</TabsTrigger>
          <TabsTrigger value="plans">Linked Plans ({linkedPlans.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><Card><CardContent className="p-4 text-sm space-y-2">
          <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">URL</span><span className="font-mono text-xs">{m.url}</span></div>
          <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Size</span><span>{m.size || "—"}</span></div>
          <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Downloads</span><span>{m.downloads}</span></div>
          <div className="pt-2">{m.description || "No description."}</div>
        </CardContent></Card></TabsContent>
        <TabsContent value="subjects"><Card><CardContent className="p-4 text-sm"><Badge variant="outline">{m.subject}</Badge></CardContent></Card></TabsContent>
        <TabsContent value="classes"><Card><CardContent className="p-4 flex flex-wrap gap-1">{m.klasses.map((k) => <Badge key={k} variant="secondary">{k}</Badge>)}</CardContent></Card></TabsContent>
        <TabsContent value="plans"><Card><CardContent className="p-3 space-y-2">
          {linkedPlans.map((p) => <Link key={p.id} to="/teacher/lesson-plans/$id" params={{ id: p.id }} className="block p-2 border rounded-md hover:bg-muted/40"><div className="text-sm font-medium">{p.title}</div><div className="text-[11px] text-muted-foreground">{p.klass} · {p.subject}</div></Link>)}
          {linkedPlans.length === 0 && <div className="text-xs text-muted-foreground text-center p-4">Not linked to any plan yet.</div>}
        </CardContent></Card></TabsContent>
        <TabsContent value="activity"><Card><CardContent className="p-4 space-y-1">
          {acts.map((a) => <div key={a.id} className="flex justify-between text-xs border-b py-1.5"><span>{a.action}</span><span className="text-muted-foreground">{new Date(a.at).toLocaleString("en-IN")}</span></div>)}
        </CardContent></Card></TabsContent>
      </Tabs>
    </PageContainer>
  );
}
