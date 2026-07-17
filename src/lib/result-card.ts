// Printable result card (opens a print window) + parent-portal payload helpers.
export type ResultCardData = {
  studentName: string;
  admissionNo: string;
  className: string;
  section: string;
  category: string;
  subjects: { subject: string; marks: number; max: number }[];
  school?: string;
};

function gradeFor(pct: number) {
  if (pct >= 91) return "A1";
  if (pct >= 81) return "A2";
  if (pct >= 71) return "B1";
  if (pct >= 61) return "B2";
  if (pct >= 51) return "C1";
  if (pct >= 41) return "C2";
  if (pct >= 33) return "D";
  return "E";
}

export function printResultCard(d: ResultCardData) {
  const total = d.subjects.reduce((a, s) => a + (s.marks || 0), 0);
  const max = d.subjects.reduce((a, s) => a + s.max, 0) || 1;
  const pct = Math.round((total / max) * 1000) / 10;
  const rows = d.subjects
    .map((s) => {
      const p = s.max ? Math.round((s.marks / s.max) * 1000) / 10 : 0;
      return `<tr><td>${s.subject}</td><td class="c">${s.max}</td><td class="c">${s.marks ?? 0}</td><td class="c">${p}%</td><td class="c">${gradeFor(p)}</td></tr>`;
    })
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Result — ${d.studentName}</title>
  <style>
    *{font-family:'Segoe UI',Arial,sans-serif;box-sizing:border-box}
    body{margin:0;padding:40px;color:#1f2937}
    .card{max-width:760px;margin:0 auto;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden}
    .hd{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;padding:24px 28px}
    .hd h1{margin:0;font-size:22px}
    .hd p{margin:4px 0 0;opacity:.9;font-size:13px}
    .meta{display:flex;flex-wrap:wrap;gap:16px;padding:20px 28px;background:#f9fafb;font-size:13px}
    .meta b{color:#111827}
    table{width:100%;border-collapse:collapse;margin:8px 28px 0;width:calc(100% - 56px)}
    th,td{border:1px solid #e5e7eb;padding:9px 12px;font-size:13px;text-align:left}
    th{background:#f3f4f6}
    td.c,th.c{text-align:center}
    .sum{display:flex;gap:24px;padding:20px 28px}
    .sum div{flex:1;text-align:center;border:1px solid #e5e7eb;border-radius:10px;padding:14px}
    .sum .v{font-size:22px;font-weight:700;color:#4f46e5}
    .sum .l{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.04em}
    .ft{padding:16px 28px;font-size:11px;color:#9ca3af;text-align:center}
    @media print{body{padding:0}.card{border:none}}
  </style></head><body>
  <div class="card">
    <div class="hd"><h1>${d.school ?? "Edureon School"}</h1><p>Statement of Marks · ${d.category}</p></div>
    <div class="meta">
      <span><b>Student:</b> ${d.studentName}</span>
      <span><b>Adm No:</b> ${d.admissionNo}</span>
      <span><b>Class:</b> ${d.className}-${d.section}</span>
    </div>
    <table><thead><tr><th>Subject</th><th class="c">Max</th><th class="c">Marks</th><th class="c">%</th><th class="c">Grade</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="sum">
      <div><div class="v">${total}/${max}</div><div class="l">Total</div></div>
      <div><div class="v">${pct}%</div><div class="l">Percentage</div></div>
      <div><div class="v">${gradeFor(pct)}</div><div class="l">Overall Grade</div></div>
    </div>
    <div class="ft">Computer-generated result card · Generated ${new Date().toLocaleString("en-IN")}</div>
  </div>
  <script>window.onload=()=>{window.print()}</script>
  </body></html>`;
  const w = window.open("", "_blank", "width=840,height=1000");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}
