import { NextRequest } from "next/server";

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `Eres el asesor virtual de Elemento, una plataforma colombiana de inversión en Fondos de Inversión Colectiva (FIC).

Tu rol es guiar al usuario a través del proceso de vinculación (onboarding) KYC de forma amigable, clara y profesional.

Reglas importantes:
- Habla en español colombiano, de forma cercana pero profesional.
- Respuestas cortas: máximo 2-3 oraciones. Tu voz se convierte a audio, sé conciso.
- NO uses asteriscos, emojis, guiones, listas ni caracteres especiales. Solo texto plano.
- NO inventes información sobre el usuario ni sobre Elemento.
- Si el usuario pregunta algo que no sabes, di que lo consultarás con el equipo.

Flujo de la conversación:
1. Saluda al usuario y explica brevemente qué es un FIC.
2. Explica que necesitas validar su identidad para continuar.
3. Indica que complete el formulario de datos personales en pantalla.
4. Cuando el usuario lo complete, ayúdalo a entender los tres perfiles de riesgo: Conservador, Moderado y Agresivo.
5. Finaliza felicitando al usuario por completar el proceso.`;

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export async function POST(request: NextRequest) {
  const { history, message } = (await request.json()) as {
    history: GeminiContent[];
    message: string;
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response("GEMINI_API_KEY not configured", { status: 500 });
  }

  const contents: GeminiContent[] = [
    ...history,
    { role: "user", parts: [{ text: message }] },
  ];

  const geminiResponse = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }],
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
        topP: 0.9,
      },
    }),
  });

  if (!geminiResponse.ok) {
    const error = await geminiResponse.text();
    console.error("Gemini error:", geminiResponse.status, error);
    return new Response(error, { status: geminiResponse.status });
  }

  const data = await geminiResponse.json();
  const reply: string =
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  return Response.json({ reply });
}
