/**
 * Paquete de vinculación Skandia — tipos alineados al JSON de formularios SARLAFT / FATCA / Vinculación PJ.
 */

export type SiNoNA = "Sí" | "No" | "N/A";

export interface SagrilaftDetallePrograma {
  organo_aprobacion: string;
  fecha_aprobacion: string;
}

export interface SagrilaftDetalleRegulacion {
  normatividad: string;
}

export interface SagrilaftDetalleOficial {
  nombre: string;
  identificacion: string;
  cargo: string;
  email: string;
  telefono: string;
}

export interface SagrilaftDetalleCripto {
  tipo_operaciones: string;
}

export interface SagrilaftDetalleSancion {
  fecha: string;
  motivo: string;
  autoridad: string;
  estado_actual: string;
}

export interface SagrilaftPoliticasPregunta {
  pregunta: string;
  respuesta: SiNoNA;
  // Detalles condicionales según tipo
  detalle_programa?: SagrilaftDetallePrograma;
  detalle_regulacion?: SagrilaftDetalleRegulacion;
  detalle_oficial?: SagrilaftDetalleOficial;
  detalle_cripto?: SagrilaftDetalleCripto;
  detalle_sancion?: SagrilaftDetalleSancion;
}

/** Formulario 1: Cuestionario SAGRILAFT / SARLAFT */
export interface SagrilaftForm {
  id_formulario: "1";
  nombre_completo_razon_social: string;
  tipo_y_numero_identificacion: string;
  num_oficinas_pais: number | null;
  num_oficinas_exterior: number | null;
  ciudades_paises_operacion: string;
  politicas: {
    programa_laft_documentado: SagrilaftPoliticasPregunta;
    regulacion_gubernamental_laft: SagrilaftPoliticasPregunta;
    oficial_cumplimiento: SagrilaftPoliticasPregunta;
    operaciones_efectivo: SagrilaftPoliticasPregunta;
    activos_virtuales: SagrilaftPoliticasPregunta;
    sancionada_investigada: SagrilaftPoliticasPregunta;
    /** "Otras 14 preguntas" — se modelan como lista de ítems Sí/No/N/A */
    otras_14_preguntas: { etiqueta: string; respuesta: SiNoNA }[];
  };
}

export type FatcaActividad =
  | "a) Acepta depósitos (Bancos)"
  | "b) Custodia activos financieros"
  | "c) Emite seguros con valor en efectivo"
  | "d) Negocios de instrumentos de inversión (Fondos)"
  | "e) Ninguna de las anteriores";

export type FatcaClasificacion =
  | "Entidad participante"
  | "Entidad holding"
  | "Entidad sin ánimo de lucro"
  | "Entidad gubernamental"
  | "Entidad cotizada en bolsa"
  | "Otra";

export type TipoControlUBO =
  | "Control por propiedad"
  | "Control por otros medios (voto)"
  | "Administrador (Directivo)"
  | "Fideicomitente / Beneficiario";

export interface PaisObligacionTIN {
  pais: string;
  tin: string;
}

export interface UBOAnexo {
  datos_personales: string;
  paises_tin: PaisObligacionTIN[];
  tipo_control: TipoControlUBO | "";
}

/** Formulario 2: Auto-declaración PJ FATCA y CRS */
export interface FatcaCrsForm {
  id_formulario: "2";
  razon_social: string;
  identificacion_tributaria: string;
  pais_constitucion_fiscal: string;
  actividad_principal: FatcaActividad | "";
  ingresos_activos_pasivos_50: "Sí" | "No" | "";
  clasificacion_fatca_crs: FatcaClasificacion | "";
  clasificacion_otra?: string;
  ubo: UBOAnexo;
}

export type TipoEmpresa = "Pública" | "S.A." | "LTDA" | "S.A.S." | "Otro";

export interface CifrasFinancierasCOP {
  ingresos: number | null;
  egresos: number | null;
  total_activos: number | null;
  total_pasivos: number | null;
  total_patrimonio: number | null;
}

export type GrupoNIIF = "Grupo 1 (Plenas)" | "Grupo 2 (Pymes)" | "Grupo 3 (SFC)" | "Grupo 4 (Otros)";

export type CicloEmpresa = "Joven/Crecimiento" | "Trayectoria/Rentabilizar" | "Madura/Optimización tributaria";
export type Liquidez = "Muy relevante" | "Algo relevante" | "Nada relevante";
export type ExperienciaInversion = "Cuentas/CDT" | "Fondos de Inversión" | "Bonos/Acciones" | "Derivados/Capital Privado";
export type ToleranciaRiesgo = "Retirar todo" | "Retirar parte" | "Esperar/Invertir más aprovechando precios bajos";

export interface Accionista {
  nombre: string;
  id: string;
  porcentaje: number | null;
  cotiza_en_bolsa: "Sí" | "No" | "";
}

export type CalidadBeneficiarioFinal =
  | "Por Titularidad (Capital / Derechos de voto)"
  | "Por Beneficio (Activos / Rendimientos / Utilidades)"
  | "Por Control (Representante legal / Mayor autoridad)";

export interface PepDetalle {
  cargo_publico: string;
  fecha_vinculacion: string;
  tipo_parentesco: string;
}

/** Formulario 3: Solicitud de Vinculación PJ (Skandia) */
export interface VinculacionForm {
  id_formulario: "3";
  tipo_empresa: TipoEmpresa | "";
  cifras_financieras: CifrasFinancierasCOP;
  administra_recursos_publicos: "Sí" | "No" | "";
  grupo_contable_niif: GrupoNIIF | "";
  ciclo_empresa: CicloEmpresa | "";
  liquidez: Liquidez | "";
  experiencia_inversion: ExperienciaInversion | "";
  tolerancia_riesgo: ToleranciaRiesgo | "";
  representantes_ordenates: string;
  es_pep: "Sí" | "No" | "";
  pep_detalle?: PepDetalle;
  accionistas: Accionista[];
  calidad_beneficiario_final: CalidadBeneficiarioFinal[];
}

export interface SarlaftPackage {
  formulario_1: SagrilaftForm;
  formulario_2: FatcaCrsForm;
  formulario_3: VinculacionForm;
}

export const SAGRILAFT_OTRAS_14_LABELS: string[] = [
  "Auditorías internas/externas documentadas (LA/FT)",
  "Listas restrictivas (OFAC, ONU) actualizadas",
  "Capacitación a personal en LA/FT",
  "Reporte de operaciones inusuales a UIAF",
  "Conocimiento del cliente (KYC) documentado",
  "Debida diligencia a third parties",
  "Política de regalos y hospitalidades",
  "Corresponsalía bancaria / intermediarios",
  "Productos y servicios de alto riesgo identificados",
  "Canales de denuncia / transparencia",
  "Manejo de efectivo bajo procedimiento",
  "Política de aceptación de clientes (onboarding)",
  "Evaluación de riesgo de LA/FT periódica",
  "Monitoreo y seguimiento de operaciones",
];

/** Referencia a un campo faltante para el wizard (path y metadatos UI) */
export type FieldPath = string;

export interface MissingFieldRef {
  formId: "1" | "2" | "3";
  sectionKey: string;
  sectionLabel: string;
  fieldKey: string;
  label: string;
  type:
    | "text"
    | "number"
    | "sino-na"
    | "sino"
    | "select"
    | "multiselect"
    | "lista_tin"
    | "lista_accionistas"
    | "otras_14"
    | "pep"
    | "detalle_programa"
    | "detalle_regulacion"
    | "detalle_oficial"
    | "detalle_cripto"
    | "detalle_sancion"
    | "cifras"
    | "accionista_row"
    | "fatca_preguntas"
    | "politica_pregunta";
  options?: string[];
}

export function createEmptyOtras14(): { etiqueta: string; respuesta: SiNoNA }[] {
  return SAGRILAFT_OTRAS_14_LABELS.map((etiqueta) => ({ etiqueta, respuesta: "N/A" as SiNoNA }));
}

export function createEmptySagrilaftPregunta(
  pregunta: string,
  needsDetalle: "none" | "programa" | "regulacion" | "oficial" | "cripto" | "sancion" = "none"
): SagrilaftPoliticasPregunta {
  const base: SagrilaftPoliticasPregunta = {
    pregunta,
    respuesta: "N/A",
  };
  if (needsDetalle === "programa") {
    base.detalle_programa = { organo_aprobacion: "", fecha_aprobacion: "" };
  }
  if (needsDetalle === "regulacion") {
    base.detalle_regulacion = { normatividad: "" };
  }
  if (needsDetalle === "oficial") {
    base.detalle_oficial = { nombre: "", identificacion: "", cargo: "", email: "", telefono: "" };
  }
  if (needsDetalle === "cripto") {
    base.detalle_cripto = { tipo_operaciones: "" };
  }
  if (needsDetalle === "sancion") {
    base.detalle_sancion = { fecha: "", motivo: "", autoridad: "", estado_actual: "" };
  }
  return base;
}

export function createEmptySagrilaftForm(): SagrilaftForm {
  return {
    id_formulario: "1",
    nombre_completo_razon_social: "",
    tipo_y_numero_identificacion: "",
    num_oficinas_pais: null,
    num_oficinas_exterior: null,
    ciudades_paises_operacion: "",
    politicas: {
      programa_laft_documentado: createEmptySagrilaftPregunta(
        "¿Su entidad tiene un programa/sistema LA/FT documentado y actualizado?",
        "programa"
      ),
      regulacion_gubernamental_laft: createEmptySagrilaftPregunta(
        "¿Su entidad está sujeta a regulación gubernamental LA/FT?",
        "regulacion"
      ),
      oficial_cumplimiento: createEmptySagrilaftPregunta("¿Tiene Oficial de Cumplimiento designado?", "oficial"),
      operaciones_efectivo: createEmptySagrilaftPregunta("¿Realiza operaciones en efectivo?"),
      activos_virtuales: createEmptySagrilaftPregunta(
        "¿Realiza transacciones o posee activos virtuales (criptomonedas)?",
        "cripto"
      ),
      sancionada_investigada: createEmptySagrilaftPregunta(
        "¿La entidad ha sido sancionada o investigada por procesos de lavado de activos?",
        "sancion"
      ),
      otras_14_preguntas: createEmptyOtras14(),
    },
  };
}

export function createEmptyFatcaForm(): FatcaCrsForm {
  return {
    id_formulario: "2",
    razon_social: "",
    identificacion_tributaria: "",
    pais_constitucion_fiscal: "",
    actividad_principal: "",
    ingresos_activos_pasivos_50: "",
    clasificacion_fatca_crs: "",
    clasificacion_otra: "",
    ubo: { datos_personales: "", paises_tin: [], tipo_control: "" },
  };
}

export function createEmptyVinculacionForm(): VinculacionForm {
  return {
    id_formulario: "3",
    tipo_empresa: "",
    cifras_financieras: {
      ingresos: null,
      egresos: null,
      total_activos: null,
      total_pasivos: null,
      total_patrimonio: null,
    },
    administra_recursos_publicos: "",
    grupo_contable_niif: "",
    ciclo_empresa: "",
    liquidez: "",
    experiencia_inversion: "",
    tolerancia_riesgo: "",
    representantes_ordenates: "",
    es_pep: "",
    accionistas: [],
    calidad_beneficiario_final: [],
  };
}

export function createEmptyPackage(): SarlaftPackage {
  return {
    formulario_1: createEmptySagrilaftForm(),
    formulario_2: createEmptyFatcaForm(),
    formulario_3: createEmptyVinculacionForm(),
  };
}
