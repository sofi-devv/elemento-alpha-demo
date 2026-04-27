import type { FatcaActividad, FatcaClasificacion } from "./schema";

export const FATCA_ACTIVIDAD_OPTIONS: FatcaActividad[] = [
  "a) Acepta depósitos (Bancos)",
  "b) Custodia activos financieros",
  "c) Emite seguros con valor en efectivo",
  "d) Negocios de instrumentos de inversión (Fondos)",
  "e) Ninguna de las anteriores",
];

export const FATCA_CLASIFICACION_OPTIONS: FatcaClasificacion[] = [
  "Entidad participante",
  "Entidad holding",
  "Entidad sin ánimo de lucro",
  "Entidad gubernamental",
  "Entidad cotizada en bolsa",
  "Otra",
];
