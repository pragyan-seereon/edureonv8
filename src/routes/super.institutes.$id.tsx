import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Building2, Users, GraduationCap, IndianRupee, ChevronLeft, FileCheck2,
  Phone, Mail, Globe, MapPin, UserCog, ShieldCheck, Sparkles, ExternalLink,
} from "lucide-react";
import { useInstitutes, useAppUsers, useStudents, useEmployees } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { feeCollectionTrend, attendanceTrend, classDistribution } from "@/lib/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/super/institutes/$id")({
  head: () => ({ meta: [{ title: "Institute Details — Super Admin" }] }),
  component: InstituteDetailPage,
});

const inr = (n: number) => "₹" + (n >= 1e7 ? (n / 1e7).toFixed(2) + " Cr" : n >= 1e5 ? (n / 1e5).toFixed(2) + " L" : n.toLocaleString("en-IN"));

function InstituteDetailPage() {
  const { id } = Route.useParams();
  const institutes = useInstitutes();
  const users = useAppUsers();
  const students = useStudents();
  const employees = useEmployees();
  const navigate = useNavigate();
  const auth = useAuth();
  const inst = institutes.find((x) => x.id === id);

  if (!inst) {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto text-center py-20">
          <Building2 className="h-12 w-12 mx-auto opacity-30 mb-4" />
          <h2 className="text-lg font-semibold">Institute not found</h2>
          <p className="text-sm text-muted-foreground mb-4">It may have been removed.</p>
          <Button asChild><Link to="/super/institutes">Back to institutes</Link></Button>
        </div>
      </PageContainer>
    );
  }

  const linkedUsers = users.filter((u) => u.instituteId === inst.id);

  const openSchool = () => {
    auth.startImpersonation({ id: inst.id, name: inst.name });
    toast.success(`Switched to ${inst.name}`, { description: "Use the School Switcher in the top bar to go back to All Schools." });
    setTimeout(() => navigate({ to: "/" }), 300);
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<Link to="/super/institutes" className="inline-flex items-center gap-1 hover:text-primary"><ChevronLeft className="h-3 w-3" />All Institutes</Link>}
        title={inst.name}
        description={`${inst.type ?? "Senior Secondary"} · ${inst.board ?? "CBSE"} · ${inst.city}`}
        actions={
          <>
            <Badge variant={inst.status==="Active"?"default":inst.status==="Trial"?"secondary":"destructive"}>{inst.status}</Badge>
            <Button variant="outline" size="sm" onClick={openSchool}><ExternalLink className="h-4 w-4" />Open School Dashboard</Button>
            <Button size="sm" className="gradient-primary border-0" onClick={() => navigate({ to: "/super/users" })}>
              <UserCog className="h-4 w-4" />Manage Users
            </Button>
          </>
        }
      />


      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Students" value={students.length.toLocaleString("en-IN")} icon={<GraduationCap className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Employees" value={employees.length.toLocaleString("en-IN")} icon={<Users className="h-5 w-5" />} tone="info" />
        <KpiCard label="MRR" value={inst.mrr ? inr(inst.mrr) : "—"} icon={<IndianRupee className="h-5 w-5" />} tone="success" />
        <KpiCard label="Plan" value={inst.plan} icon={<Sparkles className="h-5 w-5" />} tone="warning" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile & Compliance</TabsTrigger>
          <TabsTrigger value="users">Users ({linkedUsers.length})</TabsTrigger>
          <TabsTrigger value="docs">Documents</TabsTrigger>
          <TabsTrigger value="dashboard">Admin Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid lg:grid-cols-3 gap-4">
          <Card className="border-border/60 lg:col-span-1">
            <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row icon={<MapPin className="h-3.5 w-3.5" />} v={[inst.address, inst.city, inst.state, inst.pin].filter(Boolean).join(", ") || "—"} />
              <Row icon={<Phone className="h-3.5 w-3.5" />} v={inst.phone || "—"} />
              <Row icon={<Mail className="h-3.5 w-3.5" />} v={inst.email || "—"} />
              <Row icon={<Globe className="h-3.5 w-3.5" />} v={inst.website || "—"} />
            </CardContent>
          </Card>
          <Card className="border-border/60 lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Key People</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <PersonCard role="Principal" name={inst.principalName} phone={inst.principalPhone} />
              <PersonCard role="Admin Contact" name={inst.adminName} phone={inst.adminPhone} />
            </CardContent>
          </Card>
          <Card className="border-border/60 lg:col-span-3">
            <CardHeader><CardTitle className="text-base">Tenant Health Snapshot</CardTitle><CardDescription>Last 8 months — fees collected</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={feeCollectionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" fontSize={11} /><YAxis fontSize={11} tickFormatter={(v)=>`${v/100000}L`} />
                  <Tooltip contentStyle={{ background:"var(--popover)", border:"1px solid var(--border)", borderRadius:8, fontSize:12 }} formatter={(v: number) => inr(v)} />
                  <Area dataKey="collected" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="mt-4 grid md:grid-cols-2 gap-4">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Basic & Registration</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <KV k="Institute ID" v={inst.id} mono />
              <KV k="Type" v={inst.type ?? "—"} />
              <KV k="Board" v={inst.board ?? "—"} />
              <KV k="Academic Year" v={inst.academicYear ?? "—"} />
              <KV k="Brand Color" v={inst.primaryColor ?? "—"} />
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Legal & Financial</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <KV k="GST" v={inst.gst || "—"} mono />
              <KV k="PAN" v={inst.pan || "—"} mono />
              <KV k="Plan" v={inst.plan} />
              <KV k="MRR" v={inst.mrr ? inr(inst.mrr) : "—"} />
              <KV k="Status" v={inst.status} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle className="text-base">Linked Users</CardTitle><CardDescription>Users with access to this institute</CardDescription></div>
              <Button size="sm" className="gradient-primary border-0" asChild><Link to="/super/users">Create user</Link></Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>User ID</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {linkedUsers.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">No users linked yet · <Link to="/super/users" className="text-primary hover:underline">Create one</Link></TableCell></TableRow>
                  ) : linkedUsers.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="font-mono text-xs">{u.userId}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{u.role.replace("_"," ")}</Badge></TableCell>
                      <TableCell><Badge variant={u.status==="Active"?"default":"destructive"}>{u.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Uploaded Compliance Documents</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              {(inst.documents && inst.documents.length > 0 ? inst.documents : ["Registration Certificate","PAN Card","GST Certificate","Affiliation Certificate"]).map((d) => (
                <div key={d} className="flex items-center justify-between border rounded-md p-3">
                  <div className="text-sm font-medium">{d}</div>
                  <Badge className="bg-success/15 text-success border-success/20"><FileCheck2 className="h-3 w-3" />Verified</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4 grid lg:grid-cols-2 gap-4">
          <div className="lg:col-span-2 p-3 rounded-md border border-dashed text-xs text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-info" />
            Viewing <span className="font-semibold text-foreground">{inst.name}</span> as an Admin would. All actions are read-only in Super Admin view.
          </div>
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Attendance — This Week</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} domain={[80,100]} />
                  <Tooltip contentStyle={{ background:"var(--popover)", border:"1px solid var(--border)", borderRadius:8, fontSize:12 }} />
                  <Bar dataKey="students" fill="var(--chart-1)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Enrollment by Class</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={classDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="class" fontSize={11} /><YAxis fontSize={11} />
                  <Tooltip contentStyle={{ background:"var(--popover)", border:"1px solid var(--border)", borderRadius:8, fontSize:12 }} />
                  <Bar dataKey="students" fill="var(--chart-2)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function Row({ icon, v }: { icon: React.ReactNode; v: string }) {
  return <div className="flex items-start gap-2"><span className="text-muted-foreground mt-0.5">{icon}</span><span className="flex-1">{v}</span></div>;
}
function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return <div className="flex justify-between border-b border-dashed py-1.5"><span className="text-muted-foreground text-xs">{k}</span><span className={`text-xs font-medium ${mono ? "font-mono" : ""}`}>{v}</span></div>;
}
function PersonCard({ role, name, phone }: { role: string; name?: string; phone?: string }) {
  return (
    <div className="p-3 border rounded-md">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{role}</div>
      <div className="font-medium text-sm mt-0.5">{name || "—"}</div>
      <div className="text-xs text-muted-foreground">{phone || "—"}</div>
    </div>
  );
}
