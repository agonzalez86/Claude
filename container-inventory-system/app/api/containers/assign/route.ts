import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/check-permissions";
import { logActivity } from "@/lib/utils/activity-log";
import { sendNotificationEmail } from "@/lib/email/send-email";
import { containerAssignedEmail } from "@/lib/email/templates";
import { translations } from "@/lib/translations/es";

export async function POST(req: NextRequest) {
  const { error, user } = await requireRole(["ADMIN", "SALES"]);
  if (error) return error;

  try {
    const body = await req.json();
    const {
      containerId,
      clientId,
      newClient,
      operationType,
      monthlyRentalRate,
      rentalStartDate,
      expectedReturnDate,
      salesInvoicePdfUrl,
    } = body;

    // Check container exists and is free
    const container = await prisma.container.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      return NextResponse.json(
        { error: translations.containers.messages.notFound },
        { status: 404 }
      );
    }

    if (container.currentStatus !== "FREE") {
      return NextResponse.json(
        { error: "Este contenedor ya está asignado" },
        { status: 400 }
      );
    }

    // Get or create client
    let resolvedClientId = clientId;

    if (!clientId && newClient) {
      const client = await prisma.client.create({
        data: {
          name: newClient.name,
          company: newClient.company,
          phone: newClient.phone,
          email: newClient.email,
          address: newClient.address,
          latitude: newClient.latitude,
          longitude: newClient.longitude,
          createdFromInvoiceUrl: salesInvoicePdfUrl,
          createdById: user!.id,
        },
      });
      resolvedClientId = client.id;
    }

    const status = operationType === "SALE" ? "ASSIGNED_SALE" : "ASSIGNED_RENTAL";

    const updateData: Record<string, unknown> = {
      currentStatus: status,
      assignedToId: resolvedClientId,
      assignedById: user!.id,
      assignedDate: new Date(),
      operationType,
      salesInvoicePdfUrl,
    };

    if (operationType === "RENTAL") {
      updateData.monthlyRentalRate = monthlyRentalRate;
      updateData.rentalStartDate = new Date(rentalStartDate);
      updateData.expectedReturnDate = new Date(expectedReturnDate);
    }

    const updatedContainer = await prisma.container.update({
      where: { id: containerId },
      data: updateData as any,
      include: { assignedTo: true },
    });

    const typeLabel = operationType === "SALE" ? "Venta" : "Renta";
    await logActivity(
      containerId,
      user!.id,
      user!.name || "",
      user!.role as any,
      "Assigned",
      `Asignado a ${updatedContainer.assignedTo?.name} por ${user!.name} - Tipo: ${typeLabel}`
    );

    // Send email notification
    const locationLabel = translations.containers.locations[container.currentLocation] || container.currentLocation;
    const emailData = containerAssignedEmail({
      seriesNumber: container.seriesNumber,
      internalCode: container.internalCode,
      clientName: updatedContainer.assignedTo?.name || "",
      clientCompany: updatedContainer.assignedTo?.company || "",
      operationType: operationType,
      location: locationLabel,
      salesPersonName: user!.name || "",
      monthlyRate: monthlyRentalRate,
      expectedReturnDate,
    });
    sendNotificationEmail(emailData);

    return NextResponse.json(updatedContainer);
  } catch (err) {
    console.error("Error assigning container:", err);
    return NextResponse.json(
      { error: "Error al asignar el contenedor" },
      { status: 500 }
    );
  }
}
