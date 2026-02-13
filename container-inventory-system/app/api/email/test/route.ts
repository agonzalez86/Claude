import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/check-permissions";
import { sendNotificationEmail } from "@/lib/email/send-email";

export async function POST() {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  try {
    await sendNotificationEmail({
      subject: "Email de Prueba - LATAM BOX",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email de Prueba</h2>
          <p>Este es un email de prueba del Sistema de Gestión de Inventario de Contenedores.</p>
          <p>Si recibe este correo, las notificaciones están configuradas correctamente.</p>
          <p style="color: #666; font-size: 12px;">LATAM BOX - Sistema de Inventario</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "Email de prueba enviado" });
  } catch (err) {
    console.error("Error sending test email:", err);
    return NextResponse.json(
      { error: "Error al enviar el email de prueba" },
      { status: 500 }
    );
  }
}
