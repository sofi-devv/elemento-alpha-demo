import pdf from "pdf-parse";
import type { SarlaftPackage } from "./schema";
import type { ExtractionTarget } from "./targets";
import { formatTargetsForPrompt } from "./targets";

export type { OcrReportItem } from "./ocrTypes";

/** PDFs con poca o ninguna capa de texto se tratan como escaneados. */
export const MIN_PDF_TEXT_CHARS = 80;
/** Chars de texto por página por debajo de esto sugiere escaneo. */
export const MAX_CHARS_PER_PAGE = 30;

export const EXTRACT_PROMPT = `Eres un experto en cumplimiento (SARLAFT/KYC) en Colombia. Tienes UN documento por petición. Extrae al JSON todo lo que el documento muestre de forma explícita: texto corrido, sellos, tablas y celdas. Lee filas y columnas completas (estados financieros, accionariado, tablas de socios, etc.).

Cómo extraer (sin inventar):
- SÍ: transcribe razón social, NIT, direcciones, representante legal, socios, porcentajes, cifras e IDs que estén en el documento, aunque estén en tablas o varias secciones.
- NO: inventar datos que no aparezcan; no rellenar con plantillas. Si un número o nombre no se lee con claridad, null.
- Cifras y NIT: copia el texto/valor visible; en tablas, no te saltes filas.
Responde ÚNICAMENTE con un JSON parcial (formularios 1, 2 y 3). Sin markdown.`;

export const OUTPUT_INSTRUCTION = `Estructura de salida: parcial, formulario_1, formulario_2, formulario_3. Numéricos en COP sin símbolos.

Mapeo sugerido según el tipo de documento (rellena lo que aplique a ESTE archivo):
- Cámara de comercio / certificado / matrícula: formulario_2.razon_social, formulario_2.identificacion_tributaria, formulario_2.pais_constitucion_fiscal, formulario_1.nombre_completo_razon_social, formulario_1.tipo_y_numero_identificacion, representación legal, domicilio si está; formulario_3.tipo_empresa (Pública, S.A., LTDA, S.A.S., Otro) si consta, formulario_3.representantes_ordenates (nombres/cargos de representantes legales o apoderados visibles).
- RUT/actualización: NIT, razón social, actividad económica, dirección, formulario_2 según celdas, formulario_1 cifras de empleados u oficinas si vienen cifras.
- Estados financieros / notas: formulario_3.cifras_financieras (ingresos, egresos, total_activos, total_pasivos, total_patrimonio) según balance/estado de resultados; formulario_3.grupo_contable_niif si se deduce con claridad; ciclo_empresa, liquidez, experiencia, tolerancia_riesgo solo si el documento o anexo de perfil lo menciona (si no, omite o null).
- Composición accionaria / accionistas / socios: formulario_3.accionistas como array; por cada fila: nombre, id (Cédula/NIT/identificación si consta), porcentaje (número), cotiza_en_bolsa "Sí" o "No" si aplica, si no "".
- Cédula: formulario_2.ubo o datos de representante; nombre e identificación en campos adecuados.
- Múltiples secciones en un solo PDF: combina en un solo JSON parcial con todos los hechos leíbles.

Listas: incluye TODOS los accionistas o filas visibles, no solo el primero.
tipo_empresa: Pública | S.A. | LTDA | S.A.S. | Otro. actividad_principal: opción a)–e) de FatcaActividad o "" si el documento no la clasifica así.`;

export const OCR_FIRST_PROMPT = `Este documento parece ser un escaneo o imagen con poca o ninguna capa de texto.
PASO 1: Transcribe literalmente TODO el texto visible, respetando filas y columnas de tablas.
PASO 2: Con base en esa transcripción, extrae los campos solicitados en el JSON.
Devuelve SOLO el JSON final, sin explicación ni transcripción en el cuerpo (la extracción debe reflejarse en el JSON).`;

export const OCR_AGGRESSIVE_PROMPT = `Reintento: el documento es escaneo o el primer intento no extrajo nada. Lee con máxima atención el texto o imagen.
Solo incluye en el JSON lo que el documento muestre con claridad (aunque sea parcial). No inventes NIT, nombres, cifras ni fechas: si el texto no es legible, null. Nunca rellenar "para que el JSON tenga datos".
Responde ÚNICAMENTE con JSON (parcial) según el schema, sin explicación.`;

/** Instrucción de sistema para Gemini: refuerza extracción literal, sin relleno. */
export const GEMINI_EXTRACT_SYSTEM = `Salida: solo JSON, sin markdown. Incluye todos los campos del documento que sean legibles. No inventes cifras ni NIT: null si no se ve. No omitas tablas completas (p. ej. accionistas o estados) por brevedad.`;

/**
 * Prompt para el nuevo flujo "una petición por documento" con páginas como imágenes.
 * El documento se manda como N imágenes (una por página) en orden; además se le pasa
 * la lista de variables pendientes y el JSON acumulado para que no sobrescriba datos buenos.
 */
export function buildPerDocPrompt(params: {
  docId: string;
  docName: string;
  pageCount: number;
  targets: ExtractionTarget[];
  currentPartialJson: string;
  scanned: boolean;
  aggressive?: boolean;
}): string {
  const { docId, docName, pageCount, targets, currentPartialJson, scanned, aggressive } = params;

  const header = aggressive
    ? `Reintento con máxima atención: la primera pasada no sacó nada. Transcribe mentalmente cada página y extrae lo legible.`
    : scanned
      ? `Este documento parece escaneado (poca capa de texto). Lee las imágenes como OCR y devuelve el JSON.`
      : `Documento nativo con texto y tablas.`;

  const targetsBlock = formatTargetsForPrompt(targets);

  return `${header}

Contexto — tienes UN solo documento: "${docName}" (docId="${docId}") con ${pageCount} ${pageCount === 1 ? "página/imagen" : "páginas como imágenes"} en orden.
Mira TODAS las páginas como contexto continuo: la información se puede repartir entre ellas (portada, tablas, anexos).

Variables AÚN PENDIENTES (solo estas importan; si este documento no las tiene, déjalas null/"" y no inventes):
${targetsBlock}

Estado actual del paquete (ya extraído por documentos previos). NO lo sobrescribas con null ni con valores peores; solo devuelve lo que hoy PUEDES confirmar o mejorar con este documento:
\`\`\`json
${currentPartialJson}
\`\`\`

Reglas estrictas:
- Devuelve ÚNICAMENTE un JSON parcial con keys formulario_1 / formulario_2 / formulario_3.
- Incluye SOLO campos que este documento soporte con evidencia visible (texto, tabla, sello, celda).
- Tablas (accionistas, estados financieros): lee TODAS las filas y columnas visibles en las imágenes; nada de resumir ni quedarte con la primera fila.
- Cifras en COP sin símbolos; porcentajes como número.
- Si un campo pendiente no aparece en este documento, NO lo pongas en el JSON (mejor omitir que meter null).
- No rellenes campos a partir de plantillas, contexto previo o suposiciones.

Mapeo rápido según tipo de documento:
- Cámara de comercio / certificado: razón social, NIT, domicilio, tipo_empresa, representantes_ordenates, accionistas si aparecen.
- RUT: NIT, razón social, actividad económica, dirección fiscal.
- Estados financieros: cifras_financieras (ingresos, egresos, total_activos, total_pasivos, total_patrimonio), grupo_contable_niif si consta.
- Cédula: UBO (datos_personales, identificación) y/o representante legal.
- Accionistas / composición accionaria: array completo con {nombre, id, porcentaje, cotiza_en_bolsa}.

No respondas con markdown ni explicaciones. Solo el JSON.`;
}

/**
 * Heurística: PDF sin suficiente texto = escaneo.
 * Usamos `pdf-parse@1.1.1` (función clásica): evita el worker de pdfjs-dist v4
 * que con Turbopack/Next en dev apunta a `pdf.worker.mjs` inexistente.
 * Si aun así falla, forzamos escaneo para que Gemini OCREe.
 */
export async function detectScannedPdf(
  buf: Buffer
): Promise<{ scanned: boolean; chars: number; pages: number; failed?: boolean }> {
  try {
    const data = await pdf(buf);
    const text = (data.text || "").trim();
    const numpages = Math.max(1, data.numpages || 1);
    const chars = text.length;
    const lowText = chars < MIN_PDF_TEXT_CHARS;
    const lowPerPage = chars / numpages < MAX_CHARS_PER_PAGE;
    const scanned = lowText || lowPerPage;
    return { scanned, chars, pages: numpages };
  } catch (err) {
    console.warn("detectScannedPdf fallback (scanned=true):", err instanceof Error ? err.message : err);
    return { scanned: true, chars: 0, pages: 1, failed: true };
  }
}

/**
 * Cuenta valores hoja informativos (no null, no "", arrays con elemento, objetos con al menos un valor informativo).
 */
export function countMeaningfulFields(value: unknown, depth = 0): number {
  if (depth > 20) return 0;
  if (value === null || value === undefined) return 0;
  if (typeof value === "string") return value.trim().length > 0 ? 1 : 0;
  if (typeof value === "number") return 1;
  if (typeof value === "boolean") return 1;
  if (Array.isArray(value)) {
    if (value.length === 0) return 0;
    return value.reduce((acc, v) => acc + countMeaningfulFields(v, depth + 1), 0);
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).reduce<number>(
      (acc, v) => acc + countMeaningfulFields(v, depth + 1),
      0
    );
  }
  return 0;
}

/**
 * "Vacío" = ningún dato fáctico extraíble en el parcial.
 */
export function isEmptyDocExtraction(partial: unknown): boolean {
  if (partial == null) return true;
  if (typeof partial !== "object") return true;
  return countMeaningfulFields(partial) === 0;
}

/**
 * Reintento post-chequeo: totalmente vacío, o escaneo con ≤1 campo informado.
 */
export function shouldRetryWithAggressiveOcr(
  partial: Partial<SarlaftPackage> | null | undefined,
  scanned: boolean
): boolean {
  if (partial == null) return true;
  const n = countMeaningfulFields(partial);
  if (n === 0) return true;
  if (scanned && n <= 1) return true;
  return false;
}
