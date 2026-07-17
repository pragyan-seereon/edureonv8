import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStudents } from "@/lib/store";

export const Route = createFileRoute("/parent/children")({
  head: () => ({ meta: [{ title: "My Children — Edureon" }] }),
  component: () => {
    const students = useStudents();
    const myKids = students.slice(0, 2); // demo: first two
    return (
      <PageContainer>
        <PageHeader eyebrow="Parent Portal" title="My Children" description={`${myKids.length} children enrolled`} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myKids.map((k) => (
            <Link key={k.id} to="/parent/children/$id" params={{ id: k.id }}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">{k.name.split(" ").map((n) => n[0]).slice(0,2).join("")}</div>
                  <div className="flex-1">
                    <div className="font-medium">{k.name}</div>
                    <div className="text-[11px] text-muted-foreground">{k.admissionNo} · {k.class}-{k.section} · Roll {k.rollNo}</div>
                    <div className="flex gap-2 mt-2"><Badge variant="outline" className="text-[10px]">Attendance {k.attendance}%</Badge><Badge variant={k.feeStatus === "Paid" ? "default" : "outline"} className="text-[10px]">{k.feeStatus}</Badge></div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </PageContainer>
    );
  },
});
