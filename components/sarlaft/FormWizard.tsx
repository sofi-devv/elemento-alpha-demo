"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MissingFieldRef, SarlaftPackage } from "@/lib/sarlaft/schema";
import { patchPackageValue } from "@/lib/sarlaft/patchPackage";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Step = { key: string; label: string; refs: MissingFieldRef[] };

function buildSteps(missing: MissingFieldRef[]): Step[] {
  const map = new Map<string, MissingFieldRef[]>();
  for (const r of missing) {
    const k = `${r.formId}::${r.sectionKey}`;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(r);
  }
  return Array.from(map.entries()).map(([key, refs]) => ({
    key,
    label: refs[0]?.sectionLabel ?? key,
    refs,
  }));
}

function getPolFromPath(pkg: SarlaftPackage, path: string) {
  // path like politicas.programa_laft_documentado
  const parts = path.split(".");
  if (parts[0] !== "politicas" || parts.length < 2) return null;
  const k = parts[1] as keyof typeof pkg.formulario_1.politicas;
  return pkg.formulario_1.politicas[k];
}

export function FormWizard({
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
  const steps = useMemo(() => buildSteps(missing), [missing]);
  const [ix, setIx] = useState(0);
  useEffect(() => {
    if (ix > 0 && ix >= steps.length) setIx(Math.max(0, steps.length - 1));
  }, [ix, steps.length]);

  const apply = useCallback(
    (ref: MissingFieldRef, value: unknown) => {
      setPkg((prev) => {
        const next = patchPackageValue(prev, ref, value);
        onUpdate?.(next);
        return next;
      });
    },
    [onUpdate]
  );

  if (steps.length === 0) {
    return (
      <div className="text-sm text-center text-gray-500 py-4">
        No hay campos pendientes.
        <Button className="ml-2" onClick={() => onComplete(pkg)}>
          Continuar al preview
        </Button>
      </div>
    );
  }

  const step = steps[ix];
  const isLast = ix === steps.length - 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Paso {ix + 1} de {steps.length}
        </span>
        <span className="font-medium text-[#1a1a1a]">{step.label}</span>
      </div>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {step.refs.map((ref) => (
          <FieldInput key={ref.fieldKey} ref_={ref} pkg={pkg} onApply={apply} />
        ))}
      </div>
      <div className="flex justify-between gap-2 pt-2 border-t">
        <Button type="button" variant="outline" disabled={ix === 0} onClick={() => setIx((i) => i - 1)}>
          <ChevronLeft className="w-4 h-4" /> Atrás
        </Button>
        {isLast ? (
          <Button
            type="button"
            className="bg-[#BBE795] text-[#1a1a1a] hover:bg-[#8fd94a]"
            onClick={() => onComplete(pkg)}
          >
            Completar y ver preview
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button type="button" onClick={() => setIx((i) => i + 1)}>
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function FieldInput({
  ref_,
  pkg,
  onApply,
}: {
  ref_: MissingFieldRef;
  pkg: SarlaftPackage;
  onApply: (r: MissingFieldRef, v: unknown) => void;
}) {
  const r = ref_;

  if (r.type === "text") {
    const v = getF1F2F3String(pkg, r) ?? "";
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-600">{r.label}</Label>
        <Input value={v} onChange={(e) => onApply(r, e.target.value)} className="h-9" />
      </div>
    );
  }
  if (r.type === "number") {
    const v = getF1Number(pkg, r) ?? "";
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-600">{r.label}</Label>
        <Input
          type="number"
          value={v === null || v === "" ? "" : v}
          onChange={(e) => onApply(r, e.target.value === "" ? "" : Number(e.target.value))}
          className="h-9"
        />
      </div>
    );
  }
  if (r.type === "sino-na" && r.options) {
    const cur = getOtras14OrPol(pkg, r) ?? "";
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-600">{r.label}</Label>
        <select
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={cur}
          onChange={(e) => onApply(r, e.target.value)}
        >
          <option value="">—</option>
          {r.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (r.type === "sino" && r.options) {
    const vRaw =
      r.formId === "3" && r.fieldKey === "es_pep"
        ? pkg.formulario_3.es_pep
        : r.formId === "3" && r.fieldKey === "administra_recursos_publicos"
          ? pkg.formulario_3.administra_recursos_publicos
          : "";
    const v = vRaw ?? "";
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-600">{r.label}</Label>
        <select
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={v}
          onChange={(e) => onApply(r, e.target.value)}
        >
          <option value="">—</option>
          {r.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (r.type === "select" && r.options) {
    const v = getSelectValue(pkg, r) ?? "";
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-600">{r.label}</Label>
        <select
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={v}
          onChange={(e) => onApply(r, e.target.value)}
        >
          <option value="">—</option>
          {r.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (r.type === "politica_pregunta" && r.options) {
    const pol = getPolFromPath(pkg, r.fieldKey);
    const v = (pol && "respuesta" in pol ? (pol.respuesta ?? "") : "") as string;
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-600">{r.label}</Label>
        <p className="text-xs text-gray-500">{(pol as { pregunta?: string })?.pregunta}</p>
        <select
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={v}
          onChange={(e) => onApply(r, e.target.value)}
        >
          <option value="">—</option>
          {r.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (r.type === "detalle_programa") {
    const pol = getPolFromPath(pkg, r.fieldKey) as { detalle_programa?: { organo_aprobacion: string; fecha_aprobacion: string } };
    const d = pol?.detalle_programa ?? { organo_aprobacion: "", fecha_aprobacion: "" };
    return (
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-600">{r.label}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            placeholder="Órgano que lo aprobó"
            value={d.organo_aprobacion}
            onChange={(e) => onApply(r, { ...d, organo_aprobacion: e.target.value })}
          />
          <Input
            type="date"
            placeholder="Fecha de aprobación"
            value={d.fecha_aprobacion}
            onChange={(e) => onApply(r, { ...d, fecha_aprobacion: e.target.value })}
          />
        </div>
      </div>
    );
  }
  if (r.type === "detalle_regulacion") {
    const pol = getPolFromPath(pkg, r.fieldKey) as { detalle_regulacion?: { normatividad: string } };
    const d = pol?.detalle_regulacion ?? { normatividad: "" };
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-600">Normatividad que la rige</Label>
        <Input value={d.normatividad} onChange={(e) => onApply(r, { normatividad: e.target.value })} />
      </div>
    );
  }
  if (r.type === "detalle_oficial") {
    const pol = getPolFromPath(pkg, r.fieldKey) as {
      detalle_oficial?: { nombre: string; identificacion: string; cargo: string; email: string; telefono: string };
    };
    const d = pol?.detalle_oficial ?? { nombre: "", identificacion: "", cargo: "", email: "", telefono: "" };
    return (
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-600">Oficial de cumplimiento</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(
            [
              ["nombre", "Nombre"],
              ["identificacion", "Identificación"],
              ["cargo", "Cargo"],
              ["email", "Email"],
              ["telefono", "Teléfono"],
            ] as const
          ).map(([k, label]) => (
            <div key={k}>
              <Label className="text-[10px] text-gray-400">{label}</Label>
              <Input
                value={d[k as keyof typeof d]}
                onChange={(e) => onApply(r, { ...d, [k]: e.target.value })}
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
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-600">Tipo de operaciones</Label>
        <Input value={d.tipo_operaciones} onChange={(e) => onApply(r, { tipo_operaciones: e.target.value })} />
      </div>
    );
  }
  if (r.type === "detalle_sancion") {
    const pol = getPolFromPath(pkg, r.fieldKey) as {
      detalle_sancion?: { fecha: string; motivo: string; autoridad: string; estado_actual: string };
    };
    const d = pol?.detalle_sancion ?? { fecha: "", motivo: "", autoridad: "", estado_actual: "" };
    return (
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-600">Detalle sanción / investigación</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input type="date" value={d.fecha} onChange={(e) => onApply(r, { ...d, fecha: e.target.value })} />
          <Input placeholder="Autoridad" value={d.autoridad} onChange={(e) => onApply(r, { ...d, autoridad: e.target.value })} />
          <Input placeholder="Motivo" className="sm:col-span-2" value={d.motivo} onChange={(e) => onApply(r, { ...d, motivo: e.target.value })} />
          <Input
            placeholder="Estado actual"
            className="sm:col-span-2"
            value={d.estado_actual}
            onChange={(e) => onApply(r, { ...d, estado_actual: e.target.value })}
          />
        </div>
      </div>
    );
  }
  if (r.type === "cifras") {
    const k = r.fieldKey.replace("cifras_financieras.", "") as keyof typeof pkg.formulario_3.cifras_financieras;
    const n = pkg.formulario_3.cifras_financieras[k];
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-600">{r.label} (COP)</Label>
        <Input
          type="number"
          value={n ?? ""}
          onChange={(e) => onApply(r, e.target.value === "" ? null : Number(e.target.value))}
        />
      </div>
    );
  }
  if (r.type === "pep") {
    const d = pkg.formulario_3.pep_detalle ?? { cargo_publico: "", fecha_vinculacion: "", tipo_parentesco: "" };
    return (
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-600">PEP</Label>
        <Input placeholder="Cargo público" value={d.cargo_publico} onChange={(e) => onApply(r, { ...d, cargo_publico: e.target.value })} />
        <Input type="date" value={d.fecha_vinculacion} onChange={(e) => onApply(r, { ...d, fecha_vinculacion: e.target.value })} />
        <Input placeholder="Tipo de parentesco" value={d.tipo_parentesco} onChange={(e) => onApply(r, { ...d, tipo_parentesco: e.target.value })} />
      </div>
    );
  }
  if (r.type === "lista_accionistas") {
    const rows = pkg.formulario_3.accionistas.length
      ? pkg.formulario_3.accionistas
      : [{ nombre: "", id: "", porcentaje: null, cotiza_en_bolsa: "" as const }];
    return (
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-600">Accionistas</Label>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 rounded-lg border bg-gray-50/50">
            <Input
              placeholder="Nombre"
              value={row.nombre}
              onChange={(e) => {
                const n = [...rows];
                n[i] = { ...row, nombre: e.target.value };
                onApply(r, n);
              }}
            />
            <Input
              placeholder="ID"
              value={row.id}
              onChange={(e) => {
                const n = [...rows];
                n[i] = { ...row, id: e.target.value };
                onApply(r, n);
              }}
            />
            <Input
              type="number"
              placeholder="%"
              value={row.porcentaje ?? ""}
              onChange={(e) => {
                const n = [...rows];
                n[i] = { ...row, porcentaje: e.target.value === "" ? null : Number(e.target.value) };
                onApply(r, n);
              }}
            />
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={row.cotiza_en_bolsa ?? ""}
              onChange={(e) => {
                const n = [...rows];
                n[i] = { ...row, cotiza_en_bolsa: e.target.value as "Sí" | "No" };
                onApply(r, n);
              }}
            >
              <option value="">¿Cotiza?</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onApply(r, [...rows, { nombre: "", id: "", porcentaje: null, cotiza_en_bolsa: "" }])}
        >
          Añadir accionista
        </Button>
      </div>
    );
  }
  if (r.type === "accionista_row") {
    const m = r.fieldKey.match(/^accionistas\[(\d+)\]$/);
    const i = m ? Number(m[1]) : 0;
    const row = pkg.formulario_3.accionistas[i] ?? { nombre: "", id: "", porcentaje: null, cotiza_en_bolsa: "" as const };
    return (
      <div className="space-y-2 p-2 rounded-lg border">
        <Label className="text-xs font-semibold text-gray-600">{r.label}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            value={row.nombre}
            onChange={(e) => onApply(r, { ...row, nombre: e.target.value })}
          />
          <Input
            value={row.id}
            onChange={(e) => onApply(r, { ...row, id: e.target.value })}
          />
          <Input
            type="number"
            value={row.porcentaje ?? ""}
            onChange={(e) => onApply(r, { ...row, porcentaje: e.target.value === "" ? null : Number(e.target.value) })}
          />
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={row.cotiza_en_bolsa ?? ""}
            onChange={(e) => onApply(r, { ...row, cotiza_en_bolsa: e.target.value as "Sí" | "No" })}
          >
            <option value="">¿Cotiza?</option>
            <option value="Sí">Sí</option>
            <option value="No">No</option>
          </select>
        </div>
      </div>
    );
  }
  if (r.type === "lista_tin") {
    const m = r.fieldKey.match(/^ubo\.paises_tin\[(\d+)\]$/);
    const rows = pkg.formulario_2.ubo.paises_tin.length
      ? pkg.formulario_2.ubo.paises_tin
      : [{ pais: "", tin: "" }];
    if (m) {
      const i = Number(m[1]);
      const row = rows[i] ?? { pais: "", tin: "" };
      return (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">País</Label>
            <Input value={row.pais} onChange={(e) => {
              const n = [...rows];
              n[i] = { ...row, pais: e.target.value };
              onApply(r, n[i]);
            }} />
          </div>
          <div>
            <Label className="text-xs">TIN/NIT</Label>
            <Input value={row.tin} onChange={(e) => {
              const n = [...rows];
              n[i] = { ...row, tin: e.target.value };
              onApply(r, n[i]);
            }} />
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-600">Países y TIN</Label>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <Input
              placeholder="País"
              value={row.pais}
              onChange={(e) => {
                const n = [...rows];
                n[i] = { ...row, pais: e.target.value };
                onApply(r, n);
              }}
            />
            <Input
              placeholder="TIN"
              value={row.tin}
              onChange={(e) => {
                const n = [...rows];
                n[i] = { ...row, tin: e.target.value };
                onApply(r, n);
              }}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onApply(r, [...rows, { pais: "", tin: "" }])}
        >
          Añadir país/TIN
        </Button>
      </div>
    );
  }
  if (r.type === "multiselect" && r.options) {
    const cur = new Set(pkg.formulario_3.calidad_beneficiario_final);
    return (
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-600">{r.label}</Label>
        {r.options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={cur.has(opt as (typeof pkg.formulario_3.calidad_beneficiario_final)[number])}
              onChange={(e) => {
                const n = new Set(cur);
                if (e.target.checked) n.add(opt as (typeof pkg.formulario_3.calidad_beneficiario_final)[number]);
                else n.delete(opt as (typeof pkg.formulario_3.calidad_beneficiario_final)[number]);
                onApply(r, Array.from(n));
              }}
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }
  return <p className="text-xs text-amber-600">Campo no soportado: {r.type} — {r.fieldKey}</p>;
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

function getOtras14OrPol(pkg: SarlaftPackage, r: MissingFieldRef): string {
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
