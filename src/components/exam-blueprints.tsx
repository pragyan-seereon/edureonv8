import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Copy, LayoutGrid, FileStack, Wand2 } from "lucide-react";
import { toast } from "sonner";
import {
  useBlueprints, blueprintsApi, bpTotalMarks, bpTotalQuestions,
  useQuestionTemplates, templatesApi,
  QUESTION_CATEGORIES, type Blueprint, type BlueprintRow, type QuestionCategory,
  type QDifficulty, type QuestionTemplate,
} from "@/lib/store";

const CLASSES = ["VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const SUBJECTS = ["Math", "Science", "English", "Social", "Hindi", "CS", "Biology", "Economics"];
const EXAM_TYPES = ["Unit Test", "Term 1", "Term 2", "Half-Yearly", "Pre-Board", "Board"];
const DIFFS: QDifficulty[] = ["Easy", "Medium", "Hard"];
const rid = () => "r" + Math.random().toString(36).slice(2, 8);

const diffTone: Record<QDifficulty, string> = {
  Easy: "bg-success/10 text-success border-success/20",
  Medium: "bg-info/10 text-info border-info/20",
  Hard: "bg-warning/15 text-warning border-warning/20",
};

export function BlueprintsTab() {
  const list = useBlueprints();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Blueprint | null>(null);
  const [name, setName] = useState("");
  const [className, setClassName] = useState("X");
  const [subject, setSubject] = useState("Math");
  const [examType, setExamType] = useState("Term 2");
  const [duration, setDuration] = useState("180");
  const [rows, setRows] = useState<BlueprintRow[]>([]);

  const openNew = () => {
    setEdit(null); setName(""); setClassName("X"); setSubject("Math"); setExamType("Term 2"); setDuration("180");
    setRows([{ id: rid(), category: "MCQ", chapter: "All chapters", count: 10, marksEach: 1, diff: "Easy" }]);
    setOpen(true);
  };
  const openEdit = (b: Blueprint) => {
    setEdit(b); setName(b.name); setClassName(b.className); setSubject(b.subject);
    setExamType(b.examType); setDuration(String(b.duration)); setRows(b.rows.map((r) => ({ ...r })));
    setOpen(true);
  };
  const addRow = () => setRows((p) => [...p, { id: rid(), category: "Short Answer (2-3)", chapter: "", count: 5, marksEach: 3, diff: "Medium" }]);
  const patchRow = (id: string, patch: Partial<BlueprintRow>) => setRows((p) => p.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const total = rows.reduce((a, r) => a + r.count * r.marksEach, 0);
  const totalQ = rows.reduce((a, r) => a + r.count, 0);

  const save = () => {
    if (!name.trim()) return toast.error("Give the blueprint a name");
    if (rows.length === 0) return toast.error("Add at least one section");
    const payload = { name: name.trim(), className, subject, examType, duration: Number(duration) || 180, rows };
    if (edit) blueprintsApi.update(edit.id, payload); else blueprintsApi.add(payload);
    toast.success(edit ? "Blueprint updated" : `Blueprint created · ${total} marks`);
    setOpen(false);
  };

  return (
    <>
      <Card className="border-border/60">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><LayoutGrid className="h-4 w-4" />Paper Blueprints</CardTitle>
            <CardDescription>Define the mark distribution (category × chapter × difficulty) for each paper.</CardDescription>
          </div>
          <Button size="sm" className="gradient-primary border-0" onClick={openNew}><Plus className="h-4 w-4" />New Blueprint</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Blueprint</TableHead><TableHead>Class · Subject</TableHead><TableHead>Exam</TableHead>
                <TableHead className="text-center">Sections</TableHead><TableHead className="text-center">Questions</TableHead>
                <TableHead className="text-center">Marks</TableHead><TableHead className="text-center">Duration</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium text-sm">{b.name}</TableCell>
                  <TableCell className="text-xs">{b.className} · {b.subject}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{b.examType}</Badge></TableCell>
                  <TableCell className="text-center text-sm">{b.rows.length}</TableCell>
                  <TableCell className="text-center text-sm">{bpTotalQuestions(b)}</TableCell>
                  <TableCell className="text-center text-sm font-semibold">{bpTotalMarks(b)}</TableCell>
                  <TableCell className="text-center text-xs">{b.duration}m</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toast.success(`Generating ${bpTotalMarks(b)}-mark paper for ${b.className} ${b.subject}…`)}><Wand2 className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { blueprintsApi.remove(b.id); toast.success("Blueprint deleted"); }}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-10">No blueprints yet. Create one to standardise your papers.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">{edit ? "Edit Blueprint" : "New Paper Blueprint"}</DialogTitle>
            <DialogDescription>Total: <b>{totalQ}</b> questions · <b>{total}</b> marks</DialogDescription>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Blueprint name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Term 2 — Standard 80-mark" /></div>
            <div className="space-y-1"><Label className="text-xs">Class</Label><Select value={className} onValueChange={setClassName}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label className="text-xs">Subject</Label><Select value={subject} onValueChange={setSubject}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SUBJECTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label className="text-xs">Exam type</Label><Select value={examType} onValueChange={setExamType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EXAM_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label className="text-xs">Duration (min)</Label><Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
          </div>

          <div className="rounded-md border overflow-auto max-h-72">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead><TableHead>Chapter mapping</TableHead>
                  <TableHead className="w-20 text-center">Count</TableHead><TableHead className="w-24 text-center">Marks each</TableHead>
                  <TableHead className="w-28">Difficulty</TableHead><TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Select value={r.category} onValueChange={(v) => patchRow(r.id, { category: v as QuestionCategory })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{QUESTION_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Input className="h-8 text-xs" value={r.chapter} onChange={(e) => patchRow(r.id, { chapter: e.target.value })} placeholder="e.g. Algebra, Trigonometry" /></TableCell>
                    <TableCell><Input type="number" className="h-8 text-xs text-center" value={r.count} onChange={(e) => patchRow(r.id, { count: Number(e.target.value) })} /></TableCell>
                    <TableCell><Input type="number" className="h-8 text-xs text-center" value={r.marksEach} onChange={(e) => patchRow(r.id, { marksEach: Number(e.target.value) })} /></TableCell>
                    <TableCell>
                      <Select value={r.diff} onValueChange={(v) => patchRow(r.id, { diff: v as QDifficulty })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{DIFFS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setRows((p) => p.filter((x) => x.id !== r.id))}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button size="sm" variant="outline" onClick={addRow}><Plus className="h-4 w-4" />Add section</Button>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="gradient-primary border-0" onClick={save}>{edit ? "Save changes" : "Create blueprint"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TemplatesTab() {
  const list = useQuestionTemplates();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<QuestionTemplate | null>(null);
  const [f, setF] = useState({ name: "", subject: "Math", category: "MCQ" as QuestionCategory, diff: "Easy" as QDifficulty, marks: "1", body: "" });

  const openNew = () => { setEdit(null); setF({ name: "", subject: "Math", category: "MCQ", diff: "Easy", marks: "1", body: "" }); setOpen(true); };
  const openEdit = (t: QuestionTemplate) => { setEdit(t); setF({ name: t.name, subject: t.subject, category: t.category, diff: t.diff, marks: String(t.marks), body: t.body }); setOpen(true); };
  const save = () => {
    if (!f.name.trim()) return toast.error("Give the template a name");
    const payload = { name: f.name.trim(), subject: f.subject, category: f.category, diff: f.diff, marks: Number(f.marks) || 1, body: f.body };
    if (edit) templatesApi.update(edit.id, payload); else templatesApi.add(payload);
    toast.success(edit ? "Template updated" : "Template saved");
    setOpen(false);
  };

  return (
    <>
      <Card className="border-border/60">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><FileStack className="h-4 w-4" />Question Templates</CardTitle>
            <CardDescription>Reusable question shells — insert into any paper and fill the blanks.</CardDescription>
          </div>
          <Button size="sm" className="gradient-primary border-0" onClick={openNew}><Plus className="h-4 w-4" />New Template</Button>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          {list.map((t) => (
            <div key={t.id} className="rounded-lg border border-border/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{t.subject}</Badge>
                    <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                    <Badge variant="outline" className={"text-[10px] " + diffTone[t.diff]}>{t.diff}</Badge>
                    <Badge variant="outline" className="text-[10px]">{t.marks}m</Badge>
                  </div>
                </div>
                <div className="flex shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { navigator.clipboard?.writeText(t.body); toast.success("Template copied"); }}><Copy className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { templatesApi.remove(t.id); toast.success("Template deleted"); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap font-sans bg-muted/40 rounded p-2">{t.body}</pre>
            </div>
          ))}
          {list.length === 0 && <div className="text-sm text-muted-foreground text-center py-10 md:col-span-2">No templates yet.</div>}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{edit ? "Edit Template" : "New Question Template"}</DialogTitle>
            <DialogDescription>Use blanks (____) where question-specific content goes.</DialogDescription>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Template name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="MCQ — single correct" /></div>
            <div className="space-y-1"><Label className="text-xs">Subject</Label><Select value={f.subject} onValueChange={(v) => setF({ ...f, subject: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SUBJECTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label className="text-xs">Category</Label><Select value={f.category} onValueChange={(v) => setF({ ...f, category: v as QuestionCategory })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{QUESTION_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label className="text-xs">Difficulty</Label><Select value={f.diff} onValueChange={(v) => setF({ ...f, diff: v as QDifficulty })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DIFFS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label className="text-xs">Marks</Label><Input type="number" value={f.marks} onChange={(e) => setF({ ...f, marks: e.target.value })} /></div>
            <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Template body</Label><Textarea rows={5} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder={"____________?\n(a) ____ (b) ____ (c) ____ (d) ____"} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="gradient-primary border-0" onClick={save}>{edit ? "Save changes" : "Save template"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
