import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, Shield, Layers, KeyRound, Check } from "lucide-react";
import { toast } from "sonner";
import type { CustomRole, PermAction, RolePerms } from "@/lib/store";
import { customRolesApi } from "@/lib/store";

export type ModuleSpec = {
  key: string;
  label: string;
  tabs: { key: string; label: string }[];
};

export const MODULE_CATALOG: ModuleSpec[] = [
  { key: "admissions", label: "Admissions", tabs: [
    { key: "inquiries", label: "Inquiries" }, { key: "applications", label: "Applications" },
    { key: "interviews", label: "Interviews" }, { key: "offers", label: "Offers" }, { key: "reports", label: "Reports" },
  ]},
  { key: "students", label: "Students", tabs: [
    { key: "list", label: "Directory" }, { key: "profile", label: "Profiles" },
    { key: "attendance", label: "Attendance" }, { key: "documents", label: "Documents" }, { key: "transfers", label: "Transfers" },
  ]},
  { key: "classes", label: "Classes", tabs: [
    { key: "list", label: "Class List" }, { key: "sections", label: "Sections" },
    { key: "subjects", label: "Subjects" }, { key: "mapping", label: "Subject Mapping" }, { key: "teachers", label: "Teacher Mapping" },
  ]},
  { key: "timetable", label: "Timetable", tabs: [
    { key: "grid", label: "Grid" }, { key: "rooms", label: "Room Allocation" },
    { key: "conflicts", label: "Conflicts" }, { key: "publish", label: "Publish" },
  ]},
  { key: "attendance", label: "Attendance", tabs: [
    { key: "daily", label: "Daily" }, { key: "subject", label: "Subject-wise" },
    { key: "corrections", label: "Corrections" }, { key: "reports", label: "Reports" },
  ]},
  { key: "assignments", label: "Assignments", tabs: [
    { key: "list", label: "All Assignments" }, { key: "submissions", label: "Submissions" },
    { key: "grading", label: "Grading" }, { key: "analytics", label: "Analytics" },
  ]},
  { key: "exams", label: "Examinations", tabs: [
    { key: "schedule", label: "Schedule" }, { key: "halls", label: "Hall Plan" },
    { key: "marks", label: "Marks Entry" }, { key: "results", label: "Results" }, { key: "reports", label: "Reports" },
  ]},
  { key: "fees", label: "Fees", tabs: [
    { key: "structure", label: "Structure" }, { key: "collection", label: "Collection" },
    { key: "pending", label: "Pending" }, { key: "reports", label: "Reports" },
  ]},
  { key: "payroll", label: "Payroll", tabs: [
    { key: "runs", label: "Pay Runs" }, { key: "components", label: "Components" }, { key: "payslips", label: "Payslips" },
  ]},
  { key: "employees", label: "Employees", tabs: [
    { key: "list", label: "Directory" }, { key: "leaves", label: "Leaves" }, { key: "documents", label: "Documents" },
  ]},
  { key: "transport", label: "Transport", tabs: [
    { key: "routes", label: "Routes" }, { key: "vehicles", label: "Vehicles" }, { key: "drivers", label: "Drivers" },
  ]},
  { key: "hostel", label: "Hostel", tabs: [
    { key: "blocks", label: "Blocks & Rooms" }, { key: "allocations", label: "Allocations" }, { key: "visitors", label: "Visitors" },
  ]},
  { key: "library", label: "Library", tabs: [
    { key: "catalog", label: "Catalog" }, { key: "issue", label: "Issue / Return" }, { key: "fines", label: "Fines" },
  ]},
  { key: "communication", label: "Communication", tabs: [
    { key: "notices", label: "Notices" }, { key: "compose", label: "Compose" }, { key: "history", label: "History" },
  ]},
  { key: "reports", label: "Reports & Analytics", tabs: [
    { key: "academic", label: "Academic" }, { key: "finance", label: "Finance" }, { key: "operations", label: "Operations" },
  ]},
  { key: "settings", label: "Settings", tabs: [
    { key: "general", label: "General" }, { key: "roles", label: "Roles" }, { key: "billing", label: "Billing" },
  ]},
];

const ALL_ACTIONS: { key: PermAction; label: string }[] = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "update", label: "Update" },
  { key: "delete", label: "Delete" },
  { key: "export", label: "Export" },
  { key: "approve", label: "Approve" },
];

type Step = 1 | 2 | 3 | 4;

export function RoleWizard({
  open, onOpenChange, edit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  edit?: CustomRole | null;
}) {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<CustomRole["scope"]>("Institute");
  const [desc, setDesc] = useState("");
  const [perms, setPerms] = useState<RolePerms>({});
  const [activeModule, setActiveModule] = useState<string>(MODULE_CATALOG[0].key);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setName(edit?.name ?? "");
    setScope(edit?.scope ?? "Institute");
    setDesc(edit?.desc ?? "");
    setPerms(edit?.perms ?? {});
    setActiveModule(MODULE_CATALOG[0].key);
  }, [open, edit]);

  const enabledModules = useMemo(
    () => Object.entries(perms).filter(([, v]) => v.enabled).map(([k]) => k),
    [perms],
  );

  const toggleModule = (key: string, on: boolean) => {
    setPerms((p) => {
      const next = { ...p };
      if (on) {
        const spec = MODULE_CATALOG.find((m) => m.key === key)!;
        next[key] = next[key] ?? { enabled: true, tabs: Object.fromEntries(spec.tabs.map((t) => [t.key, ["view"]])) };
        next[key].enabled = true;
      } else if (next[key]) {
        next[key] = { ...next[key], enabled: false };
      }
      return next;
    });
  };

  const toggleTab = (mod: string, tab: string, on: boolean) => {
    setPerms((p) => {
      const cur = p[mod] ?? { enabled: true, tabs: {} };
      const tabs = { ...cur.tabs };
      if (on) tabs[tab] = tabs[tab]?.length ? tabs[tab] : ["view"];
      else delete tabs[tab];
      return { ...p, [mod]: { ...cur, enabled: true, tabs } };
    });
  };

  const toggleAction = (mod: string, tab: string, act: PermAction, on: boolean) => {
    setPerms((p) => {
      const cur = p[mod] ?? { enabled: true, tabs: {} };
      const set = new Set(cur.tabs[tab] ?? []);
      if (on) set.add(act); else set.delete(act);
      if (on) set.add("view"); // require view
      return { ...p, [mod]: { ...cur, enabled: true, tabs: { ...cur.tabs, [tab]: Array.from(set) as PermAction[] } } };
    });
  };

  const bulkSetModule = (mod: string, acts: PermAction[]) => {
    setPerms((p) => {
      const spec = MODULE_CATALOG.find((m) => m.key === mod)!;
      return { ...p, [mod]: { enabled: true, tabs: Object.fromEntries(spec.tabs.map((t) => [t.key, [...acts]])) } };
    });
  };

  const canNext = step === 1 ? name.trim().length > 1 : step === 2 ? enabledModules.length > 0 : true;

  const submit = () => {
    if (!name.trim()) return toast.error("Role name is required");
    const level: CustomRole["level"] = "Custom";
    const payload = { name: name.trim(), level, scope, desc, perms };
    if (edit) {
      customRolesApi.update(edit.id, payload);
      toast.success(`Role "${name}" updated`);
    } else {
      customRolesApi.add(payload);
      toast.success(`Role "${name}" created`);
    }
    onOpenChange(false);
  };

  const stepMeta = [
    { n: 1, t: "Identity", icon: Shield },
    { n: 2, t: "Modules", icon: Layers },
    { n: 3, t: "Tabs & Permissions", icon: KeyRound },
    { n: 4, t: "Review", icon: Check },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="font-display text-xl">{edit ? "Edit Role" : "Create Custom Role"}</DialogTitle>
          <DialogDescription>Define exactly which modules, sub-tabs, and actions this role can use.</DialogDescription>
          <div className="flex items-center gap-2 pt-4">
            {stepMeta.map((s, i) => {
              const Icon = s.icon;
              const active = step === s.n;
              const done = step > s.n;
              return (
                <div key={s.n} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${active ? "bg-primary text-primary-foreground" : done ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-3.5 w-3.5" />{s.t}
                  </div>
                  {i < stepMeta.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        <div className="px-6 py-5 min-h-[420px] max-h-[60vh] overflow-auto">
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Role Name</Label>
                <Input placeholder="e.g. Exam Controller" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Scope</Label>
                <Select value={scope} onValueChange={(v) => setScope(v as CustomRole["scope"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Institute","Department","Class","Self"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description</Label>
                <Textarea rows={3} placeholder="What does this role do?" value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Select the modules this role should have access to.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPerms(Object.fromEntries(MODULE_CATALOG.map((m) => [m.key, { enabled: true, tabs: Object.fromEntries(m.tabs.map((t) => [t.key, ["view"]])) }])))}>Select all</Button>
                  <Button variant="ghost" size="sm" onClick={() => setPerms({})}>Clear</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {MODULE_CATALOG.map((m) => {
                  const on = !!perms[m.key]?.enabled;
                  return (
                    <label key={m.key} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${on ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                      <Checkbox checked={on} onCheckedChange={(v) => toggleModule(m.key, !!v)} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{m.label}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{m.tabs.length} tabs</div>
                      </div>
                      {on && <Badge variant="secondary" className="text-[10px]">{Object.keys(perms[m.key]?.tabs ?? {}).length} on</Badge>}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-[220px_1fr] gap-4 h-full">
              <ScrollArea className="h-[420px] border rounded-md">
                <div className="p-1.5 space-y-0.5">
                  {enabledModules.length === 0 && <p className="text-xs text-muted-foreground p-3">Enable modules in the previous step.</p>}
                  {enabledModules.map((k) => {
                    const spec = MODULE_CATALOG.find((m) => m.key === k)!;
                    const isActive = activeModule === k;
                    return (
                      <button key={k} onClick={() => setActiveModule(k)}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                        <div className="font-medium">{spec.label}</div>
                        <div className={`text-[10px] ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {Object.keys(perms[k]?.tabs ?? {}).length}/{spec.tabs.length} tabs
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="border rounded-md flex flex-col min-h-[420px]">
                {enabledModules.includes(activeModule) ? (() => {
                  const spec = MODULE_CATALOG.find((m) => m.key === activeModule)!;
                  const modPerms = perms[activeModule];
                  return (
                    <>
                      <div className="flex items-center justify-between px-4 py-2.5 border-b">
                        <div>
                          <div className="text-sm font-semibold">{spec.label}</div>
                          <div className="text-[11px] text-muted-foreground">Pick tabs and the actions allowed on each.</div>
                        </div>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => bulkSetModule(activeModule, ["view"])}>View only</Button>
                          <Button size="sm" variant="outline" onClick={() => bulkSetModule(activeModule, ["view","create","update"])}>R/W</Button>
                          <Button size="sm" variant="outline" onClick={() => bulkSetModule(activeModule, ["view","create","update","delete","export","approve"])}>Full</Button>
                        </div>
                      </div>
                      <ScrollArea className="flex-1">
                        <div className="divide-y">
                          {spec.tabs.map((t) => {
                            const enabled = !!modPerms?.tabs[t.key];
                            const acts = new Set(modPerms?.tabs[t.key] ?? []);
                            return (
                              <div key={t.key} className="p-3">
                                <div className="flex items-center justify-between">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox checked={enabled} onCheckedChange={(v) => toggleTab(activeModule, t.key, !!v)} />
                                    <span className="text-sm font-medium">{t.label}</span>
                                  </label>
                                  {enabled && <Badge variant="secondary" className="text-[10px]">{acts.size} action{acts.size !== 1 ? "s" : ""}</Badge>}
                                </div>
                                {enabled && (
                                  <div className="mt-2 ml-6 flex flex-wrap gap-3">
                                    {ALL_ACTIONS.map((a) => (
                                      <label key={a.key} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                        <Checkbox
                                          checked={acts.has(a.key)}
                                          disabled={a.key === "view"}
                                          onCheckedChange={(v) => toggleAction(activeModule, t.key, a.key, !!v)}
                                        />
                                        {a.label}
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </>
                  );
                })() : (
                  <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Select a module from the left.</div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Name: </span><span className="font-medium">{name || "—"}</span></div>
                <div><span className="text-muted-foreground">Scope: </span><span className="font-medium">{scope}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Description: </span>{desc || <em className="text-muted-foreground">none</em>}</div>
              </div>
              <div className="border rounded-md divide-y">
                {enabledModules.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No modules selected.</div>}
                {enabledModules.map((k) => {
                  const spec = MODULE_CATALOG.find((m) => m.key === k)!;
                  const mp = perms[k];
                  return (
                    <div key={k} className="p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-sm font-semibold">{spec.label}</div>
                        <Badge variant="outline" className="text-[10px]">{Object.keys(mp.tabs).length} tabs</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(mp.tabs).map(([tk, acts]) => {
                          const tab = spec.tabs.find((x) => x.key === tk);
                          return (
                            <Badge key={tk} variant="secondary" className="text-[10px] font-normal">
                              {tab?.label}: <span className="ml-1 font-semibold">{acts.join(", ")}</span>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <div className="flex-1 text-xs text-muted-foreground">Step {step} of 4</div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {step > 1 && <Button variant="outline" onClick={() => setStep((s) => (s - 1) as Step)}>Back</Button>}
          {step < 4 ? (
            <Button disabled={!canNext} onClick={() => setStep((s) => (s + 1) as Step)} className="gradient-primary border-0">Next</Button>
          ) : (
            <Button onClick={submit} className="gradient-primary border-0">{edit ? "Save Changes" : "Create Role"}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
