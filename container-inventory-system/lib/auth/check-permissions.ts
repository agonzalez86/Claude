import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { NextResponse } from "next/server";

type Role = "ADMIN" | "SALES" | "WAREHOUSE_COORDINATOR";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: "No autorizado. Por favor inicie sesión." },
        { status: 401 }
      ),
      user: null,
    };
  }

  const user = session.user as SessionUser;

  if (!allowedRoles.includes(user.role)) {
    return {
      error: NextResponse.json(
        { error: "No tiene permisos para realizar esta acción." },
        { status: 403 }
      ),
      user: null,
    };
  }

  return { error: null, user };
}
