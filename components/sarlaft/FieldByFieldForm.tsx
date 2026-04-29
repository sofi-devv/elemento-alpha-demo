"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  SkipForward,
  Plus,
  Trash2,
} from "lucide-react";
import type { MissingFieldRef, SarlaftPackage } from "@/lib/sarlaft/schema";
import { patchPackageValue } from "@/lib/sarlaft/patchPackage";

function getPolFromPath(pkg: SarlaftPackage, path: string) {
  const parts = path.split(".");
  if (parts[0] !== "politicas" || parts.length < 2) return null;
  const k = parts[1] as keyof typeof pkg.formulario_1.politicas;
  return pkg.formulario_1.politicas[k];
}

export function FieldByFieldForm({
  package: initial,
  missing,
  onComplete,
  onUpdate,
}: {
  package: SarlaftPackage;
  missing: MissingFieldRef[];
  onComplete: (p: SarlaftPackage) => void;
  onUpdate?: (p: SarlaftPackage) => void;
}) {
  const [pkg, setPkg] = useState<SarlaftPackage>(initial);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());

  const total = missing.length;
  const current = missing[currentIndex];
  const progress = total > 0 ? Math.round(((completedFields.size) / total) * 100) : 100;

  const apply = useCallback(
    (ref: MissingFieldRef, value: unknown) => {
      let nextPkg: SarlaftPackage | undefined;
      setPkg((prev) => {
        nextPkg = patchPackageValue(prev, ref, value);
        return nextPkg;
      });
      // Notificar al padre fuera del updater de setState (evita actualizar SarlaftPage durante el render/update del hijo).
      if (nextPkg !== undefined) {
        const snapshot = nextPkg;
        queueMicrotask(() => {
          onUpdate?.(snapshot);
        });
      }
    },
    [onUpdate]
  );

  const handleNext = useCallback(() => {
    if (current) {
      setCompletedFields((prev) => new Set(prev).add(current.fieldKey));
    }
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onComplete(pkg);
    }
  }, [current, currentIndex, total, pkg, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handleSkip = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onComplete(pkg);
    }
  }, [currentIndex, total, pkg, onComplete]);

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-8 text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-[#BBE795] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-[#1a1a1a]" />
        </div>
        <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">Todos los campos están completos</h2>
        <p className="text-sm text-gray-500 mb-6">
          La IA logró extraer toda la información necesaria de los documentos.
        </p>
        <Button onClick={() => onComplete(pkg)} className="bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a]">
          Continuar al preview
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl ring-1 ring-gray-100 overflow-hidden animate-in fade-in">
      {/* Header con progreso */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#F0FEE6]/50 to-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-semibold text-[#6abf1a] uppercase tracking-widest">
              Completar información
            </p>
            <p className="text-sm font-semibold text-[#1a1a1a]">
              Campo {currentIndex + 1} de {total}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">{progress}% completado</p>
            <p className="text-[10px] text-gray-400">{completedFields.size} de {total} campos</p>
          </div>
        </div>
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#BBE795] to-[#7dd83a] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Indicador de sección */}
      <div className="px-6 py-2 bg-gray-50 border-b border-gray-100">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {current?.sectionLabel}
        </p>
      </div>

      {/* Campo actual */}
      <div className="p-6">
        {current && (
          <MissingFieldInput
            key={`${current.fieldKey}-${currentIndex}`}
            ref_={current}
            pkg={pkg}
            onApply={apply}
          />
        )}
      </div>

      {/* Navegación */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={currentIndex === 0}
          onClick={handlePrev}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={handleSkip}
          className="text-gray-400 hover:text-gray-600 gap-1"
        >
          <SkipForward className="w-4 h-4" />
          Saltar
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          className="bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a] gap-1"
        >
          {currentIndex === total - 1 ? "Finalizar" : "Siguiente"}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/** Editor para un `MissingFieldRef`; reutilizable en vista previa SARLAFT. */
export function MissingFieldInput({
  ref_,
  pkg,
  onApply,
  suppressAutoFocus,
}: {
  ref_: MissingFieldRef;
  pkg: SarlaftPackage;
  onApply: (r: MissingFieldRef, v: unknown) => void;
  /** Si hay varios editores en pantalla (p. ej. vista previa), evitar autofoco en todos. */
  suppressAutoFocus?: boolean;
}) {
  const r = ref_;
  const af = !suppressAutoFocus;

  if (r.type === "text") {
    const v = getF1F2F3String(pkg, r) ?? "";
    return (
      <div className="space-y-3">
        <Label className="text-base font-semibold text-[#1a1a1a]">{r.label}</Label>
        <Input
          value={v}
          onChange={(e) => onApply(r, e.target.value)}
          className="h-12 text-base"
          placeholder={`Ingresa ${r.label.toLowerCase()}`}
          autoFocus={af}
        />
      </div>
    );
  }

  if (r.type === "number") {
    const v = getF1Number(pkg, r) ?? "";
    return (
      <div className="space-y-3">
        <Label className="text-base font-semibold text-[#1a1a1a]">{r.label}</Label>
        <Input
          type="number"
          value={v === null || v === "" ? "" : v}
          onChange={(e) => onApply(r, e.target.value === "" ? "" : Number(e.target.value))}
          className="h-12 text-base"
          placeholder="0"
          autoFocus={af}
        />
      </div>
    );
  }

  if (r.type === "cifras") {
    const k = r.fieldKey.replace("cifras_financieras.", "") as keyof typeof pkg.formulario_3.cifras_financieras;
    const n = pkg.formulario_3.cifras_financieras[k];
    return (
      <div className="space-y-3">
        <Label className="text-base font-semibold text-[#1a1a1a]">{r.label}</Label>
        <p className="text-sm text-gray-500">Valor en COP (pesos colombianos)</p>
        <Input
          type="number"
          value={n ?? ""}
          onChange={(e) => onApply(r, e.target.value === "" ? null : Number(e.target.value))}
          className="h-12 text-base"
          placeholder="0"
          autoFocus={af}
        />
      </div>
    );
  }

  if ((r.type === "sino" || r.type === "sino-na") && r.options) {
    const cur = getSiNoValue(pkg, r) ?? "";
    return (
      <div className="space-y-4">
        <Label className="text-base font-semibold text-[#1a1a1a]">{r.label}</Label>
        <div className="grid gap-2">
          {r.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onApply(r, opt)}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                cur === opt
                  ? "border-[#BBE795] bg-[#F0FEE6]"
                  : "border-gray-200 hover:border-[#BBE795]/50 hover:bg-gray-50"
              }`}
            >
              <span className={`text-sm font-medium ${cur === opt ? "text-[#1a1a1a]" : "text-gray-700"}`}>
                {opt}
              </span>
              {cur === opt && <CheckCircle2 className="w-5 h-5 text-[#6abf1a]" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (r.type === "politica_pregunta" && r.options) {
    const pol = getPolFromPath(pkg, r.fieldKey);
    const v = (pol && "respuesta" in pol ? (pol.respuesta ?? "") : "") as string;
    const pregunta = (pol as { pregunta?: string })?.pregunta;
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold text-[#1a1a1a]">{r.label}</Label>
          {pregunta && <p className="text-sm text-gray-500 mt-1">{pregunta}</p>}
        </div>
        <div className="grid gap-2">
          {r.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onApply(r, opt)}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                v === opt
                  ? "border-[#BBE795] bg-[#F0FEE6]"
                  : "border-gray-200 hover:border-[#BBE795]/50 hover:bg-gray-50"
              }`}
            >
              <span className={`text-sm font-medium ${v === opt ? "text-[#1a1a1a]" : "text-gray-700"}`}>
                {opt}
              </span>
              {v === opt && <CheckCircle2 className="w-5 h-5 text-[#6abf1a]" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (r.type === "select" && r.options) {
    const v = getSelectValue(pkg, r) ?? "";
    return (
      <div className="space-y-4">
        <Label className="text-base font-semibold text-[#1a1a1a]">{r.label}</Label>
        {r.options.length <= 5 ? (
          <div className="grid gap-2">
            {r.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onApply(r, opt)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                  v === opt
                    ? "border-[#BBE795] bg-[#F0FEE6]"
                    : "border-gray-200 hover:border-[#BBE795]/50 hover:bg-gray-50"
                }`}
              >
                <span className={`text-sm font-medium ${v === opt ? "text-[#1a1a1a]" : "text-gray-700"}`}>
                  {opt}
                </span>
                {v === opt && <CheckCircle2 className="w-5 h-5 text-[#6abf1a] shrink-0" />}
              </button>
            ))}
          </div>
        ) : (
          <select
            className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-base focus:border-[#BBE795] focus:ring-0 transition-colors"
            value={v}
            onChange={(e) => onApply(r, e.target.value)}
          >
            <option value="">Selecciona una opción</option>
            {r.options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        )}
      </div>
    );
  }

  if (r.type === "multiselect" && r.options) {
    const cur = new Set(pkg.formulario_3.calidad_beneficiario_final);
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold text-[#1a1a1a]">{r.label}</Label>
          <p className="text-sm text-gray-500 mt-1">Puedes seleccionar varias opciones</p>
        </div>
        <div className="grid gap-2">
          {r.options.map((opt) => {
            const isSelected = cur.has(opt as (typeof pkg.formulario_3.calidad_beneficiario_final)[number]);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const n = new Set(cur);
                  if (isSelected) n.delete(opt as (typeof pkg.formulario_3.calidad_beneficiario_final)[number]);
                  else n.add(opt as (typeof pkg.formulario_3.calidad_beneficiario_final)[number]);
                  onApply(r, Array.from(n));
                }}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? "border-[#BBE795] bg-[#F0FEE6]"
                    : "border-gray-200 hover:border-[#BBE795]/50 hover:bg-gray-50"
                }`}
              >
                <span className={`text-sm font-medium ${isSelected ? "text-[#1a1a1a]" : "text-gray-700"}`}>
                  {opt}
                </span>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-[#6abf1a] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (r.type === "detalle_programa") {
    const pol = getPolFromPath(pkg, r.fieldKey) as { detalle_programa?: { organo_aprobacion: string; fecha_aprobacion: string } };
    const d = pol?.detalle_programa ?? { organo_aprobacion: "", fecha_aprobacion: "" };
    return (
      <div className="space-y-4">
        <Label className="text-base font-semibold text-[#1a1a1a]">{r.label}</Label>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-500">Órgano que lo aprobó</Label>
            <Input
              value={d.organo_aprobacion}
              onChange={(e) => onApply(r, { ...d, organo_aprobacion: e.target.value })}
              className="h-11"
              placeholder="Ej: Junta Directiva"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-gray-500">Fecha de aprobación</Label>
            <Input
              type="date"
              value={d.fecha_aprobacion}
              onChange={(e) => onApply(r, { ...d, fecha_aprobacion: e.target.value })}
              className="h-11"
            />
          </div>
        </div>
      </div>
    );
  }

  if (r.type === "detalle_regulacion") {
    const pol = getPolFromPath(pkg, r.fieldKey) as { detalle_regulacion?: { normatividad: string } };
    const d = pol?.detalle_regulacion ?? { normatividad: "" };
    return (
      <div className="space-y-3">
        <Label className="text-base font-semibold text-[#1a1a1a]">Normatividad que la rige</Label>
        <Input
          value={d.normatividad}
          onChange={(e) => onApply(r, { normatividad: e.target.value })}
          className="h-12 text-base"
          placeholder="Especifica la normatividad"
          autoFocus={af}
        />
      </div>
    );
  }

  if (r.type === "detalle_oficial") {
    const pol = getPolFromPath(pkg, r.fieldKey) as {
      detalle_oficial?: { nombre: string; identificacion: string; cargo: string; email: string; telefono: string };
    };
    const d = pol?.detalle_oficial ?? { nombre: "", identificacion: "", cargo: "", email: "", telefono: "" };
    return (
      <div className="space-y-4">
        <Label className="text-base font-semibold text-[#1a1a1a]">Datos del Oficial de Cumplimiento</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            ["nombre", "Nombre completo"],
            ["identificacion", "Número de identificación"],
            ["cargo", "Cargo"],
            ["email", "Correo electrónico"],
            ["telefono", "Teléfono"],
          ] as const).map(([k, label]) => (
            <div key={k} className={k === "telefono" ? "sm:col-span-2" : ""}>
              <Label className="text-xs text-gray-500">{label}</Label>
              <Input
                value={d[k as keyof typeof d]}
                onChange={(e) => onApply(r, { ...d, [k]: e.target.value })}
                className="h-10"
                type={k === "email" ? "email" : k === "telefono" ? "tel" : "text"}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (r.type === "detalle_cripto") {
    const pol = getPolFromPath(pkg, r.fieldKey) as { detalle_cripto?: { tipo_operaciones: string } };
    const d = pol?.detalle_cripto ?? { tipo_operaciones: "" };
    return (
      <div className="space-y-3">
        <Label className="text-base font-semibold text-[#1a1a1a]">Tipo de operaciones con activos virtuales</Label>
        <Input
          value={d.tipo_operaciones}
          onChange={(e) => onApply(r, { tipo_operaciones: e.target.value })}
          className="h-12 text-base"
          placeholder="Ej: Compra/venta de BTC, custodia..."
          autoFocus={af}
        />
      </div>
    );
  }

  if (r.type === "detalle_sancion") {
    const pol = getPolFromPath(pkg, r.fieldKey) as {
      detalle_sancion?: { fecha: string; motivo: string; autoridad: string; estado_actual: string };
    };
    const d = pol?.detalle_sancion ?? { fecha: "", motivo: "", autoridad: "", estado_actual: "" };
    return (
      <div className="space-y-4">
        <Label className="text-base font-semibold text-[#1a1a1a]">Detalle de sanción o investigación</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500">Fecha</Label>
            <Input type="date" value={d.fecha} onChange={(e) => onApply(r, { ...d, fecha: e.target.value })} className="h-10" />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Autoridad</Label>
            <Input value={d.autoridad} onChange={(e) => onApply(r, { ...d, autoridad: e.target.value })} className="h-10" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-gray-500">Motivo</Label>
            <Input value={d.motivo} onChange={(e) => onApply(r, { ...d, motivo: e.target.value })} className="h-10" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-gray-500">Estado actual</Label>
            <Input value={d.estado_actual} onChange={(e) => onApply(r, { ...d, estado_actual: e.target.value })} className="h-10" />
          </div>
        </div>
      </div>
    );
  }

  if (r.type === "pep") {
    const d = pkg.formulario_3.pep_detalle ?? { cargo_publico: "", fecha_vinculacion: "", tipo_parentesco: "" };
    return (
      <div className="space-y-4">
        <Label className="text-base font-semibold text-[#1a1a1a]">Información PEP (Persona Expuesta Políticamente)</Label>
        <div className="grid gap-3">
          <div>
            <Label className="text-xs text-gray-500">Cargo público</Label>
            <Input value={d.cargo_publico} onChange={(e) => onApply(r, { ...d, cargo_publico: e.target.value })} className="h-10" />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Fecha de vinculación</Label>
            <Input type="date" value={d.fecha_vinculacion} onChange={(e) => onApply(r, { ...d, fecha_vinculacion: e.target.value })} className="h-10" />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Tipo de parentesco</Label>
            <Input value={d.tipo_parentesco} onChange={(e) => onApply(r, { ...d, tipo_parentesco: e.target.value })} className="h-10" placeholder="Ej: Cónyuge, hijo, hermano..." />
          </div>
        </div>
      </div>
    );
  }

  if (r.type === "lista_accionistas") {
    return <AccionistasEditor ref_={r} pkg={pkg} onApply={onApply} />;
  }

  if (r.type === "accionista_row") {
    const m = r.fieldKey.match(/^accionistas\[(\d+)\]$/);
    const i = m ? Number(m[1]) : 0;
    const row = pkg.formulario_3.accionistas[i] ?? { nombre: "", id: "", porcentaje: null, cotiza_en_bolsa: "" as const };
    return (
      <div className="space-y-4">
        <Label className="text-base font-semibold text-[#1a1a1a]">{r.label}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500">Nombre</Label>
            <Input value={row.nombre} onChange={(e) => onApply(r, { ...row, nombre: e.target.value })} className="h-10" />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Identificación</Label>
            <Input value={row.id} onChange={(e) => onApply(r, { ...row, id: e.target.value })} className="h-10" />
          </div>
          <div>
            <Label className="text-xs text-gray-500">% Participación</Label>
            <Input type="number" value={row.porcentaje ?? ""} onChange={(e) => onApply(r, { ...row, porcentaje: e.target.value === "" ? null : Number(e.target.value) })} className="h-10" />
          </div>
          <div>
            <Label className="text-xs text-gray-500">¿Cotiza en bolsa?</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={row.cotiza_en_bolsa ?? ""}
              onChange={(e) => onApply(r, { ...row, cotiza_en_bolsa: e.target.value as "Sí" | "No" })}
            >
              <option value="">Selecciona</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  if (r.type === "lista_tin") {
    return <TinEditor ref_={r} pkg={pkg} onApply={onApply} />;
  }

  return (
    <div className="p-4 rounded-xl bg-amber-50 text-amber-800 text-sm">
      Campo no soportado: <strong>{r.type}</strong> — {r.fieldKey}
    </div>
  );
}

function AccionistasEditor({
  ref_,
  pkg,
  onApply,
}: {
  ref_: MissingFieldRef;
  pkg: SarlaftPackage;
  onApply: (r: MissingFieldRef, v: unknown) => void;
}) {
  const [rows, setRows] = useState(() =>
    pkg.formulario_3.accionistas.length
      ? pkg.formulario_3.accionistas
      : [{ nombre: "", id: "", porcentaje: null, cotiza_en_bolsa: "" as const }]
  );

  useEffect(() => {
    onApply(ref_, rows);
  }, [rows, ref_, onApply]);

  const updateRow = (i: number, patch: Partial<typeof rows[0]>) => {
    setRows((prev) => prev.map((r, j) => (i === j ? { ...r, ...patch } : r)));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold text-[#1a1a1a]">Accionistas con participación ≥ 5%</Label>
        <p className="text-sm text-gray-500 mt-1">Agrega al menos un accionista</p>
      </div>
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3 relative">
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => setRows((p) => p.filter((_, j) => j !== i))}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <p className="text-xs font-semibold text-gray-500">Accionista #{i + 1}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input placeholder="Nombre" value={row.nombre} onChange={(e) => updateRow(i, { nombre: e.target.value })} className="h-9" />
              <Input placeholder="Identificación" value={row.id} onChange={(e) => updateRow(i, { id: e.target.value })} className="h-9" />
              <Input type="number" placeholder="% participación" value={row.porcentaje ?? ""} onChange={(e) => updateRow(i, { porcentaje: e.target.value === "" ? null : Number(e.target.value) })} className="h-9" />
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={row.cotiza_en_bolsa ?? ""}
                onChange={(e) => updateRow(i, { cotiza_en_bolsa: e.target.value as "Sí" | "No" | "" })}
              >
                <option value="">¿Cotiza en bolsa?</option>
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setRows((p) => [...p, { nombre: "", id: "", porcentaje: null, cotiza_en_bolsa: "" as const }])}
        className="gap-1"
      >
        <Plus className="w-4 h-4" />
        Añadir accionista
      </Button>
    </div>
  );
}

function TinEditor({
  ref_,
  pkg,
  onApply,
}: {
  ref_: MissingFieldRef;
  pkg: SarlaftPackage;
  onApply: (r: MissingFieldRef, v: unknown) => void;
}) {
  const isSingleRow = /^ubo\.paises_tin\[\d+\]$/.test(ref_.fieldKey);

  if (isSingleRow) {
    const m = ref_.fieldKey.match(/\[(\d+)\]/);
    const i = m ? Number(m[1]) : 0;
    const row = pkg.formulario_2.ubo.paises_tin[i] ?? { pais: "", tin: "" };
    return (
      <div className="space-y-4">
        <Label className="text-base font-semibold text-[#1a1a1a]">{ref_.label}</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500">País</Label>
            <Input value={row.pais} onChange={(e) => onApply(ref_, { pais: e.target.value, tin: row.tin })} className="h-10" />
          </div>
          <div>
            <Label className="text-xs text-gray-500">TIN / NIT</Label>
            <Input value={row.tin} onChange={(e) => onApply(ref_, { pais: row.pais, tin: e.target.value })} className="h-10" />
          </div>
        </div>
      </div>
    );
  }

  const [rows, setRows] = useState(() =>
    pkg.formulario_2.ubo.paises_tin.length
      ? pkg.formulario_2.ubo.paises_tin
      : [{ pais: "", tin: "" }]
  );

  useEffect(() => {
    onApply(ref_, rows);
  }, [rows, ref_, onApply]);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold text-[#1a1a1a]">Países y TIN/NIT del beneficiario final</Label>
        <p className="text-sm text-gray-500 mt-1">Agrega al menos un registro</p>
      </div>
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
            <div>
              <Label className="text-xs text-gray-500">País</Label>
              <Input
                value={row.pais}
                onChange={(e) => setRows((p) => p.map((x, j) => (j === i ? { ...x, pais: e.target.value } : x)))}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">TIN / NIT</Label>
              <Input
                value={row.tin}
                onChange={(e) => setRows((p) => p.map((x, j) => (j === i ? { ...x, tin: e.target.value } : x)))}
                className="h-9"
              />
            </div>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => setRows((p) => p.filter((_, j) => j !== i))}
                className="h-9 w-9 flex items-center justify-center text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setRows((p) => [...p, { pais: "", tin: "" }])}
        className="gap-1"
      >
        <Plus className="w-4 h-4" />
        Añadir país/TIN
      </Button>
    </div>
  );
}

function getF1F2F3String(pkg: SarlaftPackage, r: MissingFieldRef): string {
  if (r.formId === "1") {
    if (r.fieldKey === "nombre_completo_razon_social") return pkg.formulario_1.nombre_completo_razon_social;
    if (r.fieldKey === "tipo_y_numero_identificacion") return pkg.formulario_1.tipo_y_numero_identificacion;
    if (r.fieldKey === "ciudades_paises_operacion") return pkg.formulario_1.ciudades_paises_operacion;
  }
  if (r.formId === "2") {
    if (r.fieldKey === "razon_social") return pkg.formulario_2.razon_social;
    if (r.fieldKey === "identificacion_tributaria") return pkg.formulario_2.identificacion_tributaria;
    if (r.fieldKey === "pais_constitucion_fiscal") return pkg.formulario_2.pais_constitucion_fiscal;
    if (r.fieldKey === "clasificacion_otra") return pkg.formulario_2.clasificacion_otra ?? "";
    if (r.fieldKey === "ubo.datos_personales") return pkg.formulario_2.ubo.datos_personales;
  }
  if (r.formId === "3") {
    if (r.fieldKey === "representantes_ordenates") return pkg.formulario_3.representantes_ordenates;
  }
  return "";
}

function getF1Number(pkg: SarlaftPackage, r: MissingFieldRef): number | "" | null {
  if (r.fieldKey === "num_oficinas_pais") return pkg.formulario_1.num_oficinas_pais;
  if (r.fieldKey === "num_oficinas_exterior") return pkg.formulario_1.num_oficinas_exterior;
  return null;
}

function getSiNoValue(pkg: SarlaftPackage, r: MissingFieldRef): string {
  if (r.formId === "3" && r.fieldKey === "es_pep") return pkg.formulario_3.es_pep ?? "";
  if (r.formId === "3" && r.fieldKey === "administra_recursos_publicos") return pkg.formulario_3.administra_recursos_publicos ?? "";
  const m = r.fieldKey.match(/^otras_14_preguntas\[(\d+)\]\.respuesta$/);
  if (m) {
    const i = Number(m[1]);
    return pkg.formulario_1.politicas.otras_14_preguntas[i]?.respuesta ?? "";
  }
  return "";
}

function getSelectValue(pkg: SarlaftPackage, r: MissingFieldRef): string {
  if (r.formId === "2") {
    if (r.fieldKey === "actividad_principal") return pkg.formulario_2.actividad_principal ?? "";
    if (r.fieldKey === "ingresos_activos_pasivos_50") return pkg.formulario_2.ingresos_activos_pasivos_50 ?? "";
    if (r.fieldKey === "clasificacion_fatca_crs") return pkg.formulario_2.clasificacion_fatca_crs ?? "";
    if (r.fieldKey === "ubo.tipo_control") return pkg.formulario_2.ubo.tipo_control ?? "";
  }
  if (r.formId === "3") {
    if (r.fieldKey === "tipo_empresa") return pkg.formulario_3.tipo_empresa ?? "";
    if (r.fieldKey === "grupo_contable_niif") return pkg.formulario_3.grupo_contable_niif ?? "";
    if (r.fieldKey === "ciclo_empresa") return pkg.formulario_3.ciclo_empresa ?? "";
    if (r.fieldKey === "liquidez") return pkg.formulario_3.liquidez ?? "";
    if (r.fieldKey === "experiencia_inversion") return pkg.formulario_3.experiencia_inversion ?? "";
    if (r.fieldKey === "tolerancia_riesgo") return pkg.formulario_3.tolerancia_riesgo ?? "";
  }
  return "";
}
