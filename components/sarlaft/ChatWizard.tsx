"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bot,
  CheckCircle2,
  ChevronRight,
  Keyboard,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import type { MissingFieldRef, SarlaftPackage } from "@/lib/sarlaft/schema";
import { patchPackageValue } from "@/lib/sarlaft/patchPackage";

type ToolState = "pending" | "done";
type Msg =
  | { kind: "assistant"; id: string; text: string }
  | { kind: "user"; id: string; text: string }
  | { kind: "tool"; id: string; fnName: string; args: unknown; state: ToolState }
  | { kind: "done"; id: string };

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function functionName(ref: MissingFieldRef): string {
  const base = ref.fieldKey.replace(/\[\d+\]/g, "").replace(/\./g, "_");
  return `save_${base}`;
}

function getPol(pkg: SarlaftPackage, fieldKey: string) {
  const parts = fieldKey.split(".");
  if (parts[0] !== "politicas" || parts.length < 2) return null;
  const k = parts[1] as keyof typeof pkg.formulario_1.politicas;
  return pkg.formulario_1.politicas[k];
}

function questionFor(ref: MissingFieldRef, pkg: SarlaftPackage): string {
  switch (ref.type) {
    case "politica_pregunta": {
      const pol = getPol(pkg, ref.fieldKey) as { pregunta?: string } | null;
      if (pol?.pregunta) return pol.pregunta;
      return ref.label;
    }
    case "cifras":
      return `${ref.label} (en COP)`;
    case "pep":
      return "Como indicaste que el representante o beneficiario es PEP, necesito algunos datos adicionales.";
    case "lista_accionistas":
      return "Agrega los accionistas con participación ≥ 5%. Al menos uno es obligatorio.";
    case "lista_tin":
      if (/^ubo\.paises_tin\[\d+\]$/.test(ref.fieldKey)) return `Completa ${ref.label.toLowerCase()}.`;
      return "Indica el país y el TIN / NIT del beneficiario final.";
    case "detalle_oficial":
      return "Datos del Oficial de Cumplimiento:";
    case "detalle_programa":
      return "¿Qué órgano aprobó el programa LA/FT y cuándo?";
    case "detalle_regulacion":
      return "¿Qué normatividad rige a tu entidad?";
    case "detalle_cripto":
      return "¿Qué tipo de operaciones con activos virtuales realiza tu entidad?";
    case "detalle_sancion":
      return "Cuéntame sobre la sanción o investigación:";
    case "multiselect":
      return `${ref.label} — puedes elegir varias opciones.`;
    case "sino":
    case "sino-na":
    case "select":
    case "text":
    case "number":
    default:
      return ref.label;
  }
}

function formatAnswer(ref: MissingFieldRef, value: unknown): string {
  if (value === "" || value === null || value === undefined) return "—";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    if (ref.type === "multiselect") return (value as string[]).join(", ");
    if (ref.type === "lista_accionistas")
      return `${value.length} accionista${value.length === 1 ? "" : "s"} registrado${value.length === 1 ? "" : "s"}`;
    if (ref.type === "lista_tin")
      return `${value.length} país/TIN registrado${value.length === 1 ? "" : "s"}`;
    return JSON.stringify(value);
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v !== "" && v != null
    );
    return entries.length === 0 ? "—" : entries.map(([k, v]) => `${k}: ${v}`).join(" · ");
  }
  return String(value);
}

function prettyJson(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

// — COMPOSER ——————————————————————————————————————————————————————————

type ComposerProps = {
  ref_: MissingFieldRef;
  pkg: SarlaftPackage;
  disabled: boolean;
  onSubmit: (value: unknown) => void;
  onSkip: () => void;
};

function ChipRow({
  options,
  disabled,
  onPick,
}: {
  options: readonly string[];
  disabled: boolean;
  onPick: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          disabled={disabled}
          onClick={() => onPick(o)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 bg-white hover:border-[#6abf1a] hover:text-[#6abf1a] hover:bg-[#F0FEE6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function TextComposer({
  placeholder,
  type = "text",
  disabled,
  onSubmit,
}: {
  placeholder?: string;
  type?: "text" | "number" | "date";
  disabled: boolean;
  onSubmit: (v: string) => void;
}) {
  const [v, setV] = useState("");
  const submit = () => {
    if (!v.trim() && type !== "number") return;
    onSubmit(v);
    setV("");
  };
  return (
    <div className="flex gap-2">
      <Input
        type={type}
        value={v}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        className="h-10"
        autoFocus
      />
      <Button
        type="button"
        onClick={submit}
        disabled={disabled || (!v.trim() && type !== "number")}
        className="bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a] h-10 px-3"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}

function MultiFieldComposer({
  fields,
  disabled,
  onSubmit,
  initial,
  submitLabel = "Guardar",
}: {
  fields: { key: string; label: string; type?: "text" | "number" | "date" | "email" | "tel"; placeholder?: string; colSpan?: 1 | 2 }[];
  initial?: Record<string, string>;
  disabled: boolean;
  onSubmit: (v: Record<string, string>) => void;
  submitLabel?: string;
}) {
  const [state, setState] = useState<Record<string, string>>(() => initial ?? {});
  useEffect(() => {
    setState(initial ?? {});
  }, [initial]);
  const canSubmit = fields.every((f) => (state[f.key] ?? "").trim().length > 0);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {fields.map((f) => (
          <div key={f.key} className={f.colSpan === 2 ? "sm:col-span-2" : ""}>
            <Label className="text-[11px] text-gray-500">{f.label}</Label>
            <Input
              type={f.type ?? "text"}
              placeholder={f.placeholder ?? f.label}
              value={state[f.key] ?? ""}
              disabled={disabled}
              onChange={(e) => setState((s) => ({ ...s, [f.key]: e.target.value }))}
              className="h-9"
            />
          </div>
        ))}
      </div>
      <Button
        type="button"
        onClick={() => onSubmit(state)}
        disabled={disabled || !canSubmit}
        className="bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a]"
      >
        {submitLabel}
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

function MultiSelectComposer({
  options,
  disabled,
  onSubmit,
}: {
  options: readonly string[];
  disabled: boolean;
  onSubmit: (v: string[]) => void;
}) {
  const [set, setSet] = useState<Set<string>>(new Set());
  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        {options.map((o) => {
          const on = set.has(o);
          return (
            <label
              key={o}
              className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                on ? "bg-[#F0FEE6] border-[#BBE795] text-[#3f8a0b]" : "bg-white border-gray-200 hover:border-[#BBE795]"
              }`}
            >
              <input
                type="checkbox"
                checked={on}
                disabled={disabled}
                onChange={(e) => {
                  setSet((prev) => {
                    const n = new Set(prev);
                    if (e.target.checked) n.add(o);
                    else n.delete(o);
                    return n;
                  });
                }}
                className="accent-[#6abf1a]"
              />
              <span className="text-sm">{o}</span>
            </label>
          );
        })}
      </div>
      <Button
        type="button"
        disabled={disabled || set.size === 0}
        onClick={() => onSubmit(Array.from(set))}
        className="bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a]"
      >
        Confirmar selección
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

type AccionistaRow = { nombre: string; id: string; porcentaje: number | null; cotiza_en_bolsa: "Sí" | "No" | "" };

function AccionistasComposer({
  disabled,
  initial,
  onSubmit,
}: {
  disabled: boolean;
  initial: AccionistaRow[];
  onSubmit: (v: AccionistaRow[]) => void;
}) {
  const [rows, setRows] = useState<AccionistaRow[]>(() =>
    initial.length ? initial : [{ nombre: "", id: "", porcentaje: null, cotiza_en_bolsa: "" }]
  );
  const canSubmit =
    rows.length > 0 &&
    rows.every(
      (r) =>
        r.nombre.trim() &&
        r.id.trim() &&
        r.porcentaje !== null &&
        (r.cotiza_en_bolsa === "Sí" || r.cotiza_en_bolsa === "No")
    );
  const update = (i: number, patch: Partial<AccionistaRow>) =>
    setRows((p) => p.map((r, j) => (i === j ? { ...r, ...patch } : r)));
  const add = () => setRows((p) => [...p, { nombre: "", id: "", porcentaje: null, cotiza_en_bolsa: "" }]);
  const remove = (i: number) => setRows((p) => p.filter((_, j) => j !== i));

  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-white p-3 space-y-2 relative"
        >
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
              aria-label="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <p className="text-[11px] font-semibold text-gray-500">Accionista #{i + 1}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              placeholder="Nombre"
              value={r.nombre}
              disabled={disabled}
              onChange={(e) => update(i, { nombre: e.target.value })}
              className="h-9"
            />
            <Input
              placeholder="Identificación"
              value={r.id}
              disabled={disabled}
              onChange={(e) => update(i, { id: e.target.value })}
              className="h-9"
            />
            <Input
              placeholder="% participación"
              type="number"
              value={r.porcentaje ?? ""}
              disabled={disabled}
              onChange={(e) =>
                update(i, { porcentaje: e.target.value === "" ? null : Number(e.target.value) })
              }
              className="h-9"
            />
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={r.cotiza_en_bolsa}
              disabled={disabled}
              onChange={(e) => update(i, { cotiza_en_bolsa: e.target.value as "Sí" | "No" | "" })}
            >
              <option value="">¿Cotiza en bolsa?</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={add}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Añadir accionista
        </Button>
        <Button
          type="button"
          disabled={disabled || !canSubmit}
          onClick={() => onSubmit(rows)}
          className="bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a]"
        >
          Guardar accionistas
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

type TinRow = { pais: string; tin: string };

function TinListComposer({
  disabled,
  initial,
  onSubmit,
}: {
  disabled: boolean;
  initial: TinRow[];
  onSubmit: (v: TinRow[]) => void;
}) {
  const [rows, setRows] = useState<TinRow[]>(() =>
    initial.length ? initial : [{ pais: "", tin: "" }]
  );
  const canSubmit = rows.length > 0 && rows.every((r) => r.pais.trim() && r.tin.trim());
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-white p-3 relative">
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => setRows((p) => p.filter((_, j) => j !== i))}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
              aria-label="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <Input
            placeholder="País"
            value={r.pais}
            disabled={disabled}
            onChange={(e) =>
              setRows((p) => p.map((x, j) => (j === i ? { ...x, pais: e.target.value } : x)))
            }
            className="h-9"
          />
          <Input
            placeholder="TIN / NIT"
            value={r.tin}
            disabled={disabled}
            onChange={(e) =>
              setRows((p) => p.map((x, j) => (j === i ? { ...x, tin: e.target.value } : x)))
            }
            className="h-9"
          />
        </div>
      ))}
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => setRows((p) => [...p, { pais: "", tin: "" }])}
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Añadir país/TIN
        </Button>
        <Button
          type="button"
          disabled={disabled || !canSubmit}
          onClick={() => onSubmit(rows)}
          className="bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a]"
        >
          Guardar
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function QuickReplyArea({ ref_, pkg, disabled, onSubmit, onSkip }: ComposerProps) {
  const r = ref_;
  const [expand, setExpand] = useState(false);

  if (r.type === "sino") {
    return <ChipRow options={r.options ?? ["Sí", "No"]} disabled={disabled} onPick={(v) => onSubmit(v)} />;
  }
  if (r.type === "sino-na") {
    return <ChipRow options={r.options ?? ["Sí", "No", "N/A"]} disabled={disabled} onPick={(v) => onSubmit(v)} />;
  }
  if (r.type === "politica_pregunta") {
    return <ChipRow options={r.options ?? ["Sí", "No", "N/A"]} disabled={disabled} onPick={(v) => onSubmit(v)} />;
  }
  if (r.type === "select" && r.options) {
    if (r.options.length <= 6) {
      return <ChipRow options={r.options} disabled={disabled} onPick={(v) => onSubmit(v)} />;
    }
    return (
      <select
        className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
        disabled={disabled}
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) onSubmit(e.target.value);
        }}
      >
        <option value="" disabled>
          Elige una opción…
        </option>
        {r.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  // Tipos simples que ya se cubren bien con el chat input (text, number, cifras)
  const simpleFreeform = r.type === "text" || r.type === "number" || r.type === "cifras";
  if (simpleFreeform) return null;

  // Tipos complejos: el formulario estructurado queda como alternativa colapsable.
  const complex =
    r.type === "multiselect" ||
    r.type === "detalle_oficial" ||
    r.type === "detalle_programa" ||
    r.type === "detalle_regulacion" ||
    r.type === "detalle_cripto" ||
    r.type === "detalle_sancion" ||
    r.type === "pep" ||
    r.type === "accionista_row" ||
    r.type === "lista_accionistas" ||
    r.type === "lista_tin";

  if (!complex) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpand((s) => !s)}
        disabled={disabled}
        className="text-[11px] font-semibold text-[#6abf1a] hover:underline disabled:opacity-40 inline-flex items-center gap-1"
      >
        {expand ? "Ocultar formulario" : "Usar formulario estructurado"}
        <ChevronRight className={`w-3 h-3 transition-transform ${expand ? "rotate-90" : ""}`} />
      </button>
      {expand && (
        <div className="rounded-xl ring-1 ring-gray-100 bg-gray-50/50 p-3">
          <Composer ref_={r} pkg={pkg} disabled={disabled} onSubmit={onSubmit} onSkip={onSkip} />
        </div>
      )}
    </div>
  );
}

function Composer({ ref_, pkg, disabled, onSubmit, onSkip }: ComposerProps) {
  const r = ref_;

  if (r.type === "text") {
    return <TextComposer disabled={disabled} placeholder={r.label} onSubmit={(v) => onSubmit(v)} />;
  }
  if (r.type === "number") {
    return (
      <TextComposer
        type="number"
        disabled={disabled}
        placeholder={r.label}
        onSubmit={(v) => onSubmit(v === "" ? "" : Number(v))}
      />
    );
  }
  if (r.type === "cifras") {
    return (
      <TextComposer
        type="number"
        disabled={disabled}
        placeholder="Monto en COP"
        onSubmit={(v) => onSubmit(v === "" ? "" : Number(v))}
      />
    );
  }
  if (r.type === "sino" || (r.type === "sino-na" && r.options)) {
    const options = r.options ?? ["Sí", "No"];
    return <ChipRow options={options} disabled={disabled} onPick={(v) => onSubmit(v)} />;
  }
  if (r.type === "politica_pregunta") {
    return <ChipRow options={r.options ?? ["Sí", "No", "N/A"]} disabled={disabled} onPick={(v) => onSubmit(v)} />;
  }
  if (r.type === "select" && r.options) {
    if (r.options.length <= 6) {
      return <ChipRow options={r.options} disabled={disabled} onPick={(v) => onSubmit(v)} />;
    }
    return (
      <div className="flex gap-2">
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
          disabled={disabled}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) onSubmit(e.target.value);
          }}
        >
          <option value="" disabled>
            Elige una opción…
          </option>
          {r.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (r.type === "multiselect" && r.options) {
    return <MultiSelectComposer options={r.options} disabled={disabled} onSubmit={(v) => onSubmit(v)} />;
  }
  if (r.type === "detalle_programa") {
    return (
      <MultiFieldComposer
        disabled={disabled}
        onSubmit={(v) => onSubmit(v)}
        fields={[
          { key: "organo_aprobacion", label: "Órgano que aprobó" },
          { key: "fecha_aprobacion", label: "Fecha de aprobación", type: "date" },
        ]}
      />
    );
  }
  if (r.type === "detalle_regulacion") {
    return (
      <TextComposer
        disabled={disabled}
        placeholder="Normatividad que la rige"
        onSubmit={(v) => onSubmit({ normatividad: v })}
      />
    );
  }
  if (r.type === "detalle_cripto") {
    return (
      <TextComposer
        disabled={disabled}
        placeholder="Tipo de operaciones (ej. compra/venta de BTC…)"
        onSubmit={(v) => onSubmit({ tipo_operaciones: v })}
      />
    );
  }
  if (r.type === "detalle_oficial") {
    return (
      <MultiFieldComposer
        disabled={disabled}
        onSubmit={(v) => onSubmit(v)}
        fields={[
          { key: "nombre", label: "Nombre" },
          { key: "identificacion", label: "Identificación" },
          { key: "cargo", label: "Cargo" },
          { key: "email", label: "Email", type: "email" },
          { key: "telefono", label: "Teléfono", type: "tel", colSpan: 2 },
        ]}
      />
    );
  }
  if (r.type === "detalle_sancion") {
    return (
      <MultiFieldComposer
        disabled={disabled}
        onSubmit={(v) => onSubmit(v)}
        fields={[
          { key: "fecha", label: "Fecha", type: "date" },
          { key: "autoridad", label: "Autoridad" },
          { key: "motivo", label: "Motivo", colSpan: 2 },
          { key: "estado_actual", label: "Estado actual", colSpan: 2 },
        ]}
      />
    );
  }
  if (r.type === "pep") {
    return (
      <MultiFieldComposer
        disabled={disabled}
        onSubmit={(v) => onSubmit(v)}
        fields={[
          { key: "cargo_publico", label: "Cargo público", colSpan: 2 },
          { key: "fecha_vinculacion", label: "Fecha vinculación", type: "date" },
          { key: "tipo_parentesco", label: "Tipo de parentesco" },
        ]}
      />
    );
  }
  if (r.type === "accionista_row") {
    return (
      <MultiFieldComposer
        disabled={disabled}
        onSubmit={(v) => {
          onSubmit({
            nombre: v.nombre ?? "",
            id: v.id ?? "",
            porcentaje: v.porcentaje ? Number(v.porcentaje) : null,
            cotiza_en_bolsa: (v.cotiza_en_bolsa === "Sí" || v.cotiza_en_bolsa === "No" ? v.cotiza_en_bolsa : "") as "Sí" | "No" | "",
          });
        }}
        fields={[
          { key: "nombre", label: "Nombre" },
          { key: "id", label: "Identificación" },
          { key: "porcentaje", label: "% participación", type: "number" },
          { key: "cotiza_en_bolsa", label: "Cotiza en bolsa (Sí/No)" },
        ]}
      />
    );
  }
  if (r.type === "lista_accionistas") {
    return (
      <AccionistasComposer
        disabled={disabled}
        initial={pkg.formulario_3.accionistas as AccionistaRow[]}
        onSubmit={(v) => onSubmit(v)}
      />
    );
  }
  if (r.type === "lista_tin") {
    if (/^ubo\.paises_tin\[\d+\]$/.test(r.fieldKey)) {
      return (
        <MultiFieldComposer
          disabled={disabled}
          onSubmit={(v) => onSubmit({ pais: v.pais ?? "", tin: v.tin ?? "" })}
          fields={[
            { key: "pais", label: "País" },
            { key: "tin", label: "TIN / NIT" },
          ]}
        />
      );
    }
    return (
      <TinListComposer
        disabled={disabled}
        initial={pkg.formulario_2.ubo.paises_tin as TinRow[]}
        onSubmit={(v) => onSubmit(v)}
      />
    );
  }

  return (
    <div className="text-xs text-amber-600">
      Tipo de campo no soportado: {r.type} —
      <button type="button" className="underline ml-1" onClick={onSkip} disabled={disabled}>
        saltar
      </button>
    </div>
  );
}

// — MAIN ————————————————————————————————————————————————————————————

type ChatTurn = { ack?: string; question?: string; closing?: string };
type HistoryItem = { role: "assistant" | "user"; text: string };

function toFieldInfo(r: MissingFieldRef) {
  return {
    fieldKey: r.fieldKey,
    label: r.label,
    sectionLabel: r.sectionLabel,
    type: r.type,
    options: r.options,
  };
}

/**
 * Extrae "palabras clave" del label para comprobar que la pregunta generada
 * por la IA realmente habla del campo correcto (evita que use el label previo).
 */
function keyTokensFromLabel(label: string): string[] {
  const stop = new Set([
    "el","la","los","las","un","una","unos","unas","de","del","que","en","y","o","u","a","al","con","por","para","su","sus","es","son","tu","tus","mi","mis","le","les","se","lo","las","entidad","empresa","¿","?","si","no",
  ]);
  return label
    .toLowerCase()
    .replace(/[¿?,.;:()]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stop.has(w));
}

function aiQuestionMatchesLabel(aiText: string, label: string): boolean {
  const tokens = keyTokensFromLabel(label);
  if (tokens.length === 0) return true;
  const hay = aiText.toLowerCase();
  const hits = tokens.filter((t) => hay.includes(t)).length;
  return hits >= Math.min(2, tokens.length);
}

/**
 * Garantiza que la burbuja muestre todas las opciones cuando el campo las tiene
 * (por si la IA se las deja por fuera).
 */
function ensureOptionsInQuestion(ref: MissingFieldRef, text: string): string {
  const opts = ref.options ?? [];
  if (opts.length === 0) return text;
  if (ref.type === "sino" || ref.type === "sino-na" || ref.type === "politica_pregunta") return text;
  const lower = text.toLowerCase();
  const mentions = opts.filter((o) => {
    const head = o.toLowerCase().split(/[^a-záéíóúñ0-9]+/i).filter(Boolean)[0] ?? "";
    return head.length > 3 && lower.includes(head);
  }).length;
  if (mentions >= Math.min(2, opts.length)) return text;
  const list = opts.map((o) => `• ${o}`).join("\n");
  const trimmed = text.trim().replace(/[:：]?\s*$/, "");
  return `${trimmed}\n\n${list}`;
}

function composeAssistantQuestion(
  ref: MissingFieldRef,
  aiQuestion: string | undefined,
  pkg: SarlaftPackage
): string {
  const fallback = questionFor(ref, pkg);
  const ai = aiQuestion?.trim();
  const base = ai && aiQuestionMatchesLabel(ai, ref.label) ? ai : fallback;
  return ensureOptionsInQuestion(ref, base);
}

function getCompanyName(pkg: SarlaftPackage): string {
  return (
    pkg.formulario_2.razon_social?.trim() ||
    pkg.formulario_1.nombre_completo_razon_social?.trim() ||
    ""
  );
}

async function fetchChatTurn(payload: {
  mode: "start" | "turn";
  lastAnswer?: { field: string; label: string; value: unknown } | null;
  nextField?: ReturnType<typeof toFieldInfo> | null;
  history: HistoryItem[];
  company: string;
  progress: { done: number; total: number };
}): Promise<ChatTurn> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    const res = await fetch("/api/sarlaft/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return {};
    const j = (await res.json()) as ChatTurn;
    return {
      ack: j.ack?.trim() || undefined,
      question: j.question?.trim() || undefined,
      closing: j.closing?.trim() || undefined,
    };
  } catch {
    return {};
  }
}

type ParseResult = {
  value?: unknown;
  confidence?: "high" | "medium" | "low";
  clarification?: string;
  ack?: string;
};

async function fetchParse(payload: {
  field: ReturnType<typeof toFieldInfo>;
  userText: string;
  currentValue?: unknown;
}): Promise<ParseResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    const res = await fetch("/api/sarlaft/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "parse", ...payload }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return {};
    return (await res.json()) as ParseResult;
  } catch {
    return {};
  }
}

function ChatInput({
  disabled,
  placeholder,
  onSend,
}: {
  disabled: boolean;
  placeholder: string;
  onSend: (text: string) => void;
}) {
  const [v, setV] = useState("");
  const submit = () => {
    const t = v.trim();
    if (!t) return;
    onSend(t);
    setV("");
  };
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 relative">
        <Input
          value={v}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className="h-11 pr-3 rounded-full bg-white"
        />
      </div>
      <Button
        type="button"
        onClick={submit}
        disabled={disabled || !v.trim()}
        className="bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a] h-11 w-11 p-0 rounded-full shrink-0"
        title="Enviar respuesta"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}

function placeholderForField(ref: MissingFieldRef): string {
  switch (ref.type) {
    case "sino":
    case "sino-na":
      return "Escribe “sí”, “no” o lo que aplique…";
    case "politica_pregunta":
      return "Responde “sí”, “no” o describe lo que aplique…";
    case "select":
      return "Escribe la opción que aplique (o su número)…";
    case "multiselect":
      return "Lista las opciones que apliquen, separadas por comas…";
    case "number":
    case "cifras":
      return "Escribe el monto (ej. 5 millones o 5000000)…";
    case "detalle_oficial":
      return "Ej. María Pérez, CC 12345, Oficial de cumplimiento, maria@empresa.co, 3001234567";
    case "detalle_programa":
      return "Ej. Junta Directiva, 15 de marzo de 2024";
    case "detalle_regulacion":
      return "Escribe la normatividad que rige a tu entidad…";
    case "detalle_cripto":
      return "Describe las operaciones con activos virtuales…";
    case "detalle_sancion":
      return "Ej. 2024-05-10, Superfinanciera, motivo, estado actual";
    case "pep":
      return "Ej. Ministro de Hacienda, 2022-01-15, hermano";
    case "accionista_row":
      return "Ej. Juan Pérez, CC 12345, 25%, no cotiza";
    case "lista_accionistas":
      return "Lista cada accionista (ej. “Juan 30%, Ana 25%…”)";
    case "lista_tin":
      return "Ej. Colombia – 900123456, México – RFC ABC…";
    default:
      return "Escribe tu respuesta…";
  }
}

export function ChatWizard({
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
  const queue = useMemo(() => missing, [missing]);
  const [pkg, setPkg] = useState<SarlaftPackage>(initial);
  const [cursor, setCursor] = useState(0);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);

  const logRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<HistoryItem[]>([]);
  /** En Strict Mode el efecto corre dos veces: evita dos burbujas iniciales, pero el fetch puede repetirse (el último gana). */
  const bootAssistantIdRef = useRef<string | null>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const pushMsgs = useCallback((...m: Msg[]) => {
    setMessages((prev) => [...prev, ...m]);
    for (const msg of m) {
      if (msg.kind === "assistant" || msg.kind === "user") {
        historyRef.current = [
          ...historyRef.current.slice(-19),
          { role: msg.kind, text: msg.text },
        ];
      }
    }
  }, []);

  // Boot: primera pregunta visible al instante. La IA solo refina el texto después (sin bloquear la UI).
  // Antes: bootedRef + setBusy(true) + Strict Mode dejaba la pantalla cargando sin mensaje.
  useEffect(() => {
    let alive = true;
    const first = queue[0];

    if (queue.length === 0) {
      if (bootAssistantIdRef.current !== "empty") {
        bootAssistantIdRef.current = "empty";
        pushMsgs(
          {
            kind: "assistant",
            id: genId(),
            text: "Todo listo: la IA logró extraer todos los campos. Puedes continuar al preview.",
          },
          { kind: "done", id: genId() }
        );
      }
      return;
    }

    let initialText = "";
    if (bootAssistantIdRef.current === null || bootAssistantIdRef.current === "empty") {
      const bootMsgId = genId();
      bootAssistantIdRef.current = bootMsgId;
      initialText = composeAssistantQuestion(first, undefined, initial);
      pushMsgs({
        kind: "assistant",
        id: bootMsgId,
        text: initialText,
      });
    } else {
      initialText = composeAssistantQuestion(first, undefined, initial);
    }

    const bootMsgId = bootAssistantIdRef.current;
    if (typeof bootMsgId !== "string" || bootMsgId === "empty") return;

    (async () => {
      const turn = await fetchChatTurn({
        mode: "start",
        lastAnswer: null,
        nextField: toFieldInfo(first),
        history: [],
        company: getCompanyName(initial),
        progress: { done: 0, total: queue.length },
      });
      if (!alive) return;
      const refined = composeAssistantQuestion(first, turn.question, initial);
      if (refined === initialText) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === bootMsgId && m.kind === "assistant" ? { ...m, text: refined } : m))
      );
      const h = historyRef.current;
      if (h.length && h[h.length - 1]?.role === "assistant") {
        historyRef.current = [...h.slice(0, -1), { role: "assistant", text: refined }];
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = useCallback(
    async (value: unknown) => {
      if (busy) return;
      if (cursor >= queue.length) return;
      const ref = queue[cursor];
      setBusy(true);

      const userMsg: Msg = { kind: "user", id: genId(), text: formatAnswer(ref, value) };
      const toolMsg: Msg = {
        kind: "tool",
        id: genId(),
        fnName: functionName(ref),
        args: { field: ref.fieldKey, value },
        state: "pending",
      };
      pushMsgs(userMsg, toolMsg);

      await new Promise((r) => setTimeout(r, 550));

      const nextPkg = patchPackageValue(pkg, ref, value);
      setPkg(nextPkg);
      onUpdate?.(nextPkg);

      setMessages((prev) =>
        prev.map((m) => (m.id === toolMsg.id && m.kind === "tool" ? { ...m, state: "done" as ToolState } : m))
      );

      const nextIdx = cursor + 1;
      const nextRef = nextIdx >= queue.length ? null : queue[nextIdx];

      const turn = await fetchChatTurn({
        mode: "turn",
        lastAnswer: { field: ref.fieldKey, label: ref.label, value },
        nextField: nextRef ? toFieldInfo(nextRef) : null,
        history: historyRef.current.slice(-12),
        company: getCompanyName(nextPkg),
        progress: { done: nextIdx, total: queue.length },
      });

      if (turn.ack) {
        pushMsgs({ kind: "assistant", id: genId(), text: turn.ack });
        await new Promise((r) => setTimeout(r, 150));
      }

      if (!nextRef) {
        pushMsgs(
          {
            kind: "assistant",
            id: genId(),
            text:
              turn.closing ||
              "Listo — guardé todos los campos pendientes. Puedes revisar y exportar tu paquete.",
          },
          { kind: "done", id: genId() }
        );
      } else {
        pushMsgs({
          kind: "assistant",
          id: genId(),
          text: composeAssistantQuestion(nextRef, turn.question, nextPkg),
        });
      }

      setCursor(nextIdx);
      setBusy(false);
    },
    [busy, cursor, queue, pkg, pushMsgs, onUpdate]
  );

  const handleUserText = useCallback(
    async (text: string) => {
      if (busy) return;
      if (cursor >= queue.length) return;
      const ref = queue[cursor];
      setBusy(true);

      const userMsg: Msg = { kind: "user", id: genId(), text };
      const toolMsg: Msg = {
        kind: "tool",
        id: genId(),
        fnName: functionName(ref),
        args: { field: ref.fieldKey, input: text },
        state: "pending",
      };
      pushMsgs(userMsg, toolMsg);

      const parsed = await fetchParse({
        field: toFieldInfo(ref),
        userText: text,
      });

      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-console
        console.log("[ChatWizard] parse response:", parsed);
      }

      const hasValue =
        parsed.value !== undefined &&
        parsed.value !== null &&
        parsed.value !== "" &&
        !(Array.isArray(parsed.value) && parsed.value.length === 0 && ref.type !== "multiselect") &&
        !(
          typeof parsed.value === "object" &&
          parsed.value !== null &&
          !Array.isArray(parsed.value) &&
          Object.keys(parsed.value as Record<string, unknown>).length === 0
        );

      if (!hasValue) {
        const fallback =
          parsed.clarification ||
          "No pude interpretar tu respuesta. ¿Puedes reformularla, darme más detalle o usar los botones?";
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== toolMsg.id),
          { kind: "assistant", id: genId(), text: fallback } as Msg,
        ]);
        historyRef.current = [
          ...historyRef.current.slice(-19),
          { role: "assistant", text: fallback },
        ];
        setBusy(false);
        return;
      }

      const value = parsed.value;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === toolMsg.id && m.kind === "tool"
            ? { ...m, args: { field: ref.fieldKey, value }, state: "done" as ToolState }
            : m
        )
      );

      const nextPkg = patchPackageValue(pkg, ref, value);
      setPkg(nextPkg);
      onUpdate?.(nextPkg);

      const nextIdx = cursor + 1;
      const nextRef = nextIdx >= queue.length ? null : queue[nextIdx];

      const turn = await fetchChatTurn({
        mode: "turn",
        lastAnswer: { field: ref.fieldKey, label: ref.label, value },
        nextField: nextRef ? toFieldInfo(nextRef) : null,
        history: historyRef.current.slice(-12),
        company: getCompanyName(nextPkg),
        progress: { done: nextIdx, total: queue.length },
      });

      const ackText = turn.ack || parsed.ack;
      if (ackText) {
        pushMsgs({ kind: "assistant", id: genId(), text: ackText });
        await new Promise((r) => setTimeout(r, 150));
      }

      if (!nextRef) {
        pushMsgs(
          {
            kind: "assistant",
            id: genId(),
            text:
              turn.closing ||
              "Listo — guardé todos los campos pendientes. Puedes revisar y exportar tu paquete.",
          },
          { kind: "done", id: genId() }
        );
      } else {
        pushMsgs({
          kind: "assistant",
          id: genId(),
          text: composeAssistantQuestion(nextRef, turn.question, nextPkg),
        });
      }

      setCursor(nextIdx);
      setBusy(false);
    },
    [busy, cursor, queue, pkg, pushMsgs, onUpdate]
  );

  const handleSkip = useCallback(async () => {
    if (busy || cursor >= queue.length) return;
    const ref = queue[cursor];
    const nextIdx = cursor + 1;
    const nextRef = nextIdx >= queue.length ? null : queue[nextIdx];
    setBusy(true);

    pushMsgs({
      kind: "assistant",
      id: genId(),
      text: `Saltamos “${ref.label}”. Podrás completarlo en el preview si lo necesitas.`,
    });

    const turn = await fetchChatTurn({
      mode: "turn",
      lastAnswer: null,
      nextField: nextRef ? toFieldInfo(nextRef) : null,
      history: historyRef.current.slice(-12),
      company: getCompanyName(pkg),
      progress: { done: nextIdx, total: queue.length },
    });

    if (!nextRef) {
      pushMsgs(
        {
          kind: "assistant",
          id: genId(),
          text: turn.closing || "Terminamos las preguntas. Continúa al preview.",
        },
        { kind: "done", id: genId() }
      );
    } else {
      pushMsgs({
        kind: "assistant",
        id: genId(),
        text: composeAssistantQuestion(nextRef, turn.question, pkg),
      });
    }

    setCursor(nextIdx);
    setBusy(false);
  }, [busy, cursor, queue, pkg, pushMsgs]);

  const current = cursor < queue.length ? queue[cursor] : null;
  const finished = cursor >= queue.length;
  const progressPct = queue.length === 0 ? 100 : Math.round((cursor / queue.length) * 100);

  return (
    <div className="flex flex-col h-[70vh] min-h-[520px] bg-[#FAFAFA] rounded-2xl ring-1 ring-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-[#F0FEE6] ring-1 ring-[#BBE795]/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#6abf1a]" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#6abf1a] ring-2 ring-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#6abf1a] uppercase tracking-wider leading-none mb-0.5">
            Asistente SARLAFT
          </p>
          <p className="text-sm font-semibold text-[#1a1a1a]">
            {finished ? "Datos completos" : `Pregunta ${Math.min(cursor + 1, queue.length)} de ${queue.length}`}
          </p>
        </div>
        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
          <div
            className="h-full bg-gradient-to-r from-[#BBE795] to-[#7dd83a] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div ref={logRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} onComplete={() => onComplete(pkg)} />
        ))}
        {busy && (
          <div className="flex items-start gap-2 animate-in fade-in">
            <Avatar role="assistant" />
            <div className="px-3 py-2 rounded-2xl bg-white ring-1 ring-gray-100 text-sm text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:120ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:240ms]" />
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-gray-100 bg-white">
        {finished ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-500">
              Puedes revisar y editar todos los datos en la vista previa antes de exportar.
            </p>
            <Button
              type="button"
              onClick={() => onComplete(pkg)}
              className="bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a]"
            >
              Ir al preview
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        ) : current ? (
          <div className="space-y-3">
            <QuickReplyArea
              ref_={current}
              pkg={pkg}
              disabled={busy}
              onSubmit={handleSubmit}
              onSkip={handleSkip}
            />
            <ChatInput
              disabled={busy}
              placeholder={placeholderForField(current)}
              onSend={handleUserText}
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Keyboard className="w-3 h-3" />
                {current.sectionLabel}
              </p>
              <button
                type="button"
                className="text-[11px] text-gray-400 hover:text-gray-600 disabled:opacity-40"
                disabled={busy}
                onClick={handleSkip}
              >
                Saltar esta pregunta
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Avatar({ role }: { role: "assistant" | "user" }) {
  if (role === "assistant") {
    return (
      <div className="shrink-0 w-7 h-7 rounded-full bg-[#F0FEE6] ring-1 ring-[#BBE795]/40 flex items-center justify-center mt-0.5">
        <Bot className="w-3.5 h-3.5 text-[#6abf1a]" />
      </div>
    );
  }
  return (
    <div className="shrink-0 w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center mt-0.5">
      <UserIcon className="w-3.5 h-3.5 text-white" />
    </div>
  );
}

function MessageBubble({ msg, onComplete }: { msg: Msg; onComplete: () => void }) {
  if (msg.kind === "assistant") {
    return (
      <div className="flex items-start gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
        <Avatar role="assistant" />
        <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-white ring-1 ring-gray-100 text-sm text-[#1a1a1a] leading-relaxed whitespace-pre-wrap">
          {msg.text}
        </div>
      </div>
    );
  }
  if (msg.kind === "user") {
    return (
      <div className="flex items-start gap-2 justify-end animate-in fade-in slide-in-from-right-2 duration-300">
        <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm bg-[#1a1a1a] text-white text-sm leading-relaxed whitespace-pre-wrap">
          {msg.text}
        </div>
        <Avatar role="user" />
      </div>
    );
  }
  if (msg.kind === "tool") {
    const done = msg.state === "done";
    return (
      <div className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
        <div className="shrink-0 w-7 h-7 rounded-full bg-[#EEF5FF] ring-1 ring-blue-100 flex items-center justify-center mt-0.5">
          {done ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#6abf1a]" />
          ) : (
            <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
          )}
        </div>
        <div
          className={`max-w-[85%] rounded-xl ring-1 overflow-hidden font-mono text-[11.5px] transition-colors duration-300 ${
            done
              ? "bg-[#F0FEE6]/60 ring-[#BBE795]/50"
              : "bg-[#F7FAFF] ring-blue-100"
          }`}
        >
          <div className="px-3 py-1.5 border-b border-current/10 flex items-center gap-2">
            <span className={`text-[10px] uppercase tracking-wider font-bold ${done ? "text-[#3f8a0b]" : "text-blue-600"}`}>
              {done ? "function_call · ok" : "function_call"}
            </span>
            <code className="text-[#1a1a1a] font-semibold truncate">{msg.fnName}()</code>
          </div>
          <pre className="px-3 py-2 text-[#1a1a1a] overflow-x-auto whitespace-pre-wrap break-all">
            {prettyJson(msg.args)}
          </pre>
        </div>
      </div>
    );
  }
  if (msg.kind === "done") {
    return (
      <div className="flex items-center gap-2 justify-center text-[11px] text-gray-400 uppercase tracking-widest font-semibold py-1">
        <span className="h-px flex-1 bg-gray-100" />
        <span>conversación finalizada</span>
        <button
          type="button"
          onClick={onComplete}
          className="text-[#6abf1a] hover:underline normal-case tracking-normal font-semibold text-xs"
        >
          ver preview →
        </button>
        <span className="h-px flex-1 bg-gray-100" />
      </div>
    );
  }
  return null;
}
