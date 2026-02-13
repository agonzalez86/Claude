import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/check-permissions";
import { logActivity } from "@/lib/utils/activity-log";
import { sendNotificationEmail } from "@/lib/email/send-email";
import { containerReceivedEmail } from "@/lib/email/templates";

export async function POST(req: NextRequest) {
  const { error, user } = await requireRole(["ADMIN", "WAREHOUSE_COORDINATOR"]);
  if (error) return error;

  try {
    const body = await req.json();
    const { containerId, notes, photoUrls } = body;

    const container = await prisma.container.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      return NextResponse.json(
        { error: "Contenedor no encontrado en el sistema" },
        { status: 404 }
      );
    }

    if (container.currentLocation === "MY_WAREHOUSE" && container.currentStatus === "FREE") {
      return NextResponse.json(
        { error: "Este contenedor ya se encuentra en el almacén" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      currentLocation: "MY_WAREHOUSE",
    };

    if (photoUrls && photoUrls.length > 0) {
      updateData.photoUrls = [...container.photoUrls, ...photoUrls];
    }

    const updatedContainer = await prisma.container.update({
      where: { id: containerId },
      data: updateData as any,
    });

    const details = notes
      ? `Recibido en almacén por ${user!.name} - Notas: ${notes}`
      : `Recibido en almacén por ${user!.name}`;

    await logActivity(
      containerId,
      user!.id,
      user!.name || "",
      user!.role as any,
      "Received",
      details
    );

    const emailData = containerReceivedEmail({
      seriesNumber: container.seriesNumber,
      internalCode: container.internalCode,
      coordinatorName: user!.name || "",
      notes,
    });
    sendNotificationEmail(emailData);

    return NextResponse.json(updatedContainer);
  } catch (err) {
    console.error("Error receiving container:", err);
    return NextResponse.json(
      { error: "Error al recibir el contenedor" },
      { status: 500 }
    );
  }
}
