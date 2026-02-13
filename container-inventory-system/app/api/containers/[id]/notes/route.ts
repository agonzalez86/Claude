import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/check-permissions";
import { logActivity } from "@/lib/utils/activity-log";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireRole(["ADMIN", "SALES", "WAREHOUSE_COORDINATOR"]);
  if (error) return error;

  try {
    const body = await req.json();

    const note = await prisma.note.create({
      data: {
        containerId: params.id,
        userId: user!.id,
        userName: user!.name || "",
        content: body.content,
      },
    });

    await logActivity(
      params.id,
      user!.id,
      user!.name || "",
      user!.role as any,
      "Note Added",
      `Nota agregada por ${user!.name}: ${body.content.substring(0, 100)}`
    );

    return NextResponse.json(note);
  } catch (err) {
    console.error("Error adding note:", err);
    return NextResponse.json(
      { error: "Error al agregar la nota" },
      { status: 500 }
    );
  }
}
