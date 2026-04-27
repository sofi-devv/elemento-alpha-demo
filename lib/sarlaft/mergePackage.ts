import type { SarlaftPackage } from "./schema";
import {
  createEmptyFatcaForm,
  createEmptyOtras14,
  createEmptyPackage,
  createEmptySagrilaftForm,
  createEmptyVinculacionForm,
} from "./schema";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Fusión superficie: el resultado de la IA reemplaza/llena encima de la base,
 * pero NUNCA sobrescribe objetos/arreglos con valores `null`/`undefined` ni
 * con tipos inválidos devueltos por la IA.
 */
export function deepMergeSarlaft(
  base: SarlaftPackage,
  partial: Partial<SarlaftPackage> | null | undefined
): SarlaftPackage {
  const out: SarlaftPackage = JSON.parse(JSON.stringify(base));
  if (!partial || typeof partial !== "object") return out;

  if (isPlainObject(partial.formulario_1)) {
    const p1 = partial.formulario_1 as Partial<SarlaftPackage["formulario_1"]>;
    const prevPol = out.formulario_1.politicas;
    Object.assign(out.formulario_1, p1);
    if (isPlainObject(p1.politicas)) {
      out.formulario_1.politicas = { ...prevPol, ...p1.politicas };
      if (Array.isArray(p1.politicas.otras_14_preguntas) && p1.politicas.otras_14_preguntas.length) {
        out.formulario_1.politicas.otras_14_preguntas = p1.politicas.otras_14_preguntas;
      } else {
        out.formulario_1.politicas.otras_14_preguntas = prevPol.otras_14_preguntas;
      }
    } else {
      out.formulario_1.politicas = prevPol;
    }
  }

  if (isPlainObject(partial.formulario_2)) {
    const p2 = partial.formulario_2 as Partial<SarlaftPackage["formulario_2"]>;
    const prevUbo = out.formulario_2.ubo;
    Object.assign(out.formulario_2, p2);
    if (isPlainObject(p2.ubo)) {
      out.formulario_2.ubo = { ...prevUbo, ...p2.ubo };
      if (Array.isArray(p2.ubo.paises_tin) && p2.ubo.paises_tin.length) {
        out.formulario_2.ubo.paises_tin = p2.ubo.paises_tin;
      } else {
        out.formulario_2.ubo.paises_tin = prevUbo.paises_tin;
      }
    } else {
      out.formulario_2.ubo = prevUbo;
    }
  }

  if (isPlainObject(partial.formulario_3)) {
    const p3 = partial.formulario_3 as Partial<SarlaftPackage["formulario_3"]>;
    const prevCifras = out.formulario_3.cifras_financieras;
    const prevPep = out.formulario_3.pep_detalle;
    const prevAccionistas = out.formulario_3.accionistas;
    const prevCalidad = out.formulario_3.calidad_beneficiario_final;
    Object.assign(out.formulario_3, p3);
    out.formulario_3.cifras_financieras = isPlainObject(p3.cifras_financieras)
      ? { ...prevCifras, ...p3.cifras_financieras }
      : prevCifras;
    if (isPlainObject(p3.pep_detalle)) {
      out.formulario_3.pep_detalle = { ...prevPep, ...p3.pep_detalle };
    } else if (p3.pep_detalle === null || p3.pep_detalle === undefined) {
      out.formulario_3.pep_detalle = prevPep;
    }
    out.formulario_3.accionistas = Array.isArray(p3.accionistas) && p3.accionistas.length
      ? p3.accionistas
      : prevAccionistas;
    out.formulario_3.calidad_beneficiario_final = Array.isArray(p3.calidad_beneficiario_final) && p3.calidad_beneficiario_final.length
      ? p3.calidad_beneficiario_final
      : prevCalidad;
  }

  return out;
}

/**
 * Normaliza profundamente el paquete para que `computeMissingFields` y el
 * resto de la UI puedan asumir la forma completa (objetos anidados presentes
 * y arreglos obligatorios siempre como arreglos).
 */
export function ensurePackageShape(p: unknown): SarlaftPackage {
  const empty = createEmptyPackage();
  if (!isPlainObject(p)) return empty;

  const src = p as Partial<SarlaftPackage>;

  const f1Base = createEmptySagrilaftForm();
  const f1Src = isPlainObject(src.formulario_1) ? (src.formulario_1 as Partial<SarlaftPackage["formulario_1"]>) : {};
  const f1: SarlaftPackage["formulario_1"] = { ...f1Base, ...f1Src, id_formulario: "1" };
  const polSrc = isPlainObject(f1Src.politicas)
    ? (f1Src.politicas as Partial<SarlaftPackage["formulario_1"]["politicas"]>)
    : {};
  f1.politicas = { ...f1Base.politicas, ...polSrc };
  if (!Array.isArray(f1.politicas.otras_14_preguntas) || f1.politicas.otras_14_preguntas.length === 0) {
    f1.politicas.otras_14_preguntas = createEmptyOtras14();
  }

  const f2Base = createEmptyFatcaForm();
  const f2Src = isPlainObject(src.formulario_2) ? (src.formulario_2 as Partial<SarlaftPackage["formulario_2"]>) : {};
  const f2: SarlaftPackage["formulario_2"] = { ...f2Base, ...f2Src, id_formulario: "2" };
  const uboSrc = isPlainObject(f2Src.ubo) ? (f2Src.ubo as Partial<SarlaftPackage["formulario_2"]["ubo"]>) : {};
  f2.ubo = { ...f2Base.ubo, ...uboSrc };
  if (!Array.isArray(f2.ubo.paises_tin)) f2.ubo.paises_tin = [];

  const f3Base = createEmptyVinculacionForm();
  const f3Src = isPlainObject(src.formulario_3) ? (src.formulario_3 as Partial<SarlaftPackage["formulario_3"]>) : {};
  const f3: SarlaftPackage["formulario_3"] = { ...f3Base, ...f3Src, id_formulario: "3" };
  f3.cifras_financieras = {
    ...f3Base.cifras_financieras,
    ...(isPlainObject(f3Src.cifras_financieras) ? f3Src.cifras_financieras : {}),
  };
  if (!isPlainObject(f3.pep_detalle)) {
    delete f3.pep_detalle;
  }
  if (!Array.isArray(f3.accionistas)) f3.accionistas = [];
  if (!Array.isArray(f3.calidad_beneficiario_final)) f3.calidad_beneficiario_final = [];

  return { formulario_1: f1, formulario_2: f2, formulario_3: f3 };
}
