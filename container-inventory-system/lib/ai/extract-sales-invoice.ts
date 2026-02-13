import { getClaudeClient } from "./claude";

export interface SalesInvoiceData {
  clientName: string | null;
  clientCompany: string | null;
  clientPhone: string | null;
  clientEmail: string | null;
  clientAddress: string | null;
  totalAmount: number | null;
  monthlyRate: number | null;
}

export async function extractSalesInvoiceData(
  pdfBase64: string
): Promise<SalesInvoiceData> {
  const client = getClaudeClient();

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            type: "text",
            text: `Extrae de esta factura de venta la siguiente información:
- Nombre del cliente
- Nombre de la empresa del cliente
- Teléfono del cliente
- Email del cliente
- Dirección del cliente
- Monto total de la factura
- Tarifa de renta mensual (busca palabras como "mensual", "por mes", "monthly", "renta")

Responde ÚNICAMENTE con JSON válido:
{
  "clientName": "nombre o null",
  "clientCompany": "empresa o null",
  "clientPhone": "teléfono o null",
  "clientEmail": "email o null",
  "clientAddress": "dirección o null",
  "totalAmount": número o null,
  "monthlyRate": número o null
}

Usa null para campos que no puedas encontrar.`,
          },
        ],
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error(
      "No se pudieron extraer los datos de la factura de venta."
    );
  }

  return JSON.parse(jsonMatch[0]) as SalesInvoiceData;
}
