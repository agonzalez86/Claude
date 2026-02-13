import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "SALES" | "WAREHOUSE_COORDINATOR";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "SALES" | "WAREHOUSE_COORDINATOR";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "SALES" | "WAREHOUSE_COORDINATOR";
  }
}
