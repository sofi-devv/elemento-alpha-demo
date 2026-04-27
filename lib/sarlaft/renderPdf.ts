import { pdf } from "pdf-to-img";

export type RenderedPage = { index: number; buffer: Buffer; mimeType: "image/png" };

/**
 * Render each PDF page to a PNG buffer. Usa `pdf-to-img` (pdfjs + @napi-rs/canvas).
 * Si el render falla o el PDF es inválido, lanza. El extractor debe hacer fallback
 * a enviar el PDF original a Gemini.
 */
export async function renderPdfToPngPages(
  buf: Buffer,
  opts: { maxPages?: number; scale?: number } = {}
): Promise<RenderedPage[]> {
  const maxPages = opts.maxPages ?? 20;
  const scale = opts.scale ?? 2;
  const document = await pdf(buf, { scale });
  const pages: RenderedPage[] = [];
  let i = 0;
  for await (const png of document) {
    pages.push({ index: i + 1, buffer: png, mimeType: "image/png" });
    i += 1;
    if (i >= maxPages) break;
  }
  return pages;
}
