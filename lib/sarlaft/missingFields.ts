import type { MissingFieldRef, SarlaftPackage, SiNoNA, SagrilaftPoliticasPregunta } from "./schema";
import {
  FATCA_ACTIVIDAD_OPTIONS,
  FATCA_CLASIFICACION_OPTIONS,
} from "./fieldOptions";

const isEmpty = (s: string | null | undefined) => !s || !String(s).trim();
const isNullNum = (n: number | null | undefined) => n === null || n === undefined;

function isInvalidSiNoNA(v: string): boolean {
  return v !== "Sí" && v !== "No" && v !== "N/A";
}

function needDetalleSino(p: SagrilaftPoliticasPregunta, kind: "programa" | "regulacion" | "oficial" | "cripto" | "sancion" | "none"): boolean {
  if (p.respuesta !== "Sí") return false;
  if (kind === "none") return false;
  if (kind === "programa") {
    if (!p.detalle_programa) return true;
    return isEmpty(p.detalle_programa.organo_aprobacion) || isEmpty(p.detalle_programa.fecha_aprobacion);
  }
  if (kind === "regulacion") {
    if (!p.detalle_regulacion) return true;
    return isEmpty(p.detalle_regulacion.normatividad);
  }
  if (kind === "oficial") {
    if (!p.detalle_oficial) return true;
    return (
      isEmpty(p.detalle_oficial.nombre) ||
      isEmpty(p.detalle_oficial.identificacion) ||
      isEmpty(p.detalle_oficial.cargo) ||
      isEmpty(p.detalle_oficial.email) ||
      isEmpty(p.detalle_oficial.telefono)
    );
  }
  if (kind === "cripto") {
    if (!p.detalle_cripto) return true;
    return isEmpty(p.detalle_cripto.tipo_operaciones);
  }
  if (kind === "sancion") {
    if (!p.detalle_sancion) return true;
    return (
      isEmpty(p.detalle_sancion.fecha) ||
      isEmpty(p.detalle_sancion.motivo) ||
      isEmpty(p.detalle_sancion.autoridad) ||
      isEmpty(p.detalle_sancion.estado_actual)
    );
  }
  return false;
}

// Import options - I'll define in fieldOptions or inline
// For now define minimal in missingFields
const TIPO_EMPRESA = ["Pública", "S.A.", "LTDA", "S.A.S.", "Otro"] as const;
const GRUPO_NIIF = ["Grupo 1 (Plenas)", "Grupo 2 (Pymes)", "Grupo 3 (SFC)", "Grupo 4 (Otros)"] as const;
const CICLO = ["Joven/Crecimiento", "Trayectoria/Rentabilizar", "Madura/Optimización tributaria"] as const;
const LIQ = ["Muy relevante", "Algo relevante", "Nada relevante"] as const;
const EXP = ["Cuentas/CDT", "Fondos de Inversión", "Bonos/Acciones", "Derivados/Capital Privado"] as const;
const TOL = ["Retirar todo", "Retirar parte", "Esperar/Invertir más aprovechando precios bajos"] as const;
const CALIDAD = [
  "Por Titularidad (Capital / Derechos de voto)",
  "Por Beneficio (Activos / Rendimientos / Utilidades)",
  "Por Control (Representante legal / Mayor autoridad)",
] as const;
const TIPO_CTRL = [
  "Control por propiedad",
  "Control por otros medios (voto)",
  "Administrador (Directivo)",
  "Fideicomitente / Beneficiario",
] as const;

/**
 * Recorre el paquete y devuelve la lista de campos que el usuario debe completar
 * (vacíos, inválidos o detalles condicionales faltantes).
 */
export function computeMissingFields(pkg: SarlaftPackage): MissingFieldRef[] {
  const m: MissingFieldRef[] = [];
  const f1 = pkg.formulario_1;
  const f2 = pkg.formulario_2;
  const f3 = pkg.formulario_3;

  // — Form 1: Información General —
  if (isEmpty(f1.nombre_completo_razon_social)) {
    m.push({
      formId: "1",
      sectionKey: "info_general",
      sectionLabel: "1. Información General",
      fieldKey: "nombre_completo_razon_social",
      label: "Nombre completo / Razón social",
      type: "text",
    });
  }
  if (isEmpty(f1.tipo_y_numero_identificacion)) {
    m.push({
      formId: "1",
      sectionKey: "info_general",
      sectionLabel: "1. Información General",
      fieldKey: "tipo_y_numero_identificacion",
      label: "Tipo y No. Identificación",
      type: "text",
    });
  }
  if (isNullNum(f1.num_oficinas_pais)) {
    m.push({
      formId: "1",
      sectionKey: "info_general",
      sectionLabel: "1. Información General",
      fieldKey: "num_oficinas_pais",
      label: "No. oficinas en el País",
      type: "number",
    });
  }
  if (isNullNum(f1.num_oficinas_exterior)) {
    m.push({
      formId: "1",
      sectionKey: "info_general",
      sectionLabel: "1. Información General",
      fieldKey: "num_oficinas_exterior",
      label: "No. oficinas en el Exterior",
      type: "number",
    });
  }
  if (isEmpty(f1.ciudades_paises_operacion)) {
    m.push({
      formId: "1",
      sectionKey: "info_general",
      sectionLabel: "1. Información General",
      fieldKey: "ciudades_paises_operacion",
      label: "Ciudades y Países de operación",
      type: "text",
    });
  }

  // — Form 1: Políticas —
  const pol = f1.politicas;
  const addPol = (
    key: keyof typeof pol,
    label: string,
    k: "programa" | "regulacion" | "oficial" | "cripto" | "sancion" | "none",
    fieldPath: string
  ) => {
    const p = pol[key] as
      | SagrilaftPoliticasPregunta
      | { etiqueta: string; respuesta: SiNoNA }[];
    if (key === "otras_14_preguntas" && Array.isArray(p)) {
      (p as { etiqueta: string; respuesta: SiNoNA }[]).forEach((row, i) => {
        if (isInvalidSiNoNA(row.respuesta)) {
          m.push({
            formId: "1",
            sectionKey: "politicas",
            sectionLabel: "2. Políticas y Procedimientos",
            fieldKey: `otras_14_preguntas[${i}].respuesta`,
            label: row.etiqueta,
            type: "sino-na",
            options: ["Sí", "No", "N/A"],
          });
        }
      });
      return;
    }
    const pr = p as SagrilaftPoliticasPregunta;
    if (isInvalidSiNoNA(pr.respuesta)) {
      m.push({
        formId: "1",
        sectionKey: "politicas",
        sectionLabel: "2. Políticas y Procedimientos",
        fieldKey: fieldPath,
        label,
        type: "politica_pregunta",
        options: ["Sí", "No", "N/A"],
      });
    } else if (k === "programa" && needDetalleSino(pr, "programa")) {
      m.push({
        formId: "1",
        sectionKey: "politicas",
        sectionLabel: "2. Políticas y Procedimientos",
        fieldKey: fieldPath,
        label: `${label} — detalle (programa)`,
        type: "detalle_programa",
      });
    } else if (k === "regulacion" && needDetalleSino(pr, "regulacion")) {
      m.push({
        formId: "1",
        sectionKey: "politicas",
        sectionLabel: "2. Políticas y Procedimientos",
        fieldKey: fieldPath,
        label: `${label} — normatividad`,
        type: "detalle_regulacion",
      });
    } else if (k === "oficial" && needDetalleSino(pr, "oficial")) {
      m.push({
        formId: "1",
        sectionKey: "politicas",
        sectionLabel: "2. Políticas y Procedimientos",
        fieldKey: fieldPath,
        label: `${label} — oficial de cumplimiento`,
        type: "detalle_oficial",
      });
    } else if (k === "cripto" && needDetalleSino(pr, "cripto")) {
      m.push({
        formId: "1",
        sectionKey: "politicas",
        sectionLabel: "2. Políticas y Procedimientos",
        fieldKey: fieldPath,
        label: `${label} — tipo de operaciones`,
        type: "detalle_cripto",
      });
    } else if (k === "sancion" && needDetalleSino(pr, "sancion")) {
      m.push({
        formId: "1",
        sectionKey: "politicas",
        sectionLabel: "2. Políticas y Procedimientos",
        fieldKey: fieldPath,
        label: `${label} — sanción`,
        type: "detalle_sancion",
      });
    }
  };

  addPol("programa_laft_documentado", pol.programa_laft_documentado.pregunta, "programa", "politicas.programa_laft_documentado");
  addPol("regulacion_gubernamental_laft", pol.regulacion_gubernamental_laft.pregunta, "regulacion", "politicas.regulacion_gubernamental_laft");
  addPol("oficial_cumplimiento", pol.oficial_cumplimiento.pregunta, "oficial", "politicas.oficial_cumplimiento");
  addPol("operaciones_efectivo", pol.operaciones_efectivo.pregunta, "none", "politicas.operaciones_efectivo");
  addPol("activos_virtuales", pol.activos_virtuales.pregunta, "cripto", "politicas.activos_virtuales");
  addPol("sancionada_investigada", pol.sancionada_investigada.pregunta, "sancion", "politicas.sancionada_investigada");
  addPol("otras_14_preguntas", "Otras 14", "none", "otras_14_preguntas");

  // — Form 2 —
  if (isEmpty(f2.razon_social)) {
    m.push({ formId: "2", sectionKey: "identificacion", sectionLabel: "I. Identificación de la Entidad", fieldKey: "razon_social", label: "Razón Social", type: "text" });
  }
  if (isEmpty(f2.identificacion_tributaria)) {
    m.push({ formId: "2", sectionKey: "identificacion", sectionLabel: "I. Identificación de la Entidad", fieldKey: "identificacion_tributaria", label: "NIT o equivalente", type: "text" });
  }
  if (isEmpty(f2.pais_constitucion_fiscal)) {
    m.push({ formId: "2", sectionKey: "identificacion", sectionLabel: "I. Identificación de la Entidad", fieldKey: "pais_constitucion_fiscal", label: "País de constitución/residencia fiscal", type: "text" });
  }
  if (isEmpty(f2.actividad_principal)) {
    m.push({
      formId: "2",
      sectionKey: "actividad",
      sectionLabel: "II. Actividad principal",
      fieldKey: "actividad_principal",
      label: "¿La entidad ejerce alguna de las siguientes actividades?",
      type: "select",
      options: [...FATCA_ACTIVIDAD_OPTIONS],
    });
  }
  if (f2.ingresos_activos_pasivos_50 !== "Sí" && f2.ingresos_activos_pasivos_50 !== "No") {
    m.push({
      formId: "2",
      sectionKey: "clasificacion",
      sectionLabel: "III y IV. Clasificación FATCA/CRS",
      fieldKey: "ingresos_activos_pasivos_50",
      label: "¿Al menos el 50% de ingresos/activos son pasivos?",
      type: "select",
      options: ["Sí", "No"],
    });
  }
  if (isEmpty(f2.clasificacion_fatca_crs)) {
    m.push({
      formId: "2",
      sectionKey: "clasificacion",
      sectionLabel: "III y IV. Clasificación FATCA/CRS",
      fieldKey: "clasificacion_fatca_crs",
      label: "Clasificación como Institución Financiera o No Financiera",
      type: "select",
      options: [...FATCA_CLASIFICACION_OPTIONS],
    });
  } else if (f2.clasificacion_fatca_crs === "Otra" && isEmpty(f2.clasificacion_otra)) {
    m.push({
      formId: "2",
      sectionKey: "clasificacion",
      sectionLabel: "III y IV. Clasificación FATCA/CRS",
      fieldKey: "clasificacion_otra",
      label: "Especifique otra clasificación",
      type: "text",
    });
  }
  if (isEmpty(f2.ubo.datos_personales)) {
    m.push({ formId: "2", sectionKey: "ubo", sectionLabel: "Anexo: Beneficiario final", fieldKey: "ubo.datos_personales", label: "Datos personales (UBO)", type: "text" });
  }
  if (f2.ubo.paises_tin.length === 0) {
    m.push({ formId: "2", sectionKey: "ubo", sectionLabel: "Anexo: Beneficiario final", fieldKey: "ubo.paises_tin", label: "Países y TIN/NIT", type: "lista_tin" });
  } else {
    f2.ubo.paises_tin.forEach((row, i) => {
      if (isEmpty(row.pais) || isEmpty(row.tin)) {
        m.push({ formId: "2", sectionKey: "ubo", sectionLabel: "Anexo: Beneficiario final", fieldKey: `ubo.paises_tin[${i}]`, label: `Fila TIN ${i + 1}`, type: "lista_tin" });
      }
    });
  }
  if (isEmpty(f2.ubo.tipo_control)) {
    m.push({ formId: "2", sectionKey: "ubo", sectionLabel: "Anexo: Beneficiario final", fieldKey: "ubo.tipo_control", label: "Tipo de control", type: "select", options: [...TIPO_CTRL] });
  }

  // — Form 3 —
  if (isEmpty(f3.tipo_empresa) || !TIPO_EMPRESA.includes(f3.tipo_empresa as (typeof TIPO_EMPRESA)[number])) {
    m.push({ formId: "3", sectionKey: "basica", sectionLabel: "1. Información básica y financiera", fieldKey: "tipo_empresa", label: "Tipo de empresa", type: "select", options: [...TIPO_EMPRESA] });
  }
  const c = f3.cifras_financieras;
  (["ingresos", "egresos", "total_activos", "total_pasivos", "total_patrimonio"] as const).forEach((k) => {
    if (isNullNum(c[k])) {
      m.push({
        formId: "3",
        sectionKey: "basica",
        sectionLabel: "1. Información básica y financiera",
        fieldKey: `cifras_financieras.${k}`,
        label: `Cifras — ${k === "ingresos" ? "Ingresos" : k === "egresos" ? "Egresos" : k === "total_activos" ? "Total Activos" : k === "total_pasivos" ? "Total Pasivos" : "Total Patrimonio"}`,
        type: "cifras",
      });
    }
  });
  if (f3.administra_recursos_publicos !== "Sí" && f3.administra_recursos_publicos !== "No") {
    m.push({ formId: "3", sectionKey: "basica", sectionLabel: "1. Información básica y financiera", fieldKey: "administra_recursos_publicos", label: "¿Administra recursos públicos?", type: "sino", options: ["Sí", "No"] });
  }
  if (isEmpty(f3.grupo_contable_niif) || !GRUPO_NIIF.includes(f3.grupo_contable_niif as (typeof GRUPO_NIIF)[number])) {
    m.push({ formId: "3", sectionKey: "basica", sectionLabel: "1. Información básica y financiera", fieldKey: "grupo_contable_niif", label: "Grupo contable NIIF", type: "select", options: [...GRUPO_NIIF] });
  }
  if (isEmpty(f3.ciclo_empresa) || !CICLO.includes(f3.ciclo_empresa as (typeof CICLO)[number])) {
    m.push({ formId: "3", sectionKey: "perfil", sectionLabel: "2. Perfil de inversión", fieldKey: "ciclo_empresa", label: "Ciclo de la empresa", type: "select", options: [...CICLO] });
  }
  if (isEmpty(f3.liquidez) || !LIQ.includes(f3.liquidez as (typeof LIQ)[number])) {
    m.push({ formId: "3", sectionKey: "perfil", sectionLabel: "2. Perfil de inversión", fieldKey: "liquidez", label: "Disponibilidad del dinero (liquidez)", type: "select", options: [...LIQ] });
  }
  if (isEmpty(f3.experiencia_inversion) || !EXP.includes(f3.experiencia_inversion as (typeof EXP)[number])) {
    m.push({ formId: "3", sectionKey: "perfil", sectionLabel: "2. Perfil de inversión", fieldKey: "experiencia_inversion", label: "Experiencia en inversiones", type: "select", options: [...EXP] });
  }
  if (isEmpty(f3.tolerancia_riesgo) || !TOL.includes(f3.tolerancia_riesgo as (typeof TOL)[number])) {
    m.push({ formId: "3", sectionKey: "perfil", sectionLabel: "2. Perfil de inversión", fieldKey: "tolerancia_riesgo", label: "Tolerancia al riesgo", type: "select", options: [...TOL] });
  }
  if (isEmpty(f3.representantes_ordenates)) {
    m.push({ formId: "3", sectionKey: "repr", sectionLabel: "3. Representantes y PEPs", fieldKey: "representantes_ordenates", label: "Representante legal y ordenantes", type: "text" });
  }
  if (f3.es_pep !== "Sí" && f3.es_pep !== "No") {
    m.push({ formId: "3", sectionKey: "repr", sectionLabel: "3. Representantes y PEPs", fieldKey: "es_pep", label: "¿Es PEP o tiene vínculo con una?", type: "sino", options: ["Sí", "No"] });
  } else if (f3.es_pep === "Sí") {
    const d = f3.pep_detalle;
    if (!d || isEmpty(d.cargo_publico) || isEmpty(d.fecha_vinculacion) || isEmpty(d.tipo_parentesco)) {
      m.push({ formId: "3", sectionKey: "repr", sectionLabel: "3. Representantes y PEPs", fieldKey: "pep_detalle", label: "Detalle PEP", type: "pep" });
    }
  }
  if (f3.accionistas.length === 0) {
    m.push({ formId: "3", sectionKey: "accionaria", sectionLabel: "4. Composición accionaria", fieldKey: "accionistas", label: "Accionistas (al menos un registro)", type: "lista_accionistas" });
  } else {
    f3.accionistas.forEach((a, i) => {
      if (isEmpty(a.nombre) || isEmpty(a.id) || a.porcentaje === null || a.cotiza_en_bolsa !== "Sí" && a.cotiza_en_bolsa !== "No") {
        m.push({ formId: "3", sectionKey: "accionaria", sectionLabel: "4. Composición accionaria", fieldKey: `accionistas[${i}]`, label: `Accionista ${i + 1}`, type: "accionista_row" });
      }
    });
  }
  if (f3.calidad_beneficiario_final.length === 0) {
    m.push({
      formId: "3",
      sectionKey: "accionaria",
      sectionLabel: "4. Composición accionaria",
      fieldKey: "calidad_beneficiario_final",
      label: "Calidad de beneficiario final",
      type: "multiselect",
      options: [...CALIDAD],
    });
  }

  return m;
}

export function hasMissingFields(pkg: SarlaftPackage): boolean {
  return computeMissingFields(pkg).length > 0;
}
