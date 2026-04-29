"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IntakeData } from "@/app/onboarding/page";

const SECTORS = [
  "Tecnología", "Salud", "Manufactura", "Comercio", "Finanzas",
  "Construcción", "Agroindustria", "Educación", "Servicios", "Otro",
];

interface Props {
  data: IntakeData;
  onChange: (d: IntakeData) => void;
  onNext: (d: IntakeData) => void;
  onBack?: () => void;
}

type QuestionId = "nombre" | "empresa" | "sector";

interface Question {
  id: QuestionId;
  index: number;
  question: string;
  hint: string;
  type: "text" | "chips";
  placeholder?: string;
}

const QUESTIONS: Question[] = [
  {
    id: "nombre",
    index: 1,
    question: "¿Nombre completo del representante legal?",
    hint: "Persona autorizada para firmar y vincular a la empresa en este proceso.",
    type: "text",
    placeholder: "Ej. María Camila Rodríguez Muñoz",
  },
  {
    id: "empresa",
    index: 2,
    question: "¿Razón social de la empresa?",
    hint: "Persona jurídica tal como figura en cámara de comercio o RUT.",
    type: "text",
    placeholder: "Ej. Acrópolis Labs S.A.S.",
  },
  {
    id: "sector",
    index: 3,
    question: "¿En qué sector opera la empresa?",
    hint: "Selecciona el sector principal de la compañía.",
    type: "chips",
  },
];

export function IntakeStep({ data, onChange, onNext, onBack }: Props) {
  const [currentQ, setCurrentQ] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [errors, setErrors] = useState<Partial<Record<QuestionId, string>>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const q = QUESTIONS[currentQ];
  const isLast = currentQ === QUESTIONS.length - 1;
  const progressDone = ((currentQ + 1) / QUESTIONS.length) * 100;

  useEffect(() => {
    if (q.type === "text") {
      const t = setTimeout(() => inputRef.current?.focus(), 320);
      return () => clearTimeout(t);
    }
  }, [currentQ, q.type]);

  const validate = useCallback((qId: QuestionId): boolean => {
    const val = data[qId];
    if (!val || !val.trim()) {
      setErrors((e) => ({ ...e, [qId]: "Este campo es requerido" }));
      return false;
    }
    setErrors((e) => ({ ...e, [qId]: undefined }));
    return true;
  }, [data]);

  const goNext = useCallback(() => {
    if (!validate(q.id)) return;
    if (isLast) {
      onNext(data);
      return;
    }
    setDirection("forward");
    setAnimating(true);
    setTimeout(() => {
      setCurrentQ((i) => i + 1);
      setAnimating(false);
    }, 220);
  }, [validate, q.id, isLast, onNext, data]);

  const goBack = () => {
    if (currentQ === 0) {
      onBack?.();
      return;
    }
    setDirection("back");
    setAnimating(true);
    setTimeout(() => {
      setCurrentQ((i) => i - 1);
      setAnimating(false);
    }, 220);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      goNext();
    }
  };

  const canGoBack = currentQ > 0 || Boolean(onBack);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={!canGoBack}
          className="h-9 px-0 text-gray-500 disabled:text-gray-300 disabled:opacity-60"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Volver
        </Button>
        <Button
          id="intake-next-top"
          onClick={goNext}
          className="h-9 px-5 rounded-lg font-semibold gap-1.5 bg-[#4a7c59] text-white hover:bg-[#3f6b4c] transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
        >
          {isLast ? "Continuar a documentación" : "Continuar"} <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <header>
        <p className="text-xs font-semibold text-[#6abf1a] uppercase tracking-wider mb-1">Paso 2 · Empresa</p>
        <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">Datos básicos de la persona jurídica</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-xl">
          Tres preguntas rápidas para identificar a la empresa y a su representante legal.
        </p>
      </header>

      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#BBE795] rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progressDone}%` }}
        />
      </div>

      <div
        className={`pt-2 transition-all duration-200 ${
          animating
            ? direction === "forward"
              ? "opacity-0 translate-y-3"
              : "opacity-0 -translate-y-3"
            : "opacity-100 translate-y-0"
        }`}
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="flex items-center gap-2 mt-1 shrink-0">
            <span className="text-sm font-bold text-[#1a1a1a] tabular-nums">{q.index}</span>
            <ArrowRight className="w-4 h-4 text-[#BBE795]" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl sm:text-2xl font-semibold text-[#1a1a1a] leading-snug tracking-tight">
              {q.question}
            </h3>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{q.hint}</p>
          </div>
        </div>

        <div className="ml-10">
          {q.type === "text" ? (
            <div className="space-y-2">
              <div className="border-b-2 border-gray-200 focus-within:border-[#4a7c59] transition-colors duration-200 pb-2">
                <input
                  ref={inputRef}
                  id={`intake-${q.id}`}
                  type="text"
                  placeholder={q.placeholder}
                  value={data[q.id]}
                  onChange={(e) => {
                    onChange({ ...data, [q.id]: e.target.value });
                    if (errors[q.id]) setErrors((er) => ({ ...er, [q.id]: undefined }));
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full text-lg text-[#1a1a1a] placeholder-gray-300 bg-transparent outline-none font-medium"
                />
              </div>
              {errors[q.id] && (
                <p className="text-xs text-red-500 animate-in fade-in duration-200">{errors[q.id]}</p>
              )}
              <p className="text-xs text-gray-400">
                Presiona{" "}
                <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-[10px] font-semibold text-gray-500">
                  Enter ↵
                </kbd>{" "}
                para continuar
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {SECTORS.map((s, i) => {
                  const selected = data.sector === s;
                  return (
                    <button
                      key={s}
                      id={`sector-${s.toLowerCase()}`}
                      onClick={() => {
                        onChange({ ...data, sector: s });
                        setErrors((er) => ({ ...er, sector: undefined }));
                      }}
                      className={`group flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                        selected
                          ? "border-[#4a7c59] bg-[#F0FEE6] text-[#1a1a1a]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:text-[#1a1a1a]"
                      }`}
                    >
                      <span className="text-[10px] text-gray-400 font-bold tabular-nums">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {s}
                      {selected && (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#4a7c59] text-white shrink-0">
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {errors[q.id] && (
                <p className="text-xs text-red-500 animate-in fade-in duration-200">{errors[q.id]}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-1.5">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === currentQ
                  ? "w-5 h-1.5 bg-[#1a1a1a]"
                  : i < currentQ
                  ? "w-1.5 h-1.5 bg-[#BBE795]"
                  : "w-1.5 h-1.5 bg-gray-200"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-400 tabular-nums">
          {currentQ + 1} / {QUESTIONS.length}
        </span>
      </div>
    </div>
  );
}
