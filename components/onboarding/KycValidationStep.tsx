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
import { Separator } from "@/components/ui/separator";
import type { IntakeData } from "@/app/onboarding/page";

const DEMO_NOMBRE = "Representante Legal Demo";

interface Props {
  intake: IntakeData;
  onConfirmIdentity: (nombreCompleto: string) => void;
  onBack: () => void;
}

type Phase = "welcome" | "verify" | "success";

/** Documento del representante legal (persona jurídica). */
const VERIFY_MESSAGES = [
  "Verificando documento…",
  "Extrayendo datos…",
  "Cruzando información segura…",
  "Finalizando validación…",
];

export function KycValidationStep({ intake, onConfirmIdentity, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [verifyMsgIdx, setVerifyMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const identityInputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearInterval(id));
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
    if (f) setIdentityFile(f);
    e.target.value = "";
  };

  const handleBack = () => {
    if (phase === "success") {
      setPhase("welcome");
      return;
    }
    if (phase === "verify") {
      setPhase("welcome");
      return;
    }
    onBack();
  };

  const handleTopNext = () => {
    if (phase === "welcome") {
      if (canStartStory) setPhase("verify");
      return;
    }
    if (phase === "success") {
      handleFinish();
    }
  };

  const canStartStory = identityFile !== null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack} className="text-muted-foreground gap-2 px-0 h-auto py-2">
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Volver
        </Button>
        <Button
          type="button"
          onClick={handleTopNext}
          disabled={(phase === "welcome" && !canStartStory) || phase === "verify"}
          className="h-9 px-5 rounded-lg gap-1 bg-[#4a7c59] text-white hover:bg-[#3f6b4c] disabled:bg-gray-100 disabled:text-gray-400 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
        >
          {phase === "success" ? "Siguiente" : "Avanzar"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {phase === "welcome" && (
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Paso 4 · KYC</p>
      )}

      {phase === "welcome" && (
        <Card className="max-w-xl mx-auto rounded-lg border shadow-sm gap-0 py-0 overflow-hidden sm:max-w-none">
          <div className="bg-background px-6 pt-8 pb-6 sm:px-8">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Representante legal</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-lg">
              Persona jurídica: adjunta el documento de identificación de quien actúa como representante legal ante{" "}
              <span className="font-medium text-foreground">{intake.empresa.trim() || "tu empresa"}</span>. PDF o imagen (recomendado
              hasta 10&nbsp;MB).
            </p>

            <div className="relative mx-auto mt-8 flex h-36 max-w-[280px] items-center justify-center select-none" aria-hidden>
              <div className="absolute left-6 top-6 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600/10 ring-1 ring-emerald-700/15">
                <CheckCircle2 className="h-5 w-5 text-emerald-800" strokeWidth={2} />
              </div>
              <Smartphone className="relative z-0 h-[7.5rem] w-[7.5rem] text-foreground/[0.08] stroke-[0.85]" strokeWidth={1} />
              <div className="absolute right-5 top-1/2 z-[1] flex h-[3.75rem] w-[5.5rem] -translate-y-1/2 items-center justify-center rounded-md border border-border/80 bg-background shadow-sm">
                <CreditCard className="h-7 w-7 text-emerald-800" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          <CardContent className="space-y-6 px-6 py-6 sm:px-8">
            <div>
              <p className="text-sm font-medium text-foreground">Cédula del representante legal</p>
              <p className="text-xs text-muted-foreground mt-1">Sube una copia legible (PDF o imagen).</p>
            </div>

            <input ref={identityInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={onIdentityFile} />

            <div className="space-y-3 rounded-lg border border-border bg-background p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="text-sm text-muted-foreground">Archivo (cédula):</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-9 shrink-0 gap-2 font-medium"
                  onClick={() => identityInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  {identityFile ? "Cambiar archivo" : "Subir cédula"}
                </Button>
              </div>
              {identityFile ? (
                <p className="truncate text-xs text-muted-foreground border-t border-border pt-3" title={identityFile.name}>
                  {identityFile.name}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Aún no has subido la cédula.</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-end border-t bg-muted/15 px-6 py-4 sm:px-8">
            <Button
              type="button"
              size="lg"
              disabled={!canStartStory}
              onClick={() => setPhase("verify")}
              className="min-w-[132px] gap-1 bg-[#4a7c59] text-white hover:bg-[#3f6b4c] disabled:bg-gray-100 disabled:text-gray-400"
            >
              Verificar
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </CardFooter>
        </Card>
      )}

      {phase === "verify" && (
        <Card className="rounded-lg overflow-hidden border border-gray-100 bg-white text-[#1a1a1a] shadow-sm gap-0 py-0">
          <CardHeader className="relative px-6 pt-6 pb-4 border-b border-gray-100 bg-[#fafcf8]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2 min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4a7c59]">Verificación</p>
                <p className="text-base font-medium leading-snug">{VERIFY_MESSAGES[verifyMsgIdx]}</p>
                {identityFile ? (
                  <p className="text-xs text-gray-500 truncate max-w-full">
                    Archivo: <span className="text-gray-700">{identityFile.name}</span>
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                <Loader2 className="h-4 w-4 animate-spin text-[#4a7c59]" aria-hidden />
                <span>En proceso</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-6 py-6 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-10">
              <div className="flex justify-center lg:justify-start lg:w-[240px] shrink-0">
                <div className="relative w-full max-w-[220px] aspect-[85.6/53.98] rounded-md bg-gradient-to-br from-gray-50 to-white ring-1 ring-gray-200 overflow-hidden shrink-0">
                  <div className="absolute inset-2 rounded-sm bg-gradient-to-br from-white to-gray-50 ring-1 ring-gray-100" />
                  <div className="absolute top-3 left-3 right-3 h-2 rounded-sm bg-gray-200/70" />
                  <div className="absolute top-9 left-3 w-14 h-[4.5rem] rounded-sm bg-[#4a7c59]/12 ring-1 ring-[#4a7c59]/20" />
                  <div className="absolute top-9 right-3 left-[4.75rem] space-y-1.5">
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
                <div className="h-1.5 rounded-sm bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-sm bg-[#4a7c59] transition-[width] duration-100 ease-linear" style={{ width: `${progress}%` }} />
                </div>
                <ul className="space-y-3 text-sm text-gray-600">
                  {["Formato válido", "Datos legibles", "Coincidencia de identidad"].map((label, i) => (
                    <li
                      key={label}
                      className={`flex items-start gap-3 transition-all duration-500 ${
                        progress > 22 * (i + 1) ? "opacity-100 translate-x-0" : "opacity-35"
                      }`}
                    >
                      <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${progress > 22 * (i + 1) ? "text-[#4a7c59]" : "text-gray-300"}`} />
                      <span className="leading-snug">{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "success" && (
        <Card className="rounded-lg shadow-sm gap-0 py-0 overflow-hidden animate-in zoom-in-95 duration-400">
          <CardHeader className="px-6 pt-6 pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted mx-auto sm:mx-0">
                <CheckCircle2 className="h-6 w-6 text-primary" strokeWidth={2} aria-hidden />
              </div>
              <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Completado</p>
                <CardTitle className="text-lg">Representante legal verificado (demo)</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Representante: <span className="font-medium text-foreground">{nombreFinal}</span>
                  {intake.empresa.trim() ? (
                    <>
                      {" "}
                      · Empresa (PJ): <span className="font-medium text-foreground">{intake.empresa}</span>
                    </>
                  ) : null}
                  {identityFile ? (
                    <span className="block truncate mt-1 text-xs text-muted-foreground">
                      Archivo: <span className="font-medium text-foreground">{identityFile.name}</span>
                    </span>
                  ) : null}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardFooter className="flex flex-col gap-4 px-6 py-5 items-stretch bg-muted/20">
            <p className="text-sm text-muted-foreground leading-relaxed text-center sm:text-left">
              Siguiente paso: <span className="font-medium text-foreground">asesor por voz</span>.
            </p>
            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto sm:self-end gap-1 bg-[#4a7c59] text-white hover:bg-[#3f6b4c]"
              onClick={handleFinish}
            >
              Continuar al asesor
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="pt-1" />
    </div>
  );
}
