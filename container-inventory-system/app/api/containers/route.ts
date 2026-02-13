import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/check-permissions";

export async function GET(req: NextRequest) {
  const { error, user } = await requireRole(["ADMIN", "SALES", "WAREHOUSE_COORDINATOR"]);
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const location = searchParams.get("location");
  const search = searchParams.get("search");
  const assignedBy = searchParams.get("assignedBy");
  const archived = searchParams.get("archived") === "true";

  const where: Record<string, unknown> = {
    isArchived: archived,
  };

  if (status && status !== "all") {
    where.currentStatus = status;
  }
  if (location && location !== "all") {
    where.currentLocation = location;
  }
  if (assignedBy) {
    where.assignedById = assignedBy;
  }
  if (search) {
    where.OR = [
      { seriesNumber: { contains: search, mode: "insensitive" } },
      { internalCode: { contains: search, mode: "insensitive" } },
      { assignedTo: { name: { contains: search, mode: "insensitive" } } },
      { pedimentoNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  const containers = await prisma.container.findMany({
    where: where as any,
    include: {
      assignedTo: true,
      assignedBy: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(containers);
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireRole(["ADMIN"]);
  if (error) return error;

  const body = await req.json();

  const containers = [];
  for (const containerData of body.containers) {
    const container = await prisma.container.create({
      data: {
        seriesNumber: containerData.seriesNumber,
        internalCode: containerData.internalCode,
        pedimentoNumber: containerData.pedimentoNumber,
        purchaseDate: new Date(containerData.purchaseDate),
        costWithoutIVA: containerData.costWithoutIVA,
        currentLocation: "SUPPLIER",
        currentStatus: "FREE",
        facturaPdfUrl: containerData.facturaPdfUrl,
        pedimentoPdfUrl: containerData.pedimentoPdfUrl,
        createdById: user!.id,
      },
    });

    await prisma.activityLog.create({
      data: {
        containerId: container.id,
        userId: user!.id,
        userName: user!.name || "",
        userRole: "ADMIN",
        actionType: "Created",
        details: `Contenedor registrado de Factura. Costo: $${containerData.costWithoutIVA}`,
      },
    });

    containers.push(container);
  }

  return NextResponse.json({ containers, count: containers.length });
}
