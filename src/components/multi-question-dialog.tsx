import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Plus, Trash2, ListChecks } from "lucide-react";
import { toast } from "sonner";

export type QuestionDraft = {
  key: string;
  chapter: string;
  question: string; // html
  answer: string;
  diff: "Easy" | "Medium" | "Hard";
  marks: number;
};

export type QuestionBatchMeta = { className: string; subject: string; examType: string };

const blankDraft = (): QuestionDraft => ({
  key: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  chapter: "",
  question: "",
  answer: "",
  diff: "Medium",
  marks: 1,
});

export function MultiQuestionDialog({
  open, onOpenChange, classes, subjects, examTypes, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classes: string[];
  subjects: string[];
  examTypes: string[];
  onSubmit: (meta: QuestionBatchMeta, items: QuestionDraft[]) => void;
}) {
  const [meta, setMeta] = useState<QuestionBatchMeta>({
    className: classes[0] ?? "X",
    subject: subjects[0] ?? "Math",
    examType: examTypes[0] ?? "Term 1",
  });
  const [drafts, setDrafts] = useState<QuestionDraft[]>([blankDraft()]);

  const reset = () => {
    setMeta({ className: classes[0] ?? "X", subject: subjects[0] ?? "Math", examType: examTypes[0] ?? "Term 1" });
    setDrafts([blankDraft()]);
  };

  const update = (key: string, patch: Partial<QuestionDraft>) =>
    setDrafts((p) => p.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const totalMarks = drafts.reduce((s, d) => s + (Number(d.marks) || 0), 0);

  const save = () => {
    const valid = drafts.filter((d) => d.question.replace(/<[^>]*>/g, "").trim().length > 0);
    if (valid.length === 0) return toast.error("Add at least one question with text");
    onSubmit(meta, valid);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <ListChecks className="h-5 w-5" /> Add Questions to Bank
          </DialogTitle>
          <DialogDescription>
            Choose the class, subject and examination type, then add one or more questions in a single form.
          </DialogDescription>
        </DialogHeader>

        {/* Batch context */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Class</Label>
            <Select value={meta.className} onValueChange={(v) => setMeta({ ...meta, className: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Subject</Label>
            <Select value={meta.subject} onValueChange={(v) => setMeta({ ...meta, subject: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Examination Type</Label>
            <Select value={meta.examType} onValueChange={(v) => setMeta({ ...meta, examType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{examTypes.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Question rows */}
        <div className="space-y-4 py-1">
          {drafts.map((d, i) => (
            <div key={d.key} className="rounded-lg border border-border/60 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-[11px]">Question {i + 1}</Badge>
                {drafts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setDrafts((p) => p.filter((x) => x.key !== d.key))}
                    className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5 sm:col-span-1">
                  <Label className="text-xs text-muted-foreground">Chapter / Topic</Label>
                  <Input value={d.chapter} onChange={(e) => update(d.key, { chapter: e.target.value })} placeholder="e.g. Trigonometry" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Difficulty</Label>
                  <Select value={d.diff} onValueChange={(v) => update(d.key, { diff: v as QuestionDraft["diff"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Easy", "Medium", "Hard"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Marks</Label>
                  <Input type="number" min={1} value={d.marks} onChange={(e) => update(d.key, { marks: Number(e.target.value) })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Question</Label>
                <RichTextEditor
                  value={d.question}
                  onChange={(html) => update(d.key, { question: html })}
                  placeholder="Type the full question. Use the toolbar for bold, lists, super/subscript…"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Answer Key / Evaluation Notes</Label>
                <RichTextEditor
                  value={d.answer}
                  onChange={(html) => update(d.key, { answer: html })}
                  placeholder="Model answer or marking scheme (optional)"
                  minHeight={64}
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => setDrafts((p) => [...p, blankDraft()])}>
            <Plus className="h-4 w-4" /> Add another question
          </Button>
        </div>

        <DialogFooter className="items-center gap-2 sm:justify-between">
          <span className="text-xs text-muted-foreground">{drafts.length} question{drafts.length > 1 ? "s" : ""} · {totalMarks} marks</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
            <Button className="gradient-primary border-0" onClick={save}>Save to Bank</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
