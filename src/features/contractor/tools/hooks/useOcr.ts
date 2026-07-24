/**
 * useOcr — client hook that wraps the `ocrReceipt` server function.
 *
 * Single call site pattern: hand it a File, get back the OCR result
 * (or `null` if the extraction failed). Toast + error handling are
 * done at the call site so this stays a thin, reusable primitive.
 */
import { useCallback, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ocrReceipt, type OcrResult } from "@/lib/finanz-ocr.functions";

async function fileToBase64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result ?? "");
      const idx = s.indexOf(",");
      resolve(idx >= 0 ? s.slice(idx + 1) : s);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function useOcr() {
  const runOcr = useServerFn(ocrReceipt);
  const [busy, setBusy] = useState(false);

  const scan = useCallback(
    async (file: File): Promise<OcrResult | null> => {
      if (!file.type.startsWith("image/")) return null;
      setBusy(true);
      try {
        const fileBase64 = await fileToBase64(file);
        return await runOcr({ data: { fileBase64, mime: file.type } });
      } finally {
        setBusy(false);
      }
    },
    [runOcr],
  );

  return { scan, busy };
}

export type { OcrResult };
