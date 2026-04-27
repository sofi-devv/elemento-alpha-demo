import type { SagrilaftForm, SiNoNA, SagrilaftPoliticasPregunta } from "../schema";
import { escapeHtml } from "../renderTemplate";

const styles = `
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #1a1a1a; margin: 0; padding: 12mm; }
  h1 { font-size: 13pt; text-align: center; margin: 0 0 4mm; }
  h2 { font-size: 11pt; border-bottom: 1px solid #333; padding-bottom: 2px; margin: 4mm 0 2mm; }
  .muted { color: #555; font-size: 9pt; }
  table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
  th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; vertical-align: top; }
  th { background: #f3f3f3; }
  .row-qa { margin: 1mm 0; }
  .opt { display: inline-block; margin-right: 8px; }
`;

function sino(val: string): string {
  return escapeHtml(val);
}

function polRow(label: string, p: SagrilaftPoliticasPregunta): string {
  const d: string[] = [];
  if (p.respuesta === "Sí" && p.detalle_programa) {
    d.push(
      `Órgano: ${escapeHtml(p.detalle_programa.organo_aprobacion)} · Fecha: ${escapeHtml(p.detalle_programa.fecha_aprobacion)}`
    );
  }
  if (p.respuesta === "Sí" && p.detalle_regulacion) {
    d.push(`Normatividad: ${escapeHtml(p.detalle_regulacion.normatividad)}`);
  }
  if (p.respuesta === "Sí" && p.detalle_oficial) {
    d.push(
      `Nombre: ${escapeHtml(p.detalle_oficial.nombre)} · ID: ${escapeHtml(p.detalle_oficial.identificacion)} · ${escapeHtml(p.detalle_oficial.cargo)} · ${escapeHtml(p.detalle_oficial.email)} · ${escapeHtml(p.detalle_oficial.telefono)}`
    );
  }
  if (p.respuesta === "Sí" && p.detalle_cripto) {
    d.push(`Tipo operaciones: ${escapeHtml(p.detalle_cripto.tipo_operaciones)}`);
  }
  if (p.respuesta === "Sí" && p.detalle_sancion) {
    d.push(
      `Fecha: ${escapeHtml(p.detalle_sancion.fecha)} · ${escapeHtml(p.detalle_sancion.motivo)} · Autoridad: ${escapeHtml(p.detalle_sancion.autoridad)} · Estado: ${escapeHtml(p.detalle_sancion.estado_actual)}`
    );
  }
  return `
  <tr>
    <td style="width:48%;"><strong>${escapeHtml(p.pregunta || label)}</strong></td>
    <td style="width:12%;">${sino(p.respuesta)}</td>
    <td style="width:40%; font-size:9pt;">${d.length ? d.join("<br/>") : "—"}</td>
  </tr>`;
}

function otras14Rows(rows: { etiqueta: string; respuesta: SiNoNA }[]): string {
  return rows
    .map(
      (r) => `
  <tr>
    <td>${escapeHtml(r.etiqueta)}</td>
    <td style="text-align:center;">${sino(r.respuesta)}</td>
  </tr>`
    )
    .join("");
}

export const SAGRILAFT_HTML_WRAPPER = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<style>${styles}</style>
<title>SAGRILAFT / SARLAFT</title>
</head>
<body>
__BODY__
</body>
</html>`;

export function buildSagrilaftHtml(f: SagrilaftForm): string {
  const p = f.politicas;
  const body = `
  <h1>Cuestionario de Cumplimiento SAGRILAFT / SARLAFT</h1>
  <p class="muted">Prevención de Lavado de Activos y Financiación del Terrorismo</p>
  <h2>1. Información General</h2>
  <table>
    <tr><th>Campo</th><th>Valor</th></tr>
    <tr><td>Nombre completo / Razón social</td><td>${escapeHtml(f.nombre_completo_razon_social)}</td></tr>
    <tr><td>Tipo y No. Identificación</td><td>${escapeHtml(f.tipo_y_numero_identificacion)}</td></tr>
    <tr><td>No. oficinas en el País</td><td>${f.num_oficinas_pais ?? "—"}</td></tr>
    <tr><td>No. oficinas en el Exterior</td><td>${f.num_oficinas_exterior ?? "—"}</td></tr>
    <tr><td>Ciudades y Países de operación</td><td>${escapeHtml(f.ciudades_paises_operacion)}</td></tr>
  </table>
  <h2>2. Políticas y Procedimientos</h2>
  <p class="muted">Pregunta · Respuesta (Sí/No/N/A) · Detalles</p>
  <table>
    <tr><th>Pregunta</th><th>Resp.</th><th>Detalle</th></tr>
    ${polRow("", p.programa_laft_documentado)}
    ${polRow("", p.regulacion_gubernamental_laft)}
    ${polRow("", p.oficial_cumplimiento)}
    ${polRow("", p.operaciones_efectivo)}
    ${polRow("", p.activos_virtuales)}
    ${polRow("", p.sancionada_investigada)}
  </table>
  <h2>Otras 14 preguntas de control</h2>
  <table>
    <tr><th>Control</th><th>Resp.</th></tr>
    ${otras14Rows(p.otras_14_preguntas)}
  </table>
  <p class="muted" style="margin-top:6mm;">Documento generado automáticamente — Elemento Alpha · Vinculación</p>
  `;
  return SAGRILAFT_HTML_WRAPPER.replace("__BODY__", body);
}
