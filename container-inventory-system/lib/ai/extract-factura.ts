import { getClaudeClient } from "./claude";

export interface FacturaData {
  date: string;
  subtotal: number;
  containerNumbers: string[];
  quantity: number;
}

export async function extractFacturaData(
  pdfBase64: string
): Promise<FacturaData> {
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
            text: `Extrae la siguiente información de esta factura mexicana de importación de contenedores:

1. Fecha de compra (fecha de emisión de la factura)
2. SUBTOTAL - MUY IMPORTANTE: El monto SIN IVA (antes de impuestos). Busca la línea que dice "Subtotal" o cantidad antes del IVA.
3. Todos los números de serie de contenedores listados. Los números tienen el formato: 4 letras seguidas de 6 dígitos, un punto, y 1 dígito (ejemplo: CMAU002422.3, APZU367158.9)
4. Cantidad total de contenedores

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "date": "YYYY-MM-DD",
  "subtotal": número (SIN IVA, solo el subtotal),
  "containerNumbers": ["SERIE1", "SERIE2", "SERIE3"],
  "quantity": número
}

No incluyas ningún otro texto antes o después del JSON. Solo el objeto JSON.`,
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
      "No se pudieron extraer los datos automáticamente. Por favor ingrese manualmente."
    );
  }

  const extracted = JSON.parse(jsonMatch[0]) as FacturaData;

  if (
    !extracted.date ||
    !extracted.subtotal ||
    !extracted.containerNumbers ||
    !extracted.quantity
  ) {
    throw new Error(
      "Datos incompletos extraídos de la factura. Por favor verifique manualmente."
    );
  }

  const containerRegex = /^[A-Z]{4}\d{6}\.\d$/;
  const validContainers = extracted.containerNumbers.filter((num) =>
    containerRegex.test(num)
  );

  return {
    ...extracted,
    containerNumbers:
      validContainers.length > 0
        ? validContainers
        : extracted.containerNumbers,
    quantity:
      validContainers.length > 0
        ? validContainers.length
        : extracted.quantity,
  };
}
