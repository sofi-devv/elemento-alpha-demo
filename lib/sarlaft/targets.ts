import type { SarlaftPackage } from "./schema";

/** Variable pendiente que se manda a Gemini para guiar la extracción. */
export type ExtractionTarget = {
  path: string;
  label: string;
  hint?: string;
};

const isEmpty = (v: unknown) => v === null || v === undefined || (typeof v === "string" && !v.trim());
const isNum = (v: unknown) => typeof v === "number" && Number.isFinite(v);

/**
 * Dado un paquete parcial, devuelve los campos aún vacíos en un formato compacto,
 * apto para pasarlo como texto a Gemini (evita renderizar todo el JSON).
 */
export function buildTargets(pkg: SarlaftPackage): ExtractionTarget[] {
  const t: ExtractionTarget[] = [];
  const f1 = pkg.formulario_1;
  const f2 = pkg.formulario_2;
  const f3 = pkg.formulario_3;

  // Identificación de la empresa
  if (isEmpty(f1.nombre_completo_razon_social))
    t.push({ path: "formulario_1.nombre_completo_razon_social", label: "Razón social completa", hint: "Cámara de comercio / RUT." });
  if (isEmpty(f1.tipo_y_numero_identificacion))
    t.push({ path: "formulario_1.tipo_y_numero_identificacion", label: "Tipo y número de identificación (NIT + DV)" });
  if (isEmpty(f1.ciudades_paises_operacion))
    t.push({ path: "formulario_1.ciudades_paises_operacion", label: "Ciudades y países de operación", hint: "Domicilio principal, sucursales." });
  if (!isNum(f1.num_oficinas_pais))
    t.push({ path: "formulario_1.num_oficinas_pais", label: "Nº oficinas en el país (entero)" });
  if (!isNum(f1.num_oficinas_exterior))
    t.push({ path: "formulario_1.num_oficinas_exterior", label: "Nº oficinas en el exterior (entero)" });

  if (isEmpty(f2.razon_social))
    t.push({ path: "formulario_2.razon_social", label: "Razón social (formulario 2)" });
  if (isEmpty(f2.identificacion_tributaria))
    t.push({ path: "formulario_2.identificacion_tributaria", label: "NIT / identificación tributaria" });
  if (isEmpty(f2.pais_constitucion_fiscal))
    t.push({ path: "formulario_2.pais_constitucion_fiscal", label: "País de constitución / residencia fiscal" });
  if (isEmpty(f2.actividad_principal))
    t.push({
      path: "formulario_2.actividad_principal",
      label: "Actividad principal FATCA",
      hint: "Una de: a) Acepta depósitos (Bancos); b) Custodia activos financieros; c) Emite seguros con valor en efectivo; d) Negocios de instrumentos de inversión; e) Ninguna de las anteriores.",
    });
  if (isEmpty(f2.clasificacion_fatca_crs))
    t.push({
      path: "formulario_2.clasificacion_fatca_crs",
      label: "Clasificación FATCA/CRS",
      hint: "Entidad participante | Entidad holding | Entidad sin ánimo de lucro | Entidad gubernamental | Entidad cotizada en bolsa | Otra.",
    });
  if (f2.ingresos_activos_pasivos_50 !== "Sí" && f2.ingresos_activos_pasivos_50 !== "No")
    t.push({ path: "formulario_2.ingresos_activos_pasivos_50", label: "¿≥50% de ingresos/activos son pasivos? (Sí/No)" });

  // UBO
  if (isEmpty(f2.ubo.datos_personales))
    t.push({ path: "formulario_2.ubo.datos_personales", label: "Datos del beneficiario final (nombre, identificación)" });
  if (isEmpty(f2.ubo.tipo_control))
    t.push({
      path: "formulario_2.ubo.tipo_control",
      label: "Tipo de control UBO",
      hint: "Control por propiedad | Control por otros medios (voto) | Administrador (Directivo) | Fideicomitente / Beneficiario.",
    });
  if (!f2.ubo.paises_tin.length)
    t.push({ path: "formulario_2.ubo.paises_tin", label: "Lista de {pais, tin} del UBO" });

  // Empresa / finanzas
  if (isEmpty(f3.tipo_empresa))
    t.push({
      path: "formulario_3.tipo_empresa",
      label: "Tipo de empresa",
      hint: "Pública | S.A. | LTDA | S.A.S. | Otro (usa lo que figure en cámara de comercio).",
    });
  if (f3.administra_recursos_publicos !== "Sí" && f3.administra_recursos_publicos !== "No")
    t.push({ path: "formulario_3.administra_recursos_publicos", label: "¿Administra recursos públicos? (Sí/No)" });

  const c = f3.cifras_financieras;
  (["ingresos", "egresos", "total_activos", "total_pasivos", "total_patrimonio"] as const).forEach((k) => {
    if (!isNum(c[k]))
      t.push({ path: `formulario_3.cifras_financieras.${k}`, label: `Cifra ${k} (COP, entero sin símbolo)`, hint: "Sácalo del balance/ERI o certificación financiera." });
  });

  if (isEmpty(f3.grupo_contable_niif))
    t.push({
      path: "formulario_3.grupo_contable_niif",
      label: "Grupo contable NIIF",
      hint: "Grupo 1 (Plenas) | Grupo 2 (Pymes) | Grupo 3 (SFC) | Grupo 4 (Otros).",
    });

  if (isEmpty(f3.ciclo_empresa))
    t.push({
      path: "formulario_3.ciclo_empresa",
      label: "Ciclo de la empresa",
      hint: "Joven/Crecimiento | Trayectoria/Rentabilizar | Madura/Optimización tributaria. Sólo si se deduce de estados/comentarios; si no, omite.",
    });
  if (isEmpty(f3.liquidez))
    t.push({
      path: "formulario_3.liquidez",
      label: "Relevancia de la liquidez",
      hint: "Muy relevante | Algo relevante | Nada relevante.",
    });
  if (isEmpty(f3.experiencia_inversion))
    t.push({
      path: "formulario_3.experiencia_inversion",
      label: "Experiencia en inversiones",
      hint: "Cuentas/CDT | Fondos de Inversión | Bonos/Acciones | Derivados/Capital Privado.",
    });
  if (isEmpty(f3.tolerancia_riesgo))
    t.push({
      path: "formulario_3.tolerancia_riesgo",
      label: "Tolerancia al riesgo",
      hint: "Retirar todo | Retirar parte | Esperar/Invertir más aprovechando precios bajos.",
    });

  if (isEmpty(f3.representantes_ordenates))
    t.push({ path: "formulario_3.representantes_ordenates", label: "Representante legal y ordenantes (nombre, cédula, cargo)" });
  if (f3.es_pep !== "Sí" && f3.es_pep !== "No")
    t.push({ path: "formulario_3.es_pep", label: "¿Es o está vinculado con PEP? (Sí/No)" });

  if (!f3.accionistas.length)
    t.push({
      path: "formulario_3.accionistas",
      label: "Composición accionaria (lista completa)",
      hint: "Array de {nombre, id (CC o NIT), porcentaje:number, cotiza_en_bolsa:\"Sí\"|\"No\"}. Incluye TODAS las filas del certificado/documento.",
    });
  if (!f3.calidad_beneficiario_final.length)
    t.push({
      path: "formulario_3.calidad_beneficiario_final",
      label: "Calidad del beneficiario final (array)",
      hint: "Por Titularidad (Capital / Derechos de voto) | Por Beneficio (Activos / Rendimientos / Utilidades) | Por Control (Representante legal / Mayor autoridad).",
    });

  return t;
}

/** Texto compacto para incrustar en el prompt. */
export function formatTargetsForPrompt(targets: ExtractionTarget[]): string {
  if (!targets.length) return "Sin pendientes (solo agrega datos que confirmen los ya extraídos).";
  const lines = targets.map((t, i) => {
    const hint = t.hint ? ` — ${t.hint}` : "";
    return `${i + 1}. ${t.path} · ${t.label}${hint}`;
  });
  return lines.join("\n");
}
