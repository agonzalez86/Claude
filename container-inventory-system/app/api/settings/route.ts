import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/check-permissions";

export async function GET() {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  let config = await prisma.systemConfig.findUnique({
    where: { id: "singleton" },
  });

  if (!config) {
    config = await prisma.systemConfig.create({
      data: { id: "singleton" },
    });
  }

  return NextResponse.json(config);
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  try {
    const body = await req.json();

    const config = await prisma.systemConfig.upsert({
      where: { id: "singleton" },
      update: body,
      create: { id: "singleton", ...body },
    });

    return NextResponse.json(config);
  } catch (err) {
    console.error("Error updating settings:", err);
    return NextResponse.json(
      { error: "Error al actualizar la configuración" },
      { status: 500 }
    );
  }
}
