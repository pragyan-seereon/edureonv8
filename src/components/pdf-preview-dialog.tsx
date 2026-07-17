import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fileName: string;
  studentName?: string;
  assignmentTitle?: string;
  submittedAt?: string;
  status?: string;
  marks?: string;
};

export function PdfPreviewDialog({ open, onOpenChange, fileName, studentName, assignmentTitle, submittedAt, status, marks }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <FileText className="h-5 w-5 text-primary" />
            {assignmentTitle || "Submission Preview"}
          </DialogTitle>
          <div className="flex flex-wrap gap-2 text-xs mt-1">
            {studentName && <Badge variant="secondary">{studentName}</Badge>}
            {submittedAt && <Badge variant="outline">Submitted {submittedAt}</Badge>}
            {status && <Badge>{status}</Badge>}
            {marks && <Badge variant="outline">Marks: {marks}</Badge>}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-neutral-100 dark:bg-neutral-900 rounded border">
          {/* Simulated PDF page */}
          <div className="mx-auto my-6 bg-white text-black shadow-lg" style={{ width: "min(700px, 92%)", aspectRatio: "8.5 / 11", padding: "48px 56px", fontFamily: "Georgia, serif" }}>
            <div className="border-b-2 border-black pb-2 mb-4">
              <div className="text-[10px] uppercase tracking-widest text-neutral-500">Assignment Submission</div>
              <div className="text-lg font-semibold">{assignmentTitle || "Untitled"}</div>
              <div className="text-xs text-neutral-600">by {studentName || "—"}</div>
            </div>
            <div className="text-sm leading-6 space-y-3">
              <p><b>Q1.</b> Explain the concept and derive the standard form with a worked example.</p>
              <p className="text-neutral-800">The concept builds on prior fundamentals introduced in the previous chapter. Beginning from first principles, we can express the relationship as shown below and expand it step by step to arrive at the standard form used throughout the syllabus.</p>
              <p><b>Q2.</b> Solve the following applied problem.</p>
              <p className="text-neutral-800">Given the parameters described in the problem, we substitute the known values and simplify. The intermediate steps reveal a clear pattern that maps directly to the solution presented in the reference material.</p>
              <p><b>Q3.</b> Reflection.</p>
              <p className="text-neutral-800">This exercise reinforced my understanding of the underlying principles. I found the derivation portion most challenging and plan to revisit the worked examples before the term assessment.</p>
              <div className="mt-8 pt-4 border-t border-neutral-300 flex justify-between text-[11px] text-neutral-500">
                <span>File: {fileName}</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => toast.success(`${fileName} downloaded`)}><Download className="h-4 w-4" />Download PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
