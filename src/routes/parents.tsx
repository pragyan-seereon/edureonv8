import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Send, Phone, Mail, Search } from "lucide-react";
import { useStudents } from "@/lib/store";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { InviteDialog } from "@/components/invite-dialog";
import { DataMigrationBar } from "@/components/data-migration-bar";

export const Route = createFileRoute("/parents")({
  head: () => ({ meta: [{ title: "Parents — Edureon ERP" }] }),
  component: ParentsPage,
});

function ParentsPage() {
  const students = useStudents();
  const [q, setQ] = useState("");
  const parents = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; email: string; children: string[]; lastLogin: string }>();
    students.forEach((s, i) => {
      const key = s.parent;
      if (!map.has(key)) {
        map.set(key, {
          name: s.parent, phone: s.phone,
          email: s.parent.toLowerCase().replace(/\s+/g, ".") + "@parent.in",
          children: [], lastLogin: ["2h ago","Yesterday","3d ago","1w ago","Never"][i % 5],
        });
      }
      map.get(key)!.children.push(`${s.name} (${s.class}-${s.section})`);
    });
    return Array.from(map.values()).filter(p =>
      !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.children.some(c => c.toLowerCase().includes(q.toLowerCase()))
    );
  }, [students, q]);

  // Full (unfiltered) set for KPI accuracy — must match the underlying data.
  const allParents = useMemo(() => {
    const set = new Map<string, { active: boolean }>();
    students.forEach((s, i) => {
      if (!set.has(s.parent)) set.set(s.parent, { active: ["2h ago", "Yesterday", "3d ago", "1w ago", "Never"][i % 5] !== "Never" });
    });
    return Array.from(set.values());
  }, [students]);
  const totalParents = allParents.length;
  const activeParents = allParents.filter((p) => p.active).length;
  const noApp = totalParents - activeParents;

  return (
    <PageContainer>
      <PageHeader eyebrow="Academic" title="Parents Directory"
        description="Parent accounts, linked children, app activity, and direct contact."
        actions={<>
          <DataMigrationBar
            moduleName="Parents"
            rows={parents}
            columns={[
              { header: "Parent", accessor: (p) => p.name },
              { header: "Phone", accessor: (p) => p.phone },
              { header: "Email", accessor: (p) => p.email },
              { header: "Children", accessor: (p) => p.children.join("; ") },
              { header: "Last Login", accessor: (p) => p.lastLogin },
            ]}
          />
          <Button variant="outline" size="sm" onClick={() => toast.success("Bulk SMS queued · 4,820 parents")}><Send className="h-4 w-4" />Bulk Notify</Button>
          <InviteDialog
            title="Invite Parent"
            recipientLabel="Parent"
            trigger={<Button size="sm" className="gradient-primary border-0"><Plus className="h-4 w-4" />Invite Parent</Button>}
          />
        </>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Parents" value={String(totalParents)} icon={<Users className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Verified" value={`${totalParents ? Math.round((activeParents / totalParents) * 100) : 0}%`} icon={<Users className="h-5 w-5" />} tone="success" />
        <KpiCard label="Active (30d)" value={String(activeParents)} icon={<Users className="h-5 w-5" />} tone="info" />
        <KpiCard label="No App" value={String(noApp)} icon={<Users className="h-5 w-5" />} tone="warning" />
      </div>

      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="relative w-full md:w-80 mb-3">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search parents or children…" className="pl-8 h-9" />
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Parent</TableHead><TableHead>Contact</TableHead><TableHead>Children</TableHead><TableHead>Last Login</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {parents.slice(0, 24).map(p => (
                <TableRow key={p.name + p.phone}>
                  <TableCell>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.email}</div>
                  </TableCell>
                  <TableCell className="text-sm font-mono">{p.phone}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.children.map(c => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant={p.lastLogin === "Never" ? "destructive" : "outline"}>{p.lastLogin}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Phone className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Mail className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
