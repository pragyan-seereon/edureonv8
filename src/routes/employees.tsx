import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Download, MoreHorizontal, Users, UserCheck, Briefcase, Pencil, Trash2, Eye, GraduationCap } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { useEmployees, employeesApi } from "@/lib/store";
import { useMemo, useState } from "react";
import { EmployeeDialog } from "@/components/employee-dialog";
import { ExcelUpload } from "@/components/excel-upload";
import { ExcelExport } from "@/components/excel-export";
import type { Employee } from "@/lib/mock";
import { toast } from "sonner";


export const Route = createFileRoute("/employees")({
  head: () => ({ meta: [{ title: "Employees — Edureon ERP" }] }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const employees = useEmployees();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string | null>(null);
  const [category, setCategory] = useState<"all" | "Academic" | "Non-Academic">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const academicRoles = ["Teacher", "Principal", "Vice Principal", "Academic Coordinator"];
  const resolveType = (e: Employee): "Academic" | "Non-Academic" =>
    e.type ?? (academicRoles.includes(e.role) ? "Academic" : "Non-Academic");

  const filtered = useMemo(
    () => employees.filter((e) =>
      (!q || e.name.toLowerCase().includes(q.toLowerCase()) || e.email.toLowerCase().includes(q.toLowerCase()))
      && (!dept || e.department === dept)
      && (category === "all" || resolveType(e) === category),
    ),
    [employees, q, dept, category],
  );

  const depts = Array.from(new Set(employees.map((e) => e.department)));
  const academicCount = employees.filter((e) => resolveType(e) === "Academic").length;
  const nonAcademicCount = employees.length - academicCount;


  return (
    <PageContainer>
      <PageHeader
        eyebrow="HR & Staff"
        title="Employee Management"
        description="Teaching and non-teaching staff, payroll, attendance, performance and roles."
        actions={
          <>
            <ExcelUpload
              label="Import Excel"
              templateHeaders={["name", "email", "phone", "role", "department", "type"]}
              templateName="employees-template.xlsx"
              onRows={(rows) => {
                let n = 0;
                rows.forEach((r) => {
                  if (!r.name) return;
                  employeesApi.add({
                    name: r.name,
                    email: r.email || "",
                    phone: r.phone || "",
                    role: r.role || "Teacher",
                    department: r.department || "Academics",
                    type: (r.type as Employee["type"]) || "Academic",
                    status: "Active",
                    joinDate: new Date().toISOString().slice(0, 10),
                    assignments: [],
                  });
                  n++;
                });
                if (n) toast.success(`${n} employees onboarded from Excel`);
              }}
            />
            <ExcelExport
              rows={filtered}
              fileName="employees.xlsx"
              sheetName="Employees"
              columns={[
                { header: "ID", accessor: (e) => e.id },
                { header: "Name", accessor: (e) => e.name },
                { header: "Email", accessor: (e) => e.email },
                { header: "Phone", accessor: (e) => e.phone },
                { header: "Role", accessor: (e) => e.role },
                { header: "Department", accessor: (e) => e.department },
                { header: "Category", accessor: (e) => resolveType(e) },
                { header: "Status", accessor: (e) => e.status },
                { header: "Joined", accessor: (e) => e.joinDate },
              ]}
            />
            <Button size="sm" className="gradient-primary border-0" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" />Onboard Employee
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Staff" value={employees.length.toString()} icon={<Users className="h-5 w-5" />} tone="primary" delta={1.1} />
        <KpiCard label="Academic Staff" value={academicCount.toString()} icon={<GraduationCap className="h-5 w-5" />} tone="info" />
        <KpiCard label="Non-Academic Staff" value={nonAcademicCount.toString()} icon={<Briefcase className="h-5 w-5" />} tone="warning" />
        <KpiCard label="On Duty Today" value={employees.filter((e) => e.status === "Active").length.toString()} icon={<UserCheck className="h-5 w-5" />} tone="success" delta={0.4} />
      </div>

      <Tabs value={category} onValueChange={(v) => setCategory(v as typeof category)} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All <span className="ml-1.5 text-[10px] opacity-70">({employees.length})</span></TabsTrigger>
          <TabsTrigger value="Academic">Academic <span className="ml-1.5 text-[10px] opacity-70">({academicCount})</span></TabsTrigger>
          <TabsTrigger value="Non-Academic">Non-Academic <span className="ml-1.5 text-[10px] opacity-70">({nonAcademicCount})</span></TabsTrigger>
        </TabsList>
      </Tabs>


      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="flex flex-wrap gap-2 p-4 border-b">
            <div className="relative flex-1 max-w-sm min-w-[200px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search staff…" className="pl-9 h-9" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">Department{dept ? ` · ${dept}` : ""}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setDept(null)}>All</DropdownMenuItem>
                <DropdownMenuSeparator />
                {depts.map((d) => <DropdownMenuItem key={d} onClick={() => setDept(d)}>{d}</DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead>Employee</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Assignments</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-10">No employees match your filters.</TableCell></TableRow>
                )}
                {filtered.map((e) => {
                  const empType = resolveType(e);
                  const assigns = e.assignments ?? [];
                  return (
                  <TableRow key={e.id} className="border-border/60 hover:bg-muted/40">
                    <TableCell>

                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-info/80 to-primary/80 flex items-center justify-center text-[11px] font-semibold text-primary-foreground">
                          {e.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{e.name}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">{e.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={empType === "Academic" ? "bg-info/10 text-info border-info/20" : "bg-muted text-muted-foreground"}>{empType}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{e.role}</TableCell>
                    <TableCell><Badge variant="secondary">{e.department}</Badge></TableCell>
                    <TableCell>
                      {empType === "Non-Academic" ? (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      ) : assigns.length === 0 ? (
                        <span className="text-[11px] text-muted-foreground italic">Not linked</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {assigns.slice(0, 3).map((a) => (
                            <Badge key={a.id} variant="outline" className="text-[10px] font-normal">
                              {a.class}-{a.section} · {a.subject}
                            </Badge>
                          ))}
                          {assigns.length > 3 && (
                            <Badge variant="outline" className="text-[10px] font-normal">+{assigns.length - 3} more</Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.phone}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.joinDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={e.status === "Active" ? "bg-success/10 text-success border-success/20" : "bg-warning/15 text-warning border-warning/30"}>{e.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(e); setDialogOpen(true); }}><Eye className="h-4 w-4" />View / Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditing(e); setDialogOpen(true); }}><Pencil className="h-4 w-4" />Edit details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { employeesApi.update(e.id, { status: e.status === "Active" ? "On Leave" : "Active" }); toast.success("Status updated"); }}>
                            Toggle status
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(ev) => ev.preventDefault()} className="text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4" />Offboard
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Offboard {e.name}?</AlertDialogTitle>
                                <AlertDialogDescription>Their access will be revoked. Past payroll and attendance records are preserved.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => { employeesApi.remove(e.id); toast.success(`${e.name} offboarded`); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Offboard</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  );
                })}

              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EmployeeDialog open={dialogOpen} onOpenChange={setDialogOpen} employee={editing} />
    </PageContainer>
  );
}
