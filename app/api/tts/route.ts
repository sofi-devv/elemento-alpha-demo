import { NextRequest } from "next/server";

// Voces Studio (más realistas) — español latinoamericano
// es-US-Studio-B  → hombre
// es-US-Neural2-A → mujer (fallback si Studio no está habilitado)
const DEFAULT_VOICE = "es-US-Studio-B";

export async function POST(request: NextRequest) {
  const { text, voice = DEFAULT_VOICE } = await request.json();

  if (!text?.trim()) {
    return new Response("Missing text", { status: 400 });
  }

  const token = process.env.GOOGLE_ACCESS_TOKEN;
  if (!token) {
    return new Response("GOOGLE_ACCESS_TOKEN not configured", { status: 500 });
  }

  const ttsResponse = await fetch(
    "https://texttospeech.googleapis.com/v1beta1/text:synthesize",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
    const error = await ttsResponse.text();
    console.error("Google TTS error:", ttsResponse.status, error);
    return new Response(error, { status: ttsResponse.status });
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
