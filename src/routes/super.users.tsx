import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, UserCog, ShieldCheck, Building2, Shield, Trash2, Pencil, MoreHorizontal, Copy,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  useAppUsers, useInstitutes, appUsersApi, type AppUser,
  useTempAccess, tempAccessApi,
  useCustomRoles, customRolesApi, type CustomRole, type PermAction,
  type UserAssignment, instituteIdsForUser,
} from "@/lib/store";
import { roleLabel, type UserRole } from "@/lib/auth";
import { useAuth } from "@/lib/auth";
import { RoleWizard, MODULE_CATALOG } from "@/components/role-wizard";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/super/users")({
  head: () => ({ meta: [{ title: "Users & Roles — Super Admin" }] }),
  component: SuperUsersPage,
});

const ASSIGNABLE_ROLES: UserRole[] = ["super_admin", "admin", "principal", "accountant", "hr", "teacher", "student", "parent"];
const ALL_ACTIONS: PermAction[] = ["view", "create", "update", "delete", "export", "approve"];

function SuperUsersPage() {
  const users = useAppUsers();
  const institutes = useInstitutes();
  const customRoles = useCustomRoles();
  const multiInstitute = users.filter((u) => instituteIdsForUser(u).length > 1).length;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Super Admin · Identity & Access"
        title="Users & Roles"
        description="A single global RBAC control plane — provision users, define roles & permissions, map users to roles across institutes, and grant temporary access. Institute admins reuse the same system, scoped to their own institute."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Users" value={String(users.length)} icon={<UserCog className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Custom Roles" value={String(customRoles.length)} icon={<Shield className="h-5 w-5" />} tone="info" />
        <KpiCard label="Multi-institute Users" value={String(multiInstitute)} icon={<ShieldCheck className="h-5 w-5" />} tone="success" />
        <KpiCard label="Institutes Covered" value={String(new Set(users.flatMap((u) => instituteIdsForUser(u))).size)} icon={<Building2 className="h-5 w-5" />} tone="warning" />
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles &amp; Permissions</TabsTrigger>
          <TabsTrigger value="temp">Temporary Access</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4"><UsersTab institutes={institutes} /></TabsContent>
        <TabsContent value="roles" className="mt-4"><RolesTab /></TabsContent>
        <TabsContent value="temp" className="mt-4"><TempAccessTab /></TabsContent>
      </Tabs>
    </PageContainer>
  );
}

/* ------------------------------- Users tab ------------------------------- */
function UsersTab({ institutes }: { institutes: ReturnType<typeof useInstitutes> }) {
  const users = useAppUsers();
  const customRoles = useCustomRoles();
  const { user: current } = useAuth();
  const [q, setQ] = useState("");
  const [filterInst, setFilterInst] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [open, setOpen] = useState(false);

  // Institute admins (non–super admin) can only manage their own institute.
  const lockedInstituteId = current && current.role !== "super_admin" ? current.activeInstituteId : undefined;

  const asg = (u: AppUser): UserAssignment[] =>
    u.assignments && u.assignments.length > 0 ? u.assignments : [{ instituteId: u.instituteId, role: u.role }];

  const filtered = users.filter((u) => {
    const rows = asg(u);
    return (
      (!lockedInstituteId || rows.some((r) => r.instituteId === lockedInstituteId)) &&
      (filterInst === "all" || rows.some((r) => r.instituteId === filterInst)) &&
      (filterRole === "all" || rows.some((r) => r.role === filterRole)) &&
      (q === "" || u.name.toLowerCase().includes(q.toLowerCase()) || u.userId.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))
    );
  });
  const instMap = Object.fromEntries(institutes.map((i) => [i.id, i.name]));
  const roleName = (a: UserAssignment) =>
    a.customRoleId ? customRoles.find((c) => c.id === a.customRoleId)?.name ?? a.role : roleLabel[a.role as UserRole] ?? a.role.replace("_", " ");

  return (
    <Card className="border-border/60">
      <div className="p-3 border-b flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Search</Label>
          <Input placeholder="Name, user ID or email…" className="h-8 w-64" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Institute</Label>
          <Select value={filterInst} onValueChange={setFilterInst}>
            <SelectTrigger className="h-8 w-[200px]"><SelectValue placeholder="Institute" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All institutes</SelectItem>
              {institutes.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Role</Label>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="h-8 w-[160px]"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {ASSIGNABLE_ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{roleLabel[r]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary border-0"><Plus className="h-4 w-4" />Create User</Button>
            </DialogTrigger>
            <CreateUserDialog onDone={() => setOpen(false)} institutes={institutes} lockedInstituteId={lockedInstituteId} />
          </Dialog>
        </div>
      </div>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>User ID</TableHead><TableHead>Email</TableHead><TableHead>Roles &amp; Institutes</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-sm text-muted-foreground">
                No users match your filters. Try clearing them or create a new user.
              </TableCell></TableRow>
            ) : filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}<div className="text-[10px] font-mono text-muted-foreground">{u.id}</div></TableCell>
                <TableCell className="font-mono text-xs">{u.userId}</TableCell>
                <TableCell className="text-sm">{u.email}</TableCell>
                <TableCell className="text-sm">
                  <div className="flex flex-col gap-1">
                    {asg(u)
                      .filter((a) => !lockedInstituteId || a.instituteId === lockedInstituteId)
                      .map((a, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="capitalize text-[10px]">{roleName(a)}</Badge>
                          <span className="text-muted-foreground text-[10px]">@</span>
                          <span className="text-xs">{instMap[a.instituteId] ?? a.instituteId}</span>
                        </div>
                      ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={u.status === "Active" ? "default" : "destructive"}>{u.status}</Badge>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
                      appUsersApi.update(u.id, { status: u.status === "Active" ? "Suspended" : "Active" });
                      toast.success(`User ${u.status === "Active" ? "suspended" : "activated"}`);
                    }}>{u.status === "Active" ? "Suspend" : "Activate"}</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ---------------------------- Roles & Perms tab ---------------------------- */
function RolesTab() {
  const customRoles = useCustomRoles();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [roleEdit, setRoleEdit] = useState<CustomRole | null>(null);

  return (
    <div className="space-y-4">
      <RoleWizard open={wizardOpen} onOpenChange={setWizardOpen} edit={roleEdit} />
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Global Roles &amp; Permissions</CardTitle>
            <CardDescription>Define a role, pick modules → sub-modules → tabs, and the actions (View, Create, Edit, Delete…) allowed on each. These roles apply everywhere and can be assigned to any user in any institute.</CardDescription>
          </div>
          <Button size="sm" className="gradient-primary border-0" onClick={() => { setRoleEdit(null); setWizardOpen(true); }}>
            <Plus className="h-4 w-4" />New Role
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Role</TableHead><TableHead>Scope</TableHead><TableHead>Modules</TableHead><TableHead>Permissions</TableHead><TableHead>Updated</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
            <TableBody>
              {customRoles.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-12">
                  No custom roles yet. Click “New Role” to define your first role with granular module, tab &amp; action permissions.
                </TableCell></TableRow>
              )}
              {customRoles.map((r) => {
                const mods = Object.entries(r.perms ?? {}).filter(([, v]) => v.enabled);
                const totalActions = mods.reduce((s, [, v]) => s + Object.values(v.tabs).reduce((a, b) => a + b.length, 0), 0);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}<div className="text-[11px] text-muted-foreground">{r.desc || r.level}</div></TableCell>
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
    </div>
  );
}

/* --------------------------- Temporary access tab --------------------------- */
function TempAccessTab() {
  const users = useAppUsers();
  const institutes = useInstitutes();
  const grants = useTempAccess();
  const [open, setOpen] = useState(false);

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const instMap = Object.fromEntries(institutes.map((i) => [i.id, i.name]));

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base">Temporary Access Grants</CardTitle>
          <CardDescription>Grant a user time-boxed access to a specific module, sub-module or tab with chosen actions. Access is automatically flagged expired past the end date.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary border-0"><Plus className="h-4 w-4" />Grant Access</Button>
          </DialogTrigger>
          <TempAccessDialog onDone={() => setOpen(false)} users={users} institutes={institutes} />
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Institute</TableHead><TableHead>Module / Tab</TableHead><TableHead>Actions</TableHead><TableHead>Expires</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
          <TableBody>
            {grants.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                No temporary grants. Use “Grant Access” to give someone short-term access to a specific area.
              </TableCell></TableRow>
            ) : grants.map((g) => {
              const mod = MODULE_CATALOG.find((m) => m.key === g.moduleKey);
              const tab = g.tabKey ? mod?.tabs.find((t) => t.key === g.tabKey)?.label : null;
              const expired = tempAccessApi.isExpired(g);
              return (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{userMap[g.userId]?.name ?? g.userId}</TableCell>
                  <TableCell className="text-sm">{instMap[g.instituteId] ?? g.instituteId}</TableCell>
                  <TableCell className="text-sm">{mod?.label ?? g.moduleKey}{tab ? <span className="text-muted-foreground"> · {tab}</span> : <span className="text-muted-foreground"> · whole module</span>}</TableCell>
                  <TableCell><div className="flex flex-wrap gap-1">{g.actions.map((a) => <Badge key={a} variant="outline" className="capitalize text-[10px]">{a}</Badge>)}</div></TableCell>
                  <TableCell><Badge variant={expired ? "destructive" : "secondary"}>{expired ? "Expired" : new Date(g.expiresAt).toLocaleDateString()}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { tempAccessApi.remove(g.id); toast.success("Grant revoked"); }}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TempAccessDialog({
  onDone, users, institutes,
}: {
  onDone: () => void;
  users: AppUser[];
  institutes: ReturnType<typeof useInstitutes>;
}) {
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [instituteId, setInstituteId] = useState(institutes[0]?.id ?? "");
  const [moduleKey, setModuleKey] = useState(MODULE_CATALOG[0].key);
  const [tabKey, setTabKey] = useState<string>("__all");
  const [actions, setActions] = useState<PermAction[]>(["view"]);
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");

  const mod = MODULE_CATALOG.find((m) => m.key === moduleKey)!;
  const toggleAct = (a: PermAction) => setActions((xs) => (xs.includes(a) ? xs.filter((x) => x !== a) : [...xs, a]));

  const submit = () => {
    if (!userId || !instituteId) return toast.error("Select a user and institute");
    if (!expiresAt) return toast.error("Set an expiry date");
    if (actions.length === 0) return toast.error("Pick at least one action");
    tempAccessApi.add({
      userId, instituteId, moduleKey,
      tabKey: tabKey === "__all" ? undefined : tabKey,
      actions: Array.from(new Set<PermAction>(["view", ...actions])),
      reason: reason.trim() || undefined,
      expiresAt: new Date(expiresAt).toISOString(),
    });
    toast.success("Temporary access granted");
    onDone();
  };

  return (
    <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-display">Grant temporary access</DialogTitle>
        <DialogDescription>Time-boxed access to a module, sub-module or tab for a single user.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">User *</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger><SelectValue placeholder="User" /></SelectTrigger>
            <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Institute *</Label>
          <Select value={instituteId} onValueChange={setInstituteId}>
            <SelectTrigger><SelectValue placeholder="Institute" /></SelectTrigger>
            <SelectContent>{institutes.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Module *</Label>
          <Select value={moduleKey} onValueChange={(v) => { setModuleKey(v); setTabKey("__all"); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{MODULE_CATALOG.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Sub-module / Tab</Label>
          <Select value={tabKey} onValueChange={setTabKey}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Whole module</SelectItem>
              {mod.tabs.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs font-medium">Permissions *</Label>
          <div className="grid grid-cols-3 gap-2 rounded-md border border-border/60 p-3 bg-muted/20">
            {ALL_ACTIONS.map((a) => (
              <label key={a} className="flex items-center gap-2 text-xs cursor-pointer capitalize">
                <Checkbox checked={actions.includes(a)} disabled={a === "view"} onCheckedChange={() => toggleAct(a)} />
                {a}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Expires on *</Label>
          <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Reason</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. exam duty cover" />
        </div>
      </div>
      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={onDone}>Cancel</Button>
        <Button className="gradient-primary border-0" onClick={submit}>Grant access</Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ----------------------------- Create user ----------------------------- */
function CreateUserDialog({
  onDone, institutes, lockedInstituteId,
}: {
  onDone: () => void;
  institutes: ReturnType<typeof useInstitutes>;
  lockedInstituteId?: string;
}) {
  const customRoles = useCustomRoles();
  const [form, setForm] = useState({ name: "", userId: "", password: "", email: "", phone: "" });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const defaultInst = lockedInstituteId ?? institutes[0]?.id ?? "";
  const [rows, setRows] = useState<UserAssignment[]>([{ instituteId: defaultInst, role: "admin" }]);

  const setRow = (i: number, patch: Partial<UserAssignment>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, { instituteId: defaultInst, role: "teacher" }]);
  const removeRow = (i: number) => setRows((rs) => (rs.length === 1 ? rs : rs.filter((_, idx) => idx !== i)));

  const onRoleChange = (i: number, v: string) => {
    if (v.startsWith("custom:")) {
      const id = v.slice(7);
      setRow(i, { role: customRoles.find((c) => c.id === id)?.name ?? "custom", customRoleId: id });
    } else {
      setRow(i, { role: v, customRoleId: undefined });
    }
  };

  const submit = () => {
    if (!form.name.trim() || !form.userId.trim() || !form.password.trim() || !form.email.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (rows.some((r) => !r.instituteId || !r.role)) { toast.error("Every role row needs a role and an institute"); return; }
    const assignments = rows.map((r) => ({ ...r, instituteId: lockedInstituteId ?? r.instituteId }));
    const primary = assignments[0];
    appUsersApi.add({
      name: form.name.trim(), userId: form.userId.trim(), email: form.email.trim(),
      phone: form.phone.trim(),
      role: primary.role as UserRole,
      roles: Array.from(new Set(assignments.map((a) => a.role as UserRole))),
      instituteId: primary.instituteId,
      assignments,
      status: "Active",
      password: form.password,
    } as Omit<AppUser, "id" | "createdAt">);
    const instCount = new Set(assignments.map((a) => a.instituteId)).size;
    toast.success(`${form.name} created`, { description: `${assignments.length} role${assignments.length > 1 ? "s" : ""} across ${instCount} institute${instCount > 1 ? "s" : ""}` });
    onDone();
  };

  return (
    <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-display">Create new user</DialogTitle>
        <DialogDescription>
          {lockedInstituteId
            ? "Provision credentials and assign one or more roles within your institute."
            : "Provision credentials and assign roles — each role can map to a different institute. A user can hold many roles across many institutes."}
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
        <Field label="Full name *"><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Subhankar Das" /></Field>
        <Field label="User ID *"><Input value={form.userId} onChange={(e) => set("userId", e.target.value)} placeholder="subhankar" /></Field>
        <Field label="Email *"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="user@institute.edu.in" /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 …" /></Field>
        <Field label="Password *" className="sm:col-span-2"><Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Minimum 6 characters" /></Field>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Roles &amp; institute mapping *</Label>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addRow}><Plus className="h-3.5 w-3.5" />Add role</Button>
        </div>
        <div className="space-y-2 rounded-md border border-border/60 p-3 bg-muted/20">
          {rows.map((r, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] text-muted-foreground">Role</Label>
                <Select value={r.customRoleId ? `custom:${r.customRoleId}` : r.role} onValueChange={(v) => onRoleChange(i, v)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__bi" disabled className="text-[10px] uppercase text-muted-foreground">Built-in roles</SelectItem>
                    {ASSIGNABLE_ROLES.map((role) => <SelectItem key={role} value={role} className="capitalize">{roleLabel[role]}</SelectItem>)}
                    {customRoles.length > 0 && <SelectItem value="__cr" disabled className="text-[10px] uppercase text-muted-foreground">Custom roles</SelectItem>}
                    {customRoles.map((c) => <SelectItem key={c.id} value={`custom:${c.id}`}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] text-muted-foreground">Institute</Label>
                <Select value={lockedInstituteId ?? r.instituteId} onValueChange={(v) => setRow(i, { instituteId: v })} disabled={!!lockedInstituteId}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="Institute" /></SelectTrigger>
                  <SelectContent>{institutes.map((inst) => <SelectItem key={inst.id} value={inst.id}>{inst.name} · {inst.city}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeRow(i)} disabled={rows.length === 1}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {lockedInstituteId
            ? "Institute is fixed to your own institute. You can still grant multiple roles."
            : "Example: HR @ DPS (BBSR), Admin @ DPS (CTC), CFO @ DPS (Puri). On login the user picks an institute; screens shown match the role there."}
        </p>
      </div>
      <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
        <Button variant="outline" onClick={onDone}>Cancel</Button>
        <Button className="gradient-primary border-0" onClick={submit}>Create user &amp; send invite</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
