import { prisma } from "@/lib/db/prisma";
import { Role } from "@prisma/client";

export async function logActivity(
  containerId: string,
  userId: string,
  userName: string,
  userRole: Role,
  actionType: string,
  details: string
) {
  await prisma.activityLog.create({
    data: {
      containerId,
      userId,
      userName,
      userRole,
      actionType,
      details,
    },
  });
}
