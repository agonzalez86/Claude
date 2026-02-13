import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/check-permissions";
import { logActivity } from "@/lib/utils/activity-log";
import { sendNotificationEmail } from "@/lib/email/send-email";
import { containerReturnedEmail } from "@/lib/email/templates";
import { differenceInMonths } from "date-fns";

export async function POST(req: NextRequest) {
  const { error, user } = await requireRole(["ADMIN", "SALES"]);
  if (error) return error;

  try {
    const body = await req.json();
    const { containerId, finalRevenue, notes } = body;

    const container = await prisma.container.findUnique({
      where: { id: containerId },
      include: { assignedTo: true, assignedBy: true },
    });

    if (!container) {
      return NextResponse.json(
        { error: "Contenedor no encontrado" },
        { status: 404 }
      );
    }

    if (container.currentStatus !== "PENDING_REVENUE_CONFIRMATION") {
      return NextResponse.json(
        { error: "El contenedor no está pendiente de confirmación de ingresos" },
        { status: 400 }
      );
    }

    const startDate = container.rentalStartDate || container.assignedDate || new Date();
    const endDate = new Date();
    const durationMonths = Math.max(differenceInMonths(endDate, startDate), 1);

    // Create rental history record
    await prisma.rentalRecord.create({
      data: {
        containerId: container.id,
        clientId: container.assignedToId!,
        clientName: container.assignedTo?.name || "",
        clientCompany: container.assignedTo?.company || "",
        startDate,
        endDate,
        durationMonths,
        monthlyRate: container.monthlyRentalRate || 0,
        finalRevenue,
        assignedById: container.assignedById || user!.id,
        assignedByName: container.assignedBy?.name || "",
        confirmedById: user!.id,
        confirmedByName: user!.name || "",
        confirmationDate: new Date(),
        notes,
      },
    });

    // Reset container to Free
    const updatedContainer = await prisma.container.update({
      where: { id: containerId },
      data: {
        currentStatus: "FREE",
        assignedToId: null,
        assignedById: null,
        assignedDate: null,
        operationType: null,
        monthlyRentalRate: null,
        rentalStartDate: null,
        expectedReturnDate: null,
        salesInvoicePdfUrl: null,
      },
    });

    await logActivity(
      containerId,
      user!.id,
      user!.name || "",
      user!.role as any,
      "Revenue Confirmed",
      `Ingresos confirmados en $${finalRevenue.toLocaleString("es-MX")} por ${user!.name}${notes ? ` - Notas: ${notes}` : ""}`
    );

    // Send email
    const emailData = containerReturnedEmail({
      seriesNumber: container.seriesNumber,
      internalCode: container.internalCode,
      clientName: container.assignedTo?.name || "",
      durationMonths,
      revenue: finalRevenue,
      coordinatorName: "Almacén",
      salesPersonName: user!.name || "",
    });
    sendNotificationEmail(emailData);

    return NextResponse.json(updatedContainer);
  } catch (err) {
    console.error("Error confirming revenue:", err);
    return NextResponse.json(
      { error: "Error al confirmar los ingresos" },
      { status: 500 }
    );
  }
}
