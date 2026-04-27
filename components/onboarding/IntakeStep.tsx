"use client";

import { useState } from "react";
import { ChevronRight, User, Building2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { IntakeData } from "@/app/onboarding/page";

const SECTORS = [
  "Tecnología", "Salud", "Manufactura", "Comercio", "Finanzas",
  "Construcción", "Agroindustria", "Educación", "Servicios", "Otro",
];

interface Props {
  data: IntakeData;
  onChange: (d: IntakeData) => void;
  onNext: (d: IntakeData) => void;
}

export function IntakeStep({ data, onChange, onNext }: Props) {
  const [touched, setTouched] = useState(false);

  const valid = data.nombre.trim() && data.empresa.trim() && data.sector;

  const handleNext = () => {
    setTouched(true);
    if (valid) onNext(data);
  };

  const set = (key: keyof IntakeData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...data, [key]: e.target.value });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero */}
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-2xl bg-[#BBE795] flex items-center justify-center mx-auto mb-4 shadow-[0_8px_24px_rgba(187,231,149,0.4)]">
          <User className="w-7 h-7 text-[#1a1a1a]" />
        </div>
        <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">¡Bienvenido!</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
          Cuéntanos un poco sobre ti y tu empresa. Solo toma 30 segundos.
        </p>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-6 space-y-5 shadow-sm">
        {/* Nombre */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            <User className="w-3 h-3" /> Tu nombre
          </label>
          <Input
            id="intake-nombre"
            placeholder="Ej. María Camila Rodríguez"
            value={data.nombre}
            onChange={set("nombre")}
            className={`h-11 rounded-xl text-sm ${touched && !data.nombre.trim() ? "ring-red-300 border-red-300" : ""}`}
          />
          {touched && !data.nombre.trim() && (
            <p className="text-xs text-red-500">Campo requerido</p>
          )}
        </div>

        {/* Empresa */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            <Building2 className="w-3 h-3" /> Nombre de la empresa
          </label>
          <Input
            id="intake-empresa"
            placeholder="Ej. Acropolis Labs S.A.S."
            value={data.empresa}
            onChange={set("empresa")}
            className={`h-11 rounded-xl text-sm ${touched && !data.empresa.trim() ? "ring-red-300 border-red-300" : ""}`}
          />
          {touched && !data.empresa.trim() && (
            <p className="text-xs text-red-500">Campo requerido</p>
          )}
        </div>

        {/* Sector */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            <Briefcase className="w-3 h-3" /> Sector de la empresa
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SECTORS.map((s) => (
              <button
                key={s}
                id={`sector-${s.toLowerCase()}`}
                onClick={() => onChange({ ...data, sector: s })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                  data.sector === s
                    ? "bg-[#BBE795] border-[#BBE795] text-[#1a1a1a] shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:border-[#BBE795]/60 hover:bg-[#F0FEE6]/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {touched && !data.sector && (
            <p className="text-xs text-red-500">Selecciona un sector</p>
          )}
        </div>
      </div>

      <Button
        id="intake-next"
        onClick={handleNext}
        className="w-full h-12 rounded-xl font-semibold text-sm bg-[#1a1a1a] text-white hover:bg-black shadow-lg flex items-center justify-center gap-2"
      >
        Continuar a la entrevista
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
