import { NextRequest } from "next/server";
import { GoogleAuth } from "google-auth-library";

export const runtime = "nodejs";

// Voces Studio (más realistas) — español latinoamericano
// es-US-Studio-B  → hombre
// es-US-Neural2-A → mujer (fallback si Studio no está habilitado)
const DEFAULT_VOICE = "es-US-Studio-B";

const CLOUD_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

let authSingleton: GoogleAuth | null = null;

function getAuth(): GoogleAuth {
  authSingleton ??= new GoogleAuth({ scopes: [CLOUD_SCOPE] });
  return authSingleton;
}

/**
 * Preferimos OAuth automático (ADC / cuenta de servicio). GOOGLE_ACCESS_TOKEN manual caduca ~1h.
 * No uses la API key de Gemini (AIza…) como Bearer: Cloud Text-to-Speech exige OAuth u otro método válido del proyecto GCP.
 */
async function resolveBearerToken(): Promise<
  | { ok: true; token: string }
  | { ok: false; detail: string }
> {
  try {
    const client = await getAuth().getClient();
    const { token } = await client.getAccessToken();
    if (token) return { ok: true, token };
  } catch (e) {
    console.warn("[tts] ADC / Application Default Credentials no disponibles:", e);
  }

  const manual = process.env.GOOGLE_ACCESS_TOKEN?.trim();
  if (manual) return { ok: true, token: manual };

  return {
    ok: false,
    detail:
      "Sin token válido para Cloud Text-to-Speech. Opciones: (1) Variable GOOGLE_APPLICATION_CREDENTIALS apuntando al JSON de una cuenta de servicio con rol que pueda llamar Text-to-Speech y API habilitada; (2) `gcloud auth application-default login` en tu máquina; (3) GOOGLE_ACCESS_TOKEN con un access token fresco de `gcloud auth print-access-token` (caduca ~1 h). La API key de Gemini no sirve como Bearer aquí.",
  };
}

export async function POST(request: NextRequest) {
  const { text, voice = DEFAULT_VOICE } = await request.json();

  if (!text?.trim()) {
    return new Response("Missing text", { status: 400 });
  }

  const bearer = await resolveBearerToken();
  if (!bearer.ok) {
    return new Response(JSON.stringify({ message: bearer.detail }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ttsResponse = await fetch(
    "https://texttospeech.googleapis.com/v1beta1/text:synthesize",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearer.token}`,
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: "es-US",
          name: voice,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 1.0,
          pitch: 0,
        },
      }),
    }
  );

  if (!ttsResponse.ok) {
    const errorText = await ttsResponse.text();
    console.error("Google TTS error:", ttsResponse.status, errorText);

    let hint =
      "Text-to-Speech rechazó la petición. En Cloud Console: habilita «Cloud Text-to-Speech API», comprueba facturación/cuotas y que la cuenta usada no esté limitada.";
    if (ttsResponse.status === 401 || errorText.includes("UNAUTHENTICATED")) {
      hint +=
        " Para OAuth: renueva el token (`gcloud auth print-access-token`) o usa cuenta de servicio + GOOGLE_APPLICATION_CREDENTIALS.";
    }
    if (errorText.includes("API_KEY_SERVICE_BLOCKED")) {
      hint +=
        " API_KEY_SERVICE_BLOCKED indica restricciones del proyecto/clave respecto a este servicio; usa OAuth con cuenta de servicio o usuario autorizado según la documentación de Google Cloud.";
    }

    return new Response(
      JSON.stringify({
        message: hint,
        upstreamStatus: ttsResponse.status,
        upstream: errorText.slice(0, 800),
      }),
      {
        status: ttsResponse.status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const data = await ttsResponse.json();
  const audioBuffer = Buffer.from(data.audioContent as string, "base64");

  return new Response(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length.toString(),
      "Cache-Control": "no-store",
    },
  });
}
