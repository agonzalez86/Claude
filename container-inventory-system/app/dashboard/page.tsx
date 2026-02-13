"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as { role: string }).role;
      switch (role) {
        case "ADMIN":
          router.replace("/dashboard/admin");
          break;
        case "SALES":
          router.replace("/dashboard/sales/assign");
          break;
        case "WAREHOUSE_COORDINATOR":
          router.replace("/dashboard/warehouse/receive");
          break;
        default:
          router.replace("/dashboard/containers");
      }
    }
  }, [session, status, router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <LoadingSpinner />
    </div>
  );
}
