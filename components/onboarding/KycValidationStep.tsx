"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  CreditCard,
  Upload,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { IntakeData } from "@/app/onboarding/page";

const DEMO_NOMBRE = "Representante Legal Demo";

interface Props {
  intake: IntakeData;
  onConfirmIdentity: (nombreCompleto: string) => void;
  onBack: () => void;
}

type Phase = "welcome" | "verify" | "success";

type ExtractedIdentity = {
  numeroCedula: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  fechaExpedicion: string;
  fechaExpiracion: string;
};

const VERIFY_MESSAGES = [
  "Verificando documento…",
  "Extrayendo datos…",
  "Cruzando información segura…",
  "Finalizando validación…",
];

const VERIFY_CHECKS = ["Formato válido", "Datos legibles", "Coincidencia de identidad"];

function buildMockExtraction(intake: IntakeData, file: File): ExtractedIdentity {
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const cleaned = baseName.replace(/[_-]+/g, " ").trim();
  const fallbackName = intake.nombre.trim() || DEMO_NOMBRE;

  // Hash simple y estable para que la demo se sienta consistente por archivo.
  const hashSeed = `${file.name}-${file.size}-${file.lastModified}`;
  let hash = 0;
  for (let i = 0; i < hashSeed.length; i++) {
    hash = (hash * 31 + hashSeed.charCodeAt(i)) >>> 0;
  }
  const cedulaNum = 100000000 + (hash % 900000000);

  const birthYear = 1968 + (hash % 25); // 1968-1992
  const birthMonth = ((hash >> 3) % 12) + 1;
  const birthDay = ((hash >> 6) % 28) + 1;

  const issueYear = Math.max(2000, birthYear + 18 + ((hash >> 9) % 8));
  const issueMonth = ((hash >> 12) % 12) + 1;
  const issueDay = ((hash >> 15) % 28) + 1;

  const expiryYear = issueYear + 10;
  const expiryMonth = issueMonth;
  const expiryDay = issueDay;

  const fmtDate = (y: number, m: number, d: number) =>
    `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;

  return {
    numeroCedula: `${cedulaNum}`.replace(/\B(?=(\d{3})+(?!\d))/g, "."),
    nombreCompleto: cleaned.length >= 6 ? cleaned.toUpperCase() : fallbackName.toUpperCase(),
    fechaNacimiento: fmtDate(birthYear, birthMonth, birthDay),
    fechaExpedicion: fmtDate(issueYear, issueMonth, issueDay),
    fechaExpiracion: fmtDate(expiryYear, expiryMonth, expiryDay),
  };
}

export function KycValidationStep({ intake, onConfirmIdentity, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [verifyMsgIdx, setVerifyMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [extractedIdentity, setExtractedIdentity] = useState<ExtractedIdentity | null>(null);
  const identityInputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearInterval(id));
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    if (phase !== "verify") return;
    clearTimers();
    setVerifyMsgIdx(0);
    setProgress(0);

    const spin = window.setInterval(() => {
      setVerifyMsgIdx((i) => (i + 1) % VERIFY_MESSAGES.length);
    }, 850);
    timersRef.current.push(spin);

    const start = performance.now();
    const duration = 3600;
    const tick = window.setInterval(() => {
      const elapsed = performance.now() - start;
      const p = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(p);
      if (p >= 100) {
        clearInterval(tick);
        window.setTimeout(() => setPhase("success"), 380);
      }
    }, 40);
    timersRef.current.push(tick);

    return () => clearTimers();
  }, [phase, clearTimers]);

  const nombreFinal = useMemo(() => intake.nombre.trim() || DEMO_NOMBRE, [intake.nombre]);

  const handleFinish = () => {
    onConfirmIdentity(nombreFinal);
  };

  const onIdentityFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setIdentityFile(f);
      setExtractedIdentity(buildMockExtraction(intake, f));
    }
    e.target.value = "";
  };

  const handleBack = () => {
    if (phase === "success" || phase === "verify") {
      clearTimers();
      setPhase("welcome");
      return;
    }
    onBack();
  };

  const canStartVerify = identityFile !== null;

  const handleTopNext = () => {
    if (phase === "welcome" && canStartVerify) {
      setPhase("verify");
      return;
    }
    if (phase === "success") {
      handleFinish();
    }
  };

  const topNextDisabled = (phase === "welcome" && !canStartVerify) || phase === "verify";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack} className="h-9 px-0 text-gray-500">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Volver
        </Button>
        <Button
          type="button"
          onClick={handleTopNext}
          disabled={topNextDisabled}
          className="h-9 px-5 rounded-lg font-semibold gap-1.5 bg-[#4a7c59] text-white hover:bg-[#3f6b4c] disabled:bg-gray-100 disabled:text-gray-400 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:shadow-none disabled:hover:translate-y-0"
        >
          {phase === "welcome" && "Verificar"}
          {phase === "verify" && "Verificando…"}
          {phase === "success" && "Continuar"}
          {phase !== "verify" && <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      <header>
        <p className="text-xs font-semibold text-[#6abf1a] uppercase tracking-wider mb-1">Paso 4 · KYC</p>
        <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">
          Verificación del representante legal
        </h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-xl">
          {phase === "welcome" &&
            "Sube la cédula del representante legal y validaremos su identidad de forma segura."}
          {phase === "verify" && "Estamos validando la información del documento."}
          {phase === "success" && "Identidad verificada correctamente."}
        </p>
      </header>

      {phase === "welcome" && (
        <Card className="rounded-lg border border-gray-100 shadow-sm gap-0 py-0 overflow-hidden">
          <div className="bg-[#fcfef8] px-6 pt-8 pb-6 sm:px-8 border-b border-gray-100">
            <p className="text-sm text-gray-600 leading-relaxed max-w-lg">
              Persona jurídica:{" "}
              <span className="font-medium text-[#1a1a1a]">
                {intake.empresa.trim() || "tu empresa"}
              </span>
              . Adjunta la cédula del representante legal en PDF o imagen (recomendado hasta 10&nbsp;MB).
            </p>

            <div
              className="relative mx-auto mt-8 flex h-32 max-w-[260px] items-center justify-center select-none"
              aria-hidden
            >
              <Smartphone className="relative z-0 h-28 w-28 text-gray-200" strokeWidth={1.25} />
              <div className="absolute right-4 top-1/2 z-[1] flex h-14 w-20 -translate-y-1/2 items-center justify-center rounded-md border border-gray-200 bg-white shadow-sm">
                <CreditCard className="h-7 w-7 text-[#4a7c59]" strokeWidth={1.5} />
              </div>
              <div className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#F0FEE6] ring-1 ring-[#BBE795]/40">
                <CheckCircle2 className="h-5 w-5 text-[#4a7c59]" strokeWidth={2} />
              </div>
            </div>
          </div>

          <CardContent className="space-y-4 px-6 py-6 sm:px-8">
            <div>
              <p className="text-sm font-medium text-[#1a1a1a]">Cédula del representante legal</p>
              <p className="text-xs text-gray-500 mt-1">Sube una copia legible (PDF o imagen).</p>
            </div>

            <input
              ref={identityInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={onIdentityFile}
            />

            <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600">Archivo (cédula):</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0 gap-2 font-medium"
                  onClick={() => identityInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  {identityFile ? "Cambiar archivo" : "Subir cédula"}
                </Button>
              </div>
              {identityFile ? (
                <p
                  className="truncate text-xs text-gray-600 border-t border-gray-100 pt-3"
                  title={identityFile.name}
                >
                  <CheckCircle2 className="inline h-3.5 w-3.5 text-[#4a7c59] mr-1 -mt-0.5" />
                  {identityFile.name}
                </p>
              ) : (
                <p className="text-xs text-gray-400">Aún no has subido la cédula.</p>
              )}
            </div>

            {extractedIdentity && (
              <div className="rounded-lg border border-gray-100 bg-[#fafcf8] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4a7c59] mb-2">
                  Datos detectados (vista previa)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <p className="text-gray-500">
                    Cédula: <span className="font-medium text-[#1a1a1a]">{extractedIdentity.numeroCedula}</span>
                  </p>
                  <p className="text-gray-500">
                    Nombre: <span className="font-medium text-[#1a1a1a]">{extractedIdentity.nombreCompleto}</span>
                  </p>
                  <p className="text-gray-500">
                    Nacimiento: <span className="font-medium text-[#1a1a1a]">{extractedIdentity.fechaNacimiento}</span>
                  </p>
                  <p className="text-gray-500">
                    Expedición: <span className="font-medium text-[#1a1a1a]">{extractedIdentity.fechaExpedicion}</span>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {phase === "verify" && (
        <Card className="rounded-lg overflow-hidden border border-gray-100 bg-white shadow-sm gap-0 py-0">
          <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-100 bg-[#fafcf8]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5 min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4a7c59]">
                  Verificación
                </p>
                <p className="text-base font-medium leading-snug text-[#1a1a1a]">
                  {VERIFY_MESSAGES[verifyMsgIdx]}
                </p>
                {identityFile && (
                  <p className="text-xs text-gray-500 truncate">
                    Archivo: <span className="text-gray-700">{identityFile.name}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                <Loader2 className="h-4 w-4 animate-spin text-[#4a7c59]" aria-hidden />
                <span>En proceso</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-6 py-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-8">
              <div className="flex justify-center lg:w-[220px] shrink-0">
                <div className="relative w-full max-w-[200px] aspect-[85.6/53.98] rounded-md bg-gradient-to-br from-gray-50 to-white ring-1 ring-gray-200 overflow-hidden">
                  <div className="absolute inset-2 rounded-sm bg-gradient-to-br from-white to-gray-50 ring-1 ring-gray-100" />
                  <div className="absolute top-3 left-3 right-3 h-2 rounded-sm bg-gray-200/70" />
                  <div className="absolute top-9 left-3 w-12 h-16 rounded-sm bg-[#4a7c59]/15 ring-1 ring-[#4a7c59]/25" />
                  <div className="absolute top-9 right-3 left-[4.25rem] space-y-1.5">
                    <div className="h-1.5 rounded-sm bg-gray-300 w-full" />
                    <div className="h-1.5 rounded-sm bg-gray-300 w-4/5" />
                    <div className="h-1.5 rounded-sm bg-gray-300 w-3/5" />
                  </div>
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
                    <div
                      className="kyc-scan-beam absolute left-0 right-0 h-9 -top-6 bg-gradient-to-b from-transparent via-[#4a7c59]/35 to-transparent blur-[1px]"
                      aria-hidden
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-5">
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span>Progreso</span>
                    <span className="tabular-nums font-medium text-[#1a1a1a]">{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#4a7c59] transition-[width] duration-100 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <ul className="space-y-2.5 text-sm text-gray-600">
                  {VERIFY_CHECKS.map((label, i) => {
                    const done = progress > 30 * (i + 1);
                    return (
                      <li
                        key={label}
                        className={`flex items-center gap-2.5 transition-all duration-500 ${
                          done ? "opacity-100" : "opacity-40"
                        }`}
                      >
                        <CheckCircle2
                          className={`h-4 w-4 shrink-0 ${done ? "text-[#4a7c59]" : "text-gray-300"}`}
                        />
                        <span className="leading-snug">{label}</span>
                      </li>
                    );
                  })}
                </ul>

                <div className="rounded-lg border border-gray-100 bg-[#fafcf8] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4a7c59] mb-2">
                    Extracción OCR (cédula)
                  </p>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 text-xs">
                    <div className={`transition-opacity duration-300 ${progress >= 20 ? "opacity-100" : "opacity-35"}`}>
                      <dt className="text-gray-500">Número de cédula</dt>
                      <dd className="font-medium text-[#1a1a1a]">
                        {progress >= 20 ? extractedIdentity?.numeroCedula ?? "No disponible" : "Leyendo…"}
                      </dd>
                    </div>
                    <div className={`transition-opacity duration-300 ${progress >= 35 ? "opacity-100" : "opacity-35"}`}>
                      <dt className="text-gray-500">Nombre completo</dt>
                      <dd className="font-medium text-[#1a1a1a]">
                        {progress >= 35 ? extractedIdentity?.nombreCompleto ?? "No disponible" : "Leyendo…"}
                      </dd>
                    </div>
                    <div className={`transition-opacity duration-300 ${progress >= 55 ? "opacity-100" : "opacity-35"}`}>
                      <dt className="text-gray-500">Fecha de nacimiento</dt>
                      <dd className="font-medium text-[#1a1a1a]">
                        {progress >= 55 ? extractedIdentity?.fechaNacimiento ?? "No disponible" : "Leyendo…"}
                      </dd>
                    </div>
                    <div className={`transition-opacity duration-300 ${progress >= 72 ? "opacity-100" : "opacity-35"}`}>
                      <dt className="text-gray-500">Fecha de expedición</dt>
                      <dd className="font-medium text-[#1a1a1a]">
                        {progress >= 72 ? extractedIdentity?.fechaExpedicion ?? "No disponible" : "Leyendo…"}
                      </dd>
                    </div>
                    <div className={`transition-opacity duration-300 ${progress >= 86 ? "opacity-100" : "opacity-35"}`}>
                      <dt className="text-gray-500">Fecha de expiración</dt>
                      <dd className="font-medium text-[#1a1a1a]">
                        {progress >= 86 ? extractedIdentity?.fechaExpiracion ?? "No disponible" : "Leyendo…"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "success" && (
        <Card className="rounded-lg border border-[#BBE795] shadow-sm gap-0 py-0 overflow-hidden animate-in zoom-in-95 fade-in duration-400">
          <CardHeader className="px-6 pt-6 pb-5 bg-[#F0FEE6]/50 border-b border-[#BBE795]/40">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-[#BBE795]">
                <CheckCircle2 className="h-6 w-6 text-[#4a7c59]" strokeWidth={2.25} aria-hidden />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4a7c59]">
                  Identidad verificada
                </p>
                <CardTitle className="text-lg leading-snug">
                  Listo, {nombreFinal.split(/\s+/)[0]}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Hemos validado la cédula del representante legal de{" "}
                  <span className="font-medium text-[#1a1a1a]">
                    {intake.empresa.trim() || "tu empresa"}
                  </span>
                  .
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 py-5 space-y-3">
            <dl className="text-sm space-y-2">
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="text-gray-500 sm:w-32 shrink-0">Representante</dt>
                <dd className="font-medium text-[#1a1a1a]">{nombreFinal}</dd>
              </div>
              {intake.empresa.trim() && (
                <div className="flex flex-col sm:flex-row sm:gap-2">
                  <dt className="text-gray-500 sm:w-32 shrink-0">Empresa</dt>
                  <dd className="font-medium text-[#1a1a1a]">{intake.empresa}</dd>
                </div>
              )}
              {identityFile && (
                <div className="flex flex-col sm:flex-row sm:gap-2">
                  <dt className="text-gray-500 sm:w-32 shrink-0">Documento</dt>
                  <dd className="font-medium text-[#1a1a1a] truncate">{identityFile.name}</dd>
                </div>
              )}
              {extractedIdentity && (
                <>
                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    <dt className="text-gray-500 sm:w-32 shrink-0">Cédula</dt>
                    <dd className="font-medium text-[#1a1a1a]">{extractedIdentity.numeroCedula}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    <dt className="text-gray-500 sm:w-32 shrink-0">Nacimiento</dt>
                    <dd className="font-medium text-[#1a1a1a]">{extractedIdentity.fechaNacimiento}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    <dt className="text-gray-500 sm:w-32 shrink-0">Expiración</dt>
                    <dd className="font-medium text-[#1a1a1a]">{extractedIdentity.fechaExpiracion}</dd>
                  </div>
                </>
              )}
            </dl>
          </CardContent>
          <CardFooter className="px-6 py-4 border-t border-gray-100 bg-white flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Siguiente: <span className="font-medium text-[#1a1a1a]">asesor por voz</span>.
            </p>
            <Button
              type="button"
              size="sm"
              className="gap-1.5 bg-[#4a7c59] text-white hover:bg-[#3f6b4c] h-9"
              onClick={handleFinish}
            >
              Continuar al asesor
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
