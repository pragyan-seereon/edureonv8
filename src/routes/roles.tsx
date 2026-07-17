import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Shield, Plus, Users, Key, History, MoreHorizontal, Pencil, Trash2, Copy } from "lucide-react";
import { useState } from "react";
import { RoleWizard, MODULE_CATALOG } from "@/components/role-wizard";
import { useCustomRoles, customRolesApi, usePermOverrides, permOverridesApi, type CustomRole, type PermVal } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/roles")({
  head: () => ({ meta: [{ title: "Roles & Permissions — Edureon ERP" }] }),
  component: RolesPage,
});

const builtIn = ["Super Admin","Principal","Vice Principal","Academic Coord.","Teacher","Accountant","HR","Librarian","Warden","Parent","Student"];
const modules = ["Students","Employees","Classes","Timetable","Attendance","Exams","Assignments","Fees","Payroll","Transport","Hostel","Library","Comm","Reports","Settings"];

function basePerm(role: string, mod: string): PermVal {
  const adminRoles = ["Super Admin","Principal"];
  const teacherMods = ["Students","Attendance","Assignments","Exams","Classes","Timetable","Comm"];
  if (adminRoles.includes(role)) return "RW";
  if (role === "Vice Principal" && !["Payroll"].includes(mod)) return "RW";
  if (role === "Academic Coord." && ["Students","Classes","Timetable","Exams","Assignments","Attendance","Reports"].includes(mod)) return "RW";
  if (role === "Teacher" && teacherMods.includes(mod)) return mod === "Attendance" || mod === "Exams" || mod === "Assignments" ? "RW" : "R";
  if (role === "Accountant" && ["Fees","Payroll","Reports"].includes(mod)) return "RW";
  if (role === "HR" && ["Employees","Payroll"].includes(mod)) return "RW";
  if (role === "Librarian" && mod === "Library") return "RW";
  if (role === "Warden" && mod === "Hostel") return "RW";
  if (role === "Parent" && ["Students","Attendance","Fees","Exams","Comm"].includes(mod)) return "R";
  if (role === "Student" && ["Attendance","Assignments","Exams","Library","Comm"].includes(mod)) return "R";
  return "—";
}

const cycle = (v: PermVal): PermVal => (v === "—" ? "R" : v === "R" ? "RW" : "—");

function RolesPage() {
  const customRoles = useCustomRoles();
  const overrides = usePermOverrides();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [roleEdit, setRoleEdit] = useState<CustomRole | null>(null);
  const allRoles = [...builtIn, ...customRoles.map((r) => r.name)];

  const getPerm = (role: string, mod: string): PermVal => overrides[`${role}:${mod}`] ?? basePerm(role, mod);

  return (
    <PageContainer>
      <PageHeader eyebrow="System" title="Roles & Permissions"
        description="Granular RBAC across every module — click any matrix cell to override. Custom roles fully supported."
        actions={<Button size="sm" className="gradient-primary border-0" onClick={() => { setRoleEdit(null); setWizardOpen(true); }}><Plus className="h-4 w-4" />New Role</Button>}
      />

      <RoleWizard open={wizardOpen} onOpenChange={setWizardOpen} edit={roleEdit} />


      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Built-in Roles" value={builtIn.length.toString()} icon={<Shield className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Custom Roles" value={customRoles.length.toString()} icon={<Users className="h-5 w-5" />} tone="info" />
        <KpiCard label="Manual Overrides" value={Object.keys(overrides).length.toString()} icon={<Key className="h-5 w-5" />} tone="success" />
        <KpiCard label="Audit Events" value="24,180" icon={<History className="h-5 w-5" />} tone="warning" />
      </div>

      <Tabs defaultValue="matrix">
        <TabsList>
          <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
          <TabsTrigger value="custom">Custom Roles</TabsTrigger>
          <TabsTrigger value="users">User Assignments</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="mt-4">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Role × Module Matrix</CardTitle><CardDescription>Click any cell to toggle: — → R → RW → —. Overrides are highlighted.</CardDescription></CardHeader>
            <CardContent className="p-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10">Role</TableHead>
                    {modules.map(m => <TableHead key={m} className="text-center text-[11px]">{m}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allRoles.map(r => (
                    <TableRow key={r}>
                      <TableCell className="sticky left-0 bg-background font-medium z-10">{r}</TableCell>
                      {modules.map(m => {
                        const p = getPerm(r, m);
                        const isOverride = `${r}:${m}` in overrides;
                        return (
                          <TableCell key={m} className="text-center">
                            <button
                              type="button"
                              onClick={() => { permOverridesApi.set(r, m, cycle(p)); toast.success(`${r} · ${m} → ${cycle(p)}`); }}
                              className={`min-w-[34px] rounded px-1.5 py-0.5 text-[10px] font-semibold transition ${isOverride ? "ring-1 ring-primary" : ""} ${p === "RW" ? "bg-success/15 text-success" : p === "R" ? "bg-info/15 text-info" : "text-muted-foreground hover:bg-muted"}`}
                            >
                              {p}
                            </button>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Scope</TableHead><TableHead>Modules</TableHead><TableHead>Actions</TableHead><TableHead>Updated</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {customRoles.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">No custom roles yet. Click "New Role" to create one.</TableCell></TableRow>}
                  {customRoles.map((r) => {
                    const mods = Object.entries(r.perms ?? {}).filter(([, v]) => v.enabled);
                    const totalActions = mods.reduce((s, [, v]) => s + Object.values(v.tabs).reduce((a, b) => a + b.length, 0), 0);
                    return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        <div>{r.name}</div>
                        <div className="text-[11px] text-muted-foreground">{r.desc || r.level}</div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{r.scope}</Badge></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {mods.slice(0, 4).map(([k]) => {
                            const label = MODULE_CATALOG.find((m) => m.key === k)?.label ?? k;
                            return <Badge key={k} variant="outline" className="text-[10px]">{label}</Badge>;
                          })}
                          {mods.length > 4 && <Badge variant="outline" className="text-[10px]">+{mods.length - 4}</Badge>}
                          {mods.length === 0 && <span className="text-xs text-muted-foreground">No modules</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{totalActions} permissions</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setRoleEdit(r); setWizardOpen(true); }}><Pencil className="h-4 w-4" />Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { customRolesApi.add({ name: r.name + " (copy)", level: r.level, scope: r.scope, desc: r.desc, perms: r.perms }); toast.success("Role duplicated"); }}><Copy className="h-4 w-4" />Duplicate</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { customRolesApi.remove(r.id); toast.success("Role deleted"); }}><Trash2 className="h-4 w-4" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>

              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>2FA</TableHead><TableHead>Last Active</TableHead></TableRow></TableHeader>
                <TableBody>
                  {[
                    ["Rahul Mehra","rahul.m@dps.edu.in","Principal","Active",true,"Now"],
                    ["Anita Khanna","anita.k@dps.edu.in","Vice Principal","Active",true,"5m ago"],
                    ["Sandeep Bhatia","accounts@dps.edu.in","Accountant","Active",true,"22m ago"],
                    ["Pooja Iyer","p.iyer@dps.edu.in","Teacher","Active",false,"1h ago"],
                    ["Ravi Das","library@dps.edu.in","Librarian","Active",true,"3h ago"],
                    ["Manjeet Kaur","hr@dps.edu.in","HR","On Leave",true,"Yesterday"],
                  ].map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r[0]}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r[1]}</TableCell>
                      <TableCell><Badge variant="secondary">{r[2]}</Badge></TableCell>
                      <TableCell><Badge variant={r[3]==="Active"?"default":"outline"}>{r[3]}</Badge></TableCell>
                      <TableCell><Switch defaultChecked={r[4] as boolean} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r[5]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="p-0 divide-y">
              {[
                { who: "Rahul Mehra", what: "Updated role permissions for 'Teacher'", when: "12m ago", ip: "203.0.113.42" },
                { who: "Pooja Iyer", what: "Created assignment AS-204 in Class X-B", when: "1h ago", ip: "203.0.113.71" },
                { who: "Sandeep Bhatia", what: "Recorded fee payment TX10421 · ₹48,000", when: "2h ago", ip: "203.0.113.18" },
                { who: "Anita Khanna", what: "Published Term 2 exam schedule", when: "3h ago", ip: "203.0.113.21" },
                { who: "Manjeet Kaur", what: "Approved leave for EMP2018", when: "Yesterday", ip: "203.0.113.05" },
              ].map((e, i) => (
                <div key={i} className="p-4 flex items-center gap-3 hover:bg-muted/40">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">{e.who.split(" ").map(n=>n[0]).join("")}</div>
                  <div className="flex-1"><div className="text-sm"><span className="font-medium">{e.who}</span> · {e.what}</div><div className="text-xs text-muted-foreground font-mono">IP {e.ip}</div></div>
                  <div className="text-xs text-muted-foreground">{e.when}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
