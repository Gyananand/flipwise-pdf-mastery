import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerSrc;

export async function extractPdfText(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;
  const total = pdf.numPages;
  const parts: string[] = [];

  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ");
    parts.push(text);
    onProgress?.(Math.round((i / total) * 100));
  }
  return parts.join("\n\n").replace(/\s+/g, " ").trim();
}
