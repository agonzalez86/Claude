import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/check-permissions";
import { sendNotificationEmail } from "@/lib/email/send-email";

export async function POST(req: NextRequest) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  try {
    const body = await req.json();
    await sendNotificationEmail({
      subject: body.subject,
      html: body.html,
      to: body.to,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error sending email:", err);
    return NextResponse.json(
      { error: "Error al enviar el email" },
      { status: 500 }
    );
  }
}
