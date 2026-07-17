import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

type Row = { subject: string; max: number; marks: number };
type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student: { name: string; roll: string; klass: string; section: string; admissionNo?: string; dob?: string; father?: string };
  school?: { name: string; address: string; affiliation?: string };
  academicYear?: string;
  term?: string;
  rows: Row[];
};

const gradeFor = (pct: number) => {
  if (pct >= 91) return { g: "A1", r: "Outstanding" };
  if (pct >= 81) return { g: "A2", r: "Excellent" };
  if (pct >= 71) return { g: "B1", r: "Very Good" };
  if (pct >= 61) return { g: "B2", r: "Good" };
  if (pct >= 51) return { g: "C1", r: "Fair" };
  if (pct >= 41) return { g: "C2", r: "Average" };
  if (pct >= 33) return { g: "D", r: "Pass" };
  return { g: "E", r: "Needs Improvement" };
};

export function ReportCardDialog({ open, onOpenChange, student, school, academicYear = "2025-26", term = "Term 2", rows }: Props) {
  const total = rows.reduce((s, r) => s + r.marks, 0);
  const max = rows.reduce((s, r) => s + r.max, 0);
  const pct = max ? (total / max) * 100 : 0;
  const overall = gradeFor(pct);
  const sch = school ?? { name: "Edureon Public School", address: "Sector 21, New Delhi — 110001", affiliation: "Affiliated to CBSE · Affl. No. 2731045" };

  const printCard = () => {
    const node = document.getElementById("report-card-print");
    if (!node) return;
    const w = window.open("", "_blank", "width=900,height=1200");
    if (!w) return;
    w.document.write(`<html><head><title>Report Card — ${student.name}</title>
      <style>
        body{font-family:Georgia,serif;margin:0;padding:24px;color:#111}
        .card{border:2px solid #111;padding:20px}
        .hdr{text-align:center;border-bottom:2px double #111;padding-bottom:10px;margin-bottom:12px}
        .hdr h1{margin:0;font-size:22px;letter-spacing:1px}
        .hdr .sub{font-size:11px;color:#333}
        table{width:100%;border-collapse:collapse;margin:8px 0;font-size:12px}
        th,td{border:1px solid #333;padding:6px 8px;text-align:center}
        th{background:#f2f2f2;text-transform:uppercase;letter-spacing:.5px;font-size:10px}
        .meta td{border:none;text-align:left;padding:2px 6px;font-size:12px}
        .footer{display:flex;justify-content:space-between;margin-top:60px;font-size:11px}
        .sig{border-top:1px solid #111;padding-top:4px;width:150px;text-align:center}
        .totals{font-weight:bold;background:#fafafa}
        .stamp{position:absolute;right:40px;bottom:80px;border:2px solid #900;color:#900;padding:6px 14px;transform:rotate(-14deg);font-size:11px;letter-spacing:2px;border-radius:4px;opacity:.6}
      </style></head><body>${node.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Report Card Preview</DialogTitle>
        </DialogHeader>

        <div id="report-card-print" className="bg-white text-black">
          <div className="card border-2 border-black p-5">
            <div className="hdr text-center border-b-2 pb-2 mb-3" style={{ borderBottomStyle: "double" }}>
              <h1 className="text-2xl font-serif tracking-widest m-0">{sch.name.toUpperCase()}</h1>
              <div className="sub text-[11px] text-neutral-700">{sch.address}</div>
              {sch.affiliation && <div className="sub text-[11px] text-neutral-700">{sch.affiliation}</div>}
              <div className="mt-2 text-xs font-semibold">CUMULATIVE REPORT · {term.toUpperCase()} · AY {academicYear}</div>
            </div>

            <table className="meta w-full text-[12px] mb-2">
              <tbody>
                <tr><td><b>Name of Student:</b> {student.name}</td><td><b>Class / Section:</b> {student.klass} · {student.section}</td></tr>
                <tr><td><b>Roll No.:</b> {student.roll}</td><td><b>Admission No.:</b> {student.admissionNo || "—"}</td></tr>
                <tr><td><b>Father's Name:</b> {student.father || "—"}</td><td><b>Date of Birth:</b> {student.dob || "—"}</td></tr>
              </tbody>
            </table>

            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  <th style={{ background: "#f2f2f2" }}>Subject</th>
                  <th style={{ background: "#f2f2f2" }}>Max</th>
                  <th style={{ background: "#f2f2f2" }}>Marks Obtained</th>
                  <th style={{ background: "#f2f2f2" }}>%</th>
                  <th style={{ background: "#f2f2f2" }}>Grade</th>
                  <th style={{ background: "#f2f2f2" }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const p = r.max ? (r.marks / r.max) * 100 : 0;
                  const gr = gradeFor(p);
                  return (
                    <tr key={r.subject}>
                      <td style={{ textAlign: "left", paddingLeft: 10 }}>{r.subject}</td>
                      <td>{r.max}</td>
                      <td>{r.marks}</td>
                      <td>{p.toFixed(1)}%</td>
                      <td><b>{gr.g}</b></td>
                      <td>{gr.r}</td>
                    </tr>
                  );
                })}
                <tr className="totals" style={{ background: "#fafafa", fontWeight: 700 }}>
                  <td style={{ textAlign: "left", paddingLeft: 10 }}>GRAND TOTAL</td>
                  <td>{max}</td>
                  <td>{total}</td>
                  <td>{pct.toFixed(1)}%</td>
                  <td>{overall.g}</td>
                  <td>{overall.r}</td>
                </tr>
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-4 mt-3 text-[11px]">
              <div className="border p-2">
                <div className="font-bold uppercase tracking-wide mb-1">Grade Scale (CBSE)</div>
                <div>A1: 91-100 · A2: 81-90 · B1: 71-80 · B2: 61-70</div>
                <div>C1: 51-60 · C2: 41-50 · D: 33-40 · E: &lt;33</div>
              </div>
              <div className="border p-2">
                <div className="font-bold uppercase tracking-wide mb-1">Co-Scholastic</div>
                <div>Work Education: A · Art Education: A</div>
                <div>Health & PE: A · Discipline: A</div>
              </div>
            </div>

            <div className="mt-3 border p-2 text-[12px]">
              <b>Class Teacher's Remarks:</b> {student.name.split(" ")[0]} has shown consistent effort this term. Encouraged to maintain the momentum through the final assessments.
            </div>

            <div className="footer flex justify-between mt-16 text-[11px]">
              <div className="sig border-t border-black pt-1 w-40 text-center">Class Teacher</div>
              <div className="sig border-t border-black pt-1 w-40 text-center">Examination Head</div>
              <div className="sig border-t border-black pt-1 w-40 text-center">Principal</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="outline" onClick={printCard}><Download className="h-4 w-4" />Download</Button>
          <Button onClick={printCard} className="gradient-primary border-0"><Printer className="h-4 w-4" />Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
