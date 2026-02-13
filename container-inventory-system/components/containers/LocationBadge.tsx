"use client";

import { translations } from "@/lib/translations/es";
import { LOCATION_COLORS } from "@/lib/constants/enums";

interface LocationBadgeProps {
  location: string;
}

export function LocationBadge({ location }: LocationBadgeProps) {
  const colors = LOCATION_COLORS[location] || "bg-gray-100 text-gray-800 border-gray-200";
  const label = translations.containers.locations[location] || location;

  return (
    <span className={`badge ${colors}`}>
      {label}
    </span>
  );
}
