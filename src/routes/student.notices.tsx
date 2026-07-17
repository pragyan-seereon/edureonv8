import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useNotices, noticesApi } from "@/lib/store";

export const Route = createFileRoute("/student/notices")({
  head: () => ({ meta: [{ title: "Notices — Edureon" }] }),
  component: StudentNotices,
});

const WHO = "STU1000";

function StudentNotices() {
  const notices = useNotices();
  const visible = notices.filter((n) => n.status === "Published" && (n.audience === "Students" || n.audience === "Parents" || n.audience === "All"));

  return (
    <PageContainer>
      <PageHeader eyebrow="Notices" title="Latest from school" description={`${visible.length} active notices`} />
      <Card><CardContent className="p-0 divide-y">
        {visible.map((n) => (
          <div key={n.id} className="p-3 flex items-start gap-3">
            <div className="h-9 w-9 rounded-md flex items-center justify-center bg-info/10 text-info shrink-0"><Megaphone className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap"><span className="text-sm font-medium">{n.title}</span><Badge variant="outline" className="text-[10px]">{n.category}</Badge>{n.acks.includes(WHO) && <Badge className="text-[10px]">Acknowledged</Badge>}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{n.by} · {new Date(n.publishedAt || n.createdAt).toLocaleDateString("en-IN")}</div>
              <div className="text-sm mt-1">{n.body}</div>
              {!n.acks.includes(WHO) && <Button size="sm" variant="outline" className="mt-2" onClick={() => { noticesApi.acknowledge(n.id, WHO); toast.success("Acknowledged"); }}><CheckCircle2 className="h-3.5 w-3.5" />Acknowledge</Button>}
            </div>
          </div>
        ))}
        {visible.length === 0 && <div className="text-sm text-muted-foreground text-center p-6">No notices.</div>}
      </CardContent></Card>
    </PageContainer>
  );
}
