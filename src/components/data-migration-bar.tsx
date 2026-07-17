import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Col<T> = { header: string; accessor: (row: T) => string | number | null | undefined };

type Props<T extends Record<string, unknown>> = {
  /** Rows to export (usually the same data shown in the table). */
  rows: T[];
  /** Column projection — keeps export aligned with the visible table. */
  columns: Col<T>[];
  moduleName: string;
  fileName?: string;
  size?: "sm" | "default";
  /** Optional: apply imported rows back into the app (UI-only if omitted). */
  onApply?: (rows: Record<string, string>[]) => void;
};

/** Reusable Import/Export toolbar for data migration across modules. */
export function DataMigrationBar<T extends Record<string, unknown>>({
  rows, columns, moduleName, fileName, size = "sm", onApply,
}: Props<T>) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);

  const file = fileName ?? `${moduleName.toLowerCase().replace(/\s+/g, "-")}.xlsx`;

  const exportData = () => {
    if (!rows.length) { toast.error("No rows to export"); return; }
    const data = rows.map((r) => Object.fromEntries(columns.map((c) => [c.header, c.accessor(r) ?? ""])));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, moduleName.slice(0, 30));
    XLSX.writeFile(wb, file);
    toast.success(`Exported ${rows.length} ${moduleName} rows`);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([columns.map((c) => c.header)]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${moduleName.toLowerCase().replace(/\s+/g, "-")}-template.xlsx`);
  };

  const readFile = async (f: File) => {
    setBusy(true);
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { raw: false, defval: "" });
      if (!parsed.length) { toast.error("No rows found in the file"); return; }
      setPreview(parsed);
    } catch (e) {
      console.error(e);
      toast.error("Could not read the file");
    } finally { setBusy(false); }
  };

  const apply = () => {
    if (!preview) return;
    onApply?.(preview);
    toast.success(`${preview.length} rows imported into ${moduleName}`);
    setPreview(null);
  };

  const headers = preview ? Object.keys(preview[0]) : [];

  return (
    <>
      <input ref={ref} type="file" accept=".xlsx,.xls,.csv" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = ""; }} />
      <Button variant="outline" size={size} disabled={busy} onClick={() => ref.current?.click()}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}Import
      </Button>
      <Button variant="outline" size={size} onClick={exportData}><FileDown className="h-4 w-4" />Export</Button>

      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Import preview — {moduleName}</DialogTitle>
            <DialogDescription>{preview?.length ?? 0} rows detected. Review before updating the table.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-md">
            <Table>
              <TableHeader><TableRow>{headers.map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
              <TableBody>
                {preview?.slice(0, 50).map((r, i) => (
                  <TableRow key={i}>{headers.map((h) => <TableCell key={h} className="text-xs whitespace-nowrap">{r[h]}</TableCell>)}</TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" size="sm" onClick={downloadTemplate}>Download template</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPreview(null)}>Cancel</Button>
              <Button onClick={apply}>Apply to table</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}