import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import type { SarlaftPackage } from "@/lib/sarlaft/schema";
import { buildSagrilaftHtml } from "@/lib/sarlaft/templates/sagrilaft";
import { buildFatcaCrsHtml } from "@/lib/sarlaft/templates/fatcaCrs";
import { buildVinculacionHtml } from "@/lib/sarlaft/templates/vinculacion";
import { computeMissingFields, hasMissingFields } from "@/lib/sarlaft/missingFields";

function cloudflarePdfUrl(accountId: string): string {
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/pdf`;
}

async function renderPdfWithCloudflare(
  accountId: string,
  token: string,
  html: string
): Promise<ArrayBuffer> {
  const res = await fetch(cloudflarePdfUrl(accountId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      html,
      pdfOptions: {
        format: "a4",
        printBackground: true,
      },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Cloudflare PDF: ${res.status} ${t.slice(0, 500)}`);
  }
  return res.arrayBuffer();
}

export async function POST(request: NextRequest) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    return NextResponse.json(
      { error: "Configura CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN" },
      { status: 500 }
    );
  }

  let body: { package?: SarlaftPackage; skipValidation?: boolean };
  try {
    body = (await request.json()) as { package?: SarlaftPackage; skipValidation?: boolean };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const pkg = body.package;
  if (!pkg?.formulario_1 || !pkg.formulario_2 || !pkg.formulario_3) {
    return NextResponse.json({ error: "Falta el paquete de formularios" }, { status: 400 });
  }
  if (!body.skipValidation && hasMissingFields(pkg)) {
    return NextResponse.json(
      { error: "Hay campos obligatorios sin completar", missing: computeMissingFields(pkg) },
      { status: 400 }
    );
  }

  try {
    const html1 = buildSagrilaftHtml(pkg.formulario_1);
    const html2 = buildFatcaCrsHtml(pkg.formulario_2);
    const html3 = buildVinculacionHtml(pkg.formulario_3);

    const [b1, b2, b3] = await Promise.all([
      renderPdfWithCloudflare(accountId, token, html1),
      renderPdfWithCloudflare(accountId, token, html2),
      renderPdfWithCloudflare(accountId, token, html3),
    ]);

    const zip = new JSZip();
    zip.file("01_SAGRILAFT_SARLAFT.pdf", b1, { binary: true });
    zip.file("02_FATCA_CRS.pdf", b2, { binary: true });
    zip.file("03_Vinculacion_PJ_Skandia.pdf", b3, { binary: true });
    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="paquete_vinculacion_skandia.zip"',
      },
    });
  } catch (e) {
    console.error("sarlaft/pdf error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al generar PDF" },
      { status: 500 }
    );
  }
}
