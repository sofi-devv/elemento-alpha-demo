import type { FatcaCrsForm } from "../schema";
import { escapeHtml } from "../renderTemplate";

const styles = `
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #1a1a1a; margin: 0; padding: 12mm; }
  h1 { font-size: 13pt; text-align: center; margin: 0 0 4mm; }
  h2 { font-size: 11pt; border-bottom: 1px solid #333; padding-bottom: 2px; margin: 4mm 0 2mm; }
  .muted { color: #555; font-size: 9pt; }
  table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
  th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
  th { background: #f3f3f3; }
`;

function tinRows(f: FatcaCrsForm): string {
  if (!f.ubo.paises_tin.length) {
    return "<tr><td colspan='2'>—</td></tr>";
  }
  return f.ubo.paises_tin
    .map(
      (r) => `
  <tr><td>${escapeHtml(r.pais)}</td><td>${escapeHtml(r.tin)}</td></tr>`
    )
    .join("");
}

export function buildFatcaCrsHtml(f: FatcaCrsForm): string {
  const cls =
    f.clasificacion_fatca_crs === "Otra" && f.clasificacion_otra
      ? `Otra: ${escapeHtml(f.clasificacion_otra)}`
      : escapeHtml(f.clasificacion_fatca_crs);
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>${styles}</style>
<title>FATCA / CRS</title>
</head>
<body>
  <h1>Auto-declaración Persona Jurídica FATCA y CRS</h1>
  <p class="muted">Cumplimiento de obligaciones tributarias internacionales</p>
  <h2>I. Identificación de la Entidad</h2>
  <table>
    <tr><th>Campo</th><th>Valor</th></tr>
    <tr><td>Razón social</td><td>${escapeHtml(f.razon_social)}</td></tr>
    <tr><td>NIT o equivalente</td><td>${escapeHtml(f.identificacion_tributaria)}</td></tr>
    <tr><td>País constitución/residencia fiscal</td><td>${escapeHtml(f.pais_constitucion_fiscal)}</td></tr>
  </table>
  <h2>II. Actividad principal de la Entidad</h2>
  <p>${escapeHtml(f.actividad_principal)}</p>
  <h2>III y IV. Clasificación FATCA/CRS</h2>
  <table>
    <tr><th>Pregunta</th><th>Respuesta</th></tr>
    <tr>
      <td>¿Al menos el 50% de ingresos/activos son pasivos?</td>
      <td>${escapeHtml(f.ingresos_activos_pasivos_50)}</td>
    </tr>
    <tr>
      <td>Clasificación</td>
      <td>${cls}</td>
    </tr>
  </table>
  <h2>Anexo: Individuo que ejerce control (Beneficiario final)</h2>
  <p><strong>Datos personales:</strong> ${escapeHtml(f.ubo.datos_personales)}</p>
  <p><strong>Países y TIN/NIT</strong></p>
  <table>
    <tr><th>País</th><th>TIN / NIT</th></tr>
    ${tinRows(f)}
  </table>
  <p><strong>Tipo de control:</strong> ${escapeHtml(f.ubo.tipo_control)}</p>
  <p class="muted" style="margin-top:6mm;">Documento generado automáticamente — Elemento Alpha</p>
</body>
</html>`;
}
