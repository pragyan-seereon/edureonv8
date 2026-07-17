import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScanText, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * UI-only "Image to Text" parser. Accepts an image, simulates OCR extraction
 * with a short delay, and returns a record of plausible field values that the
 * caller maps onto its own form via `onParsed`.
 *
 * `sample` lets each caller declare which fields it wants populated and with
 * what demo values, so a single component can be reused across modules.
 */
export type OcrFields = Record<string, string | number>;

type Props = {
  label?: string;
  sample: OcrFields;
  onParsed: (fields: OcrFields) => void;
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "default";
};

export function ImageOcrUpload({
  label = "Scan from Image",
  sample,
  onParsed,
  variant = "outline",
  size = "sm",
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (file: File) => {
    setBusy(true);
    toast.info(`Parsing ${file.name}… extracting text from image`);
    // Simulated OCR — in production this would call a vision model
    await new Promise((r) => setTimeout(r, 1100));
    onParsed(sample);
    setBusy(false);
    toast.success("Fields auto-filled from image");
  };

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={busy}
        onClick={() => ref.current?.click()}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ScanText className="h-4 w-4" />
        )}
        {label}
      </Button>
    </>
  );
}
