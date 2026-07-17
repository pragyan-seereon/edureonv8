import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, FileText, X } from "lucide-react";
import { toast } from "sonner";

export type DocumentUploadValue = {
  title: string;
  category: string;
  notes?: string;
  fileName: string;
  fileSize: number;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  categories?: string[];
  onSubmit: (value: DocumentUploadValue) => void;
};

const DEFAULT_CATS = ["Policy", "Circular", "Certificate", "Report", "Invoice", "Other"];

export function DocumentUploadDialog({
  open, onOpenChange, title = "Upload Document",
  categories = DEFAULT_CATS, onSubmit,
}: Props) {
  const [docTitle, setDocTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const reset = () => { setDocTitle(""); setNotes(""); setFile(null); setCategory(categories[0]); };

  const handle = () => {
    if (!docTitle.trim()) { toast.error("Title required"); return; }
    if (!file) { toast.error("Select a file"); return; }
    onSubmit({ title: docTitle.trim(), category, notes, fileName: file.name, fileSize: file.size });
    toast.success("Document uploaded");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UploadCloud className="h-4 w-4 text-primary" />{title}</DialogTitle>
          <DialogDescription>Upload a file with metadata. Allowed: PDF, DOCX, XLSX, JPG, PNG (max 10MB).</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Document Title <span className="text-destructive">*</span></Label>
            <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="e.g. Fee Receipt March 2026" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional description" />
          </div>
          <div className="space-y-1.5">
            <Label>File <span className="text-destructive">*</span></Label>
            {file ? (
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{file.name}</div>
                    <div className="text-[11px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setFile(null)}><X className="h-4 w-4" /></Button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 cursor-pointer rounded-md border border-dashed border-border bg-muted/20 px-3 py-6 text-center hover:bg-muted/40 transition-colors">
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
                <div className="text-sm font-medium">Click to upload</div>
                <div className="text-[11px] text-muted-foreground">or drag and drop</div>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
              </label>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="gradient-primary border-0" onClick={handle}><UploadCloud className="h-4 w-4" />Upload</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
