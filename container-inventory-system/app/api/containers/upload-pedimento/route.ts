import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/check-permissions";
import { extractPedimentoData } from "@/lib/ai/extract-pedimento";
import { uploadPdf } from "@/lib/storage/upload-pdf";
import { matchContainersToPedimentos } from "@/lib/ai/match-containers";

export async function POST(req: NextRequest) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const containerNumbersRaw = formData.get("containerNumbers") as string;
    const containerNumbers = JSON.parse(containerNumbersRaw) as string[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron archivos" },
        { status: 400 }
      );
    }

    const pedimentosData = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfUrl = await uploadPdf(buffer, file.name, "pedimentos");
      const base64 = buffer.toString("base64");

      try {
        const extracted = await extractPedimentoData(base64);
        pedimentosData.push({ ...extracted, pdfUrl });
      } catch {
        pedimentosData.push({
          pedimentoNumber: file.name.replace(".pdf", ""),
          containerNumbers: [],
          pdfUrl,
          extractionError: true,
        });
      }
    }

    const matches = matchContainersToPedimentos(containerNumbers, pedimentosData);

    return NextResponse.json({
      pedimentos: pedimentosData,
      matches,
    });
  } catch (err) {
    console.error("Error uploading pedimentos:", err);
    return NextResponse.json(
      { error: "Error al procesar los pedimentos" },
      { status: 500 }
    );
  }
}
