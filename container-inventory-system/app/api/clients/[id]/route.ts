import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/check-permissions";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireRole(["ADMIN", "SALES"]);
  if (error) return error;

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      containers: {
        where: { isArchived: false },
        include: {
          assignedBy: { select: { name: true } },
        },
      },
      rentalRecords: {
        orderBy: { startDate: "desc" },
      },
      createdBy: { select: { name: true } },
    },
  });

  if (!client) {
    return NextResponse.json(
      { error: "Cliente no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(client);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireRole(["ADMIN", "SALES"]);
  if (error) return error;

  const body = await req.json();

  const client = await prisma.client.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(client);
}
