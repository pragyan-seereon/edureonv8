import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Bell, Check, GraduationCap, AlertTriangle, BookOpen, Users,
  Megaphone, ClipboardList, Plane, CalendarCheck, Trophy, FileText,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useNotices, useLeaveRequests, useCorrectionRequests, useSubmissions,
  useMarkEntries, useExams, useAssignments,
} from "@/lib/store";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Edureon ERP" }] }),
  component: NotificationsPage,
});

type Item = {
  id: string; icon: typeof Bell; tone: string; title: string; desc: string;
  ts: number; category: string; href?: string;
};

const ago = (ts: number) => {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
};

function NotificationsPage() {
  const notices = useNotices();
  const leaves = useLeaveRequests();
  const corrections = useCorrectionRequests();
  const subs = useSubmissions();
  const marks = useMarkEntries();
  const exams = useExams();
  const assignments = useAssignments();
  const [read, setRead] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState("all");

  const items: Item[] = useMemo(() => {
    const out: Item[] = [];
    notices.filter((n) => n.status === "Published").slice(0, 8).forEach((n) =>
      out.push({
        id: `notice-${n.id}`, icon: Megaphone, tone: "bg-primary/10 text-primary",
        title: n.title, desc: `${n.by} · ${n.audience}${n.targetClass ? " · " + n.targetClass : ""}`,
        ts: new Date(n.publishedAt || n.createdAt).getTime(), category: "Academic",
      })
    );
    leaves.slice(0, 6).forEach((l) =>
      out.push({
        id: `leave-${l.id}`, icon: Plane,
        tone: l.status === "Approved" ? "bg-success/10 text-success" : l.status === "Rejected" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning",
        title: `Leave ${l.status.toLowerCase()} — ${l.studentName}`,
        desc: `${l.type} · ${l.from} → ${l.to} · ${l.klass}`,
        ts: new Date(l.raisedAt || Date.now()).getTime(), category: "HR",
      })
    );
    corrections.slice(0, 4).forEach((c) =>
      out.push({
        id: `corr-${c.id}`, icon: AlertTriangle, tone: "bg-warning/10 text-warning",
        title: `Attendance correction — ${c.status}`,
        desc: `${c.studentName} · ${c.date} · ${c.reason}`,
        ts: new Date(c.raisedAt || Date.now()).getTime(), category: "Academic",
      })
    );
    marks.filter((m) => m.status === "Published").slice(0, 4).forEach((m) =>
      out.push({
        id: `mark-${m.id}`, icon: Trophy, tone: "bg-success/10 text-success",
        title: `Result published — ${m.subject}`,
        desc: `${m.studentName} · ${m.obtained}/${m.max} · ${m.klass}`,
        ts: new Date(m.publishedAt || m.enteredAt || Date.now()).getTime(), category: "Academic",
      })
    );
    subs.filter((s) => s.status === "Submitted").slice(0, 6).forEach((s) => {
      const a = assignments.find((x) => x.id === s.assignmentId);
      out.push({
        id: `sub-${s.id}`, icon: ClipboardList, tone: "bg-info/10 text-info",
        title: `New submission — ${a?.title || "Assignment"}`,
        desc: `${s.studentName} · ${a?.subject || ""} · awaiting grading`,
        ts: new Date(s.submittedAt || Date.now()).getTime(), category: "Academic",
      });
    });
    exams.filter((e) => e.status === "Scheduled").slice(0, 4).forEach((e) =>
      out.push({
        id: `exam-${e.id}`, icon: BookOpen, tone: "bg-info/10 text-info",
        title: `${e.name} scheduled`,
        desc: `Class ${e.class} · ${e.from} → ${e.to} · ${e.subjects} subjects`,
        ts: Date.now() - 6 * 3_600_000, category: "Academic",
      })
    );
    assignments.filter((a) => a.status === "Published").slice(0, 3).forEach((a) =>
      out.push({
        id: `asg-${a.id}`, icon: FileText, tone: "bg-primary/10 text-primary",
        title: `Assignment published — ${a.title}`,
        desc: `${a.klass} · ${a.subject} · due ${a.due}`,
        ts: Date.now() - 12 * 3_600_000, category: "Academic",
      })
    );

    return out.sort((a, b) => b.ts - a.ts);
  }, [notices, leaves, corrections, subs, marks, exams, assignments]);

  const filtered = items.filter((i) => {
    if (tab === "all") return true;
    if (tab === "unread") return !read.has(i.id);
    return i.category.toLowerCase() === tab;
  });
  const unread = items.filter((i) => !read.has(i.id)).length;
  const markAll = () => { setRead(new Set(items.map((i) => i.id))); toast.success("All marked as read"); };

  return (
    <PageContainer>
      <PageHeader eyebrow="Inbox" title="Notification Center"
        description="Live alerts derived from notices, attendance, exams, assignments and leave workflows."
        actions={<Button variant="outline" size="sm" onClick={markAll}><Check className="h-4 w-4" />Mark all read</Button>}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread {unread > 0 && <Badge variant="destructive" className="ml-1.5 h-4 px-1.5 text-[10px]">{unread}</Badge>}</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="hr">HR</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <Card className="border-border/60">
            <CardContent className="p-0 divide-y">
              {filtered.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  <Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />You're all caught up.
                </div>
              ) : filtered.map((n) => {
                const isRead = read.has(n.id);
                return (
                  <div key={n.id} onClick={() => setRead((r) => new Set(r).add(n.id))}
                    className={`flex items-start gap-3 p-4 hover:bg-muted/40 cursor-pointer ${!isRead ? "bg-primary/[0.03]" : ""}`}>
                    <div className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 ${n.tone}`}>
                      <n.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium truncate">{n.title}</div>
                        {!isRead && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{n.desc}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-muted-foreground">{ago(n.ts)} ago</div>
                      <Badge variant="outline" className="mt-1 text-[10px]">{n.category}</Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-3 text-[11px] text-muted-foreground flex items-center gap-2">
        <GraduationCap className="h-3 w-3" />Wired live to: notices, leave requests, attendance corrections, submissions, mark publishes, exams &amp; assignments. <Users className="h-3 w-3" /><CalendarCheck className="h-3 w-3" />
        <Link to="/communication" className="ml-auto underline">Compose notice →</Link>
      </div>
    </PageContainer>
  );
}
