import type { PortfolioRecommendation } from "@/hooks/useVoiceAgent";
import type {
  CicloEmpresa,
  ExperienciaInversion,
  FatcaActividad,
  Liquidez,
  SarlaftPackage,
  ToleranciaRiesgo,
} from "./schema";

/** Datos de empresa / RL recopilados en el paso de intake (sin depender de `app/`). */
export type IntakeSarlaftInput = {
  nombre: string;
  empresa: string;
  sector: string;
};

const isEmptyStr = (s: string | null | undefined) => !s || !String(s).trim();

function inferActividadFromSector(sector: string): FatcaActividad | "" {
  const s = sector.toLowerCase();
  if (!s.trim()) return "";
  if (/fondo|inversi|financ|capital|asset|sociedad/i.test(sector)) {
    return "d) Negocios de instrumentos de inversión (Fondos)";
  }
  if (/seguro/i.test(sector)) return "c) Emite seguros con valor en efectivo";
  if (/banco|dep[oó]sit|ahorr/i.test(sector)) return "a) Acepta depósitos (Bancos)";
  return "";
}

/**
 * Completa campos vacíos del paquete SARLAFT con nombre de empresa / RL del intake.
 * No sobrescribe valores ya extraídos de documentos.
 */
export function applyIntakeToSarlaft(pkg: SarlaftPackage, intake: IntakeSarlaftInput): SarlaftPackage {
  const next: SarlaftPackage = JSON.parse(JSON.stringify(pkg));
  const empresa = intake.empresa.trim();
  const nombre = intake.nombre.trim();
  const sector = intake.sector.trim();

  if (empresa && isEmptyStr(next.formulario_1.nombre_completo_razon_social)) {
    next.formulario_1.nombre_completo_razon_social = empresa;
  }
  if (empresa && isEmptyStr(next.formulario_2.razon_social)) {
    next.formulario_2.razon_social = empresa;
  }
  if (sector && isEmptyStr(next.formulario_2.actividad_principal)) {
    const act = inferActividadFromSector(sector);
    if (act) next.formulario_2.actividad_principal = act;
  }
  if (nombre && isEmptyStr(next.formulario_3.representantes_ordenates)) {
    next.formulario_3.representantes_ordenates = nombre;
  }
  if (nombre && isEmptyStr(next.formulario_2.ubo.datos_personales)) {
    next.formulario_2.ubo.datos_personales = `${nombre} — Representante Legal`;
  }

  return next;
}

function liquidezFromPlazoText(plazo: string): Liquidez | "" {
  const p = plazo.toLowerCase();
  if (p.includes("menos de 1")) return "Muy relevante";
  if (p.includes("entre 1 y 5")) return "Algo relevante";
  if (p.includes("más de 5") || p.includes("mas de 5")) return "Nada relevante";
  if (p.includes("corto plazo") || /\bcorto\b/.test(p)) return "Muy relevante";
  if (p.includes("mediano plazo") || /\bmediano\b/.test(p)) return "Algo relevante";
  if (p.includes("largo plazo") || /\blargo\b/.test(p)) return "Nada relevante";
  return "";
}

function asOpt123(v: unknown): 1 | 2 | 3 | undefined {
  const n = typeof v === "number" && Number.isFinite(v) ? v : Number(v);
  return n === 1 || n === 2 || n === 3 ? (n as 1 | 2 | 3) : undefined;
}

function asOpt1234(v: unknown): 1 | 2 | 3 | 4 | undefined {
  const n = typeof v === "number" && Number.isFinite(v) ? v : Number(v);
  return n === 1 || n === 2 || n === 3 || n === 4 ? (n as 1 | 2 | 3 | 4) : undefined;
}

function cicloFromResp(r: 1 | 2 | 3): CicloEmpresa {
  if (r === 1) return "Joven/Crecimiento";
  if (r === 2) return "Trayectoria/Rentabilizar";
  return "Madura/Optimización tributaria";
}

function liquidezFromResp(r: 1 | 2 | 3): Liquidez {
  if (r === 1) return "Muy relevante";
  if (r === 2) return "Algo relevante";
  return "Nada relevante";
}

function experienciaFromResp(r: 1 | 2 | 3 | 4): ExperienciaInversion {
  if (r === 1) return "Cuentas/CDT";
  if (r === 2) return "Fondos de Inversión";
  if (r === 3) return "Bonos/Acciones";
  return "Derivados/Capital Privado";
}

/** Reacción ante desvalorización (pregunta 7 del guion). */
function toleranciaFromRespReaccion(r: 1 | 2 | 3 | 4): ToleranciaRiesgo {
  if (r === 1) return "Retirar todo";
  if (r === 2) return "Retirar parte";
  return "Esperar/Invertir más aprovechando precios bajos";
}

/** Expectativa ante volatilidad (pregunta 6): solo si falta tolerancia por reacción. */
function toleranciaFromRespExpectativa(r: 1 | 2 | 3): ToleranciaRiesgo {
  if (r === 1) return "Retirar parte";
  if (r === 2) return "Retirar parte";
  return "Esperar/Invertir más aprovechando precios bajos";
}

function cicloFromPerfilText(perfil: string): CicloEmpresa | "" {
  const t = perfil.toLowerCase();
  if (t.includes("joven")) return "Joven/Crecimiento";
  if (t.includes("madur")) return "Madura/Optimización tributaria";
  if (t.includes("trayectoria")) return "Trayectoria/Rentabilizar";
  return "";
}

function cicloFallback(portfolio: PortfolioRecommendation["portfolio"]): CicloEmpresa {
  if (portfolio === "agresivo") return "Joven/Crecimiento";
  if (portfolio === "conservador") return "Madura/Optimización tributaria";
  return "Trayectoria/Rentabilizar";
}

function experienciaFromPortfolio(portfolio: PortfolioRecommendation["portfolio"]): ExperienciaInversion {
  if (portfolio === "conservador") return "Cuentas/CDT";
  if (portfolio === "moderado") return "Fondos de Inversión";
  return "Bonos/Acciones";
}

function toleranciaFromPortfolio(portfolio: PortfolioRecommendation["portfolio"]): ToleranciaRiesgo {
  if (portfolio === "conservador") return "Retirar parte";
  return "Esperar/Invertir más aprovechando precios bajos";
}

function liquidezFromPortfolio(portfolio: PortfolioRecommendation["portfolio"]): Liquidez {
  if (portfolio === "conservador") return "Muy relevante";
  if (portfolio === "moderado") return "Algo relevante";
  return "Nada relevante";
}

/**
 * Enriquece formulario 3 con la entrevista de voz.
 * Prioriza `resp_*` del PORTFOLIO_JSON; si no vienen (sesiones antiguas), usa heurísticas con portfolio/perfil/plazo.
 */
export function applyInterviewToSarlaft(
  pkg: SarlaftPackage,
  rec: PortfolioRecommendation | null
): SarlaftPackage {
  if (!rec) return pkg;

  const next: SarlaftPackage = JSON.parse(JSON.stringify(pkg));
  const f3 = next.formulario_3;

  const rc = asOpt123(rec.resp_ciclo);
  const rl = asOpt123(rec.resp_liquidez);
  const rh = asOpt123(rec.resp_horizonte);
  const re = asOpt1234(rec.resp_experiencia);
  const rev = asOpt123(rec.resp_expectativa_vol);
  const rr = asOpt1234(rec.resp_reaccion);

  const liquidezFromInterview = rl ? liquidezFromResp(rl) : rh ? liquidezFromResp(rh) : undefined;

  const liq =
    liquidezFromInterview ??
    (liquidezFromPlazoText(rec.plazo || "") || liquidezFromPortfolio(rec.portfolio));

  const ciclo: CicloEmpresa = rc
    ? cicloFromResp(rc)
    : cicloFromPerfilText(rec.perfil || "") || cicloFallback(rec.portfolio);

  const experiencia: ExperienciaInversion = re
    ? experienciaFromResp(re)
    : experienciaFromPortfolio(rec.portfolio);

  const tolerancia: ToleranciaRiesgo = rr
    ? toleranciaFromRespReaccion(rr)
    : rev
      ? toleranciaFromRespExpectativa(rev)
      : toleranciaFromPortfolio(rec.portfolio);

  if (isEmptyStr(f3.liquidez)) {
    f3.liquidez = liq;
  }
  if (isEmptyStr(f3.ciclo_empresa)) {
    f3.ciclo_empresa = ciclo;
  }
  if (isEmptyStr(f3.experiencia_inversion)) {
    f3.experiencia_inversion = experiencia;
  }
  if (isEmptyStr(f3.tolerancia_riesgo)) {
    f3.tolerancia_riesgo = tolerancia;
  }

  return next;
}
