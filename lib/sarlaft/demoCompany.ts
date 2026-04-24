import type { SarlaftPackage, SiNoNA } from "./schema";
import { createEmptyPackage, SAGRILAFT_OTRAS_14_LABELS, createEmptySagrilaftPregunta } from "./schema";

function seedOtras14(): { etiqueta: string; respuesta: SiNoNA }[] {
  return SAGRILAFT_OTRAS_14_LABELS.map((etiqueta) => ({ etiqueta, respuesta: "Sí" as SiNoNA }));
}

/**
 * Demostración: empresa ficticia pre-llenada. Los datos reales de documentos
 * se superponen desde la API de extracción.
 */
export function getDemoSarlaftPackage(): SarlaftPackage {
  const base = createEmptyPackage();

  base.formulario_1 = {
    id_formulario: "1",
    nombre_completo_razon_social: "Distribuidora Andina S.A.S.",
    tipo_y_numero_identificacion: "NIT 900.123.456-1",
    num_oficinas_pais: 3,
    num_oficinas_exterior: 0,
    ciudades_paises_operacion: "Bogotá, Medellín, Cali; Colombia",
    politicas: {
      programa_laft_documentado: {
        ...createEmptySagrilaftPregunta(
          "¿Su entidad tiene un programa/sistema LA/FT documentado y actualizado?",
          "programa"
        ),
        respuesta: "Sí",
        detalle_programa: {
          organo_aprobacion: "Asamblea de Accionistas",
          fecha_aprobacion: "2023-11-15",
        },
      },
      regulacion_gubernamental_laft: {
        ...createEmptySagrilaftPregunta("¿Su entidad está sujeta a regulación gubernamental LA/FT?", "regulacion"),
        respuesta: "Sí",
        detalle_regulacion: { normatividad: "Circular Básica Jurídica SFC" },
      },
      oficial_cumplimiento: {
        ...createEmptySagrilaftPregunta("¿Tiene Oficial de Cumplimiento designado?", "oficial"),
        respuesta: "Sí",
        detalle_oficial: {
          nombre: "Laura Méndez Gómez",
          identificacion: "CC 52.345.678",
          cargo: "Oficial de Cumplimiento",
          email: "cumplimiento@distandina.com.co",
          telefono: "+57 601 300 1234",
        },
      },
      operaciones_efectivo: {
        ...createEmptySagrilaftPregunta("¿Realiza operaciones en efectivo?"),
        respuesta: "No",
      },
      activos_virtuales: {
        ...createEmptySagrilaftPregunta(
          "¿Realiza transacciones o posee activos virtuales (criptomonedas)?",
          "cripto"
        ),
        respuesta: "No",
      },
      sancionada_investigada: {
        ...createEmptySagrilaftPregunta(
          "¿La entidad ha sido sancionada o investigada por procesos de lavado de activos?",
          "sancion"
        ),
        respuesta: "No",
      },
      otras_14_preguntas: seedOtras14(),
    },
  };

  base.formulario_2 = {
    id_formulario: "2",
    razon_social: "Distribuidora Andina S.A.S.",
    identificacion_tributaria: "900.123.456-1",
    pais_constitucion_fiscal: "Colombia",
    actividad_principal: "e) Ninguna de las anteriores",
    ingresos_activos_pasivos_50: "No",
    clasificacion_fatca_crs: "Otra",
    clasificacion_otra: "Empresa de distribución comercial",
    ubo: {
      datos_personales: "Juan Pérez López, CC 12.345.678, 1980-02-10, Colombia",
      paises_tin: [{ pais: "Colombia", tin: "900.123.456-1" }],
      tipo_control: "Control por propiedad",
    },
  };

  base.formulario_3 = {
    id_formulario: "3",
    tipo_empresa: "S.A.S.",
    cifras_financieras: {
      ingresos: 1_200_000_000,
      egresos: 900_000_000,
      total_activos: 2_100_000_000,
      total_pasivos: 800_000_000,
      total_patrimonio: 1_300_000_000,
    },
    administra_recursos_publicos: "No",
    grupo_contable_niif: "Grupo 2 (Pymes)",
    ciclo_empresa: "Trayectoria/Rentabilizar",
    liquidez: "Muy relevante",
    experiencia_inversion: "Cuentas/CDT",
    tolerancia_riesgo: "Esperar/Invertir más aprovechando precios bajos",
    representantes_ordenates:
      "Representante Legal: Juan Pérez López, CC 12.345.678, jperez@distandina.com.co. Ordenante: Marta Soto.",
    es_pep: "No",
    accionistas: [
      { nombre: "Holding Andina S.A.S.", id: "NIT 900.999.000-1", porcentaje: 60, cotiza_en_bolsa: "No" },
      { nombre: "Inversores Minoritarios (varios)", id: "Varios", porcentaje: 40, cotiza_en_bolsa: "No" },
    ],
    calidad_beneficiario_final: [
      "Por Titularidad (Capital / Derechos de voto)",
      "Por Beneficio (Activos / Rendimientos / Utilidades)",
    ],
  };

  return base;
}
