import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Building2, Plus, Users, IndianRupee, TrendingUp, Sparkles } from "lucide-react";
import { useInstitutes } from "@/lib/store";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";


export const Route = createFileRoute("/super/institutes/")({
  head: () => ({ meta: [{ title: "Institutes — Super Admin" }] }),
  component: SuperInstitutesPage,
});

const inr = (n: number) => "₹" + (n >= 1e7 ? (n / 1e7).toFixed(2) + " Cr" : n >= 1e5 ? (n / 1e5).toFixed(2) + " L" : n.toLocaleString("en-IN"));
const mrrTrend = [
  { m: "Apr", v: 320000 },{ m: "May", v: 358000 },{ m: "Jun", v: 384000 },{ m: "Jul", v: 412000 },
  { m: "Aug", v: 442000 },{ m: "Sep", v: 470000 },{ m: "Oct", v: 498000 },{ m: "Nov", v: 519000 },
];

function SuperInstitutesPage() {
  const institutes = useInstitutes();
  const navigate = useNavigate();
  const mrr = institutes.reduce((s, i) => s + i.mrr, 0);
  return (
    <PageContainer>
      <PageHeader eyebrow="Super Admin" title="Tenant Institutes"
        description="Multi-tenant SaaS overview — onboard, manage and monitor every institute."
        actions={<Button size="sm" className="gradient-primary border-0" asChild><Link to="/super/institutes/new"><Plus className="h-4 w-4" />Onboard Institute</Link></Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Institutes" value={String(institutes.length)} icon={<Building2 className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Active Students" value={institutes.reduce((s,i)=>s+i.students,0).toLocaleString("en-IN")} icon={<Users className="h-5 w-5" />} tone="info" />
        <KpiCard label="MRR" value={inr(mrr)} delta={6.4} icon={<IndianRupee className="h-5 w-5" />} tone="success" />
        <KpiCard label="Trials" value={String(institutes.filter(i => i.status === "Trial").length)} icon={<Sparkles className="h-5 w-5" />} tone="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader><CardTitle className="text-base">MRR Growth</CardTitle><CardDescription>Last 8 months</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={mrrTrend}>
                <defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} /><stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="m" fontSize={11} /><YAxis fontSize={11} tickFormatter={(v)=>`${v/100000}L`} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v:number)=>inr(v)} />
                <Area dataKey="v" stroke="var(--chart-2)" strokeWidth={2} fill="url(#mg)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-base">Plan Mix</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {["Enterprise","Business","Growth"].map(p => {
              const c = institutes.filter(i => i.plan === p).length;
              const pct = Math.round((c / institutes.length) * 100);
              return (
                <div key={p}>
                  <div className="flex justify-between text-xs mb-1"><span>{p}</span><span className="font-semibold">{c} · {pct}%</span></div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
            <div className="pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="h-3.5 w-3.5 text-success" />2 enterprise upgrades this month</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Institutes</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="usage">Usage Metering</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="p-0">
              <div className="p-3 border-b"><Input placeholder="Search institutes…" className="h-8 max-w-sm" /></div>
              <Table>
                <TableHeader><TableRow><TableHead>Institute</TableHead><TableHead>City</TableHead><TableHead>Students</TableHead><TableHead>Plan</TableHead><TableHead>MRR</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {institutes.map(i => (
                    <TableRow key={i.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate({ to: "/super/institutes/$id", params: { id: i.id } })}>
                      <TableCell><div className="font-medium">{i.name}</div><div className="text-[10px] font-mono text-muted-foreground">{i.id}</div></TableCell>
                      <TableCell className="text-sm">{i.city}</TableCell>
                      <TableCell className="tabular-nums">{i.students.toLocaleString("en-IN")}</TableCell>
                      <TableCell><Badge variant={i.plan==="Enterprise"?"default":i.plan==="Business"?"secondary":"outline"}>{i.plan}</Badge></TableCell>
                      <TableCell className="tabular-nums">{i.mrr ? inr(i.mrr) : "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant={i.status==="Active"?"default":i.status==="Trial"?"secondary":"destructive"}>{i.status}</Badge>
                          <Link to="/super/institutes/$id" params={{ id: i.id }} onClick={(e) => e.stopPropagation()} className="text-xs text-primary hover:underline">View →</Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="mt-4">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Onboarding Wizard · 5 steps</CardTitle><CardDescription>Standard checklist applied to every new tenant</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {[
                "Tenant created · subdomain provisioned","Admin user invited + 2FA enrolled",
                "Branding configured (logo, colors, domain)","Academic year + classes seeded",
                "Payment gateway + SMS provider connected"
              ].map((s, i) => (
                <div key={s} className="flex items-center gap-3 p-2.5 rounded-md border border-border/60">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? "bg-success text-white" : "bg-muted text-muted-foreground"}`}>{i+1}</div>
                  <div className="flex-1 text-sm">{s}</div>
                  <Badge variant={i < 3 ? "secondary" : "outline"}>{i < 3 ? "Done" : "Pending"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Institute</TableHead><TableHead>Storage</TableHead><TableHead>API Calls (24h)</TableHead><TableHead>SMS (MTD)</TableHead><TableHead>Active Users</TableHead></TableRow></TableHeader>
                <TableBody>
                  {institutes.map((i, idx) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell className="tabular-nums">{(2 + idx * 1.4).toFixed(1)} GB / 50 GB</TableCell>
                      <TableCell className="tabular-nums">{(12000 + idx * 4200).toLocaleString()}</TableCell>
                      <TableCell className="tabular-nums">{(1200 + idx * 380).toLocaleString()}</TableCell>
                      <TableCell className="tabular-nums">{Math.round(i.students * 0.6).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
