import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/check-permissions";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireRole(["ADMIN", "SALES", "WAREHOUSE_COORDINATOR"]);
  if (error) return error;

  const container = await prisma.container.findUnique({
    where: { id: params.id },
    include: {
      assignedTo: true,
      assignedBy: { select: { id: true, name: true, role: true } },
      createdBy: { select: { id: true, name: true } },
      rentalHistory: {
        include: { client: true },
        orderBy: { startDate: "desc" },
      },
      activityLogs: {
        orderBy: { timestamp: "desc" },
      },
      notes: {
        orderBy: { timestamp: "desc" },
      },
    },
  });

  if (!container) {
    return NextResponse.json(
      { error: "Contenedor no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(container);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireRole(["ADMIN", "SALES", "WAREHOUSE_COORDINATOR"]);
  if (error) return error;

  const body = await req.json();

  const container = await prisma.container.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(container);
}
