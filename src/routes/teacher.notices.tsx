import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Megaphone, Send, Archive, EyeOff, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNotices, useSections, noticesApi, type Notice, type NoticeAudience } from "@/lib/store";

export const Route = createFileRoute("/teacher/notices")({
  head: () => ({ meta: [{ title: "Notices — Edureon" }] }),
  component: NoticesPage,
});

const cats = ["Academic","Events","Fees","Holiday","Exam","General"] as const;
const auds: NoticeAudience[] = ["All","Teachers","Students","Parents","Staff","Class"];

function NoticesPage() {
  const notices = useNotices();
  const sections = useSections();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", category: "Academic" as Notice["category"], audience: "All" as NoticeAudience, targetClass: "", attachments: [] as string[] });

  const submit = (publish: boolean) => {
    if (!form.title || !form.body) { toast.error("Title and body required"); return; }
    noticesApi.add({ ...form, by: "Principal", status: publish ? "Published" : "Draft" });
    toast.success(publish ? "Published" : "Saved as draft");
    setOpen(false);
    setForm({ ...form, title: "", body: "" });
  };

  return (
    <PageContainer>
      <PageHeader eyebrow="Communication" title="Notices"
        description="Create, target, publish and track acknowledgements."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="gradient-primary border-0"><Plus className="h-4 w-4" />New Notice</Button></DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Create notice</DialogTitle><DialogDescription>Target a specific audience or class.</DialogDescription></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Message</Label><Textarea rows={5} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as Notice["category"] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Audience</Label>
                    <Select value={form.audience} onValueChange={(v) => setForm((f) => ({ ...f, audience: v as NoticeAudience }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{auds.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {form.audience === "Class" && (
                  <div className="space-y-1.5"><Label>Class</Label>
                    <Select value={form.targetClass} onValueChange={(v) => setForm((f) => ({ ...f, targetClass: v }))}>
                      <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                      <SelectContent>{sections.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter><Button variant="outline" onClick={() => submit(false)}>Save Draft</Button><Button className="gradient-primary border-0" onClick={() => submit(true)}><Send className="h-4 w-4" />Publish</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <Card><CardContent className="p-0 divide-y">
        {notices.map((n) => (
          <div key={n.id} className="p-3 hover:bg-muted/30">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-md flex items-center justify-center bg-info/10 text-info shrink-0"><Megaphone className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{n.title}</span>
                  <Badge variant="outline" className="text-[10px]">{n.category}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{n.audience}{n.targetClass ? ` · ${n.targetClass}` : ""}</Badge>
                  <Badge variant={n.status === "Published" ? "default" : "outline"} className="text-[10px] ml-auto">{n.status}</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{n.by} · {new Date(n.createdAt).toLocaleDateString("en-IN")} · {n.acks.length} acknowledgements</div>
                <div className="text-xs mt-1 line-clamp-2">{n.body}</div>
                <div className="flex gap-2 mt-2">
                  {n.status === "Draft" && <Button size="sm" variant="outline" onClick={() => { noticesApi.publish(n.id); toast.success("Published"); }}><Send className="h-3.5 w-3.5" />Publish</Button>}
                  {n.status === "Published" && <Button size="sm" variant="outline" onClick={() => { noticesApi.unpublish(n.id); toast.success("Unpublished"); }}><EyeOff className="h-3.5 w-3.5" />Unpublish</Button>}
                  {n.status !== "Archived" && <Button size="sm" variant="outline" onClick={() => { noticesApi.archive(n.id); toast.success("Archived"); }}><Archive className="h-3.5 w-3.5" />Archive</Button>}
                  <Button size="sm" variant="ghost" onClick={() => { noticesApi.acknowledge(n.id, "You"); toast.success("Acknowledged"); }}><CheckCircle2 className="h-3.5 w-3.5" />Acknowledge</Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent></Card>
    </PageContainer>
  );
}
