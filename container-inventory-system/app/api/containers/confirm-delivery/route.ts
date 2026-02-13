import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/check-permissions";
import { logActivity } from "@/lib/utils/activity-log";

export async function POST(req: NextRequest) {
  const { error, user } = await requireRole(["ADMIN", "WAREHOUSE_COORDINATOR"]);
  if (error) return error;

  try {
    const body = await req.json();
    const { containerId, notes } = body;

    const container = await prisma.container.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      return NextResponse.json(
        { error: "Contenedor no encontrado" },
        { status: 404 }
      );
    }

    if (container.currentLocation !== "IN_TRANSIT") {
      return NextResponse.json(
        { error: "El contenedor no está en tránsito" },
        { status: 400 }
      );
    }

    const updatedContainer = await prisma.container.update({
      where: { id: containerId },
      data: { currentLocation: "CLIENT_LOCATION" },
    });

    const details = notes
      ? `Entrega confirmada por ${user!.name} - Notas: ${notes}`
      : `Entrega confirmada por ${user!.name}`;

    await logActivity(
      containerId,
      user!.id,
      user!.name || "",
      user!.role as any,
      "Delivery Confirmed",
      details
    );

    return NextResponse.json(updatedContainer);
  } catch (err) {
    console.error("Error confirming delivery:", err);
    return NextResponse.json(
      { error: "Error al confirmar la entrega" },
      { status: 500 }
    );
  }
}
