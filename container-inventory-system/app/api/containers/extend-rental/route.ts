import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/check-permissions";
import { logActivity } from "@/lib/utils/activity-log";
import { formatDate } from "@/lib/utils/formatters";

export async function POST(req: NextRequest) {
  const { error, user } = await requireRole(["ADMIN", "SALES"]);
  if (error) return error;

  try {
    const body = await req.json();
    const { containerId, newExpectedReturnDate, reason } = body;

    const container = await prisma.container.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      return NextResponse.json(
        { error: "Contenedor no encontrado" },
        { status: 404 }
      );
    }

    if (container.currentStatus !== "ASSIGNED_RENTAL") {
      return NextResponse.json(
        { error: "El contenedor no tiene una renta activa" },
        { status: 400 }
      );
    }

    const updatedContainer = await prisma.container.update({
      where: { id: containerId },
      data: {
        expectedReturnDate: new Date(newExpectedReturnDate),
      },
    });

    const newDateFormatted = formatDate(newExpectedReturnDate);
    await logActivity(
      containerId,
      user!.id,
      user!.name || "",
      user!.role as any,
      "Rental Extended",
      `Fecha de retorno extendida por ${user!.name} - Nueva fecha: ${newDateFormatted}${reason ? ` - Razón: ${reason}` : ""}`
    );

    return NextResponse.json(updatedContainer);
  } catch (err) {
    console.error("Error extending rental:", err);
    return NextResponse.json(
      { error: "Error al extender la renta" },
      { status: 500 }
    );
  }
}
