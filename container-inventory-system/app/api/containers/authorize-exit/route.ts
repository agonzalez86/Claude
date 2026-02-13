import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/check-permissions";
import { logActivity } from "@/lib/utils/activity-log";
import { sendNotificationEmail } from "@/lib/email/send-email";
import { containerExitEmail } from "@/lib/email/templates";

export async function POST(req: NextRequest) {
  const { error, user } = await requireRole(["ADMIN", "WAREHOUSE_COORDINATOR"]);
  if (error) return error;

  try {
    const body = await req.json();
    const { containerId, notes } = body;

    const container = await prisma.container.findUnique({
      where: { id: containerId },
      include: { assignedTo: true },
    });

    if (!container) {
      return NextResponse.json(
        { error: "Contenedor no encontrado" },
        { status: 404 }
      );
    }

    if (!container.assignedTo) {
      return NextResponse.json(
        { error: "El contenedor no está asignado a ningún cliente" },
        { status: 400 }
      );
    }

    const updatedContainer = await prisma.container.update({
      where: { id: containerId },
      data: { currentLocation: "IN_TRANSIT" },
      include: { assignedTo: true },
    });

    const details = notes
      ? `Salida autorizada por ${user!.name} - Notas: ${notes}`
      : `Salida autorizada por ${user!.name}`;

    await logActivity(
      containerId,
      user!.id,
      user!.name || "",
      user!.role as any,
      "Exit Authorized",
      details
    );

    const emailData = containerExitEmail({
      seriesNumber: container.seriesNumber,
      internalCode: container.internalCode,
      clientName: container.assignedTo.name,
      clientAddress: container.assignedTo.address,
      operationType: container.operationType || "SALE",
      coordinatorName: user!.name || "",
      notes,
    });
    sendNotificationEmail(emailData);

    return NextResponse.json(updatedContainer);
  } catch (err) {
    console.error("Error authorizing exit:", err);
    return NextResponse.json(
      { error: "Error al autorizar la salida" },
      { status: 500 }
    );
  }
}
