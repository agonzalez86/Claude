import { format } from "date-fns";
import { es } from "date-fns/locale";

function emailWrapper(title: string, content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 20px; }
    .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; border-radius: 4px; }
    .label { font-weight: bold; color: #1f2937; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
    ul { list-style-type: none; padding: 0; }
    li { background-color: white; padding: 8px 12px; margin: 4px 0; border-left: 3px solid #2563eb; border-radius: 2px; }
    hr { margin: 15px 0; border: none; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>${title}</h1></div>
    <div class="content">${content}</div>
    <div class="footer">
      <p>Este es un correo automático del Sistema de Gestión de Inventario de Contenedores - LATAM BOX</p>
    </div>
  </div>
</body>
</html>`;
}

export function newContainersEmail(data: {
  quantity: number;
  facturaNumber: string;
  seriesNumbers: string[];
  adminName: string;
  date: string;
}) {
  const content = `
    <p><strong>${data.quantity}</strong> contenedores de la Factura #${data.facturaNumber} han sido registrados en el sistema.</p>
    <p><span class="label">Fecha de Compra:</span> ${format(new Date(data.date), "dd/MM/yyyy", { locale: es })}</p>
    <p><span class="label">Contenedores:</span></p>
    <ul>${data.seriesNumbers.map((s) => `<li>${s}</li>`).join("")}</ul>
    <p><span class="label">Registrado por:</span> ${data.adminName}</p>
  `;

  return {
    subject: "Nuevos contenedores agregados al inventario",
    html: emailWrapper("Nuevos Contenedores Registrados", content),
  };
}

export function containerReceivedEmail(data: {
  seriesNumber: string;
  internalCode: string;
  coordinatorName: string;
  notes?: string;
}) {
  const content = `
    <div class="info-box">
      <p><span class="label">Contenedor:</span> ${data.seriesNumber} (${data.internalCode})</p>
      <p><span class="label">Recibido por:</span> ${data.coordinatorName}</p>
      <p><span class="label">Fecha/Hora:</span> ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}</p>
      ${data.notes ? `<p><span class="label">Notas:</span> ${data.notes}</p>` : ""}
    </div>
  `;

  return {
    subject: `Contenedor ${data.seriesNumber} ha ingresado al almacén`,
    html: emailWrapper("Contenedor Recibido en Almacén", content),
  };
}

export function containerAssignedEmail(data: {
  seriesNumber: string;
  internalCode: string;
  clientName: string;
  clientCompany: string;
  operationType: "SALE" | "RENTAL";
  location: string;
  salesPersonName: string;
  monthlyRate?: number;
  expectedReturnDate?: string;
}) {
  const typeText = data.operationType === "SALE" ? "Venta" : "Renta";

  const rentalInfo =
    data.operationType === "RENTAL" && data.monthlyRate
      ? `
    <hr>
    <p><span class="label">Tarifa Mensual:</span> $${data.monthlyRate.toLocaleString("es-MX")} MXN</p>
    ${data.expectedReturnDate ? `<p><span class="label">Retorno Esperado:</span> ${format(new Date(data.expectedReturnDate), "dd/MM/yyyy", { locale: es })}</p>` : ""}
  `
      : "";

  const content = `
    <div class="info-box">
      <p><span class="label">Contenedor:</span> ${data.seriesNumber} (${data.internalCode})</p>
      <p><span class="label">Asignado a:</span> ${data.clientName} - ${data.clientCompany}</p>
      <p><span class="label">Tipo:</span> ${typeText}</p>
      <p><span class="label">Ubicación Actual:</span> ${data.location}</p>
      <p><span class="label">Asignado por:</span> ${data.salesPersonName}</p>
      <p><span class="label">Fecha:</span> ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}</p>
      ${rentalInfo}
    </div>
  `;

  return {
    subject: `Contenedor ${data.seriesNumber} cambió de libre a asignado`,
    html: emailWrapper("Contenedor Asignado", content),
  };
}

export function containerExitEmail(data: {
  seriesNumber: string;
  internalCode: string;
  clientName: string;
  clientAddress: string;
  operationType: string;
  coordinatorName: string;
  notes?: string;
}) {
  const content = `
    <div class="info-box">
      <p><span class="label">Contenedor:</span> ${data.seriesNumber} (${data.internalCode})</p>
      <p><span class="label">Destino:</span> ${data.clientName} - ${data.clientAddress}</p>
      <p><span class="label">Tipo:</span> ${data.operationType === "SALE" ? "Venta" : "Renta"}</p>
      <p><span class="label">Autorizado por:</span> ${data.coordinatorName}</p>
      <p><span class="label">Fecha/Hora:</span> ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}</p>
      ${data.notes ? `<p><span class="label">Notas:</span> ${data.notes}</p>` : ""}
    </div>
  `;

  return {
    subject: `Contenedor ${data.seriesNumber} salió del almacén`,
    html: emailWrapper("Contenedor Salió del Almacén", content),
  };
}

export function containerReturnedEmail(data: {
  seriesNumber: string;
  internalCode: string;
  clientName: string;
  durationMonths: number;
  revenue: number;
  coordinatorName: string;
  salesPersonName: string;
}) {
  const content = `
    <div class="info-box">
      <p><span class="label">Contenedor:</span> ${data.seriesNumber} (${data.internalCode})</p>
      <p><span class="label">Cliente:</span> ${data.clientName}</p>
      <p><span class="label">Duración de Renta:</span> ${data.durationMonths} meses</p>
      <p><span class="label">Ingresos:</span> $${data.revenue.toLocaleString("es-MX")} MXN</p>
      <p><span class="label">Recibido por:</span> ${data.coordinatorName}</p>
      <p><span class="label">Ingresos confirmados por:</span> ${data.salesPersonName}</p>
    </div>
  `;

  return {
    subject: `Contenedor ${data.seriesNumber} retornado al almacén`,
    html: emailWrapper("Contenedor Retornado", content),
  };
}
