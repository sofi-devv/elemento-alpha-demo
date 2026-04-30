import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GEMINI_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-3.1-pro-preview";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type FieldInfo = {
  fieldKey: string;
  label: string;
  sectionLabel: string;
  type: string;
  options?: string[];
};

type HistoryItem = { role: "assistant" | "user"; text: string };

type ChatPayload = {
  lastAnswer?: { field: string; label: string; value: unknown } | null;
  nextField?: FieldInfo | null;
  history?: HistoryItem[];
  company?: string;
  progress?: { done: number; total: number };
  mode?: "start" | "turn" | "parse";
  // Para mode="parse"
  field?: FieldInfo;
  userText?: string;
  currentValue?: unknown;
};

const PARSE_SYSTEM = `Eres un parser estructurado para el formulario SARLAFT (cumplimiento en Colombia).
Recibes un "campo" con su esquema (fieldKey, label, tipo, opciones) y un "texto libre" que escribió el representante legal. Tu tarea es extraer el VALOR que corresponde al campo siguiendo EXACTAMENTE las reglas por tipo. Responde SIEMPRE en JSON.

REGLAS POR TIPO:
- "sino": value ∈ {"Sí", "No"}. Mapea: "sí/si/claro/afirmativo/correcto/obvio/ajá/yes" → "Sí"; "no/nunca/jamás/negativo/nope" → "No".
- "sino-na": value ∈ {"Sí", "No", "N/A"} o una de las opciones dadas. "no aplica / n/a / ninguno" → "N/A".
- "select": value DEBE ser UNA de las "options" (texto LITERAL). Mapea el texto libre a la opción semánticamente más cercana. Si el usuario da una letra/número (ej. "a", "1"), usa ese índice (1-based). Si es muy ambiguo, usa clarification.
- "multiselect": array de strings, subset EXACTO de options. "todas"→todas; "ninguna"→[]. Admite índices/letras.
- "number": número (int/float). "tres" → 3, "cinco mil" → 5000.
- "cifras": número en COP, sin separadores ni signos. "5 millones" → 5000000; "2.5M" → 2500000; "$1.000.000" → 1000000.
- "text": texto limpio, sin comillas.
- "politica_pregunta": { "respuesta": "Sí"|"No"|"N/A", "descripcion"?: string }. Extrae descripción si la hay.
- "detalle_oficial": { "nombre"?, "identificacion"?, "cargo"?, "email"?, "telefono"? }. Solo incluye las claves presentes.
- "detalle_programa": { "organo_aprobacion"?, "fecha_aprobacion"? (YYYY-MM-DD) }.
- "detalle_regulacion": { "normatividad"?: string }.
- "detalle_cripto": { "tipo_operaciones"?: string }.
- "detalle_sancion": { "fecha"? (YYYY-MM-DD), "autoridad"?, "motivo"?, "estado_actual"? }.
- "pep": { "cargo_publico"?, "fecha_vinculacion"? (YYYY-MM-DD), "tipo_parentesco"? }.
- "accionista_row": { "nombre"?, "id"?, "porcentaje"? (number 0-100), "cotiza_en_bolsa"?: "Sí"|"No" }.
- "lista_accionistas": array de accionista_row (≥ 1). Cada accionista separado por saltos de línea o "y".
- "lista_tin": array de { "pais"?, "tin"? }. Para fieldKey tipo "ubo.paises_tin[N]": objeto simple { "pais"?, "tin"? }.

NORMAS CRÍTICAS:
1. NUNCA inventes datos. Si no están en el texto, omite la clave.
2. Si el texto es DEMASIADO ambiguo o incompleto para el tipo (ej. "select" sin poder decidir), devuelve SOLO "clarification" con una pregunta corta en 1 frase (sin value).
3. Si puedes parsear aunque sea parcial, devuelve value + confidence.
4. Incluye un "ack" breve en 1 frase confirmando lo entendido de forma natural.
5. Responde EXCLUSIVAMENTE con JSON: { "value"?: any, "confidence"?: "high"|"medium"|"low", "clarification"?: string, "ack"?: string }. Omite las claves no aplicables.`;

const SYSTEM = `Eres un asistente virtual experto en cumplimiento SARLAFT / FATCA / CRS / SAGRILAFT en Colombia.
Guías, en español colombiano neutro, al representante legal de una persona jurídica a completar los campos que la IA de extracción no logró obtener de sus documentos soporte.

Tu ÚNICA tarea por turno:
(a) Si el usuario acaba de responder, escribe un "ack" breve y natural confirmando ese dato.
(b) Escribe una "question" para EL SIGUIENTE campo pendiente; si no hay siguiente, usa "closing" en lugar de question.

REGLAS CRÍTICAS:
1. La "question" DEBE girar EXACTAMENTE sobre el "label" del SIGUIENTE campo (campo "nextField"). Puedes parafrasear para sonar natural, pero el tema debe ser idéntico. PROHIBIDO copiar el label del campo anterior ni inventar preguntas distintas. Si "nextField.label" ya es una pregunta completa (empieza con "¿"), úsala casi literal, solo modifica forma no contenido.
2. Si "nextField.options" existe y tiene ítems, ES OBLIGATORIO que TODOS los ítems aparezcan dentro de la "question":
   - Si son ≤ 3 opciones: inclúyelas en línea separadas por " / " o " o ".
   - Si son > 3 opciones: después de la pregunta principal, lista cada una en su propia línea con prefijo "• ".
3. Tono: profesional, cercano, directo. Sin muletillas. No saludes salvo cuando mode="start".
4. Máx. 2 frases por valor; el "ack" idealmente 1 frase.
5. Para tipo "cifras" pide el monto en COP.
6. Para tipos con múltiples subcampos (detalle_*, pep, accionista_row, lista_accionistas, lista_tin) introduce brevemente el grupo de datos que pedirás; no los enumeres uno a uno (el formulario los mostrará).
7. Si "lastAnswer" es dato sensible (ej. PEP=Sí, sancion=Sí, activos_virtuales=Sí), en el "ack" empatiza y/o recuerda confidencialidad.
8. NO repitas una pregunta que ya aparezca en el "history".
9. Responde SIEMPRE con UN único objeto JSON válido. Claves permitidas: "ack", "question", "closing". Omite las claves vacías.`;

function safeString(v: unknown): string {
  if (v === null || v === undefined) return "(vacío)";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function buildUserText(p: ChatPayload): string {
  const parts: string[] = [];

  if (p.nextField) {
    const nf = p.nextField;
    const optionsBlock = nf.options?.length
      ? `\nopciones (DEBEN aparecer TODAS en la pregunta):${nf.options
          .map((o, i) => `\n  ${i + 1}) ${o}`)
          .join("")}`
      : "";
    parts.push(
      [
        "==== SIGUIENTE CAMPO A PREGUNTAR ====",
        `fieldKey: ${nf.fieldKey}`,
        `label (usa este tema/wording, no otro): ${nf.label}`,
        `sección: ${nf.sectionLabel}`,
        `tipo: ${nf.type}${optionsBlock}`,
      ].join("\n")
    );
  } else {
    parts.push(
      "==== NO HAY SIGUIENTE CAMPO ====\nGenera SOLO un 'closing' cálido (1 frase) invitando al usuario a ir al preview. Omite 'question'."
    );
  }

  if (p.lastAnswer) {
    parts.push(
      [
        "==== RESPUESTA PREVIA DEL USUARIO ====",
        `campo: ${p.lastAnswer.label}`,
        `valor: ${safeString(p.lastAnswer.value)}`,
        "(Escribe un 'ack' breve confirmando este dato. No uses esta pregunta previa como 'question'; la siguiente pregunta debe ser sobre el 'label' del SIGUIENTE CAMPO indicado arriba.)",
      ].join("\n")
    );
  }

  if (p.company) parts.push(`Entidad: ${p.company}`);
  if (p.progress) parts.push(`Progreso: ${p.progress.done} de ${p.progress.total} preguntas respondidas.`);

  if (p.history?.length) {
    const h = p.history
      .slice(-6)
      .map((m) => `- ${m.role === "assistant" ? "asistente" : "usuario"}: ${m.text.replace(/\s+/g, " ").slice(0, 240)}`)
      .join("\n");
    parts.push(`Historial (solo contexto, NO repitas preguntas):\n${h}`);
  }

  if (p.mode === "start") {
    parts.push("Este es el PRIMER turno del chat: puedes saludar muy brevemente al inicio de la question.");
  }

  parts.push(
    'Responde SOLO con un JSON: { "ack"?: string, "question"?: string, "closing"?: string }. Omite las claves vacías.'
  );
  return parts.join("\n\n");
}

function stripFences(s: string): string {
  let t = s.trim();
  if (t.startsWith("```json")) t = t.slice(7);
  else if (t.startsWith("```")) t = t.slice(3);
  t = t.trim();
  if (t.endsWith("```")) t = t.slice(0, -3).trim();
  return t;
}

function buildParsePrompt(p: ChatPayload): string {
  const parts: string[] = [];
  const f = p.field;
  if (!f) return "";
  const optionsBlock = f.options?.length
    ? `\nopciones (value debe ser una de estas, LITERAL):${f.options
        .map((o, i) => `\n  ${i + 1}) ${o}`)
        .join("")}`
    : "";
  parts.push(
    [
      "==== CAMPO A PARSEAR ====",
      `fieldKey: ${f.fieldKey}`,
      `label: ${f.label}`,
      `sección: ${f.sectionLabel}`,
      `tipo: ${f.type}${optionsBlock}`,
    ].join("\n")
  );
  if (p.currentValue !== undefined && p.currentValue !== null && p.currentValue !== "") {
    parts.push(`Valor actual (opcional, puede mezclarse con la nueva respuesta): ${safeString(p.currentValue)}`);
  }
  parts.push(
    ["==== TEXTO LIBRE DEL USUARIO ====", p.userText ?? "", "", "Extrae el valor según las reglas del sistema."].join("\n")
  );
  parts.push(
    'Responde SOLO JSON: { "value"?: any, "confidence"?: "high"|"medium"|"low", "clarification"?: string, "ack"?: string }.'
  );
  return parts.join("\n\n");
}

async function callGemini(
  userText: string,
  apiKey: string,
  opts?: { system?: string; temperature?: number }
): Promise<Record<string, unknown>> {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts?.system ?? SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig: {
        temperature: opts?.temperature ?? 0.3,
        maxOutputTokens: 768,
        topP: 0.9,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini error ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(stripFences(raw));
    } catch {
      return {};
    }
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }
  try {
    const body = (await req.json()) as ChatPayload;

    if (body.mode === "parse") {
      if (!body.field || typeof body.userText !== "string" || !body.userText.trim()) {
        return NextResponse.json({ error: "invalid_parse_payload" }, { status: 400 });
      }
      const prompt = buildParsePrompt(body);
      const json = await callGemini(prompt, apiKey, { system: PARSE_SYSTEM, temperature: 0.15 });

      if (process.env.NODE_ENV !== "production") {
        console.log("[sarlaft/chat] parse →", {
          field: body.field.fieldKey,
          type: body.field.type,
          userText: body.userText,
          geminiRaw: json,
        });
      }

      // Gemini a veces envuelve el valor ({ value: { value: "Sí" }}) o usa otra clave.
      let value: unknown = json.value;
      if (value === undefined) value = (json as Record<string, unknown>).answer;
      if (value === undefined) value = (json as Record<string, unknown>).result;
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        "value" in (value as Record<string, unknown>) &&
        Object.keys(value as Record<string, unknown>).length <= 2
      ) {
        value = (value as Record<string, unknown>).value;
      }
      if (value === "" || value === null) value = undefined;

      const confidence = typeof json.confidence === "string" ? json.confidence : undefined;
      const clarification =
        typeof json.clarification === "string" && json.clarification.trim()
          ? json.clarification.trim()
          : undefined;
      const ack =
        typeof json.ack === "string" && json.ack.trim() ? json.ack.trim() : undefined;

      return NextResponse.json({
        value,
        confidence,
        clarification,
        ack,
      });
    }

    const prompt = buildUserText(body);
    const json = await callGemini(prompt, apiKey);
    return NextResponse.json({
      ack: typeof json.ack === "string" && json.ack.trim() ? json.ack.trim() : undefined,
      question: typeof json.question === "string" && json.question.trim() ? json.question.trim() : undefined,
      closing: typeof json.closing === "string" && json.closing.trim() ? json.closing.trim() : undefined,
    });
  } catch (err) {
    console.error("sarlaft/chat error:", err);
    return NextResponse.json({ error: "chat_failed" }, { status: 500 });
  }
}
