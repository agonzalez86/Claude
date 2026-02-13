import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/check-permissions";
import { uploadPdf, uploadPhoto } from "@/lib/storage/upload-pdf";
import { extractSalesInvoiceData } from "@/lib/ai/extract-sales-invoice";

export async function POST(req: NextRequest) {
  const { error } = await requireRole(["ADMIN", "SALES", "WAREHOUSE_COORDINATOR"]);
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const category = formData.get("category") as string || "photos";
    const extractInvoice = formData.get("extractInvoice") === "true";

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

    let url: string;
    if (category === "photos") {
      url = await uploadPhoto(buffer, file.name);
    } else {
      url = await uploadPdf(buffer, file.name, category as any);
    }

    let invoiceData = null;
    if (extractInvoice && category === "sales-invoices") {
      try {
        const base64 = buffer.toString("base64");
        invoiceData = await extractSalesInvoiceData(base64);
      } catch {
        // Extraction failed - not critical
      }
    }

    return NextResponse.json({ url, invoiceData });
  } catch (err) {
    console.error("Error uploading file:", err);
    return NextResponse.json(
      { error: "Error al subir el archivo" },
      { status: 500 }
    );
  }
}
