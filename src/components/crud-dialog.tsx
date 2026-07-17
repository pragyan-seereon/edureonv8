import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export type CrudField =
  | { name: string; label: string; type?: "text" | "email" | "number" | "date" }
  | { name: string; label: string; type: "textarea" }
  | { name: string; label: string; type: "select"; options: string[] };

export type CrudRecord = Record<string, string | number>;

export function CrudDialog({
  open, onOpenChange, title, description, fields, initial, onSubmit, submitLabel = "Save",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  fields: CrudField[];
  initial?: CrudRecord;
  onSubmit?: (data: CrudRecord) => void;
  submitLabel?: string;
}) {
  const blank: CrudRecord = Object.fromEntries(
    fields.map((f) => [f.name, f.type === "number" ? 0 : f.type === "select" ? f.options[0] : ""]),
  );
  const [data, setData] = useState<CrudRecord>(initial ?? blank);

  useEffect(() => { if (open) setData(initial ?? blank); /* eslint-disable-next-line */ }, [open]);

  const submit = () => {
    onSubmit?.(data);
    toast.success(submitLabel + " — saved");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          {fields.map((f) => (
            <div key={f.name} className={`space-y-1.5 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
              <Label className="text-xs text-muted-foreground">{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea rows={3} value={String(data[f.name] ?? "")} onChange={(e) => setData({ ...data, [f.name]: e.target.value })} />
              ) : f.type === "select" ? (
                <Select value={String(data[f.name] ?? "")} onValueChange={(v) => setData({ ...data, [f.name]: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{f.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Input type={f.type ?? "text"} value={String(data[f.name] ?? "")} onChange={(e) => setData({ ...data, [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value })} />
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="gradient-primary border-0">{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
