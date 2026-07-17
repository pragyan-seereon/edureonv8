import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { MessageSquare, Send, Mail, Bell, Megaphone, Smartphone, Archive, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useNotices, noticesApi, useSections, type Notice, type NoticeAudience } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/communication")({
  head: () => ({ meta: [{ title: "Communication — Edureon ERP" }] }),
  component: CommsPage,
});

const channels = [
  { d: "Mon", sms: 1240, push: 4820, email: 980 },
  { d: "Tue", sms: 1480, push: 5210, email: 1120 },
  { d: "Wed", sms: 1320, push: 4980, email: 1040 },
  { d: "Thu", sms: 1620, push: 5820, email: 1280 },
  { d: "Fri", sms: 1840, push: 6120, email: 1420 },
  { d: "Sat", sms: 980, push: 3920, email: 720 },
];

function CommsPage() {
  const notices = useNotices();
  const klasses = useSections();
  const { user } = useAuth();
  const [audience, setAudience] = useState<NoticeAudience>("All");
  const [targetClass, setTargetClass] = useState<string>("");
  const [category, setCategory] = useState<Notice["category"]>("General");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const published = useMemo(() => notices.filter((n) => n.status === "Published"), [notices]);
  const drafts = useMemo(() => notices.filter((n) => n.status === "Draft"), [notices]);
  const archived = useMemo(() => notices.filter((n) => n.status === "Archived"), [notices]);

  const reset = () => { setTitle(""); setBody(""); setAudience("All"); setCategory("General"); setTargetClass(""); };

  const send = (status: Notice["status"]) => {
    if (!title.trim() || !body.trim()) { toast.error("Title and message required"); return; }
    noticesApi.add({
      title: title.trim(),
      body: body.trim(),
      category,
      audience,
      targetClass: audience === "Class" ? targetClass || undefined : undefined,
      attachments: [],
      by: user?.name || "Admin",
      status,
    });
    toast.success(status === "Published" ? "Notice published to recipients" : "Saved as draft");
    reset();
  };

  return (
    <PageContainer>
      <PageHeader eyebrow="Operations" title="Communication Center"
        description="Notices, circulars and broadcasts — fully wired to the academic ERP."
        actions={<Button size="sm" className="gradient-primary border-0" onClick={() => send("Published")}><Send className="h-4 w-4" />Publish Now</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Published Notices" value={published.length} icon={<Megaphone className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Drafts" value={drafts.length} icon={<MessageSquare className="h-5 w-5" />} tone="info" />
        <KpiCard label="Acknowledgements" value={published.reduce((a, n) => a + n.acks.length, 0)} icon={<CheckCircle2 className="h-5 w-5" />} tone="success" />
        <KpiCard label="Archived" value={archived.length} icon={<Archive className="h-5 w-5" />} tone="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader><CardTitle className="text-base">Channel Volume (this week)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={channels}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="d" fontSize={11} /><YAxis fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="push" stackId="a" fill="var(--chart-1)" />
                <Bar dataKey="sms" stackId="a" fill="var(--chart-2)" />
                <Bar dataKey="email" stackId="a" fill="var(--chart-3)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-base">Compose Notice</CardTitle><CardDescription>Publishes to the live notice board</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Select value={audience} onValueChange={(v) => setAudience(v as NoticeAudience)}>
              <SelectTrigger><SelectValue placeholder="Audience" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Institute-wide</SelectItem>
                <SelectItem value="Parents">All Parents</SelectItem>
                <SelectItem value="Students">All Students</SelectItem>
                <SelectItem value="Teachers">All Teachers</SelectItem>
                <SelectItem value="Staff">All Staff</SelectItem>
                <SelectItem value="Class">Specific Class</SelectItem>
              </SelectContent>
            </Select>
            {audience === "Class" && (
              <Select value={targetClass} onValueChange={setTargetClass}>
                <SelectTrigger><SelectValue placeholder="Pick class" /></SelectTrigger>
                <SelectContent>{klasses.map((k) => <SelectItem key={k.id} value={k.name}>{k.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <Select value={category} onValueChange={(v) => setCategory(v as Notice["category"])}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>{(["Academic","Events","Fees","Holiday","Exam","General"] as const).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea placeholder="Message…" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => send("Draft")}>Save Draft</Button>
              <Button className="flex-1 gradient-primary border-0" size="sm" onClick={() => send("Published")}>
                <Send className="h-3.5 w-3.5" />Publish
              </Button>
            </div>
            <div className="flex gap-1 pt-1 text-[10px] text-muted-foreground"><Smartphone className="h-3 w-3" />SMS <Bell className="h-3 w-3 ml-2" />Push <Mail className="h-3 w-3 ml-2" />Email — all bundled</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="published">
        <TabsList>
          <TabsTrigger value="published">Published ({published.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({archived.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="published" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-0 divide-y">
            {published.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">No published notices yet.</div>}
            {published.map((n) => (
              <div key={n.id} className="p-4 hover:bg-muted/40 flex items-start gap-4">
                <div className="h-10 w-10 rounded-md gradient-primary flex items-center justify-center shrink-0"><Megaphone className="h-5 w-5 text-primary-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.audience}{n.targetClass ? ` · ${n.targetClass}` : ""} · {n.by} · {n.category}</div>
                  <div className="text-xs mt-1 line-clamp-2">{n.body}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground">{n.publishedAt ? new Date(n.publishedAt).toLocaleDateString("en-IN") : "—"}</div>
                  <Badge variant="secondary" className="mt-1 text-[10px]">{n.acks.length} ack</Badge>
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { noticesApi.unpublish(n.id); toast.success("Moved to drafts"); }}>Unpublish</Button>
                  <Button size="sm" variant="ghost" onClick={() => { noticesApi.archive(n.id); toast.success("Archived"); }}>Archive</Button>
                </div>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="drafts" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-0 divide-y">
            {drafts.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">No drafts.</div>}
            {drafts.map((n) => (
              <div key={n.id} className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.audience} · {n.category}</div>
                </div>
                <Button size="sm" onClick={() => { noticesApi.publish(n.id); toast.success("Published"); }}><Send className="h-3.5 w-3.5" />Publish</Button>
                <Button size="sm" variant="ghost" onClick={() => { noticesApi.remove(n.id); toast.success("Deleted"); }}>Delete</Button>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-0 divide-y">
            {archived.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">No archived notices.</div>}
            {archived.map((n) => (
              <div key={n.id} className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0"><div className="font-semibold text-sm">{n.title}</div><div className="text-xs text-muted-foreground">{n.audience} · {n.category}</div></div>
                <Button size="sm" variant="outline" onClick={() => { noticesApi.update(n.id, { status: "Draft" }); toast.success("Restored to drafts"); }}>Restore</Button>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
