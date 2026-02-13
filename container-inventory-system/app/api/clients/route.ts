import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/check-permissions";

export async function GET(req: NextRequest) {
  const { error } = await requireRole(["ADMIN", "SALES"]);
  if (error) return error;

  const search = req.nextUrl.searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const clients = await prisma.client.findMany({
    where: where as any,
    include: {
      containers: {
        where: { isArchived: false },
        select: { id: true, currentStatus: true },
      },
      _count: {
        select: {
          rentalRecords: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireRole(["ADMIN", "SALES"]);
  if (error) return error;

  try {
    const body = await req.json();

    const client = await prisma.client.create({
      data: {
        name: body.name,
        company: body.company,
        phone: body.phone,
        email: body.email,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
        createdFromInvoiceUrl: body.createdFromInvoiceUrl || "",
        createdById: user!.id,
      },
    });

    return NextResponse.json(client);
  } catch (err) {
    console.error("Error creating client:", err);
    return NextResponse.json(
      { error: "Error al crear el cliente" },
      { status: 500 }
    );
  }
}
