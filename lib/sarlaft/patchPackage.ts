import type { MissingFieldRef, SagrilaftPoliticasPregunta, SarlaftPackage, SiNoNA } from "./schema";

function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

const polKeyMap: Record<string, keyof SarlaftPackage["formulario_1"]["politicas"]> = {
  "politicas.programa_laft_documentado": "programa_laft_documentado",
  "politicas.regulacion_gubernamental_laft": "regulacion_gubernamental_laft",
  "politicas.oficial_cumplimiento": "oficial_cumplimiento",
  "politicas.operaciones_efectivo": "operaciones_efectivo",
  "politicas.activos_virtuales": "activos_virtuales",
  "politicas.sancionada_investigada": "sancionada_investigada",
};

type PolPreguntaKey = Exclude<keyof SarlaftPackage["formulario_1"]["politicas"], "otras_14_preguntas">;

function getPolPregKey(fieldKey: string): PolPreguntaKey | undefined {
  const k = polKeyMap[fieldKey];
  if (k === "otras_14_preguntas" || k === undefined) return undefined;
  return k;
}

/**
 * Aplica un valor al paquete según `ref` (wizard). Devuelve nuevo objeto.
 */
export function patchPackageValue(
  pkg: SarlaftPackage,
  ref: MissingFieldRef,
  value: unknown
): SarlaftPackage {
  const out = clone(pkg);
  const fid = ref.formId;

  if (fid === "1") {
    const f1 = out.formulario_1;
    if (ref.type === "text" || ref.type === "number") {
      if (ref.fieldKey === "nombre_completo_razon_social") f1.nombre_completo_razon_social = String(value ?? "");
      if (ref.fieldKey === "tipo_y_numero_identificacion") f1.tipo_y_numero_identificacion = String(value ?? "");
      if (ref.fieldKey === "ciudades_paises_operacion") f1.ciudades_paises_operacion = String(value ?? "");
      if (ref.fieldKey === "num_oficinas_pais") f1.num_oficinas_pais = value === "" ? null : Number(value);
      if (ref.fieldKey === "num_oficinas_exterior") f1.num_oficinas_exterior = value === "" ? null : Number(value);
    }
    if (ref.type === "politica_pregunta" && typeof value === "string") {
      const k = getPolPregKey(ref.fieldKey);
      if (k) {
        const prev = f1.politicas[k] as SagrilaftPoliticasPregunta;
        f1.politicas[k] = { ...prev, respuesta: value as SiNoNA };
      }
    }
    if (ref.type === "detalle_programa" && value && typeof value === "object") {
      const k = getPolPregKey(ref.fieldKey);
      if (k) {
        const v = value as { organo_aprobacion?: string; fecha_aprobacion?: string };
        const cur = f1.politicas[k] as SagrilaftPoliticasPregunta;
        cur.detalle_programa = {
          organo_aprobacion: v.organo_aprobacion ?? "",
          fecha_aprobacion: v.fecha_aprobacion ?? "",
        };
      }
    }
    if (ref.type === "detalle_regulacion" && value && typeof value === "object") {
      const k = getPolPregKey(ref.fieldKey);
      if (k) {
        (f1.politicas[k] as SagrilaftPoliticasPregunta).detalle_regulacion = {
          normatividad: String((value as { normatividad: string }).normatividad ?? ""),
        };
      }
    }
    if (ref.type === "detalle_oficial" && value && typeof value === "object") {
      const k = getPolPregKey(ref.fieldKey);
      if (k) {
        const v = value as Record<string, string>;
        (f1.politicas[k] as SagrilaftPoliticasPregunta).detalle_oficial = {
          nombre: v.nombre ?? "",
          identificacion: v.identificacion ?? "",
          cargo: v.cargo ?? "",
          email: v.email ?? "",
          telefono: v.telefono ?? "",
        };
      }
    }
    if (ref.type === "detalle_cripto" && value && typeof value === "object") {
      const k = getPolPregKey(ref.fieldKey);
      if (k) {
        (f1.politicas[k] as SagrilaftPoliticasPregunta).detalle_cripto = {
          tipo_operaciones: String((value as { tipo_operaciones: string }).tipo_operaciones ?? ""),
        };
      }
    }
    if (ref.type === "detalle_sancion" && value && typeof value === "object") {
      const k = getPolPregKey(ref.fieldKey);
      if (k) {
        const v = value as Record<string, string>;
        (f1.politicas[k] as SagrilaftPoliticasPregunta).detalle_sancion = {
          fecha: v.fecha ?? "",
          motivo: v.motivo ?? "",
          autoridad: v.autoridad ?? "",
          estado_actual: v.estado_actual ?? "",
        };
      }
    }
    if (ref.type === "sino-na" && typeof value === "string") {
      const m = ref.fieldKey.match(/^otras_14_preguntas\[(\d+)\]\.respuesta$/);
      if (m) {
        const idx = Number(m[1]);
        if (f1.politicas.otras_14_preguntas[idx]) {
          f1.politicas.otras_14_preguntas[idx].respuesta = value as SiNoNA;
        }
      }
    }
  }

  if (fid === "2") {
    const f2 = out.formulario_2;
    if (ref.fieldKey === "razon_social") f2.razon_social = String(value ?? "");
    if (ref.fieldKey === "identificacion_tributaria") f2.identificacion_tributaria = String(value ?? "");
    if (ref.fieldKey === "pais_constitucion_fiscal") f2.pais_constitucion_fiscal = String(value ?? "");
    if (ref.fieldKey === "actividad_principal") f2.actividad_principal = String(value ?? "") as typeof f2.actividad_principal;
    if (ref.fieldKey === "ingresos_activos_pasivos_50") f2.ingresos_activos_pasivos_50 = value as typeof f2.ingresos_activos_pasivos_50;
    if (ref.fieldKey === "clasificacion_fatca_crs") f2.clasificacion_fatca_crs = String(value ?? "") as typeof f2.clasificacion_fatca_crs;
    if (ref.fieldKey === "clasificacion_otra") f2.clasificacion_otra = String(value ?? "");
    if (ref.fieldKey === "ubo.datos_personales") f2.ubo.datos_personales = String(value ?? "");
    if (ref.fieldKey === "ubo.tipo_control") f2.ubo.tipo_control = String(value ?? "") as typeof f2.ubo.tipo_control;
    if (ref.type === "lista_tin" && Array.isArray(value)) {
      f2.ubo.paises_tin = value as typeof f2.ubo.paises_tin;
    }
    if (ref.type === "lista_tin" && ref.fieldKey.match(/^ubo\.paises_tin\[\d+\]$/) && value && typeof value === "object") {
      const m = ref.fieldKey.match(/\[(\d+)\]/);
      if (m) {
        const idx = Number(m[1]);
        const arr = [...f2.ubo.paises_tin];
        while (arr.length <= idx) arr.push({ pais: "", tin: "" });
        arr[idx] = value as { pais: string; tin: string };
        f2.ubo.paises_tin = arr;
      }
    }
  }

  if (fid === "3") {
    const f3 = out.formulario_3;
    if (ref.fieldKey === "tipo_empresa") f3.tipo_empresa = String(value ?? "") as typeof f3.tipo_empresa;
    if (ref.fieldKey === "administra_recursos_publicos") f3.administra_recursos_publicos = value as typeof f3.administra_recursos_publicos;
    if (ref.fieldKey === "grupo_contable_niif") f3.grupo_contable_niif = String(value ?? "") as typeof f3.grupo_contable_niif;
    if (ref.fieldKey === "ciclo_empresa") f3.ciclo_empresa = String(value ?? "") as typeof f3.ciclo_empresa;
    if (ref.fieldKey === "liquidez") f3.liquidez = String(value ?? "") as typeof f3.liquidez;
    if (ref.fieldKey === "experiencia_inversion") f3.experiencia_inversion = String(value ?? "") as typeof f3.experiencia_inversion;
    if (ref.fieldKey === "tolerancia_riesgo") f3.tolerancia_riesgo = String(value ?? "") as typeof f3.tolerancia_riesgo;
    if (ref.fieldKey === "representantes_ordenates") f3.representantes_ordenates = String(value ?? "");
    if (ref.fieldKey === "es_pep") f3.es_pep = value as typeof f3.es_pep;
    if (ref.type === "pep" && value && typeof value === "object") {
      const v = value as Record<string, string>;
      f3.pep_detalle = {
        cargo_publico: v.cargo_publico ?? "",
        fecha_vinculacion: v.fecha_vinculacion ?? "",
        tipo_parentesco: v.tipo_parentesco ?? "",
      };
    }
    if (ref.fieldKey.startsWith("cifras_financieras.")) {
      const k = ref.fieldKey.replace("cifras_financieras.", "") as keyof typeof f3.cifras_financieras;
      if (k in f3.cifras_financieras) {
        f3.cifras_financieras[k] = value === "" ? null : Number(value);
      }
    }
    if (ref.type === "lista_accionistas" && Array.isArray(value)) {
      f3.accionistas = value as typeof f3.accionistas;
    }
    if (ref.type === "accionista_row" && ref.fieldKey.match(/^accionistas\[\d+\]$/) && value && typeof value === "object") {
      const m = ref.fieldKey.match(/^accionistas\[(\d+)\]$/);
      if (m) {
        const i = Number(m[1]);
        f3.accionistas[i] = { ...(f3.accionistas[i] || {}), ...(value as object) } as (typeof f3.accionistas)[0];
      }
    }
    if (ref.type === "multiselect" && Array.isArray(value)) {
      f3.calidad_beneficiario_final = value as typeof f3.calidad_beneficiario_final;
    }
  }

  return out;
}
