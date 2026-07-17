import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { toast } from "sonner";

type Props<T extends Record<string, unknown>> = {
  rows: T[];
  fileName?: string;
  sheetName?: string;
  label?: string;
  /** Optional column projection: map of header -> accessor function. */
  columns?: { header: string; accessor: (row: T) => string | number | null | undefined }[];
  size?: "sm" | "default";
  variant?: "outline" | "default" | "secondary" | "ghost";
};

export function ExcelExport<T extends Record<string, unknown>>({
  rows, fileName = "export.xlsx", sheetName = "Sheet1",
  label = "Export", columns, size = "sm", variant = "outline",
}: Props<T>) {
  const handle = () => {
    if (!rows.length) { toast.error("No rows to export"); return; }
    const data = columns
      ? rows.map((r) => Object.fromEntries(columns.map((c) => [c.header, c.accessor(r) ?? ""])))
      : rows;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 30));
    XLSX.writeFile(wb, fileName);
    toast.success(`${rows.length} rows exported`);
  };

  return (
    <Button variant={variant} size={size} onClick={handle}>
      <FileDown className="h-4 w-4" />{label}
    </Button>
  );
}
