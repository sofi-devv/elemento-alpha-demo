"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  BarChart2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Conversation script ────────────────────────────────────────────────────────
const MESSAGES = [
  "¡Hola! Soy tu asesor virtual de Elemento. ¿En qué te puedo ayudar hoy?",
  "Antes de comenzar, déjame explicarte qué es un Fondo de Inversión Colectiva (FIC).",
  "Un FIC es un vehículo financiero donde múltiples inversionistas aportan sus recursos, los cuales son administrados de forma profesional por una sociedad fiduciaria. El objetivo es obtener rentabilidad de acuerdo con el nivel de riesgo que cada inversionista elija.",
  "¡Perfecto! Ahora iniciemos tu proceso de verificación de identidad. Necesitaré algunos datos personales para validar tu perfil.",
];

const TYPING_BASE_MS = 950;
const PAUSE_MS = 480;

type Phase = "intro" | "kyc" | "risk" | "done";

interface KycData {
  nombres: string;
  apellidos: string;
  tipoDoc: string;
  numDoc: string;
  fechaNac: string;
  email: string;
  celular: string;
}

const RISK_OPTIONS = [
  {
    id: "conservador",
    label: "Conservador",
    description:
      "Prefiero seguridad y estabilidad, aunque la rentabilidad sea menor.",
    icon: TrendingDown,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    activeRing: "ring-blue-300",
    activeBg: "bg-blue-50/60",
  },
  {
    id: "moderado",
    label: "Moderado",
    description:
      "Acepto cierta variabilidad a cambio de un mejor rendimiento.",
    icon: BarChart2,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    activeRing: "ring-amber-300",
    activeBg: "bg-amber-50/60",
  },
  {
    id: "agresivo",
    label: "Agresivo",
    description:
      "Busco la mayor rentabilidad posible, asumiendo mayor riesgo.",
    icon: TrendingUp,
    iconColor: "text-[#6abf1a]",
    iconBg: "bg-[#F0FEE6]",
    activeRing: "ring-[#BBE795]",
    activeBg: "bg-[#F0FEE6]/80",
  },
];

// ── Voice dot ─────────────────────────────────────────────────────────────────
function VoiceDot({ speaking }: { speaking: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-20 h-20 mx-auto">
      {speaking && (
        <>
          <span
            className="absolute inline-flex h-20 w-20 rounded-full bg-[#BBE795]/20 animate-ping"
            style={{ animationDuration: "1.8s" }}
          />
          <span
            className="absolute inline-flex h-14 w-14 rounded-full bg-[#BBE795]/30 animate-ping"
            style={{ animationDuration: "1.8s", animationDelay: "0.38s" }}
          />
        </>
      )}
      <span
        className={`absolute inline-flex h-14 w-14 rounded-full border-2 transition-all duration-500 ${
          speaking
            ? "border-[#BBE795]/80 scale-110"
            : "border-[#BBE795]/35 scale-100"
        }`}
      />
      <span
        className={`absolute inline-flex h-10 w-10 rounded-full transition-all duration-500 ${
          speaking ? "bg-[#BBE795]/40 scale-110" : "bg-[#BBE795]/15 scale-100"
        }`}
      />
      <span
        className={`relative inline-flex h-5 w-5 rounded-full bg-[#6abf1a] transition-all duration-300 ${
          speaking
            ? "scale-110 shadow-[0_0_16px_rgba(106,191,26,0.65)]"
            : "scale-100 shadow-[0_0_8px_rgba(106,191,26,0.3)]"
        }`}
      />
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-2 h-2 rounded-full bg-[#BBE795] animate-bounce"
          style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}

// ── Form field wrapper ────────────────────────────────────────────────────────
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function KycPage() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typingIndex, setTypingIndex] = useState<number>(-1);
  const [phase, setPhase] = useState<Phase>("intro");
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [kyc, setKyc] = useState<KycData>({
    nombres: "",
    apellidos: "",
    tipoDoc: "CC",
    numDoc: "",
    fechaNac: "",
    email: "",
    celular: "",
  });

  // ── Sequence intro messages ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "intro") return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 500;

    MESSAGES.forEach((msg, i) => {
      const typingDuration = Math.min(
        Math.max(msg.length * 13, TYPING_BASE_MS),
        2400
      );

      timers.push(setTimeout(() => setTypingIndex(i), elapsed));
      elapsed += typingDuration;

      timers.push(
        setTimeout(() => {
          setTypingIndex(-1);
          setVisibleCount(i + 1);
        }, elapsed)
      );
      elapsed += PAUSE_MS;
    });

    timers.push(setTimeout(() => setPhase("kyc"), elapsed + 400));

    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const kycValid =
    kyc.nombres.trim() &&
    kyc.apellidos.trim() &&
    kyc.numDoc.trim() &&
    kyc.fechaNac &&
    kyc.email.trim() &&
    kyc.celular.trim();

  const isSpeaking = typingIndex >= 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/">
            <button className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
          </Link>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              Onboarding · Fase 1
            </p>
            <h1 className="text-base font-semibold text-[#1a1a1a] leading-tight">
              Verificación de Identidad (KYC)
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        {/* ── Voice Agent Card ── */}
        <div className="bg-white rounded-2xl ring-1 ring-gray-100 px-6 py-8">
          <VoiceDot speaking={isSpeaking} />

          <div className="text-center mt-4 mb-6">
            <p className="text-[11px] font-semibold text-[#6abf1a] uppercase tracking-widest">
              Asesor Virtual · Elemento
            </p>
          </div>

          {/* Message thread */}
          <div className="space-y-3 min-h-[48px]">
            {MESSAGES.slice(0, visibleCount).map((msg, i) => (
              <div
                key={i}
                className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#BBE795] shrink-0" />
                <p className="text-sm text-[#1a1a1a] leading-relaxed">{msg}</p>
              </div>
            ))}

            {isSpeaking && <TypingIndicator />}
          </div>
        </div>

        {/* ── KYC Form ── */}
        {phase !== "intro" && (
          <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-6 space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div>
              <p className="text-[11px] font-semibold text-[#6abf1a] uppercase tracking-widest mb-1">
                Datos personales
              </p>
              <h2 className="text-lg font-bold text-[#1a1a1a]">
                Validación de identidad
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Completa tus datos para continuar con la vinculación.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombres">
                <Input
                  placeholder="Ej. María Camila"
                  value={kyc.nombres}
                  onChange={(e) =>
                    setKyc((k) => ({ ...k, nombres: e.target.value }))
                  }
                  disabled={phase !== "kyc"}
                />
              </Field>
              <Field label="Apellidos">
                <Input
                  placeholder="Ej. Rodríguez Torres"
                  value={kyc.apellidos}
                  onChange={(e) =>
                    setKyc((k) => ({ ...k, apellidos: e.target.value }))
                  }
                  disabled={phase !== "kyc"}
                />
              </Field>

              <Field label="Tipo de documento">
                <select
                  value={kyc.tipoDoc}
                  onChange={(e) =>
                    setKyc((k) => ({ ...k, tipoDoc: e.target.value }))
                  }
                  disabled={phase !== "kyc"}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="PA">Pasaporte</option>
                  <option value="NIT">NIT</option>
                </select>
              </Field>
              <Field label="Número de documento">
                <Input
                  placeholder="Ej. 1020304050"
                  value={kyc.numDoc}
                  onChange={(e) =>
                    setKyc((k) => ({ ...k, numDoc: e.target.value }))
                  }
                  disabled={phase !== "kyc"}
                />
              </Field>

              <Field label="Fecha de nacimiento">
                <Input
                  type="date"
                  value={kyc.fechaNac}
                  onChange={(e) =>
                    setKyc((k) => ({ ...k, fechaNac: e.target.value }))
                  }
                  disabled={phase !== "kyc"}
                />
              </Field>
              <Field label="Correo electrónico">
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={kyc.email}
                  onChange={(e) =>
                    setKyc((k) => ({ ...k, email: e.target.value }))
                  }
                  disabled={phase !== "kyc"}
                />
              </Field>

              <Field label="Número de celular">
                <Input
                  placeholder="Ej. 3001234567"
                  value={kyc.celular}
                  onChange={(e) =>
                    setKyc((k) => ({ ...k, celular: e.target.value }))
                  }
                  disabled={phase !== "kyc"}
                />
              </Field>
            </div>

            {phase === "kyc" && (
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setPhase("risk")}
                  disabled={!kycValid}
                  className={`flex items-center gap-2 font-semibold transition-all duration-300 ${
                    kycValid
                      ? "bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a] shadow-[0_4px_16px_rgba(187,231,149,0.35)]"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Continuar
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {(phase === "risk" || phase === "done") && (
              <div className="flex items-center gap-2 text-sm text-[#6abf1a] font-medium pt-2 border-t border-gray-100">
                <CheckCircle2 className="w-4 h-4" />
                <span>Datos validados correctamente</span>
              </div>
            )}
          </div>
        )}

        {/* ── Risk Profile ── */}
        {(phase === "risk" || phase === "done") && (
          <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-6 space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div>
              <p className="text-[11px] font-semibold text-[#6abf1a] uppercase tracking-widest mb-1">
                Perfil de riesgo
              </p>
              <h2 className="text-lg font-bold text-[#1a1a1a]">
                ¿Cuál describe mejor tu perfil?
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Selecciona el perfil que mejor se adapte a tus expectativas y
                tolerancia al riesgo.
              </p>
            </div>

            <div className="grid gap-3">
              {RISK_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = selectedRisk === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() =>
                      phase === "risk" && setSelectedRisk(opt.id)
                    }
                    disabled={phase === "done"}
                    className={`group flex items-center gap-4 p-4 rounded-xl ring-1 text-left transition-all duration-300 w-full ${
                      selected
                        ? `${opt.activeBg} ${opt.activeRing}`
                        : "bg-white ring-gray-100 hover:ring-[#BBE795]/40 hover:shadow-sm"
                    } disabled:cursor-not-allowed`}
                  >
                    <div
                      className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-colors duration-300 ${
                        selected
                          ? opt.iconBg
                          : "bg-gray-50 group-hover:bg-gray-100"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 transition-colors duration-300 ${
                          selected ? opt.iconColor : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold ${
                          selected ? "text-[#1a1a1a]" : "text-gray-700"
                        }`}
                      >
                        {opt.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                    {selected && (
                      <CheckCircle2 className="w-5 h-5 text-[#6abf1a] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {phase === "risk" && (
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setPhase("done")}
                  disabled={!selectedRisk}
                  className={`flex items-center gap-2 font-semibold transition-all duration-300 ${
                    selectedRisk
                      ? "bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a] shadow-[0_4px_16px_rgba(187,231,149,0.35)]"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Confirmar perfil
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Done ── */}
        {phase === "done" && (
          <div className="bg-[#F0FEE6] rounded-2xl ring-1 ring-[#BBE795]/40 p-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#BBE795] shrink-0">
                <CheckCircle2 className="w-6 h-6 text-[#1a1a1a]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#1a1a1a]">
                  Verificación de identidad completada
                </p>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Tus datos han sido registrados exitosamente. Continuaremos con
                  el proceso de vinculación SARLAFT.
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <Link href="/onboarding/sarlaft">
                <Button className="bg-[#1a1a1a] text-white hover:bg-black shadow-lg font-semibold flex items-center gap-2">
                  Continuar a SARLAFT
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
