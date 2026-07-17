import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Printer, Download, FileText, Building2, CalendarDays, Stamp } from "lucide-react";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export type AuditSection = {
  title: string;
  rows: { label: string; value: number | string; note?: string; emphasis?: boolean }[];
};

export type AuditReportData = {
  reportTitle: string;
  reportSubtitle?: string;
  reportCode: string;            // e.g. AUD/FIN/2026-Q1
  period: string;                // e.g. April 2025 – March 2026
  preparedBy: string;
  reviewedBy: string;
  approvedBy: string;
  institute: string;             // school name
  ackNo?: string;                // 16-digit ack
  summary: { label: string; value: number; tone?: "in" | "out" | "net" }[];
  sections: AuditSection[];
  observations: string[];
  conclusion: string;
  /** Optional detailed blocks — rendered only when supplied. */
  assurance?: string;            // e.g. "Reasonable assurance engagement"
  scope?: string[];
  methodology?: string[];
  ratios?: { label: string; value: string; benchmark?: string; status?: "good" | "watch" | "risk" }[];
  ageing?: { bucket: string; amount: number; count: number }[];
};

function fmt(v: number | string) {
  return typeof v === "number" ? inr(v) : v;
}

export function FinanceAuditReport({
  open, onOpenChange, data,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: AuditReportData | null;
}) {
  if (!data) return null;

  let __sec = 0;
  const nextN = () => `${++__sec}.0`;

  const handlePrint = () => window.print();
  const handleDownload = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const html = document.getElementById("audit-report-printable")?.outerHTML ?? "";
    w.document.write(`<!doctype html><html><head><title>${data.reportTitle}</title>
      <style>
        body{font-family: ui-serif, Georgia, "Times New Roman", serif; color:#111; padding:32px; max-width:880px; margin:auto;}
        h1,h2,h3{font-family: ui-sans-serif, system-ui;}
        table{width:100%; border-collapse:collapse; margin: 8px 0 16px;}
        th,td{border:1px solid #bbb; padding:6px 8px; font-size:12px; text-align:left;}
        th{background:#f3f4f6;}
        .right{text-align:right;}
        .muted{color:#666; font-size:11px;}
        .stamp{border:2px solid #16a34a; color:#16a34a; padding:6px 14px; display:inline-block; transform:rotate(-6deg); font-weight:700; letter-spacing:2px;}
        .head{border-bottom:3px double #111; padding-bottom:10px; margin-bottom:14px;}
        .grid{display:grid; grid-template-columns:1fr 1fr; gap:8px;}
        .sigs{display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-top:32px; text-align:center; font-size:12px;}
        .sigs > div{border-top:1px solid #555; padding-top:6px;}
      </style></head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Toolbar */}
        <div className="px-4 sm:px-6 py-3 border-b flex items-center justify-between gap-2 bg-muted/30">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <div className="text-sm font-medium truncate">Finance Audit Report Preview</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-3.5 w-3.5" />Print</Button>
            <Button size="sm" className="gradient-primary border-0" onClick={handleDownload}><Download className="h-3.5 w-3.5" />Download</Button>
          </div>
        </div>

        {/* Report body */}
        <div className="flex-1 overflow-y-auto bg-[#f6f5f1]">
          <article id="audit-report-printable" className="max-w-3xl mx-auto my-4 sm:my-8 bg-white shadow-sm border border-border/60 p-5 sm:p-10 font-serif text-foreground">
            {/* Letterhead */}
            <header className="border-b-4 border-double border-foreground pb-4 mb-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><Building2 className="h-3 w-3" />{data.institute}</div>
                  <h1 className="font-display text-xl sm:text-2xl font-bold mt-1">{data.reportTitle}</h1>
                  {data.reportSubtitle && <p className="text-xs text-muted-foreground italic mt-0.5">{data.reportSubtitle}</p>}
                </div>
                <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                  <div className="h-14 w-14 rounded-full border-2 border-foreground/70 grid place-items-center bg-muted/20">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Audited</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-1 gap-x-3 mt-4 text-[11px]">
                <Meta k="Report Code" v={data.reportCode} />
                <Meta k="Period" v={data.period} />
                <Meta k="Generated" v={new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
                <Meta k="Ack. No." v={data.ackNo ?? randomAck()} mono />
              </div>
              {data.assurance && (
                <div className="mt-3 text-[11px] flex items-center gap-1.5 text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-success" /> Engagement type: <span className="font-semibold text-foreground">{data.assurance}</span>
                </div>
              )}
            </header>

            {/* Summary */}
            <section className="mb-5">
              <SectionTitle n={nextN()} t="Executive Summary" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {data.summary.map((s, i) => (
                  <div key={i} className={`border p-3 rounded-sm ${s.tone === "in" ? "bg-success/5 border-success/30" : s.tone === "out" ? "bg-warning/5 border-warning/30" : "bg-muted/30 border-border"}`}>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
                    <div className={`font-display text-lg font-bold mt-1 ${s.tone === "in" ? "text-success" : s.tone === "out" ? "text-warning" : ""}`}>{inr(s.value)}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Scope of Audit */}
            {data.scope && data.scope.length > 0 && (
              <section className="mb-5">
                <SectionTitle n={nextN()} t="Scope of the Engagement" />
                <ul className="list-disc list-inside space-y-1 text-[12px] leading-relaxed">
                  {data.scope.map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              </section>
            )}

            {/* Methodology */}
            {data.methodology && data.methodology.length > 0 && (
              <section className="mb-5">
                <SectionTitle n={nextN()} t="Audit Methodology & Procedures" />
                <ol className="list-decimal list-inside space-y-1 text-[12px] leading-relaxed">
                  {data.methodology.map((o, i) => <li key={i}>{o}</li>)}
                </ol>
              </section>
            )}

            {/* Sections */}
            {data.sections.map((sec, idx) => (
              <section key={idx} className="mb-5">
                <SectionTitle n={nextN()} t={sec.title} />
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="border border-border px-2 py-1.5 text-left font-semibold w-[60%]">Particulars</th>
                      <th className="border border-border px-2 py-1.5 text-right font-semibold">Amount (₹)</th>
                      <th className="border border-border px-2 py-1.5 text-left font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sec.rows.map((r, i) => (
                      <tr key={i} className={r.emphasis ? "bg-muted/30 font-semibold" : ""}>
                        <td className="border border-border px-2 py-1.5">{r.label}</td>
                        <td className="border border-border px-2 py-1.5 text-right font-mono">{fmt(r.value)}</td>
                        <td className="border border-border px-2 py-1.5 text-xs text-muted-foreground">{r.note ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}

            {/* Ageing of receivables */}
            {data.ageing && data.ageing.length > 0 && (
              <section className="mb-5">
                <SectionTitle n={nextN()} t="Ageing Analysis of Receivables" />
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="border border-border px-2 py-1.5 text-left font-semibold">Ageing Bucket</th>
                      <th className="border border-border px-2 py-1.5 text-right font-semibold">No. of Students</th>
                      <th className="border border-border px-2 py-1.5 text-right font-semibold">Amount (₹)</th>
                      <th className="border border-border px-2 py-1.5 text-right font-semibold">% of Dues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const tot = data.ageing!.reduce((a, b) => a + b.amount, 0) || 1;
                      return data.ageing!.map((b, i) => (
                        <tr key={i}>
                          <td className="border border-border px-2 py-1.5">{b.bucket}</td>
                          <td className="border border-border px-2 py-1.5 text-right font-mono">{b.count}</td>
                          <td className="border border-border px-2 py-1.5 text-right font-mono">{inr(b.amount)}</td>
                          <td className="border border-border px-2 py-1.5 text-right font-mono">{((b.amount / tot) * 100).toFixed(1)}%</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </section>
            )}

            {/* Key financial ratios */}
            {data.ratios && data.ratios.length > 0 && (
              <section className="mb-5">
                <SectionTitle n={nextN()} t="Key Financial Indicators & Ratios" />
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="border border-border px-2 py-1.5 text-left font-semibold">Indicator</th>
                      <th className="border border-border px-2 py-1.5 text-right font-semibold">Value</th>
                      <th className="border border-border px-2 py-1.5 text-left font-semibold">Benchmark</th>
                      <th className="border border-border px-2 py-1.5 text-left font-semibold">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ratios.map((r, i) => (
                      <tr key={i}>
                        <td className="border border-border px-2 py-1.5">{r.label}</td>
                        <td className="border border-border px-2 py-1.5 text-right font-mono font-semibold">{r.value}</td>
                        <td className="border border-border px-2 py-1.5 text-xs text-muted-foreground">{r.benchmark ?? "—"}</td>
                        <td className="border border-border px-2 py-1.5 text-xs">{r.status === "good" ? "Within norms" : r.status === "watch" ? "Monitor" : r.status === "risk" ? "Attention" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {/* Observations */}
            <section className="mb-5">
              <SectionTitle n={nextN()} t="Audit Observations" />
              <ol className="list-decimal list-inside space-y-1.5 text-[12px] leading-relaxed">
                {data.observations.map((o, i) => <li key={i}>{o}</li>)}
              </ol>
            </section>

            {/* Conclusion */}
            <section className="mb-6">
              <SectionTitle n={nextN()} t="Independent Auditor's Opinion" />
              <p className="text-[12px] leading-relaxed italic">{data.conclusion}</p>
            </section>

            {/* Signatures */}
            <footer className="mt-8 pt-4 border-t border-foreground/20">
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-[11px]">
                  <Signature title="Prepared by" name={data.preparedBy} />
                  <Signature title="Reviewed by" name={data.reviewedBy} />
                  <Signature title="Approved by" name={data.approvedBy} />
                </div>
                <div className="shrink-0">
                  <Badge variant="outline" className="bg-success/10 text-success border-success/40 px-3 py-1 rotate-[-6deg] font-display font-bold tracking-[0.2em] gap-1">
                    <Stamp className="h-3 w-3" />AUDITED
                  </Badge>
                </div>
              </div>
              <div className="mt-6 text-[10px] text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" />
                System-generated · This is an internal finance audit report. Retain for 7 years per statutory requirements.
              </div>
            </footer>
          </article>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Meta({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{k}</span>
      <span className={mono ? "font-mono text-[11px]" : "text-[12px]"}>{v}</span>
    </div>
  );
}

function SectionTitle({ n, t }: { n: string; t: string }) {
  return (
    <h2 className="font-display text-sm font-bold uppercase tracking-wider mb-2 flex items-baseline gap-2 border-b border-foreground/20 pb-1">
      <span className="text-primary">{n}</span><span>{t}</span>
    </h2>
  );
}

function Signature({ title, name }: { title: string; name: string }) {
  return (
    <div>
      <div className="h-10 border-b border-foreground/60" />
      <div className="mt-1 font-semibold">{name}</div>
      <div className="text-muted-foreground">{title}</div>
    </div>
  );
}

function randomAck() {
  let s = "";
  for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 10);
  return s.replace(/(.{4})/g, "$1 ").trim();
}
