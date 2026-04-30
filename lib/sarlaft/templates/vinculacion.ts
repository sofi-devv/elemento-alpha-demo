import type { VinculacionForm } from "../schema";
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

function formatNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("es-CO", { maximumFractionDigits: 0 });
}

function accRows(f: VinculacionForm): string {
  if (!f.accionistas.length) {
    return "<tr><td colspan='4'>—</td></tr>";
  }
  return f.accionistas
    .map(
      (a) => `
  <tr>
    <td>${escapeHtml(a.nombre)}</td>
    <td>${escapeHtml(a.id)}</td>
    <td style="text-align:right;">${a.porcentaje ?? "—"}</td>
    <td>${escapeHtml(a.cotiza_en_bolsa)}</td>
  </tr>`
    )
    .join("");
}

export function buildVinculacionHtml(f: VinculacionForm): string {
  const c = f.cifras_financieras;
  const cal = f.calidad_beneficiario_final.map((x) => escapeHtml(x)).join("; ");
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>${styles}</style>
<title>Vinculación PJ</title>
</head>
<body>
  <h1>Solicitud de Vinculación Persona Jurídica</h1>
  <p class="muted">Apertura comercial, perfilamiento financiero y firmas autorizadas</p>
  <h2>1. Información básica y financiera (COP)</h2>
  <table>
    <tr><th>Concepto</th><th>Valor</th></tr>
    <tr><td>Tipo de empresa</td><td>${escapeHtml(f.tipo_empresa)}</td></tr>
    <tr><td>Ingresos</td><td>${formatNum(c.ingresos)}</td></tr>
    <tr><td>Egresos</td><td>${formatNum(c.egresos)}</td></tr>
    <tr><td>Total activos</td><td>${formatNum(c.total_activos)}</td></tr>
    <tr><td>Total pasivos</td><td>${formatNum(c.total_pasivos)}</td></tr>
    <tr><td>Total patrimonio</td><td>${formatNum(c.total_patrimonio)}</td></tr>
    <tr><td>¿Administra recursos públicos?</td><td>${escapeHtml(f.administra_recursos_publicos)}</td></tr>
    <tr><td>Grupo contable NIIF</td><td>${escapeHtml(f.grupo_contable_niif)}</td></tr>
  </table>
  <h2>2. Perfil de inversión</h2>
  <table>
    <tr><th>Concepto</th><th>Valor</th></tr>
    <tr><td>Ciclo de la empresa</td><td>${escapeHtml(f.ciclo_empresa)}</td></tr>
    <tr><td>Liquidez</td><td>${escapeHtml(f.liquidez)}</td></tr>
    <tr><td>Experiencia en inversiones</td><td>${escapeHtml(f.experiencia_inversion)}</td></tr>
    <tr><td>Tolerancia al riesgo</td><td>${escapeHtml(f.tolerancia_riesgo)}</td></tr>
  </table>
  <h2>3. Representantes, ordenantes y PEPs</h2>
  <p>${escapeHtml(f.representantes_ordenates)}</p>
  <p><strong>PEP</strong> ${escapeHtml(f.es_pep)}</p>
  ${
    f.es_pep === "Sí" && f.pep_detalle
      ? `<p class="muted">Cargo: ${escapeHtml(f.pep_detalle.cargo_publico)} · Vinculación: ${escapeHtml(
          f.pep_detalle.fecha_vinculacion
        )} · Parentesco: ${escapeHtml(f.pep_detalle.tipo_parentesco)}</p>`
      : ""
  }
  <h2>4. Composición accionaria y beneficiarios finales</h2>
  <table>
    <tr><th>Nombre</th><th>ID</th><th>%</th><th>¿Cotiza?</th></tr>
    ${accRows(f)}
  </table>
  <p><strong>Calidad de beneficiario final:</strong> ${cal || "—"}</p>
  <p class="muted" style="margin-top:6mm;">Documento generado automáticamente — Elemento Alpha</p>
</body>
</html>`;
}
