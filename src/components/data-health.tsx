import { useMemo, useState } from "react";
import { academicHealth, type HealthLevel } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Search, Download } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const toneMap: Record<HealthLevel, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  pass: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: <CheckCircle2 className="h-4 w-4" />, label: "Healthy" },
  warn: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: <AlertTriangle className="h-4 w-4" />, label: "Warning" },
  fail: { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", icon: <XCircle className="h-4 w-4" />, label: "Failing" },
};

export function DataHealth() {
  const [tick, setTick] = useState(0);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [level, setLevel] = useState<string>("All");
  const checks = useMemo(() => academicHealth(), [tick]);

  const cats = ["All", ...Array.from(new Set(checks.map((c) => c.category)))];
  const filtered = checks.filter((c) => {
    if (cat !== "All" && c.category !== cat) return false;
    if (level !== "All" && c.level !== level) return false;
    if (q && !c.label.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const totals = {
    pass: checks.filter((c) => c.level === "pass").length,
    warn: checks.filter((c) => c.level === "warn").length,
    fail: checks.filter((c) => c.level === "fail").length,
  };
  const healthPct = checks.length ? Math.round((totals.pass / checks.length) * 100) : 100;

  const exportCsv = () => {
    const rows = [
      ["Category", "Check", "Level", "Expected", "Actual", "Details"],
      ...checks.map((c) => [
        c.category, c.label, c.level, String(c.expected), String(c.actual),
        (c.details || []).join(" | "),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `academic-health-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Health report exported");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="font-display">Academic Correlation Audit</CardTitle>
            <CardDescription>
              End-to-end reconciliation across Students, Classes, Sections, Subjects, Fees & Timetables.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setTick((t) => t + 1)}>
              <RefreshCw className="h-4 w-4" /> Re-run
            </Button>
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">Overall Health</p>
              <p className="text-3xl font-display">{healthPct}%</p>
              <p className="text-xs text-muted-foreground mt-1">{checks.length} checks</p>
            </div>
            <div className="rounded-xl border p-4 bg-emerald-50/50">
              <p className="text-xs text-emerald-700">Passing</p>
              <p className="text-3xl font-display text-emerald-700">{totals.pass}</p>
            </div>
            <div className="rounded-xl border p-4 bg-amber-50/50">
              <p className="text-xs text-amber-700">Warnings</p>
              <p className="text-3xl font-display text-amber-700">{totals.warn}</p>
            </div>
            <div className="rounded-xl border p-4 bg-rose-50/50">
              <p className="text-xs text-rose-700">Failing</p>
              <p className="text-3xl font-display text-rose-700">{totals.fail}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search checks…" className="pl-9" />
            </div>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["All", "pass", "warn", "fail"].map((l) => (
                  <SelectItem key={l} value={l}>{l === "All" ? "All levels" : toneMap[l as HealthLevel].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((c) => {
          const t = toneMap[c.level];
          return (
            <Card key={c.id} className={`border ${t.bg}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{c.category}</Badge>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${t.text}`}>
                        {t.icon} {t.label}
                      </span>
                    </div>
                    <p className="mt-2 font-medium text-sm">{c.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Expected <b>{c.expected}</b> · Actual <b>{c.actual}</b>
                    </p>
                    {c.details && c.details.length > 0 && (
                      <ul className="mt-2 text-xs text-muted-foreground space-y-0.5 list-disc pl-4">
                        {c.details.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!filtered.length && (
          <Card><CardContent className="p-6 text-sm text-muted-foreground text-center">No checks match the current filters.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
