import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export type Conflict = {
  type: string;
  severity: "high" | "med";
  what: string;
  when: string;
  klass: string;
  day: number;
  period: number;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  conflict: Conflict | null;
  subjects: string[];
  teachers: string[];
  rooms: string[];
  initial?: { subject: string; teacher: string; room: string };
  /** Validate proposed replacement; return blocking message or null if clean */
  validate?: (proposal: { subject: string; teacher: string; room: string }) => string | null;
  onResolve: (proposal: { subject: string; teacher: string; room: string }) => void;
};

export function ConflictResolveDialog({
  open, onOpenChange, conflict, subjects, teachers, rooms, initial, validate, onResolve,
}: Props) {
  const [subject, setSubject] = useState(initial?.subject || subjects[0] || "");
  const [teacher, setTeacher] = useState(initial?.teacher || teachers[0] || "");
  const [room, setRoom] = useState(initial?.room || rooms[0] || "");
  const [issue, setIssue] = useState<string | null>(null);

  useEffect(() => {
    setSubject(initial?.subject || subjects[0] || "");
    setTeacher(initial?.teacher || teachers[0] || "");
    setRoom(initial?.room || rooms[0] || "");
    setIssue(null);
  }, [conflict, initial, subjects, teachers, rooms]);

  const check = () => {
    const msg = validate ? validate({ subject, teacher, room }) : null;
    setIssue(msg);
    if (!msg) toast.success("No new conflicts — ready to save");
    return msg;
  };

  const save = () => {
    const msg = validate ? validate({ subject, teacher, room }) : null;
    if (msg) { setIssue(msg); return toast.error(msg); }
    onResolve({ subject, teacher, room });
    onOpenChange(false);
  };

  if (!conflict) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <AlertTriangle className={`h-5 w-5 ${conflict.severity === "high" ? "text-destructive" : "text-warning"}`} />
            Resolve Conflict
          </DialogTitle>
          <DialogDescription>{conflict.type} · {conflict.when} · {conflict.klass}</DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <div className="font-semibold">{conflict.what}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Adjust subject, teacher or room for this slot. We'll re-validate against the rest of the timetable before saving.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Teacher</Label>
            <Select value={teacher} onValueChange={setTeacher}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{teachers.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Room</Label>
            <Select value={room} onValueChange={setRoom}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{rooms.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {issue !== null && (
          issue
            ? <div className="text-xs bg-destructive/10 text-destructive border border-destructive/30 rounded p-2">{issue}</div>
            : <div className="text-xs bg-success/10 text-success border border-success/30 rounded p-2 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Validated — no conflicts.</div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" onClick={check}>Validate</Button>
          <Button onClick={save} className="gradient-primary border-0">Save Resolution</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
