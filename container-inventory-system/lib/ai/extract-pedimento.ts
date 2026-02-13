import { getClaudeClient } from "./claude";

export interface PedimentoData {
  pedimentoNumber: string;
  containerNumbers: string[];
}

export async function extractPedimentoData(
  pdfBase64: string
): Promise<PedimentoData> {
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
            text: `Extrae de este pedimento de importación mexicano:
1. Número de pedimento (el identificador del pedimento)
2. Todos los números de serie de contenedores listados en el documento. Los números tienen el formato: 4 letras seguidas de 6 dígitos, un punto, y 1 dígito (ejemplo: CMAU002422.3)

Responde ÚNICAMENTE con un objeto JSON válido:
{
  "pedimentoNumber": "número del pedimento",
  "containerNumbers": ["SERIE1", "SERIE2"]
}

No incluyas ningún otro texto, solo el JSON.`,
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
      "No se pudieron extraer los datos del pedimento. Por favor ingrese manualmente."
    );
  }

  return JSON.parse(jsonMatch[0]) as PedimentoData;
}
