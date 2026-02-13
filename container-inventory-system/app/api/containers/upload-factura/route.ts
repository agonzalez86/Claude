import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/check-permissions";
import { extractFacturaData } from "@/lib/ai/extract-factura";
import { uploadPdf } from "@/lib/storage/upload-pdf";

export async function POST(req: NextRequest) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó archivo" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande (máximo 10MB)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfUrl = await uploadPdf(buffer, file.name, "facturas");
    const base64 = buffer.toString("base64");

    let extractedData;
    try {
      extractedData = await extractFacturaData(base64);
    } catch (extractError) {
      return NextResponse.json({
        pdfUrl,
        extractedData: null,
        extractionError:
          "No se pudieron extraer los datos automáticamente. Por favor ingrese manualmente.",
      });
    }

    return NextResponse.json({
      pdfUrl,
      extractedData,
      extractionError: null,
    });
  } catch (err) {
    console.error("Error uploading factura:", err);
    return NextResponse.json(
      { error: "Error al procesar la factura" },
      { status: 500 }
    );
  }
}
