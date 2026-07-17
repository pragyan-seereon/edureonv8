import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CalendarCheck, ClipboardList, ArrowRight, Crown } from "lucide-react";

export const Route = createFileRoute("/teacher/classes")({
  head: () => ({ meta: [{ title: "My Classes — Edureon" }] }),
  component: MyClasses,
});

const classes = [
  { section: "X-B", subject: "Mathematics", students: 38, attendance: 91, isMentor: true, room: "F-11" },
  { section: "X-A", subject: "Mathematics", students: 40, attendance: 95, isMentor: false, room: "F-12" },
  { section: "IX-A", subject: "Mathematics", students: 36, attendance: 88, isMentor: false, room: "G-02" },
  { section: "VIII-B", subject: "Mathematics", students: 35, attendance: 92, isMentor: false, room: "G-03" },
];

function MyClasses() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Teacher Portal"
        title="My Classes & Sections"
        description="Sections assigned to you this term, with mentor status, headcount and live attendance."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {classes.map((c) => (
          <Card key={c.section} className="border-border/60 hover:shadow-md transition">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="font-display text-xl">Class {c.section}</CardTitle>
                  <CardDescription>{c.subject} · Room {c.room}</CardDescription>
                </div>
                {c.isMentor && <Badge className="bg-warning/15 text-warning border-warning/20"><Crown className="h-3 w-3" />Class Teacher</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-md bg-muted/40"><div className="text-xs text-muted-foreground">Students</div><div className="text-lg font-semibold">{c.students}</div></div>
                <div className="p-2 rounded-md bg-muted/40"><div className="text-xs text-muted-foreground">Attendance</div><div className="text-lg font-semibold text-success">{c.attendance}%</div></div>
                <div className="p-2 rounded-md bg-muted/40"><div className="text-xs text-muted-foreground">Pending</div><div className="text-lg font-semibold text-warning">3</div></div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" asChild><Link to="/teacher/attendance"><CalendarCheck className="h-4 w-4" />Attendance</Link></Button>
                <Button variant="outline" size="sm" asChild><Link to="/assignments"><ClipboardList className="h-4 w-4" />Assignments</Link></Button>
                <Button variant="ghost" size="sm" asChild><Link to="/students"><Users className="h-4 w-4" />Roster<ArrowRight className="h-3.5 w-3.5" /></Link></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
