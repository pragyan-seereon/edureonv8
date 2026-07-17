import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users, GraduationCap, IndianRupee, TrendingUp, BookOpen, Bus, Building2,
  CalendarCheck, AlertCircle, Plus, Download,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { feeCollectionTrend, attendanceTrend, classDistribution, examPerformance } from "@/lib/mock";
import { useAuth } from "@/lib/auth";
import { SessionReadiness } from "@/components/session-readiness";
import { portalHomeForRole } from "@/lib/portal-nav";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Edureon ERP" }] }),
  component: Dashboard,
});

const inr = (n: number) => "₹" + (n >= 1e7 ? (n / 1e7).toFixed(2) + " Cr" : n >= 1e5 ? (n / 1e5).toFixed(2) + " L" : n.toLocaleString("en-IN"));

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!user) return;
    const target = portalHomeForRole(user.role);
    if (target !== "/") router.navigate({ to: target });
  }, [user, router]);
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Institute Admin"
        title="Welcome back, Rahul"
        description="Here's a real-time snapshot of Mothers Public School — Unit-1."
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" className="gradient-primary border-0"><Plus className="h-4 w-4" />Quick Action</Button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Active Students" value="2,840" delta={3.2} icon={<GraduationCap className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Staff Strength" value="186" delta={1.1} icon={<Users className="h-5 w-5" />} tone="info" />
        <KpiCard label="Fee Collected (MTD)" value={inr(5450000)} delta={8.4} icon={<IndianRupee className="h-5 w-5" />} tone="success" />
        <KpiCard label="Pending Dues" value={inr(530000)} delta={-4.7} icon={<AlertCircle className="h-5 w-5" />} tone="warning" />
      </div>

      {/* Session readiness */}
      <div className="mb-6">
        <SessionReadiness />
      </div>


      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="font-display text-base">Fee Collection Trend</CardTitle>
              <CardDescription>Collected vs pending — last 8 months</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">FY 2025-26</Badge>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={feeCollectionTrend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-5)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `${v / 100000}L`} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => inr(v)} />
                <Area type="monotone" dataKey="collected" stroke="var(--chart-2)" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="pending" stroke="var(--chart-5)" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Students by Class</CardTitle>
            <CardDescription>Grade-wise enrollment</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={classDistribution} dataKey="students" nameKey="class" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {classDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Attendance (this week)</CardTitle>
            <CardDescription>Students vs staff %</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[80, 100]} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="students" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="staff" stroke="var(--chart-3)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Exam Performance — Class X</CardTitle>
            <CardDescription>Average vs top score by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={examPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="subject" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="avg" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="top" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom: activity + quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: IndianRupee, tone: "bg-success/10 text-success", title: "Fee payment received — ₹48,000", desc: "Aarav Sharma · Class X-B · UPI", time: "2m ago" },
              { icon: GraduationCap, tone: "bg-primary/10 text-primary", title: "New admission approved", desc: "Diya Verma · Class VIII · ADM-2025-0152", time: "18m ago" },
              { icon: BookOpen, tone: "bg-info/10 text-info", title: "Term 2 exam schedule published", desc: "Classes IX–XII · Starting 12 Dec", time: "1h ago" },
              { icon: Bus, tone: "bg-warning/15 text-warning", title: "Route #7 delayed by 12 minutes", desc: "Driver: Sunil · 38 students notified", time: "2h ago" },
              { icon: CalendarCheck, tone: "bg-success/10 text-success", title: "Attendance closed for today", desc: "Present: 2,612 · Absent: 228", time: "3h ago" },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`h-9 w-9 rounded-md flex items-center justify-center ${a.tone}`}>
                  <a.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{a.desc}</div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">Capacity & Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Classroom utilization", value: 78, tone: "bg-primary" },
              { label: "Hostel occupancy", value: 64, tone: "bg-info" },
              { label: "Transport fleet usage", value: 89, tone: "bg-warning" },
              { label: "Library check-out rate", value: 42, tone: "bg-accent" },
              { label: "Storage used", value: 31, tone: "bg-success" },
            ].map((m) => (
              <div key={m.label} className="space-y-1.5">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">{m.label}</span><span className="font-semibold">{m.value}%</span></div>
                <Progress value={m.value} className="h-1.5" />
              </div>
            ))}
            <div className="pt-2 mt-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
              All systems operational
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
