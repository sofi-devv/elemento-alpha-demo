/**
 * Parte de la respuesta de /api/sarlaft/extract; usable en cliente (sin pdf-parse).
 */
export type OcrReportItem = {
  docId: string;
  fileName: string;
  scanned: boolean;
  ocrUsed: boolean;
  ocrRetried: boolean;
  textLayerChars: number;
};
