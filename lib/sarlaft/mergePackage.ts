import type { SarlaftPackage } from "./schema";
import { createEmptyPackage, createEmptyOtras14 } from "./schema";

/**
 * Fusión superficie: el resultado de la IA reemplaza/llena en encima de la base.
 */
export function deepMergeSarlaft(
  base: SarlaftPackage,
  partial: Partial<SarlaftPackage> | null | undefined
): SarlaftPackage {
  if (!partial) return base;
  const out: SarlaftPackage = JSON.parse(JSON.stringify(base));
  if (partial.formulario_1) {
    Object.assign(out.formulario_1, partial.formulario_1, {
      politicas: partial.formulario_1.politicas
        ? { ...out.formulario_1.politicas, ...partial.formulario_1.politicas }
        : out.formulario_1.politicas,
    });
    if (partial.formulario_1.politicas?.otras_14_preguntas?.length) {
      out.formulario_1.politicas.otras_14_preguntas = partial.formulario_1.politicas.otras_14_preguntas;
    }
  }
  if (partial.formulario_2) {
    Object.assign(out.formulario_2, partial.formulario_2);
    if (partial.formulario_2.ubo) {
      out.formulario_2.ubo = { ...out.formulario_2.ubo, ...partial.formulario_2.ubo };
      if (partial.formulario_2.ubo.paises_tin?.length) {
        out.formulario_2.ubo.paises_tin = partial.formulario_2.ubo.paises_tin;
      }
    }
  }
  if (partial.formulario_3) {
    Object.assign(out.formulario_3, partial.formulario_3);
    if (partial.formulario_3.cifras_financieras) {
      out.formulario_3.cifras_financieras = {
        ...out.formulario_3.cifras_financieras,
        ...partial.formulario_3.cifras_financieras,
      };
    }
    if (partial.formulario_3.pep_detalle) {
      out.formulario_3.pep_detalle = { ...out.formulario_3.pep_detalle, ...partial.formulario_3.pep_detalle };
    }
    if (partial.formulario_3.accionistas?.length) {
      out.formulario_3.accionistas = partial.formulario_3.accionistas;
    }
  }
  return out;
}

/** Si la API devuelve un objeto mínimo, normalizar. */
export function ensurePackageShape(p: unknown): SarlaftPackage {
  if (!p || typeof p !== "object") {
    return createEmptyPackage();
  }
  const pkg = p as SarlaftPackage;
  if (!pkg.formulario_1) pkg.formulario_1 = createEmptyPackage().formulario_1;
  if (!pkg.formulario_1.politicas?.otras_14_preguntas?.length) {
    pkg.formulario_1.politicas = pkg.formulario_1.politicas || createEmptyPackage().formulario_1.politicas;
    pkg.formulario_1.politicas.otras_14_preguntas = createEmptyOtras14();
  }
  if (!pkg.formulario_2) pkg.formulario_2 = createEmptyPackage().formulario_2;
  if (!pkg.formulario_3) pkg.formulario_3 = createEmptyPackage().formulario_3;
  return pkg as SarlaftPackage;
}
