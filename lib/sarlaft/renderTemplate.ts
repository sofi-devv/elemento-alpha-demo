/**
 * Sustitución simple {{key}} en plantillas. Escapa HTML básico para evitar XSS en PDFs.
 */
export function escapeHtml(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return "";
  const t = String(s);
  return t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderTemplate(html: string, vars: Record<string, string | number>): string {
  let out = html;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(escapeHtml(v));
  }
  return out;
}
