import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Plus, Download, TrendingUp, Users, IndianRupee, GraduationCap, X, LineChart as LineIcon, PieChart as PieIcon, Table as TableIcon } from "lucide-react";
import { feeCollectionTrend, attendanceTrend, examPerformance, classDistribution } from "@/lib/mock";
import { useInstitutes } from "@/lib/store";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Edureon ERP" }] }),
  component: AnalyticsPage,
});

const COLORS = ["var(--chart-1)","var(--chart-2)","var(--chart-3)","var(--chart-4)","var(--chart-5)"];
const inr = (n: number) => "₹" + (n >= 1e7 ? (n / 1e7).toFixed(2) + " Cr" : n >= 1e5 ? (n / 1e5).toFixed(2) + " L" : n.toLocaleString("en-IN"));

type Widget = { id: string; type: "kpi" | "line" | "bar" | "pie" | "table"; label: string };
const WIDGET_LIBRARY: { type: Widget["type"]; label: string; icon: React.ReactNode }[] = [
  { type: "kpi", label: "KPI Card", icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { type: "line", label: "Line Chart", icon: <LineIcon className="h-3.5 w-3.5" /> },
  { type: "bar", label: "Bar Chart", icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { type: "pie", label: "Pie Chart", icon: <PieIcon className="h-3.5 w-3.5" /> },
  { type: "table", label: "Table", icon: <TableIcon className="h-3.5 w-3.5" /> },
];

// Seed per-institute variation. Hashing institute id → deterministic multiplier.
function seedFor(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return 0.7 + ((h % 60) / 100); // 0.7 – 1.3
}
function rangeMult(r: string) {
  return r === "7d" ? 0.08 : r === "30d" ? 0.32 : r === "90d" ? 1 : r === "ytd" ? 1.4 : 1.1;
}

function AnalyticsPage() {
  const institutes = useInstitutes();
  const [inst, setInst] = useState("all");
  const [range, setRange] = useState("90d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [widgets, setWidgets] = useState<Widget[]>([]);

  const mult = seedFor(inst) * rangeMult(range);

  // Derive filter-aware datasets
  const attendance = attendanceTrend.map((d) => ({
    ...d,
    students: Math.min(100, Math.round(d.students * (0.85 + (mult - 1) * 0.15))),
    staff: Math.min(100, Math.round(d.staff * (0.85 + (mult - 1) * 0.1))),
  }));
  const fees = feeCollectionTrend.map((d) => ({
    ...d,
    collected: Math.round(d.collected * mult),
    pending: Math.round(d.pending * (2 - mult)),
  }));
  const exams = examPerformance.map((d) => ({
    ...d,
    avg: Math.min(100, Math.round(d.avg * (0.9 + (mult - 1) * 0.2))),
    top: Math.min(100, Math.round((d.top ?? d.avg + 10) * (0.9 + (mult - 1) * 0.15))),
  }));
  const enroll = classDistribution.map((d) => ({
    ...d, students: Math.round(d.students * mult),
  }));

  // KPIs derived from mult
  const enrollYoY = (8 + mult * 5).toFixed(1);
  const revYoY = (12 + mult * 7).toFixed(1);
  const retention = (90 + mult * 5).toFixed(1);
  const nps = Math.round(45 + mult * 18);

  const addWidget = (type: Widget["type"], label: string) =>
    setWidgets((w) => [...w, { id: `${type}-${Date.now()}`, type, label }]);

  const removeWidget = (id: string) =>
    setWidgets((w) => w.filter((x) => x.id !== id));

  return (
    <PageContainer>
      <PageHeader eyebrow="Insights" title="Analytics & BI"
        description="Cross-module business intelligence — academic, financial and operational signals in one view."
        actions={<>
          <Button variant="outline" size="sm" onClick={() => toast.success("Export scheduled — emailed in 5 min")}><Download className="h-4 w-4" />Schedule Export</Button>
          <Button size="sm" className="gradient-primary border-0" onClick={() => toast.success("New report draft saved")}><Plus className="h-4 w-4" />New Report</Button>
        </>}
      />

      {/* Filter bar */}
      <Card className="border-border/60 mb-6">
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          <Select value={inst} onValueChange={setInst}>
            <SelectTrigger className="h-8 w-[220px]"><SelectValue placeholder="Institute" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All institutes</SelectItem>
              {institutes.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="h-8 w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          {range === "custom" && (
            <>
              <Input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="h-8 w-[150px]" />
              <span className="text-xs text-muted-foreground">to</span>
              <Input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="h-8 w-[150px]" />
            </>
          )}
          <Select defaultValue="all">
            <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {["VI","VII","VIII","IX","X","XI","XII"].map((c) => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={()=>{setInst("all");setRange("90d");setFrom("");setTo("");toast.success("Filters reset");}}>Reset</Button>
          <Badge variant="outline" className="ml-auto text-[10px]">{inst === "all" ? "All Institutes" : institutes.find((i)=>i.id===inst)?.name} · {range.toUpperCase()}</Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Enrollment YoY" value={`+${enrollYoY}%`} delta={+enrollYoY} icon={<GraduationCap className="h-5 w-5" />} tone="success" />
        <KpiCard label="Revenue YoY" value={`+${revYoY}%`} delta={+revYoY} icon={<IndianRupee className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Retention" value={`${retention}%`} delta={1.1} icon={<Users className="h-5 w-5" />} tone="info" />
        <KpiCard label="NPS (Net Promoter Score)" value={String(nps)} delta={4.0} icon={<TrendingUp className="h-5 w-5" />} tone="warning" />
      </div>

      <Tabs defaultValue="academic">
        <TabsList>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="ops">Operations</TabsTrigger>
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="academic" className="mt-4 grid lg:grid-cols-2 gap-4">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Weekly Attendance</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={attendance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" fontSize={11} /><YAxis domain={[80,100]} fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Line dataKey="students" stroke="var(--chart-1)" strokeWidth={2.5} />
                  <Line dataKey="staff" stroke="var(--chart-3)" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Exam Performance</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={exams}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="subject" fontSize={11} /><YAxis fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="avg" fill="var(--chart-1)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 border-border/60">
            <CardHeader><CardTitle className="text-base">Enrollment by Class</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={enroll}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="class" fontSize={11} /><YAxis fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="students" fill="var(--chart-2)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="mt-4 grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-border/60">
            <CardHeader><CardTitle className="text-base">Fee Collection vs Pending</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={fees}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" fontSize={11} /><YAxis fontSize={11} tickFormatter={(v)=>`${v/100000}L`} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => inr(v)} />
                  <Area dataKey="collected" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.3} />
                  <Area dataKey="pending" stroke="var(--chart-5)" fill="var(--chart-5)" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Expense Split</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={[
                    { name: "Payroll", v: 56 },{ name: "Infrastructure", v: 14 },{ name: "Transport", v: 10 },
                    { name: "Utilities", v: 8 },{ name: "Other", v: 12 },
                  ]} dataKey="v" innerRadius={50} outerRadius={90}>
                    {COLORS.map((c,i)=><Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ops" className="mt-4 grid md:grid-cols-3 gap-4">
          {[
            { m: "Classroom Utilization", v: "78%" },
            { m: "Hostel Occupancy", v: "86%" },
            { m: "Transport Load", v: "89%" },
            { m: "Library Borrows / day", v: "182" },
            { m: "Avg Response Time (Comm)", v: "2.4m" },
            { m: "Incidents (open)", v: "3" },
          ].map(x => (
            <Card key={x.m} className="border-border/60">
              <CardContent className="p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{x.m}</div>
                <div className="text-2xl font-display font-semibold mt-1">{x.v}</div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="builder" className="mt-4">
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle className="text-base">Custom Report Builder</CardTitle><CardDescription>Click a widget on the left to add it to your dashboard</CardDescription></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setWidgets([]); toast.success("Canvas cleared"); }}>Clear</Button>
                  <Button size="sm" className="gradient-primary border-0" onClick={() => toast.success(`Report saved · ${widgets.length} widget${widgets.length===1?"":"s"}`)}>Save Report</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-3">
                <div className="md:col-span-1 space-y-2 p-3 rounded-lg border border-dashed border-border bg-muted/30">
                  <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Widgets</div>
                  {WIDGET_LIBRARY.map((w) => (
                    <button key={w.type} onClick={() => addWidget(w.type, w.label)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-background border text-xs cursor-pointer hover:border-primary hover:bg-primary/5 transition">
                      {w.icon}{w.label}
                      <Plus className="h-3 w-3 ml-auto opacity-50" />
                    </button>
                  ))}
                </div>
                <div className="md:col-span-3 min-h-72 rounded-lg border-2 border-dashed border-border p-3">
                  {widgets.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground py-12">
                      <div className="text-center">
                        <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        Click a widget to add it to your dashboard
                      </div>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {widgets.map((w) => (
                        <BuilderWidget key={w.id} w={w} onRemove={() => removeWidget(w.id)} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function BuilderWidget({ w, onRemove }: { w: Widget; onRemove: () => void }) {
  return (
    <div className="border rounded-md p-3 bg-background relative group">
      <button onClick={onRemove} className="absolute top-2 right-2 h-6 w-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition">
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{w.label}</div>
      {w.type === "kpi" && (
        <div>
          <div className="text-2xl font-display font-semibold">94.6%</div>
          <div className="text-xs text-success">+2.1% vs last period</div>
        </div>
      )}
      {w.type === "line" && (
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={attendanceTrend}>
            <Line dataKey="students" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
            <XAxis dataKey="day" fontSize={9} /><YAxis domain={[80,100]} fontSize={9} hide />
          </LineChart>
        </ResponsiveContainer>
      )}
      {w.type === "bar" && (
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={examPerformance.slice(0,5)}>
            <Bar dataKey="avg" fill="var(--chart-2)" radius={[3,3,0,0]} />
            <XAxis dataKey="subject" fontSize={9} /><YAxis fontSize={9} hide />
          </BarChart>
        </ResponsiveContainer>
      )}
      {w.type === "pie" && (
        <ResponsiveContainer width="100%" height={120}>
          <PieChart>
            <Pie data={[{n:"A",v:40},{n:"B",v:30},{n:"C",v:30}]} dataKey="v" innerRadius={25} outerRadius={50}>
              {COLORS.slice(0,3).map((c,i)=><Cell key={i} fill={c} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      )}
      {w.type === "table" && (
        <table className="w-full text-xs">
          <thead><tr className="text-muted-foreground"><th className="text-left font-normal py-1">Class</th><th className="text-right font-normal">Students</th></tr></thead>
          <tbody>{classDistribution.slice(0,4).map((c)=>(
            <tr key={c.class} className="border-t"><td className="py-1">{c.class}</td><td className="text-right tabular-nums">{c.students}</td></tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}
