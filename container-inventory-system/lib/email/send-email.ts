import { prisma } from "@/lib/db/prisma";

interface EmailOptions {
  subject: string;
  html: string;
  to?: string[];
}

export async function sendNotificationEmail(options: EmailOptions) {
  try {
    let recipients = options.to;

    if (!recipients) {
      const config = await prisma.systemConfig.findUnique({
        where: { id: "singleton" },
      });
      recipients = config?.emailRecipients || [];
    }

    if (recipients.length === 0) {
      console.log("No email recipients configured, skipping email");
      return;
    }

    // Use SendGrid if configured
    if (process.env.SENDGRID_API_KEY) {
      const sgMail = await import("@sendgrid/mail");
      sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);

      await sgMail.default.send({
        to: recipients,
        from: {
          email: process.env.EMAIL_FROM || "noreply@latambox.com",
          name:
            process.env.EMAIL_FROM_NAME ||
            "LATAM BOX Sistema de Inventario",
        },
        subject: options.subject,
        html: options.html,
      });

      console.log(`Email sent: ${options.subject} to ${recipients.join(", ")}`);
    } else {
      // Log email in development
      console.log("=== EMAIL (dev mode) ===");
      console.log(`To: ${recipients.join(", ")}`);
      console.log(`Subject: ${options.subject}`);
      console.log("========================");
    }
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw - email failures shouldn't break main workflows
  }
}
