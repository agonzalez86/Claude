"use client";

import { translations } from "@/lib/translations/es";
import { STATUS_COLORS } from "@/lib/constants/enums";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] || "bg-gray-100 text-gray-800 border-gray-200";
  const label = translations.containers.statuses[status] || status;

  return (
    <span className={`badge ${colors}`}>
      {label}
    </span>
  );
}
