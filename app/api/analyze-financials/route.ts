import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const ANALYSIS_PROMPT = `Eres un analista financiero experto. Se te proporcionarán estados financieros de un cliente o empresa (pueden ser balances generales, estados de resultados, flujos de caja, etc.).

Tu tarea es analizar los documentos y generar un RESUMEN EJECUTIVO CONCISO en español con las siguientes métricas (si están disponibles):

1. **Ingresos / Ventas totales** (período)
2. **Gastos operativos totales**
3. **Utilidad neta**
4. **Activos totales**
5. **Pasivos totales**
6. **Patrimonio neto**
7. **Ratio de liquidez** (Activo corriente / Pasivo corriente)
8. **Ratio de endeudamiento** (Pasivos / Activos)
9. **Flujo de caja libre** (si disponible)
10. **Observaciones clave** — tendencias, riesgos o fortalezas notables.

Formato de respuesta: un párrafo de máximo 300 palabras, directo, sin listas ni markdown. Usa cifras concretas. Si algún dato no está disponible, omítelo sin mencionar que falta.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length || files.length > 2) {
      return NextResponse.json(
        { error: "Debes enviar 1 o 2 archivos." },
        { status: 400 }
      );
    }

    // Convertir cada archivo a base64 y preparar las partes de Gemini
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileParts: any[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      // Determinar MIME type
      let mimeType = file.type;
      if (!mimeType || mimeType === "application/octet-stream") {
        const name = file.name.toLowerCase();
        if (name.endsWith(".pdf")) mimeType = "application/pdf";
        else if (name.endsWith(".png")) mimeType = "image/png";
        else if (name.endsWith(".jpg") || name.endsWith(".jpeg"))
          mimeType = "image/jpeg";
        else mimeType = "application/pdf"; // fallback
      }

      fileParts.push({
        inlineData: {
          mimeType,
          data: base64,
        },
      });
    }

    // Llamar a Gemini con los archivos + prompt de análisis
    const geminiResponse = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              ...fileParts,
              { text: ANALYSIS_PROMPT },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
          topP: 0.8,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(
        "Gemini analysis error:",
        geminiResponse.status,
        errorText
      );
      return NextResponse.json(
        { error: "Error al analizar los documentos." },
        { status: 500 }
      );
    }

    const data = await geminiResponse.json();
    const summary: string =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("analyze-financials error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
